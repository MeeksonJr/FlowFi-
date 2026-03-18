import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    let { data: { user } } = await supabase.auth.getUser();

    // Fallback for mobile app using Bearer token
    if (!user) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (token) {
        const { data } = await supabase.auth.getUser(token);
        user = data?.user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiptId } = await request.json();
    if (!receiptId) {
      return NextResponse.json({ error: 'Missing receiptId' }, { status: 400 });
    }

    const { data: quota } = await supabase
      .from('usage_quotas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!quota) {
       return NextResponse.json({ error: 'Quota not found' }, { status: 400 });
    }

    if (quota.ai_scans_used >= quota.ai_scans_limit) {
      return NextResponse.json({ error: 'Quota exceeded' }, { status: 403 });
    }

    const { data: receipt } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (!receipt || receipt.user_id !== user.id) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const imageResponse = await fetch(receipt.image_url);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Analyze this receipt and output structured JSON matching the requested schema.' },
            {
              inlineData: {
                data: base64Image,
                mimeType,
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            merchantName: { type: "STRING" },
            date: { type: "STRING" },
            totalAmount: { type: "NUMBER" },
            taxAmount: { type: "NUMBER" },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  description: { type: "STRING" },
                  amount: { type: "NUMBER" }
                }
              }
            },
            confidence: { type: "NUMBER" }
          }
        }
      }
    });

    const parsedDataText = response.text;
    let parsedData = null;
    if (parsedDataText) {
      parsedData = JSON.parse(parsedDataText);
    }

    await supabase.from('receipts').update({
      parsed_data: parsedData,
      status: 'parsed',
    }).eq('id', receiptId);

    await supabase.from('usage_quotas').update({
      ai_scans_used: quota.ai_scans_used + 1
    }).eq('id', quota.id);

    return NextResponse.json({ success: true, parsedData });
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
