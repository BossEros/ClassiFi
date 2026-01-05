// Main entry point
export { PlagiarismDetector } from "./detector.js";
export { Report } from "./report.js";
export type { ReportSummary } from "./report.js";
export { Options } from "./options.js";
export type { DetectorOptions } from "./options.js";

// Language support
export {
    ProgrammingLanguage,
    LanguageRegistry,
    createDefaultRegistry
} from "./language.js";
export type { LanguageName } from "./language.js";

// File classes
export { File } from "./file/file.js";
export type { FileInfo } from "./file/file.js";
export { TokenizedFile } from "./file/tokenizedFile.js";

// Algorithm classes
export { FingerprintIndex } from "./algorithm/fingerprintIndex.js";
export type { Hash } from "./algorithm/fingerprintIndex.js";
export type { FileEntry } from "./algorithm/types.js";
export type { ASTRegion } from "./algorithm/types.js";
export { Pair } from "./algorithm/pair.js";
export { Fragment } from "./algorithm/fragment.js";
export { SharedFingerprint } from "./algorithm/sharedFingerprint.js";
export type { Occurrence } from "./algorithm/sharedFingerprint.js";
export { PairedOccurrence } from "./algorithm/pairedOccurrence.js";

// Hashing classes
export { WinnowFilter } from "./hashing/winnowFilter.js";
export { HashFilter } from "./hashing/hashFilter.js";
export type { Fingerprint } from "./hashing/hashFilter.js";
export { RollingHash } from "./hashing/rollingHash.js";
export { TokenHash } from "./hashing/tokenHash.js";

// Tokenizer classes
export { Tokenizer } from "./tokenizer/tokenizer.js";
export type { Token, TokenizerOptions } from "./tokenizer/tokenizer.js";
export { CodeTokenizer } from "./tokenizer/codeTokenizer.js";

// Utility classes
export { Region } from "./util/region.js";
export { Range } from "./util/range.js";
export { Identifiable } from "./util/identifiable.js";
