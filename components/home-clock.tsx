'use client';
import {useEffect,useState} from 'react';

export function HomeClock(){
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  function refresh(){
   clearTimeout(timer);
   if(document.hidden)return;
   const date=new Date();
   setNow(date);
   timer=setTimeout(refresh,60000-date.getSeconds()*1000-date.getMilliseconds());
  }
  refresh();
  document.addEventListener('visibilitychange',refresh);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',refresh)};
 },[]);
 return <time className="homeClock" dateTime={now?.toISOString()}>{now&&<>
  {now.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})} · {now.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
 </>}</time>;
}
