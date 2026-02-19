// Main entry point
export { PlagiarismDetector } from "@/lib/plagiarism/detector.js"
export { Report } from "@/lib/plagiarism/report.js"
export type { ReportSummary } from "@/lib/plagiarism/report.js"
export { Options } from "@/lib/plagiarism/options.js"
export type { DetectorOptions } from "@/lib/plagiarism/options.js"

// Language support
export {
  ProgrammingLanguage,
  LanguageRegistry,
  createDefaultRegistry,
} from "@/lib/plagiarism/language.js"
export type { LanguageName } from "@/lib/plagiarism/language.js"

// File classes
export { File } from "@/lib/plagiarism/file/file.js"
export type { FileInfo } from "@/lib/plagiarism/file/file.js"
export { TokenizedFile } from "@/lib/plagiarism/file/tokenizedFile.js"

// Algorithm classes
export { FingerprintIndex } from "@/lib/plagiarism/algorithm/fingerprintIndex.js"
export type { Hash } from "@/lib/plagiarism/algorithm/fingerprintIndex.js"
export type { FileEntry } from "@/lib/plagiarism/algorithm/types.js"
export type { ASTRegion } from "@/lib/plagiarism/algorithm/types.js"
export { Pair } from "@/lib/plagiarism/algorithm/pair.js"
export { Fragment } from "@/lib/plagiarism/algorithm/fragment.js"
export { SharedFingerprint } from "@/lib/plagiarism/algorithm/sharedFingerprint.js"
export type { Occurrence } from "@/lib/plagiarism/algorithm/sharedFingerprint.js"
export { PairedOccurrence } from "@/lib/plagiarism/algorithm/pairedOccurrence.js"

// Hashing classes
export { WinnowFilter } from "@/lib/plagiarism/hashing/winnowFilter.js"
export { HashFilter } from "@/lib/plagiarism/hashing/hashFilter.js"
export type { Fingerprint } from "@/lib/plagiarism/hashing/hashFilter.js"
export { RollingHash } from "@/lib/plagiarism/hashing/rollingHash.js"
export { TokenHash } from "@/lib/plagiarism/hashing/tokenHash.js"

// Tokenizer classes
export { Tokenizer } from "@/lib/plagiarism/tokenizer/tokenizer.js"
export type { Token, TokenizerOptions } from "@/lib/plagiarism/tokenizer/tokenizer.js"
export { CodeTokenizer } from "@/lib/plagiarism/tokenizer/codeTokenizer.js"

// Utility classes
export { Region } from "@/lib/plagiarism/util/region.js"
export { Range } from "@/lib/plagiarism/util/range.js"
export { Identifiable } from "@/lib/plagiarism/util/identifiable.js"
