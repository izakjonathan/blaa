import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDocument, imageValue, validateDocument } from '../lib/content-schema.ts';
import { splashSettings } from '../lib/splash.ts';

test('legacy documents retain the current splash appearance and inherit the published hero crop', () => {
  assert.deepEqual(splashSettings(emptyDocument), {enabled:true,overlay:87,logoScale:100,bottleScale:100,duration:1450,showLogo:true,showBottle:true});
  const hero = {...imageValue(emptyDocument,'experience.hero.image1'), x:20,y:70};
  const legacy = validateDocument({text:{'experience.page.text6':'Existing published copy'},images:{'experience.hero.image1':hero}});
  assert.deepEqual(imageValue(legacy,'splash.background'),hero);
  assert.equal(legacy.text['experience.page.text6'],'Existing published copy');
  const separate = {...hero,x:80};
  const edited = validateDocument({...legacy,images:{...legacy.images,'splash.background':separate}});
  assert.deepEqual(imageValue(edited,'splash.background'),separate);
  assert.deepEqual(imageValue(edited,'experience.hero.image1'),hero);
});

test('splash controls accept supported settings and reject malformed or out-of-range content', () => {
  const edited = validateDocument({text:{'splash.enabled':'false','splash.overlay':'90','splash.duration':'3000','splash.logoScale':'125','splash.bottleScale':'75','splash.showBottle':'false','splash.showLogo':'true'},images:{}});
  assert.deepEqual(splashSettings(edited), {enabled:false,overlay:90,logoScale:125,bottleScale:75,duration:3000,showLogo:true,showBottle:false});
  for (const [id, value] of [['overlay','101'],['overlay',''],['duration','0'],['duration','6000'],['logoScale','102'],['bottleScale','NaN'],['enabled','yes'],['showLogo','1']]) {
    assert.throws(()=>validateDocument({text:{['splash.'+id]:value},images:{}}));
  }
});
