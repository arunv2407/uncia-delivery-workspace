export type TableSort={column:number;direction:'asc'|'desc'}|null;
export function columnOrder(saved:number[],count:number){return [...new Set(saved.filter(i=>Number.isInteger(i)&&i>=0&&i<count)),...Array.from({length:count},(_,i)=>i).filter(i=>!saved.includes(i))];}
export function moveColumn(order:number[],from:number,to:number){const next=[...order],at=next.indexOf(from),target=next.indexOf(to);if(at<0||target<0)return next;next.splice(at,1);next.splice(target,0,from);return next;}
export function matchesRow(values:string[],search:string,filters:Record<number,string>){const clean=(v:string)=>v.toLocaleLowerCase().trim();return (!clean(search)||values.some(v=>clean(v).includes(clean(search))))&&Object.entries(filters).every(([column,query])=>!clean(query)||clean(values[+column]??'').includes(clean(query)));}
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
export function compareValues(a:string,b:string){
 const missing=(x:string)=>!x.trim()||['—','Not set','Not entered'].includes(x.trim());
 if(missing(a)||missing(b))return missing(a)===missing(b)?0:missing(a)?1:-1;
 const number=(v:string)=>/^-?[\d,]+(?:\.\d+)?\s*%?$/.test(v.trim())?Number(v.replaceAll(',','').replace('%','')):null;
 const x=number(a),y=number(b);if(x!==null&&y!==null)return x-y;
 if(/^\d{4}-\d{2}-\d{2}$/.test(a)&&/^\d{4}-\d{2}-\d{2}$/.test(b))return a.localeCompare(b);
 return collator.compare(a,b);
}
