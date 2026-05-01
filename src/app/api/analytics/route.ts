import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Aggregate totals + 7-day time series in one go
  const { data: rows, error } = await supabase
    .from('analytics_daily')
    .select('snapshot_date, likes, comments, shares, posts_count, engagement')
    .eq('user_id', session.id)
    .order('snapshot_date', { ascending: true })
    .limit(7);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totals = rows.reduce(
    (acc, r) => ({
      likes: acc.likes + r.likes,
      comments: acc.comments + r.comments,
      shares: acc.shares + r.shares,
    }),
    { likes: 0, comments: 0, shares: 0 }
  );

  const totalEngagement = rows.reduce((s, r) => s + r.engagement, 0);
  const engagement_rate = totals.likes > 0
    ? parseFloat(((totalEngagement / totals.likes) * 100).toFixed(1))
    : 0;

  const time_series = rows.map(r => ({
    date: new Date(r.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    posts: r.posts_count,
    engagement: r.engagement,
  }));

  return NextResponse.json({ ...totals, engagement_rate, time_series });
}
