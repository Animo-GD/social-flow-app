'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { generatingStagesEN, generatingStagesAR } from '@/lib/generatingStages';

const POLL_MS = 2000;
const STEP_MS = 1800;

interface Props {
  jobId: string;
  onComplete: (result: { text: string; image_url?: string }) => void;
  onError: (msg: string) => void;
}

export default function GeneratingCard({ jobId, onComplete, onError }: Props) {
  const { lang } = useLang();
  const phrases = useMemo(
    () => (lang === 'ar' ? generatingStagesAR : generatingStagesEN),
    [lang]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setActiveIndex((v) => Math.min(v + 1, phrases.length - 1));
    }, STEP_MS);

    const clock = setInterval(() => {
      setElapsed((v) => v + 1);
    }, 1000);

    return () => {
      clearInterval(phraseTimer);
      clearInterval(clock);
    };
  }, [jobId, phrases.length]);

  useEffect(() => {
    let alive = true;

    async function poll() {
      while (alive) {
        try {
          const res = await fetch(`/api/content/status/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              onCompleteRef.current(data.result ?? {});
              break;
            }
            if (data.status === 'failed') {
              onErrorRef.current(data.error_msg || 'Generation failed');
              break;
            }
          }
        } catch {
          // ignore transient errors
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    }

    poll();
    return () => {
      alive = false;
    };
  }, [jobId]);

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg)',
        minHeight: 380,
        padding: '24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {lang === 'ar' ? 'Generating content' : 'Generating content'}
        </span>
        <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {phrases.map((phrase, i) => {
          const isVisible = i <= activeIndex;
          const isActive = i === activeIndex;

          return (
            <div
              key={`${phrase}-${i}`}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 260ms ease, transform 260ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                direction: lang === 'ar' ? 'rtl' : 'ltr',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isActive ? '#0075de' : 'var(--color-text-muted)',
                  animation: isActive ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {phrase}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: .45; transform: scale(.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
