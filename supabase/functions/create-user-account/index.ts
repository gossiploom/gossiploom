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

    // === Initialize all user tables immediately ===
    
    // 1. Create user_roles entry (all new users get 'user' role)
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: 'user',
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error("Error creating user role:", roleError);
    } else {
      console.log("User role created successfully for user:", userId);
    }

    // 2. Update the profile with user details (profile may be auto-created by trigger, upsert to be safe)
    const { data: nextId } = await supabase.rpc('get_next_unique_identifier');
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        unique_identifier: nextId || '0001',
        name: fullName,
        phone_number: phoneNumber.trim(),
        registration_ip: ipAddress,
        profile_completed: true,
        referred_by: referrerId,
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error("Error creating/updating profile:", profileError);
    } else {
      console.log("Profile created/updated successfully for user:", userId);
    }

    // 3. Create user_presence entry
    const { error: presenceError } = await supabase
      .from("user_presence")
      .upsert({
        user_id: userId,
        is_online: false,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (presenceError) {
      console.error("Error creating user presence:", presenceError);
    } else {
      console.log("User presence created successfully for user:", userId);
    }

    // 4. Create user_settings with 0 analysis slots
    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        analysis_limit: 0,
      }, { onConflict: 'user_id' });

    if (settingsError) {
      console.error("Error creating user settings:", settingsError);
    } else {
      console.log("User settings created successfully for user:", userId);
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

    // Get the unique identifier for the new user
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("unique_identifier")
      .eq("user_id", userId)
      .single();

    // Send welcome email to user with BCC to admin
    const welcomeEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <p>Dear <strong>${fullName}</strong>,</p>
        
        <p>Your account has been created successfully, and you can log in using the details below:</p>
        
        <p><strong>Email (Username):</strong> ${email}<br/>
        <strong>Password:</strong> ${password}</p>
        
        <p>Inside the platform, you will find tools designed to support informed trading decisions and real-time market insights. For better performance, <strong>always use pending trade orders</strong> and <strong>apply your point of invalidation as the stop loss</strong>. This approach protects capital and supports consistent results.</p>
        
        <p>As you begin trading, we recommend focusing on the following pairs and instruments: <strong>US100, US30, EURGBP</strong>, and you can also include <strong>XAUUSD, GBPUSD, EURUSD, USDJPY, and BTCUSD</strong> for broader market exposure.</p>
        
        <p>For better outcomes, upload and analyze <strong>5 charts</strong> using the following timeframes: <strong>5M, 15M, 1H, 4H, and 12H</strong>.</p>
        
        <p>To begin enjoying full access to our services, please select a package and make your initial payment from the options below:</p>
        
        <h3 style="color: #1a1a1a; margin-top: 20px;">Select Your Package</h3>
        <ul style="line-height: 1.8;">
          <li><strong>Starter</strong> – 40 analysis slots at <strong>$40 USD</strong></li>
          <li><strong>Growth</strong> – 100 analysis slots at <strong>$90 USD</strong></li>
          <li><strong>Professional</strong> – 250 analysis slots at <strong>$200 USD</strong></li>
          <li><strong>Enterprise</strong> – 500 analysis slots at <strong>$350 USD</strong></li>
        </ul>
        
        <p>Alternatively, you may choose to subscribe to our <strong>monthly signals</strong>, which are generated and updated daily on the platform, at <strong>$45 USD per month</strong>.</p>
        
        <p>If you have any questions, we are here to assist you.</p>
        
        <p>Wishing you a successful trading journey.</p>
        
        <p><strong>Trade Advisor Team</strong></p>
      </div>
    `;

    const welcomeEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TradeAdvisor <noreply@tradeadvisor.live>",
        to: [email.trim().toLowerCase()],
        bcc: ["tradeadvisor.live@gmail.com"],
        subject: `Welcome ${fullName} to TradeAdvisor.live`,
        html: welcomeEmailHtml,
      }),
    });

    const welcomeEmailData = await welcomeEmailResponse.json();
    console.log("Welcome email sent to user:", welcomeEmailData);

    // Send email notification to admin
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
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

    const adminEmailData = await adminEmailResponse.json();
    console.log("Admin notification email sent:", adminEmailData);

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
