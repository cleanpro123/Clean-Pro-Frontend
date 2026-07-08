import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cleanpro_auth_v1';

export async function loadAuth() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveAuth(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export async function clearAuth() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
