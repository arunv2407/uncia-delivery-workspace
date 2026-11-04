'use client';
import {Children,Fragment,cloneElement,isValidElement,useEffect,useLayoutEffect,useRef,useState,type ReactElement,type ReactNode} from 'react';
import {columnOrder,moveColumn,matchesRow,compareValues,type TableSort} from '../lib/table-view';
import {EditorLockContext,lockEditors,useEditorLock} from './editor-lock';

function elements(children:ReactNode):ReactElement<any>[] {return Children.toArray(children).flatMap(child=>!isValidElement(child)?[]:child.type===Fragment?elements((child.props as any).children):[child as ReactElement<any>]);}
function label(children:ReactNode):string {return Children.toArray(children).map(c=>typeof c==='string'||typeof c==='number'?String(c):isValidElement(c)?label((c.props as any).children):'').join(' ').replace(/\s+/g,' ').trim();}
function cellValue(cell:HTMLTableCellElement){
 if(cell.dataset.sortValue!==undefined)return cell.dataset.sortValue;
 const fields=Array.from(cell.querySelectorAll('input,select,textarea')) as (HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement)[];
 if(fields.length)return fields.map(field=>field instanceof HTMLSelectElement?Array.from(field.selectedOptions).map(o=>o.text).join(' '):field instanceof HTMLInputElement&&field.type==='checkbox'?(field.checked?field.closest('label')?.textContent?.trim()||'Yes':''):field.value).filter(Boolean).join(' ');
 return (cell.textContent??'').replace(/\s+/g,' ').trim();
}
export default function DataTable({id,children,className,editingDisabled=false,...props}:{id:string;children:ReactNode;className?:string;editingDisabled?:boolean;[key:string]:any}){
 const inheritedLock=useEditorLock(),locked=inheritedLock||editingDisabled;
 const roots=elements(children),head=roots.find(x=>x.type==='thead'),header=head&&elements(head.props.children)[0],headers=header?elements(header.props.children):[],count=headers.length;
 const bodies=roots.filter(x=>x.type==='tbody');
 const [order,setOrder]=useState<number[]>([]),[sort,setSort]=useState<TableSort>(null),[search,setSearch]=useState(''),[filters,setFilters]=useState<Record<number,string>>({}),[columnsOpen,setColumnsOpen]=useState(false),[filtersOpen,setFiltersOpen]=useState(false),[loaded,setLoaded]=useState(false),[values,setValues]=useState<Record<string,string[]>>({});
 const table=useRef<HTMLTableElement>(null),dragged=useRef<number|null>(null),visibleOrder=columnOrder(order,count),orderKey=visibleOrder.join(',');
 const key='uncia-table-v1:'+id;
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)??'null');if(saved){setOrder(Array.isArray(saved.order)?saved.order:[]);setSort(saved.sort&&Number.isInteger(saved.sort.column)&&['asc','desc'].includes(saved.sort.direction)?saved.sort:null);setSearch(typeof saved.search==='string'?saved.search:'');setFilters(saved.filters&&typeof saved.filters==='object'?saved.filters:{});}}catch{}setLoaded(true);},[key]);
 useEffect(()=>{if(loaded)try{localStorage.setItem(key,JSON.stringify({order:visibleOrder,sort,search,filters}));}catch{}},[loaded,key,orderKey,sort,search,filters]);
 useLayoutEffect(()=>{
  const next:Record<string,string[]>={};
  table.current?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-view-row]').forEach(row=>{const data=Array(count).fill('');Array.from(row.cells).forEach((cell,i)=>{data[visibleOrder[i]]=cellValue(cell);});next[row.dataset.viewRow!]=data;});
  setValues(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
 },[children,orderKey,count]);
 const records=bodies.flatMap((body,bodyIndex)=>elements(body.props.children).map((row,index)=>({row,cells:elements(row.props.children),key:`${bodyIndex}:${row.key??index}`,bodyIndex,index}))),regular=records.filter(r=>r.cells.length===count&&!r.cells.some(c=>(c.props.colSpan??1)>1)&&!String(r.row.props.className??'').includes('total-row')),pinned=records.filter(r=>!regular.includes(r));
 const sorted=[...regular].sort((a,b)=>{if(!sort)return a.index-b.index;const compare=compareValues(values[a.key]?.[sort.column]??'',values[b.key]?.[sort.column]??'');return (sort.direction==='asc'?compare:-compare)||a.index-b.index;}),shown=sorted.filter(r=>matchesRow(values[r.key]??[],search,filters)),activeFilter=!!search||Object.values(filters).some(Boolean);
 function reset(){setOrder([]);setSort(null);setSearch('');setFilters({});setFiltersOpen(false);setColumnsOpen(false);}
 const names=headers.map((h,i)=>label(h.props.children)||`Column ${i+1}`);
 return <div className="data-table" data-table-id={id}>
  <div className="table-tools" role="group" aria-label={`${id} table controls`}><label className="table-search">Search<input type="search" aria-label={`${id} search`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this table"/></label><button type="button" className="button secondary small" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(!filtersOpen)}>Filters</button><button type="button" className="button secondary small" aria-expanded={columnsOpen} onClick={()=>setColumnsOpen(!columnsOpen)}>Move columns</button><button type="button" className="text-button" onClick={reset}>Reset view</button><span role="status">{shown.length} of {regular.length} rows{activeFilter&&pinned.length?' · Totals cover all rows':''}</span></div>
  {columnsOpen&&<div className="column-controls" role="group" aria-label={`${id} column order`}>{visibleOrder.map((column,index)=><div key={column}><span>{names[column]}</span><button type="button" disabled={index===0} aria-label={`Move ${names[column]} left`} onClick={()=>setOrder(moveColumn(visibleOrder,column,visibleOrder[index-1]))}>←</button><button type="button" disabled={index===count-1} aria-label={`Move ${names[column]} right`} onClick={()=>setOrder(moveColumn(visibleOrder,column,visibleOrder[index+1]))}>→</button></div>)}</div>}
  <EditorLockContext.Provider value={locked}><table {...props} ref={table} className={className}>
   {head&&<thead {...head.props}>{cloneElement(header!,{children:visibleOrder.map(column=>{const h=headers[column];return <th {...h.props} key={column} aria-sort={sort?.column===column?(sort.direction==='asc'?'ascending':'descending'):'none'} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragged.current!==null)setOrder(moveColumn(visibleOrder,dragged.current,column));dragged.current=null;}}><div className="column-heading"><button type="button" className="column-drag" draggable aria-label={`Drag ${names[column]} column`} onDragStart={e=>{dragged.current=column;e.dataTransfer.setData('text/plain',String(column));}} onDragEnd={()=>{dragged.current=null;}}>⋮⋮</button><button type="button" className="column-sort" aria-label={`Sort by ${names[column]}`} onClick={()=>setSort(sort?.column===column?sort.direction==='asc'?{column,direction:'desc'}:null:{column,direction:'asc'})}>{h.props.children}<span aria-hidden="true">{sort?.column===column?(sort.direction==='asc'?' ↑':' ↓'):' ↕'}</span></button></div>{filtersOpen&&<input className="column-filter" aria-label={`Filter ${names[column]}`} value={filters[column]??''} onChange={e=>setFilters({...filters,[column]:e.target.value})} placeholder="Contains…"/>}</th>;})})}</thead>}
   <tbody>{sorted.map(record=>cloneElement(record.row,{'data-view-row':record.key,key:record.key,hidden:!shown.includes(record),children:visibleOrder.map(column=><Fragment key={column}>{lockEditors(record.cells[column],locked)}</Fragment>)}))}
    {!shown.length&&regular.length>0&&<tr><td colSpan={count}>No rows match your filters.</td></tr>}
    {pinned.map(record=>cloneElement(record.row,{key:record.key,children:<td colSpan={count}><div className="table-summary-row">{record.cells.map((cell,i)=><span key={i}>{cell.props.children}</span>)}</div></td>}))}
   </tbody>
   {roots.filter(x=>!['thead','tbody'].includes(String(x.type)))}
  </table></EditorLockContext.Provider>
 </div>;
}
