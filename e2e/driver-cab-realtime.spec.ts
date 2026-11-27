import { test, expect, BrowserContext } from '@playwright/test';

const API_ORIGIN = `http://127.0.0.1:${process.env.E2E_API_PORT || '5099'}`;

async function stubExternalAssets(context: BrowserContext) {
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
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"/>',
    })
  );
  await context.route('**/*basemaps.cartocdn.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: '' })
  );
  await context.route('**/*unpkg.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );
}

test.describe('Real-Time Driver Cockpit, KYC RBAC & Tourist Auto Pop-Up Cab Cards E2E', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post(`${API_ORIGIN}/api/e2e/reset`);
    expect(res.ok()).toBe(true);
  });

  test('blocks pending KYC driver until Admin approves, then unlocks cockpit cleanly', async ({
    browser,
    request,
  }) => {
    const driverCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await stubExternalAssets(driverCtx);
    const driverPage = await driverCtx.newPage();

    await driverPage.goto('/driver');
    await driverPage.getByRole('button', { name: /Pilot Login/i }).click();
    await driverPage.getByTestId('driver-login-email').fill('pendingdriver@kashmircabs.test');
    await driverPage.getByTestId('driver-login-password').fill('DriverPass123!');
    await driverPage.getByTestId('driver-login-submit').click();

    await expect(driverPage.getByText(/Awaiting Command Desk Approval/i)).toBeVisible({
      timeout: 15_000,
    });

    // Admin signs in via team-login & approves pending driver via API / Admin desk
    const adminLoginRes = await request.post(`${API_ORIGIN}/api/auth/team-login`, {
      data: { code: 'ADMIN001' },
    });
    expect(adminLoginRes.ok()).toBe(true);
    const { token: adminToken } = (await adminLoginRes.json()) as { token: string };

    const opsRes = await request.get(`${API_ORIGIN}/api/cabs/operations/data`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(opsRes.ok()).toBe(true);
    const opsData = (await opsRes.json()) as {
      drivers: Array<{ email: string; driverProfile?: { id: string } }>;
    };
    const pendingDriver = opsData.drivers.find((d) => d.email === 'pendingdriver@kashmircabs.test');
    expect(pendingDriver?.driverProfile?.id).toBeTruthy();

    const reviewRes = await request.post(
      `${API_ORIGIN}/api/cabs/operations/drivers/${pendingDriver!.driverProfile!.id}/review`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { action: 'APPROVE', approvePendingVehicles: true, issuePortalKey: true },
      }
    );
    expect(reviewRes.ok()).toBe(true);

    // Real-time Socket.IO 'driver-kyc-reviewed' may already unlock the cockpit before click; handle either path
    const goBtn = driverPage.getByRole('button', { name: /^GO$/i });
    const refreshBtn = driverPage.getByRole('button', { name: /Check Approval Status Now/i });
    if (!(await goBtn.isVisible().catch(() => false)) && (await refreshBtn.isVisible().catch(() => false))) {
      await refreshBtn.click({ timeout: 5_000 }).catch(() => {});
    }
    await expect(goBtn).toBeVisible({ timeout: 15_000 });
    await driverCtx.close();
  });

  test('unlocks /driver via KC-DRV key, pushes real-time tourist Auto Pop-Up Cab request -> driver accept -> PIN booking', async ({
    browser,
    request,
  }) => {
    // 1. Driver Context authenticates with seeded Portal Key KC-DRV-E2E001
    const driverCtx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
    await stubExternalAssets(driverCtx);
    const driverPage = await driverCtx.newPage();

    await driverPage.goto('/driver');
    await driverPage.getByTestId('driver-portal-key-input').fill('KC-DRV-E2E001');
    await driverPage.getByTestId('driver-portal-key-submit').click();

    await expect(driverPage.getByText('Toyota Innova Crysta')).toBeVisible({ timeout: 15_000 });
    await expect(driverPage.getByText('JK01C-4099')).toBeVisible();
    await expect(driverPage.getByText("Today's Take")).toBeVisible();

    // Ensure driver is searching online
    const goBtn = driverPage.getByRole('button', { name: /^GO$/i });
    if (await goBtn.isVisible().catch(() => false)) {
      await goBtn.click();
    }
    await expect(driverPage.getByText(/Finding Trips in Kashmir/i)).toBeVisible({ timeout: 15_000 });

    // 2. Tourist Context signs in & visits /cabs -> Auto Pop-Up Cab UI Cards automatically appear
    const touristLoginRes = await request.post(`${API_ORIGIN}/api/auth/login`, {
      data: { email: 'tourist001@kashmircabs.test', password: 'TouristPass123!' },
    });
    expect(touristLoginRes.ok()).toBe(true);
    const { token: touristToken } = (await touristLoginRes.json()) as { token: string };

    const touristCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await stubExternalAssets(touristCtx);
    await touristCtx.addInitScript(
      ({ jwt }) => {
        localStorage.setItem('auth_token', jwt);
      },
      { jwt: touristToken }
    );
    const touristPage = await touristCtx.newPage();

    await touristPage.goto('/cabs');

    const popup = touristPage.getByTestId('auto-cab-popup-cards');
    await expect(popup).toBeVisible({ timeout: 15_000 });
    await expect(popup.getByText(/1 Chauffeurs Live/i)).toBeVisible({ timeout: 10_000 });
    await expect(popup.getByText('Toyota Innova Crysta')).toBeVisible();

    // Select quick corridor & send live ride request from Auto Pop-Up Card
    await popup.getByRole('button', { name: /Srinagar ➔ Gulmarg/i }).click({ timeout: 10_000 });
    await popup.getByRole('button', { name: /Request Live Ride/i }).first().click({ timeout: 10_000 });

    await expect(popup.getByText(/Live Dispatch Offers/i)).toBeVisible({ timeout: 15_000 });

    // 3. Driver receives real-time incoming ride offer without reload & accepts!
    const acceptTripBtn = driverPage.getByRole('button', { name: /Accept Trip/i });
    const openBtn = driverPage.getByText(/Open →/i).first();
    await expect(acceptTripBtn.or(openBtn)).toBeVisible({ timeout: 15_000 });
    if (!(await acceptTripBtn.isVisible().catch(() => false))) {
      await openBtn.click({ timeout: 5_000 }).catch(() => {});
    }
    await expect(acceptTripBtn).toBeVisible({ timeout: 15_000 });
    await acceptTripBtn.click({ timeout: 10_000 });

    // 4. Tourist confirms live driver offer in Auto Pop-Up Card & receives real Boarding Security PIN!
    const confirmOfferBtn = popup.getByRole('button', { name: /Confirm Chauffeur at ₹/i }).first();
    await expect(confirmOfferBtn).toBeVisible({ timeout: 15_000 });
    await confirmOfferBtn.click({ timeout: 10_000 });

    const finalConfirmBtn = touristPage.getByRole('button', { name: /Confirm & Book Chauffeur/i });
    await expect(finalConfirmBtn).toBeVisible({ timeout: 10_000 });
    await finalConfirmBtn.click({ timeout: 10_000 });

    await expect(touristPage.getByText(/Ride Booked Successfully!/i)).toBeVisible({ timeout: 15_000 });
    await touristPage.getByRole('button', { name: /Track Live Status/i }).click({ timeout: 10_000 });
    await expect(touristPage.getByTestId('tourist-boarding-pin')).toBeVisible({ timeout: 10_000 });

    await touristCtx.close();
    await driverCtx.close();
  });

  test('renders and operates /driver and /cabs cleanly on Mobile Chrome (360x740 touch viewport)', async ({
    browser,
    request,
  }) => {
    const mobileDriverCtx = await browser.newContext({
      viewport: { width: 360, height: 740 },
      isMobile: true,
      hasTouch: true,
    });
    await stubExternalAssets(mobileDriverCtx);
    const mobileDriverPage = await mobileDriverCtx.newPage();

    const driverPageErrors: string[] = [];
    mobileDriverPage.on('pageerror', (err) => driverPageErrors.push(err.message));

    await mobileDriverPage.goto('/driver');
    await mobileDriverPage.getByTestId('driver-portal-key-input').fill('KC-DRV-E2E001');
    await mobileDriverPage.getByTestId('driver-portal-key-submit').click();

    await expect(mobileDriverPage.getByText("Today's Take")).toBeVisible({ timeout: 15_000 });

    const goBtn = mobileDriverPage.getByRole('button', { name: /^GO$/i });
    const goOfflineBtn = mobileDriverPage.getByRole('button', { name: /Go Offline/i });
    await expect(goBtn.or(goOfflineBtn)).toBeVisible({ timeout: 15_000 });

    if (await goOfflineBtn.isVisible().catch(() => false)) {
      await goOfflineBtn.click();
    }

    await expect(goBtn).toBeVisible({ timeout: 15_000 });

    const goBox = await goBtn.boundingBox();
    expect(goBox).toBeTruthy();
    expect(goBox!.y + goBox!.height).toBeLessThanOrEqual(740);

    const overflowOffline = await mobileDriverPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflowOffline).toBe(false);

    await goBtn.click();
    await expect(mobileDriverPage.getByText(/Finding Trips in Kashmir/i)).toBeVisible({ timeout: 15_000 });

    await expect(goOfflineBtn).toBeVisible();
    const goOfflineBox = await goOfflineBtn.boundingBox();
    expect(goOfflineBox).toBeTruthy();
    expect(goOfflineBox!.x + goOfflineBox!.width).toBeLessThanOrEqual(360);
    expect(goOfflineBox!.y + goOfflineBox!.height).toBeLessThanOrEqual(740);

    const overflowOnline = await mobileDriverPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflowOnline).toBe(false);

    // Tourist Mobile Chrome (360x740 touch) views /cabs Auto Pop-Up Cards & books live cab
    const touristLoginRes = await request.post(`${API_ORIGIN}/api/auth/login`, {
      data: { email: 'tourist001@kashmircabs.test', password: 'TouristPass123!' },
    });
    expect(touristLoginRes.ok()).toBe(true);
    const { token: touristToken } = (await touristLoginRes.json()) as { token: string };

    const mobileTouristCtx = await browser.newContext({
      viewport: { width: 360, height: 740 },
      isMobile: true,
      hasTouch: true,
    });
    await stubExternalAssets(mobileTouristCtx);
    await mobileTouristCtx.addInitScript(
      ({ jwt }) => {
        localStorage.setItem('auth_token', jwt);
      },
      { jwt: touristToken }
    );
    const mobileTouristPage = await mobileTouristCtx.newPage();

    const touristPageErrors: string[] = [];
    mobileTouristPage.on('pageerror', (err) => touristPageErrors.push(err.message));

    await mobileTouristPage.goto('/cabs');
    const popup = mobileTouristPage.getByTestId('auto-cab-popup-cards');
    await expect(popup).toBeVisible({ timeout: 15_000 });

    const popupBox = await popup.boundingBox();
    expect(popupBox).toBeTruthy();
    expect(popupBox!.x).toBeGreaterThanOrEqual(0);
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(360);
    expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(740);

    const overflowTourist = await mobileTouristPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflowTourist).toBe(false);

    // Minimize and reopen on mobile Chrome
    await popup.getByRole('button', { name: /Minimize cab cards/i }).click();
    const reopenBtn = mobileTouristPage.getByTestId('reopen-cab-popup-btn');
    await expect(reopenBtn).toBeVisible();
    await reopenBtn.click();
    await expect(popup).toBeVisible();

    await popup.getByRole('button', { name: /Request Live Ride/i }).first().click({ timeout: 10_000 });
    await expect(popup.getByText(/Live Dispatch Offers/i)).toBeVisible({ timeout: 15_000 });

    // Driver accepts live request & slide-to-confirm bar fits cleanly inside 360x740 mobile viewport
    const acceptTripBtn = mobileDriverPage.getByRole('button', { name: /Accept Trip/i });
    const openBtn = mobileDriverPage.getByText(/Open →/i).first();
    await expect(acceptTripBtn.or(openBtn)).toBeVisible({ timeout: 15_000 });
    if (!(await acceptTripBtn.isVisible().catch(() => false))) {
      await openBtn.click({ timeout: 5_000 }).catch(() => {});
    }
    await expect(acceptTripBtn).toBeVisible({ timeout: 15_000 });
    await acceptTripBtn.click({ timeout: 10_000 });

    // Tourist confirms live driver offer on 360x740 mobile Chrome -> receives real Boarding PIN!
    const confirmOfferBtn = popup.getByRole('button', { name: /Confirm Chauffeur at ₹/i }).first();
    await expect(confirmOfferBtn).toBeVisible({ timeout: 15_000 });
    await confirmOfferBtn.click({ timeout: 10_000 });

    const finalConfirmBtn = mobileTouristPage.getByRole('button', { name: /Confirm & Book Chauffeur/i });
    await expect(finalConfirmBtn).toBeVisible({ timeout: 10_000 });
    await finalConfirmBtn.click({ timeout: 10_000 });

    await expect(mobileTouristPage.getByText(/Ride Booked Successfully!/i)).toBeVisible({ timeout: 15_000 });
    await mobileTouristPage.getByRole('button', { name: /Track Live Status/i }).click({ timeout: 10_000 });
    await expect(mobileTouristPage.getByTestId('tourist-boarding-pin')).toBeVisible({ timeout: 10_000 });

    // Driver transitions to active trip -> Slide-to-Confirm bar fits cleanly inside 360x740 mobile viewport
    const slideText = mobileDriverPage.getByText(/Slide to Arrive at Pickup/i);
    await expect(slideText).toBeVisible({ timeout: 15_000 });
    const slideBox = await slideText.boundingBox();
    expect(slideBox).toBeTruthy();
    expect(slideBox!.y + slideBox!.height).toBeLessThanOrEqual(740);

    expect(driverPageErrors).toEqual([]);
    expect(touristPageErrors).toEqual([]);

    await mobileTouristCtx.close();
    await mobileDriverCtx.close();
  });
});
