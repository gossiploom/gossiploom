import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lipana-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Lipana webhook received');

    const signature = req.headers.get('x-lipana-signature');
    if (!signature) {
      console.log('Missing webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('LIPANA_WEBHOOK_SECRET');
    if (webhookSecret) {
      const encoder = new TextEncoder();
      const data = encoder.encode(rawBody);
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== expectedSignature) {
        console.log('Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    console.log('Webhook event:', event);
    console.log('Webhook data:', data);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle successful payment
    if (event === 'payment.success' || event === 'transaction.success') {
      const transactionId = data.transactionId || data.transaction_id;

      // Find the pending payment
      const { data: pendingPayment, error: findError } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('status', 'pending')
        .single();

      if (findError || !pendingPayment) {
        console.error('Pending payment not found:', findError);
        return new Response(
          JSON.stringify({ error: 'Payment record not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Found pending payment:', pendingPayment);

      // Update user's analysis limit
      const { data: currentSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('analysis_limit')
        .eq('user_id', pendingPayment.user_id)
        .single();

      if (fetchError) {
        console.error('Error fetching user settings:', fetchError);
        throw fetchError;
      }

      const newLimit = (currentSettings?.analysis_limit || 0) + pendingPayment.analysis_slots;

      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ analysis_limit: newLimit })
        .eq('user_id', pendingPayment.user_id);

      if (updateError) {
        console.error('Error updating analysis limit:', updateError);
        throw updateError;
      }

      // Mark payment as completed
      const { error: completeError } = await supabase
        .from('pending_payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId);

      if (completeError) {
        console.error('Error marking payment complete:', completeError);
      }

      console.log(`Successfully added ${pendingPayment.analysis_slots} slots to user ${pendingPayment.user_id}`);
      console.log(`New analysis limit: ${newLimit}`);

      return new Response(
        JSON.stringify({ received: true, status: 'processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle failed payment
    if (event === 'payment.failed' || event === 'transaction.failed') {
      const transactionId = data.transactionId || data.transaction_id;

      const { error: failError } = await supabase
        .from('pending_payments')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId);

      if (failError) {
        console.error('Error marking payment failed:', failError);
      }

      return new Response(
        JSON.stringify({ received: true, status: 'failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle other events
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
