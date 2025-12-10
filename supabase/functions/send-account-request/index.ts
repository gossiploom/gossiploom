import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccountRequestPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  ipAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, phoneNumber, ipAddress }: AccountRequestPayload = await req.json();

    console.log("Received account request:", { fullName, email, phoneNumber, ipAddress });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate IP address
    if (ipAddress) {
      const { data: existingIpRequest } = await supabase
        .from("account_requests")
        .select("id, full_name")
        .eq("request_ip", ipAddress)
        .eq("status", "approved")
        .single();

      if (existingIpRequest) {
        // Save as rejected with reason
        await supabase.from("account_requests").insert({
          full_name: fullName,
          email: email,
          phone_number: phoneNumber,
          request_ip: ipAddress,
          status: "rejected",
          rejection_reason: `Same IP address as user ${existingIpRequest.full_name}`,
        });

        return new Response(
          JSON.stringify({ 
            error: "Only one account per IP address is allowed. Your request has been rejected." 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from("account_requests")
      .select("id, full_name")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "approved")
      .single();

    if (existingEmail) {
      await supabase.from("account_requests").insert({
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
        request_ip: ipAddress,
        status: "rejected",
        rejection_reason: `Same email address as user ${existingEmail.full_name}`,
      });

      return new Response(
        JSON.stringify({ error: "This email address is already registered." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for duplicate phone number
    const { data: existingPhone } = await supabase
      .from("account_requests")
      .select("id, full_name")
      .eq("phone_number", phoneNumber.trim())
      .eq("status", "approved")
      .single();

    if (existingPhone) {
      await supabase.from("account_requests").insert({
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
        request_ip: ipAddress,
        status: "rejected",
        rejection_reason: `Same phone number as user ${existingPhone.full_name}`,
      });

      return new Response(
        JSON.stringify({ error: "This phone number is already registered." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for duplicate name (first + last)
    const { data: existingName } = await supabase
      .from("account_requests")
      .select("id, full_name")
      .ilike("full_name", fullName.trim())
      .eq("status", "approved")
      .single();

    if (existingName) {
      await supabase.from("account_requests").insert({
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
        request_ip: ipAddress,
        status: "rejected",
        rejection_reason: `Same name as existing user ${existingName.full_name}`,
      });

      return new Response(
        JSON.stringify({ error: "An account with this name already exists." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Save valid request to account_requests table
    const { error: dbError } = await supabase
      .from("account_requests")
      .insert({
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
        request_ip: ipAddress,
        status: "pending",
      });

    if (dbError) {
      console.error("Error saving account request:", dbError);
      throw dbError;
    }

    // Send email notification
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TradeAdvisor <onboarding@resend.dev>",
        to: ["sammygits@gmail.com"],
        subject: "New Account Request - TradeAdvisor",
        html: `
          <h1>New Account Request</h1>
          <p>A new user has requested an account on TradeAdvisor.</p>
          <h2>User Details:</h2>
          <ul>
            <li><strong>Full Name:</strong> ${fullName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone Number:</strong> ${phoneNumber}</li>
            <li><strong>IP Address:</strong> ${ipAddress || "Not available"}</li>
          </ul>
          <p>Please log in to the admin dashboard to process this request.</p>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-account-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);