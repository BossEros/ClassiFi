// React components for plagiarism detection visualization (Phase 3)
export { PairCodeEditor } from "./PairCodeEditor"
export { PairCodeDiff } from "./PairCodeDiff"
export { PairComparison } from "./PairComparison"
export { SimilarityBadge } from "./SimilarityBadge"
export { FragmentsTable } from "./FragmentsTable"
export { PairwiseTriageTable } from "./PairwiseTriageTable"

// Types
export type { FileData, CodeRegion, MatchFragment, FilePair } from "./types"

export { MATCH_COLORS, regionToMonacoRange } from "./types"

// Adapters for API data
export { pairToFilePair, fragmentToMatchFragment } from "./adapters"
