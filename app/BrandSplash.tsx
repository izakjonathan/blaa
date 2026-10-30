"use client";
import type { CSSProperties } from "react";
import { ContentImage, BrandArtwork, useContent } from "./Content";
import { splashSettings } from "../lib/splash";

export default function BrandSplash({ preview = false }: { preview?: boolean }) {
  const settings = splashSettings(useContent());
  return <div className={`brand-splash${preview ? " splash-preview" : ""}`} aria-hidden="true" style={{
    "--splash-overlay": settings.overlay / 100,
    "--splash-logo-scale": settings.logoScale / 100,
  } as CSSProperties}>
    <div className="splash-backdrop"><ContentImage field="splash.background" className="splash-photo" fetchPriority="high" loading="eager" sizes="100vw"/>
    <div className="splash-green" /></div>
    <div className="splash-art">
      {settings.showLogo && <BrandArtwork className="splash-logo" alt="" />}
    </div>
  </div>;
}
