import { Metadata } from 'next';
import YoutubeVideo from 'youtube-video-element/react';

export const metadata: Metadata = {
  title: 'Youtube Video Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <YoutubeVideo
          className="video"
          src="https://www.youtube.com/watch?v=uxsOYVWclA0"
          controls
          playsInline
        ></YoutubeVideo>
      </section>
    </>
  );
}
