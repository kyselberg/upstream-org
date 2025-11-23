import { test, expect } from "@playwright/test";
import { createBoard, openBoard } from "./helpers/board";

test.describe("Navigation", () => {
	test("should navigate from home to boards page", async ({ page }) => {
		await page.goto("/");

		// Find and click the boards link
		const boardsLink = page.getByRole("link", { name: /boards/i });
		await boardsLink.click();

		// Verify we're on the boards page
		await expect(page).toHaveURL(/\/boards/);
		await expect(page.getByRole("heading", { name: /boards/i })).toBeVisible();
	});

	test("should navigate from boards list to board detail", async ({ page }) => {
		const boardName = `Test Board ${Date.now()}`;

		await page.goto("/boards");
		await createBoard(page, boardName);
		await openBoard(page, boardName);

		// Verify we're on the board detail page
		await expect(page).toHaveURL(/\/boards\/[^/]+/);
		await expect(page.getByRole("heading", { name: boardName })).toBeVisible();
	});

	test("should navigate back from board detail to boards list", async ({ page }) => {
		const boardName = `Test Board ${Date.now()}`;

		await page.goto("/boards");
		await createBoard(page, boardName);
		await openBoard(page, boardName);

		// Click back button
		const backButton = page.getByRole("button", { name: /back to boards/i });
		await backButton.click();

		// Verify we're back on the boards list
		await expect(page).toHaveURL(/\/boards/);
		await expect(page.getByRole("heading", { name: /boards/i })).toBeVisible();
	});
});

