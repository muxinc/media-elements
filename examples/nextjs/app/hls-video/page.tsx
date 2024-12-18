import { Metadata } from 'next';
import HlsVideo from 'hls-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'HLS Video - Media Elements',
};

type PageProps = {
  searchParams: {
    autoplay: string;
    muted: string;
    preload: string;
  };
};

export default function Page(props: PageProps) {
  return (
    <>
      <section>
        <Player
          as={HlsVideo}
          className="video"
          src="https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8"
          poster="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.webp?time=13"
          controls
          crossOrigin=""
          playsInline
          autoplay={!!props.searchParams?.autoplay}
          muted={!!props.searchParams?.muted}
          preload={props.searchParams?.preload as 'auto' | 'metadata' | 'none'}
          suppressHydrationWarning
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
