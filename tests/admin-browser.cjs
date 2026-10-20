const { chromium } = require('/private/tmp/cleanpro-test-tools/node_modules/playwright');
const fs = require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:414,height:896}});
 await context.route(/https?:\/\/[^/]+:4000\/api\//,async route=>{
  const req=route.request(),u=new URL(req.url());
  const res=await fetch('http://127.0.0.1:4411'+u.pathname+u.search,{method:req.method(),headers:{'Content-Type':'application/json','X-Forwarded-For':`198.51.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)+1}`,...(req.headers().authorization?{authorization:req.headers().authorization}:{})},...(req.postData()?{body:req.postData()}:{})});
  await route.fulfill({status:res.status,contentType:'application/json',body:await res.text()});
 });
 const page=await context.newPage();page.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await page.goto('http://localhost:8090'); await page.waitForTimeout(4000);
 console.log(await page.locator('body').innerText());
 console.log('INPUTS',await page.locator('input').evaluateAll(xs=>xs.map(x=>({placeholder:x.placeholder,type:x.type}))));
 await page.screenshot({path:'test-results/admin/retest/01-login.png'});
 await page.getByPlaceholder('Email',{exact:true}).fill('admin@example.test');
 await page.getByPlaceholder('Password',{exact:true}).fill('TestAdmin1!');
 await page.getByText('Log in',{exact:true}).click();
 await page.getByText('Menu',{exact:true}).waitFor({timeout:20000});
 console.log('MENU',await page.locator('body').innerText());
 console.log('BUTTONS',await page.getByRole('button').evaluateAll(xs=>xs.map(x=>({label:x.getAttribute('aria-label'),text:x.innerText}))));
 await page.waitForTimeout(800);
 await page.screenshot({path:'test-results/admin/retest/02-menu.png'});
 const snap=async(name)=>{await page.waitForTimeout(400);await page.screenshot({path:`test-results/admin/retest/${name}.png`,fullPage:true});console.log(name,await page.locator('body').innerText());};
 const back=async()=>{await page.mouse.click(44,36);await page.waitForTimeout(350);};
 const bell=await page.getByRole('button',{name:'Notifications',exact:true}).boundingBox();
 console.log('BELL_POSITION',bell,'three-dot menu at x=372; bell must be left');
 await page.getByRole('button',{name:'Notifications',exact:true}).click();
 await page.waitForTimeout(500);
 await snap('03-notifications');
 const updates=page.getByRole('button').filter({hasText:'Aisha QA'});
 console.log('NOTIFICATION_ORDERS',await updates.count());
 for(let n=0;n<2;n++){
  await updates.nth(n).click();await page.waitForTimeout(400);await snap(`04-notification-detail-${n}`);await back();
 }
 await back();
 await page.getByText('Requests',{exact:true}).click();await page.waitForTimeout(500);await snap('05-orders');
 console.log('SEARCH_FIELDS',await page.locator('input').evaluateAll(xs=>xs.map(x=>x.placeholder)));
 const codes=await page.locator('body').innerText();
 await page.locator('input').fill('Aisha');await snap('06-order-search');
 await back();
 for(const label of ['Services','Items','Offers','Agents','Users']){
  await page.getByText(label,{exact:true}).click();await page.waitForTimeout(400);await snap(`07-${label}-list`);
  if(label!=='Users'){
   await page.mouse.click(370,36);await page.waitForTimeout(350);await snap(`08-${label}-dialog`);
   console.log(label+' FIELDS',await page.locator('input,textarea').evaluateAll(xs=>xs.map(x=>({placeholder:x.placeholder,background:getComputedStyle(x).backgroundColor,parentBackground:getComputedStyle(x.parentElement).backgroundColor}))));
   const suffix=Date.now().toString().slice(-6);
   if(label==='Services'){
    await page.getByPlaceholder('Key (e.g. steam)',{exact:true}).fill('qa'+suffix);
    await page.getByPlaceholder('Name (e.g. Steam Press)',{exact:true}).fill('QA Steam '+suffix);
    await page.getByPlaceholder('Description',{exact:true}).fill('Browser-created example service');
    await page.getByText('Add service',{exact:true}).click();
    await page.getByText('QA Steam '+suffix,{exact:true}).waitFor();
    const catalog=await (await fetch('http://127.0.0.1:4411/api/services')).json();
    if(!catalog.data.some(x=>x.name==='QA Steam '+suffix))throw Error('Created service missing from customer catalog');
   }else if(label==='Items'){
    await page.getByPlaceholder('Item name',{exact:true}).fill('QA Jacket '+suffix);
    await page.getByPlaceholder('0',{exact:true}).first().fill('30');
    await page.getByText('Add item',{exact:true}).click();
    await page.getByText('QA Jacket '+suffix,{exact:true}).waitFor();
    const catalog=await (await fetch('http://127.0.0.1:4411/api/items')).json();
    if(!catalog.data.some(x=>x.name==='QA Jacket '+suffix && Object.values(x.prices).includes(30)))throw Error('Created price missing from customer catalog');
   }else if(label==='Offers'){
    await page.getByPlaceholder('Code (e.g. SUMMER20)',{exact:true}).fill('QA'+suffix);
    await page.getByPlaceholder('Label',{exact:true}).fill('Browser QA offer');
    await page.getByPlaceholder('Discount (20% or QAR 50)',{exact:true}).fill('20%');
    await page.getByText('Add offer',{exact:true}).click();
    await page.getByText('QA'+suffix,{exact:true}).waitFor();
   }else{
    const cancel=page.getByText('Cancel',{exact:true});if(await cancel.count()) await cancel.click();
   }
   await snap(`08-${label}-created`);
  }
  await back();
 }
 await page.getByText("Today's:",{exact:true}).click();await page.waitForTimeout(600);await snap('09-dashboard');
 fs.writeFileSync('test-results/admin/retest/ui-observations.json',JSON.stringify({bell,menuText:codes},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
