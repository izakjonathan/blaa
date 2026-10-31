'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useContent } from './Content';
import { heroVideoSettings } from '../lib/hero-video';

export default function HeroVideo() {
  const settings = heroVideoSettings(useContent());
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (reduced.matches || document.hidden || userPaused.current) media.pause();
      else void media.play().catch(() => setPlaying(false));
    };
    sync();
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      media.pause();
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  const toggle = () => {
    const media = video.current;
    if (!media) return;
    if (!media.paused) { userPaused.current = true; media.pause(); }
    else { userPaused.current = false; void media.play().catch(() => setPlaying(false)); }
  };
  return <>
    <div className="hero-video-layer" aria-hidden="true" style={{
      '--hero-video-saturation': settings.saturation / 100,
      '--hero-video-overlay': settings.color,
      '--hero-video-opacity': settings.opacity / 100,
    } as CSSProperties}>
      <video ref={video} className="hero-video" autoPlay muted loop playsInline preload="auto"
        poster="/kroteket/hero-poster.jpg" tabIndex={-1} disablePictureInPicture
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setPlaying(false)}>
        <source src="/kroteket/hero.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay" />
    </div>
    <button type="button" className="hero-video-toggle" onClick={toggle} aria-label={playing ? 'Pause background video' : 'Play background video'}>
      {playing ? 'Pause video' : 'Play video'}
    </button>
  </>;
}
