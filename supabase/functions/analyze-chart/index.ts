import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request, parsing formData...');
    const formData = await req.formData();
    console.log('FormData parsed successfully');
    const fileCount = Number(formData.get('fileCount')) || 1;
    const accountSize = Number(formData.get('accountSize'));
    const riskPercent = Number(formData.get('riskPercent'));
    const pointsPerUsd = Number(formData.get('pointsPerUsd'));
    const tradeType = formData.get('tradeType') || 'pending';

    const files: File[] = [];
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file${i}`) as File;
      if (file) files.push(file);
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${files.length} chart file(s)`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const imageBase64Array: string[] = [];
    let csvData: string | null = null;

    // Process all files
    for (const file of files) {
      console.log('Processing:', file.name, file.type);
      
      if (file.type.startsWith('image/')) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert to base64 in chunks to avoid stack overflow
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
          binary += String.fromCharCode(...chunk);
        }
        
        const base64 = btoa(binary);
        imageBase64Array.push(`data:${file.type};base64,${base64}`);
        console.log('Image converted to base64 successfully');
      } else if (file.type === 'text/csv') {
        const text = await file.text();
        csvData = csvData ? `${csvData}\n\n${text}` : text;
      }
    }

    const riskAmount = (accountSize * riskPercent) / 100;

    // Build AI prompt
    const isPendingOrder = tradeType === 'pending';
    const systemPrompt = `You are an expert forex trading analyst specializing in technical analysis, smart money concepts and trade signal generation. 
Your task is to analyze trading charts and provide precise trade recommendations.

CRITICAL: First, identify the trading symbol (currency pair, gold, etc.) from the chart(s). Look for the symbol displayed in the chart.

User Configuration:
- Account Size: $${accountSize}
- Risk per Trade: ${riskPercent}% ($${riskAmount.toFixed(2)})
- Trade Type: ${isPendingOrder ? 'PENDING ORDER' : 'IMMEDIATE ENTRY'}
- Number of charts provided: ${files.length} (multiple timeframes for confluence)

${isPendingOrder ? `
PENDING ORDER STRATEGY:
- Entry must be at a key liquidity zone, supply/demand level, or Fibonacci retracement level
- Use the SMALLEST timeframe provided to determine precise entry point
- Entry should be VIABLE and not too far from current price
- Look for areas where price is likely to react (previous support/resistance, consolidation zones)
- Entry should offer minimal drawdown before price moves in favor
- Consider institutional order blocks and fair value gaps
- CRITICAL: In your rationale, you MUST specify the entry level type using one of these labels:
  * "Supply Zone" - if entering at a supply/resistance area
  * "Demand Zone" - if entering at a demand/support area
  * "Fair Value Gap" - if entering at fair value gap
  * "Order block" - if entering at institutional order block 
  * "Liquidity Zone" - if entering at liquidity sweep/collection area
  * "50% Fibonacci Retracement" - if entering at 50% Fib level
  * Other specific Fibonacci levels (38.2%, 61.8%, etc.) if applicable
` : `
IMMEDIATE ENTRY STRATEGY - BE EXTREMELY SELECTIVE:
CRITICAL REQUIREMENTS for immediate trades (ALL must be met):
1. Price MUST be at a MAJOR technical level RIGHT NOW (not approaching, but AT the level):
   - Strong support/resistance that has been tested multiple times
   - Major demand/supply zone with clear rejection history
   - Key institutional order block with previous strong reaction
   - Significant fair value gap boundary
   
2. Clear directional bias with STRONG confluence:
   - Higher timeframe trend MUST support the direction
   - Multiple technical factors confirming the same direction
   - No conflicting signals or unclear market structure
   - Price structure must show clear impulsive moves in trade direction
   
3. Entry timing must be IDEAL:
   - Recent price action shows rejection from the level (bullish/bearish candle patterns)
   - NOT in the middle of a ranging/consolidation phase
   - Clear momentum building in the trade direction
   - Volume/volatility supports the move
   
4. Risk-to-reward must be REALISTIC:
   - Next technical level should be clearly visible and achievable
   - Stop loss must be beyond the technical invalidation point (not just based on account risk)
   - Avoid tight stops that will likely get hit due to normal volatility
   
