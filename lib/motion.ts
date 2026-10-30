/** Timings and paint sequencing from the supplied Shams project. */
export function afterPaint(callback: () => void): () => void {
    let second = 0;
    const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(callback);
    });
    return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
    };
}
export function cssTimeMs(variable: string, fallback: number): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value))
        return fallback;
    if (raw.endsWith("ms"))
        return value;
    if (raw.endsWith("s"))
        return value * 1000;
    return fallback;
}
export function isReducedMotion(): boolean {
    const preference = document.documentElement.dataset.motion;
    if (preference === "full")
        return false;
    if (preference === "reduced")
        return true;
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
