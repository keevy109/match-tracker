import { initializeApp } from 'firebase/app';
import { getAuth, browserSessionPersistence, setPersistence, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(app);
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
  if (!/^(kader|trainer)\/(portraits|detail)$|^vereine\/badges$/.test(subpath)) throw new Error('Ungültiges Bildziel.');
  const match = /^data:(image\/(?:png|jpeg|webp));base64,/.exec(dataUrl);
  if (!match) throw new Error('Bitte ein PNG-, JPEG- oder WebP-Bild auswählen.');
  if (dataUrl.length > 7 * 1024 * 1024) throw new Error('Das Bild ist zu groß (maximal 5 MB).');
  const extension = match[1].split('/')[1];
  const target = ref(storage, `website/${subpath}/${crypto.randomUUID()}.${extension}`);
  await uploadString(target, dataUrl, 'data_url', { contentType: match[1] });
  return getDownloadURL(target);
}
