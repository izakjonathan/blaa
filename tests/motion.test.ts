import { test } from "node:test";
import assert from "node:assert/strict";
import { afterPaint, cssTimeMs, isReducedMotion } from "../lib/motion.ts";
function frameClock(t: {
    after: (fn: () => void) => void;
}) {
    const originalRequest = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    let next = 0;
    const queued = new Map<number, FrameRequestCallback>();
    globalThis.requestAnimationFrame = callback => { queued.set(++next, callback); return next; };
    globalThis.cancelAnimationFrame = id => { queued.delete(id); };
    t.after(() => { globalThis.requestAnimationFrame = originalRequest; globalThis.cancelAnimationFrame = originalCancel; });
    return () => {
        const callbacks = [...queued.values()];
        queued.clear();
        callbacks.forEach(callback => callback(0));
    };
}
test("menu entrance waits for its mounted starting state to cross a paint boundary", t => {
    const paint = frameClock(t);
    let entered = false;
    afterPaint(() => { entered = true; });
    assert.equal(entered, false);
    paint();
    assert.equal(entered, false);
    paint();
    assert.equal(entered, true);
});
test("closing before the first paint prevents a stale menu-open callback", t => {
    const paint = frameClock(t);
    let reopened = false;
    const cancel = afterPaint(() => { reopened = true; });
    cancel();
    paint();
    paint();
    assert.equal(reopened, false);
});
test("closing between paints cancels the second queued entrance frame", t => {
    const paint = frameClock(t);
    let reopened = false;
    const cancel = afterPaint(() => { reopened = true; });
    paint();
    cancel();
    paint();
    assert.equal(reopened, false);
});
test("exit fallback follows CSS seconds/milliseconds and rejects missing units", t => {
    const originalDocument = globalThis.document;
    const originalStyle = globalThis.getComputedStyle;
    let css = "360ms";
    globalThis.document = { documentElement: {} } as unknown as Document;
    globalThis.getComputedStyle = (() => ({ getPropertyValue: () => css })) as unknown as typeof getComputedStyle;
    t.after(() => { globalThis.document = originalDocument; globalThis.getComputedStyle = originalStyle; });
    assert.equal(cssTimeMs("--duration-menu", 999), 360);
    css = " .42s ";
    assert.equal(cssTimeMs("--duration-menu", 999), 420);
    css = "";
    assert.equal(cssTimeMs("--duration-menu", 999), 999);
    css = "360";
    assert.equal(cssTimeMs("--duration-menu", 999), 999);
});
test("explicit animation choice overrides system Reduce Motion; system remains the default", t => {
    const originalDocument = globalThis.document;
    const originalMatch = globalThis.matchMedia;
    const dataset: {
        motion?: string;
    } = {};
    let system = true;
    globalThis.document = { documentElement: { dataset } } as unknown as Document;
    globalThis.matchMedia = (() => ({ matches: system })) as unknown as typeof matchMedia;
    t.after(() => { globalThis.document = originalDocument; globalThis.matchMedia = originalMatch; });
    assert.equal(isReducedMotion(), true);
    dataset.motion = "full";
    assert.equal(isReducedMotion(), false);
    dataset.motion = "reduced";
    system = false;
    assert.equal(isReducedMotion(), true);
    delete dataset.motion;
    assert.equal(isReducedMotion(), false);
});
