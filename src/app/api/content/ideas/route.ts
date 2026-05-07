import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookUrl = process.env.N8N_IDEAS_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('N8N_IDEAS_WEBHOOK_URL not configured');
      return NextResponse.json({ error: 'Content ideas service not configured' }, { status: 503 });
    }

    const { platform } = await req.json();

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.id,
        platform: platform || 'all',
        userLanguage: 'en' // Language not stored in session, default to English
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook returned ${response.status}`);
    }

    const data = await response.json();
    
    // Expecting an array of ideas: { id, title, description, platform }
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Ideas API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
