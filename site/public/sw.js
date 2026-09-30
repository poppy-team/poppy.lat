/*
 * The service worker of the installed app. It does three small things:
 *
 *  - pages are fetched from the network first, so a lesson is never stale,
 *    and the last copy read is kept for when there is no connection;
 *  - files with a hash in the name (scripts, styles, fonts, images) never
 *    change, so they are kept and served from the cache;
 *  - with no connection and no copy, /offline.html explains what happened.
 *
 * It never touches the API, accounts, sign-in, anything that is not a GET, or
 * any other site: nothing private is ever stored here. The version is written
 * at build time, so every deploy starts a fresh cache and drops the old ones.
 */
const VERSION = '__BUILD_VERSION__';
const STATIC = `poppy-static-${VERSION}`;
const PAGES = `poppy-pages-${VERSION}`;
const OFFLINE = '/offline.html';
const MAX_PAGES = 60;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll([OFFLINE, '/assets/app-icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => ![STATIC, PAGES].includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

function isPrivate(url) {
  return url.pathname.startsWith('/api/') || url.pathname === '/api' || url.pathname.startsWith('/conta/entrar');
}

async function trim(cache) {
  const keys = await cache.keys();

  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((key) => cache.delete(key)));
}

async function page(request) {
  try {
    const response = await fetch(request);

    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(PAGES);

      await cache.put(request, response.clone());
      await trim(cache);
    }

    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match(OFFLINE)) ?? Response.error();
  }
}

async function asset(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(STATIC);

    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || isPrivate(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(page(request));
  } else if (url.pathname.startsWith('/assets/') || url.pathname === '/vp-icons.css') {
    event.respondWith(asset(request));
  }
});
