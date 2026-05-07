import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CompositionProps {
  mediaUrl: string;
  text: string;
  lang: 'en' | 'ar';
  animation: 'none' | 'fade' | 'slide_up';
}

export const StudioComposition: React.FC<CompositionProps> = ({ mediaUrl, text, lang, animation }) => {
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
