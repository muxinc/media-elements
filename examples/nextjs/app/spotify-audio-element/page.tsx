import { Metadata } from 'next';
import SpotifyAudio from 'spotify-audio-element/react';

export const metadata: Metadata = {
  title: 'Spotify Audio Element - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <SpotifyAudio
          style={{ width: 500 }}
          src="https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5"
          controls
        ></SpotifyAudio>
      </section>
    </>
  );
}
