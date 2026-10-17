// Preserve Scramjet's full website rendering; only the failed HTTP fetch changes.
export function withHttpFallback(Base, fetcher = (...args) => fetch(...args)) {
 return class extends Base {
  async request(url, method, body, headers, signal) {
   try { return await super.request(url, method, body, headers, signal); }
   catch (original) {
    if (!['GET','HEAD'].includes(method.toUpperCase()) || url.protocol !== 'https:' || signal?.aborted) throw original;
    try {
     const response = await fetcher('/http', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href,method:method.toUpperCase(),headers}),signal});
     if (!response.ok) throw new Error((await response.text()).slice(0,600) || 'HTTP fallback unavailable');
     const encoded = response.headers.get('X-Musab-Response');
     if (!encoded) throw new Error('Browser fallback response is missing its headers');
     const metadata = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), c=>c.charCodeAt(0))));
     if (!Number.isInteger(metadata.status) || metadata.status<200 || metadata.status>599 || !metadata.headers || typeof metadata.headers!=='object') throw new Error('Invalid browser fallback response');
     return {...metadata,body:method.toUpperCase()==='HEAD'||[204,205,304].includes(metadata.status)?null:response.body};
    } catch (fallback) {
     if (signal?.aborted) throw signal.reason || fallback;
     throw new Error(String(original)+'\n'+String(fallback));
    }
   }
  }
 };
}
