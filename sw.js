// ── Level Up Tracker — Service Worker ────────────────────────────────────────
const CACHE = "levelup-v1";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── Push notification handler ────────────────────────────────────────────────
self.addEventListener("push", e => {
  const data = e.data?.json() || { title: "Level Up", body: "Time to log your habits! 💪" };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "daily-reminder",
    renotify: true,
    actions: [{ action: "open", title: "Open tracker" }]
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(list => {
    for (const c of list) { if (c.url && "focus" in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow("/");
  }));
});

// ── Scheduled local reminder (alarm via postMessage) ─────────────────────────
self.addEventListener("message", e => {
  if (e.data?.type === "SCHEDULE_REMINDER") {
    const { hour, minute } = e.data;
    scheduleNext(hour, minute);
  }
});

function scheduleNext(hour, minute) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  setTimeout(() => {
    self.registration.showNotification("Level Up ⚡", {
      body: "Time to log today's habits!",
      tag: "daily-reminder",
      renotify: true,
    });
    scheduleNext(hour, minute); // reschedule for next day
  }, delay);
}