5. Market context must be favorable:
   - NOT during major consolidation or choppy conditions
   - Clear market structure (not messy/unclear price action)
   - Avoid if price is between major levels with no clear direction
   
ONLY generate an immediate trade signal if ALL above conditions are clearly met. Be conservative and realistic.
If the setup is not ideal RIGHT NOW, do not force a trade.
`}

Analyze the provided chart(s) and return a JSON object with this exact structure:
{
  "symbol": "DETECTED_SYMBOL" (e.g., "EURUSD", "XAUUSD", "GBPJPY" - extract from chart),
  "timeframes": ["1H", "4H"] (list the timeframes visible in the charts),
  "direction": "LONG" or "SHORT",
  "entry": number (entry price - Avoid an entry value whose final digit is a zero especially after the decimal, entry point must end withe either, 1, 2, 3, 4, 5, 6, 7.8 or 9, and mUST include all decimal digits visible on the chart without rounding off or truncating , e.g., 13517.135 not 13517 or 0.19865 not 0.1987),
  "stopLoss": number (stop loss price based on invalidation level - include all decimals even the zeros after the decimal point, no truncating or rounding off decimals, also avoid stop loss value whose last digit is zero),
  "takeProfit": number (CRITICAL: identify the most realistic level price will likely reach based on technical analysis, NOT based on risk-reward ratio),
  "confidence": number (0-100, your confidence level - higher with multiple timeframe confluence and when point of invalidation gives stop loss lower than the risk per trade. If point of invalidation gives a higher risk than the user is willing the confidence should be low below 55%),
  "rationale": [
    "Symbol identified: [symbol name]",
    "Multi-timeframe analysis: [describe confluence between timeframes]",
    "Technical reason 1 (e.g., support/resistance, trend, indicators)",
    "Technical reason 2",
    "Technical reason 3",
    "Technical reason 4",
    "Take profit rationale: [explain why this is the most likely target - e.g., previous resistance, Fibonacci extension, structure level]",
    "Risk consideration"
  ],
  "invalidation": "Clear condition that would invalidate this trade and the risk amount should one fail to consider the stoploss but decide to use point of invalidation as StopLoss"
}

Key requirements:
- MUST identify and extract the symbol from the chart(s)
- CRITICAL: Read price levels with ALL decimal places shown on the chart (e.g., 13517.135 not 13517 or 1.15647 not 1.156 or 4213.000 not 4213)
- If multiple charts are provided, analyze them for multi-timeframe confluence
- Higher timeframe should confirm the trend, lower timeframe for precise entry
${isPendingOrder ? `- For PENDING ORDERS: Entry must be at liquidity zones, Major fair value gap, order block, supply/demand, or Fibonacci levels visible on the SMALLEST timeframe
- Entry should be viable (not too far from current price) and offer minimal drawdown` : `- For IMMEDIATE TRADES: Only generate a signal if price is AT a major technical level RIGHT NOW with strong confirmation
- Entry must be at the current price shown on chart where there's clear technical significance
- Avoid an entry value whose final digit is a zero especially after the decimal, entry point must end withe either, 1, 2, 3, 4, 5, 6, 7.8 or 9, and mUST include all decimal digits visible on the chart without rounding off or truncating , e.g., 13517.135 not 13517 or 0.19865 not 0.1987
-Stop loss MUST be beyond key structure (not just calculated from risk) - be realistic about market volatility
- Confidence should be 65% or higher for immediate trades (lower confidence = skip the trade when point of invalidation gives a risk of more than 30% despite the identified risk by user if their risk is more than 30%)`}
- Confidence for trades whose point of invalidation is lower than the risk user for the user should be 80% or higher
- CRITICAL FOR TAKE PROFIT: Identify the most realistic price target based on:
  * Nearest significant support/resistance levels (not the furthest level)
  * Previous swing highs/lows that are ACHIEVABLE
  * Fibonacci extensions or projections
  * Structure levels visible on the chart
  * DO NOT calculate based on risk-reward ratio
  * Focus on where price is MOST LIKELY to reach in the near term before potential reversal or consolidation
  * Be conservative - choose closer, more achievable targets over distant levels
- Stop loss should be at the invalidation point for the setup (beyond key structure, not arbitrary)
- For IMMEDIATE trades, stop loss must account for normal market volatility and should be beyond the technical structure
- Entry, stop loss, and take profit prices must include all visible decimals from the chart and must end withe either, 1, 2, 3, 4, 5, 6, 7.8 or 9, and mUST include all decimal digits visible on the chart without rounding off or truncating (e.g., 1.15647 not 1.156, 4213.000 not 4213)
- Base your analysis on visible technical patterns, fair value gap, order block, support/resistance, trend, and price action
- Be specific and precise with price levels including all values after the decimal point and no rounding off or truncating decimals
- Provide clear, actionable rationale mentioning timeframe confluence if applicable
- Explain why the take profit level is realistic and likely to be reached
- For immediate trades, explain why NOW is a good time to enter (what technical confirmation exists at current price)
- Only return the JSON object, no additional text`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageBase64Array.length > 0) {
      const content: any[] = [
        { 
          type: 'text', 
          text: files.length > 1 
            ? `Analyze these ${files.length} charts (different timeframes of the same symbol). Identify the symbol and provide a trade signal with multi-timeframe confluence.`
            : `Analyze this chart. First identify the symbol from the chart, then provide a trade signal.`
        }
      ];
      
      // Add all images to the content
      imageBase64Array.forEach(imageBase64 => {
        content.push({ type: 'image_url', image_url: { url: imageBase64 } });
      });
      
      messages.push({ role: 'user', content });
    } else if (csvData) {
      messages.push({
        role: 'user',
        content: `Here is the OHLC CSV data:\n\n${csvData}\n\nIdentify the symbol and timeframe(s), then analyze this data and provide a trade signal.`
      });
    } else {
      throw new Error('Unsupported file type');
    }

    console.log('Calling Lovable AI for chart analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Analysis credits depleted. Please add contact admin to recharge and continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const aiContent = aiData.choices[0].message.content;
    
    // Extract JSON from the response
    let signalData;
    try {
      // Try to parse the entire response as JSON first
      signalData = JSON.parse(aiContent);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        signalData = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find JSON object in the text
        const objectMatch = aiContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          signalData = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not extract valid JSON from AI response');
        }
      }
    }

    // Check if trade is viable (especially for immediate trades)
    if (!isPendingOrder && signalData.confidence < 75) {
      console.log('Trade not viable - confidence rating too low for immediate entry');
      return new Response(
        JSON.stringify({ 
          notViable: true,
          message: `The current market conditions don't present a viable immediate trade setup (confidence: ${signalData.confidence}%). The setup doesn't meet our strict requirements for immediate entry. Please try again later when market conditions are more favorable, or consider using pending orders instead.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate stop loss based on risk and recalculate reward based on AI's take profit
    const isLong = signalData.direction === "LONG";

    const entryStr = String(signalData.entry);
    const decimals = entryStr.includes('.') ? entryStr.split('.')[1].length : 0;
    const scale = Math.pow(10, decimals);

    const entryPoints = Math.round(signalData.entry * scale);
    const riskPoints = Math.round(pointsPerUsd * riskAmount);

    // Calculate stop loss based on risk amount
    const stopLossPoints = isLong ? entryPoints - riskPoints : entryPoints + riskPoints;
    const calculatedStopLoss = stopLossPoints / scale;

    // Use AI's take profit and calculate actual reward amount
    const takeProfitPoints = Math.round(signalData.takeProfit * scale);
    const rewardPoints = Math.abs(takeProfitPoints - entryPoints);
    const rewardAmount = rewardPoints / pointsPerUsd;

    const result = {
      ...signalData,
      stopLoss: calculatedStopLoss,
      takeProfit: signalData.takeProfit, // Use AI's identified take profit
      riskAmount,
      rewardAmount,
      newsItems: [], // News scanning can be added later
    };

    console.log('Signal generated successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-chart function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
