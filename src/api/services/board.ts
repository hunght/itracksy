import { eq, desc, and } from "drizzle-orm";

import { boards, columns, items } from "../db/schema";
import { nanoid } from "nanoid";
import db from "../db";

export type Board = typeof boards.$inferSelect;
export type BoardInsert = typeof boards.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type ColumnInsert = typeof columns.$inferInsert;
export type Item = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;

export async function getBoard(id: string, userId: string) {
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, id), eq(boards.userId, userId)),
    with: {
      columns: true,
      items: true,
    },
  });

  return board;
}

export async function getBoards(userId: string): Promise<Board[]> {
  return await db
    .select()
    .from(boards)
    .where(eq(boards.userId, userId))
    .orderBy(desc(boards.createdAt));
}

export async function createBoard(
  board: Omit<BoardInsert, "id" | "userId">,
  userId: string
): Promise<Board> {
  const newBoard = await db
    .insert(boards)
    .values({
      ...board,
      id: nanoid(),
      userId,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return newBoard[0];
}

export async function createColumn(column: Omit<ColumnInsert, "id">): Promise<Column> {
  const newColumn = await db
    .insert(columns)
    .values({
      ...column,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    })
    .returning();

  return newColumn[0];
}

export async function updateColumn(id: string, column: Partial<ColumnInsert>): Promise<void> {
  await db.update(columns).set(column).where(eq(columns.id, id));
}

export async function deleteColumn(id: string): Promise<void> {
  await db.delete(columns).where(eq(columns.id, id));
}

export async function createItem(item: ItemInsert): Promise<Item> {
  const newItem = await db
    .insert(items)
    .values({
      ...item,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    })
    .returning();

  return newItem[0];
}

export async function updateItem(id: string, item: Partial<ItemInsert>): Promise<void> {
  await db.update(items).set(item).where(eq(items.id, id));
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(items).where(eq(items.id, id));
}
