'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link';

export default function SidebarNav() {
  const pathname = usePathname()

  return <nav>
    <ul>
      <li>
        <Link className={`link ${pathname === '/' ? 'active' : ''}`} href="/">hls-video-element</Link>
      </li>
     <li>
        <Link className={`link ${pathname === '/dash-video-element' ? 'active' : ''}`} href="/dash-video-element">dash-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/cloudflare-video-element' ? 'active' : ''}`} href="/cloudflare-video-element">cloudflare-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/jwplayer-video-element' ? 'active' : ''}`} href="/jwplayer-video-element">jwplayer-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/videojs-video-element' ? 'active' : ''}`} href="/videojs-video-element">videojs-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/vimeo-video-element' ? 'active' : ''}`} href="/vimeo-video-element">vimeo-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/wistia-video-element' ? 'active' : ''}`} href="/wistia-video-element">wistia-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/youtube-video-element' ? 'active' : ''}`} href="/youtube-video-element">youtube-video-element</Link>
      </li>
      <li>
        <Link className={`link ${pathname === '/spotify-audio-element' ? 'active' : ''}`} href="/spotify-audio-element">spotify-audio-element</Link>
      </li>
    </ul>
  </nav>
}
