import { Metadata } from 'next';
import HlsVideo from 'hls-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'HLS Video - Media Elements',
};

type PageProps = {
  params: Promise<{
    autoplay: string;
    muted: string;
    preload: string;
  }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
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
          autoplay={!!params?.autoplay}
          muted={!!params?.muted}
          preload={params?.preload as 'auto' | 'metadata' | 'none'}
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
