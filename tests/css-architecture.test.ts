import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
// Use the CSS parser already supplied by Next; no additional build dependency.
const postcss=createRequire(require.resolve('next/package.json'))('postcss') as typeof import('postcss');
const root=new URL('../app/',import.meta.url);
test('stylesheets have one selector owner per condition, no duplicate declarations or keyframes',()=>{
 const seen=new Map<string,string>(),keyframes=new Set<string>(),tokens=new Map<string,string>();
 for(const file of readdirSync(root,{recursive:true,encoding:'utf8'}).filter(f=>f.endsWith('.css'))){
  const css=postcss.parse(readFileSync(new URL(file,root),'utf8'),{from:file});
  css.walkAtRules('keyframes',rule=>{assert.ok(!keyframes.has(rule.params),`duplicate keyframes ${rule.params}`);keyframes.add(rule.params);});
  css.walkRules(rule=>{
   if(rule.parent?.type==='atrule'&&rule.parent.name==='keyframes')return;
   const conditions:string[]=[];
   for(let parent=rule.parent;parent&&parent.type!=='root';parent=parent.parent)if(parent.type==='atrule')conditions.unshift(parent.name+':'+parent.params.replace(/\s/g,''));
   for(const selector of postcss.list.comma(rule.selector)){
    if(selector===':root'){
     rule.walkDecls(d=>{const key=JSON.stringify([conditions,d.prop]);assert.ok(!tokens.has(key),`${file}: duplicate root token ${d.prop} from ${tokens.get(key)}`);tokens.set(key,file);});
     continue; // Different token families intentionally share :root.
    }
    const key=JSON.stringify([conditions,selector.replace(/\s/g,'').replaceAll('"',"'")]);
    assert.ok(!seen.has(key),`${file}: duplicate ${selector}; owned by ${seen.get(key)}`);seen.set(key,file);
   }
   const props=new Map<string,string>();
   rule.walkDecls(d=>{
    const fallback=d.prop==='min-height'&&props.get(d.prop)==='100vh'&&d.value==='100lvh';
    assert.ok(!props.has(d.prop)||fallback,`${file}: duplicate ${rule.selector} ${d.prop}`);props.set(d.prop,d.value);
    if(d.important) {
     assert.equal(file,'site.css', `${file}: fix specificity instead of adding !important`);
     assert.equal(rule.selector.includes('.brand-hero'),true);
     assert.equal(d.prop,'animation');
     assert.equal(d.value,'none');
     assert.ok(rule.selector.includes('data-motion="reduced"')||conditions.includes('media:(prefers-reduced-motion:reduce)'));
    }
   });
  });
 }
});
test('brand photographs form a continuous grid without gaps or stagger padding',()=>{
 const css=postcss.parse(readFileSync(new URL('media.css',root),'utf8'));
 const grid=css.nodes.find(n=>n.type==='rule'&&n.selector==='.collection-photos');
 assert.ok(grid?.type==='rule');
 assert.ok(grid.nodes.some(n=>n.type==='decl'&&n.prop==='gap'&&n.value==='0'));
 css.walkRules(rule=>assert.ok(!rule.selector.includes('.collection-photos figure:last-child'),'no staggered final photo'));
});

test('class selectors reference the current markup or runtime state code',()=>{
 const source=[root,new URL('../lib/',import.meta.url)].flatMap(dir=>readdirSync(dir,{recursive:true,encoding:'utf8'}).filter(file=>/\.(tsx?|mjs|js)$/.test(file)).map(file=>readFileSync(new URL(file,dir),'utf8'))).join('\n');
 for(const file of readdirSync(root,{recursive:true,encoding:'utf8'}).filter(file=>file.endsWith('.css'))){
  postcss.parse(readFileSync(new URL(file,root),'utf8')).walkRules(rule=>{
   for(const match of rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g))assert.ok(source.includes(match[1]),`${file}: unreferenced class ${match[1]}`);
  });
 }
});

test('shared admin typography reads the Stock Control settings without a second font override',()=>{
 const stock=postcss.parse(readFileSync(new URL('admin/stock/stock.css',root),'utf8'));
 const shared=postcss.parse(readFileSync(new URL('admin/tool-theme.css',root),'utf8'));
 const settings=stock.nodes.find(n=>n.type==='rule'&&n.selector===':is(.stock-control, .admin-tool-header[data-admin-stock=true])');
 assert.ok(settings?.type==='rule');
 const defined=new Set(settings.nodes.filter(n=>n.type==='decl').map(n=>n.prop));
 const used=new Set<string>();
 const declarations=new Map<string,string>();
 for(const css of [stock,shared])css.walkDecls(d=>{
  for(const match of d.value.matchAll(/var\((--stock-[\w-]+)/g))used.add(match[1]);
  if(css===shared&&d.parent?.type==='rule')declarations.set(d.parent.selector+' '+d.prop,d.value);
 });
 for(const name of defined)assert.ok(used.has(name),`unused typography setting ${name}`);
 for(const name of used)assert.ok(defined.has(name)||['--stock-card-border','--stock-control-size','--stock-control-weight'].includes(name),`missing setting ${name}`);
 const tools='.admin-workspace[data-tool=true] :is(.content-editor,.stock-control,.social-studio)';
 for(const [role,property,token,fallback] of [
  ['h2','font-weight','--stock-heading-weight','620'],
  ['summary','font','--stock-summary-weight','620'],
  ['p','font','--stock-body-size','15px'],
  [':is(button,.editor-button)','font','--stock-button-size','15px'],
  ['label','font','--stock-label-size','11px'],
 ]){
  const selector=role==='summary'?tools.replace(':is(.content-editor,.stock-control,.social-studio)', ':is(.stock-control,.social-studio,.content-editor)'):tools;
  const value=declarations.get(`${selector} ${role} ${property}`);
  assert.ok(value?.includes(`var(${token},${fallback})`),`shared ${role} must read ${token}`);
 }
});
