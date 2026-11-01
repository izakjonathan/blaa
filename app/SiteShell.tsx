"use client";
import { Copy, ContentLink, BrandArtwork } from "./Content";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useCallback, type ReactNode, type MouseEvent, type CSSProperties } from "react";
import { afterPaint, cssTimeMs, isReducedMotion } from "../lib/motion";
import PageMotion from "./PageMotion";
import EditorialPhotos from "./EditorialPhotos";
import MenuLabel from "./MenuLabel";
import PhotoParallax from "./PhotoParallax";
import { useHeaderTone } from "./useHeaderTone";
import { useFooterEntrance } from "./useFooterEntrance";
const areas = [{"href": "/", "label": "Forside", "description": "Bar, musik & godt selskab"}, {"href": "/events", "label": "Koncerter", "description": "Jazz, sangskrivere & livemusik"}, {"href": "/om-os", "label": "Om os", "description": "Et samlingssted på Nørrebro"}, {"href": "/galleri", "label": "Galleri", "description": "Livet på Apoteket"}, {"href": "/spil-hos-os", "label": "Spil hos os", "description": "Bliv en del af musikken"}, {"href": "/kunst", "label": "Kunst", "description": "Udstil på Apoteket"}, {"href": "/kontakt", "label": "Kontakt", "description": "Find vej & skriv til os"}];
type Phase = "closed" | "opening" | "open" | "closing";
function MarketingShell({ children }: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const headerTone = useHeaderTone(pathname);
    useFooterEntrance(pathname);
    const panel = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    const keyboard = useRef(false);
    const lastPathname = useRef(pathname);
    const navigating = useRef(false);
    const [phase, setPhase] = useState<Phase>("closed");
    const mounted = phase !== "closed";
    const visible = phase === "open";
    const expanded = phase === "opening" || visible;
    // The menu is unmounted when closed, so its links cannot prefetch early.
    // Warm the small route set after initial rendering; opening also refreshes
    // the cache for visitors who have spent a long time on the current page.
    useEffect(() => {
        const timer = setTimeout(() => {
            areas.forEach(area => {
                if (area.href !== pathname) router.prefetch(area.href);
            });
        }, 1500);
        return () => clearTimeout(timer);
    }, [router, pathname]);
    useEffect(() => {
        if (phase !== "opening") return;
        areas.forEach(area => {
            if (area.href !== pathname) router.prefetch(area.href);
        });
    }, [phase, router, pathname]);
    const finish = useCallback(() => {
        document.documentElement.classList.remove("menu-navigating");
        setPhase("closed");
        if (keyboard.current && !navigating.current)
            button.current?.focus({ preventScroll: true });
        navigating.current = false;
    }, []);
    useEffect(() => {
        if (phase !== "opening")
            return;
        if (isReducedMotion()) {
            setPhase("open");
            return;
        }
        return afterPaint(() => setPhase("open"));
    }, [phase]);
    useEffect(() => {
        if (phase !== "closing")
            return;
        if (isReducedMotion()) {
            finish();
            return;
        }
        const timer = setTimeout(finish, cssTimeMs("--duration-menu", 680) + 100);
        return () => clearTimeout(timer);
    }, [phase, finish]);
    useLayoutEffect(() => {
        const regions = [...document.querySelectorAll<HTMLElement>("main, .brand-footer, .skip-link")];
        regions.forEach(region => { region.inert = mounted; });
        document.documentElement.classList.toggle("menu-open", mounted);
        const preventBackgroundDrag = (event: TouchEvent) => {
            if (mounted && !(event.target instanceof Node && panel.current?.contains(event.target)))
                event.preventDefault();
        };
        if (mounted)
            document.addEventListener("touchmove", preventBackgroundDrag, { passive: false });
        return () => {
            document.removeEventListener("touchmove", preventBackgroundDrag);
            regions.forEach(region => { region.inert = false; });
            document.documentElement.classList.remove("menu-open");
        };
    }, [mounted, pathname]);
    useLayoutEffect(() => {
        if (lastPathname.current === pathname)
            return;
        lastPathname.current = pathname;
        if (navigating.current) {
            // Next's automatic restoration is disabled for menu links. Jump while
            // the menu still covers the destination, never with anchor smoothing.
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
        if (mounted)
            return afterPaint(() => setPhase("closing"));
    }, [pathname, mounted]);
    useEffect(() => () => {
        document.documentElement.classList.remove("menu-navigating");
    }, []);
    useEffect(() => {
        if (!mounted)
            return;
        const links = [...(panel.current?.querySelectorAll<HTMLElement>('a[href]') ?? [])];
        const focusable = [button.current, ...links].filter((el): el is HTMLElement => Boolean(el));
        if (visible && keyboard.current)
            links[0]?.focus({ preventScroll: true });
        const onKey = (event: KeyboardEvent) => {
            if (expanded && event.key === "Escape") {
                event.preventDefault();
                setPhase("closing");
                return;
            }
            if (!visible || event.key !== "Tab")
                return;
            keyboard.current = true;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [mounted, visible, expanded]);
    const close = () => {
        if (!keyboard.current)
            (document.activeElement as HTMLElement | null)?.blur();
        if (expanded)
            setPhase("closing");
    };
    const navigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
        event.preventDefault();
        if (href === pathname) {
            close();
            return;
        }
        navigating.current = true;
        (document.activeElement as HTMLElement | null)?.blur();
        document.documentElement.classList.add("menu-navigating");
        router.push(href, { scroll: false });
    };
    return (<>
      <div className="brand-grain" aria-hidden="true"/>
      <a className="skip-link" href="#main"><Copy field="shared.shell.text1"/></a>
      <header className="floating-header" data-page={(pathname === "/financials" || pathname === "/financials-v2") ? "financials" : "experience"}>
        <Link className="brand-logo" href="/" aria-label="Blågårds Apotek — forsiden" inert={mounted}>
          <BrandArtwork alt="Blågårds Apotek" tone={!mounted && headerTone.logo === "dark" ? "green" : "gold"}/>
        </Link>
        <button ref={button} className="burger-button" style={{color: !mounted && headerTone.menu === "dark" ? "var(--brand-green)" : "var(--brand-gold)"}} type="button" aria-label={mounted ? "Luk menu" : "Åbn menu"} aria-haspopup="dialog" aria-controls={mounted ? "site-menu" : undefined} aria-expanded={expanded} onPointerDown={() => { keyboard.current = false; }} onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ")
                keyboard.current = true;
        }} onClick={event => {
            if (event.detail === 0)
                keyboard.current = true;
            if (!keyboard.current)
                requestAnimationFrame(() => button.current?.blur());
            if (phase === "closed") {
                navigating.current = false;
                setPhase("opening");
            }
            else if (phase !== "closing")
                close();
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path className="burger-stroke burger-top" d="M3 10H25"/>
            <path className="burger-stroke burger-bottom" d="M3 18H25"/>
          </svg>
        </button>
      </header>
      {mounted && (<div ref={panel} id="site-menu" className="site-menu" data-phase={phase} role="dialog" aria-modal="true" aria-label="Udforsk Blågårds Apotek" aria-hidden={!visible} inert={!visible} onPointerDown={() => { keyboard.current = false; }} onTransitionEnd={event => {
                if (phase === "closing" && event.target === event.currentTarget && event.propertyName === "transform")
                    finish();
            }}>
          <nav aria-label="Hovednavigation">
            {areas.map((area, index) => (<Link key={area.href} href={area.href} prefetch={true} aria-current={pathname === area.href ? "page" : undefined} onClick={event => navigate(event, area.href)} style={{ "--item": Math.min(index, 5) } as CSSProperties}>
                <MenuLabel field={`shared.menu.${index}.label`}/><small><Copy field={`shared.menu.${index}.description`}/></small>
              </Link>))}
          </nav>
        </div>)}
      {children}
      <PageMotion />
      <PhotoParallax />
      <EditorialPhotos />
      <footer className="brand-footer">
       <div className="footer-panel">
        <div className="footer-top">
          <div className="footer-heading"><p className="eyebrow">Bar. Musik. Nørrebro.</p><h2><Copy field="shared.shell.text2"/></h2></div>
        </div>

        <div className="venue-footer-details"><div><p><Copy field="shared.address"/></p><ContentLink field="shared.emailLink"><Copy field="shared.email"/></ContentLink><br/><ContentLink field="shared.phoneLink"><Copy field="shared.phone"/></ContentLink></div><div><p><Copy field="shared.hours"/></p></div><div><ContentLink field="shared.facebook">Facebook <span aria-hidden="true">↗︎</span></ContentLink><br/><ContentLink field="shared.instagram">Instagram <span aria-hidden="true">↗︎</span></ContentLink></div></div>
       </div>
      </footer>
    </>);
}

export default function SiteShell({children}:{children:ReactNode}) {
 const pathname=usePathname();
 return pathname.startsWith("/admin") ? <>{children}</> : <MarketingShell>{children}</MarketingShell>;
}
