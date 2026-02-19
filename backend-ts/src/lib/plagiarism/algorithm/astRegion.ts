import { Region } from "@/lib/plagiarism/util/region.js"

/**
 * Information about one side of a paired occurrence (matching k-gram).
 * Placed in its own file to avoid circular imports between sharedFingerprint and pairedOccurrence.
 */
export interface ASTRegion {
  /** Start index in the AST token array */
  start: number
  /** Stop index (inclusive) in the AST token array */
  stop: number
  /** Index of when this k-gram was outputted by the HashFilter */
  index: number
  /** The source code region (line/column) for this k-gram */
  location: Region
  /** Optional: the actual token data */
  data: Array<string> | null
}
