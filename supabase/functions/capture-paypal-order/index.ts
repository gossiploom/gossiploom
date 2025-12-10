import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_API_URL = "https://api-m.sandbox.paypal.com"; // Use sandbox for testing

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user with Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId } = await req.json();
    
    console.log("Capturing PayPal order:", { orderId, userId: user.id });

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      console.error("PayPal capture error:", error);
      throw new Error("Failed to capture PayPal order");
    }

    const captureData = await captureResponse.json();
    console.log("PayPal order captured:", captureData);

    if (captureData.status !== "COMPLETED") {
      throw new Error(`Payment not completed. Status: ${captureData.status}`);
    }

    // Get the custom_id with user data
    const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id 
      || captureData.purchase_units?.[0]?.custom_id;
    
    let analysisSlots = 0;
    if (customId) {
      try {
        const customData = JSON.parse(customId);
        analysisSlots = customData.analysisSlots;
      } catch (e) {
        console.error("Error parsing custom_id:", e);
      }
    }

    // Update database with admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the pending payment to retrieve analysis_slots
    const { data: pendingPayment, error: pendingError } = await supabaseAdmin
      .from("pending_payments")
      .select("analysis_slots")
      .eq("transaction_id", orderId)
      .single();

    if (pendingError) {
      console.error("Error fetching pending payment:", pendingError);
    }

    const slotsToAdd = pendingPayment?.analysis_slots || analysisSlots;

    // Update user settings - add analysis slots
    const { data: currentSettings, error: settingsError } = await supabaseAdmin
      .from("user_settings")
      .select("analysis_limit")
      .eq("user_id", user.id)
      .single();

    if (settingsError) {
      console.error("Error fetching user settings:", settingsError);
    }

    const currentLimit = currentSettings?.analysis_limit || 0;
    const newLimit = currentLimit + slotsToAdd;

    const { error: updateError } = await supabaseAdmin
      .from("user_settings")
      .upsert({
        user_id: user.id,
        analysis_limit: newLimit,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (updateError) {
      console.error("Error updating user settings:", updateError);
      throw new Error("Failed to update analysis slots");
    }

    // Update pending payment status
    await supabaseAdmin
      .from("pending_payments")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("transaction_id", orderId);

    console.log(`Successfully added ${slotsToAdd} slots to user ${user.id}. New total: ${newLimit}`);

    return new Response(JSON.stringify({ 
      success: true, 
      slotsAdded: slotsToAdd,
      newTotal: newLimit,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error capturing PayPal order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
