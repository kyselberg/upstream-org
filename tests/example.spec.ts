import { test, expect } from "@playwright/test";

/**
 * Example test file showing how to write tests for the kanban board application.
 * This file demonstrates best practices and can be used as a template.
 */

test.describe("Example: Complete Board Workflow", () => {
	test("should complete a full workflow: create board, add columns, add tasks", async ({
		page,
	}) => {
		// Navigate to boards page
		await page.goto("/boards");

		// Create a new board
		const boardName = `Example Board ${Date.now()}`;
		const createButton = page.getByRole("button", { name: /create board/i });
		await createButton.click();

		await expect(
			page.getByRole("dialog").getByText(/create new board/i),
		).toBeVisible();

		await page
			.getByRole("dialog")
			.getByLabel(/board name/i)
			.fill(boardName);

		await page
			.getByRole("dialog")
			.getByRole("button", { name: /create/i })
			.click();

		await expect(page.getByRole("dialog")).not.toBeVisible();

		// Verify board was created and navigate to it
		const boardLink = page.getByRole("link", { name: boardName });
		await expect(boardLink).toBeVisible();
		await boardLink.click();

		// Wait for board page to load
		await expect(page.getByRole("heading", { name: boardName })).toBeVisible();

		// Create columns
		const columns = ["To Do", "In Progress", "Done"];
		for (const columnName of columns) {
			const addColumnButton = page.getByRole("button", {
				name: /add column/i,
			});
			await addColumnButton.click();

			await expect(
				page.getByRole("dialog").getByText(/create new column/i),
			).toBeVisible();

			await page
				.getByRole("dialog")
				.getByLabel(/column name/i)
				.fill(columnName);

			await page
				.getByRole("dialog")
				.getByRole("button", { name: /create/i })
				.click();

			await expect(page.getByRole("dialog")).not.toBeVisible();
		}

		// Verify all columns exist
		for (const columnName of columns) {
			await expect(
				page.getByText(columnName, { exact: true }),
			).toBeVisible();
		}

		// Create a task in the "To Do" column
		const taskTitle = "Example Task";
		const columnCard = page
			.locator('[class*="Card"]')
			.filter({ hasText: "To Do" })
			.first();

		const addTaskButton = columnCard.getByRole("button", {
			name: /add task/i,
		});
		await addTaskButton.click();

		await expect(
			page.getByRole("dialog").getByText(/create new task/i),
		).toBeVisible();

		await page
			.getByRole("dialog")
			.getByLabel(/task title/i)
			.fill(taskTitle);

		await page
			.getByRole("dialog")
			.getByRole("button", { name: /create/i })
			.click();

		await expect(page.getByRole("dialog")).not.toBeVisible();

		// Verify task exists
		await expect(page.getByText(taskTitle)).toBeVisible();
	});
});

