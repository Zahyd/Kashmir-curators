import { test, expect } from '@playwright/test';

const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT || '5099'}`;

test.describe('Admin Dashboard Login & RBAC Redirect Isolation', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post(`${API_ORIGIN}/api/e2e/reset`);
    expect(res.ok()).toBe(true);
  });

  test('ADMIN001 authenticates via /sales/auth and loads /admin without redirecting to /sales/portal', async ({ browser, request }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.route('**/*fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await context.route('**/*fonts.gstatic.com/**', (route) => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));

    const loginRes = await request.post(`${API_ORIGIN}/api/auth/team-login`, {
      data: { code: 'ADMIN001' },
    });
    expect(loginRes.ok()).toBe(true);
    const { user, token } = (await loginRes.json()) as {
      user: { id: string; code: string; name: string; role: string; email?: string };
      token: string;
    };
    expect(user.role).toBe('admin');

    await context.addInitScript(
      ({ authUser, jwt }) => {
        localStorage.setItem('team_user', JSON.stringify({ ...authUser, loginTime: new Date().toISOString() }));
        localStorage.setItem('teamToken', jwt);
      },
      { authUser: user, jwt: token }
    );

    const page = await context.newPage();
    await page.goto('/sales/auth');
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
    await expect(page.getByText('Director 001').first()).toBeVisible({ timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/sales\/portal/);
    await expect(page.getByText(/Role 'agent' is not authorized/i)).toHaveCount(0);

    await context.close();
  });

  test('never bounces non-staff agent role into /sales/portal or displays SALES_EXECUTIVE badge', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.route('**/*fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await context.route('**/*fonts.gstatic.com/**', (route) => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));

    // Simulate a poisoned localStorage team_user where ADMIN001 previously held role='agent'
    await context.addInitScript(() => {
      localStorage.setItem(
        'team_user',
        JSON.stringify({
          id: 'u-agent-poisoned',
          code: 'ADMIN001',
          name: 'Zahid',
          role: 'agent',
          loginTime: new Date().toISOString(),
        })
      );
      localStorage.setItem('teamToken', 'invalid-agent-token');
    });

    const page = await context.newPage();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/sales\/auth$/, { timeout: 15_000 });
    await expect(page.getByText(/SALES_EXECUTIVE/i)).toHaveCount(0);
    await expect(page.getByText(/Role 'agent' is not authorized/i)).toHaveCount(0);

    await page.goto('/sales/portal');
    await expect(page).toHaveURL(/\/sales\/auth$/, { timeout: 15_000 });
    await expect(page.getByText(/SALES_EXECUTIVE/i)).toHaveCount(0);

    await context.close();
  });
});
