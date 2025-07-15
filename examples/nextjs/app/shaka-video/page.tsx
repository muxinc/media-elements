import { Metadata } from 'next';
import ShakaVideo from 'shaka-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Shaka Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={ShakaVideo}
          src="https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8"
          poster="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.webp?time=13"
        />
      </section>
    </>
  );
}
