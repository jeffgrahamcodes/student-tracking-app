import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD1S-2xjDteUPoXwwwEzjXaccG8S1Z2Gyk',
  authDomain: 'student-tracking-app-eba24.firebaseapp.com',
  projectId: 'student-tracking-app-eba24',
  storageBucket: 'student-tracking-app-eba24.firebasestorage.app',
  messagingSenderId: '245794196868',
  appId: '1:245794196868:web:4042588fa1c33e90fd21d1',
  measurementId: 'G-GZ8HCQ19Z6',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
