import { NativeModules, Platform } from 'react-native';

// Production: deployed Render backend (used in EAS preview/release builds).
const PROD_BASE_URL = 'https://clean-pro-backend.onrender.com';

// Development: talk to the backend running on your machine (`npm run dev`,
// port 4000). We derive the host from the Metro bundler URL so this works on
// an emulator AND a physical device (Expo Go) without hardcoding a LAN IP.
function devBaseUrl() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL || '';
  const match = scriptUrl.match(/^https?:\/\/([^/:]+)/);
  const host =
    match?.[1] || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
  return `http://${host}:4000`;
}

// Dev builds hit the local backend; production/EAS builds hit Render.
export const API_BASE_URL = __DEV__ ? devBaseUrl() : PROD_BASE_URL;
export const API_PREFIX = '/api';
