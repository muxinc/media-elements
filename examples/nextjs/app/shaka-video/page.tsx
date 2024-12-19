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
          src="https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8"
          poster="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.webp?time=13"
          controls
          crossOrigin=""
          playsInline
        ></ShakaVideo>
      </section>
    </>
  );
}
