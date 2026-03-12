/**
 * LoanMate — Firebase Messaging Service Worker
 * Handles background push notifications when the app is not in focus.
 */

/* eslint-disable no-undef */
/* global self, importScripts, firebase */

// Import Firebase scripts for the service worker
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize Firebase in the service worker
// These will be overridden if FCM is configured
firebase.initializeApp({
  apiKey: "",
  projectId: "",
  messagingSenderId: "",
  appId: "",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[LoanMate SW] Background message:", payload);

  const notificationTitle = payload.notification?.title || "LoanMate";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/vite.svg",
    badge: "/vite.svg",
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  // Open the app or focus existing window
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
