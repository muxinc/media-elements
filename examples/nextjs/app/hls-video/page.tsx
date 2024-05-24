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
          className="video"
          src="https://stream.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU.m3u8"
          poster="https://image.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU/thumbnail.webp?time=0"
          controls
          crossOrigin=""
          playsInline
          suppressHydrationWarning
        >
          <track
            label="thumbnails"
            default
            kind="metadata"
            src="https://image.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU/storyboard.vtt"
          />
        </Player>
      </section>
    </>
  );
}
