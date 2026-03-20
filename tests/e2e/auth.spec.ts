import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("renders the login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/BittsQuiz/i);
  });

  test("shows Google sign-in button", async ({ page }) => {
    await page.goto("/login");
    const signInBtn = page.getByRole("button", { name: /google/i });
    await expect(signInBtn).toBeVisible();
  });
});

test.describe("Route protection", () => {
  test("unauthenticated /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /discover redirects to login", async ({ page }) => {
    await page.goto("/discover");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /marketplace redirects to login", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /leaderboard redirects to login", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
