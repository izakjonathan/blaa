'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useContent } from './Content';
import { heroVideoSettings } from '../lib/hero-video';

const heroSource = '/kroteket/hero-original-v4.mp4';
const heroPoster = '/kroteket/hero-poster-v4.jpg';

function isMp4Image(image: HTMLImageElement | null) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.currentSrc.split('?')[0].endsWith(heroSource));
}

export default function HeroVideo({ revealed = true }: { revealed?: boolean } = {}) {
  const settings = heroVideoSettings(useContent());
  const video = useRef<HTMLVideoElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [playing, setPlaying] = useState(false);
  const [imageSupported, setImageSupported] = useState(false);
  // A native picture source tests image decoding support, not just whether the
  // browser can play MP4 in a video element. Also handle loads before hydration.
  useEffect(() => {
    setImageSupported(isMp4Image(image.current));
  }, []);
  useEffect(() => {
    const media = video.current;
    if (!media || imageSupported) return;
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
    // Retry after the splash releases the hero. A rejected attempt while the
    // page was hidden does not emit another canplay or visibilitychange event.
  }, [revealed, imageSupported]);
  return (
    <div className="hero-video-layer" aria-hidden="true" style={{
      '--hero-video-saturation': settings.saturation / 100,
      '--hero-video-overlay': settings.color,
      '--hero-video-opacity': settings.opacity / 100,
    } as CSSProperties}>
      <picture className="hero-mp4-image" data-active={imageSupported}>
        <source srcSet={heroSource} type="video/mp4" />
        <img ref={image} src={heroPoster} alt="" width={1920} height={1080} loading="eager" fetchPriority="high"
          draggable={false} onLoad={event => setImageSupported(isMp4Image(event.currentTarget))}
          onError={() => { setPlaying(false); setImageSupported(false); }} />
      </picture>
      {!imageSupported && <video ref={video} className="hero-video" data-playing={playing} autoPlay muted loop playsInline controls={false} preload="auto"
        poster={heroPoster} tabIndex={-1} disablePictureInPicture disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setPlaying(false)}>
        <source src={heroSource} type="video/mp4" />
      </video>}
      <div className="hero-video-overlay" data-photo-gradient />
    </div>
  );
}
