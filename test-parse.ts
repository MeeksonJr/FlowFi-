import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
config({ path: './apps/web/.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const receiptId = '1ebb2267-9438-4d7a-a8b8-d8148a7862ab';
    const { data: receipt } = await supabaseAdmin.from('receipts').select('*').eq('id', receiptId).single();
    if (!receipt) throw new Error('Receipt not found');
    console.log('Got receipt:', receipt.image_url);

    const imageResponse = await fetch(receipt.image_url);
    if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    console.log('Image fetched and converted to base64, MIME:', mimeType);

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
             items: { type: "ARRAY", items: { type: "OBJECT", properties: { description: { type: "STRING" }, amount: { type: "NUMBER" } } } },
             confidence: { type: "NUMBER" }
          }
        }
      }
    });

    console.log('AI Response:', response.text);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
