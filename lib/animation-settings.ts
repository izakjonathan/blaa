import {textValue,type ContentDocument} from './content-schema.ts';
const curves:Record<string,string>={soft:'cubic-bezier(.22,1,.36,1)','ease-in-out':'cubic-bezier(.42,0,.58,1)','ease-out':'cubic-bezier(0,0,.58,1)',linear:'linear'};
export function animationSettings(document:ContentDocument){
 const value=(id:string)=>textValue(document,'motion.'+id);
 const number=(id:string)=>Number(value(id));
 return {enabled:value('enabled')!=='false',reveals:value('reveals')!=='false',revealTrigger:number('revealTrigger'),revealStagger:number('revealStagger'),splashSpeed:number('splashSpeed'),splashEase:curves[value('splashEase')]||curves.soft};
}
/** Registered numeric ranges and whitelisted curves are the only CSS inputs. */
export function animationStyle(document:ContentDocument){
 const n=(id:string)=>Number(textValue(document,'motion.'+id));
 const on=(id:string)=>textValue(document,'motion.'+id)!=='false';
 const ease=(id:string)=>curves[textValue(document,'motion.'+id)]||curves.soft;
 const declarations:Record<string,string>={
  '--heading-char-duration':n('headingDuration')+'ms','--menu-roll-duration':n('menuRollDuration')+'ms','--menu-roll-stagger':n('menuRollStagger')+'ms','--menu-divider-duration':n('menuDividerDuration')+'ms',
  '--photo-zoom-start':String(1+n('photoZoomAmount')/100),'--photo-zoom-duration':n('photoZoomDuration')+'ms',
  '--duration-menu':(on('menu')?n('menuDuration'):0)+'ms','--duration-reveal':n('revealDuration')+'ms','--duration-reveal-fade':n('revealFade')+'ms','--reveal-distance':n('revealDistance')+'px',
  '--ease-menu':ease('menuEase'),'--ease-reveal':ease('revealEase'),'--motion-line-duration':n('lineDuration')+'ms','--motion-line-stagger':n('lineStagger')+'ms',
  '--menu-link-duration':n('menuLinkDuration')+'ms','--menu-link-delay':n('menuLinkDelay')+'ms','--menu-link-stagger':n('menuLinkStagger')+'ms',
  '--video-fade-ease':ease('videoEase'),'--video-fade-duration':n('videoFade')+'ms',
  '--hero-ease':ease('heroEase'),'--footer-reveal-ease':ease('footerRevealEase'),'--footer-logo-easing':ease('logoEase'),
  '--hero-line-duration':n('heroDuration')+'ms','--hero-line-delay-base':n('heroDelay')+'ms','--hero-line-stagger':n('heroStagger')+'ms','--hero-button-duration':n('heroButtonDuration')+'ms','--hero-button-delay':n('heroButtonDelay')+'ms',
  '--footer-scroll-enabled':on('footerAuto')?'1':'0','--footer-scroll-duration':String(n('footerDuration')),'--footer-scroll-trigger':String(n('footerTrigger')/100),
  '--footer-scroll-easing':['cosine','cubic','ease-out','linear'].includes(textValue(document,'motion.footerEase'))?textValue(document,'motion.footerEase'):'cosine',
  '--footer-reveal-duration':n('footerRevealDuration')+'ms','--footer-reveal-distance':n('footerRevealDistance')+'px','--footer-logo-enabled':on('logoPulse')?'1':'0','--footer-logo-duration':String(n('logoDuration')),'--footer-logo-scale':String(1+n('logoScale')/100)
 };
 let css='html:root{'+Object.entries(declarations).map(([key,value])=>key+':'+value).join(';')+'}';
 if(!on('menu'))css+='html:root[data-motion] .site-menu:is([data-phase="open"],[data-phase="closing"]) nav>a{animation:none}';
 if(!on('hero'))css+='html .brand-hero[data-intro] .hero-line>* , html .brand-hero[data-intro] .hero-discover{animation:none;opacity:1;transform:none}';
 if(!on('footerReveal'))css+='html[data-motion] .brand-footer[data-entered] .footer-panel>*{animation:none}';
 if(!on('menuDividers')||!on('menu'))css+='html[data-motion] .site-menu nav>a::after{transition:none;transform:scaleX(1)}';
 return css;
}
