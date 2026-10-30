export type SplashTarget='backdrop'|'bottle'|'logo'|'plate';
export async function runSplashSequence(options:{
 active:()=>boolean; showBottle:boolean;showLogo:boolean;hold:number;
 animate:(target:SplashTarget,visible:boolean,duration:number,delay?:number)=>Promise<void>;
 wait:(ms:number)=>Promise<void>;prepareHero?:()=>Promise<void>;hero:()=>void;complete:()=>void;
}) {
 const {animate,active}=options;
 await animate('backdrop',true,850);if(!active())return;
 await Promise.all([options.showBottle?animate('bottle',true,850):null,options.showLogo?animate('logo',true,850,250):null]);if(!active())return;
 await options.wait(options.hold);if(!active())return;
 await options.prepareHero?.();if(!active())return;
 await Promise.all([options.showLogo?animate('logo',false,450):null,options.showBottle?animate('bottle',false,500,100):null]);if(!active())return;
 // Keep the photograph opaque until the whole splash crossfades over the hero.
 options.hero();
 await animate('plate',false,850);if(active())options.complete();
}
