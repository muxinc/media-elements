import { Metadata } from 'next';
import HlsVideo from 'hls-video-element/react';

export const metadata: Metadata = {
  title: 'HLS Video Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <HlsVideo
          className="video"
          src="https://stream.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU.m3u8"
          poster="https://image.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU/thumbnail.webp?time=0"
          controls
          crossOrigin=""
          playsInline
        ></HlsVideo>
      </section>
    </>
  );
}
