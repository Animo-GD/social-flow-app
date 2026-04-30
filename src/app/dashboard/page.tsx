'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, MessageCircle, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function DashboardPage() {
  const { t } = useLang();
  const { data: posts, isLoading: postsLoading } = useQuery({ queryKey: ['posts'], queryFn: api.getPosts });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({ queryKey: ['analytics'], queryFn: api.getAnalytics });
  const { data: conversations } = useQuery({ queryKey: ['conversations'], queryFn: api.getConversations });

  const scheduled = posts?.filter(p => p.status === 'scheduled').length ?? 0;
  const failed = posts?.filter(p => p.status === 'failed').length ?? 0;
  const totalMsgs = conversations?.length ?? 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_overview_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_overview_sub')}
        </p>
      </div>

      <div className="page-body">
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> {t('stat_scheduled')}
            </div>
            {postsLoading ? <div className="skeleton skeleton-title" style={{ width: '60%' }} /> : (
              <>
                <div className="stat-value">{scheduled}</div>
                <div className="stat-sub">{failed > 0 ? `${failed} ${t('stat_failed')}` : t('stat_all_on_track')}</div>
              </>
            )}
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={14} /> {t('stat_conversations')}
            </div>
            {!conversations ? <div className="skeleton skeleton-title" style={{ width: '40%' }} /> : (
              <>
                <div className="stat-value">{totalMsgs}</div>
                <div className="stat-sub">{t('stat_whatsapp_telegram')}</div>
              </>
            )}
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} /> {t('stat_engagement')}
            </div>
            {analyticsLoading ? <div className="skeleton skeleton-title" style={{ width: '50%' }} /> : (
              <>
                <div className="stat-value">{analytics?.engagement_rate ?? 0}%</div>
                <div className="stat-sub">{analytics?.likes.toLocaleString()} {t('stat_likes_total')}</div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card">
            <h2 className="text-subhead" style={{ marginBottom: 16 }}>{t('recent_posts')}</h2>
            {postsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ width: '100%' }} />)}
              </div>
            ) : (
              <div className="activity-feed">
                {posts?.slice(0, 4).map(post => (
                  <div key={post.id} className="activity-item">
                    <div className={`activity-dot${post.status === 'posted' ? ' green' : post.status === 'failed' ? ' orange' : ''}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{post.platform}</span>
                        <span className={`badge ${post.status === 'posted' ? 'badge-success' : post.status === 'failed' ? 'badge-error' : ''}`}>
                          {post.status === 'scheduled' && <Clock size={10} style={{ marginInlineEnd: 3 }} />}
                          {post.status === 'posted'    && <CheckCircle size={10} style={{ marginInlineEnd: 3 }} />}
                          {post.status === 'failed'    && <XCircle size={10} style={{ marginInlineEnd: 3 }} />}
                          {t(`status_${post.status}` as 'status_scheduled' | 'status_posted' | 'status_failed')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-subhead" style={{ marginBottom: 16 }}>{t('recent_messages')}</h2>
            {!conversations ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ width: '100%' }} />)}
              </div>
            ) : (
              <div className="activity-feed">
                {conversations.slice(0, 4).map(c => (
                  <div key={c.id} className="activity-item">
                    <div className="activity-dot" style={{ background: c.platform === 'whatsapp' ? '#25d366' : '#229ed9' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.user}</span>
                        <span className="badge badge-gray" style={{ textTransform: 'capitalize', marginInlineStart: 'auto' }}>{c.platform}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.last_message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
