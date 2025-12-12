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
    const { firstName, lastName, email, phoneNumber, password, referralCode, ipAddress }: CreateAccountPayload = await req.json();

    console.log("Creating new account:", { firstName, lastName, email, phoneNumber, referralCode, ipAddress });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Check for duplicate IP address in profiles
    if (ipAddress) {
      const { data: existingIpProfile } = await supabase
        .from("profiles")
        .select("unique_identifier, name")
        .eq("registration_ip", ipAddress)
        .single();

      if (existingIpProfile) {
        return new Response(
          JSON.stringify({ 
            error: `Only one account per IP address is allowed. An account already exists (User #${existingIpProfile.unique_identifier}).` 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Check for duplicate email in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingEmail = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
    
    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: "This email address is already registered." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for duplicate phone number in profiles
    const { data: existingPhone } = await supabase
      .from("profiles")
      .select("unique_identifier, name")
      .eq("phone_number", phoneNumber.trim())
      .single();

    if (existingPhone) {
      return new Response(
        JSON.stringify({ error: `This phone number is already registered (User #${existingPhone.unique_identifier}).` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for duplicate name in profiles
    const { data: existingName } = await supabase
      .from("profiles")
      .select("unique_identifier, name")
      .ilike("name", fullName)
      .single();

    if (existingName) {
      return new Response(
        JSON.stringify({ error: `An account with this name already exists (User #${existingName.unique_identifier}).` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        referral_code: referralCode?.trim() || null,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;

    // Check if referral code is valid and get referrer
    let referrerId: string | null = null;
    if (referralCode) {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralCode.trim().toUpperCase())
        .single();

      if (referrerProfile) {
        referrerId = referrerProfile.user_id;
      }
    }

    // Update the profile with user details (profile is auto-created by trigger)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: fullName,
        phone_number: phoneNumber.trim(),
        registration_ip: ipAddress,
        profile_completed: true,
        referred_by: referrerId,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Create referral tracking record if user was referred
    if (referrerId) {
      const { error: referralError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrerId,
          referred_id: userId,
          has_purchased: false,
        });

      if (referralError) {
        console.error("Error creating referral record:", referralError);
      }
    }

    // Ensure user_settings has 0 analysis slots
    const { error: settingsError } = await supabase
      .from("user_settings")
      .update({ analysis_limit: 0 })
      .eq("user_id", userId);

    if (settingsError) {
      console.error("Error updating user settings:", settingsError);
    }

    // Get the unique identifier for the new user
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("unique_identifier")
      .eq("user_id", userId)
      .single();

    // Send email notification to admin
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TradeAdvisor <onboarding@resend.dev>",
        to: ["sammygits@gmail.com"],
        subject: "New Account Created - TradeAdvisor",
        html: `
          <h1>New Account Created</h1>
          <p>A new user has successfully created an account on TradeAdvisor.</p>
          <h2>User Details:</h2>
          <ul>
            <li><strong>User ID:</strong> #${newProfile?.unique_identifier || 'N/A'}</li>
            <li><strong>First Name:</strong> ${firstName}</li>
            <li><strong>Last Name:</strong> ${lastName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone Number:</strong> ${phoneNumber}</li>
            <li><strong>Referral Code:</strong> ${referralCode || "None"}</li>
            <li><strong>IP Address:</strong> ${ipAddress || "Not available"}</li>
            <li><strong>Analysis Slots:</strong> 0 (new account)</li>
          </ul>
          <p>The user can now log in and purchase analysis slots.</p>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Admin notification email sent:", emailData);

    return new Response(JSON.stringify({ 
      success: true,
      userId: userId,
      uniqueIdentifier: newProfile?.unique_identifier,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in create-user-account function:", error);
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
