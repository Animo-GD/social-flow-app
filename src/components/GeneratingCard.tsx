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
  onComplete: (result: { text: string; image_url?: string; video_url?: string }) => void;
  onError: (msg: string) => void;
  actionType?: 'generate_text' | 'generate_image' | 'generate_both' | 'generate_video';
}

const SPARKLES = [
  { top: '15%', left: '20%', delay: '0s',   dur: '2.1s',  size: 6 },
  { top: '30%', left: '75%', delay: '0.4s', dur: '1.7s',  size: 4 },
  { top: '60%', left: '15%', delay: '0.9s', dur: '2.4s',  size: 5 },
  { top: '70%', left: '60%', delay: '0.2s', dur: '1.9s',  size: 7 },
  { top: '80%', left: '40%', delay: '1.1s', dur: '2.2s',  size: 4 },
  { top: '45%', left: '88%', delay: '0.6s', dur: '1.6s',  size: 5 },
  { top: '12%', left: '55%', delay: '1.4s', dur: '2.0s',  size: 3 },
  { top: '90%', left: '80%', delay: '0.3s', dur: '2.5s',  size: 6 },
];

function ImageGeneratingView({ stages, activeIndex, elapsed, lang, isVideo }: {
  stages: string[];
  activeIndex: number;
  elapsed: number;
  lang: string;
  isVideo?: boolean;
}) {
  const progress = Math.min(Math.round((activeIndex / (stages.length - 1)) * 100), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        height: 220,
        background: isVideo ? 'linear-gradient(135deg, #2d3436 0%, #000000 100%)' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerSweep 2.2s linear infinite',
        }} />

        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 120, height: 120, borderRadius: '50%',
          background: isVideo ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)',
          animation: 'blobPulse 3.5s ease-in-out infinite',
          filter: 'blur(18px)',
        }} />

        {SPARKLES.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: '#fff',
            animation: `sparkleFloat ${s.dur} ease-in-out infinite ${s.delay}`,
            boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.9)`,
          }} />
        ))}

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: '2.5rem', animation: 'iconSpin 3s linear infinite' }}>{isVideo ? '🎬' : '🎨'}</span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {lang === 'ar' ? (isVideo ? 'جارٍ المعالجة…' : 'جارٍ الرسم…') : (isVideo ? 'Processing…' : 'Painting…')}
          </span>
        </div>

        <span style={{
          position: 'absolute', top: 12, right: 14,
          fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
          fontVariantNumeric: 'tabular-nums', fontWeight: 600,
        }}>
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{stages[activeIndex]}</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 999,
            background: isVideo ? 'linear-gradient(90deg, #636e72, #000000)' : 'linear-gradient(90deg, #6366f1, #ec4899)',
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

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
          const isActive = i === activeIndex;
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
                opacity: !isActive && isVisible ? 0.6 : 1,
              }}>
                {phrase}
              </span>
              {!isActive && isVisible && <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>✓</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
        <div style={{ width: 2, height: 18, background: '#6366f1', animation: 'cursorBlink 1s step-end infinite', borderRadius: 2 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {lang === 'ar' ? 'جارٍ الكتابة…' : 'Writing…'}
        </span>
      </div>
    </>
  );
}

export default function GeneratingCard({ jobId, onComplete, onError, actionType = 'generate_text' }: Props) {
  const { lang } = useLang();
  const isImage = actionType === 'generate_image' || actionType === 'generate_both';
  const isVideo = actionType === 'generate_video';

  const stages = useMemo(() => {
    if (isVideo) return lang === 'ar' ? generatingImageStagesAR : generatingImageStagesEN; // Reusing image stages for video for now
    if (isImage) return lang === 'ar' ? generatingImageStagesAR : generatingImageStagesEN;
    return lang === 'ar' ? generatingStagesAR : generatingStagesEN;
  }, [lang, isImage, isVideo]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    setActiveIndex(0);
    setElapsed(0);
    const phraseTimer = setInterval(() => {
      setActiveIndex((v) => Math.min(v + 1, stages.length - 1));
    }, STEP_MS);
    const clock = setInterval(() => { setElapsed((v) => v + 1); }, 1000);
    return () => { clearInterval(phraseTimer); clearInterval(clock); };
  }, [jobId, stages.length]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      while (alive) {
        try {
          const res = await fetch(`/api/content/status/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              // Wait for post status if result is empty (fallback to checking posts table)
              if (!data.result || (!data.result.text && !data.result.image_url && !data.result.video_url)) {
                const freshPosts = await api.getPosts().catch(() => []);
                const latestWithContent = freshPosts.find((p) => !!p.text || !!p.image_url || !!p.video_url);
                if (latestWithContent && latestWithContent.status !== null) {
                   onCompleteRef.current({ 
                     text: latestWithContent.text || '', 
                     image_url: latestWithContent.image_url || undefined,
                     video_url: latestWithContent.video_url || undefined
                   });
                   break;
                }
                // If post not found yet, continue polling even if job is "completed"
              } else {
                onCompleteRef.current(data.result ?? {});
                break;
              }
            }
            if (data.status === 'failed') { onErrorRef.current(data.error_msg || 'Generation failed'); break; }
          }
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, POLL_MS));
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
      padding: '24px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {(isImage || isVideo)
        ? <ImageGeneratingView stages={stages} activeIndex={activeIndex} elapsed={elapsed} lang={lang} isVideo={isVideo} />
        : <TextGeneratingView  stages={stages} activeIndex={activeIndex} elapsed={elapsed} lang={lang} />
      }

      <style>{`
        @keyframes shimmerSweep { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes blobPulse { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.15) translate(5px,-5px)} }
        @keyframes sparkleFloat { 0%{opacity:0;transform:scale(0) translateY(0)} 40%{opacity:1;transform:scale(1) translateY(-12px)} 100%{opacity:0;transform:scale(0) translateY(-28px)} }
        @keyframes iconSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes paletteBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulseDot { 0%,100%{opacity:.45;transform:scale(.9)} 50%{opacity:1;transform:scale(1.25)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
