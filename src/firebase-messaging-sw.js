importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAqPSTJyW-3iL3qAmkff4QaX8NTd7uLGpY",
    authDomain: "angulartaste-577cd.firebaseapp.com",
    databaseURL: "https://angulartaste-577cd-default-rtdb.firebaseio.com",
    projectId: "angulartaste-577cd",
    storageBucket: "angulartaste-577cd.firebasestorage.app",
    messagingSenderId: "700718634726",
    appId: "1:700718634726:web:566775d4e7077d1dc90d27",
    measurementId: "G-J95ZYGGMD6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon/favicon.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});