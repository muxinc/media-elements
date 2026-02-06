import { Metadata } from 'next';
import YoutubeVideo from 'youtube-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Youtube Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={YoutubeVideo}
          src="https://www.youtube.com/watch?v=uxsOYVWclA0"
          config={{
            start: 20,
          }}
        />
      </section>
    </>
  );
}
