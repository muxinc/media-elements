import { Metadata } from 'next';
import TikTokVideo from 'tiktok-video-element/react';
import Player from '../player';

export const metadata: Metadata = {
  title: 'TikTok Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          as={TikTokVideo}
          src="https://www.tiktok.com/@_luwes/video/7527476667770522893"
          config={{
            fullscreen_button: true,
            progress_bar: true,
            play_button: true,
            volume_control: true,
            timestamp: true,
            music_info: false,
            description: false,
            rel: false,
            native_context_menu: true,
            closed_caption: false,
          }}
        />
      </section>
    </>
  );
}
