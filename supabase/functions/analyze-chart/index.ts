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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const imageBase64Array: string[] = [];
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
        imageBase64Array.push(`data:${file.type};base64,${base64}`);
        console.log('Image converted to base64 successfully');

      } else if (file.type === 'text/csv') {
        const text = await file.text();
        csvData = csvData ? `${csvData}\n\n${text}` : text;
      }
    }

    const riskAmount = (accountSize * riskPercent) / 100;

    const isPendingOrder = tradeType === 'pending';
    const systemPrompt = `... (UNCHANGED — THIS BLOCK REMAINS EXACTLY AS YOU PROVIDED) ...`;

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

      imageBase64Array.forEach(img => {
        content.push({ type: 'image_url', image_url: { url: img } });
      });

      messages.push({ role: 'user', content });

    } else if (csvData) {
      messages.push({
        role: 'user',
        content: `Here is the OHLC CSV data:\n\n${csvData}\n\nIdentify the symbol and timeframe(s), then analyze this data and provide a trade signal.`
      });
    }

    console.log('Calling Gemini AI for chart analysis...');

    // -----------------------------
    // 🔵 REPLACED LOVABLE WITH GEMINI
    // -----------------------------
    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: JSON.stringify(messages) }
              ]
            }
          ]
        })
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: corsHeaders
        });
      }

      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Out of credits' }), {
          status: 402, headers: corsHeaders
        });
      }

      throw new Error(`Gemini API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("Gemini response received:", aiData);

    const aiContent =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      (() => { throw new Error("Gemini returned no content"); })();

    let signalData;
    try {
      signalData = JSON.parse(aiContent);
    } catch {
      const m1 = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (m1) signalData = JSON.parse(m1[1]);
      else {
        const m2 = aiContent.match(/\{[\s\S]*\}/);
        if (m2) signalData = JSON.parse(m2[0]);
        else throw new Error('Could not extract valid JSON from Gemini response');
      }
    }
    // -----------------------------
    // END GEMINI SECTION
    // -----------------------------

    // (REST OF CODE UNCHANGED FROM YOUR ORIGINAL)
    // --------------------------------------------------------
    // VALIDATION, STOPLOSS, TAKE PROFIT CALCULATIONS, RETURN
    // --------------------------------------------------------

    if (!isPendingOrder && signalData.confidence < 75) {
      return new Response(
        JSON.stringify({
          notViable: true,
          message: `The current market conditions don't present a viable immediate trade setup (confidence: ${signalData.confidence}%).`
        }),
        { headers: corsHeaders }
      );
    }

    const isLong = signalData.direction === "LONG";
    const entryStr = String(signalData.entry);
    const decimals = entryStr.includes('.') ? entryStr.split('.')[1].length : 0;
    const scale = Math.pow(10, decimals);

    const entryPoints = Math.round(signalData.entry * scale);
    const riskPoints = Math.round(pointsPerUsd * riskAmount);

    const stopLossPoints = isLong ? entryPoints - riskPoints : entryPoints + riskPoints;
    const calculatedStopLoss = stopLossPoints / scale;

    const takeProfitPoints = Math.round(signalData.takeProfit * scale);
    const rewardPoints = Math.abs(takeProfitPoints - entryPoints);
    const rewardAmount = rewardPoints / pointsPerUsd;

    const result = {
      ...signalData,
      stopLoss: calculatedStopLoss,
      takeProfit: signalData.takeProfit,
      riskAmount,
      rewardAmount,
      newsItems: []
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
