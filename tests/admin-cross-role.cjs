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
  const admin=await app(8090,'admin@example.test','TestAdmin1!');
  await admin.getByText('Requests',{exact:true}).click();await admin.waitForTimeout(500);
  const codes=(await admin.locator('body').innerText()).match(/NTR-[A-Z0-9]+-[A-Z0-9]+/g);assert.equal(codes.length,2);
  for(let n=0;n<codes.length;n++){
   await admin.getByText(codes[n],{exact:true}).click();await admin.waitForTimeout(400);
   await admin.getByText('Change agent',{exact:true}).click();await admin.waitForTimeout(250);
   await snap(admin,`10-assign-dialog-${n}`);
   await admin.getByText('QA Agent 2',{exact:true}).last().click();
   await admin.getByText('Change',{exact:true}).click();await admin.waitForTimeout(400);
   await admin.getByText('Total',{exact:true}).locator('..').locator('[tabindex="0"]').click();
   await admin.getByPlaceholder('0',{exact:true}).fill(n===0?'75':'45');
   await snap(admin,`11-price-dialog-${n}`);
   await admin.getByText('Save',{exact:true}).click();await admin.waitForTimeout(350);
   if(await admin.getByText('Accept',{exact:true}).count()){await admin.getByText('Accept',{exact:true}).click();await admin.getByText('Update',{exact:true}).click();await admin.waitForTimeout(600);}
   await snap(admin,`12-admin-updated-${n}`);
   await admin.mouse.click(44,36);await admin.waitForTimeout(300);
  }
  const agent=await app(8091,'agent2@example.test','Laundry123!');await snap(agent,'13-agent-assigned-list');
  await agent.getByText('Accepted',{exact:true}).click();await agent.waitForTimeout(700);await snap(agent,'13-agent-accepted-list');
  for(let n=0;n<codes.length;n++){
   await agent.getByText(codes[n],{exact:true}).click();await agent.waitForTimeout(600);
   await snap(agent,`13-agent-detail-${n}`);
   assert.ok((await agent.locator('body').innerText()).includes(n===0?'QAR 75':'QAR 45'));
   await agent.mouse.click(44,36);await agent.waitForTimeout(400);
  }
  const customer=await app(8092,'customer@example.test','Laundry123!');await snap(customer,'14-customer-home');
  await customer.getByText('Orders',{exact:true}).last().click();await customer.waitForTimeout(700);await snap(customer,'15-customer-orders');
  for(let n=0;n<codes.length;n++){
   await customer.getByText(codes[n],{exact:true}).last().click();await customer.waitForTimeout(600);
   await snap(customer,`16-customer-detail-${n}`);
   assert.ok((await customer.locator('body').innerText()).includes(n===0?'QAR 75':'QAR 45'));
   await customer.mouse.click(44,36);await customer.waitForTimeout(400);
  }
  console.log('CROSS ROLE SETUP PASSED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
