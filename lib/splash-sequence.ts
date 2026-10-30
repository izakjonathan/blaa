export type SplashTarget='backdrop'|'logo'|'plate';
export async function runSplashSequence(options:{
 active:()=>boolean; showLogo:boolean;hold:number;
 animate:(target:SplashTarget,visible:boolean,duration:number,delay?:number)=>Promise<void>;
 wait:(ms:number)=>Promise<void>;prepareHero?:()=>Promise<void>;hero:()=>void;complete:()=>void;
}) {
 const {animate,active}=options;
 await animate('backdrop',true,850);if(!active())return;
 if(options.showLogo)await animate('logo',true,850,250);if(!active())return;
 await options.wait(options.hold);if(!active())return;
 await options.prepareHero?.();if(!active())return;
 if(options.showLogo)await animate('logo',false,450);if(!active())return;
 // Keep the photograph opaque until the whole splash crossfades over the hero.
 options.hero();
 await animate('plate',false,850);if(active())options.complete();
}
