import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Decimal from "https://esm.sh/decimal.js@10.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ===================== DECIMAL VALIDATION ===================== */

function validateLastDigit(value: Decimal, fieldName: string) {
  const str = value.toString();

  if (!str.includes(".")) {
    throw new Error(`${fieldName} must include decimal places`);
  }

  const lastChar = str[str.length - 1];

  if (lastChar === "0") {
    throw new Error(`${fieldName} last decimal digit must NOT be 0`);
  }

  if (!/^[1-9]$/.test(lastChar)) {
    throw new Error(`${fieldName} last decimal digit must be 1–9`);
  }
}

function validatePrice(value: Decimal, fieldName: string) {
  if (!value.isFinite() || value.lte(0)) {
    throw new Error(`${fieldName} must be a valid positive number`);
  }
  validateLastDigit(value, fieldName);
}

/* ===================== SERVER ===================== */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();

    const fileCount = Number(formData.get("fileCount")) || 1;
    const accountSize = new Decimal(formData.get("accountSize") || 0);
    const riskPercent = new Decimal(formData.get("riskPercent") || 0);
    const pointsPerUsd = new Decimal(formData.get("pointsPerUsd") || 0);
    const tradeType = formData.get("tradeType") || "pending";

    const files: File[] = [];
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file${i}`) as File;
      if (file) files.push(file);
    }

    if (!files.length) {
      return new Response(
        JSON.stringify({ error: "No files provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const imageParts: any[] = [];
    let csvData: string | null = null;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const buffer = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let i = 0; i < buffer.length; i += 8192) {
          binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
        }
        imageParts.push({
          inline_data: {
            mime_type: file.type,
            data: btoa(binary),
          },
        });
      } else if (file.type === "text/csv") {
        const text = await file.text();
        csvData = csvData ? `${csvData}\n${text}` : text;
      }
    }

    /* ===================== RISK ===================== */

    const riskAmount = accountSize.mul(riskPercent).div(100);

    /* ===================== PROMPT (UNCHANGED) ===================== */

    const isPendingOrder = tradeType === "pending";
    const systemPrompt = `You are an expert forex trading analyst specializing in technical analysis and trade signal generation. 
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
- Avoid an entry value whose final digit is a zero especially after the decimal, entry point must end withe either, 1, 2, 3, 4, 5, 6, 7, 8 or 9, and mUST include all decimal digits visible on the chart without rounding off or truncating , e.g., 13517.135 not 13517 or 0.19865 not 0.1987
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
- Entry, stop loss, and take profit prices must include all visible decimals from the chart and must end withe either, 1, 2, 3, 4, 5, 6, 7, 8 or 9, and mUST include all decimal digits visible on the chart without rounding off or truncating (e.g., 1.15647 not 1.156, 4213.000 not 4213)
- Base your analysis on visible technical patterns, fair value gap, order block, support/resistance, trend, and price action
- Be specific and precise with price levels including all values after the decimal point and no rounding off or truncating decimals
- Provide clear, actionable rationale mentioning timeframe confluence if applicable
- Explain why the take profit level is realistic and likely to be reached
- For immediate trades, explain why NOW is a good time to enter (what technical confirmation exists at current price)
- Only return the JSON object, no additional text`;

    // Build Gemini API request parts
    const parts: any[] = [
      { text: systemPrompt },
      {
        text:
          files.length > 1
            ? `Analyze these ${files.length} charts (multiple timeframes).`
            : `Analyze this chart and provide a trade signal.`,
      },
      ...imageParts,
    ];

    /* ===================== GEMINI CALL ===================== */

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error(`Gemini API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error("Empty AI response");
    }

    let signalData;
    try {
      signalData = JSON.parse(aiText);
    } catch {
      const match = aiText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON from AI");
      signalData = JSON.parse(match[0]);
    }

    /* ===================== CONFIDENCE GATE ===================== */

    if (!isPendingOrder && signalData.confidence < 70) {
      return new Response(
        JSON.stringify({
          notViable: true,
          message: `Immediate trade rejected (confidence ${signalData.confidence}%)`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* ===================== DECIMAL-SAFE TRADE MATH ===================== */

    const entry = new Decimal(signalData.entry);
    const takeProfit = new Decimal(signalData.takeProfit);
    const isLong = signalData.direction === "LONG";

    validatePrice(entry, "Entry");
    validatePrice(takeProfit, "Take Profit");

    const riskPoints = pointsPerUsd.mul(riskAmount);

    const stopLoss = isLong
      ? entry.minus(riskPoints)
      : entry.plus(riskPoints);

    validatePrice(stopLoss, "Stop Loss");

    const rewardPoints = takeProfit.minus(entry).abs();
    const rewardAmount = rewardPoints.div(pointsPerUsd);

    /* ===================== FINAL RESULT ===================== */

    const result = {
      ...signalData,
      entry: entry.toString(),
      stopLoss: stopLoss.toString(),
      takeProfit: takeProfit.toString(),
      riskAmount: riskAmount.toString(),
      rewardAmount: rewardAmount.toString(),
      newsItems: [],
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
