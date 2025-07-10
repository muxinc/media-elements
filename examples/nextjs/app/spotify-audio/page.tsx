import { Metadata } from 'next';
import SpotifyAudio from 'spotify-audio-element/react';

export const metadata: Metadata = {
  title: 'Spotify Audio - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <SpotifyAudio
          className="video"
          src="https://open.spotify.com/episode/5Jo9ncrz2liWiKj8inZwD2"
          controls
          config={{
            startAt: 20,
            theme: 'dark',
            preferVideo: true,
          }}
        ></SpotifyAudio>
      </section>
    </>
  );
}
