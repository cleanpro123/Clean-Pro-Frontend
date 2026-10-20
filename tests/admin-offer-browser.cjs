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
 await page.getByText('Offers',{exact:true}).click();await page.waitForTimeout(600);
 const offerCode='QA'+Date.now().toString().slice(-6);
 await page.mouse.click(370,36);
 await page.getByPlaceholder('Code (e.g. SUMMER20)',{exact:true}).fill(offerCode);
 await page.getByPlaceholder('Label',{exact:true}).fill('Lifecycle QA');
 await page.getByPlaceholder('Discount (20% or QAR 50)',{exact:true}).fill('20%');
 await page.getByText('Add offer',{exact:true}).click();await page.getByText(offerCode,{exact:true}).waitFor();
 const card=page.getByText(offerCode,{exact:true}).locator('..').locator('..').locator('..');
 const publicOffers=async()=> (await (await fetch('http://127.0.0.1:4411/api/offers')).json()).data;
 await card.getByRole('switch').click();await page.getByText('Deactivate',{exact:true}).click();await page.waitForTimeout(500);
 assert.ok(!(await publicOffers()).some(x=>x.code===offerCode));await snap(page,'17-offer-deactivated');
 await card.getByRole('switch').click();await page.getByText('Activate',{exact:true}).click();await page.waitForTimeout(500);
 assert.ok((await publicOffers()).some(x=>x.code===offerCode));await snap(page,'18-offer-activated');
 await card.locator('[tabindex="0"]').last().click();await page.getByText('Delete',{exact:true}).click();await page.waitForTimeout(500);
 assert.ok(!(await publicOffers()).some(x=>x.code===offerCode));await snap(page,'19-offer-deleted');
 assert.ok(!(await page.locator('body').innerText()).includes('Could not delete'),'Offer was deleted on server, but UI incorrectly reports Could not delete / HTTP 204');
 console.log('OFFER LIFECYCLE UI PASSED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
