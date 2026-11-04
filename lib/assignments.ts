import {type Plan} from './model';
export const PRODUCTS=[{id:'prime',name:'UNCIA PRIME (LOS)'},{id:'leap',name:'UNCIA LEAP (LMS)'},{id:'flow',name:'UNCIA FLOW (SCF)'}] as const;
export type Client={id:string;name:string;products:string[]};
export function productIds(value:string):string[]{const v=value.toLowerCase();return v.includes('cross-product')?PRODUCTS.map(x=>x.id):PRODUCTS.filter(x=>v.includes(x.id)).map(x=>x.id);}
export const clientNames=(value:string)=>value.split(';').map(x=>x.trim()).filter(Boolean);
export function allowedClients(p:Plan,product:string){const ids=productIds(product);return p.clients.filter(c=>c.products.some(id=>ids.includes(id)));}
export function addClient(p:Plan,name:string,products:string[]){name=name.trim();if(!name)throw Error('Enter the client name');if(p.clients.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw Error('Client already exists. Update its product mapping below.');if(!products.length||products.some(id=>!PRODUCTS.some(x=>x.id===id)))throw Error('Choose at least one existing product');p.clients.push({id:'client-'+Date.now()+'-'+Math.random().toString(36).slice(2),name,products});}
export function setResourceProducts(p:Plan,resourceId:string,ids:string[]){
 if(ids.some(id=>!PRODUCTS.some(product=>product.id===id)))throw Error('Choose existing products only');
 const resource=[...p.qaRoster,...p.engRoster].find(r=>r.id===resourceId);
 if(!resource)throw Error('Resource not found');
 resource.product=PRODUCTS.filter(product=>ids.includes(product.id)).map(product=>product.name).join('; ');
 const allowed=allowedClients(p,resource.product).map(client=>client.name);
 resource.client=clientNames(resource.client).filter(name=>allowed.includes(name)).join('; ');
}
