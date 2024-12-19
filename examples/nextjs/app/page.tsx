import { Metadata } from 'next';
import MuxVideo from '@mux/mux-video-react';
import Player from './player';

export const metadata: Metadata = {
  title: 'Mux Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={MuxVideo}
          className="video"
          playbackId="Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008"
          poster="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.webp?time=13"
          controls
          crossOrigin=""
          playsInline
        ></Player>
      </section>
    </>
  );
}
