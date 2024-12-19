'use client';

import type React from 'react';

type PolymorphicProps<E extends React.ElementType> = React.PropsWithChildren<React.ComponentProps<E> & {
  as: E;
}>;

export default function Player<T extends React.ElementType>({
  as: PlayerElement,
  children,
  ...rest
}: PolymorphicProps<T>) {
  return (
    <PlayerElement
      {...rest}
      onPlay={(event: Event) => {
        console.log(event.type);
      }}
      onPause={(event: Event) => {
        console.log(event.type);
      }}
    >
      {children}
    </PlayerElement>
  );
}
