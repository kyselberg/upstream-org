import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Helper functions for board-related test actions
 */

export async function createBoard(
	page: Page,
	name: string,
	description?: string,
) {
	// Click create board button
	const createButton = page.getByRole("button", { name: /create board/i });
	await createButton.click();

	// Wait for dialog to appear
	await expect(
		page.getByRole("dialog").getByText(/create new board/i),
	).toBeVisible();

	// Fill in board name
	const nameInput = page
		.getByRole("dialog")
		.getByLabel(/board name/i)
		.or(page.getByPlaceholder(/my board/i));
	await nameInput.fill(name);

	// Fill in description if provided
	if (description) {
		const descInput = page
			.getByRole("dialog")
			.getByLabel(/description/i)
			.or(page.getByPlaceholder(/board description/i));
		await descInput.fill(description);
	}

	// Submit the form
	const submitButton = page
		.getByRole("dialog")
		.getByRole("button", { name: /create/i });
	await submitButton.click();

	// Wait for dialog to close and board to be created
	await expect(page.getByRole("dialog")).not.toBeVisible();
}

export async function getBoardCard(page: Page, boardName: string) {
	return page.getByRole("link").filter({ hasText: boardName });
}

export async function openBoard(page: Page, boardName: string) {
	const boardCard = await getBoardCard(page, boardName);
	await boardCard.click();
	await page.waitForURL(/\/boards\/[^/]+/, { timeout: 5000 });
}

export async function expectBoardToExist(page: Page, boardName: string) {
	const boardCard = await getBoardCard(page, boardName);
	await expect(boardCard).toBeVisible();
}

