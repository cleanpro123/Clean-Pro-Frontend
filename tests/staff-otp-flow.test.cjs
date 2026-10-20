const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('@babel/core');

function harness(endpoint) {
  const slots = [];
  const calls = [];
  let cursor = 0;
  let created = 0;
  const react = {
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = value;
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: value };
      return slots[index];
    },
    useEffect() {},
  };
  const mocks = {
    react,
    'react-native': {},
    '../../shared/api/client': { api: { post: async (url, body) => {
      calls.push({ url, body });
      return { codeLength: 6 };
    } } },
    '../../shared/i18n/LanguageContext': {},
    '../../shared/theme/ThemeContext': {},
  };
  const filename = path.resolve(__dirname, '../src/admin/components/StaffOtpStep.js');
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) { assert.ok(name in mocks, name); return mocks[name]; },
  });
  const render = () => {
    cursor = 0;
    return module.exports.useStaffOtp({ endpoint, visible: true, onCreated: () => { created++; } });
  };
  return { render, calls, created: () => created };
}

for (const endpoint of ['/admins', '/agents']) {
  test(`${endpoint}: send code first, then create with the code and original details`, async () => {
    const h = harness(endpoint);
    const payload = { name: 'New account', email: ' NEW@Example.com ', password: 'secret' };
    await h.render().begin(payload);
    let flow = h.render();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, `${endpoint}/otp/request`);
    assert.equal(h.calls[0].body.email, 'new@example.com');
    assert.equal(h.created(), 0);
    await flow.confirm();
    assert.equal(h.calls.length, 1, 'An empty code must not submit creation');
    flow.setCode('123456');
    flow = h.render();
    await flow.confirm();
    assert.equal(h.calls[1].url, endpoint);
    assert.equal(h.calls[1].body.otpCode, '123456');
    assert.equal(h.calls[1].body.password, payload.password);
    assert.equal(h.created(), 1);
    assert.equal(h.render().pending, null);
  });
}

test('editing recipient details clears the previous verification code', async () => {
  const h = harness('/agents');
  await h.render().begin({ email: 'first@example.com' });
  h.render().setCode('123456');
  h.render().back();
  assert.equal(h.render().pending, null);
  await h.render().begin({ email: 'second@example.com' });
  assert.equal(h.render().code, '');
  assert.equal(h.render().pending.email, 'second@example.com');
  await h.render().confirm();
  assert.equal(h.created(), 0);
});
