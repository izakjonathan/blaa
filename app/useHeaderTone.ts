"use client";
import { useLayoutEffect, useState } from "react";
import { afterPaint } from "../lib/motion";

type Tone = "dark" | "gold";
const surfaceSelector = ".gold-section,.brand-footer,.scene,.brand-hero,.split-photo,.photo-story figure,.company-photo,.brand-world,.split-scene,.venue-gallery,main";
/** Hit-test the painted surface beneath each fixed control, including nested pages. */
export function useHeaderTone(pathname: string) {
    const [tones, setTones] = useState<{logo: Tone; menu: Tone}>({logo: "gold", menu: "gold"});
    useLayoutEffect(() => {
        let frame = 0;
        const sample = (selector: string): Tone => {
            const rect = document.querySelector(selector)?.getBoundingClientRect();
            if (!rect) return "gold";
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            // Skip the controls and overlays themselves. closest() resolves the
            // innermost surface, so a photo inside a light section stays light ink.
            const hit = document.elementsFromPoint(x, y).find(element => element.closest("main,.brand-footer"));
            const surface = hit?.closest(surfaceSelector);
            return surface?.matches(".gold-section,.brand-footer") ? "dark" : "gold";
        };
        const update = () => {
            const logo = sample(".floating-header .brand-logo");
            const menu = sample(".floating-header .burger-button");
            setTones(previous => previous.logo === logo && previous.menu === menu ? previous : {logo, menu});
            document.documentElement.dataset.headerTone = menu;
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
        };
        update();
        const cancelPaint = afterPaint(schedule);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
        window.addEventListener("pageshow", schedule);
        document.addEventListener("load", schedule, true);
        window.visualViewport?.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("scroll", schedule);
        const resize = new ResizeObserver(schedule);
        const main = document.querySelector("main");
        const footer = document.querySelector(".brand-footer");
        if (main) resize.observe(main);
        if (footer) resize.observe(footer);
        return () => {
            cancelPaint();
            cancelAnimationFrame(frame);
            resize.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("pageshow", schedule);
            document.removeEventListener("load", schedule, true);
            window.visualViewport?.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("scroll", schedule);
        };
    }, [pathname]);
    return tones;
}
