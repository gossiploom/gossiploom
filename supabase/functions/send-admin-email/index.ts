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
  targetType: "all" | "single" | "multiple";
  singleEmail?: string;
  multipleUserIds?: string[];
  isWelcomeMessage?: boolean;
}

// Simple delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, body, targetType, singleEmail, multipleUserIds, isWelcomeMessage }: SendEmailRequest = await req.json();

    const multipleUserIdsCount = multipleUserIds ? multipleUserIds.length : 0;
    console.log("Processing admin email request:", { subject, targetType, singleEmail, multipleUserIdsCount, isWelcomeMessage });

    // Validate inputs
    if (!subject || !body) {
      throw new Error("Subject and body are required");
    }

    if (targetType === "single" && !singleEmail) {
      throw new Error("Email address is required for single recipient");
    }

    if (targetType === "multiple" && (!multipleUserIds || multipleUserIds.length === 0)) {
      throw new Error("At least one user is required for multiple recipients");
    }

    // Convert body to HTML - preserve formatting
    const htmlBody = body
      .replace(/\n/g, "<br />")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>");

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${htmlBody}
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          This email was sent by Trade Advisor.<br />
          If you have any questions, please contact our support team on support@tradeadvisor.live
        </p>
      </div>
    `;

    if (targetType === "single") {
      // Send to single email
      console.log("Sending email to single recipient:", singleEmail);
      
      const emailResponse = await resend.emails.send({
        from: "Trade Advisor <support@tradeadvisor.live>",
        to: [singleEmail!],
        bcc: ["support@tradeadvisor.live"],
        subject: subject,
        html: emailTemplate,
      });

      console.log("Single email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully", count: 1 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else if (targetType === "multiple") {
      // Send to multiple selected users - need to fetch their emails first
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get emails for selected user IDs
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching users:", authError);
        throw new Error("Failed to fetch user list");
      }

      const selectedEmails = authData.users
        .filter(user => multipleUserIds!.includes(user.id) && user.email)
        .map(user => user.email as string);

      console.log(`Sending email to ${selectedEmails.length} selected recipients`);
      
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Send individual emails to each recipient
      for (const email of selectedEmails) {
        try {
          await resend.emails.send({
            from: "Trade Advisor <support@tradeadvisor.live>",
            to: [email],
            bcc: ["admin@tradeadvisor.live"],
            subject: subject,
            html: emailTemplate,
          });
    successCount++;
    console.log(`Email sent to: ${email}`);
  } catch (error: any) {
    failCount++;
    errors.push(`${email}: ${error.message}`);
    console.error(`Failed to send to ${email}:`, error.message);
  }

  await delay(2000);
}

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}`, 
          count: successCount,
          failCount,
          errors: errors.length > 0 ? errors : undefined
        }),
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

      console.log(`Sending email to ${userEmails.length} users individually`);

      // Only use BCC for welcome messages to avoid duplication
      if (isWelcomeMessage) {
        // Send single email with BCC for welcome messages
        const emailResponse = await resend.emails.send({
          from: "Trade Advisor <support@tradeadvisor.live>",
          to: userEmails,
          bcc: ["admin@tradeadvisor.live"],
          subject: subject,
          html: emailTemplate,
        });

        console.log("Welcome message sent via BCC:", emailResponse);

        return new Response(
          JSON.stringify({ success: true, message: `Welcome email sent to ${userEmails.length} users`, count: userEmails.length }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // For regular emails, send individually to avoid Resend bouncing
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const email of userEmails) {
        try {
          await resend.emails.send({
            from: "Trade Advisor <support@tradeadvisor.live>",
            to: [email],
            subject: subject,
            html: emailTemplate,
          });
          successCount++;
          console.log(`Email sent to: ${email}`);
        } catch (error: any) {
          failCount++;
          errors.push(`${email}: ${error.message}`);
          console.error(`Failed to send to ${email}:`, error.message);
      }
      await delay(2000); // Wait 2 seconds between emails
    }

    // Send admin copy
      try {
        await resend.emails.send({
          from: "Trade Advisor <support@tradeadvisor.live>",
          to: ["admin@tradeadvisor.live"],
          subject: `[Admin Copy] ${subject}`,
          html: `<p><strong>This is an admin copy of an email sent to ${successCount} users.</strong></p><hr/>${emailTemplate}`,
        });
      } catch (e) {
        console.error("Failed to send admin copy:", e);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}`, 
          count: successCount,
          failCount,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit errors in response
        }),
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
