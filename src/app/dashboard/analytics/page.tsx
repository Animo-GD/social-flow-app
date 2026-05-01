'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLang } from '@/lib/LanguageContext';

export default function AnalyticsPage() {
  const { t } = useLang();
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: api.getAnalytics });

  const metrics = [
    { labelKey: 'stat_total_likes' as const,    value: data?.likes,            icon: Heart,          color: '#e11d48' },
    { labelKey: 'stat_comments' as const,        value: data?.comments,         icon: MessageCircle,  color: '#0075de' },
    { labelKey: 'stat_shares' as const,          value: data?.shares,           icon: Share2,         color: '#2a9d99' },
    { labelKey: 'stat_engagement_rate' as const, value: data ? `${data.engagement_rate}%` : undefined, icon: TrendingUp, color: '#1aae39' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_analytics_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_analytics_sub')}
        </p>
      </div>

      <div className="page-body">
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {metrics.map(m => (
            <div key={m.labelKey} className="stat-card">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <m.icon size={14} style={{ color: m.color }} /> {t(m.labelKey)}
              </div>
              {isLoading
                ? <div className="skeleton skeleton-title" style={{ width: '60%' }} />
                : <div className="stat-value" style={{ color: m.color }}>{m.value?.toLocaleString() ?? '—'}</div>
              }
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="text-subhead" style={{ marginBottom: 24 }}>{t('chart_title')}</h2>
          {isLoading ? (
            <div className="skeleton" style={{ height: 300, borderRadius: 8 }} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.time_series} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#615d59' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, boxShadow: 'var(--shadow-card)', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
                <Line type="monotone" dataKey="posts"      stroke="#0075de" strokeWidth={2} dot={{ r: 4, fill: '#0075de' }} name={t('chart_posts')} />
                <Line type="monotone" dataKey="engagement" stroke="#2a9d99" strokeWidth={2} dot={{ r: 4, fill: '#2a9d99' }} name={t('chart_engagement')} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
