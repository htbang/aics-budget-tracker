importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAm_bADKYdS-8b_dsbcQ6bGxQQFkGXClTg',
  authDomain: 'aics-worksho-c390c.firebaseapp.com',
  projectId: 'aics-worksho-c390c',
  storageBucket: 'aics-worksho-c390c.appspot.com',
  messagingSenderId: '735509063748',
  appId: '1:735509063748:web:6e3c6a17f3d8a7e9b2c1d4f5',
});

const messaging = firebase.messaging();

// 백그라운드에서 알림 수신
messaging.onBackgroundMessage(payload => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'convenience-stock-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '확인',
      },
    ],
  };

  // 진동 API 호출
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    });
  }
});
