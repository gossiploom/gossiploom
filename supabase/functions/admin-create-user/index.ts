import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  brokerName?: string;
  initialSlots?: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create client with user's auth to check if they're admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: CreateUserPayload = await req.json();
    const { email, password, fullName, phoneNumber, brokerName, initialSlots = 0 } = payload;

    console.log("Admin creating user:", email);

    // Use service role client to create user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = authData.user.id;

    // Update profile with additional info
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        name: fullName,
        phone_number: phoneNumber,
        broker_name: brokerName || null,
        profile_completed: true,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Set initial analysis slots
    const { error: settingsError } = await adminClient
      .from("user_settings")
      .update({ analysis_limit: initialSlots })
      .eq("user_id", userId);

    if (settingsError) {
      console.error("Error updating settings:", settingsError);
    }

    console.log("User created successfully:", userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: `User ${email} created successfully` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-create-user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
