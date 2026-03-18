import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const supabaseCookies = await createServerClient();
    let { data: { user } } = await supabaseCookies.auth.getUser();

    // Fallback for mobile app using Bearer token
    let mobileToken: string | null = null;
    if (!user) {
      const authHeader = request.headers.get('Authorization');
      mobileToken = authHeader?.replace('Bearer ', '') || null;
      if (mobileToken) {
        const { data } = await supabaseCookies.auth.getUser(mobileToken);
        user = data?.user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authenticate a fresh client specifically as the user, bypassing Next.js cookies
    const supabaseAuthClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      mobileToken ? {
        global: {
          headers: { Authorization: `Bearer ${mobileToken}` }
        }
      } : undefined
    );

    const { receiptId } = await request.json();
    if (!receiptId) {
      return NextResponse.json({ error: 'Missing receiptId' }, { status: 400 });
    }

    const { data: quota } = await supabaseAuthClient
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

    const { data: receipt } = await supabaseAuthClient
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

    await supabaseAuthClient.from('receipts').update({
      parsed_data: parsedData,
      merchant_name: parsedData.merchantName,
      total_amount: parsedData.totalAmount,
      tax_amount: parsedData.taxAmount,
      status: 'parsed',
    }).eq('id', receiptId);

    await supabaseAuthClient.from('usage_quotas').update({
      ai_scans_used: quota.ai_scans_used + 1
    }).eq('id', quota.id);

    return NextResponse.json({ success: true, parsedData });
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
