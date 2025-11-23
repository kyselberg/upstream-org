# Playwright Test Suite

This directory contains end-to-end tests for the kanban board application using Playwright.

## Test Structure

- `boards.spec.ts` - Tests for board creation and listing
- `columns.spec.ts` - Tests for column creation and management
- `tasks.spec.ts` - Tests for task creation and management
- `drag-and-drop.spec.ts` - Tests for column drag and drop functionality
- `navigation.spec.ts` - Tests for navigation between pages
- `helpers/` - Reusable helper functions for common test actions
  - `auth.ts` - Authentication helpers
  - `board.ts` - Board-related actions
  - `column.ts` - Column-related actions
  - `task.ts` - Task-related actions

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

### Run specific test file
```bash
npx playwright test tests/boards.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
```

## Test Configuration

Tests are configured in `playwright.config.ts`. The configuration includes:
- Base URL: `http://localhost:3000` (or `PLAYWRIGHT_TEST_BASE_URL` env variable)
- Automatic dev server startup
- Multiple browser support (Chromium, Firefox, WebKit)
- Screenshots on failure
- Trace collection on retry

## Authentication

Currently, tests skip authentication setup. To add authentication:

1. Update `tests/auth.setup.ts` to authenticate with your auth provider (Clerk)
2. Configure Playwright to use the auth state file
3. Update individual tests to use authenticated context

## Writing New Tests

When writing new tests:

1. Use helper functions from `tests/helpers/` when possible
2. Follow the existing test structure and naming conventions
3. Use descriptive test names that explain what is being tested
4. Clean up test data when necessary (or use unique identifiers)
5. Use `test.beforeEach` for common setup

## Example Test

```typescript
import { test, expect } from "@playwright/test";
import { createBoard, openBoard } from "./helpers/board";

test("should create a new board", async ({ page }) => {
  await page.goto("/boards");
  await createBoard(page, "My Test Board");
  await expect(page.getByText("My Test Board")).toBeVisible();
});
```

