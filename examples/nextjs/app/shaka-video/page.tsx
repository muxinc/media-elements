import { Metadata } from 'next';
import ShakaVideo from 'shaka-video-element/react';

export const metadata: Metadata = {
  title: 'Shaka Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <ShakaVideo
          className="video"
          src="https://stream.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU.m3u8"
          poster="https://image.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU/thumbnail.webp?time=0"
          controls
          crossOrigin=""
          playsInline
        ></ShakaVideo>
      </section>
    </>
  );
}
