const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('@babel/core');

const root = path.resolve(__dirname, '..');

// Exercise the real provider and dictionaries with deterministic native and
// storage substitutes. No device is required to check language transitions.
function createHarness(savedLanguage, persistedRTL = false, web = false) {
  const states = [];
  const effects = [];
  const nativeCalls = [];
  const stored = new Map([['cleanpro.language', savedLanguage]]);
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    useContext: () => null,
    useState(initial) {
      const slot = cursor++;
      if (!(slot in states)) states[slot] = initial;
      return [states[slot], (value) => { states[slot] = value; }];
    },
    useEffect(effect) { if (!states.length || !effects.length) effects.push(effect); },
    useCallback: (fn) => fn,
    createElement: (type, props) => ({ type, props }),
  };
  const mocks = {
    react,
    'react-native': {
      I18nManager: {
        isRTL: persistedRTL,
        allowRTL: (value) => nativeCalls.push(['allowRTL', value]),
        forceRTL: (value) => nativeCalls.push(['forceRTL', value]),
        swapLeftAndRightInRTL: (value) => nativeCalls.push(['swapLeftAndRightInRTL', value]),
      },
      DevSettings: { reload() { throw new Error('Language must not restart the app'); } },
    },
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => stored.get(key),
      setItem: async (key, value) => { stored.set(key, value); },
    },
  };
  if (web) delete mocks['react-native'].I18nManager.swapLeftAndRightInRTL;
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    cache.set(filename, module.exports);
    const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
    });
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require(name) {
        if (name in mocks) return mocks[name];
        if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.js`));
        throw new Error(`Unexpected import: ${name}`);
      },
    }, { filename });
    return module.exports;
  }
  const { LanguageProvider } = load(path.join(root, 'src/shared/i18n/LanguageContext.js'));
  function render() {
    cursor = 0;
    return LanguageProvider({ children: null }).props.value;
  }
  return { render, effects, nativeCalls, stored };
}

test('English → Arabic → English changes and persists text without enabling RTL', async () => {
  const h = createHarness('en');
  let context = h.render();
  const englishTitle = context.t('language.title');
  await context.setLanguage('ar');
  context = h.render();
  assert.equal(context.language, 'ar');
  assert.equal(context.t('language.title'), 'اللغة');
  assert.equal(context.td('service', 'wash'), 'غسيل وطي');
  assert.equal(context.isRTL, false);
  assert.equal(h.stored.get('cleanpro.language'), 'ar');
  await context.setLanguage('en');
  context = h.render();
  assert.equal(context.t('language.title'), englishTitle);
  assert.equal(context.isRTL, false);
  assert.ok(h.nativeCalls.length >= 3);
  assert.ok(h.nativeCalls.every(([, value]) => value === false));
});

test('upgrading a saved Arabic/RTL installation restores Arabic and becomes ready without reload', async () => {
  const h = createHarness('ar', true);
  h.render();
  h.effects[0]();
  await new Promise(setImmediate);
  const context = h.render();
  assert.equal(context.ready, true);
  assert.equal(context.language, 'ar');
  assert.equal(context.t('language.title'), 'اللغة');
  assert.equal(context.isRTL, false);
  assert.ok(h.nativeCalls.some(([method, value]) => method === 'forceRTL' && value === false));
});

test('web starts and restores language without the native RTL swap method', async () => {
  const h = createHarness('ar', false, true);
  h.render();
  h.effects[0]();
  await new Promise(setImmediate);
  const context = h.render();
  assert.equal(context.ready, true);
  assert.equal(context.t('language.title'), 'اللغة');
  assert.equal(context.isRTL, false);
});

test('unsupported language leaves the selected language and storage unchanged', async () => {
  const h = createHarness('en');
  await h.render().setLanguage('invalid');
  assert.equal(h.render().language, 'en');
  assert.equal(h.stored.get('cleanpro.language'), 'en');
});
