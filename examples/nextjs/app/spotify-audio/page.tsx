import { Metadata } from 'next';
import SpotifyAudio from 'spotify-audio-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Spotify Audio - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={SpotifyAudio}
          src="https://open.spotify.com/episode/5Jo9ncrz2liWiKj8inZwD2"
          config={{
            startAt: 20,
            theme: 'dark',
            preferVideo: true,
          }}
        />
      </section>
    </>
  );
}
