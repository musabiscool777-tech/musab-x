// Download one public feed for all visitors. No visitor IP is sent to the provider.
const feed='https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/all/data.txt';
const hour=3_600_000;
type Snapshot={addresses:Set<string>;loaded:number};
let snapshot:Snapshot|undefined;
let retryAfter=0;

export function parseProxyFeed(text:string){
 const addresses=new Set<string>();
 for(const line of text.split('\n')){
  const host=/^(?:https?|socks[45]):\/\/(\d{1,3}(?:\.\d{1,3}){3}|\[[0-9a-f:]+\]):\d+\s*$/i.exec(line)?.[1];
  if(host)addresses.add(host.replace(/^\[|\]$/g,'').toLowerCase());
 }
 return addresses;
}

export async function networkAccess(request:Request){
 const cf=request.cf;
 if(!cf)return;
 const deny=()=>new Response('Atom is unavailable on this network. Contact the site owner if you believe this is a mistake.',{status:403,headers:{'Cache-Control':'private, no-store','Content-Type':'text/plain; charset=utf-8'}});
 if(/(?:^|[^\p{L}\p{N}])(?:schools?|academ(?:y|ies)|colleges?|universit(?:y|ies)|k[ -]?12|boards? of education|schooldistrict|universidad|universidade|universität|université|università|universiteit|école|lycée|schulnetz)(?=$|[^\p{L}\p{N}])/iu.test(String(cf.asOrganization??'')))return deny();
 const ip=request.headers.get('CF-Connecting-IP')?.toLowerCase();
 if(!ip)return;
 const now=Date.now();
 if((!snapshot||now-snapshot.loaded>=hour)&&now>=retryAfter){
  try{
   const result=await fetch(feed,{redirect:'error',signal:AbortSignal.timeout(4000),cf:{cacheTtl:3600,cacheEverything:true}});
   if(!result.ok)throw new Error('Unavailable proxy feed');
   const addresses=parseProxyFeed(await result.text());
   if(addresses.size<100)throw new Error('Incomplete proxy feed');
   snapshot={addresses,loaded:now};
  }catch{retryAfter=now+60_000}
 }
 if(snapshot&&now-snapshot.loaded<24*hour&&snapshot.addresses.has(ip))return deny();
}
