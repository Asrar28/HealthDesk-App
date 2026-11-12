// HealthDesk PWA Service Worker
const CACHE_NAME = 'healthdesk-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/alarm.mp3',
];

// Supabase configuration for background background action calls
const SUPABASE_URL = 'https://flhenypnqafowzkillwl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R4KY0GpSlk-SorMsASebBQ_Q3YXxzlR';

// Install event: cache app shell for offline support
self.addEventListener('install', (event) => {
  console.log('[PUSH] Service Worker installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.warn('[PUSH] Cache prefetch error:', err))
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[PUSH] Service Worker activated');
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  // Never intercept or cache Supabase API calls or WebSocket connections
  if (url.includes('/rest/v1/') || url.includes('/auth/v1/') || url.includes('/functions/v1/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html')))
  );
});

// Push event: receive background notification payload from Edge Function / Web Push
self.addEventListener('push', (event) => {
  console.log('[PUSH] push event received');
  let data = {
    title: 'HealthDesk Reminder',
    body: 'Time for your scheduled health checkup or medication.',
    reminderId: 'default',
    type: 'reminder',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const title = data.title || 'HealthDesk Reminder';
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.reminderId ? `reminder-${data.reminderId}` : 'healthdesk-reminder',
    requireInteraction: true,
    renotify: true,
    data: {
      reminderId: data.reminderId,
      type: data.type || 'reminder',
      url: '/planner',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'done', title: 'Mark Done' },
      { action: 'snooze', title: 'Snooze 5 min' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  const reminderId = data.reminderId;

  console.log('[PUSH] notification clicked, action:', action, 'reminderId:', reminderId);
  notification.close();

  // Action: Mark Done
  if (action === 'done' && reminderId && reminderId !== 'default') {
    event.waitUntil(
      fetch(`${SUPABASE_URL}/rest/v1/reminders?id=eq.${reminderId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: 'completed',
          is_completed: true,
          notified: true,
          updated_at: new Date().toISOString(),
        }),
      }).catch((err) => console.error('[PUSH] Error updating reminder status in sw:', err))
    );
    return;
  }

  // Action: Snooze 5 min
  if (action === 'snooze' && reminderId && reminderId !== 'default') {
    const snoozeUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    event.waitUntil(
      fetch(`${SUPABASE_URL}/rest/v1/reminders?id=eq.${reminderId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          snoozed_until: snoozeUntil,
          notified: false,
          updated_at: new Date().toISOString(),
        }),
      }).catch((err) => console.error('[PUSH] Error snoozing reminder in sw:', err))
    );
    return;
  }

  // Default click (open or focus window on /planner)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate('/planner');
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/planner');
      }
    })
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  console.log('[PUSH] notification dismissed:', event.notification.tag);
});
