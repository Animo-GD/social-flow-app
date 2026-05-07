'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LanguageContext';
import { Image as ImageIcon, Video, Loader2, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function GalleryPage() {
  const { t, lang } = useLang();
  const isAr = lang === 'ar';

  const { data: posts, isLoading } = useQuery({ 
    queryKey: ['posts'], 
    queryFn: api.getPosts 
  });

  const mediaItems = posts?.filter(p => p.image_url || p.video_url) ?? [];

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_gallery_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_gallery_sub')}
        </p>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={40} style={{ opacity: 0.3 }} />
            <p>{isAr ? 'لا توجد وسائط' : 'No media found'}</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 20 
          }}>
            {mediaItems.map(item => (
              <div 
                key={item.id} 
                className="card-flat" 
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 12, 
                  display: 'flex', 
                  flexDirection: 'column',
                  background: 'var(--color-bg)'
                }}
              >
                <div style={{ position: 'relative', paddingTop: '100%', background: '#000', overflow: 'hidden' }}>
                  {item.video_url ? (
                    <video 
                      src={item.video_url} 
                      controls
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.image_url} 
                      alt="Generated" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null}
                  
                  {/* Badge */}
                  <div style={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    background: 'rgba(0,0,0,0.6)', 
                    color: '#fff', 
                    padding: '4px 8px', 
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {item.video_url ? <Video size={12} /> : <ImageIcon size={12} />}
                    {item.video_url ? 'Video' : 'Image'}
                  </div>
                </div>

                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    color: 'var(--color-text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4
                  }}>
                    {item.text || (isAr ? 'بدون نص' : 'No text')}
                  </p>
                  
                  <Link 
                    href={`/dashboard/studio?media_url=${encodeURIComponent(item.image_url || item.video_url || '')}`}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 4, textDecoration: 'none' }}
                  >
                    <Edit3 size={14} style={{ marginInlineEnd: 6 }} />
                    {isAr ? 'تعديل في الاستوديو' : 'Edit in Studio'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
