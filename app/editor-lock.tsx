'use client';
import {Children,cloneElement,createContext,isValidElement,useContext,type ReactNode,type ReactElement} from 'react';
export const EditorLockContext=createContext(false);
export const useEditorLock=()=>useContext(EditorLockContext);
export function lockEditors(children:ReactNode,locked:boolean):ReactNode{
 return Children.map(children,child=>{
  if(!isValidElement(child))return child;
  const element=child as ReactElement<any>;
  if(typeof element.type==='function')return element;
  const props:any={};
  if(locked&&['input','select','textarea','button'].includes(String(element.type)))props.disabled=true;
  if(element.props.children)props.children=lockEditors(element.props.children,locked);
  return cloneElement(element,props);
 });
}
export default function EditorLock({disabled=false,children,className}:{disabled?:boolean;children:ReactNode;className?:string}){
 const locked=useEditorLock()||disabled;
 return <EditorLockContext.Provider value={locked}><div className={className}>{lockEditors(children,locked)}</div></EditorLockContext.Provider>;
}
