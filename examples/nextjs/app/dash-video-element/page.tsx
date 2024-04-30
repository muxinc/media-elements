import { Metadata } from 'next';
import DashVideo from 'dash-video-element/react';

export const metadata: Metadata = {
  title: 'Dash Video Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <DashVideo
          className="video"
          src="https://player.vimeo.com/external/648359100.mpd?s=a4419a2e2113cc24a87aef2f93ef69a8e4c8fb0c"
          poster="https://image.mux.com/jtWZbHQ013SLyISc9LbIGn8f4c3lWan00qOkoPMZEXmcU/thumbnail.webp?time=0"
          controls
          playsInline
        ></DashVideo>
      </section>
    </>
  );
}
