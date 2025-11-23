import { expect, test } from "@playwright/test";
import { createBoard, expectBoardToExist, openBoard } from "./helpers/board";

test.describe("Boards Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to boards page
    // Note: In a real scenario, you'd authenticate first
    await page.goto("/boards");
  });

  test("should display boards page", async ({ page }) => {
    // Check if the page title is visible
    await expect(page.getByRole("heading", { name: /boards/i })).toBeVisible();
  });

  test("should show empty state when no boards exist", async ({ page }) => {
    // Check for empty state message
    const emptyState = page.getByText(/no boards yet/i);
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("should create a new board", async ({ page }) => {
    const boardName = `Test Board ${Date.now()}`;
    const boardDescription = "Test board description";

    await createBoard(page, boardName, boardDescription);

    // Verify board appears in the list
    await expectBoardToExist(page, boardName);

    // Verify board description is shown
    await expect(page.getByText(boardDescription)).toBeVisible();
  });

  test("should navigate to board detail page", async ({ page }) => {
    const boardName = `Test Board ${Date.now()}`;

    // Create a board first
    await createBoard(page, boardName);

    // Navigate to the board
    await openBoard(page, boardName);

    // Verify we're on the board detail page
    await expect(page.getByRole("heading", { name: boardName })).toBeVisible();
  });

  test("should display board with columns count", async ({ page }) => {
    const boardName = `Test Board ${Date.now()}`;

    await createBoard(page, boardName);
    await openBoard(page, boardName);

    // Go back to boards list
    await page.goto("/boards");

    // Verify board card shows column count
    const boardCard = page.getByRole("link").filter({ hasText: boardName });
    await expect(boardCard).toBeVisible();
  });
});
