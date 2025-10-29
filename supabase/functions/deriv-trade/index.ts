import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeRequest {
  action: 'place' | 'close';
  symbol: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  duration?: number;
  durationType?: 'seconds' | 'minutes' | 'hours';
  contractId?: string;
  barrier?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DERIV_API_TOKEN = Deno.env.get('DERIV_API_TOKEN');
    if (!DERIV_API_TOKEN) {
      throw new Error('DERIV_API_TOKEN is not configured');
    }

    const { action, symbol, direction, amount, duration = 60, durationType = 'seconds', contractId, barrier }: TradeRequest = await req.json();

    console.log('Deriv trade request:', { action, symbol, direction, amount, duration, durationType });

    // Create WebSocket connection to Deriv API
    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

    const sendMessage = (msg: any) => {
      console.log('Sending to Deriv:', msg);
      ws.send(JSON.stringify(msg));
    };

    let tradeResult: any = null;
    let errorMessage: string | null = null;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout

      ws.onopen = () => {
        console.log('WebSocket connected to Deriv');
        
        // Authorize first
        sendMessage({
          authorize: DERIV_API_TOKEN,
        });
      };

      ws.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('Received from Deriv:', data);

        if (data.error) {
          console.error('Deriv API error:', data.error);
          errorMessage = data.error.message;
          clearTimeout(timeout);
          ws.close();
          reject(new Error(data.error.message));
          return;
        }

        // Handle authorize response
        if (data.msg_type === 'authorize') {
          console.log('Authorization successful');
          
          if (action === 'place') {
            // Create a proposal (price quote)
            const proposalRequest: any = {
              proposal: 1,
              amount: amount,
              basis: 'stake',
              contract_type: direction,
              currency: 'USD',
              symbol: symbol,
            };

            // Add duration
            if (durationType === 'seconds') {
              proposalRequest.duration = duration;
              proposalRequest.duration_unit = 's';
            } else if (durationType === 'minutes') {
              proposalRequest.duration = duration;
              proposalRequest.duration_unit = 'm';
            } else {
              proposalRequest.duration = duration;
              proposalRequest.duration_unit = 'h';
            }

            // Add barrier if provided
            if (barrier) {
              proposalRequest.barrier = barrier;
            }

            sendMessage(proposalRequest);
          } else if (action === 'close' && contractId) {
            // Sell the contract
            sendMessage({
              sell: contractId,
              price: 0, // Sell at market price
            });
          }
        }

        // Handle proposal response
        if (data.msg_type === 'proposal') {
          console.log('Proposal received:', data.proposal);
          
          // Buy the contract using proposal ID
          sendMessage({
            buy: data.proposal.id,
            price: data.proposal.ask_price,
          });
        }

        // Handle buy response
        if (data.msg_type === 'buy') {
          console.log('Trade executed successfully:', data.buy);
          tradeResult = {
            success: true,
            contractId: data.buy.contract_id,
            buyPrice: data.buy.buy_price,
            payout: data.buy.payout,
            startTime: data.buy.start_time,
            purchaseTime: data.buy.purchase_time,
            longcode: data.buy.longcode,
          };
          clearTimeout(timeout);
          ws.close();
          resolve();
        }

        // Handle sell response
        if (data.msg_type === 'sell') {
          console.log('Contract closed successfully:', data.sell);
          tradeResult = {
            success: true,
            soldFor: data.sell.sold_for,
            transactionId: data.sell.transaction_id,
          };
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(timeout);
        reject(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (!tradeResult && !errorMessage) {
          reject(new Error('Connection closed unexpectedly'));
        }
      };
    });

    if (tradeResult) {
      return new Response(
        JSON.stringify(tradeResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(errorMessage || 'Unknown error occurred');
    }

  } catch (error) {
    console.error('Error in deriv-trade function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
