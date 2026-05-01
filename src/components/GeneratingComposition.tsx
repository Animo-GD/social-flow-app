'use client';

import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from 'remotion';

/** A single pulsing ring — light theme version */
function Ring({ delayFrames, radius, color }: { delayFrames: number; radius: number; color: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cycleLen = fps * 2;
  const t = ((frame + delayFrames * (fps / 3)) % cycleLen) / cycleLen;

  const scale   = interpolate(t, [0, 1], [0.6, 1.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = interpolate(t, [0, 0.3, 0.8, 1], [0, 0.55, 0.2, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute',
      width:  radius * 2,
      height: radius * 2,
      borderRadius: '50%',
      border: `1.5px solid ${color}`,
      opacity,
      transform: `scale(${scale})`,
      left: '50%', top: '50%',
      marginLeft: -radius, marginTop: -radius,
      pointerEvents: 'none',
    }} />
  );
}

/** Orbiting particle */
function Particle({ angleOffset, orbitR, size, frame, fps }: { angleOffset: number; orbitR: number; size: number; frame: number; fps: number }) {
  const period = fps * 4;
  const angle  = angleOffset + (frame / period) * Math.PI * 2;
  const x = Math.cos(angle) * orbitR;
  const y = Math.sin(angle) * orbitR;
  const alpha = interpolate(Math.sin(frame / 12 + angleOffset), [-1, 1], [0.3, 1]);

  return (
    <div style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      background: `rgba(0,117,222,${alpha})`,
      left: '50%', top: '50%',
      transform: `translate(${x - size / 2}px, ${y - size / 2}px)`,
    }} />
  );
}

const PARTICLES = [0, 1, 2, 3, 4, 5].map(i => ({
  angleOffset: (i / 6) * Math.PI * 2,
  orbitR: 68,
  size: i % 2 === 0 ? 7 : 5,
}));

export const GeneratingComposition: React.FC<{ stage?: number }> = ({ stage = 0 }) => {
  const frame    = useCurrentFrame();
  const { fps }  = useVideoConfig();

  const appear = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });

  // Gentle whole-comp breathe
  const breathe = 1 + interpolate(Math.sin(frame / (fps * 1.5)), [-1, 1], [-0.015, 0.015]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #f0f6ff 0%, #e8f1ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${appear * breathe})`,
      }}
    >
      {/* Soft backdrop glow */}
      <div style={{
        position: 'absolute',
        width: 200, height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,117,222,0.12) 0%, transparent 70%)',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
      }} />

      {/* Rings */}
      <Ring delayFrames={0} radius={44} color="rgba(0,117,222,0.8)" />
      <Ring delayFrames={1} radius={64} color="rgba(0,117,222,0.5)" />
      <Ring delayFrames={2} radius={84} color="rgba(0,117,222,0.3)" />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} frame={frame} fps={fps} />
      ))}

      {/* Center icon — spinning accent square */}
      <div style={{
        position: 'absolute',
        width: 44, height: 44,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #0075de 0%, #0055b3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,117,222,0.4)',
        transform: `rotate(${interpolate(frame, [0, fps * 8], [0, 360], { extrapolateRight: 'wrap' })}deg)`,
        fontSize: 20,
        color: '#fff',
      }}>
        ✦
      </div>
    </AbsoluteFill>
  );
};
