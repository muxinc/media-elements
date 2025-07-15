import { Metadata } from 'next';
import HlsVideo from 'hls-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'HLS Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={HlsVideo}
          src="https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8"
          poster="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.webp?time=13"
          config={{
            debug: true,
          }}
        >
          <track
            label="thumbnails"
            default
            kind="metadata"
            src="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/storyboard.vtt"
          />
        </Player>
      </section>
    </>
  );
}
