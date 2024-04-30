import { Metadata } from 'next';
import WistiaVideo from 'wistia-video-element/react';

export const metadata: Metadata = {
  title: 'Wistia Video Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <WistiaVideo
          className="video"
          src="https://wesleyluyten.wistia.com/medias/oifkgmxnkb"
          controls
          playsInline
        ></WistiaVideo>
      </section>
    </>
  );
}
