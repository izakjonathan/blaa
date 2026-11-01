"use client";
import { useEffect } from "react";
import { isReducedMotion } from "../lib/motion";

/** One interruptible arrival per downward approach; never capture upward scrolling. */
export function useFooterEntrance(pathname: string) {
    useEffect(() => {
        const footer = document.querySelector<HTMLElement>(".brand-footer");
        const logo = document.querySelector<HTMLElement>(".floating-header .brand-logo");
        if (!footer) return;
        let frame = 0, previousY = window.scrollY, armed = true, settling = false;
        let pulse: Animation | undefined;
        const update = (allowSnap = false) => {
            const y = window.scrollY;
            const down = y > previousY;
            previousY = y;
            const top = footer.getBoundingClientRect().top;
            const height = window.innerHeight;
            if (top > height * .95) {
                armed = true;
                footer.removeAttribute("data-entered");
            } else {
                footer.dataset.entered = "true";
            }
            if (settling && top <= 1) settling = false;
            if (!allowSnap || !down || !armed || top > height * .72 || top < -1 || document.documentElement.classList.contains("menu-open")) return;
            armed = false;
            if (isReducedMotion()) return;
            pulse?.cancel();
            pulse = logo?.animate([
                {transform: "scale(1)"},
                {transform: "scale(1.22)", offset: .45},
                {transform: "scale(1)"}
            ], {duration: 800, easing: "cubic-bezier(.22,1,.36,1)"});
            settling = top > 1;
            window.scrollTo({top: y + top, behavior: "smooth"});
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(true); });
        };
        // Let a visitor reverse direction immediately during the smooth arrival.
        const cancel = () => {
            if (settling) window.scrollTo({top: window.scrollY, behavior: "instant"});
            settling = false;
        };
        const wheel = (event: WheelEvent) => { if (event.deltaY < 0) cancel(); };
        const key = (event: KeyboardEvent) => { if (["ArrowUp", "PageUp", "Home", "Escape"].includes(event.key)) cancel(); };
        const resize = () => update();
        update();
        window.addEventListener("scroll", schedule, {passive: true});
        window.addEventListener("resize", resize, {passive: true});
        window.addEventListener("wheel", wheel, {passive: true});
        window.addEventListener("touchstart", cancel, {passive: true});
        window.addEventListener("keydown", key);
        return () => {
            cancelAnimationFrame(frame);
            pulse?.cancel();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", resize);
            window.removeEventListener("wheel", wheel);
            window.removeEventListener("touchstart", cancel);
            window.removeEventListener("keydown", key);
            footer.removeAttribute("data-entered");
        };
    }, [pathname]);
}
