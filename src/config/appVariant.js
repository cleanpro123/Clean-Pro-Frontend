// Which app this build is. Driven by EXPO_PUBLIC_APP_VARIANT (inlined at build
// time by Expo/Metro). Defaults to the customer app when unset.
//
//   isUser  → Clean Pro        (customers): user login + signup only
//   isAdmin → Clean Pro Admin   : admin login only
//   isAgent → Clean Pro Agent   : agent login only
const V = process.env.EXPO_PUBLIC_APP_VARIANT;

export const APP_VARIANT =
  V === 'admin' ? 'admin' : V === 'agent' ? 'agent' : 'user';

export const isAdmin = APP_VARIANT === 'admin';
export const isAgent = APP_VARIANT === 'agent';
export const isUser = APP_VARIANT === 'user';
