"use client";
import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {useContent} from "./Content";
import {animationSettings} from "../lib/animation-settings";
import { afterPaint } from "../lib/motion";
const SELECTOR = "[data-reveal]";
// Tab lifetime: returning to Story never replays blocks already encountered.
const storyArrivals = new Set<string>();
export default function PageMotion() {
    const pathname = usePathname();
    const settings=animationSettings(useContent());
    const [systemReduced, setSystemReduced] = useState(false);
    useLayoutEffect(() => {
        const query = matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setSystemReduced(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);
    useLayoutEffect(() => {
        const root = document.documentElement;
        const reducedSystem = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const reduce = reducedSystem || !settings.enabled || !settings.reveals;
        root.dataset.motion = reducedSystem || !settings.enabled ? "reduced" : "full";
        const covered = () => root.classList.contains("menu-open") || root.classList.contains("route-covered");
        const tracked = new Set<HTMLElement>();
        let observer: IntersectionObserver | undefined;
        let mutationObserver: MutationObserver | undefined;
        let menuObserver: MutationObserver | undefined;
        const pendingPaints = new Set<() => void>();
        const storyKey = (element: HTMLElement) => element.closest('[data-reveal-page="story"]') ? element.dataset.reveal : undefined;
        let cancelled = false;
        const reveal = (element: HTMLElement, delay = 0) => {
            element.style.setProperty("--reveal-delay", `${delay}ms`);
            element.classList.remove("reveal-pending");
            element.classList.add("reveal-visible");
            if(reduce)element.classList.add("reveal-settled");
            element.dataset.revealed = "true";
            const key = storyKey(element);
            if (key) storyArrivals.add(key);
            observer?.unobserve(element);
        };
        const enroll = (element: HTMLElement) => {
            if ((element.parentElement?.closest(SELECTOR) && !element.matches("h1,h2,h3,h4,h5,h6")) || tracked.has(element))
                return;
            tracked.add(element);
            if (element.matches("h1, h2, h3"))
                element.dataset.revealKind = "heading";
            element.classList.remove("reveal-pending", "reveal-visible", "reveal-settled");
            // Preserve one-shot arrivals across system motion changes and observer restarts.
            if (reduce || !observer || element.dataset.revealed === "true" || storyArrivals.has(storyKey(element) ?? "")) {
                reveal(element);
                return;
            }
            const viewport = window.visualViewport?.height ?? innerHeight;
            const bounds = element.getBoundingClientRect();
            // Story's visible hero also arrives; content above a restored scroll
            // position stays readable. Other routes retain their current behavior.
            const skipArrival = storyKey(element) ? bounds.bottom <= 0 : bounds.top <= viewport;
            if ((!covered() && skipArrival) || element.contains(document.activeElement)) {
                reveal(element);
            }
            else {
                element.classList.add("reveal-pending");
                // Paint the hidden starting state before the observer may reveal it.
                const cancel = afterPaint(() => {
                    pendingPaints.delete(cancel);
                    if (!cancelled && element.classList.contains("reveal-pending")) observer?.observe(element);
                });
                pendingPaints.add(cancel);
            }
        };
        const focus = (event: FocusEvent) => {
            if (!(event.target instanceof Element))
                return;
            let element = event.target.closest<HTMLElement>(SELECTOR);
            while (element) {
                reveal(element);
                element = element.parentElement?.closest<HTMLElement>(SELECTOR) ?? null;
            }
        };
        // Enroll across a paint boundary after route layout and covered menu scroll
        // resets. Footer-origin navigation must not mark the destination's entire
        // content as already above the viewport. No SSR content is concealed.
        const cancelPaint = afterPaint(() => {
            if (cancelled)
                return;
            if (!reduce && "IntersectionObserver" in window) {
                observer = new IntersectionObserver(entries => {
                    // Navigation keeps the menu over the incoming route. Do not
                    // spend its first arrivals while the content is still covered.
                    if (covered()) return;
                    entries.filter(entry => entry.isIntersecting)
                        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                        .forEach((entry, index) => reveal(entry.target as HTMLElement, Math.min(index * settings.revealStagger, settings.revealStagger * 2)));
                }, { threshold: 0, rootMargin: `0px 0px -${Math.round((window.visualViewport?.height ?? innerHeight) * settings.revealTrigger / 100)}px 0px` });
            }
            let menuWasOpen = covered();
            menuObserver = new MutationObserver(() => {
                const menuIsOpen = covered();
                if (menuIsOpen === menuWasOpen) return;
                menuWasOpen = menuIsOpen;
                if (!menuIsOpen) tracked.forEach(element => {
                    if (element.classList.contains("reveal-pending")) {
                        observer?.unobserve(element);
                        observer?.observe(element);
                    }
                });
            });
            menuObserver.observe(root, { attributes:true, attributeFilter:["class"] });
            document.querySelectorAll<HTMLElement>(SELECTOR).forEach(enroll);
            if (observer)
                root.classList.add("reveal-enabled");
            const container = document.querySelector("main");
            if (container && "MutationObserver" in window) {
                mutationObserver = new MutationObserver(mutations => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (!(node instanceof HTMLElement))
                                continue;
                            if (node.matches(SELECTOR))
                                enroll(node);
                            node.querySelectorAll<HTMLElement>(SELECTOR).forEach(enroll);
                        }
                    }
                });
                mutationObserver.observe(container, { childList: true, subtree: true });
            }
        });
        const settle = (event: TransitionEvent) => {
            if (event.propertyName === "transform" && event.target instanceof HTMLElement && event.target.matches(SELECTOR))
                event.target.classList.add("reveal-settled");
        };
        const headingSettled = (event: AnimationEvent) => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.matches('.heading-char-inner,.heading-line-inner')) return;
            const visual = target.closest('.heading-visual');
            if (target.parentElement === visual?.lastElementChild) target.closest('[data-reveal]')?.classList.add('reveal-settled');
        };
        document.addEventListener("animationend", headingSettled);
        document.addEventListener("transitionend", settle);
        document.addEventListener("focusin", focus);
        return () => {
            cancelled = true;
            cancelPaint();
            observer?.disconnect();
            mutationObserver?.disconnect();
            menuObserver?.disconnect();
            pendingPaints.forEach(cancel => cancel());
            document.removeEventListener("focusin", focus);
            document.removeEventListener("transitionend", settle);
            document.removeEventListener("animationend", headingSettled);
            root.classList.remove("reveal-enabled");
            tracked.forEach(element => {
                element.classList.remove("reveal-pending", "reveal-visible", "reveal-settled");
                element.style.removeProperty("--reveal-delay");
            });
        };
    }, [pathname, systemReduced, settings.enabled, settings.reveals, settings.revealTrigger, settings.revealStagger]);
    return null;
}
