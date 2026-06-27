const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[pageerror] ${error.message}`));
  page.on('requestfailed', request => logs.push(`[requestfailed] ${request.url()} - ${request.failure().errorText}`));

  console.log('Navigating to http://localhost:8080');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Taking login screenshot');
  await page.screenshot({ path: 'login.png' });
  
  console.log('Logging in as Supervisor');
  await page.select('#login-role', 'Supervisor');
  await page.click('#login-btn');
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'map_tab.png' });
  
  const tabs = [
    'tab-chat', 'tab-graph', 'tab-offenders', 'tab-financial', 'tab-analytics', 'tab-insights'
  ];
  
  for (const tab of tabs) {
    console.log(`Clicking ${tab}`);
    await page.click(`#${tab}`);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${tab}.png` });
  }

  console.log('Writing logs to puppeteer_logs.txt');
  fs.writeFileSync('puppeteer_logs.txt', logs.join('\n'), 'utf8');

  await browser.close();
  console.log('Done!');
})();
