import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { topic, platform, tone } = body;

  // Demo response — replace with n8n webhook call
  const text = `[${platform.toUpperCase()} • ${tone}] ${topic}\n\nDiscover how the future of marketing is being shaped by AI-driven insights and automation. Our platform makes it effortless to engage your audience at scale. 🚀\n\n#AI #Marketing #SocialMedia #${topic.replace(/\s/g, '')}`;

  return NextResponse.json({
    text,
    image_url: `https://picsum.photos/seed/${encodeURIComponent(topic)}/800/600`,
  });
}
