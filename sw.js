const CACHE='aventura-numerica-v3';
const ASSETS=["./", "./index.html", "./loader.js", "./manifest.webmanifest", "./icons/icon.svg", "./parts/styles.0.txt", "./parts/styles.1.txt", "./parts/styles.2.txt", "./parts/app.0.txt", "./parts/app.1.txt", "./parts/app.2.txt", "./parts/app.3.txt", "./parts/app.4.txt", "./parts/app.5.txt"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match('./index.html'))))});
