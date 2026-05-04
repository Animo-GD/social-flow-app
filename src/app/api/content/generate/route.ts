export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rawActionType = body?.action_type;
  const allowedActionTypes = new Set(['generate_text', 'generate_image', 'generate_both']);
  const action_type = allowedActionTypes.has(rawActionType) ? rawActionType : 'generate_both';
  const payload = {
    ...body,
    action_type,
    action: action_type,
    generation_type: action_type,
  };
  const webhookUrl = process.env.N8N_CONTENT_GENERATE_URL;

  // Attach user_id from session
  const session = await getSession();
  const user_id = session?.id ?? null;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'N8N_CONTENT_GENERATE_URL is not set in .env.local' },
      { status: 503 }
    );
  }

  const CREDITS_PER_GENERATION = 1;

  if (session) {
    // Check balance
    const { data: userRow } = await supabase
      .from('users')
      .select('credits')
      .eq('id', session.id)
      .single();

    // Demo user always has credits; real users must have enough
    if (session.id !== 'demo' && (userRow?.credits ?? 0) < CREDITS_PER_GENERATION) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please buy more credits to continue.' },
        { status: 402 }
      );
    }

    // Deduct credits
    if (session.id !== 'demo' && userRow) {
      await supabase
        .from('users')
        .update({ credits: userRow.credits - CREDITS_PER_GENERATION })
        .eq('id', session.id);

      await supabase.from('credit_transactions').insert({
        user_id: session.id,
        amount: -CREDITS_PER_GENERATION,
        type: 'spend',
        description: `Generated content for ${body.platform || 'all platforms'}`,
      });
    }
  }

  // Fetch business profile to send to webhook for better context
  const { data: businessProfile } = await supabase
    .from('business')
    .select('*')
    .eq('user_id', user_id)
    .single();

  const enrichedPayload = {
    ...payload,
    user_id,
    business_profile: businessProfile || null
  };

  // 1. Create a pending job in Supabase so the frontend can poll it
  const { data: job, error: jobError } = await supabase
    .from('generation_jobs')
    .insert({ status: 'pending' })
    .select('id')
    .single();

  if (jobError) {
    // Table might not exist yet — fall back to synchronous mode
    console.warn('generation_jobs not available, using sync mode:', jobError.message);
    try {
      const n8nRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...enrichedPayload }),
      });
      const data = await n8nRes.json();
      return NextResponse.json({ sync: true, ...data });
    } catch (err) {
      return NextResponse.json({ error: `n8n unreachable: ${(err as Error).message}` }, { status: 502 });
    }
  }

  const jobId = job.id;

  // 2. Fire n8n call — include job_id so n8n can update Supabase when done
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...enrichedPayload, job_id: jobId }),
  })
    .then(async (n8nRes) => {
      if (!n8nRes.ok) {
        const text = await n8nRes.text().catch(() => '');
        await supabase
          .from('generation_jobs')
          .update({ status: 'failed', error_msg: `n8n ${n8nRes.status}: ${text}`, updated_at: new Date().toISOString() })
          .eq('id', jobId);
        return;
      }
      const result = await n8nRes.json();
      // If n8n responds synchronously with the result, mark it completed immediately
      if (result.text || result.image_url) {
        await supabase
          .from('generation_jobs')
          .update({ status: 'completed', result, updated_at: new Date().toISOString() })
          .eq('id', jobId);
      }
      // If n8n is async and will update Supabase itself, it just needs the job_id
    })
    .catch(async (err) => {
      await supabase
        .from('generation_jobs')
        .update({ status: 'failed', error_msg: err.message, updated_at: new Date().toISOString() })
        .eq('id', jobId);
    });

  // 3. Return job_id immediately — frontend will poll
  return NextResponse.json({ job_id: jobId });
}
