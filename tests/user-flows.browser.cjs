// Run against user-flow-fixture.cjs and `expo start --web --port 8084`.
// Set PLAYWRIGHT_MODULE to an installed Playwright module path when not local.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const apiBase = process.env.QA_API_URL || 'http://127.0.0.1:4400';
  const webBase = process.env.QA_WEB_URL || 'http://localhost:8084';
  const email = `browser.qa.${Date.now()}@example.test`;
  const password = 'Laundry123!';
  const newPassword = 'FreshLaundry456!';
  const output = path.resolve(__dirname, '../test-results/user-flows');
  fs.mkdirSync(output, { recursive: true });
  const report = { environment: 'Local Chrome mobile viewport + isolated MongoDB; OTP email captured locally', example: { email, name: 'Mariam Browser QA', garments: '2 shirts + 1 pair of trousers', subtotal: 35, expressFee: 50, total: 85 }, results: [], fixes: ['Review ownership comparison', 'Stable profile refresh callback', 'Persist express delivery fee', 'Include agent notes in checkout callback', 'Count garment quantities consistently'], limitations: ['Real email inbox delivery not tested', 'Physical Android/iOS keyboard, autofill and GPS not tested'] };
  const context = await chromium.launch({ executablePath: process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
  const browserContext = await context.newContext({ viewport: { width: 414, height: 896 }, geolocation: { latitude: 25.2854, longitude: 51.531 }, permissions: ['geolocation'] });
  const page = await browserContext.newPage();
  page.setDefaultTimeout(12000);
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  let simulatedIp = `198.51.100.${process.pid % 200 + 1}`;
  const direct = async (method, route, body, token) => {
    const res = await fetch(apiBase + '/api' + route, { method, headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': simulatedIp, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json(); assert.ok(data.ok, JSON.stringify(data)); return data.data;
  };
  await browserContext.route(/https?:\/\/[^/]+:4000\/api\//, async route => {
    const req = route.request(); const url = new URL(req.url());
    const res = await fetch(apiBase + url.pathname + url.search, { method: req.method(), headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': simulatedIp, ...(req.headers().authorization ? { Authorization: req.headers().authorization } : {}) }, ...(req.postData() ? { body: req.postData() } : {}) });
    await route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() });
  });
  const text = value => page.getByText(value, { exact: true });
  const home = async () => { await page.goto(webBase); await text('Profile').waitFor(); };
  const screenshot = async name => page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
  let scenarioClient = 1;
  const pass = (id, name) => {
    report.results.push({ id, name, result: 'PASS' });
    console.log(`PASS ${id}: ${name}`);
    // Treat each rapid automated scenario as an independent test client.
    simulatedIp = `192.0.2.${scenarioClient++}`;
  };
  try {
    await page.goto(webBase);
    await text('Log in').click(); await text('Enter a valid email address.').waitFor();
    await page.getByPlaceholder('Email', { exact: true }).fill(email);
    await text('Log in').click(); await text('Enter your password.').waitFor();
    await text('Create Account').click();
    await page.getByPlaceholder('Full name').fill('Mariam Browser QA');
    await page.getByPlaceholder('Phone number').fill('5555012345');
    await page.getByPlaceholder('Email', { exact: true }).last().fill(email);
    await page.getByPlaceholder('Password', { exact: true }).last().fill(password);
    await text('Continue').click();
    const otpInput = page.locator('input[autocomplete="one-time-code"]');
    await otpInput.waitFor();
    const code = (await (await fetch(apiBase + '/__test/otp?email=' + email)).json()).code;
    await otpInput.fill(code);
    await text('Welcome back').waitFor();
    await page.getByPlaceholder('Email', { exact: true }).fill(email);
    await page.getByPlaceholder('Password', { exact: true }).fill('WrongPassword1!');
    await text('Log in').click(); await text('Invalid credentials').waitFor();
    pass(2, 'Empty fields and wrong credentials display errors');
    await page.getByPlaceholder('Password', { exact: true }).fill(password);
    await text('Log in').click(); await text('Profile').waitFor();
    await text('Profile').click();
    let refreshCalls = 0; const countRefresh = r => { if (r.url().endsWith('/api/auth/me')) refreshCalls++; };
    page.on('request', countRefresh); await page.waitForTimeout(1000); page.off('request', countRefresh);
    assert.ok(refreshCalls <= 3, `Profile refresh loop: ${refreshCalls} calls`);
    await text('Saved addresses').click(); await text('Add new address').click();
    const fillAddress = async (line, label) => {
      if (label) await text(label).click();
      await text('Use current location').click(); await text('Location set').waitFor();
      await text('Select a nearby area').click(); await text('Doha QA Zone').last().click();
      await page.getByPlaceholder('e.g. 12B, Lakeview Apartments').fill(line);
      await page.getByPlaceholder('e.g. MG Road, Bengaluru').fill('Al Sadd, Doha');
      await page.getByPlaceholder('560001').fill('12345');
      await page.getByPlaceholder('+974 …').fill('+97455550123');
      await text('Save address').click(); await text(line).waitFor();
    };
    await fillAddress('Flat 12, QA Building');
    await text('Edit').click(); await page.getByPlaceholder('e.g. 12B, Lakeview Apartments').fill('Flat 14, QA Building');
    await text('Update address').click(); await text('Flat 14, QA Building').waitFor();
    await text('Add new address').click(); await fillAddress('Office 5, QA Tower', 'Office');
    await text('Office 5, QA Tower').click();
    assert.match(await text('DEFAULT').locator('..').innerText(), /Office 5/);
    await text('Flat 14, QA Building').click();
    assert.match(await text('DEFAULT').locator('..').innerText(), /Flat 14/);
    pass(6, 'Add, edit, and manually select saved pickup addresses'); await screenshot('addresses');
    await home(); await text('Services').click(); await page.waitForTimeout(350);
    // Tap the visible first service card; hidden tab screens retain duplicate text.
    await page.mouse.click(180, 130); await text('Shirt').waitFor();
    assert.match(await page.locator('body').innerText(), /Men · QAR 10/);
    assert.match(await page.locator('body').innerText(), /Men · QAR 15/);
    pass(4, 'Services display the seeded catalog prices');
    const plus = name => text(name).locator('..').locator('..').locator('[tabindex="0"]').last();
    await plus('Shirt').click(); await plus('Shirt').click(); await plus('Trousers').click();
    assert.match(await page.locator('body').innerText(), /3 items · QAR 35/);
    await text('Continue').click(); await text('Express delivery').click();
    assert.match(await page.locator('body').innerText(), /QAR 85/);
    await page.locator('textarea').fill('QA: call before pickup');
    const response = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/requests'));
    await text('Place order').click();
    const saved = await (await response).json(); assert.ok(saved.ok, JSON.stringify(saved));
    const order = saved.data;
    assert.equal(order.total, 85); assert.equal(order.deliveryFee, 50); assert.equal(order.note, 'QA: call before pickup');
    assert.equal(order.items.reduce((sum, item) => sum + item.qty, 0), 3);
    await text('Your orders').waitFor();
    assert.match(await page.locator('body').innerText(), /3 items · QAR 85/);
    pass(5, 'Checkout saves correct quantities, address, notes and express total');
    const auth = await page.evaluate(() => JSON.parse(localStorage.getItem('cleanpro_auth_v1')));
    const admin = await direct('POST', '/auth/login/admin', { email: 'admin@example.test', password: 'TestAdmin1!' });
    for (const status of ['accepted', 'in_progress', 'out_for_delivery', 'delivered']) {
      await direct('PATCH', `/requests/${order.id}/status`, { status }, admin.tokens.accessToken);
      const history = await direct('GET', '/requests/mine', null, auth.accessToken);
      const notifications = await direct('GET', '/notifications/mine', null, auth.accessToken);
      assert.equal(history.find(o => o.id === order.id).status, status);
      assert.equal(notifications.find(n => n.orderId.id === order.id).orderId.status, status);
    }
    await home(); await text('Orders').click(); await text('Completed').click(); await text(order.code).last().click();
    await text('Rate this order').waitFor();
    assert.match(await page.locator('body').innerText(), /QA: call before pickup/);
    assert.match(await page.locator('body').innerText(), /QAR 50/);
    pass(8, 'Order details show garments, delivery charge, address, note and status'); await screenshot('order-details');
    await text('Rate this order').click();
    await text('How was your experience?').locator('..').locator('[tabindex="0"]').nth(4).click();
    await page.locator('textarea').fill('QA: excellent cleaning and delivery.');
    await text('Submit review').click(); await text('Thank you!').waitFor(); await screenshot('review');
    await home(); await text('Profile').click(); await text('Notifications').click(); await text('Order delivered').waitFor();
    pass(7, 'Order status updates appear in history and notifications'); await screenshot('notifications');
    await home(); await text('Profile').click(); await text('Edit profile').last().click();
    await page.getByPlaceholder('e.g. Muhammed Nihal').fill('Mariam Updated QA'); await text('Save changes').click(); await text('Mariam Updated QA').waitFor();
    await home(); await text('Profile').click(); await text('Mariam Updated QA').waitFor();
    pass(10, 'Profile edits persist and completed orders accept a five-star review');
    await text('My Profile').locator('..').locator('[tabindex="0"]').click();
    const themeToggle = () => text('Dark mode').locator('..').locator('..').getByRole('switch');
    await themeToggle().click(); await text('Switch').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('cleanpro.theme')), 'dark'); await screenshot('dark-theme');
    await home(); assert.equal(await page.evaluate(() => localStorage.getItem('cleanpro.theme')), 'dark');
    await text('Profile').click(); await text('My Profile').locator('..').locator('[tabindex="0"]').click();
    await themeToggle().click(); await text('Switch').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('cleanpro.theme')), 'light'); await screenshot('light-theme');
    pass(9, 'Light/dark selection persists after reload and switches back');
    await home(); await text('Profile').click(); await text('Sign out').click(); await text('Sign out').last().click();
    await text('Welcome back').waitFor(); assert.equal(await page.evaluate(() => localStorage.getItem('cleanpro_auth_v1')), null);
    pass(1, 'Signup, OTP verification, login and logout');
    // Reset is a separate simulated client; retain the real auth rate limiter.
    simulatedIp = `203.0.113.${process.pid % 200 + 1}`;
    await text('Forgot password?').click(); await page.getByPlaceholder('Email', { exact: true }).last().fill(email); await text('Send code').click();
    await otpInput.waitFor(); const resetCode = (await (await fetch(apiBase + '/__test/otp?email=' + email)).json()).code; await otpInput.fill(resetCode);
    await page.getByPlaceholder('New password', { exact: true }).fill(newPassword); await page.getByPlaceholder('Confirm new password', { exact: true }).fill(newPassword); await text('Reset password').last().click();
    await text('Welcome back').waitFor(); await page.getByPlaceholder('Email', { exact: true }).fill(email); await page.getByPlaceholder('Password', { exact: true }).fill(password); await text('Log in').click(); await text('Invalid credentials').waitFor();
    await page.getByPlaceholder('Password', { exact: true }).fill(newPassword); await text('Log in').click(); await text('Profile').waitFor();
    pass(3, 'OTP password reset rejects old credentials and accepts the new password');
    assert.deepEqual(pageErrors, []);
    report.result = 'PASS';
  } catch (e) {
    report.result = 'FAIL'; report.error = e.message; await screenshot('failure'); process.exitCode = 1;
    console.error(e.message);
  } finally {
    report.results.sort((a,b) => a.id-b.id); report.completedAt = new Date().toISOString(); report.pageErrors = pageErrors;
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await context.close();
  }
})();
