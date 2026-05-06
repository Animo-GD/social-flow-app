'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import {
  generatingStagesEN, generatingStagesAR,
  generatingImageStagesEN, generatingImageStagesAR,
} from '@/lib/generatingStages';
import { api } from '@/lib/api';

const POLL_MS = 2000;
const STEP_MS = 1800;

interface Props {
  jobId: string;
  onComplete: (result: { text: string; image_url?: string; video_url?: string; id?: string }) => void;
  onError: (msg: string) => void;
  actionType?: 'generate_text' | 'generate_image' | 'generate_full_post' | 'generate_video';
}

/* ─────────────────────────────────────────────
   Premium ring animation for image / video gen
───────────────────────────────────────────── */
function ImageGeneratingView({ stages, activeIndex, elapsed, lang, isVideo }: {
  stages: string[];
  activeIndex: number;
  elapsed: number;
  lang: string;
  isVideo?: boolean;
}) {
  const progress = Math.min(Math.round((activeIndex / (stages.length - 1)) * 100), 100);
  const circumference = 2 * Math.PI * 50; // r=50
  const strokeDash = (progress / 100) * circumference;
  const emoji = isVideo ? '▶' : '✦';
  const color1 = isVideo ? '#818cf8' : '#6366f1';
  const color2 = isVideo ? '#c084fc' : '#ec4899';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* ── Rings ── */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color1}18 0%, transparent 68%)`,
          animation: 'glowPulse 2.8s ease-in-out infinite',
        }} />

        <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`arcGrad-${isVideo ? 'v' : 'i'}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>

          {/* Track ring (faint) */}
          <circle cx="100" cy="100" r="50" fill="none"
            stroke={color1} strokeWidth="3" strokeOpacity="0.12" />

          {/* Progress arc */}
          <circle cx="100" cy="100" r="50" fill="none"
            stroke={`url(#arcGrad-${isVideo ? 'v' : 'i'})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '100px 100px',
              transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)',
            }}
          />

          {/* Outer dashed ring — slow CW */}
          <circle cx="100" cy="100" r="76" fill="none"
            stroke={color1} strokeWidth="1" strokeOpacity="0.18"
            strokeDasharray="6 5"
            style={{ animation: 'ringCW 14s linear infinite', transformOrigin: '100px 100px' }}
          />

          {/* Inner dashed ring — slow CCW */}
          <circle cx="100" cy="100" r="34" fill="none"
            stroke={color2} strokeWidth="1" strokeOpacity="0.15"
            strokeDasharray="4 6"
            style={{ animation: 'ringCCW 9s linear infinite', transformOrigin: '100px 100px' }}
          />

          {/* Centre icon */}
          <text x="100" y="106"
            textAnchor="middle"
            fontSize="22"
            fill={color1}
            style={{ fontFamily: 'system-ui', animation: 'iconBreath 3s ease-in-out infinite' }}
          >
            {emoji}
          </text>
        </svg>

        {/* Percent label — sits below the SVG centre */}
        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0,
          textAlign: 'center',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: color1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {progress}%
        </div>
      </div>

      {/* ── Stage text ── */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          transition: 'opacity 0.35s ease',
        }}>
          {stages[activeIndex]}
        </p>
        <p style={{
          margin: '5px 0 0',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
        </p>
      </div>

      {/* ── Pill dots ── */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {stages.map((_, i) => (
          <div key={i} style={{
            height: 5,
            borderRadius: 999,
            background: i < activeIndex ? color1
              : i === activeIndex ? `linear-gradient(90deg, ${color1}, ${color2})`
              : 'var(--color-border)',
            width: i === activeIndex ? 22 : 5,
            opacity: i > activeIndex ? 0.35 : 1,
            transition: 'width 0.4s ease, background 0.4s ease',
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step-list animation for text generation
───────────────────────────────────────────── */
function TextGeneratingView({ stages, activeIndex, elapsed, lang }: {
  stages: string[];
  activeIndex: number;
  elapsed: number;
  lang: string;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {lang === 'ar' ? 'جارٍ صياغة المحتوى…' : 'Crafting your content…'}
        </span>
        <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((phrase, i) => {
          const isVisible = i <= activeIndex;
          const isActive  = i === activeIndex;
          return (
            <div key={i} style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
              display: 'flex', alignItems: 'center', gap: 10,
              direction: lang === 'ar' ? 'rtl' : 'ltr',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isActive ? '#6366f1' : 'var(--color-success)',
                boxShadow: isActive ? '0 0 8px #6366f1' : 'none',
                animation: isActive ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                fontSize: '0.9rem',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 400,
                textDecoration: !isActive && isVisible ? 'line-through' : 'none',
                opacity: !isActive && isVisible ? 0.55 : 1,
              }}>
                {phrase}
              </span>
              {!isActive && isVisible && (
                <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
        <div style={{
          width: 2, height: 18,
          background: '#6366f1',
          animation: 'cursorBlink 1s step-end infinite',
          borderRadius: 2,
        }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {lang === 'ar' ? 'جارٍ الكتابة…' : 'Writing…'}
        </span>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function GeneratingCard({ jobId, onComplete, onError, actionType = 'generate_text' }: Props) {
  const { lang } = useLang();
  const isImage = actionType === 'generate_image' || actionType === 'generate_full_post';
  const isVideo = actionType === 'generate_video';

  const stages = useMemo(() => {
    if (isImage || isVideo) return lang === 'ar' ? generatingImageStagesAR : generatingImageStagesEN;
    return lang === 'ar' ? generatingStagesAR : generatingStagesEN;
  }, [lang, isImage, isVideo]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [elapsed, setElapsed]         = useState(0);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef    = useRef(onError);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current    = onError;    }, [onError]);

  useEffect(() => {
    setActiveIndex(0);
    setElapsed(0);
    const phraseTimer = setInterval(() => setActiveIndex(v => Math.min(v + 1, stages.length - 1)), STEP_MS);
    const clock       = setInterval(() => setElapsed(v => v + 1), 1000);
    return () => { clearInterval(phraseTimer); clearInterval(clock); };
  }, [jobId, stages.length]);

  useEffect(() => {
    let alive = true;
    let postCheckRetries = 0;
    const MAX_POST_RETRIES = 10;

    async function poll() {
      while (alive) {
        try {
          const res  = await fetch(`/api/content/status/${jobId}?t=${Date.now()}`);
          if (res.ok) {
            const data = await res.json();
            
            if (data.status === 'completed') {
              const hasResult = data.result && (data.result.text || data.result.image_url || data.result.video_url);
              
              if (hasResult) {
                onCompleteRef.current(data.result);
                break;
              } else {
                // Job completed but result field is empty — n8n might have updated the posts table instead
                const freshPosts = await api.getPosts().catch(() => []);
                // Look for the most recent post (api.getPosts is sorted by created_at DESC)
                const latest = freshPosts[0];
                
                if (latest && (!!latest.text || !!latest.image_url || !!latest.video_url)) {
                  onCompleteRef.current({ 
                    id: latest.id,
                    text: latest.text || '', 
                    image_url: latest.image_url || undefined, 
                    video_url: latest.video_url || undefined 
                  });
                  break;
                } else {
                  postCheckRetries++;
                  if (postCheckRetries >= MAX_POST_RETRIES) {
                    // Give up waiting for a specific post and just finish with empty if possible
                    onCompleteRef.current(data.result || { text: '' });
                    break;
                  }
                  // Continue polling...
                }
              }
            }
            if (data.status === 'failed') { 
              onErrorRef.current(data.error_msg || 'Generation failed'); 
              break; 
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
        await new Promise(r => setTimeout(r, POLL_MS));
      }
    }
    poll();
    return () => { alive = false; };
  }, [jobId]);

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-bg)',
      minHeight: 380,
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: (isImage || isVideo) ? 'center' : 'stretch',
      justifyContent: (isImage || isVideo) ? 'center' : 'flex-start',
      gap: 16,
    }}>
      {(isImage || isVideo)
        ? <ImageGeneratingView stages={stages} activeIndex={activeIndex} elapsed={elapsed} lang={lang} isVideo={isVideo} />
        : <TextGeneratingView  stages={stages} activeIndex={activeIndex} elapsed={elapsed} lang={lang} />
      }

      <style>{`
        @keyframes ringCW   { to { transform: rotate(360deg);  } }
        @keyframes ringCCW  { to { transform: rotate(-360deg); } }
        @keyframes glowPulse{ 0%,100% { opacity:.6; transform:scale(1);    }  50% { opacity:1; transform:scale(1.08); } }
        @keyframes iconBreath{0%,100% { opacity:.7; transform:scale(1);    }  50% { opacity:1; transform:scale(1.12); } }
        @keyframes pulseDot { 0%,100% { opacity:.45; transform:scale(.9); }  50% { opacity:1; transform:scale(1.25); } }
        @keyframes cursorBlink{ 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
