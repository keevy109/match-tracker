import { createDataStore } from './data-store.js';

const cloud = () => import('./firebase.js');
const store = createDataStore({
  baseUrl: import.meta.env.BASE_URL,
  local: import.meta.env.DEV,
  cloudUrl: 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app',
  getToken: async () => (await cloud()).getToken(),
  request: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) }),
});
export const load = store.load;
export const save = store.save;
export async function uploadImage(subpath, dataUrl) {
  return (await cloud()).uploadImage(subpath, dataUrl);
}
