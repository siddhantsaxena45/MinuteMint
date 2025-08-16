export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-1.5-flash';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
    }

    const { text, instruction } = await req.json();
    if (!text || !instruction) {
      return NextResponse.json({ error: 'Missing text or instruction' }, { status: 400 });
    }

    const genAI = new GoogleGenAI({});

    const userPrompt = `
Instruction: ${instruction}

Transcript:
${text}

Return strict JSON with this schema:
{
  "summary": "string",
  "action_items": ["string"],
  "decisions": ["string"],
  "follow_ups": ["string"],
  "risks": ["string"]
}
`;

    const generationConfig = {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    };

    // **THE FIX:** Use the spread operator (...) to add the generation
    // config properties directly to the main object.
    const resp = await genAI.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'You are a helpful assistant that outputs strict JSON only, without extra commentary.',
            },
          ],
        },
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      ...generationConfig, // This correctly spreads the properties
    });

    const raw = resp.text;

    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'Empty model response' }, { status: 502 });
    }

    let data: any = {};
    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      const match = raw.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : {};
    }

    return NextResponse.json({
      summary: typeof data.summary === 'string' ? data.summary : '',
      action_items: Array.isArray(data.action_items) ? data.action_items : [],
      decisions: Array.isArray(data.decisions) ? data.decisions : [],
      follow_ups: Array.isArray(data.follow_ups) ? data.follow_ups : [],
      risks: Array.isArray(data.risks) ? data.risks : [],
    });
  } catch (e: any) {
    console.error('Summarization error:', e);
    return NextResponse.json({ error: e?.message || 'Summarization failed' }, { status: 500 });
  }
}