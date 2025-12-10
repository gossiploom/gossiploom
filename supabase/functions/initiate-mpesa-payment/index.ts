import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { phone, amount, analysisSlots, packageType } = await req.json();

    console.log('Initiating M-Pesa payment:', {
      user: user.id,
      phone,
      amount,
      analysisSlots,
      packageType,
    });

    // Format phone number for Lipana (remove + and spaces)
    const formattedPhone = phone.replace(/[\s+]/g, '');

    // Validate minimum amount (Ksh 10)
    if (amount < 10) {
      throw new Error('Minimum transaction amount is Ksh 10');
    }

    // Call Lipana STK Push API
    const lipanaApiKey = Deno.env.get('LIPANA_API_KEY');
    const lipanaResponse = await fetch('https://api.lipana.dev/v1/transactions/push-stk', {
      method: 'POST',
      headers: {
        'x-api-key': lipanaApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        amount: Math.round(amount), // Lipana expects integer
      }),
    });

    if (!lipanaResponse.ok) {
      const errorData = await lipanaResponse.json();
      console.error('Lipana API error:', errorData);
      throw new Error(errorData.message || 'Failed to initiate M-Pesa payment');
    }

    const lipanaData = await lipanaResponse.json();
    console.log('Lipana response:', lipanaData);

    // Store pending transaction in a custom table (you'll need to create this)
    // For now, we'll store it temporarily with the transaction ID
    const { data: transactionData, error: insertError } = await supabase
      .from('pending_payments')
      .insert({
        user_id: user.id,
        transaction_id: lipanaData.data.transactionId,
        checkout_request_id: lipanaData.data.checkoutRequestID,
        amount_kes: amount,
        analysis_slots: analysisSlots,
        package_type: packageType,
        payment_method: 'mpesa',
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing pending payment:', insertError);
      // Continue anyway as the payment was initiated
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: lipanaData.data.transactionId,
        checkoutRequestID: lipanaData.data.checkoutRequestID,
        message: lipanaData.data.message || 'STK push sent to your phone. Please complete the payment.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
