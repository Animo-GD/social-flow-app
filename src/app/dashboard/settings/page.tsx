'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function SettingsPage() {
  const { t } = useLang();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: api.getSettings });

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_settings_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_settings_sub')}
        </p>
      </div>

      <div className="page-body">
        <div className="card">
          <h2 className="text-subhead" style={{ marginBottom: 20 }}>{t('platform_connections')}</h2>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data?.connections.map(c => (
                <div
                  key={c.platform}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {c.status === 'connected'
                      ? <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                      : <XCircle size={18} style={{ color: 'var(--color-error)' }} />
                    }
                    {/* Platform names kept in English intentionally */}
                    <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>{c.platform}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge ${c.status === 'connected' ? 'badge-success' : 'badge-error'}`}>
                      {c.status === 'connected' ? t('status_posted').replace('Posted','') || c.status : c.status}
                      {c.status}
                    </span>
                    {c.status === 'disconnected' && (
                      <button className="btn btn-secondary btn-sm">
                        <RefreshCw size={12} /> {t('btn_reconnect')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
