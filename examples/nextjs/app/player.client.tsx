'use client';

import type React from 'react';
import { useSearchParams } from 'next/navigation';

type PolymorphicProps<E extends React.ElementType> = React.PropsWithChildren<
  React.ComponentProps<E> & {
    as: E;
  }
>;

export default function Player<T extends React.ElementType>({
  as: PlayerElement,
  children,
  ...rest
}: PolymorphicProps<T>) {
  const searchParams = useSearchParams();
  const autoPlay = !!searchParams.get('autoplay');
  const muted = !!searchParams.get('muted');
  const preload = searchParams.get('preload') as 'auto' | 'metadata' | 'none' | undefined;
  const controls = searchParams.get('controls') !== '0';

  return (
    <PlayerElement
      className="video"
      controls={controls}
      playsInline
      crossOrigin=""
      autoPlay={autoPlay}
      defaultMuted={muted}
      muted={muted}
      preload={preload}
      suppressHydrationWarning
      onPlay={(event: Event) => {
        console.log(event.type);
      }}
      onPause={(event: Event) => {
        console.log(event.type);
      }}
      {...rest}
    >
      {children}
    </PlayerElement>
  );
}
