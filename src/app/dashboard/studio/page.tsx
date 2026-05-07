'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLang } from '@/lib/LanguageContext';
import { Player } from '@remotion/player';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Type, Globe, PlayCircle, Loader2 } from 'lucide-react';

// --- Remotion Composition ---
interface CompositionProps {
  mediaUrl: string;
  text: string;
  lang: 'en' | 'ar';
  animation: 'none' | 'fade' | 'slide_up';
}

const StudioComposition: React.FC<CompositionProps> = ({ mediaUrl, text, lang, animation }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation logic
  let opacity = 1;
  let translateY = 0;

  if (animation === 'fade') {
    opacity = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' });
  } else if (animation === 'slide_up') {
    opacity = interpolate(frame, [0, fps / 2], [0, 1], { extrapolateRight: 'clamp' });
    translateY = interpolate(frame, [0, fps], [50, 0], { extrapolateRight: 'clamp' });
  }

  const isAr = lang === 'ar';

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      {mediaUrl ? (
        <Img 
          src={mediaUrl} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      ) : (
        <div style={{ color: '#fff', fontSize: 24, fontFamily: 'sans-serif' }}>
          No Media Selected
        </div>
      )}
      
      {text && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            opacity,
            transform: `translateY(${translateY}px)`,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '20px 40px',
            borderRadius: 16,
            fontSize: 48,
            fontWeight: 'bold',
            fontFamily: isAr ? "'Noto Sans Arabic', sans-serif" : 'sans-serif',
            direction: isAr ? 'rtl' : 'ltr',
            textAlign: 'center',
            maxWidth: '80%',
            whiteSpace: 'pre-wrap'
          }}>
            {text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// --- Page Content ---
function StudioContent() {
  const { t, lang: appLang } = useLang();
  const searchParams = useSearchParams();
  const initialMediaUrl = searchParams.get('media_url') || '';

  const [text, setText] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [animation, setAnimation] = useState<'none' | 'fade' | 'slide_up'>('fade');

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
