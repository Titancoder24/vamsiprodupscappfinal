// Service Worker for Web Push Notifications
// This file handles push notifications in the background

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');

    let data = {
        title: 'PrepAssist Update',
        body: 'New content available!',
        icon: '/icon.png',
        badge: '/badge.png',
        data: {}
    };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('[Service Worker] Error parsing push data:', e);
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click:', event.action);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open the app or specific URL
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Check if app is already open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activated');
    event.waitUntil(clients.claim());
});
