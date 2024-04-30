import { Metadata } from 'next';
import JwplayerVideo from 'jwplayer-video-element/react';

export const metadata: Metadata = {
  title: 'JWPlayer Video Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <JwplayerVideo
          className="video"
          src="https://cdn.jwplayer.com/players/C8YE48zj-IxzuqJ4M.html"
          controls
          playsInline
        ></JwplayerVideo>
      </section>
    </>
  );
}
