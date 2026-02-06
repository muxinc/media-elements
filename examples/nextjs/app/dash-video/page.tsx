import { Metadata } from 'next';
import DashVideo from 'dash-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Dash Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={DashVideo}
          src="https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
          poster="https://image.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/thumbnail.webp?time=13"
        />
      </section>
    </>
  );
}
