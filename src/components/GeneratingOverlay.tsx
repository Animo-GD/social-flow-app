'use client';

import { useEffect, useRef, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { GeneratingComposition } from './GeneratingComposition';

const STAGES = [
  'Analyzing topic…',
  'Crafting content…',
  'Optimizing for platform…',
  'Adding hashtags…',
  'Finishing touches…',
];
const POLL_INTERVAL = 2000; // ms
const STAGE_INTERVAL = 4000; // ms — cycle status text

interface Props {
  jobId: string | null;
  onComplete: (result: { text: string; image_url?: string }) => void;
  onError: (msg: string) => void;
}

export default function GeneratingOverlay({ jobId, onComplete, onError }: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Keep callbacks in refs so the polling loop always sees the latest version
  const onCompleteRef = useRef(onComplete);
  const onErrorRef    = useRef(onError);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current    = onError;    }, [onError]);

  // Cycle stage text
  useEffect(() => {
    if (!jobId) return;
    setStage(0);
    setElapsed(0);
    const t = setInterval(() => {
      setStage(s => (s + 1) % STAGES.length);
      setElapsed(e => e + STAGE_INTERVAL / 1000);
    }, STAGE_INTERVAL);
    return () => clearInterval(t);
  }, [jobId]);

  // Poll /api/content/status/:jobId
  useEffect(() => {
    if (!jobId) return;
    let alive = true;

    async function poll() {
      // First poll immediately, then every POLL_INTERVAL
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
          // network blip — keep polling
        }
        // Wait before next check
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }
    }

    poll();
    return () => { alive = false; };
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 13, 26, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Remotion Player */}
      <div style={{ borderRadius: 16, overflow: 'hidden', width: 260, height: 260 }}>
        <Player
          ref={playerRef}
          component={GeneratingComposition}
          inputProps={{ stage }}
          durationInFrames={900}   // 30s at 30fps — loops via CSS
          compositionWidth={260}
          compositionHeight={260}
          fps={30}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          loop
        />
      </div>

      {/* Stage label */}
      <div
        key={stage}
        style={{
          marginTop: 28,
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: 0.5,
          animation: 'fadeStage 0.5s ease',
        }}
      >
        {STAGES[stage]}
      </div>

      {/* Elapsed */}
      <div
        style={{
          marginTop: 8,
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.78rem',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {elapsed}s elapsed
      </div>

      {/* Pulsing dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#0075de',
              animation: `pulse 1.4s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeStage {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
