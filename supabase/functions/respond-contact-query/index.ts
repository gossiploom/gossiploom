import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RespondQueryRequest {
  queryId: string;
  response: string;
  userEmail: string;
  userName: string;
  originalSubject: string;
  originalMessage: string;
  adminUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { queryId, response, userEmail, userName, originalSubject, originalMessage, adminUserId }: RespondQueryRequest = await req.json();

    console.log("Processing response for query:", queryId);

    // Validate inputs
    if (!queryId || !response || !userEmail) {
      throw new Error("Query ID, response, and user email are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update query in database
    const { error: dbError } = await supabase
      .from("contact_queries")
      .update({
        admin_response: response,
        status: "responded",
        responded_at: new Date().toISOString(),
        responded_by: adminUserId
      })
      .eq("id", queryId);

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to update query");
    }

    // Send response email to user
    const emailResponse = await resend.emails.send({
      from: "Trade Advisor <noreply@tradeadvisor.live>",
      to: [userEmail],
      bcc: ["tradeadvisor.live@gmail.com"],
      subject: `Re: ${originalSubject}`,
      html: `
        <h2>Response to Your Enquiry</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for reaching out to us. Here is our response to your enquiry:</p>
        <hr />
        <h3>Our Response:</h3>
        <p>${response.replace(/\n/g, "<br />")}</p>
        <hr />
        <h3>Your Original Message:</h3>
        <p><strong>Subject:</strong> ${originalSubject}</p>
        <p>${originalMessage.replace(/\n/g, "<br />")}</p>
        <hr />
        <p>If you have any further questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br />The Trade Advisor Team</p>
      `,
    });

    console.log("Response email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Response sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in respond-contact-query:", error);
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
