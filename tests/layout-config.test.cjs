const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');

for (const variant of ['user', 'admin', 'agent']) {
  test(`${variant}: native settings disable mirroring and clear saved RTL preferences`, () => {
    const output = execFileSync(process.execPath, [
      require.resolve('expo/bin/cli'), 'config', '--type', 'introspect', '--json',
    ], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, EXPO_PUBLIC_APP_VARIANT: variant },
      encoding: 'utf8',
    });
    const config = JSON.parse(output);
    const mods = config._internal.modResults;
    const plist = mods.ios.infoPlist;
    assert.equal(plist.ExpoLocalization_supportsRTL, false);
    // In SDK 54 the presence of this key overrides supportsRTL on iOS.
    assert.equal('ExpoLocalization_forcesRTL' in plist, false);
    const strings = Object.fromEntries(mods.android.strings.resources.string.map(
      (entry) => [entry.$.name, entry._]
    ));
    assert.equal(strings.ExpoLocalization_supportsRTL, 'false');
    assert.equal(strings.ExpoLocalization_forcesRTL, 'false');
    assert.equal(config.extra.supportsRTL, false);
    assert.equal(config.extra.forcesRTL, false);
  });
}
