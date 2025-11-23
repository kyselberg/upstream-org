import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Helper functions for column-related test actions
 */

export async function createColumn(
	page: Page,
	columnName: string,
	wipLimit?: number,
) {
	// Click add column button
	const addColumnButton = page.getByRole("button", { name: /add column/i });
	await addColumnButton.click();

	// Wait for dialog to appear
	await expect(
		page.getByRole("dialog").getByText(/create new column/i),
	).toBeVisible();

	// Fill in column name
	const nameInput = page
		.getByRole("dialog")
		.getByLabel(/column name/i)
		.or(page.getByPlaceholder(/to do/i));
	await nameInput.fill(columnName);

	// Fill in WIP limit if provided
	if (wipLimit !== undefined) {
		const wipInput = page
			.getByRole("dialog")
			.getByLabel(/wip limit/i)
			.or(page.getByPlaceholder(/5/i));
		await wipInput.fill(wipLimit.toString());
	}

	// Submit the form
	const submitButton = page
		.getByRole("dialog")
		.getByRole("button", { name: /create/i });
	await submitButton.click();

	// Wait for dialog to close
	await expect(page.getByRole("dialog")).not.toBeVisible();
}

export function getColumnCard(page: Page, columnName: string) {
	return page
		.getByRole("article")
		.or(page.locator('[class*="Card"]'))
		.filter({ hasText: columnName })
		.first();
}

export async function expectColumnToExist(page: Page, columnName: string) {
	const columnCard = getColumnCard(page, columnName);
	await expect(columnCard).toBeVisible();
}

export function getColumnTasks(page: Page, columnName: string) {
	const columnCard = getColumnCard(page, columnName);
	return columnCard.locator('[class*="Card"]').filter({ hasText: /./ });
}

