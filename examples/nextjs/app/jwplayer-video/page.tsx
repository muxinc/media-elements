import { Metadata } from 'next';
import JwplayerVideo from 'jwplayer-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'JWPlayer Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={JwplayerVideo}
          src="https://cdn.jwplayer.com/players/BZ6tc0gy-uoIbMPm3.html"
        />
      </section>
    </>
  );
}
