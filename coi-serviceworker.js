/* coi-serviceworker v0.1.7 - github.com/gzuidhof/coi-serviceworker */
if (typeof window === "undefined") {
  // ── Running as a Service Worker ──────────────────────────────────────────
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

  async function handleFetch(request) {
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
    const r = await fetch(request).catch((err) => console.error(err));
    if (!r) return;
    const headers = new Headers(r.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers });
  }
  self.addEventListener("fetch", (e) => e.respondWith(handleFetch(e.request)));

} else {
  // ── Running as a regular script — register the SW and reload once ────────
  (async function () {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers not supported");
      return;
    }

    const registration = await navigator.serviceWorker.register(
      document.currentScript.src
    );

    // Already controlling this page — no reload needed
    if (registration.active && navigator.serviceWorker.controller) return;

    // Wait for the SW to activate, then reload so it can intercept fetches
    await new Promise((resolve, reject) => {
      const sw = registration.installing || registration.waiting;
      if (!sw) return resolve();
      sw.addEventListener("statechange", function () {
        if (this.state === "activated") resolve();
        if (this.state === "redundant") reject(new Error("SW became redundant"));
      });
    });

    console.log("COI SW installed — reloading to enable SharedArrayBuffer");
    window.location.reload();
  })().catch(console.error);
}
