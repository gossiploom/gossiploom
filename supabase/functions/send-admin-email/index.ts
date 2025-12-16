import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  subject: string;
  body: string;
  targetType: "all" | "single";
  singleEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, body, targetType, singleEmail }: SendEmailRequest = await req.json();

    console.log("Processing admin email request:", { subject, targetType, singleEmail });

    // Validate inputs
    if (!subject || !body) {
      throw new Error("Subject and body are required");
    }

    if (targetType === "single" && !singleEmail) {
      throw new Error("Email address is required for single recipient");
    }

    // Convert body to HTML - preserve formatting
    const htmlBody = body
      .replace(/\n/g, "<br />")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>");

    if (targetType === "single") {
      // Send to single email
      console.log("Sending email to single recipient:", singleEmail);
      
      const emailResponse = await resend.emails.send({
        from: "Trade Advisor <noreply@tradeadvisor.live>",
        to: [singleEmail!],
        bcc: ["tradeadvisor.live@gmail.com"],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${htmlBody}
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              This email was sent by Trade Advisor.<br />
              If you have any questions, please contact our support team.
            </p>
          </div>
        `,
      });

      console.log("Single email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully", count: 1 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      // Send to all users - fetch all user emails from auth
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get all users from auth
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching users:", authError);
        throw new Error("Failed to fetch user list");
      }

      const userEmails = authData.users.map(user => user.email).filter(Boolean) as string[];
      
      if (userEmails.length === 0) {
        throw new Error("No users found to send emails to");
      }

      console.log(`Sending email to ${userEmails.length} users via BCC`);

      // Send single email with all recipients in BCC to hide addresses from each other
      // Use a placeholder "to" address (admin email) and put all users in BCC
      const emailResponse = await resend.emails.send({
        from: "Trade Advisor <noreply@tradeadvisor.live>",
        to: ["tradeadvisor.live@gmail.com"], // Admin gets the direct copy
        bcc: userEmails, // All users in BCC - they won't see each other's emails
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${htmlBody}
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              This email was sent by Trade Advisor.<br />
              If you have any questions, please contact our support team.
            </p>
          </div>
        `,
      });

      console.log("Bulk email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: `Email sent to ${userEmails.length} users`, count: userEmails.length }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: any) {
    console.error("Error in send-admin-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
