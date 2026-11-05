import type {Product,Sale} from './stock';
export function servingUnit(p:Product){return p.unit==='L'?'ml':p.unit==='kg'?'g':'items';}
export function servingAmount(p:Product,stored:number){return Number((stored*(p.unit==='each'?1:1000)).toPrecision(12));}
export function storedAmount(p:Product,display:number){return display/(p.unit==='each'?1:1000);}
export function newTillItem(p:Product,id:string):Sale{return {id,name:p.name,sku:'',ingredients:[{productId:p.id,quantity:p.unit==='each'?1:0}]};}
export function tillProblem(s:Sale){if(!s.name.trim())return 'Enter a till item name.';if(s.unitPrice!==undefined&&(!Number.isFinite(s.unitPrice)||s.unitPrice<0||s.unitPrice>10000000))return 'Enter a valid selling price.';if(s.ingredients.some(i=>!Number.isFinite(i.quantity)||i.quantity<.000001||i.quantity>10000000))return 'Enter how much stock one sale uses.';return '';}
