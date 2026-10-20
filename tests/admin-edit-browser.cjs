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
 const headingBorder=await admin.getByText('Requests',{exact:true}).evaluate(el=>getComputedStyle(el.nextElementSibling).borderTopWidth);
 assert.equal(headingBorder,'0px','Heading must not have a divider underneath');
 await snap(admin,'23-menu-no-heading-line');
 await admin.getByText('Services',{exact:true}).click();
 await admin.getByRole('button',{name:'Edit Wash & Fold',exact:true}).click();
 assert.equal(await admin.getByPlaceholder('Key (e.g. steam)',{exact:true}).isEditable(),false);
 await admin.getByPlaceholder('Name (e.g. Steam Press)',{exact:true}).fill('QA Updated Wash');
 await admin.getByPlaceholder('Description',{exact:true}).fill('Updated service description for customer');
 const fields=await admin.locator('input,textarea').evaluateAll(xs=>xs.filter(x=>x.placeholder).map(x=>getComputedStyle(x).backgroundColor));
 assert.ok(fields.every(c=>c==='rgb(255, 255, 255)'));
 await snap(admin,'24-edit-service');
 await admin.getByText('Save',{exact:true}).click();await admin.getByText('QA Updated Wash',{exact:true}).waitFor();
 await admin.mouse.click(44,36);await admin.waitForTimeout(400);
 await admin.getByText('Items',{exact:true}).click();
 await admin.getByRole('button',{name:'Edit Shirt',exact:true}).click();
 await admin.getByPlaceholder('0',{exact:true}).first().fill('27.5');await snap(admin,'25-edit-item-price');
 await admin.getByText('Save',{exact:true}).click();await admin.waitForTimeout(500);
 const catalog=(await (await fetch('http://127.0.0.1:4411/api/items')).json()).data;
 const shirt=catalog.find(x=>x.name==='Shirt');assert.equal(shirt.prices.wash,27.5);assert.equal(shirt.prices.iron,5);
 const customer=await app(8092,'customer@example.test','Laundry123!');
 await customer.getByText('Services',{exact:true}).last().click();await customer.waitForTimeout(600);
 await customer.getByText('QA Updated Wash',{exact:true}).last().waitFor();await snap(customer,'26-customer-updated-service');
 await customer.getByText('QA Updated Wash',{exact:true}).last().click();await customer.waitForTimeout(600);
 assert.ok((await customer.locator('body').innerText()).includes('27.5'));await snap(customer,'27-customer-updated-price');
 console.log('EDITING_CUSTOMER_CATALOG_AND_WHITE_FIELDS_PASSED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
