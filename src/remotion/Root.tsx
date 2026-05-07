import React from 'react';
import { Composition } from 'remotion';
import { StudioComposition, CompositionProps } from './StudioComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StudioComposition"
        component={StudioComposition as any}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          mediaUrl: '',
          text: 'Hello World',
          lang: 'en',
          animation: 'fade',
        }}
      />
    </>
  );
};
