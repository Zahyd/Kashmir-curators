import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

(async () => {
  console.log('Starting dev server...');
  const devServer = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
  
  // Wait a few seconds for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => {
    console.error('BROWSER PAGE ERROR:', error.message);
  });
  page.on('requestfailed', request => {
    console.error('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded successfully');
  } catch (err) {
    console.error('Navigation error:', err.message);
  }

  await browser.close();
  devServer.kill();
  process.exit(0);
})();
