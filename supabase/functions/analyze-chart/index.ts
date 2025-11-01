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
    const formData = await req.formData();
    const fileCount = Number(formData.get('fileCount')) || 1;
    const accountSize = Number(formData.get('accountSize'));
    const riskPercent = Number(formData.get('riskPercent'));
    const pointsPerUsd = Number(formData.get('pointsPerUsd'));
    const tradeType = formData.get('tradeType') || 'pending';
    const tradingStyle = formData.get('tradingStyle') || 'day';

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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const imageParts: any[] = [];
    let csvData: string | null = null;

    for (const file of files) {
      console.log('Processing:', file.name, file.type);
      
      if (file.type.startsWith('image/')) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
          binary += String.fromCharCode(...chunk);
        }
        
        const base64 = btoa(binary);
        imageParts.push({
          inline_data: {
            mime_type: file.type,
            data: base64,
          },
        });
        console.log('Image converted for Gemini API successfully');
      } else if (file.type === 'text/csv') {
        const text = await file.text();
        csvData = csvData ? `${csvData}\n\n${text}` : text;
      }
    }

    const riskAmount = (accountSize * riskPercent) / 100;
    const isPendingOrder = tradeType === 'pending';
    const isScalping = tradingStyle === 'scalp';

    const systemPrompt = `You are an expert forex trading analyst specializing in technical analysis and trade signal generation. 
Your task is to analyze trading charts and provide precise trade recommendations in a JSON format.

CRITICAL: First, identify the trading symbol (currency pair, gold, etc.) from the chart(s). Look for the symbol displayed in the chart.

User Configuration:
- Account Size: $${accountSize}
- Risk per Trade: ${riskPercent}% ($${riskAmount.toFixed(2)})
- Trading Style: ${isScalping ? 'SCALPING' : 'DAY TRADING'}
- Trade Type: ${isScalping ? 'IMMEDIATE ENTRY (Scalping)' : 'PENDING ORDER (Day Trading)'}
- Number of charts provided: ${files.length} (multiple timeframes for confluence)

${isScalping ? `
SCALPING STRATEGY:
- Entry must be NEAR CURRENT PRICE for quick execution
- Look for immediate retracement opportunities on small timeframes
- Entry should be at the most likely price level where price will briefly retrace within minutes/hours
- Focus on 1-minute, 5-minute, 15-minute, 30-minute, or 1-hour charts
- Entry should offer minimal drawdown and quick profit potential
- Look for micro support/resistance levels, small fair value gaps, or minor pullback zones
- Take profit should be realistic and achievable within a short timeframe (minutes to hours)
- ADVICE: Recommend using 1m, 5m, 15m, 30m, or 1h timeframes for best scalping results
- In your rationale, specify: "Scalping entry near current price at [describe the level type]"
` : `
DAY TRADING STRATEGY:
- Entry must be at a key liquidity zone, supply/demand level, or Fibonacci retracement level
- Use the SMALLEST timeframe provided to determine precise entry point
- Entry should be VIABLE and not too far from current price
- Look for areas where price is likely to react (previous support/resistance, consolidation zones)
- Entry should offer minimal drawdown before price moves in favor
- Consider institutional order blocks and fair value gaps
- ADVICE: Recommend using 4-hour, daily, or weekly charts for best day trading signals
- CRITICAL: In your rationale, you MUST specify the entry level type using one of these labels:
  * "Supply Zone" - if entering at a supply/resistance area
  * "Demand Zone" - if entering at a demand/support area
  * "Fair Value Gap" - if entering at fair value gap
  * "Order block" - if entering at institutional order block 
  * "Liquidity Zone" - if entering at liquidity sweep/collection area
  * "50% Fibonacci Retracement" - if entering at 50% Fib level
  * Other specific Fibonacci levels (38.2%, 61.8%, etc.) if applicable
