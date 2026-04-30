'use client';

import { TrendingUp, Hash, BarChart2, Flame } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const TRENDS = [
  { topic: '#AIMarketing',       posts: '12.4K', growth: '+34%', platform: 'LinkedIn' },
  { topic: '#SocialMediaAI',     posts: '8.9K',  growth: '+22%', platform: 'Instagram' },
  { topic: '#ContentCreation',   posts: '21.1K', growth: '+18%', platform: 'X' },
  { topic: '#DigitalMarketing',  posts: '45.3K', growth: '+9%',  platform: 'Instagram' },
  { topic: '#GrowthHacking',     posts: '6.2K',  growth: '+41%', platform: 'LinkedIn' },
  { topic: '#Automation',        posts: '19.7K', growth: '+15%', platform: 'X' },
];

export default function TrendsPage() {
  const { t } = useLang();

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_trends_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_trends_sub')}
        </p>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-label"><Flame size={14} style={{ marginInlineEnd: 4, verticalAlign: 'middle', color: '#dd5b00' }} />{t('hottest_trend')}</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>#AIMarketing</div>
            <div className="stat-sub">+34% {t('this_week')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><BarChart2 size={14} style={{ marginInlineEnd: 4, verticalAlign: 'middle', color: '#0075de' }} />{t('avg_growth')}</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>+23%</div>
            <div className="stat-sub">{t('avg_growth_sub')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><Hash size={14} style={{ marginInlineEnd: 4, verticalAlign: 'middle', color: '#2a9d99' }} />{t('tracked_topics')}</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{TRENDS.length}</div>
            <div className="stat-sub">{t('tracked_topics_sub')}</div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-subhead" style={{ marginBottom: 20 }}>
            <TrendingUp size={18} style={{ marginInlineEnd: 8, verticalAlign: 'middle', color: 'var(--color-accent)' }} />
            {t('trending_label')}
          </h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('col_topic')}</th>
                  <th>{t('label_platform')}</th>
                  <th>{t('col_posts_count')}</th>
                  <th>{t('col_growth')}</th>
                  <th>{t('col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {TRENDS.map((trend, i) => (
                  <tr key={trend.topic}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{trend.topic}</td>
                    <td><span className="badge badge-gray">{trend.platform}</span></td>
                    <td style={{ fontWeight: 600 }}>{trend.posts}</td>
                    <td><span className="badge badge-success">{trend.growth}</span></td>
                    <td>
                      <a href={`/dashboard/posts?topic=${encodeURIComponent(trend.topic)}`} className="btn btn-secondary btn-sm">
                        {t('btn_create_post')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
