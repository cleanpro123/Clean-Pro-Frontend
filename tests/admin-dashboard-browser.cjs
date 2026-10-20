const assert = require('node:assert/strict');
const { chromium } = require('/private/tmp/cleanpro-test-tools/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const contexts=[];
 async function app(port,email,password){
  const context=await browser.newContext({viewport:{width:414,height:896}});contexts.push(context);
  await context.route(/https?:\/\/[^/]+:4000\/api\//,async route=>{
   const r=route.request(),u=new URL(r.url());const response=await fetch('http://127.0.0.1:4411'+u.pathname+u.search,{method:r.method(),headers:{'Content-Type':'application/json','X-Forwarded-For':`198.51.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)+1}`,...(r.headers().authorization?{authorization:r.headers().authorization}:{})},...(r.postData()?{body:r.postData()}:{})});
   await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
  });
  const page=await context.newPage();page.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await page.goto(`http://localhost:${port}`);
  await page.getByPlaceholder('Email',{exact:true}).fill(email);
  await page.getByPlaceholder('Password',{exact:true}).fill(password);
  await page.getByText('Log in',{exact:true}).click();await page.waitForTimeout(900);
  return page;
 }
 const snap=async(page,name)=>{await page.waitForTimeout(350);await page.screenshot({path:`test-results/admin/retest/${name}.png`,fullPage:true});console.log(name,await page.locator('body').innerText());};
 try{
 const page=await app(8090,'admin@example.test','TestAdmin1!');
 await page.getByText("Today's:",{exact:true}).click();await page.waitForTimeout(700);
 for(const label of ['Last week','Last month','Last year','Today']){
  await page.getByText(label,{exact:true}).click();await page.waitForTimeout(500);await snap(page,'20-period-'+label.replaceAll(' ','-'));
 }
 const code=(await page.locator('body').innerText()).match(/NTR-[A-Z0-9]+-[A-Z0-9]+/)[0];
 await page.getByText(code,{exact:true}).click();await page.waitForTimeout(600);
 for(const label of ['Mark in progress','Out for delivery','Delivered']){
  await page.getByText(label,{exact:true}).last().click();await page.getByText('Update',{exact:true}).click();await page.waitForTimeout(600);
 }
 await page.mouse.click(44,36);await page.waitForTimeout(900);await snap(page,'21-dashboard-after-delivery');
 const refreshed=await page.locator('body').innerText();
 assert.ok(refreshed.includes('QAR 75'), 'Delivered direct order revenue must refresh on focus');
 assert.ok(refreshed.includes('2 orders'), 'Dashboard must include both order types');
 await page.getByText('Last week',{exact:true}).click();await page.waitForTimeout(300);await page.getByText('Today',{exact:true}).click();await page.waitForTimeout(700);await snap(page,'22-dashboard-period-reload');
 console.log('DASHBOARD_COMBINED_TOTALS_AND_REFRESH_PASSED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
