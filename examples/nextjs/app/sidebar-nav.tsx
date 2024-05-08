'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link';

export default function SidebarNav() {
  const pathname = usePathname()

  return <nav>
    <ul>
      <li>
        <Link className={`link ${pathname === '/' ? 'active' : ''}`} href="/">mux-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/hls-video' ? 'active' : ''}`} href="/hls-video">hls-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/dash-video' ? 'active' : ''}`} href="/dash-video">dash-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/cloudflare-video' ? 'active' : ''}`} href="/cloudflare-video">cloudflare-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/jwplayer-video' ? 'active' : ''}`} href="/jwplayer-video">jwplayer-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/videojs-video' ? 'active' : ''}`} href="/videojs-video">videojs-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/vimeo-video' ? 'active' : ''}`} href="/vimeo-video">vimeo-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/wistia-video' ? 'active' : ''}`} href="/wistia-video">wistia-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/youtube-video' ? 'active' : ''}`} href="/youtube-video">youtube-video</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/spotify-audio' ? 'active' : ''}`} href="/spotify-audio">spotify-audio</Link>
      </li>
    </ul>
  </nav>
}
