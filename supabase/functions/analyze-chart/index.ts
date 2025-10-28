const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
console.info('chart-analyzer starting');
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const contentType = req.headers.get('content-type') || '';
    let formData = null;
    if (contentType.includes('multipart/form-data')) {
      formData = await req.formData();
    } else {
      throw new Error('Unsupported content-type. Expecting multipart/form-data with chart images or text/csv files');
    }
    const fileCount = Number(formData.get('fileCount')) || 1;
    const accountSize = Number(formData.get('accountSize')) || 0;
    const riskPercent = Number(formData.get('riskPercent')) || 0;
    const pointsPerUsd = Number(formData.get('pointsPerUsd')) || 1;
    const tradeType = String(formData.get('tradeType') || 'pending');
    const files = [];
    for(let i = 0; i < fileCount; i++){
      const f = formData.get(`file${i}`);
      if (f && f instanceof File) files.push(f);
    }
    if (files.length === 0) {
      return new Response(JSON.stringify({
        error: 'No files provided'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    const imageBase64Array = [];
    let csvData = null;
    for (const file of files){
      if (file.type.startsWith('image/')) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        // Convert to base64 in chunks
        let binary = '';
        const chunkSize = 8192;
        for(let i = 0; i < uint8Array.length; i += chunkSize){
          const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
          binary += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binary);
        imageBase64Array.push(`data:${file.type};base64,${base64}`);
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text();
        csvData = csvData ? `${csvData}\n\n${text}` : text;
      }
    }
    const riskAmount = accountSize * riskPercent / 100;
    const rewardAmount = riskAmount * 3;
    const isPendingOrder = tradeType === 'pending';
    const systemPrompt = `You are an expert forex trading analyst specializing in technical analysis and trade signal generation.\nYour task is to analyze trading charts and provide precise trade recommendations.\n\nCRITICAL: First, identify the trading symbol (currency pair, gold, etc.) from the chart(s). Look for the symbol displayed in the chart.\n\nUser Configuration:\n- Account Size: $${accountSize}\n- Risk per Trade: ${riskPercent}% ($${riskAmount.toFixed(2)})\n- Target Reward (1:3 R:R): $${rewardAmount.toFixed(2)}\n- Trade Type: ${isPendingOrder ? 'PENDING ORDER' : 'IMMEDIATE ENTRY'}\n- Number of charts provided: ${files.length} (multiple timeframes for confluence)\n\n${isPendingOrder ? '\nPENDING ORDER STRATEGY:\n- Entry must be at a key liquidity zone, supply/demand level, or Fibonacci retracement level\n- Use the SMALLEST timeframe provided to determine precise entry point\n- Entry should be VIABLE and not too far from current price\n- Look for areas where price is likely to react (previous support/resistance, consolidation zones)\n- Entry should offer minimal drawdown before price moves in favor\n- Consider institutional order blocks and fair value gaps\n- CRITICAL: In your rationale, you MUST specify the entry level type using one of these labels:\n  * "Supply Zone" - if entering at a supply/resistance area\n  * "Demand Zone" - if entering at a demand/support area\n  * "Fair Value Gap" - if entering at fair value gap\n  * "Order block" - if entering at institutional order block \n  * "Liquidity Zone" - if entering at liquidity sweep/collection area\n  * "50% Fibonacci Retracement" - if entering at 50% Fib level\n  * Other specific Fibonacci levels (38.2%, 61.8%, etc.) if applicable\n' : ''}\n\nAnalyze the provided chart(s) and return a JSON object with this exact structure:\n{\n  "symbol": "DETECTED_SYMBOL",\n  "timeframes": ["1H"],\n  "direction": "LONG",\n  "entry": 0.0,\n  "stopLoss": 0.0,\n  "takeProfit": 0.0,\n  "confidence": 0,\n  "rationale": ["..."],\n  "invalidation": "..."\n}\n\nKey requirements:\n- MUST identify and extract the symbol from the chart(s)\n- CRITICAL: Read price levels with ALL decimal places shown on the chart\n- If multiple charts are provided, analyze them for multi-timeframe confluence\n- Higher timeframe should confirm the trend, lower timeframe for precise entry\n- Entry price must include all visible decimals from the chart\n- Stop loss and take profit will be calculated automatically based on the points configuration\n- Base your analysis on visible technical patterns, fair value gap, order block, support/resistance, trend, and price action\n- Only return the JSON object, no additional text`;
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];
    if (imageBase64Array.length > 0) {
      const content = [
        {
          type: 'text',
          text: files.length > 1 ? `Analyze these ${files.length} charts (different timeframes of the same symbol). Identify the symbol and provide a trade signal with multi-timeframe confluence.` : `Analyze this chart. First identify the symbol from the chart, then provide a trade signal.`
        }
      ];
      imageBase64Array.forEach((imageBase64)=>content.push({
          type: 'image_url',
          image_url: {
            url: imageBase64
          }
        }));
      messages.push({
        role: 'user',
        content
      });
    } else if (csvData) {
      messages.push({
        role: 'user',
        content: `Here is the OHLC CSV data:\n\n${csvData}\n\nIdentify the symbol and timeframe(s), then analyze this data and provide a trade signal.`
      });
    } else {
      throw new Error('Unsupported file type');
    }
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3
      })
    });
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a moment.'
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({
          error: 'Analysis credits depleted. Please add contact admin to recharge and continue.'
        }), {
          status: 402,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }
    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || aiData.choices?.[0]?.text || JSON.stringify(aiData);
    let signalData = null;
    try {
      signalData = JSON.parse(aiContent);
    } catch  {
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        signalData = JSON.parse(jsonMatch[1]);
      } else {
        const objectMatch = aiContent.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          signalData = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not extract valid JSON from AI response');
        }
      }
    }
    const isLong = String(signalData.direction).toUpperCase() === 'LONG';
    const entryStr = String(signalData.entry);
    const decimals = entryStr.includes('.') ? entryStr.split('.')[1].length : 0;
    const scale = Math.pow(10, decimals);
    const entryPoints = Math.round(Number(signalData.entry) * scale);
    const riskPoints = Math.round(pointsPerUsd * riskAmount);
    const rewardPoints = Math.round(pointsPerUsd * rewardAmount);
    const stopLossPoints = isLong ? entryPoints - riskPoints : entryPoints + riskPoints;
    const takeProfitPoints = isLong ? entryPoints + rewardPoints : entryPoints - rewardPoints;
    const calculatedStopLoss = stopLossPoints / scale;
    const calculatedTakeProfit = takeProfitPoints / scale;
    const result = {
      ...signalData,
      stopLoss: calculatedStopLoss,
      takeProfit: calculatedTakeProfit,
      riskAmount,
      rewardAmount,
      newsItems: []
    };
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in chart-analyzer:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
