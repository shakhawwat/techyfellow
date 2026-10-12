'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useAccountSession} from '@/components/account/session';
import {api} from '@/lib/admin/api';
const key='techyfellow.academy.cart.v1',empty:string[]=[];
function ids(value:unknown){return Array.isArray(value)?[...new Set(value.filter((item):item is string=>typeof item==='string'&&item.length<=160&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item)))].slice(0,50):[];}
function read(){try{return ids(JSON.parse(localStorage.getItem(key)??'[]'));}catch{return [];}}
type Cart={ids:string[];ready:boolean;error:string;add:(id:string)=>Promise<boolean>;remove:(id:string)=>Promise<void>;refresh:()=>void};
const Context=createContext<Cart|null>(null);
export function AcademyCartProvider({children}:{children:ReactNode}){
 const {session}=useAccountSession(),userId=session.user?.id,[guest,setGuest]=useState<string[]>([]),[hydrated,setHydrated]=useState(false),[owner,setOwner]=useState<{userId:string;ids:string[]}|null>(null),[version,setVersion]=useState(0),[error,setError]=useState(''),guestRef=useRef<string[]>([]);
 function saveGuest(value:string[]){guestRef.current=value;setGuest(value);try{localStorage.setItem(key,JSON.stringify(value));}catch{setError('Browser cart storage is unavailable; these selections are temporary.');}}
 useEffect(()=>{const initialize=()=>{guestRef.current=read();setGuest(guestRef.current);setHydrated(true);};const timer=setTimeout(initialize,0),sync=(event:StorageEvent)=>{if(event.key===key){initialize();setVersion(value=>value+1);}};window.addEventListener('storage',sync);return()=>{clearTimeout(timer);window.removeEventListener('storage',sync);};},[]);
 useEffect(()=>{let active=true;if(!hydrated||session.status!=='authenticated'||!userId)return;const incoming=read();api<{data:{courseSlugs:string[]}}>('/academy/cart/merge','POST',{courseSlugs:incoming}).then(result=>{if(!active)return;setOwner({userId,ids:result.data.courseSlugs});setError('');const remaining=read().filter(id=>!incoming.includes(id));guestRef.current=remaining;setGuest(remaining);try{localStorage.setItem(key,JSON.stringify(remaining));}catch{};}).catch(()=>{if(active)setError('Your account cart could not be loaded or merged. Retry before confirming.');});return()=>{active=false;};},[hydrated,session.status,userId,version]);
 const selected=session.status==='authenticated'&&owner&&owner.userId===userId?owner.ids:session.status==='anonymous'?guest:empty,ready=hydrated&&(session.status==='anonymous'||session.status==='authenticated'&&owner?.userId===userId);
 async function add(id:string){if(!ready||!ids([id]).length)return false;try{if(session.status==='authenticated'&&userId){const result=await api<{data:{courseSlugs:string[]}}>('/academy/cart/merge','POST',{courseSlugs:[id]});setOwner({userId,ids:result.data.courseSlugs});}else{const next=ids([...guestRef.current,...read(),id]);if(!next.includes(id)){setError('Your cart can contain up to 50 courses.');return false;}saveGuest(next);}return true;}catch{setError('This course could not be added to your cart. Retry after checking your session.');return false;}}
 async function remove(id:string){try{if(session.status==='authenticated'&&userId){const result=await api<{data:{courseSlugs:string[]}}>(`/academy/cart/items/${id}`,'DELETE',{});setOwner({userId,ids:result.data.courseSlugs});}else saveGuest(guestRef.current.filter(item=>item!==id));}catch{setError('The course could not be removed. Retry after checking your session.');}}
 return <Context.Provider value={{ids:selected,ready,error,add,remove,refresh:()=>setVersion(value=>value+1)}}>{children}</Context.Provider>;
}
export function useAcademyCart(){const value=useContext(Context);if(!value)throw new Error('Academy cart provider missing');return value;}
