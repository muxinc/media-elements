import { Metadata } from 'next';
import CloudflareVideo from 'cloudflare-video-element/react';

export const metadata: Metadata = {
  title: 'Cloudflare Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <CloudflareVideo
          className="video"
          src="https://watch.videodelivery.net/bfbd585059e33391d67b0f1d15fe6ea4"
          controls
          playsInline
        ></CloudflareVideo>
      </section>
    </>
  );
}
