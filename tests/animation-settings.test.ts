import {test} from 'node:test';
import assert from 'node:assert/strict';
import {animationSettings,animationStyle} from '../lib/animation-settings.ts';
import {emptyDocument,fields,validateDocument,textValue} from '../lib/content-schema.ts';
import {splashSettings} from '../lib/splash.ts';

test('old documents inherit animation defaults and all editor controls have valid registered defaults',()=>{
 assert.equal(animationSettings(emptyDocument).enabled,true);
 assert.match(animationStyle(emptyDocument),/--footer-scroll-duration:1500/);
 assert.match(animationStyle(emptyDocument),/--footer-scroll-trigger:0.28/);
 assert.match(animationStyle(emptyDocument),/--duration-menu:680ms/);
 const text=Object.fromEntries(fields.filter(f=>f.page==='animations').map(f=>[f.id,String(f.default)]));
 assert.deepEqual(validateDocument({text,images:{}}).text,text);
});
test('animation settings survive a save/preview document round trip',()=>{
 const document=validateDocument(JSON.parse(JSON.stringify({text:{'motion.footerDuration':'2500','motion.footerEase':'cubic','motion.footerTrigger':'45','motion.menuEase':'linear','motion.logoScale':'20'},images:{}})));
 const css=animationStyle(document);
 assert.match(css,/--footer-scroll-duration:2500/);assert.match(css,/--footer-scroll-easing:cubic/);assert.match(css,/--footer-scroll-trigger:0.45/);assert.match(css,/--ease-menu:linear/);assert.match(css,/--footer-logo-scale:1.2/);
});
test('invalid durations, options and toggle values are rejected',()=>{
 for(const [id,value] of [['footerDuration','0'],['footerDuration','6000'],['footerDuration','1550'],['footerEase','ease;display:none'],['menuEase','custom'],['enabled','yes']])assert.throws(()=>validateDocument({text:{['motion.'+id]:value},images:{}}));
});
test('switches control footer scrolling, pulse, hero, menu, reveal state and splash',()=>{
 const doc=validateDocument({text:{'motion.enabled':'false','motion.reveals':'false','motion.footerAuto':'false','motion.footerReveal':'false','motion.logoPulse':'false','motion.hero':'false','motion.menu':'false'},images:{}});
 assert.equal(animationSettings(doc).enabled,false);assert.equal(animationSettings(doc).reveals,false);assert.equal(splashSettings(doc).enabled,false);
 assert.match(animationStyle(doc),/--footer-scroll-enabled:0/);assert.match(animationStyle(doc),/--footer-logo-enabled:0/);assert.match(animationStyle(doc),/--duration-menu:0ms/);assert.match(animationStyle(doc),/animation:none/);
 assert.equal(textValue(emptyDocument,'motion.footerDuration'),'1500');
});
