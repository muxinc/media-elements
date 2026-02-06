import { Metadata } from 'next';
import VimeoVideo from 'vimeo-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'Vimeo Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={VimeoVideo}
          src="https://vimeo.com/648359100"
          poster="https://i.vimeocdn.com/video/1539127996-82b8c8aeb7a7b2c51709cbef3bd0a5a3e0a96b191b3f1c9246c9b357c2ac7996-d_1280"
          config={{
            color: 'ffadef',
          }}
        />
      </section>
    </>
  );
}
