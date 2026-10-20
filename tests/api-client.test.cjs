const assert = require('node:assert/strict');
const { test } = require('node:test');
const { transformSync } = require('@babel/core');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function client(status, response) {
  const filename = path.resolve(__dirname, '../src/shared/api/client.js');
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), { babelrc: false, configFile: false, plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: () => ({ API_BASE_URL: 'http://test.local', API_PREFIX: '/api' }), fetch: async () => ({ status, text: async () => response }) });
  return module.exports.api;
}
test('DELETE accepts successful empty HTTP 204 responses', async () => {
  assert.equal(await client(204, '').delete('/offers/example'), undefined);
});
test('empty non-204 and failed HTTP responses still reject', async () => {
  await assert.rejects(client(200, '').get('/offers'), /HTTP 200/);
  await assert.rejects(client(403, JSON.stringify({ok:false,error:{message:'Blocked'}})).get('/offers'), /Blocked/);
  await assert.rejects(client(500, JSON.stringify({ok:true,data:[]})).get('/offers'), /HTTP 500/);
});
