const { withInfoPlist } = require('expo/config-plugins');

// expo-localization 17 treats the presence of forcesRTL (even false) as
// supportsRTL=true on iOS. Leave only supportsRTL=false there; Android needs
// forcesRTL=false as well to clear preferences saved by previous builds.
module.exports = function withFixedLayout(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.ExpoLocalization_supportsRTL = false;
    delete config.modResults.ExpoLocalization_forcesRTL;
    return config;
  });
};
