import type {Product} from './stock';

export const purchaseSizes = [
 {id:'item',label:'One item',unit:'each',pack:1},
 {id:'case24',label:'Case of 24 items',unit:'each',pack:24},
 {id:'bottle70',label:'70 cl bottle',unit:'L',pack:.7},
 {id:'bottle75',label:'75 cl bottle',unit:'L',pack:.75},
 {id:'keg20',label:'20 L keg',unit:'L',pack:20},
 {id:'keg30',label:'30 L keg',unit:'L',pack:30},
] as const;
export function newProduct(id:string):Product{return {id,name:'',sku:'',category:'',supplier:'',unit:'each',pack:1,packCost:0,par:0,threshold:5,active:true};}
export function purchaseSize(p:Product){return purchaseSizes.find(size=>size.unit===p.unit&&size.pack===p.pack);}
export function packDescription(p:Product){return purchaseSize(p)?.label??`${p.pack} ${p.unit==='each'?'items':p.unit} per pack`;}
/** UI amounts are purchase packs; stock storage and reports remain in base units. */
export function packsToUnits(p:Product,packs:number){return packs*p.pack;}
export function unitsToPacks(p:Product,units:number){return units/p.pack;}
export function productProblems(p:Product){
 const errors:string[]=[];
 if(!p.name.trim()||p.name.length>200)errors.push('Enter a product name (up to 200 characters).');
 if(!Number.isFinite(p.pack)||p.pack<.0001||p.pack>10000000)errors.push('Enter a pack size greater than zero.');
 if(!Number.isFinite(p.packCost)||p.packCost<0||p.packCost>10000000)errors.push('Price must be zero or more.');
 if(!Number.isFinite(p.par)||p.par<0||p.par>10000000)errors.push('Target stock must be zero or more.');
 if(!Number.isFinite(p.threshold)||p.threshold<0||p.threshold>100)errors.push('Loss alert must be between 0 and 100%.');
 return errors;
}
