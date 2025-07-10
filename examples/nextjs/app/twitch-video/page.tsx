import { Metadata } from 'next';
import TwitchVideo from 'twitch-video-element/react';

export const metadata: Metadata = {
  title: 'Twitch Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <TwitchVideo
          className="video"
          config={{
            time: 5,
          }}
          src="https://www.twitch.tv/videos/106400740"
          controls
          playsInline
        ></TwitchVideo>
      </section>
    </>
  );
}
