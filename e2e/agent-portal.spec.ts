import { test, expect, BrowserContext, APIRequestContext } from '@playwright/test';

const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT || '5099'}`;

async function seedAgentSession(context: BrowserContext, request: APIRequestContext) {
  await context.route('**/*fonts.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  );
  await context.route('**/*fonts.gstatic.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'font/woff2', body: '' })
  );
  await context.route('**/*images.unsplash.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
    })
  );

  const loginRes = await request.post(`${API_ORIGIN}/api/auth/login`, {
    data: {
      email: 'agent001@zahidtravels.test',
      password: 'AgentPass123!'
    }
  });
  expect(loginRes.ok()).toBe(true);
  const { token } = (await loginRes.json()) as { token: string };

  await context.addInitScript(
    ({ jwt }) => {
      localStorage.setItem('auth_token', jwt);
    },
    { jwt: token }
  );

  return token;
}

test.describe('Kashmir Curators Agent Command Desk Real-Time E2E', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post(`${API_ORIGIN}/api/e2e/reset`);
    expect(res.ok()).toBe(true);
  });

  test('renders accurate live DB KPIs, connects real-time socket, creates persisted lead, and backs branding/team/supply/ledger by PostgreSQL', async ({
    browser,
    request
  }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const agentToken = await seedAgentSession(context, request);
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/agent');

    await expect(page.getByText('Agent Command Desk')).toBeVisible();
    await expect(page.getByText(/AGT-PARTNER-8647/)).toBeVisible();
    await expect(page.getByText(/LIVE \(WS/i)).toBeVisible({ timeout: 15000 });

    // Screenshot defect check: seeded 1 CLAIMED inquiry must appear accurately in Pipeline Stage Distribution
    await expect(page.getByText('Claimed & Active')).toBeVisible();
    await expect(page.getByText('1 (100%)')).toBeVisible();
    await expect(page.getByText('Faisal Lone').first()).toBeVisible();

    // Real-time live WebSocket sync WITHOUT page reload when a new lead is created via backend
    const createdLeadRes = await request.post(`${API_ORIGIN}/api/agents/leads`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: {
        customerName: 'Aarav Realtime Push',
        phone: '+919988112233',
        destination: 'Gulmarg',
        duration: '5 Days',
        netPrice: 66000
      }
    });
    expect(createdLeadRes.ok()).toBe(true);

    // Without reloading, Agent Command Desk receives WebSocket/SSE push and displays Aarav Realtime Push
    await expect(page.getByText('Aarav Realtime Push').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('50%').first()).toBeVisible();

    // Navigate to White-Label Branding & persist to DB
    await page.getByRole('button', { name: 'White-Label Branding' }).click();
    await page.getByPlaceholder('e.g. Zahid Travels').fill('Zahid Luxury Couture');
    await page.getByRole('button', { name: 'Save Agency Branding' }).click();
    await expect(page.getByText(/Saved to Database/i)).toBeVisible();

    // Navigate to Agency Team Seats & add persisted Pro seat
    await page.getByRole('button', { name: 'Agency Team Seats' }).click();
    await page.getByRole('button', { name: 'Add Team Seat' }).click();
    await page.getByPlaceholder('e.g. Asif Mir').fill('Bilal Sofi');
    await page.getByPlaceholder('asif@youragency.com').fill('bilal@zahidtravels.test');
    await page.getByRole('button', { name: 'Save Team Seat' }).click();
    await expect(page.getByText('Bilal Sofi', { exact: true })).toBeVisible();

    // Navigate to B2B Wholesale Supply -> verify live DB hotel & cab render + rate hold
    await page.getByRole('button', { name: 'B2B Wholesale Supply' }).click();
    await expect(page.getByText('Nigeen Royal Cedar Houseboat')).toBeVisible();
    await expect(page.getByText(/Toyota Innova Crysta/)).toBeVisible();
    await page.getByRole('button', { name: 'Lock B2B Rate for 48h' }).first().click();
    await expect(page.getByText(/Held \(HOLD-/).first()).toBeVisible();

    // Navigate to Earnings & Ledger -> verify zero mock TXN-9041 placeholder rows
    await page.getByRole('button', { name: 'Earnings & Ledger' }).click();
    await expect(page.getByText('Commission & Settlement Ledger')).toBeVisible();
    await expect(page.getByText('TXN-9041')).toHaveCount(0);

    await context.close();
    expect(consoleErrors).toEqual([]);
  });
});
