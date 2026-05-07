'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/lib/LanguageContext';
import { Player } from '@remotion/player';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Type, Globe, PlayCircle, Loader2 } from 'lucide-react';

import { StudioComposition } from '@/remotion/StudioComposition';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// --- Page Content ---
function StudioContent() {
  const { t, lang: appLang } = useLang();
  const searchParams = useSearchParams();
  const initialMediaUrl = searchParams.get('media_url') || '';
  const router = useRouter();

  const [text, setText] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [animation, setAnimation] = useState<'none' | 'fade' | 'slide_up'>('fade');
  
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState('');

  const handleRender = async () => {
    if (!initialMediaUrl) {
      toast.error('No media to render');
      return;
    }

    setIsRendering(true);
    setRenderProgress('Initializing...');
    
    try {
      const res = await fetch('/api/studio/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: initialMediaUrl,
          text,
          lang,
          animation
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Rendering failed');
      }

      const data = await res.json();
      toast.success('Video rendered successfully!');
      
      // Navigate to gallery to see the new video
      router.push('/dashboard/gallery');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Rendering error');
    } finally {
      setIsRendering(false);
      setRenderProgress('');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, height: 'calc(100vh - 140px)' }}>
      {/* Left Sidebar Controls */}
      <div className="card-flat" style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        <h2 className="text-subhead" style={{ marginBottom: 0 }}>{t('page_studio_title')}</h2>
        
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Type size={14} /> {t('studio_add_text')}
          </label>
          <textarea
            className="form-input"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('studio_text_placeholder')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} /> Text Language
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ flex: 1 }}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button 
              className={`btn ${lang === 'ar' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ flex: 1, fontFamily: "'Noto Sans Arabic', sans-serif" }}
              onClick={() => setLang('ar')}
            >
              عربي
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PlayCircle size={14} /> {t('studio_animation')}
          </label>
          <select 
            className="form-select"
            value={animation}
            onChange={(e) => setAnimation(e.target.value as any)}
          >
            <option value="none">None</option>
            <option value="fade">Fade In</option>
            <option value="slide_up">Slide Up</option>
          </select>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleRender}
            disabled={isRendering || !initialMediaUrl}
          >
            {isRendering ? (
              <>
                <Loader2 size={16} className="spin" style={{ marginInlineEnd: 8 }} />
                {renderProgress || 'Rendering...'}
              </>
            ) : (
              'Render & Save to Gallery'
            )}
          </button>
        </div>
      </div>

      {/* Right Preview Area */}
      <div style={{ 
        background: 'var(--color-bg-warm)', 
        borderRadius: 12, 
        border: '1px solid var(--color-border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {initialMediaUrl ? (
          <Player
            component={StudioComposition}
            inputProps={{
              mediaUrl: initialMediaUrl,
              text,
              lang,
              animation
            }}
            durationInFrames={90} // 3 seconds at 30fps
            compositionWidth={1080}
            compositionHeight={1080}
            fps={30}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            controls
            autoPlay
            loop
          />
        ) : (
          <div className="empty-state">
            <p>No media selected. Go to Gallery to select an image or video.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { t } = useLang();

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_studio_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_studio_sub')}
        </p>
      </div>

      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      }>
        <StudioContent />
      </Suspense>
    </div>
  );
}
