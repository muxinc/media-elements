
'use client';

import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

export default function ParamsLink({ href, ...props }: LinkProps) {
  const url = new URL(`${href}`, 'https://www.mux.com');
  const searchParams = useSearchParams();

  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value) query[key] = value;
  }

  return <Link href={{ pathname: url.pathname, query }} {...props} />;
}
