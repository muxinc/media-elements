import { Metadata } from 'next';
import MuxVideo from '@mux/mux-video-react';
import Player from './player';

export const metadata: Metadata = {
  title: 'Mux Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={MuxVideo}
          className="video"
          playbackId="jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU"
          poster="https://image.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU/thumbnail.webp?time=0"
          controls
          crossOrigin=""
          playsInline
        ></Player>
      </section>
    </>
  );
}
