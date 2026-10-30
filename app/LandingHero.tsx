"use client";
import { Copy, ContentImage, ContentLink, TitleLines, useContent } from "./Content";

import { useLayoutEffect, useRef, useState } from "react";
import { isReducedMotion } from "../lib/motion";
import BrandSplash, { Bottle } from "./BrandSplash";
import { runSplashSequence, type SplashTarget } from "../lib/splash-sequence";
import { splashSettings } from "../lib/splash";

export default function LandingHero() {
  const settings = splashSettings(useContent());
  // Server HTML already includes the covering splash. Never wait for hydration
  // to turn a previously visible page into a splash screen.
  const [intro, setIntro] = useState<"splash" | "leaving" | "ready">("splash");
  const section = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    let seen = false;
    try { seen = sessionStorage.getItem("plaisir-intro-v2") === "seen"; } catch { /* Private storage can be unavailable. */ }
    const replay = new URLSearchParams(location.search).get('intro') === 'replay';
    if (!settings.enabled || root.dataset.introBoot === "failed" || (seen && !replay) || isReducedMotion() || location.hash || new URLSearchParams(location.search).get('preview') === 'draft' || window.scrollY > 50) {
      root.dataset.introBoot = "skip";
      setIntro("ready");
      return;
    }
    setIntro("splash");
    root.dataset.introBoot = "running";
    root.classList.add("brand-intro-active");
    let cancelled = false, finished = false;
    const animations = new Set<Animation>();
    const timers = new Map<ReturnType<typeof setTimeout>,()=>void>();
    const releaseTimers = () => {timers.forEach((resolve,timer)=>{clearTimeout(timer);resolve();});timers.clear();};
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const remember = () => {try {sessionStorage.setItem('plaisir-intro-v2','seen');} catch { /* Optional storage. */ }};
    const complete = () => {
      finished=true;releaseTimers();
      document.removeEventListener('keydown',stop);document.removeEventListener('pointerdown',stop);reduced.removeEventListener('change',stop);
      root.classList.remove('brand-intro-active');root.dataset.introBoot='ready';setIntro('ready');remember();
    };
    const stop = () => {
      if(cancelled||finished)return;cancelled=true;
      animations.forEach(animation=>animation.cancel());
      releaseTimers();
      complete();
    };
    const wait = (ms:number) => new Promise<void>(resolve=>{const timer=setTimeout(()=>{timers.delete(timer);resolve();},ms);timers.set(timer,resolve);});
    const animate = async(target:SplashTarget,visible:boolean,duration:number,delay=0) => {
      if(cancelled)return;
      const selector={backdrop:'.splash-backdrop',bottle:'.splash-bottle',logo:'.splash-logo',plate:'.brand-splash'}[target];
      const element=section.current?.querySelector<HTMLElement>(selector);
      if(!element)return;
      const movement=target==='bottle'||target==='logo';
      const from=visible?{opacity:0,transform:movement?'translate3d(0,16px,0)':'none'}:{opacity:1,transform:'none'};
      const to=visible?{opacity:1,transform:'none'}:{opacity:0,transform:movement?'translate3d(0,-10px,0)':'none'};
      const animation=element.animate([from,to],{duration,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
      animations.add(animation);
      await animation.finished.catch(()=>{});
    };
    const start = async() => {
      try {
        // Start the splash as soon as its own artwork is decoded. Prepare the
        // hero concurrently, without blocking the first splash frame on fonts.
        const decodePhotos = (selector:string) => Promise.all(Array.from(section.current?.querySelectorAll<HTMLImageElement>(selector)??[]).map(photo=>photo.decode()));
        const heroReady=Promise.race([
          Promise.all([decodePhotos('img.scene-photo'),document.fonts.ready]).catch(()=>{}),
          wait(5000),
        ]).then(()=>{});
        const logo=new Image();logo.src='/kroteket/5f84ffc1-logoblaagardsapotekh-1300x768-1.png';
        const assets=Promise.all([decodePhotos('img.splash-photo'),settings.showLogo?logo.decode():Promise.resolve()]).then(()=>true,()=>false);
        const ready=await Promise.race([assets,wait(5000).then(()=>false)]);
        if(cancelled)return;
        if(!ready){stop();return;}
        await runSplashSequence({active:()=>!cancelled,showBottle:settings.showBottle,showLogo:settings.showLogo,hold:settings.duration,animate,wait,prepareHero:()=>heroReady,
          hero:()=>{root.dataset.introBoot='leaving';setIntro('leaving');},complete});
      } catch {if(!cancelled)stop();}
    };
    void start();
    document.addEventListener('keydown',stop,{once:true});
    document.addEventListener('pointerdown',stop,{once:true});
    reduced.addEventListener('change',stop);
    return () => {
      cancelled=true;animations.forEach(animation=>animation.cancel());releaseTimers();
      root.classList.remove('brand-intro-active');root.dataset.introBoot='skip';
      document.removeEventListener('keydown',stop);document.removeEventListener('pointerdown',stop);reduced.removeEventListener('change',stop);
    };
  }, [settings.enabled, settings.duration, settings.showBottle, settings.showLogo]);

  return <section ref={section} className="scene hero brand-hero" data-intro={intro} aria-labelledby="home-title">
    <ContentImage field="experience.hero.image1" className="scene-photo" fetchPriority="high" loading="eager" sizes="100vw"/>
    <div className="scene-shade" aria-hidden="true" />
    <div className="hero-light" aria-hidden="true" />
    <div className="hero-bottle" aria-hidden="true"><Bottle /></div>
    <div className="scene-content hero-copy">
      <h1 id="home-title"><TitleLines field="experience.hero.title"/></h1>
      <ContentLink className="pill hero-discover" field="experience.hero.link1"><Copy field="experience.hero.text5"/></ContentLink>
    </div>
    <div className="hero-shadow" aria-hidden="true" />
    {settings.enabled && <BrandSplash />}
  </section>;
}
