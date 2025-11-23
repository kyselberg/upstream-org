import { relations } from "drizzle-orm";
import { index, pgEnum, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `ttt_${name}`);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "member", "guest"]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ]
);

export const users = createTable(
  "user",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clerkId: d.varchar({ length: 255 }).notNull().unique(),
    telegramChatId: d.varchar({ length: 255 }),
    name: d.varchar({ length: 255 }),
    email: d.varchar({ length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("guest"),
    emailVerified: d
      .timestamp({
        mode: "date",
        withTimezone: true,
      })
      .$defaultFn(() => /* @__PURE__ */ new Date()),
    image: d.varchar({ length: 255 }),
  }),
  (t) => [
    index("clerk_id_idx").on(t.clerkId),
    index("telegram_chat_id_idx").on(t.telegramChatId),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  boards: many(boards),
  tasks: many(tasks),
  taskAssignees: many(taskAssignees),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)]
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// Boards
export const boards = createTable(
  "board",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    createdBy: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    churchId: d.varchar({ length: 255 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("board_created_by_idx").on(t.createdBy),
    index("board_church_id_idx").on(t.churchId),
  ]
);

export const boardsRelations = relations(boards, ({ one, many }) => ({
  creator: one(users, { fields: [boards.createdBy], references: [users.id] }),
  columns: many(boardColumns),
  tasks: many(tasks),
  events: many(events),
}));

// Board Columns
export const boardColumns = createTable(
  "board_column",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    boardId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 255 }).notNull(),
    order: d.integer().notNull().default(0),
    wipLimit: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("board_column_board_id_idx").on(t.boardId),
    index("board_column_order_idx").on(t.boardId, t.order),
  ]
);

export const boardColumnsRelations = relations(
  boardColumns,
  ({ one, many }) => ({
    board: one(boards, {
      fields: [boardColumns.boardId],
      references: [boards.id],
    }),
    tasks: many(tasks),
  })
);

// Tasks
export const tasks = createTable(
  "task",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    boardId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    columnId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => boardColumns.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    status: d.varchar({ length: 50 }).notNull().default("todo"),
    createdBy: d
      .varchar({ length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    dueDate: d.timestamp({ withTimezone: true }),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("task_board_id_idx").on(t.boardId),
    index("task_column_id_idx").on(t.columnId),
    index("task_created_by_idx").on(t.createdBy),
    index("task_status_idx").on(t.status),
  ]
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  board: one(boards, { fields: [tasks.boardId], references: [boards.id] }),
  column: one(boardColumns, {
    fields: [tasks.columnId],
    references: [boardColumns.id],
  }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id] }),
  assignees: many(taskAssignees),
  tags: many(taskTags),
  attachments: many(attachments),
}));

// Task Assignees (junction table)
export const taskAssignees = createTable(
  "task_assignee",
  (d) => ({
    taskId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    assignedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.taskId, t.userId] }),
    index("task_assignee_task_id_idx").on(t.taskId),
    index("task_assignee_user_id_idx").on(t.userId),
  ]
);

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignees.userId],
    references: [users.id],
  }),
}));

// Task Tags
export const taskTags = createTable(
  "task_tag",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    name: d.varchar({ length: 100 }).notNull(),
    color: d.varchar({ length: 7 }), // hex color code
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("task_tag_task_id_idx").on(t.taskId),
    index("task_tag_name_idx").on(t.name),
  ]
);

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
}));

// Attachments
export const attachments = createTable(
  "attachment",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fileUrl: d.text().notNull(), // Vercel Blob URL
    fileType: d.varchar({ length: 100 }),
    fileSize: d.integer(), // size in bytes
    fileName: d.varchar({ length: 255 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("attachment_task_id_idx").on(t.taskId)]
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
}));

// Events
export const events = createTable(
  "event",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    date: d.timestamp({ withTimezone: true }).notNull(),
    boardId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" })
      .unique(), // one board per event
    description: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("event_board_id_idx").on(t.boardId),
    index("event_date_idx").on(t.date),
  ]
);

export const eventsRelations = relations(events, ({ one }) => ({
  board: one(boards, {
    fields: [events.boardId],
    references: [boards.id],
  }),
}));
