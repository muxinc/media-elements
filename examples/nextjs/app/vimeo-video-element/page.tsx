import { Metadata } from 'next';
import VimeoVideo from 'vimeo-video-element/react';

export const metadata: Metadata = {
  title: 'Vimeo Video Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <VimeoVideo
          className="video"
          src="https://vimeo.com/648359100"
          controls
          playsInline
        ></VimeoVideo>
      </section>
    </>
  );
}
