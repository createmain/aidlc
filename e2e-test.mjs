import { chromium } from 'playwright';

const BASE = 'http://localhost';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = [];

  function log(name, status, detail = '') {
    const r = { name, status, detail };
    results.push(r);
    console.log(`[${status}] ${name}${detail ? ' — ' + detail : ''}`);
  }

  // 1. Health check
  try {
    const page = await context.newPage();
    const res = await page.goto(`${BASE}/api/health`);
    const body = await res.json();
    if (body.status === 'ok' && body.db === 'connected') {
      log('API Health Check', 'PASS');
    } else {
      log('API Health Check', 'FAIL', JSON.stringify(body));
    }
    await page.close();
  } catch (e) {
    log('API Health Check', 'FAIL', e.message);
  }

  // 2. Frontend loads (customer page shows auth error without credentials)
  try {
    const page = await context.newPage();
    await page.goto(`${BASE}/customer/menu`, { waitUntil: 'networkidle' });
    const text = await page.textContent('body');
    if (text.includes('인증 오류') || text.includes('세션 만료')) {
      log('Customer Page (no auth)', 'PASS', '인증 오류 메시지 정상 표시');
    } else {
      log('Customer Page (no auth)', 'FAIL', 'Expected auth error message');
    }
    await page.close();
  } catch (e) {
    log('Customer Page (no auth)', 'FAIL', e.message);
  }

  // 3. Admin login page loads
  try {
    const page = await context.newPage();
    await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
    const title = await page.textContent('body');
    if (title.includes('관리자 로그인')) {
      log('Admin Login Page Load', 'PASS');
    } else {
      log('Admin Login Page Load', 'FAIL', 'Login form not found');
    }
    await page.close();
  } catch (e) {
    log('Admin Login Page Load', 'FAIL', e.message);
  }

  // 4. Admin login flow
  let adminPage;
  try {
    adminPage = await context.newPage();
    await adminPage.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
    await adminPage.fill('[data-testid="login-store-identifier"] input', 'default');
    await adminPage.fill('[data-testid="login-username"] input', 'admin');
    await adminPage.fill('[data-testid="login-password"] input', 'admin123');
    await adminPage.click('[data-testid="login-submit-button"]');
    await adminPage.waitForURL('**/admin/dashboard', { timeout: 10000 });
    const url = adminPage.url();
    if (url.includes('/admin/dashboard')) {
      log('Admin Login', 'PASS', 'Redirected to dashboard');
    } else {
      log('Admin Login', 'FAIL', `URL: ${url}`);
    }
  } catch (e) {
    log('Admin Login', 'FAIL', e.message);
    // Try to capture what's on screen
    if (adminPage) {
      try {
        const text = await adminPage.textContent('body');
        console.log('  Page content:', text.substring(0, 200));
      } catch {}
    }
  }

  // 5. Setup a table via API (faster and more reliable)
  let tableToken = null;
  try {
    // Get admin token from localStorage
    const token = await adminPage.evaluate(() => localStorage.getItem('admin_token'));
    
    // Setup table via API
    const setupRes = await adminPage.evaluate(async (t) => {
      const res = await fetch('/api/tables/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ tableNumber: 1, password: 'table1' }),
      });
      return { status: res.status, body: await res.json() };
    }, token);

    if (setupRes.status === 201 || setupRes.status === 200) {
      log('Table Setup', 'PASS', `Table 1 created`);
    } else if (setupRes.status === 409) {
      log('Table Setup', 'PASS', 'Table 1 already exists');
    } else {
      log('Table Setup', 'FAIL', JSON.stringify(setupRes.body));
    }

    // Table login via API
    const loginRes = await adminPage.evaluate(async () => {
      const res = await fetch('/api/auth/table-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeIdentifier: 'default', tableNumber: 1, password: 'table1' }),
      });
      return { status: res.status, body: await res.json() };
    });

    if (loginRes.status === 200 && loginRes.body.token) {
      tableToken = loginRes.body.token;
      log('Table Login API', 'PASS', `Token received, sessionId: ${loginRes.body.sessionId}`);
    } else {
      log('Table Login API', 'FAIL', JSON.stringify(loginRes.body));
    }
  } catch (e) {
    log('Table Setup / Login', 'FAIL', e.message);
  }

  // 6. Customer page with valid auth
  if (tableToken) {
    try {
      const page = await context.newPage();
      await page.goto(`${BASE}/customer/menu?store=default&table=1&password=table1`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const text = await page.textContent('body');
      if (text.includes('인증 오류') || text.includes('세션 만료')) {
        log('Customer Menu Page (authed)', 'FAIL', 'Still showing auth error');
      } else {
        log('Customer Menu Page (authed)', 'PASS', 'Menu page loaded');
      }
      await page.close();
    } catch (e) {
      log('Customer Menu Page (authed)', 'FAIL', e.message);
    }
  }

  // 7. Admin dashboard content
  try {
    if (adminPage && adminPage.url().includes('/admin/dashboard')) {
      const text = await adminPage.textContent('body');
      log('Admin Dashboard', 'PASS', text.includes('대시보드') || text.includes('주문') ? 'Dashboard content loaded' : 'Page loaded');
    }
  } catch (e) {
    log('Admin Dashboard', 'FAIL', e.message);
  }

  // 8. Menu API
  try {
    const res = await adminPage.evaluate(async () => {
      const r = await fetch('/api/categories');
      return { status: r.status, body: await r.json() };
    });
    if (res.status === 200) {
      log('Categories API', 'PASS', `${res.body.categories?.length || 0} categories`);
    } else {
      log('Categories API', 'FAIL', JSON.stringify(res.body));
    }
  } catch (e) {
    log('Categories API', 'FAIL', e.message);
  }

  // Summary
  console.log('\n========== E2E TEST SUMMARY ==========');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  results.forEach(r => console.log(`  [${r.status}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`));
  console.log('======================================');

  if (adminPage) await adminPage.close();
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
