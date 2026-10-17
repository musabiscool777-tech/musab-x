// One initialized Epoxy client per shared transport. Only safe reads are retried.
export function resilientTransport(Base, pause = ms => new Promise(resolve => setTimeout(resolve, ms))) {
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
      for (let attempt = 0; ; attempt++) {
        if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
        await this.init();
        const client = this.current;
        try { return await client.request(url, method, body, headers, signal); }
        catch (error) {
          const disconnected = /MuxTaskEnded|Wisp.*(?:closed|close|ended)|WebSocket.*(?:closed|connection)|connection (?:closed|reset)|tls handshake eof/i.test(String(error));
          if (!disconnected || !['GET', 'HEAD'].includes(method.toUpperCase()) || attempt >= 2 || signal?.aborted) throw error;
          await pause(200 * (attempt + 1));
          await this.replace(client);
        }
      }
    }
    connect(...args) { return this.current.connect(...args); }
    meta() { return this.current?.meta(); }
  };
}
