// Runs in <head>, before the browser can paint the streamed page body.
// Keep the decision independent of React hydration and database loading.
export function createIntroBootstrap(enabled = true) { return `(() => {
  if (location.pathname !== '/') return;
  const root = document.documentElement;
  let seen = false;
  try { seen = sessionStorage.getItem('plaisir-intro-v2') === 'seen'; } catch {}
  const replay = new URLSearchParams(location.search).get('intro') === 'replay';
  const skip = ${!enabled} || (seen && !replay) || matchMedia('(prefers-reduced-motion: reduce)').matches ||
    Boolean(location.hash) || new URLSearchParams(location.search).get('preview') === 'draft';
  root.dataset.introBoot = skip ? 'skip' : 'splash';
  if (!skip) window.setTimeout(() => {
    // Fail open if hydration fails; never strand a visitor behind the splash.
    if (root.dataset.introBoot === 'splash') {
      root.dataset.introBoot = 'failed';
      root.classList.remove('brand-intro-active');
    }
  }, 8000);
})();`; }
export const INTRO_BOOTSTRAP = createIntroBootstrap();

// Critical protection lives in the document head, before external styles/JS.
// The splash itself stays visible even while its main ancestor is concealed.
export const INTRO_CRITICAL_CSS = `
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) { background:#000; overflow:hidden; }
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) body { background:#000; overflow:hidden; }
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) main,
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) .brand-footer,
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) .skip-link,
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) .floating-header > * { visibility:hidden; }
html:is([data-intro-boot="splash"],[data-intro-boot="running"]) .brand-splash { display:block; visibility:visible; }
html:is([data-intro-boot="skip"],[data-intro-boot="failed"]) .brand-splash { display:none!important; }
html:is([data-intro-boot="skip"],[data-intro-boot="failed"]) [data-intro="splash"] .hero-line > *,
html:is([data-intro-boot="skip"],[data-intro-boot="failed"]) [data-intro="splash"] .hero-bottle,
html:is([data-intro-boot="skip"],[data-intro-boot="failed"]) [data-intro="splash"] .hero-discover { opacity:1; animation:none; }
`;

export const INTRO_NO_SCRIPT_CSS = `
.brand-splash { display:none!important; }
[data-intro="splash"] .hero-line > *,
[data-intro="splash"] .hero-bottle,
[data-intro="splash"] .hero-discover { opacity:1!important; animation:none!important; }
`;
