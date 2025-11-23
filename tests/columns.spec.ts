import { test, expect } from "@playwright/test";
import { createBoard, openBoard } from "./helpers/board";
import {
	createColumn,
	expectColumnToExist,
	getColumnCard,
} from "./helpers/column";

test.describe("Columns", () => {
	let boardName: string;

	test.beforeEach(async ({ page }) => {
		boardName = `Test Board ${Date.now()}`;
		await page.goto("/boards");
		await createBoard(page, boardName);
		await openBoard(page, boardName);
	});

	test("should create a new column", async ({ page }) => {
		const columnName = "To Do";

		await createColumn(page, columnName);

		// Verify column appears on the board
		await expectColumnToExist(page, columnName);
	});

	test("should create column with WIP limit", async ({ page }) => {
		const columnName = "In Progress";
		const wipLimit = 5;

		await createColumn(page, columnName, wipLimit);

		// Verify column exists
		await expectColumnToExist(page, columnName);

		// Verify WIP limit is displayed
		const columnCard = await getColumnCard(page, columnName);
		await expect(columnCard.getByText(/WIP Limit.*5/i)).toBeVisible();
	});

	test("should create multiple columns", async ({ page }) => {
		const columns = ["To Do", "In Progress", "Done"];

		for (const columnName of columns) {
			await createColumn(page, columnName);
			await expectColumnToExist(page, columnName);
		}

		// Verify all columns are visible
		for (const columnName of columns) {
			await expectColumnToExist(page, columnName);
		}
	});

	test("should display column name correctly", async ({ page }) => {
		const columnName = "Test Column";

		await createColumn(page, columnName);

		const columnCard = await getColumnCard(page, columnName);
		await expect(columnCard.getByText(columnName)).toBeVisible();
	});
});

