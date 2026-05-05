'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2, LayoutTemplate, Coins, Tag } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import Image from 'next/image';

export default function TemplatesPage() {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-display" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LayoutTemplate size={32} style={{ color: 'var(--color-accent)' }} />
          {isAr ? 'قوالب التصميم' : 'Design Templates'}
        </h1>
        <p className="text-body" style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
          {isAr 
            ? 'تصفح قوالب التصميم الجاهزة لاستخدامها كمرجع في توليد الصور والفيديو.' 
            : 'Browse design templates to use as a reference for image and video generation.'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,117,222,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
            <LayoutTemplate size={32} />
          </div>
          <h2 className="text-title">{isAr ? 'لا توجد قوالب' : 'No templates found'}</h2>
          <p className="text-body" style={{ color: 'var(--color-text-muted)', maxWidth: 400 }}>
            {isAr 
              ? 'لم يتم إضافة قوالب تصميم بعد. تحقق مرة أخرى لاحقًا!' 
              : 'No design templates have been added yet. Check back later!'}
          </p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 24 }}>
          {templates.map((template) => (
            <div key={template.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Image Preview */}
              <div style={{ width: '100%', height: 200, background: '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {template.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.image_url} alt={template.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <LayoutTemplate size={48} style={{ color: '#cbd5e1' }} />
                )}
                
                {/* Price Badge */}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Coins size={14} />
                  {template.price} {isAr ? 'كريدت' : 'credits'}
                </div>
              </div>
              
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                  {template.name}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 16, flex: 1, lineHeight: 1.5 }}>
                  {template.description || (isAr ? 'لا يوجد وصف' : 'No description')}
                </p>
                
                {template.tags && template.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {template.tags.map((tag: string) => (
                      <span key={tag} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={12} /> {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    // Navigate to generate post with template ID
                    window.location.href = `/dashboard/posts?template_id=${template.id}`;
                  }}
                >
                  {isAr ? 'استخدام القالب' : 'Use Template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
