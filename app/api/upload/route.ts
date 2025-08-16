import { NextResponse } from 'next/server';

// Minimal handler: read .txt, return text content
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }
    // Only .txt for now
    const text = await file.text();
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
