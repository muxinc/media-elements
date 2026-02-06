import { Metadata } from 'next';
import TwitchVideo from 'twitch-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Twitch Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={TwitchVideo}
          src="https://www.twitch.tv/videos/675696011"
          config={{
            time: 5,
          }}
        />
      </section>
    </>
  );
}
