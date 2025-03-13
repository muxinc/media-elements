import { Metadata } from 'next';
import YoutubeVideo from 'youtube-video-element/react';

export const metadata: Metadata = {
  title: 'Youtube Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <YoutubeVideo
          className="video"
          config={{
            start: 20,
          }}
          src="https://www.youtube.com/watch?v=uxsOYVWclA0"
          controls
          playsInline
        ></YoutubeVideo>
      </section>
    </>
  );
}
