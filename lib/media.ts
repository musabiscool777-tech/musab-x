export function youtubeVideo(raw:string){try{const u=new URL(raw);const host=u.hostname.toLowerCase();let id:string|null=null;if(host==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){id=u.pathname==='/watch'?u.searchParams.get('v'):/^\/(shorts|embed)\//.test(u.pathname)?u.pathname.split('/')[2]:null}return id&&/^[a-zA-Z0-9_-]{11}$/.test(id)?id:null}catch{return null}}

export function mediaUrl(raw:unknown,base:string){
 if(typeof raw!=='string'||!raw.trim())return null;
 try{const u=new URL(raw,base);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/(^|\.)(localhost|local|internal|test|invalid|onion)$/.test(u.hostname))return null;return u.href}catch{return null}
}
export function videoEmbed(raw:string){
 const youtube=youtubeVideo(raw);if(youtube)return 'https://www.youtube-nocookie.com/embed/'+youtube;
 try{const u=new URL(raw);if(u.hostname==='player.vimeo.com'&&/^\/video\/\d+$/.test(u.pathname))return u.origin+u.pathname}catch{}
 return null;
}
