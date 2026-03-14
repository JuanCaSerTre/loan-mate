/**
 * LoanMate — Firebase Messaging Service Worker
 * Handles background push notifications when the app is not in focus.
 */

/* eslint-disable no-undef */
/* global self, importScripts, firebase */

// Import Firebase scripts for the service worker
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

let messagingInstance = null;

// Listen for config messages from the main app thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    try {
      const config = event.data.config;
      if (config && config.apiKey && config.projectId) {
        // Avoid re-initializing if already done
        if (!messagingInstance) {
          const app = firebase.initializeApp(config, "bg-" + Date.now());
          messagingInstance = firebase.messaging(app);

          messagingInstance.onBackgroundMessage((payload) => {
            console.log("[LoanMate SW] Background message:", payload);
            const title = payload.notification?.title || "JUCA";
            const options = {
              body: payload.notification?.body || "You have a new notification",
              icon: "/vite.svg",
              badge: "/vite.svg",
              data: payload.data || {},
              vibrate: [200, 100, 200],
              tag: (payload.data && payload.data.type) ? payload.data.type : "juca-notification",
              renotify: true,
            };
            self.registration.showNotification(title, options);
          });
        }
      }
    } catch (error) {
      console.warn("[LoanMate SW] Firebase init error:", error.message);
    }
  }
});

// Handle notification click — deep-link into app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const data = event.notification.data || {};
  let url = "/";
  if (data.type === "loan_request" && data.loanId) {
    url = "/?screen=loan-request&loanId=" + data.loanId;
  } else if (data.loanId) {
    url = "/?screen=loan-details&loanId=" + data.loanId;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "NOTIFICATION_CLICK", data });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Handle raw push events (fallback for browsers without FCM)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = (payload.notification && payload.notification.title) || "JUCA";
    const options = {
      body: (payload.notification && payload.notification.body) || "",
      icon: "/vite.svg",
      badge: "/vite.svg",
      data: payload.data || {},
      vibrate: [200, 100, 200],
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Not JSON, ignore
  }
});
