// React components for plagiarism detection visualization (Phase 3)
export { PairCodeEditor } from "./PairCodeEditor"
export { PairCodeDiff } from "./PairCodeDiff"
export { PairComparison } from "./PairComparison"
export { SimilarityBadge } from "./SimilarityBadge"
export { FragmentsTable } from "./FragmentsTable"
export { PairsTable } from "./PairsTable"

// New student-centric components
export { OriginalityBadge } from "./OriginalityBadge"
export { StudentSummaryTable } from "./StudentSummaryTable"
export { StudentPairsDetail } from "./StudentPairsDetail"

// Types
export type { FileData, CodeRegion, MatchFragment, FilePair } from "./types"

export { MATCH_COLORS, regionToMonacoRange } from "./types"

// Adapters for API data
export { pairToFilePair, fragmentToMatchFragment } from "./adapters"
