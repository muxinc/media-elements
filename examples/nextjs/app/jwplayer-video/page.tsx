import { Metadata } from 'next';
import JwplayerVideo from 'jwplayer-video-element/react';

export const metadata: Metadata = {
  title: 'JWPlayer Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <JwplayerVideo
          className="video"
          src="https://cdn.jwplayer.com/players/BZ6tc0gy-uoIbMPm3.html"
          controls
          playsInline
        ></JwplayerVideo>
      </section>
    </>
  );
}
