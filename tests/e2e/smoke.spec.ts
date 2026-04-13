import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test.describe("Public pages", () => {
  test("Landing page loads", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Mentora/i);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("Theme toggle switches theme", async ({ page }) => {
    await page.goto(BASE);
    const html = page.locator("html");
    const before = await html.getAttribute("class");
    await page.getByRole("button", { name: /тем/i }).click();
    const after = await html.getAttribute("class");
    expect(before).not.toEqual(after);
  });

  test("Auth page loads with form", async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("Pricing page loads", async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await expect(page).toHaveTitle(/Тариф/i);
  });

  test("Privacy page loads", async ({ page }) => {
    await page.goto(`${BASE}/privacy`);
    await expect(page).toHaveTitle(/Конфид/i);
  });

  test("Terms page loads", async ({ page }) => {
    await page.goto(`${BASE}/terms`);
    await expect(page).toHaveTitle(/Услов/i);
  });

  test("404 page renders", async ({ page }) => {
    const res = await page.goto(`${BASE}/this-does-not-exist-xyz`);
    expect(res?.status()).toBe(404);
  });
});

test.describe("API security", () => {
  test("Chat API requires auth", async ({ request }) => {
    const res = await request.post(`${BASE}/api/chat`, {
      data: { message: "test", subject: "history" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("Admin stats API requires auth", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/stats`);
    expect(res.status()).toBe(403);
  });

  test("Admin health API requires auth", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/health`);
    expect(res.status()).toBe(403);
  });
});

test.describe("Mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("No horizontal scroll on landing", async ({ page }) => {
    await page.goto(BASE);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const vpWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(vpWidth + 5);
  });

  test("Theme toggle visible and tappable on mobile", async ({ page }) => {
    await page.goto(BASE);
    const toggle = page.getByRole("button", { name: /тем/i });
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(28);
  });
});
