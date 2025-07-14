import { Metadata } from 'next';
import WistiaVideo from 'wistia-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Wistia Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={WistiaVideo}
          src="https://wesleyluyten.wistia.com/medias/oifkgmxnkb"
        />
      </section>
    </>
  );
}
