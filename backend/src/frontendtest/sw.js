// Service Worker pour les notifications push
const CACHE_NAME = "owly-v1";
const urlsToCache = [
  "/",
  "/login.html",
  "/conversations.html",
  "/test-style.css",
  "/test-script.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourne le cache si disponible, sinon fetch du réseau
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icon.png",
    badge: "/badge.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/conversations.html",
      conversationId: data.conversationId,
    },
    actions: [
      {
        action: "open",
        title: "Ouvrir",
      },
      {
        action: "close",
        title: "Fermer",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
