// Zeph's Budget — offline cache
// All budgeting data lives in localStorage/export files, never in this cache.
// Bump CACHE_NAME whenever the app files change so old copies are cleared.
var CACHE_NAME = "zephs-budget-v2";
var ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // cache: "reload" skips the browser's HTTP cache so we store the freshest files
      return cache.addAll(ASSETS.map(function(url){
        return new Request(url, { cache: "reload" });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Network-first: when online you always get the latest version (so updates arrive on their own);
// when offline, fall back to the cached copy so the app still opens.
self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then(function(response){
      if(response && response.ok && new URL(event.request.url).origin === self.location.origin){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, copy);
        });
      }
      return response;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        return cached || caches.match("./index.html");
      });
    })
  );
});
