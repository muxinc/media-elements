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
          src="https://www.tiktok.com/@_luwes/video/7527453781764689207"
          config={{
            fullscreen_button: true,
            progress_bar: true,
            play_button: true,
            volume_control: true,
            timestamp: true,
            music_info: true,
            description: true,
            rel: false,
            native_context_menu: true,
            closed_caption: true, 
          }}
        />
      </section>
    </>
  );
}
