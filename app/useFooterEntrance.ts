"use client";
import { useEffect } from "react";
import { isReducedMotion } from "../lib/motion";

/** One interruptible arrival per downward approach; never capture upward scrolling. */
export function useFooterEntrance(pathname: string) {
    useEffect(() => {
        const footer = document.querySelector<HTMLElement>(".brand-footer");
        const logo = document.querySelector<HTMLElement>(".floating-header .brand-logo");
        if (!footer) return;
        let frame = 0, arrivalFrame = 0, previousY = window.scrollY, armed = true;
        const duration = 1500;
        let pulse: Animation | undefined;
        const cancel = () => {
            cancelAnimationFrame(arrivalFrame);
            arrivalFrame = 0;
            pulse?.cancel();
        };
        const arrive = (from: number) => {
            let started: number | undefined;
            const step = (time: number) => {
                if (isReducedMotion() || document.documentElement.classList.contains("menu-open")) {
                    cancel();
                    return;
                }
                started ??= time;
                const progress = Math.min(1, (time - started) / duration);
                // Cosine easing has zero speed at both ends of the arrival.
                const eased = (1 - Math.cos(Math.PI * progress)) / 2;
                // Re-measure the destination so browser chrome/layout changes
                // do not leave the content panel short of the viewport top.
                const bleed = Number.parseFloat(getComputedStyle(footer).paddingTop) || 0;
                const destination = window.scrollY + footer.getBoundingClientRect().top + bleed;
                window.scrollTo({top: from + (destination - from) * eased, behavior: "instant"});
                arrivalFrame = progress < 1 ? requestAnimationFrame(step) : 0;
            };
            arrivalFrame = requestAnimationFrame(step);
        };
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
            if (!allowSnap || !down || !armed || top > height * .72 || top < -1 || document.documentElement.classList.contains("menu-open")) return;
            armed = false;
            if (isReducedMotion()) return;
            pulse?.cancel();
            pulse = logo?.animate([
                {transform: "scale(1)"},
                {transform: "scale(1.1)", offset: .45},
                {transform: "scale(1)"}
            ], {duration: 650, easing: "cubic-bezier(.22,1,.36,1)"});
            arrive(y);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(true); });
        };
        // Upward input or a new touch releases the controlled arrival immediately.
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
            cancel();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", resize);
            window.removeEventListener("wheel", wheel);
            window.removeEventListener("touchstart", cancel);
            window.removeEventListener("keydown", key);
            footer.removeAttribute("data-entered");
        };
    }, [pathname]);
}
