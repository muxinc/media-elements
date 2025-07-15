import { Metadata } from 'next';
import TikTokVideo from 'tiktok-video-element/react';

export const metadata: Metadata = {
  title: 'TikTok Video - Media Elements',
};

export default function Page() {
  return (
    <>
      <section>
        <TikTokVideo
          className="video"
          src="6718335390845095173"
          playsInline={true}
          slot="media"
          muted={true}
          config={{
            fullscreen_button: true,
            progress_bar: true,
            play_button: true,
            volume_control: true,
            timestamp: true,
            loop: false,
            autoplay: true,
            music_info: true,
            description: true,
            rel: false,
            native_context_menu: true,
            closed_caption: true, 
          }}
        ></TikTokVideo>
      </section>
    </>
  );
}
