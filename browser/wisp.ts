// Wisp v1, TCP only. Each client is authenticated by the enclosing Worker.
import {publicAddress} from '../lib/web';
type Socket={opened:Promise<unknown>,closed:Promise<unknown>,readable:ReadableStream<Uint8Array>,writable:WritableStream<Uint8Array>,close:()=>Promise<void>};
type Stream={socket?:Socket,writer?:WritableStreamDefaultWriter<Uint8Array>,ready:Promise<void>,tail:Promise<void>,queued:number,bytes:number,closed:boolean,received:number};
const WINDOW=32,MAX_PACKET=262144,MAX_QUEUE=1048576;
export function packet(type:number,id:number,payload:Uint8Array=new Uint8Array()){
 const out=new Uint8Array(5+payload.length);out[0]=type;new DataView(out.buffer).setUint32(1,id,true);out.set(payload,5);return out;
}
function capacity(n:number){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b}
export async function resolvePublic(host:string,fetcher:typeof fetch=fetch){
 host=host.toLowerCase().replace(/\.$/,'');
 if(!host||host.length>253||/[^a-z0-9.:-]/.test(host)||/(^|\.)(localhost|local|internal|invalid|test|onion)$/.test(host))throw new Error('Blocked destination');
 if(/^[\d.]+$/.test(host)||host.includes(':')){if(!publicAddress(host))throw new Error('Blocked destination');return host}
 if(!host.includes('.'))throw new Error('Blocked destination');
 const r=await fetcher('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(host)+'&type=A',{headers:{Accept:'application/dns-json'},signal:AbortSignal.timeout(5000)});
 if(!r.ok)throw new Error('DNS unavailable');const data:any=await r.json();
 const addresses=(data.Answer||[]).filter((a:any)=>a.type===1).map((a:any)=>a.data);
 if(!addresses.length||addresses.some((a:any)=>typeof a!=='string'||!publicAddress(a)))throw new Error('Blocked destination');
 // Connect to the validated IP, so a later DNS change cannot redirect to a LAN.
 return addresses[0] as string;
}
export function serveWisp(ws:WebSocket,connect:(address:{hostname:string,port:number})=>Socket,resolve=resolvePublic){
 const streams=new Map<number,Stream>();let ended=false;
 function send(type:number,id:number,data:Uint8Array){if(ended)return;try{ws.send(packet(type,id,data))}catch{shutdown()}}
 function end(id:number,reason=2){const s=streams.get(id);if(!s)return;s.closed=true;streams.delete(id);void s.socket?.close().catch(()=>{});send(4,id,new Uint8Array([reason]))}
 function shutdown(){if(ended)return;ended=true;for(const [id] of streams)end(id);try{ws.close(1000,'Browser connection closed')}catch{}}
 async function receive(event:MessageEvent){
  if(ended)return;if(!(event.data instanceof ArrayBuffer)){shutdown();return}
  const b=new Uint8Array(event.data);if(b.length<5||b.length>MAX_PACKET){shutdown();return}
  const type=b[0],id=new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(1,true),data=b.subarray(5);
  if(type===5&&id===0)return; // Explicit v1 client transport; no extensions.
  if(!id){shutdown();return}
  if(type===1){
   if(streams.has(id)){end(id,0x41);return}
   if(streams.size>=6){send(4,id,new Uint8Array([0x49]));return}
   if(data.length<4||data[0]!==1){send(4,id,new Uint8Array([0x41]));return}
   const port=new DataView(data.buffer,data.byteOffset,data.byteLength).getUint16(1,true);
   if(port!==80&&port!==443){send(4,id,new Uint8Array([0x48]));return}
   let host;try{host=new TextDecoder('utf-8',{fatal:true}).decode(data.subarray(3))}catch{send(4,id,new Uint8Array([0x41]));return}
   const s:Stream={ready:Promise.resolve(),tail:Promise.resolve(),queued:0,bytes:0,closed:false,received:0};streams.set(id,s);
   s.ready=(async()=>{
    const hostname=await resolve(host);if(s.closed)return;
    const socket=connect({hostname,port});s.socket=socket;socket.closed.catch(()=>{});
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{await Promise.race([socket.opened,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Connection timeout')),10000)})])}finally{clearTimeout(timer)}
    if(s.closed){await socket.close();return}s.writer=socket.writable.getWriter();
    void (async()=>{const reader=socket.readable.getReader();try{while(!s.closed){const {value,done}=await reader.read();if(done)break;if(value)for(let offset=0;offset<value.length;offset+=65536)send(2,id,value.subarray(offset,offset+65536))}end(id)}catch{end(id,3)}finally{reader.releaseLock()}})();
   })().catch(()=>{end(id,0x42)});
   return;
  }
  const s=streams.get(id);if(!s)return;
  if(type===4){end(id);return}
  if(type!==2){end(id,0x41);return}
  if(++s.queued>WINDOW||(s.bytes+=data.length)>MAX_QUEUE){end(id,0x49);return}
  // Separate FIFO queues preserve packet order even when connect/DNS is pending.
  s.tail=s.tail.then(async()=>{await s.ready;if(s.closed)return;await s.writer!.write(data);s.queued--;s.bytes-=data.length;if(++s.received>=16){s.received=0;send(3,id,capacity(WINDOW-s.queued))}}).catch(()=>end(id,3));
 }
 ws.addEventListener('message',event=>{void receive(event).catch(shutdown)});
 ws.addEventListener('close',shutdown);ws.addEventListener('error',shutdown);
 send(3,0,capacity(WINDOW));
 return {shutdown};
}
