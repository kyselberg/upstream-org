import type { Page } from "@playwright/test";

/**
 * Helper functions for authentication in tests
 * Since Clerk is used, we'll need to handle authentication differently
 */

export async function signIn(page: Page, email?: string, password?: string) {
	// Navigate to sign in page or trigger sign in
	await page.goto("/");
	
	// Click sign in button if present
	const signInButton = page.getByRole("button", { name: /sign in/i });
	if (await signInButton.isVisible()) {
		await signInButton.click();
	}

	// Wait for Clerk's sign-in modal/form
	// Note: This is a placeholder - adjust based on your Clerk setup
	await page.waitForTimeout(1000);

	// If email/password provided, fill them in
	if (email && password) {
		// Clerk uses iframes, so we might need to handle that
		// This is a simplified version
		const emailInput = page.locator('input[type="email"]').first();
		const passwordInput = page.locator('input[type="password"]').first();
		
		if (await emailInput.isVisible()) {
			await emailInput.fill(email);
		}
		if (await passwordInput.isVisible()) {
			await passwordInput.fill(password);
		}

		const submitButton = page.getByRole("button", { name: /sign in|continue/i }).first();
		if (await submitButton.isVisible()) {
			await submitButton.click();
		}
	}

	// Wait for authentication to complete
	await page.waitForURL("/", { timeout: 10000 });
}

export async function isAuthenticated(page: Page): Promise<boolean> {
	// Check if user is authenticated by looking for authenticated elements
	const userButton = page.locator('[data-testid="user-button"], [class*="UserButton"]');
	return await userButton.isVisible().catch(() => false);
}

