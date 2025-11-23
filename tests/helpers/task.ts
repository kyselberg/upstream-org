import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Helper functions for task-related test actions
 */

export async function createTask(
	page: Page,
	columnName: string,
	taskTitle: string,
	description?: string,
	priority: "low" | "medium" | "high" = "medium",
) {
	// Find the column and click "Add Task" button
	const columnCard = page
		.getByRole("article")
		.or(page.locator('[class*="Card"]'))
		.filter({ hasText: columnName })
		.first();

	const addTaskButton = columnCard.getByRole("button", { name: /add task/i });
	await addTaskButton.click();

	// Wait for dialog to appear
	await expect(
		page.getByRole("dialog").getByText(/create new task/i),
	).toBeVisible();

	// Fill in task title
	const titleInput = page
		.getByRole("dialog")
		.getByLabel(/task title/i)
		.or(page.getByPlaceholder(/task title/i));
	await titleInput.fill(taskTitle);

	// Fill in description if provided
	if (description) {
		const descInput = page
			.getByRole("dialog")
			.getByLabel(/description/i)
			.or(page.getByPlaceholder(/task description/i));
		await descInput.fill(description);
	}

	// Select priority if not default
	if (priority !== "medium") {
		const prioritySelect = page
			.getByRole("dialog")
			.getByLabel(/priority/i)
			.or(page.locator('select').first());
		await prioritySelect.selectOption(priority);
	}

	// Submit the form
	const submitButton = page
		.getByRole("dialog")
		.getByRole("button", { name: /create/i });
	await submitButton.click();

	// Wait for dialog to close
	await expect(page.getByRole("dialog")).not.toBeVisible();
}

export async function getTaskCard(page: Page, taskTitle: string) {
	return page
		.locator('[class*="Card"]')
		.filter({ hasText: taskTitle })
		.first();
}

export async function expectTaskToExist(page: Page, taskTitle: string) {
	const taskCard = await getTaskCard(page, taskTitle);
	await expect(taskCard).toBeVisible();
}

