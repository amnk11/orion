import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

// Remove any caching of /api/* from default cache to prevent caching PHI
const filteredCache = defaultCache.filter((cache) => {
  if (cache.matcher instanceof RegExp) {
    if (cache.matcher.toString().includes("/api/")) return false;
  }
  if (typeof cache.matcher === "string") {
    if (cache.matcher.includes("/api/")) return false;
  }
  return true;
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // NEVER cache /api/ endpoints to prevent PHI leaks
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    ...filteredCache,
  ],
});

serwist.addEventListeners();
