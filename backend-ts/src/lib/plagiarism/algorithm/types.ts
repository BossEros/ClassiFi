import { Range } from "@/lib/plagiarism/util/range.js"
import { TokenizedFile } from "@/lib/plagiarism/file/tokenizedFile.js"
import { SharedFingerprint } from "@/lib/plagiarism/algorithm/sharedFingerprint.js"

// Re-export ASTRegion for convenience
export type { ASTRegion } from "@/lib/plagiarism/algorithm/astRegion.js"

/**
 * Entry for a file in the index.
 * Shared between FingerprintIndex and Pair to avoid circular imports.
 */
export interface FileEntry {
  file: TokenizedFile
  kgrams: Array<Range>
  shared: Set<SharedFingerprint>
  ignored: Set<SharedFingerprint>
  isIgnored: boolean
}
