import {test} from 'node:test';
import assert from 'node:assert/strict';
import {artworkStyle, isBrandArtwork, venueLogo} from '../lib/brand-artwork.ts';
import {fields, validateDocument} from '../lib/content-schema.ts';
import {splashSettings} from '../lib/splash.ts';

test('custom editor colours tint every supported logo and illustration in both contrast roles',()=>{
 const sources=[venueLogo,'/kroteket/cac052ae-logo-shadow.png','/kroteket/6c6d53aa-guitar.png','/kroteket/5a192dae-painting.png'];
 for(const accent of ['#fedcba','#ff3366','#12ab34']){
  const draft=validateDocument({text:{'brand.green':'#123456','brand.gold':accent},images:{}});
  for(const src of sources){
   const light=artworkStyle(draft,src,'gold'),dark=artworkStyle(draft,src,'green');
   assert.equal(light.backgroundColor,accent);
   assert.equal(dark.backgroundColor,'#123456');
   assert.equal(light.maskImage,`url("${src}")`);
   assert.equal(light.WebkitMaskImage,light.maskImage);
  }
 }
 assert.equal(isBrandArtwork('/kroteket/real-photo.webp'),false);
 assert.throws(()=>artworkStyle({text:{},images:{}},'javascript:alert(1)'));
});

test('previously saved bottle settings remain readable but cannot enable removed artwork',()=>{
 const document=validateDocument({text:{'splash.showBottle':'true','splash.bottleScale':'150'},images:{}});
 const settings=splashSettings(document);
 assert.equal('showBottle' in settings,false);
 assert.equal('bottleScale' in settings,false);
 assert.ok(fields.filter(field=>['splash.showBottle','splash.bottleScale'].includes(field.id)).every(field=>field.hidden));
});
