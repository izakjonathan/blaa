import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand.css";
import "./motion.css";
import "./header.css";
import "./landing.css";
import "./typography.css";
import "./buttons.css";
import "./venue.css";
import "./footer.css";
import "./image-treatment.css";
import "./photo-parallax.css";
import "./collection.css";
import "./brand-assets.css";
import "./editorial-motion.css";
import "./route-curtain.css";
import { animationSettings } from "../lib/animation-settings";
import { brandStyle } from "../lib/brand";
import SiteShell from "./SiteShell";
import { ContentProvider } from "./Content";
import { readPublished } from "../lib/content-db";
import { createIntroBootstrap, INTRO_CRITICAL_CSS, INTRO_NO_SCRIPT_CSS } from "../lib/intro-bootstrap";
import { splashSettings } from "../lib/splash";
// Published pages are reusable; editor publish/restore invalidates this layout.
export const revalidate = 60;
export const metadata: Metadata = {
  icons: { icon: "/kroteket/3b8926ca-cropped-favicon-32x32.png" },
  title: "Blågårds Apotek · bar & spillested",
  description:
    "Blågårds Apotek — non-profit bar, livemusik og kunst ved Blågårds Plads på Nørrebro. Se koncerter, åbningstider og kontakt.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const published = await readPublished();
  return (
    <html lang="da" data-motion={!animationSettings(published).enabled ? "reduced" : undefined} suppressHydrationWarning>
      <head>
        <style data-brand-palette dangerouslySetInnerHTML={{ __html: brandStyle(published) }}/>
        <link rel="preload" href="/fonts/BricolageGrotesque-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: INTRO_CRITICAL_CSS }}/>
        <script dangerouslySetInnerHTML={{ __html: createIntroBootstrap(splashSettings(published).enabled) }}/>
        <noscript><style>{INTRO_NO_SCRIPT_CSS}</style></noscript>
        <link
          rel="preload"
          href="/fonts/Agilera.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ContentProvider value={published}><SiteShell>{children}</SiteShell></ContentProvider>
      </body>
    </html>
  );
}
