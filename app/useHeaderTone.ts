"use client";
import { useLayoutEffect, useState } from "react";
import { headerSurfaceTone } from "../lib/scroll-art";
import { afterPaint } from "../lib/motion";
/** Sample the section beneath the fixed controls after scroll and layout changes. */
export function useHeaderTone(pathname: string) {
    const [tone, setTone] = useState<"dark" | "gold">((pathname === "/financials" || pathname === "/financials-v2") ? "dark" : "gold");
    useLayoutEffect(() => {
        const root = document.documentElement;
        if (pathname === "/financials" || pathname === "/financials-v2") {
            root.dataset.headerTone = "dark";
            setTone("dark");
            root.style.setProperty("--document-canvas-image", "none");
            root.style.setProperty("--document-canvas-color", "var(--brand-gold)");
            return;
        }
        let frame = 0;
        const update = () => {
            const button = document.querySelector(".floating-header .burger-button");
            const rect = button?.getBoundingClientRect();
            const y = rect ? rect.top + rect.height / 2 : 44;
            const x = rect ? rect.left + rect.width / 2 : innerWidth - 44;
            const sections = document.querySelectorAll<HTMLElement>("main > section, main > figure, .brand-footer");
            const section = Array.from(sections).find(element => {
                const box = element.getBoundingClientRect();
                return box.top <= y && box.bottom > y;
            });
            if (!section) return;
            // A mobile split section can be gold while its upper half is a photo.
            // Sample the actual photo surface before inheriting the section color.
            const surfaces = [section, ...Array.from(section.querySelectorAll<HTMLElement>('.split-photo,.photo-story figure,.company-photo'))].map(element => {
                const box=element.getBoundingClientRect();
                return {...{left:box.left,right:box.right,top:box.top,bottom:box.bottom},photo:element!==section || element.matches('.company-photo,.scene'),gold:element.matches('.gold-section,.brand-footer')};
            });
            const tone = headerSurfaceTone(surfaces,x,y) ?? "gold";
            const dark = tone === "dark";
            setTone(tone);
            if (root.dataset.headerTone !== tone) root.dataset.headerTone = tone;
            const photo = section.querySelector<HTMLImageElement>("img.scene-photo");
            const canvas = photo?.currentSrc ? `linear-gradient(color-mix(in srgb, var(--brand-dark) 53.3333%, transparent),color-mix(in srgb, var(--brand-dark) 53.3333%, transparent)),url(${JSON.stringify(photo.currentSrc)})` : "none";
            if (root.style.getPropertyValue("--document-canvas-image") !== canvas)
                root.style.setProperty("--document-canvas-image", canvas);
            root.style.setProperty("--document-canvas-color", dark ? "var(--brand-gold)" : "var(--brand-dark)");
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
        };
        update();
        // Next restores route scroll after layout effects. Sample again after paint.
        const cancelPaint = afterPaint(schedule);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
        document.addEventListener("load", schedule, true);
        window.visualViewport?.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("scroll", schedule);
        const resize = new ResizeObserver(schedule);
        const main = document.querySelector("main");
        if (main) resize.observe(main);
        return () => {
            cancelPaint();
            cancelAnimationFrame(frame);
            resize.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            document.removeEventListener("load", schedule, true);
            window.visualViewport?.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("scroll", schedule);
        };
    }, [pathname]);
    return tone;
}
