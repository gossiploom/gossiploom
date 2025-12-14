import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  referralCode?: string;
  ipAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: Partial<CreateAccountPayload> = await req.json();

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      referralCode,
      ipAddress,
    } = payload;

    /* =========================
       EARLY VALIDATION (NEW)
    ========================== */

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof phoneNumber !== "string" ||
      typeof password !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password.trim()
    ) {
      return new Response(
        JSON.stringify({ error: "All required fields must be provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeFirstName = firstName.trim();
    const safeLastName = lastName.trim();
    const fullName = `${safeFirstName} ${safeLastName}`;

    console.log("Creating new account:", {
      fullName,
      email,
      phoneNumber,
      referralCode,
      ipAddress,
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    /* =========================
       DUPLICATE CHECKS
    ========================== */

    if (ipAddress) {
      const { data: existingIpProfile } = await supabase
        .from("profiles")
        .select("unique_identifier")
        .eq("registration_ip", ipAddress)
        .single();

      if (existingIpProfile) {
        return new Response(
          JSON.stringify({
            error: `Only one account per IP address is allowed (User #${existingIpProfile.unique_identifier}).`,
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingEmail = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: "This email address is already registered." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: existingPhone } = await supabase
      .from("profiles")
      .select("unique_identifier")
      .eq("phone_number", phoneNumber.trim())
      .single();

    if (existingPhone) {
      return new Response(
        JSON.stringify({
          error: `This phone number is already registered (User #${existingPhone.unique_identifier}).`,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: existingName } = await supabase
      .from("profiles")
      .select("unique_identifier")
      .ilike("name", fullName)
      .single();

    if (existingName) {
      return new Response(
        JSON.stringify({
          error: `An account with this name already exists (User #${existingName.unique_identifier}).`,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    /* =========================
       USER CREATION
    ========================== */

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          first_name: safeFirstName,
          last_name: safeLastName,
          phone_number: phoneNumber.trim(),
          referral_code: referralCode?.trim() || null,
        },
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;

    /* =========================
       PROFILE + DEFAULT RECORDS
    ========================== */

    const { data: nextId } = await supabase.rpc("get_next_unique_identifier");

    await supabase.from("profiles").upsert(
      {
        user_id: userId,
        unique_identifier: nextId || "0001",
        name: fullName,
        phone_number: phoneNumber.trim(),
        registration_ip: ipAddress,
        profile_completed: true,
      },
      { onConflict: "user_id" }
    );

    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "user" },
      { onConflict: "user_id,role" }
    );

    await supabase.from("user_presence").upsert(
      {
        user_id: userId,
        is_online: false,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    await supabase.from("user_settings").upsert(
      { user_id: userId, analysis_limit: 0 },
      { onConflict: "user_id" }
    );

    /* =========================
       EMAILS
    ========================== */

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TradeAdvisor <noreply@tradeadvisor.live>",
        to: [email.toLowerCase()],
        subject: `Welcome ${fullName} to TradeAdvisor.live`,
        html: `<p>Dear <strong>${fullName}</strong>, your account has been created successfully.</p>`,
      }),
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TradeAdvisor <noreply@tradeadvisor.live>",
        to: ["sammygits@gmail.com"],
        subject: `TradeAdvisor - New Account ${fullName} Created`,
        html: `<p>New user registered: <strong>${fullName}</strong></p>`,
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Create-user error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
