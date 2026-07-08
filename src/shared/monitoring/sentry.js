// Crash / error reporting via Sentry.
//
// Enabled only when a DSN is provided AND we're not in a dev build, so Expo Go
// and local development stay untouched. Set the DSN as an EAS/EXPO_PUBLIC env
// var (they're inlined at build time):
//
//   EXPO_PUBLIC_SENTRY_DSN=https://xxxx@oyyy.ingest.sentry.io/zzz
//
// Privacy: sendDefaultPii is false so user emails/IPs aren't attached to events
// (see the app privacy policy).
import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = !!dsn && !__DEV__;

export function initSentry() {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    // Sample a fraction of transactions for performance monitoring.
    tracesSampleRate: 0.2,
    environment: process.env.EXPO_PUBLIC_ENV || 'production',
  });
}

// Safe to call whether or not Sentry is enabled.
export function captureException(error, context) {
  if (!sentryEnabled) return;
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // never let telemetry throw into app code
  }
}

// Wrap the root component only when enabled (adds touch/nav instrumentation).
export function wrapRoot(RootComponent) {
  return sentryEnabled ? Sentry.wrap(RootComponent) : RootComponent;
}

export { Sentry };
