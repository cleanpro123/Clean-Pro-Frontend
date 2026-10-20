// Requires Playwright installed separately: PLAYWRIGHT_MODULE=/path/to/playwright node tests/agent-browser.cjs
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname,'../../artifacts/agent-qa');
const results=[];
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext({viewport:{width:430,height:932}});const page=await context.newPage();
 await context.route('https://www.google.com/maps/dir/**', route=>route.fulfill({status:200,body:'QA directions target verified'}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async(name,fn)=>{try{await context.setExtraHTTPHeaders({'X-Forwarded-For':`203.0.113.${results.length+10}`});await fn();results.push({name,status:'PASS'});console.log('PASS',name)}catch(e){results.push({name,status:'FAIL',error:e.message});await page.screenshot({path:path.join(output,'failure.png')});throw e;}};
 const text=(s)=>page.getByText(s,{exact:true}).filter({visible:true});const click=async(s)=>text(s).last().click();
 const login=async(email,password)=>{await page.locator('input').nth(0).fill(email);await page.locator('input').nth(1).fill(password);await click('Log in');};
 const home=async()=>{await page.reload();await page.getByRole('button',{name:'Profile',exact:true}).waitFor();};
 const order=code=>page.getByRole('button',{name:code,exact:true});
 try{
 await page.goto(process.env.AGENT_QA_URL||'http://127.0.0.1:8085/');await page.locator('input').first().waitFor();
 await check('1: browser rejects customer and admin credentials; accepts agent',async()=>{
   for(const [email,pw] of [['customer.qa@example.test','AgentTest123!'],['admin@example.test','TestAdmin1!']]){await login(email,pw);await text('Invalid credentials').waitFor();}
   await login('agent.qa@example.test','AgentTest123!');await page.getByRole('button',{name:'Profile',exact:true}).waitFor();
 });
 await check('2,4: all 120 assigned orders across tabs, unique rows, no other/unassigned orders',async()=>{
   const seen=[];
   for(const [tab,count] of [['New Orders',20],['Accepted',60],['Order History',40]]){await click(tab);await page.waitForFunction(n=>document.querySelectorAll('[aria-label^="QA-"]').length===n,count);const codes=await page.locator('[aria-label^="QA-"]').evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')));assert.equal(codes.length,count);assert.equal(new Set(codes).size,count);assert.ok(codes.every(s=>!s.includes('OTHER')&&!s.includes('UNASSIGNED')));seen.push(...codes);}
   assert.equal(new Set(seen).size,120);await click('New Orders');await page.screenshot({path:path.join(output,'01-orders-light.png'),fullPage:true});
 });
 await check('8: bell sits left of profile and notifications open both order types',async()=>{
   const bell=page.getByRole('button',{name:'Notifications',exact:true}),profile=page.getByRole('button',{name:'Profile',exact:true});assert.ok((await bell.boundingBox()).x<(await profile.boundingBox()).x);
   await bell.click();await text('Recent order updates').waitFor();
   for(const kind of ['normal','special']){const row=page.locator(`[aria-label^="QA-${kind}-"]:visible`).first();await row.waitFor();const code=await row.getAttribute('aria-label');await row.click();await text('Request details').waitFor();await text(`QA ${kind} order ${Number(code.split('-').pop())}`).waitFor();await home();await page.getByRole('button',{name:'Notifications',exact:true}).click();await text('Recent order updates').waitFor();}
   await home();
 });
 await check('3,5: regular/direct details, customer address, phone and real directions target',async()=>{
   for(const kind of ['normal','special']){
    await order(`QA-${kind}-000`).click();await text('Request details').waitFor();await text('QA Customer').waitFor();await text('+97455552001').waitFor();await page.getByText('Flat 12, QA Building',{exact:false}).first().waitFor();await text(`QA ${kind} order 0`).waitFor();
    if(kind==='normal') await text('QA Shirt').waitFor();else assert.equal(await text('QA Shirt').count(),0);
    const popupPromise=context.waitForEvent('page');await page.getByRole('button',{name:/Directions to pickup/}).click();const popup=await popupPromise;await popup.waitForURL(/google.*maps/).catch(()=>{});assert.ok(popup.url().includes('destination=25.2854%2C51.531'));await popup.close();
    await page.screenshot({path:path.join(output,`02-${kind}-details.png`),fullPage:true});await home();
   }
 });
 await check('9: price input is white; light/dark choice survives reload and navigation',async()=>{
   await order('QA-normal-000').click();await page.getByRole('button',{name:'Edit total price',exact:true}).click();const input=page.locator('input').last();await input.waitFor();assert.equal(await input.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');await click('Cancel');await home();
   await page.getByRole('button',{name:'Profile',exact:true}).click();await page.getByRole('switch').waitFor();await page.getByRole('switch').click();await click('Switch');await page.waitForFunction(()=>localStorage.getItem('cleanpro.theme')==='dark');await home();assert.equal(await page.evaluate(()=>localStorage.getItem('cleanpro.theme')),'dark');await page.locator('[aria-label^="QA-"]:visible').first().waitFor();await page.screenshot({path:path.join(output,'03-orders-dark.png'),fullPage:true});
   await page.getByRole('button',{name:'Profile',exact:true}).click();await page.getByRole('switch').click();await click('Switch');await page.waitForFunction(()=>localStorage.getItem('cleanpro.theme')==='light');await home();
 });
 await check('7,10: failed price save retains value and allows successful retry',async()=>{
   await order('QA-normal-000').click();await page.getByRole('button',{name:'Edit total price',exact:true}).click();await page.locator('input').last().fill('77.25');let attempts=0;
   const pattern='**/api/requests/*/total';const fail=async route=>{attempts++;await route.abort('failed');};await page.route(pattern,fail);await click('Save');await text("Couldn't update the price").waitFor();await click('OK');assert.equal(await page.locator('input').last().inputValue(),'77.25');assert.equal(attempts,1);await page.unroute(pattern,fail);await click('Save');await text('QAR 77.25').waitFor();await home();
 });
 await check('6,10: failed status update and lost-response retry apply one change',async()=>{
  await order('QA-normal-000').click();const pattern='**/api/requests/*/status';let attempts=0;let applied;
  const fail=async route=>{attempts++;await route.abort('failed');};await page.route(pattern,fail);await click('Accept request');await click('Accept');await text('Could not update').waitFor();await click('OK');assert.equal(attempts,1);await page.unroute(pattern,fail);
  const lose=async route=>{const response=await route.fetch();applied=await response.json();await route.abort('failed');};await page.route(pattern,lose);await click('Accept request');await click('Accept');await text('Could not update').waitFor();await click('OK');await page.unroute(pattern,lose);
  const responsePromise=page.waitForResponse(r=>r.url().includes('/status')&&r.request().method()==='PATCH');await click('Accept request');await click('Accept');const replay=await(await responsePromise).json();assert.equal(replay.data.updatedAt,applied.data.updatedAt);await text('Start work').waitFor();await home();await click('Accepted');await order('QA-normal-000').waitFor();
 });
 await check('7: closed orders hide price editing and status actions',async()=>{
  await click('Order History');for(const code of ['QA-normal-004','QA-normal-005','QA-special-004','QA-special-005']){await order(code).click();await text('This request is closed.').waitFor();assert.equal(await page.getByRole('button',{name:'Edit total price',exact:true}).count(),0);await home();await click('Order History');}
 });
 await check('10: failed list fetch shows error and Retry restores complete list',async()=>{
  const pattern='**/api/special-requests/assigned*';const fail=route=>route.abort('failed');await page.route(pattern,fail);await home();await page.getByRole('alert').waitFor();await page.unroute(pattern,fail);await page.getByRole('button',{name:'Retry',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('[aria-label^="QA-"]').length===19);
 });
 await check('No uncaught browser errors',async()=>assert.deepEqual(errors,[]));
 } finally {fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({results,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
