import { test, expect } from "@playwright/test";
import { createBoard, openBoard } from "./helpers/board";
import { createColumn } from "./helpers/column";
import {
	createTask,
	expectTaskToExist,
	getTaskCard,
} from "./helpers/task";

test.describe("Tasks", () => {
	let boardName: string;
	const columnName = "To Do";

	test.beforeEach(async ({ page }) => {
		boardName = `Test Board ${Date.now()}`;
		await page.goto("/boards");
		await createBoard(page, boardName);
		await openBoard(page, boardName);
		await createColumn(page, columnName);
	});

	test("should create a new task", async ({ page }) => {
		const taskTitle = "Test Task";

		await createTask(page, columnName, taskTitle);

		// Verify task appears in the column
		await expectTaskToExist(page, taskTitle);
	});

	test("should create task with description", async ({ page }) => {
		const taskTitle = "Task with Description";
		const taskDescription = "This is a test task description";

		await createTask(page, columnName, taskTitle, taskDescription);

		// Verify task exists
		await expectTaskToExist(page, taskTitle);

		// Verify description is shown
		const taskCard = await getTaskCard(page, taskTitle);
		await expect(taskCard.getByText(taskDescription)).toBeVisible();
	});

	test("should create task with high priority", async ({ page }) => {
		const taskTitle = "High Priority Task";

		await createTask(page, columnName, taskTitle, undefined, "high");

		// Verify task exists
		await expectTaskToExist(page, taskTitle);

		// Verify priority badge is shown
		const taskCard = await getTaskCard(page, taskTitle);
		await expect(taskCard.getByText(/high/i)).toBeVisible();
	});

	test("should create multiple tasks in a column", async ({ page }) => {
		const tasks = ["Task 1", "Task 2", "Task 3"];

		for (const taskTitle of tasks) {
			await createTask(page, columnName, taskTitle);
			await expectTaskToExist(page, taskTitle);
		}

		// Verify all tasks are visible
		for (const taskTitle of tasks) {
			await expectTaskToExist(page, taskTitle);
		}
	});

	test("should create tasks in different columns", async ({ page }) => {
		const column1 = "To Do";
		const column2 = "In Progress";

		await createColumn(page, column2);

		const task1 = "Task in To Do";
		const task2 = "Task in In Progress";

		await createTask(page, column1, task1);
		await createTask(page, column2, task2);

		// Verify tasks are in correct columns
		await expectTaskToExist(page, task1);
		await expectTaskToExist(page, task2);
	});
});

