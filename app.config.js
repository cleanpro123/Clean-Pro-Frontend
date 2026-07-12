// Dynamic Expo config. One codebase builds two apps, selected by the
// EXPO_PUBLIC_APP_VARIANT env var (inlined into the JS bundle so the runtime
// reads the same value — see src/config/appVariant.js):
//
//   (unset) / user  → Clean Pro          (com.peweo.cleanpro)         — customer app
//   partner         → Clean Pro Partner  (com.peweo.cleanpro.partner) — admin + agent app
//
// Build examples:
//   eas build -p android --profile production            (Clean Pro)
//   eas build -p android --profile production-partner    (Clean Pro Partner)
//
// The static bits (icons, splash, plugins) come from app.json; here we only
// override what differs between the two apps.
const IS_PARTNER = (process.env.EXPO_PUBLIC_APP_VARIANT || 'user') === 'partner';

const VARIANT = IS_PARTNER
  ? {
      name: 'Clean Pro Partner',
      slug: 'clean-pro-partner',
      androidPackage: 'com.cleanpro.partner',
      iosBundleId: 'com.cleanpro.partner',
      androidBg: '#0A3D7A',
      // Partner EAS project (created via `eas init` for the partner variant).
      // Override with EAS_PROJECT_ID_PARTNER if it ever changes.
      projectId: process.env.EAS_PROJECT_ID_PARTNER || '76d2c10b-f0ce-48b3-94d5-17cbb41ea714',
    }
  : {
      name: 'Clean Pro',
      slug: 'clean-pro',
      androidPackage: 'com.cleanpro.app',
      iosBundleId: 'com.cleanpro.app',
      androidBg: '#1B6FC4',
      // User EAS project (@mhdnihal/clean-pro). Override with EAS_PROJECT_ID_USER.
      projectId: process.env.EAS_PROJECT_ID_USER || '5c5c857f-784d-46b7-8ad9-cf66d2802133',
    };

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
    appVariant: IS_PARTNER ? 'partner' : 'user',
    eas: { projectId: VARIANT.projectId },
  },
});
