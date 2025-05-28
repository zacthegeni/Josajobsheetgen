self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("job-sheet-cache").then((cache) => {
      return cache.addAll(["/", "/manifest.json", "/icon.png", "/NEW-JOB-SHEET-2024.pdf"])
    }),
  )
})

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)))
})
