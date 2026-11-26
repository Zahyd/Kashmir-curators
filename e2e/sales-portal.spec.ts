import { test, expect, BrowserContext, APIRequestContext } from '@playwright/test';

const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT || '5099'}`;
const PORTAL_URL = '/sales/portal';

async function seedRealTeamSession(
  context: BrowserContext,
  request: APIRequestContext,
  code: string
) {
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
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    })
  );

  const loginRes = await request.post(`${API_ORIGIN}/api/auth/team-login`, {
    data: { code },
  });
  expect(loginRes.ok()).toBe(true);
  const { user, token } = (await loginRes.json()) as {
    user: { id: string; code: string; name: string; role: string; email?: string };
    token: string;
  };

  await context.addInitScript(
    ({ authUser, jwt }) => {
      localStorage.setItem(
        'team_user',
        JSON.stringify({
          ...authUser,
          loginTime: new Date().toISOString(),
        })
      );
      localStorage.setItem('teamToken', jwt);
    },
    { authUser: user, jwt: token }
  );
}

test.describe('Kashmir Curators Sales Portal 2.0 E2E', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post(`${API_ORIGIN}/api/e2e/reset`);
    expect(res.ok()).toBe(true);
  });

  test('verifies every module route renders real DB data and Payment Links never displays AI Itinerary Studio', async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seedRealTeamSession(context, request, 'ADMIN001');
    const page = await context.newPage();

    const moduleDestinations = [
      { tab: 'dashboard', heading: 'Executive Command Center', marker: /Live Inbound Lead Queue/i },
      { tab: 'live-leads', heading: 'Live Inbound Queue', marker: /Zoya Khan/i },
      { tab: 'meta-hub', heading: 'Meta Raw Leads Hub', marker: /Amina Al-Fayed/i },
      { tab: 'active-pipeline', heading: 'Active Concierge Pipeline', marker: /Rohan Kapoor/i },
      { tab: 'builder', heading: 'Itinerary Builder Studio', marker: /AI Autonomous Itinerary Studio/i },
      { tab: 'vault', heading: 'Inquiry Document Vault', marker: /Compliance Registry/i },
      { tab: 'clients', heading: 'Client Directory & CRM', marker: /Rohan Kapoor/i },
      { tab: 'payments', heading: 'Payment Links & Ledger', marker: /Payment Links & Settlement Ledger/i },
      { tab: 'team-rbac', heading: 'Team Roster & RBAC', marker: /Executive 001/i },
      { tab: 'work-log', heading: 'Attendance & Work Log', marker: /Clock|Shift/i },
    ];

    for (const mod of moduleDestinations) {
      await page.goto(`${PORTAL_URL}?tab=${mod.tab}`);
      await expect(page.getByRole('heading', { name: mod.heading }).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(mod.marker).first()).toBeVisible({ timeout: 15_000 });

      if (mod.tab === 'payments' || mod.tab === 'vault') {
        await expect(page.getByText('AI Autonomous Itinerary Studio')).toHaveCount(0);
        await expect(page.getByText('1-Click AI Itinerary Copilot')).toHaveCount(0);
      }
    }

    // Critical regression check: select an inquiry in Itinerary Studio, then click Payment Links in sidebar
    await page.goto(`${PORTAL_URL}?tab=builder&inquiryId=e2e-lead-claimed`);
    await expect(page.getByText('Rohan Kapoor').first()).toBeVisible();
    await page.getByRole('navigation', { name: 'Sales Portal Modules' }).getByRole('button', { name: /Payment Links/i }).click();
    await expect(page).toHaveURL(/tab=payments/);
    await expect(page).not.toHaveURL(/inquiryId=/);
    await expect(page.getByText('Payment Links & Settlement Ledger')).toBeVisible();
    await expect(page.getByText('AI Autonomous Itinerary Studio')).toHaveCount(0);

    await context.close();
  });

  test('supports collapsible sidebar, Ctrl+K search, single Notification Center ACK, pipeline drag-and-drop, and mobile 375px layout', async ({
    browser,
    request,
  }) => {
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seedRealTeamSession(desktopCtx, request, 'ADMIN001');
    const page = await desktopCtx.newPage();
    await page.goto(PORTAL_URL);

    // Collapsible Sidebar
    await page.getByRole('button', { name: /Collapse sidebar/i }).click({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Expand sidebar/i })).toBeVisible();
    await page.getByRole('button', { name: /Expand sidebar/i }).click();
    await expect(page.getByRole('button', { name: /Collapse sidebar/i })).toBeVisible();

    // Ctrl+K Global Command Search (target quick-nav inside the dialog rather than obscured sidebar)
    await page.keyboard.press('Control+k');
    const searchDialog = page.getByRole('dialog');
    await expect(searchDialog.getByPlaceholder(/Search travelers, phone, lead ID/i)).toBeVisible();
    await searchDialog.getByRole('button', { name: /Payment Links/i }).click();
    await expect(page).toHaveURL(/tab=payments/);

    // Notification Center (single mounted button across responsive breakpoints) + DB persistence on Ack All
    const notifBtns = page.getByRole('button', { name: /Open notification center/i });
    await expect(notifBtns).toHaveCount(1);
    await notifBtns.click();
    await expect(page.getByText(/Priority E2E Inquiry/i)).toBeVisible();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/notifications/read-all') && res.ok()),
      page.getByRole('button', { name: /Ack All/i }).click(),
    ]);
    await page.reload();
    await page.getByRole('button', { name: /Open notification center/i }).click();
    await expect(page.getByRole('button', { name: /Ack All/i })).toHaveCount(0);

    // Active Pipeline Drag-and-Drop stage update + DB reload persistence
    await page.goto(`${PORTAL_URL}?tab=active-pipeline`);
    const dragHandle = page.getByRole('button', { name: 'Drag Rohan Kapoor' });
    const targetCol = page.locator('[data-stage-column="QUOTE_SENT"]');
    await expect(dragHandle).toBeVisible();
    await expect(targetCol).toBeVisible();

    const dragBox = await dragHandle.boundingBox();
    const targetBox = await targetCol.boundingBox();
    expect(dragBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    if (dragBox && targetBox) {
      const stageUpdateRes = page.waitForResponse(
        (res) =>
          res.url().includes('/api/sales/leads/e2e-lead-claimed/stage') &&
          res.request().method() === 'PATCH' &&
          res.ok()
      );
      await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 120, { steps: 18 });
      await page.mouse.up();
      await stageUpdateRes;
    }

    await expect(targetCol.getByText('Rohan Kapoor')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-stage-column="QUOTE_SENT"]').getByText('Rohan Kapoor')).toBeVisible();
    await desktopCtx.close();

    // Mobile 375px layout check
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    await seedRealTeamSession(mobileCtx, request, 'SALES001');
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(PORTAL_URL);
    await expect(mobilePage.getByRole('navigation', { name: 'Sales Mobile Navigation Dock' })).toBeVisible({ timeout: 20_000 });
    await expect(mobilePage.getByRole('button', { name: /Open notification center/i })).toHaveCount(1);
    const hasHorizontalOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
    await mobileCtx.close();
  });

  test('validates multi-session real-time WebSocket sync and concurrent claim conflict handling', async ({
    browser,
    request,
  }) => {
    const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await seedRealTeamSession(ctxA, request, 'ADMIN001');
    await seedRealTeamSession(ctxB, request, 'SALES002');

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    await Promise.all([
      pageA.goto(`${PORTAL_URL}?tab=live-leads`),
      pageB.goto(`${PORTAL_URL}?tab=live-leads`),
    ]);

    // Wait for both Socket.IO sessions to connect cleanly
    await expect(pageA.getByText(/Live WS/i)).toBeVisible({ timeout: 20_000 });
    await expect(pageB.getByText(/Live WS/i)).toBeVisible({ timeout: 20_000 });
    await expect(pageA.getByText('Zoya Khan')).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByText('Zoya Khan')).toBeVisible({ timeout: 15_000 });

    // Create an unassigned lead in session A via real UI modal -> verify real-time push into session B without reload
    await pageA.getByRole('button', { name: /New Lead/i }).first().click();
    const modal = pageA.getByRole('dialog');
    await modal.getByPlaceholder('e.g. Tariq Lone').fill('Kabir LiveSync');
    await modal.getByPlaceholder('+91 99060 XXXXX').fill('+919876543210');
    await modal.getByRole('button', { name: 'Create Lead' }).click();

    await expect(pageB.getByRole('heading', { name: 'Kabir LiveSync' })).toBeVisible({ timeout: 10_000 });

    // Concurrent claim on Zoya Khan across two sessions:
    // Exactly one wins (transitions to ?tab=builder&inquiryId=e2e-lead-unclaimed), while the other stays on live-leads with Zoya removed
    const claimA = pageA
      .locator('.grid-cols-1 > div', { hasText: 'Zoya Khan' })
      .getByRole('button', { name: /CLAIM & BUILD/i })
      .first();
    const claimB = pageB
      .locator('.grid-cols-1 > div', { hasText: 'Zoya Khan' })
      .getByRole('button', { name: /CLAIM & BUILD/i })
      .first();

    await Promise.all([claimA.click(), claimB.click()]);

    await expect(async () => {
      const urlA = pageA.url();
      const urlB = pageB.url();
      const aWon = urlA.includes('tab=builder');
      const bWon = urlB.includes('tab=builder');
      expect(Number(aWon) + Number(bWon)).toBe(1);
    }).toPass({ timeout: 10_000 });

    const loserPage = pageA.url().includes('tab=builder') ? pageB : pageA;
    await expect(loserPage).toHaveURL(/tab=live-leads/);
    await expect(loserPage.getByText('Zoya Khan')).toHaveCount(0, { timeout: 10_000 });

    await ctxA.close();
    await ctxB.close();
  });
});
