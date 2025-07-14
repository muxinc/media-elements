import { Metadata } from 'next';
import CloudflareVideo from 'cloudflare-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Cloudflare Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={CloudflareVideo}
          src="https://watch.videodelivery.net/bfbd585059e33391d67b0f1d15fe6ea4"
        />
      </section>
    </>
  );
}
