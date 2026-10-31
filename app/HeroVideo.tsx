'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useContent } from './Content';
import { heroVideoSettings } from '../lib/hero-video';

export default function HeroVideo() {
  const settings = heroVideoSettings(useContent());
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    // Set DOM properties before play() for muted inline playback on Safari.
    media.muted = true;
    media.defaultMuted = true;
    media.playsInline = true;
    const sync = () => {
      if (document.hidden) media.pause();
      else if (media.paused) void media.play().catch(() => { /* Keep the poster if autoplay is blocked. */ });
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('loadeddata', sync);
    media.addEventListener('canplay', sync);
    media.addEventListener('pause', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('loadeddata', sync);
      media.removeEventListener('canplay', sync);
      media.removeEventListener('pause', sync);
      media.pause();
    };
  }, []);
  return (
    <div className="hero-video-layer" aria-hidden="true" style={{
      '--hero-video-saturation': settings.saturation / 100,
      '--hero-video-overlay': settings.color,
      '--hero-video-opacity': settings.opacity / 100,
    } as CSSProperties}>
      <video ref={video} className="hero-video" data-playing={playing} autoPlay muted loop playsInline controls={false} preload="auto"
        poster="/kroteket/hero-poster.jpg" tabIndex={-1} disablePictureInPicture disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setPlaying(false)}>
        <source src="/kroteket/hero-v2.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay" />
    </div>
  );
}
