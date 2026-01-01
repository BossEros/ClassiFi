// React components for plagiarism detection visualization (Phase 3)
export { PairCodeEditor } from './PairCodeEditor';
export { PairComparison } from './PairComparison';
export { SimilarityBadge } from './SimilarityBadge';
export { FragmentsTable } from './FragmentsTable';
export { PairsTable } from './PairsTable';

// Types
export type {
    FileData,
    CodeRegion,
    MatchFragment,
    FilePair,
} from './types';

export { MATCH_COLORS, regionToMonacoRange } from './types';

// Adapters
export {
    pairToFilePair,
    fragmentToMatchFragment,
    reportToFilePairs,
    getSuspiciousFilePairs,
} from './adapters';
