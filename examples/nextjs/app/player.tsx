'use client';

import type React from 'react';
import { Suspense } from 'react';
import PlayerClient from './player.client';

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
  return (
    <Suspense fallback={null}>
      <PlayerClient as={PlayerElement} {...rest}>
        {children}
      </PlayerClient>
    </Suspense>
  );
}
