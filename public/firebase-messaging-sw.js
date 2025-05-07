importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC_2_MbOXUiPOc3Y5CwEpFbs-tDWnutOM4",
  authDomain: "testing1-b4077.firebaseapp.com",
  projectId: "testing1-b4077",
  messagingSenderId: "302442257891",
  appId: "1:302442257891:web:1f7a7cba473e39d6b914d6"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  
  const notificationTitle = payload.notification.title || 'Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/laughing.png',
    data: payload.data
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});