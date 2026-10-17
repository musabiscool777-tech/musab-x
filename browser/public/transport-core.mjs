// One initialized Epoxy client per shared transport. Only safe reads are retried.
export function resilientTransport(Base, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), metadataFetch = (...args) => fetch(...args)) {
  return class ResilientTransport {
    ready = false;
    current;
    initializing;
    constructor(options) { this.options = options; }
    async init() {
      if (this.ready) return;
      if (!this.initializing) {
        const client = new Base(this.options);
        this.initializing = client.init().then(() => {
          this.current = client;
          this.ready = true;
        }).finally(() => { this.initializing = undefined; });
      }
      await this.initializing;
    }
    async replace(failed) {
      // Many resources can fail together. They must share one replacement.
      if (this.current === failed) { this.current = undefined; this.ready = false; }
      await this.init();
    }
    async request(url, method, body, headers, signal) {
      // Scramjet consults this list before cross-site navigation. Serve the pinned
      // upstream snapshot locally, so metadata cannot fail with the destination.
      if (url.href === 'https://publicsuffix.org/list/public_suffix_list.dat' && method.toUpperCase() === 'GET') {
        const response = await metadataFetch('/public_suffix_list.dat', {signal});
        if (!response.ok) throw new Error('Browser domain list could not load. Reload the browser.');
        return {body: response.body, headers: Object.fromEntries(response.headers), status: response.status, statusText: response.statusText};
      }
      for (let attempt = 0; ; attempt++) {
        if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
        await this.init();
        const client = this.current;
        try { return await client.request(url, method, body, headers, signal); }
        catch (error) {
          const message = String(error);
          const disconnected = /MuxTaskEnded|WebSocket.*(?:closed|connection)/i.test(message) || (/Wisp server closed/i.test(message) && !/tls handshake eof|WispCloseReason/i.test(message));
          const interrupted = disconnected || /connection (?:closed|reset)|tls handshake eof/i.test(message);
          if (!interrupted || !['GET', 'HEAD'].includes(method.toUpperCase()) || attempt >= 2 || signal?.aborted) throw error;
          await pause(200 * (attempt + 1));
          // A failed destination stream must not discard other tabs' active client.
          if (disconnected) await this.replace(client);
        }
      }
    }
    connect(...args) { return this.current.connect(...args); }
    meta() { return this.current?.meta(); }
  };
}
