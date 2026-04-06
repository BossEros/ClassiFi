import postgres from "postgres"
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { env } from "@/shared/config.js"
import { users, usersRelations, userRoleEnum } from "@/modules/users/user.model.js"
import { classes, classesRelations } from "@/modules/classes/class.model.js"
import { assignments, assignmentsRelations, programmingLanguageEnum } from "@/modules/assignments/assignment.model.js"
import { enrollments, enrollmentsRelations } from "@/modules/enrollments/enrollment.model.js"
import { submissions, submissionsRelations } from "@/modules/submissions/submission.model.js"
import { similarityReports, similarityReportsRelations, reportTypeEnum } from "@/modules/plagiarism/similarity-report.model.js"
import { matchFragments, matchFragmentsRelations } from "@/modules/plagiarism/match-fragment.model.js"
import { similarityResults, similarityResultsRelations } from "@/modules/plagiarism/similarity-result.model.js"
import { testCases, testCasesRelations } from "@/modules/test-cases/test-case.model.js"
import { testResults, testResultsRelations } from "@/modules/test-cases/test-result.model.js"
import { notifications, notificationsRelations, notificationTypeEnum } from "@/modules/notifications/notification.model.js"
import { modules, modulesRelations } from "@/modules/modules/module.model.js"

// All schema tables for transaction context
const schema = {
  users, usersRelations, userRoleEnum,
  classes, classesRelations,
  assignments, assignmentsRelations, programmingLanguageEnum,
  enrollments, enrollmentsRelations,
  submissions, submissionsRelations,
  similarityReports, similarityReportsRelations, reportTypeEnum,
  matchFragments, matchFragmentsRelations,
  similarityResults, similarityResultsRelations,
  testCases, testCasesRelations,
  testResults, testResultsRelations,
  notifications, notificationsRelations, notificationTypeEnum,
  modules, modulesRelations,
}

/** Create a new database connection for transactions */
function createConnection(): postgres.Sql {
  return postgres(env.DATABASE_URL, {
    max: 1, // Single connection for transaction
  })
}

/** Transaction context type */
export type TransactionContext = PostgresJsDatabase<typeof schema>

/**
 * Execute operations within a database transaction
 * All operations will be rolled back if any error occurs
 *
 * @param callback - Function to execute within the transaction
 * @returns Result of the callback
 *
 * @example
 * const result = await withTransaction(async (tx) => {
 *   await tx.insert(users).values({ ... });
 *   await tx.insert(enrollments).values({ ... });
 *   return { success: true };
 * });
 */
export async function withTransaction<T>(
  callback: (tx: TransactionContext) => Promise<T>,
): Promise<T> {
  const sql = createConnection()
  const txDb = drizzle(sql, { schema })

  try {
    // Begin transaction, execute callback, commit
    const result = await txDb.transaction(async (tx) => {
      return await callback(tx as unknown as TransactionContext)
    })

    return result
  } finally {
    await sql.end()
  }
}

/**
 * Unit of Work Pattern
 * Coordinates multiple repository operations within a single transaction
 */
export class UnitOfWork {
  private connection: postgres.Sql | null = null
  private txDb: TransactionContext | null = null

  /** Begin a new unit of work */
  async begin(): Promise<TransactionContext> {
    this.connection = createConnection()
    this.txDb = drizzle(this.connection, {
      schema,
    }) as unknown as TransactionContext
    return this.txDb
  }

  /** Get the current transaction context */
  getContext(): TransactionContext {
    if (!this.txDb) {
      throw new Error("Unit of work has not been started. Call begin() first.")
    }
    return this.txDb
  }

  /** Commit and close the connection */
  async commit(): Promise<void> {
    if (this.connection) {
      await this.connection.end()
      this.connection = null
      this.txDb = null
    }
  }

  /** Rollback and close the connection */
  async rollback(): Promise<void> {
    // Note: With postgres.js and Drizzle, explicit rollback is handled by throwing an error
    // within the transaction callback. This method ensures cleanup.
    if (this.connection) {
      await this.connection.end()
      this.connection = null
      this.txDb = null
    }
  }
}
