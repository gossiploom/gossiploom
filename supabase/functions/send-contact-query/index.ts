import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactQueryRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactQueryRequest = await req.json();

    console.log("Processing contact query from:", email);

    // Validate inputs
    if (!name || !email || !subject || !message) {
      throw new Error("All fields are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store in database
    const { error: dbError } = await supabase
      .from("contact_queries")
      .insert({
        name,
        email,
        subject,
        message,
        status: "pending"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store query");
    }

    // Send email to admin with BCC
    const adminEmailResponse = await resend.emails.send({
      from: "Trade Advisor <noreply@tradeadvisor.live>",
      to: ["tradeadvisor.live@gmail.com"],
      subject: `New Contact Query: ${subject}`,
      html: `
        <h2>New Contact Query Received</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, "<br />")}</p>
        <hr />
        <p><em>This query has been saved to the admin dashboard for response.</em></p>
      `,
    });

    console.log("Admin email sent:", adminEmailResponse);

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "Trade Advisor <noreply@tradeadvisor.live>",
      to: [email],
      bcc: ["tradeadvisor.live@gmail.com"],
      subject: `We received your message: ${subject}`,
      html: `
        <h2>Thank you for contacting Trade Advisor!</h2>
        <p>Dear ${name},</p>
        <p>We have received your enquiry and will get back to you as soon as possible.</p>
        <hr />
        <h3>Your Message:</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, "<br />")}</p>
        <hr />
        <p>If you have any urgent matters, please email us directly at <a href="mailto:support@tradeadvisor.live">support@tradeadvisor.live</a>.</p>
        <p>Best regards,<br />The Trade Advisor Team</p>
      `,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Query submitted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-query:", error);
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
