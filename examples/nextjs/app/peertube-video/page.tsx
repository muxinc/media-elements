import { Metadata } from 'next';
import PeertubeVideo from 'peertube-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'PeerTube Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={PeertubeVideo}
          src="https://video.mshparisnord.fr/w/7r2FxoQdYjun6tYWJfHUCa"
          config={{
            p2p: 0,
            warningTitle: 0,
            peertubeLink: 0,
          }}
        />
      </section>
    </>
  );
}