`}

Analyze the provided chart(s) and return a JSON object with this exact structure:
{
  "symbol": "DETECTED_SYMBOL" (e.g., "EURUSD", "XAUUSD", "GBPJPY" - extract from chart),
  "timeframes": ["1H", "4H"] (list the timeframes visible in the charts),
  "direction": "LONG" or "SHORT",
  "entry": number (entry price - MUST include all decimal places visible on chart, e.g., 13517.135 not 13517),
  "stopLoss": number (stop loss price - will be recalculated based on risk amount),
  "takeProfit": number (CRITICAL: This is the most realistic price target based on technical analysis - nearest resistance for LONG, nearest support for SHORT),
  "confidence": number (0-100, your confidence level - higher with multiple timeframe confluence),
  "rationale": [
    "Symbol identified: [symbol name]",
    "Multi-timeframe analysis: [describe confluence between timeframes]",
    "Technical reason 1 (e.g., support/resistance, trend, indicators)",
    "Technical reason 2",
    "Technical reason 3",
    "Technical reason 4",
    "Take profit reasoning: [explain why this is the most realistic target - nearest structure, Fibonacci level, previous high/low, etc.]",
    "Risk consideration"
  ],
  "invalidation": "Clear condition that would invalidate this trade"
}

Key requirements:
- MUST identify and extract the symbol from the chart(s)
- CRITICAL: Read price levels with ALL decimal places shown on the chart (e.g., 13517.135 not 13517)
- If multiple charts are provided, analyze them for multi-timeframe confluence
- Higher timeframe should confirm the trend, lower timeframe for precise entry
${isScalping ? `- For SCALPING: Entry must be NEAR current price at micro levels where quick retracements are likely
- Entry should be executable immediately with minimal slippage and offer quick profit potential
- Recommend specific small timeframes (1m, 5m, 15m, 30m, 1h) for best results` : `- For DAY TRADING: Entry must be at liquidity zones, Major fair value gap, order block, supply/demand, or Fibonacci levels visible on the SMALLEST timeframe
- Entry should be viable (not too far from current price) and offer minimal drawdown
- Recommend specific larger timeframes (4h, daily, weekly) for best results`}
- Entry price must include all visible decimals from the chart
- CRITICAL FOR TAKE PROFIT: Identify the MOST REALISTIC price target where price is HIGHLY LIKELY to reach:
  * For LONG: Look for the nearest significant resistance level, previous swing high, round number, or key Fibonacci level
  * For SHORT: Look for the nearest significant support level, previous swing low, round number, or key Fibonacci level
  * Take profit should be achievable based on current market structure - not too far
  * Consider typical price movements and market volatility
  * Avoid unrealistic targets that are unlikely to be hit before reversal
- Stop loss will be calculated based on the configured risk amount
- Base your analysis on visible technical patterns, fair value gap, order block, support/resistance, trend, and price action
- Be specific and precise with price levels including all decimals
- Provide clear, actionable rationale mentioning timeframe confluence if applicable
- Only return the JSON object, no additional text`;

    const contents: any[] = [];
    const parts: any[] = [];

    if (imageParts.length > 0) {
      const userText = files.length > 1 
            ? `Analyze these ${files.length} charts (different timeframes of the same symbol). Identify the symbol and provide a ${isScalping ? 'scalping' : 'day trading'} signal with multi-timeframe confluence.`
            : `Analyze this chart. First identify the symbol from the chart, then provide a ${isScalping ? 'scalping' : 'day trading'} signal.`;
      parts.push({ text: userText });
      parts.push(...imageParts);
      parts.push({ text: systemPrompt });
      contents.push({ parts });
    } else if (csvData) {
       parts.push({ text: `Here is the OHLC CSV data:\n\n${csvData}\n\nIdentify the symbol and timeframe(s), then analyze this data and provide a ${isScalping ? 'scalping' : 'day trading'} signal.` });
       parts.push({ text: systemPrompt });
       contents.push({ parts });
    } else {
      throw new Error('Unsupported file type');
    }

    console.log('Calling Gemini AI for chart analysis...');

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
            "temperature": 0.3,
            "responseMimeType": "application/json",
        }
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
      
      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const aiContent = aiData.candidates[0].content.parts[0].text;
    
    let signalData;
    try {
      signalData = JSON.parse(aiContent);
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", aiContent);
        throw new Error('Could not extract valid JSON from AI response');
    }

    const isLong = signalData.direction === "LONG";

    const entryStr = String(signalData.entry);
    const decimals = entryStr.includes('.') ? entryStr.split('.')[1].length : 0;
    const scale = Math.pow(10, decimals);

    const entryPoints = Math.round(signalData.entry * scale);
    const riskPoints = Math.round(pointsPerUsd * riskAmount);

    // Calculate stop loss based on risk amount
    const stopLossPoints = isLong ? entryPoints - riskPoints : entryPoints + riskPoints;
    const calculatedStopLoss = stopLossPoints / scale;

    // Use AI's suggested take profit (most realistic target)
    const aiTakeProfit = signalData.takeProfit;
    
    // Calculate actual reward amount based on AI's take profit
    const takeProfitPoints = Math.round(aiTakeProfit * scale);
    const actualRewardPoints = Math.abs(takeProfitPoints - entryPoints);
    const rewardAmount = actualRewardPoints / pointsPerUsd;

    const result = {
      ...signalData,
      stopLoss: calculatedStopLoss,
      takeProfit: aiTakeProfit,
      riskAmount,
      rewardAmount,
      newsItems: [],
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
