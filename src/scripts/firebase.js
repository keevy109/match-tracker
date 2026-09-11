import { initializeApp } from 'firebase/app';
import { getAuth, browserSessionPersistence, setPersistence, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { prepareImage } from './image-upload.js';

// Public Firebase web configuration; authorization is enforced by server rules.
export const config = {
  apiKey: 'AIzaSyBwou6b9PdygoYVI9uh2zpe41SFcfvnQ80',
  authDomain: 'match-tracker-891ac.firebaseapp.com',
  databaseURL: 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'match-tracker-891ac',
  storageBucket: 'match-tracker-891ac.firebasestorage.app',
  messagingSenderId: '288508319365',
  appId: '1:288508319365:web:b62e1c1f794cd19e64fbec',
};
const app = initializeApp(config, 'website');
const auth = getAuth(app);
const ready = setPersistence(auth, browserSessionPersistence);
export const watchUser = callback => onAuthStateChanged(auth, callback);
export async function login(email, password) {
  await ready;
  return signInWithEmailAndPassword(auth, email, password);
}
export async function loginGoogle() {
  await ready;
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export const logout = () => signOut(auth);
export async function getToken() {
  await ready;
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}
export async function uploadImage(subpath, dataUrl) {
  if (!await getToken()) throw new Error('Bitte zuerst als Administrator anmelden.');
  return prepareImage(subpath, dataUrl);
}
