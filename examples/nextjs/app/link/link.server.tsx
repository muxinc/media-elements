import NextLink from 'next/link';
import ClientLink from './link.client';
import { ComponentPropsWithoutRef, Suspense } from 'react';

type LinkProps = ComponentPropsWithoutRef<typeof NextLink>;

// useSearchParams requires Suspense.
// In SSR it renders fallback.
// On hydration, ClientLink comes in.
export default function Link(props: LinkProps) {
  return (
    <Suspense fallback={<NextLink {...props} />}>
      <ClientLink {...props} />
    </Suspense>
  );
}
