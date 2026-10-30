import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hexToHsl,hslToHex} from '../lib/color.ts';
import {validateDocument,emptyDocument} from '../lib/content-schema.ts';
import {brandStyle} from '../lib/brand.ts';
test('HSL editing preserves representative colors through conversion',()=>{
 for(const hex of ['#000000','#ffffff','#263d32','#d8b15b','#ff0000','#00ff00','#0000ff','#123456','#ffb258'])assert.equal(hslToHex(hexToHsl(hex)),hex);
 assert.equal(hslToHex({h:360,s:100,l:50}),'#ff0000');
 assert.equal(hslToHex({h:120,s:0,l:50}),'#808080');
});
test('grain defaults off and persists only valid bounded levels',()=>{
 assert.match(brandStyle(emptyDocument),/--brand-grain-opacity:0;/);
 const document=validateDocument({text:{'brand.grain':'50'},images:{}});
 assert.match(brandStyle(document),/--brand-grain-opacity:0.09;/);
 for(const value of ['-1','101','1.5','oops'])assert.throws(()=>validateDocument({text:{'brand.grain':value},images:{}}));
});
