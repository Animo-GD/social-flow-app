'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLang } from '@/lib/LanguageContext';
import { generatingStagesEN, generatingStagesAR } from '@/lib/generatingStages';

const Player = dynamic(
  () => import('@remotion/player').then(m => m.Player),
  { ssr: false }
);
const GeneratingComposition = dynamic(
  () => import('./GeneratingComposition').then(m => m.GeneratingComposition),
  { ssr: false }
);

const POLL_MS  = 2000;
const STAGE_MS = 5000;

interface Props {
  jobId: string;
  onComplete: (result: { text: string; image_url?: string }) => void;
  onError:    (msg: string) => void;
}

export default function GeneratingCard({ jobId, onComplete, onError }: Props) {
  const { lang } = useLang();
  const stages   = lang === 'ar' ? generatingStagesAR : generatingStagesEN;

  const [stage,   setStage]   = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef    = useRef(onError);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current    = onError;    }, [onError]);

  // Reset + cycle stages
  useEffect(() => {
    setStage(0); setElapsed(0);

    const stageTimer = setInterval(() =>
      setStage(s => Math.min(s + 1, stages.length - 1)), STAGE_MS);

    const clock = setInterval(() => setElapsed(e => e + 1), 1000);

    return () => { clearInterval(stageTimer); clearInterval(clock); };
  }, [jobId, stages.length]);

  // Poll status
  useEffect(() => {
    let alive = true;
    async function poll() {
      while (alive) {
        try {
          const res = await fetch(`/api/content/status/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') { onCompleteRef.current(data.result ?? {}); break; }
            if (data.status === 'failed')    { onErrorRef.current(data.error_msg || 'Generation failed'); break; }
          }
        } catch { /* blip */ }
        await new Promise(r => setTimeout(r, POLL_MS));
      }
    }
    poll();
    return () => { alive = false; };
  }, [jobId]);

  const pct = Math.round(((stage + 1) / stages.length) * 100);

  return (
    <div style={{
      border:       '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow:     'hidden',
      background:   'var(--color-bg)',
      boxShadow:    'var(--shadow-card)',
      display:      'flex',
      flexDirection:'column',
      minHeight:    380,
    }}>

      {/* ── Header ── */}
      <div style={{
        background:   'linear-gradient(90deg, #0075de 0%, #005bab 100%)',
        padding:      '12px 18px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#fff',
            animation: 'sfBlink 1s ease-in-out infinite',
          }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', letterSpacing: 0.3 }}>
            {lang === 'ar' ? 'جارٍ التوليد بالذكاء الاصطناعي' : 'AI Generating'}
          </span>
        </div>
        <span style={{
          color:        'rgba(255,255,255,0.75)',
          fontSize:     '0.78rem',
          fontVariantNumeric: 'tabular-nums',
          background:   'rgba(0,0,0,0.2)',
          padding:      '2px 10px',
          borderRadius: 99,
        }}>
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
        </span>
      </div>

      {/* ── Remotion animation ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
        padding:        '28px 0 12px',
        background:     'linear-gradient(160deg, #f0f6ff 0%, #e8f1ff 100%)',
      }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', width: 180, height: 180 }}>
          <Player
            component={GeneratingComposition as React.ComponentType<Record<string, unknown>>}
            inputProps={{ stage }}
            durationInFrames={900}
            compositionWidth={180}
            compositionHeight={180}
            fps={30}
            style={{ width: '100%', height: '100%' }}
            autoPlay
            loop
          />
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: '0 20px', background: 'linear-gradient(160deg, #f0f6ff 0%, #e8f1ff 100%)' }}>
        <div style={{
          height:       4,
          borderRadius: 99,
          background:   'rgba(0,117,222,0.15)',
          overflow:     'hidden',
        }}>
          <div style={{
            height:     '100%',
            width:      `${pct}%`,
            borderRadius: 99,
            background: 'linear-gradient(90deg, #0075de, #38b2f5)',
            transition: 'width 0.8s ease',
          }} />
        </div>
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          marginTop:      5,
          fontSize:       '0.72rem',
          color:          'rgba(0,117,222,0.7)',
          fontWeight:     600,
        }}>
          <span>{pct}%</span>
          <span>{lang === 'ar' ? 'اكتمل' : 'complete'}</span>
        </div>
      </div>

      {/* ── Stage steps ── */}
      <div style={{
        padding:    '16px 20px 20px',
        background: 'var(--color-bg)',
        flex:       1,
        display:    'flex',
        flexDirection: 'column',
        gap:        10,
      }}>
        {stages.map((label, i) => {
          const done    = i < stage;
          const current = i === stage;
          return (
            <div key={i} style={{
              display:    'flex',
              alignItems: 'center',
              gap:        12,
              direction:  lang === 'ar' ? 'rtl' : 'ltr',
            }}>
              {/* Step dot */}
              <div style={{
                flexShrink:   0,
                width:        22, height: 22,
                borderRadius: '50%',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     11,
                fontWeight:   700,
                background:   done    ? '#0075de'
                            : current ? 'rgba(0,117,222,0.12)'
                            :           'var(--color-bg-warm)',
                border:       current ? '2px solid #0075de' : '2px solid transparent',
                color:        done    ? '#fff'
                            : current ? '#0075de'
                            :           'var(--color-text-muted)',
                transition:   'all 0.4s ease',
              }}>
                {done ? '✓' : i + 1}
              </div>

              {/* Label */}
              <span style={{
                fontSize:   '0.82rem',
                fontWeight: current ? 600 : 400,
                color:      done    ? 'var(--color-text-secondary)'
                          : current ? 'var(--color-text-primary)'
                          :           'var(--color-text-muted)',
                transition: 'all 0.3s ease',
                animation:  current ? 'sfFadeIn 0.4s ease' : 'none',
              }}>
                {label}
              </span>

              {/* Spinner for current */}
              {current && (
                <div style={{
                  marginInlineStart: 'auto',
                  display:           'flex',
                  gap:               4,
                }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{
                      width:  4, height: 4, borderRadius: '50%',
                      background: '#0075de',
                      animation: `sfDot 1.2s ${d * 0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes sfBlink  { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes sfFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sfDot    { 0%,100%{opacity:.2;transform:scale(.7)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>
    </div>
  );
}
