"use client";
import { useEffect } from "react";
import {footerMotion} from "../lib/footer-motion";
import { isReducedMotion } from "../lib/motion";

/** One interruptible arrival per downward approach; never capture upward scrolling. */
export function useFooterEntrance(pathname: string) {
    useEffect(() => {
        const footer = document.querySelector<HTMLElement>(".brand-footer");
        const logo = document.querySelector<HTMLElement>(".floating-header .brand-logo");
        if (!footer) return;
        let frame = 0, arrivalFrame = 0, previousY = window.scrollY, previousTime = 0, armed = true, touching = false, touchMoved = false, lastDirection = 0, lastVelocity = 0, lastMovementTime = 0;
        const setting = (name:string,fallback:number) => {
            const raw = getComputedStyle(footer).getPropertyValue?.('--footer-'+name)?.trim();
            const value = Number(raw);
            return raw && Number.isFinite(value) ? value : fallback;
        };
        let pulse: Animation | undefined;
        const cancel = () => {
            cancelAnimationFrame(arrivalFrame);
            arrivalFrame = 0;
            pulse?.cancel();
        };
        const arrive = (from: number, velocity: number, started: number) => {
            const duration=setting('scroll-duration',1500);
            const curve=getComputedStyle(footer).getPropertyValue?.('--footer-scroll-easing')?.trim() || 'cosine';
            const target=()=>window.scrollY+footer.getBoundingClientRect().top+(Number.parseFloat(getComputedStyle(footer).paddingTop)||0);
            let origin=from, began=started, lastY=from, lastTime=started;
            let motion=footerMotion(Math.max(0,target()-from),velocity,duration,curve);
            const step = (time: number) => {
                if (isReducedMotion() || setting("scroll-enabled",1) === 0 || touching || (document.documentElement.classList.contains("menu-open") || document.documentElement.classList.contains("route-transitioning"))) { cancel(); return; }
                const current=window.scrollY,destination=target();
                if(destination-current<=1){arrivalFrame=0;return;}
                let progress=Math.min(1,(time-began)/motion.duration);
                const next=origin+(destination-origin)*motion.ease(progress);
                // Ongoing human scrolling/inertia owns every moving frame.
                // Rebase instead of stopping it or dragging the page backwards.
                if(current<lastY-1){cancel();return;}
                if(current>lastY+.5){
                    const speed=(current-lastY)/Math.max(1,time-lastTime);
                    origin=current;began=time;motion=footerMotion(destination-current,speed,duration,curve);progress=0;
                } else {
                    window.scrollTo({top:Math.min(destination,Math.max(current,next)),behavior:"instant"});
                }
                lastY=window.scrollY;lastTime=time;
                arrivalFrame=progress<1?requestAnimationFrame(step):0;
            };
            arrivalFrame=requestAnimationFrame(step);
        };
        const update = (allowSnap = false, time = 0, released = false) => {
            const y = window.scrollY;
            const down = y > previousY;
            const elapsed=time-previousTime;
            if(touching && y!==previousY)touchMoved=true;
            if(y!==previousY){lastDirection=down?1:-1;lastMovementTime=time;}
            const measured=down && elapsed>0 && elapsed<=100 ? (y-previousY)/elapsed : 0;
            if(down)lastVelocity=measured;
            const velocity=released && time-lastMovementTime<=100 ? lastVelocity : measured;
            previousY = y;previousTime=time;
            const top = footer.getBoundingClientRect().top;
            const height = window.innerHeight;
            const remaining=top+(Number.parseFloat(getComputedStyle(footer).paddingTop)||0);
            if (top > height * .95) {
                armed = true;
                footer.removeAttribute("data-entered");
            } else {
                footer.dataset.entered = "true";
            }
            if (!allowSnap || touching || (!down && !(released && lastDirection>0)) || !armed || top > height * (1-setting("scroll-trigger",.28)) || remaining < 1 || (document.documentElement.classList.contains("menu-open") || document.documentElement.classList.contains("route-transitioning"))) return;
            armed = false;
            if (isReducedMotion()) return;
            pulse?.cancel();
            if(setting("logo-enabled",1)!==0)pulse = logo?.animate([
                {transform: "scale(1)"},
                {transform: `scale(${setting("logo-scale",1.1)})`, offset: .45},
                {transform: "scale(1)"}
            ], {duration: setting("logo-duration",650), easing: getComputedStyle(footer).getPropertyValue?.("--footer-logo-easing")?.trim() || "cubic-bezier(.22,1,.36,1)"});
            if(setting("scroll-enabled",1)!==0)arrive(y,velocity,time);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(time => { frame = 0; update(true,time); });
        };
        // Upward input or a new touch releases the controlled arrival immediately.
        const wheel = (event: WheelEvent) => { if (event.deltaY < 0) cancel(); };
        const key = (event: KeyboardEvent) => { if (["ArrowUp", "PageUp", "Home", "Escape"].includes(event.key)) cancel(); };
        const resize = schedule;
        const touchStart=()=>{touching=true;touchMoved=false;cancel();};
        const touchEnd=()=>{touching=false;cancelAnimationFrame(frame);frame=requestAnimationFrame(time=>{frame=0;update(true,time,touchMoved);touchMoved=false;});};
        update();
        window.addEventListener("scroll", schedule, {passive: true});
        window.addEventListener("resize", resize, {passive: true});
        window.addEventListener("wheel", wheel, {passive: true});
        window.addEventListener("touchstart", touchStart, {passive: true});
        window.addEventListener("touchend", touchEnd, {passive:true});
        window.addEventListener("touchcancel", touchEnd, {passive:true});
        window.addEventListener("keydown", key);
        return () => {
            cancelAnimationFrame(frame);
            cancel();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", resize);
            window.removeEventListener("wheel", wheel);
            window.removeEventListener("touchstart", touchStart);
            window.removeEventListener("touchend", touchEnd);
            window.removeEventListener("touchcancel", touchEnd);
            window.removeEventListener("keydown", key);
            footer.removeAttribute("data-entered");
        };
    }, [pathname]);
}
