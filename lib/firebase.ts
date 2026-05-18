import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

if (!firebaseConfig.apiKey) {
  console.warn('Firebase config incomplete - check .env.local');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      messaging = getMessaging(app);
    }
  });
}

export { app, auth, messaging };
