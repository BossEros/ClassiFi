// Main entry point
export { PlagiarismDetector } from "./detector.js";
export { Report, ReportSummary } from "./report.js";
export { Options, DetectorOptions } from "./options.js";

// Language support
export {
    ProgrammingLanguage,
    LanguageRegistry,
    createDefaultRegistry,
    LanguageName
} from "./language.js";

// File classes
export { File, FileInfo } from "./file/file.js";
export { TokenizedFile } from "./file/tokenizedFile.js";

// Algorithm classes
export { FingerprintIndex, FileEntry, Hash } from "./algorithm/fingerprintIndex.js";
export { Pair } from "./algorithm/pair.js";
export { Fragment } from "./algorithm/fragment.js";
export { SharedFingerprint, Occurrence } from "./algorithm/sharedFingerprint.js";
export { PairedOccurrence, ASTRegion } from "./algorithm/pairedOccurrence.js";

// Hashing classes
export { WinnowFilter } from "./hashing/winnowFilter.js";
export { HashFilter, Fingerprint } from "./hashing/hashFilter.js";
export { RollingHash } from "./hashing/rollingHash.js";
export { TokenHash } from "./hashing/tokenHash.js";

// Tokenizer classes
export { Tokenizer, Token, TokenizerOptions } from "./tokenizer/tokenizer.js";
export { CodeTokenizer } from "./tokenizer/codeTokenizer.js";

// Utility classes
export { Region } from "./util/region.js";
export { Range } from "./util/range.js";
export { Identifiable } from "./util/identifiable.js";
