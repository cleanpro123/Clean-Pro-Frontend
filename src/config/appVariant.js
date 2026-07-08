// Which app this build is. Driven by EXPO_PUBLIC_APP_VARIANT (inlined at build
// time by Expo/Metro). Defaults to the customer app when unset.
//
//   isUser    → Clean Pro (customers): user login + signup only
//   isPartner → Clean Pro Partner: admin + agent logins
export const APP_VARIANT =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'partner' ? 'partner' : 'user';

export const isPartner = APP_VARIANT === 'partner';
export const isUser = !isPartner;
