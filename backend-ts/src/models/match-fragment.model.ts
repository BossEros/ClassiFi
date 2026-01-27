import { pgTable, serial, integer, timestamp, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { similarityResults } from "./similarity-result.model.js"

/**
 * Match fragments table - stores code fragment positions
 * Represents a contiguous region of matching code between two files
 */
export const matchFragments = pgTable(
  "match_fragments",
  {
    id: serial("id").primaryKey(),
    similarityResultId: integer("similarity_result_id")
      .notNull()
      .references(() => similarityResults.id, { onDelete: "cascade" }),

    // Left file position
    leftStartRow: integer("left_start_row").notNull(),
    leftStartCol: integer("left_start_col").notNull(),
    leftEndRow: integer("left_end_row").notNull(),
    leftEndCol: integer("left_end_col").notNull(),

    // Right file position
    rightStartRow: integer("right_start_row").notNull(),
    rightStartCol: integer("right_start_col").notNull(),
    rightEndRow: integer("right_end_row").notNull(),
    rightEndCol: integer("right_end_col").notNull(),

    // Length in k-grams
    length: integer("length").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_match_fragments_result").on(table.similarityResultId)],
)

/** Match fragment relations */
export const matchFragmentsRelations = relations(matchFragments, ({ one }) => ({
  similarityResult: one(similarityResults, {
    fields: [matchFragments.similarityResultId],
    references: [similarityResults.id],
  }),
}))

/** Type definitions */
export type MatchFragment = typeof matchFragments.$inferSelect
export type NewMatchFragment = typeof matchFragments.$inferInsert
