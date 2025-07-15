'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Nav() {
  const searchParams = useSearchParams();
  const isMuted = !!searchParams.get('muted');
  const params = new URLSearchParams(searchParams);
  const pathname = usePathname();
  const { replace } = useRouter();

  return (
    <nav>
      <div className="left nav-section">
        <button
          className="mute-toggle toggle"
          onClick={() => {
            if (isMuted) {
              params.delete('muted');
            } else {
              params.set('muted', '1');
            }
            replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-live="polite"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
            {isMuted ? (
              // Muted icon
              <>
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </>
            ) : (
              // Unmuted icon
              <>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </>
            )}
          </svg>
        </button>
      </div>
      <div className="right nav-section">
        <button
          className="theme-toggle toggle"
          id="theme-toggle"
          title="Toggles light & dark"
          aria-label="auto"
          aria-live="polite"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
            <mask id="moon">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <circle cx="40" cy="8" r="11" fill="black" />
            </mask>
            <circle id="sun" cx="12" cy="12" r="11" mask="url(#moon)" />
            <g id="sun-beams">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
          </svg>
        </button>
        <a href="https://github.com/muxinc/media-elements" title="Source on Github">
          GitHub
        </a>
      </div>
    </nav>
  );
}
