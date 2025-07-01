import { Metadata } from 'next';
import TikTokVideo from 'tiktok-video-element/react';

export const metadata: Metadata = {
  title: 'TikTok Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <TikTokVideo
          className="video"
          video-id="7517433162411068680"
          controls
          playsInline
          slot="media"
        ></TikTokVideo>
      </section>
    </>
  );
}
