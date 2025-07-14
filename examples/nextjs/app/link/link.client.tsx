'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ParsedUrlQueryInput } from 'querystring';
import { ComponentPropsWithoutRef } from 'react';

type LinkProps = ComponentPropsWithoutRef<typeof NextLink>;
export default function ClientLink({ href, ...rest }: LinkProps) {
  const searchParams = useSearchParams();

  let _href: LinkProps['href'] =
    typeof href === 'string'
      ? {
          pathname: href,
        }
      : href;

  // if it's a local link, persist searchParams colors
  const isLocalLink = _href.pathname?.startsWith('/');
  if (isLocalLink && !_href.query) {
    const query: ParsedUrlQueryInput = {};

    for (const [key, value] of searchParams.entries()) {
      if (value) query[key] = value;
    }

    _href.query = query;
  }

  return <NextLink {...rest} href={_href} />;
}
