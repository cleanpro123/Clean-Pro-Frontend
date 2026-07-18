// Dynamic Expo config. One codebase builds THREE apps, selected by the
// EXPO_PUBLIC_APP_VARIANT env var (inlined into the JS bundle so the runtime
// reads the same value — see src/config/appVariant.js):
//
//   (unset) / user  → Clean Pro        (com.cleanpro.app)   — customer app
//   admin           → Clean Pro Admin  (com.cleanpro.admin) — admin app
//   agent           → Clean Pro Agent  (com.cleanpro.agent) — agent app
//
// Build examples:
//   eas build -p android --profile production          (Clean Pro)
//   eas build -p android --profile production-admin    (Clean Pro Admin)
//   eas build -p android --profile production-agent    (Clean Pro Agent)
//
// The static bits (icons, splash, plugins) come from app.json; here we only
// override what differs between the apps.
const VARIANTS = {
  user: {
    name: 'Clean Pro',
    slug: 'clean-pro',
    androidPackage: 'com.cleanpro.app',
    iosBundleId: 'com.cleanpro.app',
    androidBg: '#1B6FC4',
    // User EAS project (@mhdnihal/clean-pro). Override with EAS_PROJECT_ID_USER.
    projectId: process.env.EAS_PROJECT_ID_USER || '5c5c857f-784d-46b7-8ad9-cf66d2802133',
  },
  admin: {
    name: 'Clean Pro Admin',
    slug: 'clean-pro-admin',
    androidPackage: 'com.cleanpro.admin',
    iosBundleId: 'com.cleanpro.admin',
    androidBg: '#0A3D7A',
    // Reuses the former Partner EAS project. Override with EAS_PROJECT_ID_ADMIN.
    projectId: process.env.EAS_PROJECT_ID_ADMIN || '76d2c10b-f0ce-48b3-94d5-17cbb41ea714',
  },
  agent: {
    name: 'Clean Pro Agent',
    slug: 'clean-pro-agent',
    androidPackage: 'com.cleanpro.agent',
    iosBundleId: 'com.cleanpro.agent',
    androidBg: '#0A5C3D',
    // Needs its own EAS project: run `eas init` for this app, then set
    // EAS_PROJECT_ID_AGENT (or replace the empty default below).
    projectId: process.env.EAS_PROJECT_ID_AGENT || '',
  },
};

const VARIANT_KEY = process.env.EXPO_PUBLIC_APP_VARIANT || 'user';
const VARIANT = VARIANTS[VARIANT_KEY] || VARIANTS.user;

module.exports = ({ config }) => ({
  ...config,
  name: VARIANT.name,
  slug: VARIANT.slug,
  ios: {
    ...config.ios,
    bundleIdentifier: VARIANT.iosBundleId,
  },
  android: {
    ...config.android,
    package: VARIANT.androidPackage,
    adaptiveIcon: {
      ...(config.android?.adaptiveIcon || {}),
      backgroundColor: VARIANT.androidBg,
    },
  },
  extra: {
    ...config.extra,
    appVariant: VARIANT_KEY in VARIANTS ? VARIANT_KEY : 'user',
    eas: { projectId: VARIANT.projectId },
  },
});
