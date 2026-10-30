import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./brand.css";
import "./motion.css";
import "./header.css";
import "./landing.css";
import "./typography.css";
import "./buttons.css";
import "./bottle-accents.css";
import "./footer.css";
import "./image-treatment.css";
import "./collection.css";
import "./brand-assets.css";
import "./venue.css";
import { brandStyle } from "../lib/brand";
import SiteShell from "./SiteShell";
import { ContentProvider } from "./Content";
import { readPublished } from "../lib/content-db";
import { createIntroBootstrap, INTRO_CRITICAL_CSS, INTRO_NO_SCRIPT_CSS } from "../lib/intro-bootstrap";
import { splashSettings } from "../lib/splash";
// Published pages are reusable; editor publish/restore invalidates this layout.
export const revalidate = 60;
export const metadata: Metadata = {
  title: { default: "Blågårds Apotek · Kroteket", template: "%s · Blågårds Apotek" },
  icons: { icon: "/kroteket/3b8926ca-cropped-favicon-32x32.png" },
  description:
    "Non-profit bar og spillested på Blågårds Plads, Nørrebro. Livemusik, 18 ølhaner og skiftende kunstudstillinger.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const published = await readPublished();
  return (
    <html lang="da" suppressHydrationWarning>
      <head>
        <style data-brand-palette dangerouslySetInnerHTML={{ __html: brandStyle(published) }}/>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet" />
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
