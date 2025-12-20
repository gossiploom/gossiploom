import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  lastName: string;
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, lastName, phoneNumber }: PasswordResetRequest = await req.json();

    console.log("Password reset request received for email:", email);

    if (!email || !lastName || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Email, last name, and phone number are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find the user by email in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw new Error("Failed to verify user");
    }

    const authUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!authUser) {
      console.log("No user found with email:", email);
      // Return generic success to prevent email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If your account exists and details match, you will receive a password reset link." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user's last name and phone number from profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("name, phone_number")
      .eq("user_id", authUser.id)
      .single();

    if (profileError || !profile) {
      console.log("No profile found for user:", authUser.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If your account exists and details match, you will receive a password reset link." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract last name from profile name and compare
    const profileNameParts = profile.name.trim().split(/\s+/);
    const profileLastName = profileNameParts[profileNameParts.length - 1]?.toLowerCase() || "";
    const providedLastName = lastName.trim().toLowerCase();

    // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)]/g, "");
    const profilePhone = normalizePhone(profile.phone_number || "");
    const providedPhone = normalizePhone(phoneNumber);

    console.log("Comparing - Profile last name:", profileLastName, "Provided:", providedLastName);
    console.log("Comparing - Profile phone:", profilePhone, "Provided:", providedPhone);

    if (profileLastName !== providedLastName || !profilePhone.includes(providedPhone.slice(-9))) {
      console.log("Verification failed - details do not match");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If your account exists and details match, you will receive a password reset link." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com')}/auth`,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      throw new Error("Failed to generate password reset link");
    }

    const resetLink = resetData.properties?.action_link;

    if (!resetLink) {
      throw new Error("No reset link generated");
    }

    console.log("Sending password reset email to:", email);

    // Send the password reset email
    const emailResponse = await resend.emails.send({
      from: "TradeAdvisor Support <support@tradeadvisor.live>",
      to: [email],
      subject: "Reset Your TradeAdvisor Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #22c55e; margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password for your TradeAdvisor account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #888; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
              ${resetLink}
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Security Notice:</strong> This link will expire in 24 hours. If you didn't request this password reset, please ignore this email or contact support.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              Need help? Contact us at <a href="mailto:support@tradeadvisor.live" style="color: #22c55e;">support@tradeadvisor.live</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TradeAdvisor. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset link has been sent to your email address." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
