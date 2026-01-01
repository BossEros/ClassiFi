import { Report, Pair, Fragment } from '../index.js';
import { FilePair, FileData, MatchFragment, CodeRegion } from './types';

/**
 * Convert library types to component-friendly types.
 * Use this to bridge the analysis library with the React components.
 */

/**
 * Convert a Pair from the library to a FilePair for the UI components.
 */
export function pairToFilePair(pair: Pair, fragments: Fragment[]): FilePair {
    return {
        id: pair.id,
        leftFile: {
            id: pair.leftFile.id,
            path: pair.leftFile.path,
            filename: pair.leftFile.filename,
            content: pair.leftFile.content,
            lineCount: pair.leftFile.lineCount,
        },
        rightFile: {
            id: pair.rightFile.id,
            path: pair.rightFile.path,
            filename: pair.rightFile.filename,
            content: pair.rightFile.content,
            lineCount: pair.rightFile.lineCount,
        },
        similarity: pair.similarity,
        overlap: pair.overlap,
        longest: pair.longest,
        fragments: fragments.map((frag, index) => fragmentToMatchFragment(frag, index)),
    };
}

/**
 * Convert a Fragment from the library to a MatchFragment for the UI.
 */
export function fragmentToMatchFragment(fragment: Fragment, id: number): MatchFragment {
    return {
        id,
        leftSelection: {
            startRow: fragment.leftSelection.startRow,
            startCol: fragment.leftSelection.startCol,
            endRow: fragment.leftSelection.endRow,
            endCol: fragment.leftSelection.endCol,
        },
        rightSelection: {
            startRow: fragment.rightSelection.startRow,
            startCol: fragment.rightSelection.startCol,
            endRow: fragment.rightSelection.endRow,
            endCol: fragment.rightSelection.endCol,
        },
        length: fragment.length,
    };
}

/**
 * Convert a Report to an array of FilePairs for display.
 */
export function reportToFilePairs(report: Report): FilePair[] {
    const pairs = report.getPairs();
    return pairs.map(pair => {
        const fragments = report.getFragments(pair);
        return pairToFilePair(pair, fragments);
    });
}

/**
 * Get suspicious pairs (above threshold) as FilePairs.
 */
export function getSuspiciousFilePairs(report: Report, threshold = 0.5): FilePair[] {
    const pairs = report.getSuspiciousPairs(threshold);
    return pairs.map(pair => {
        const fragments = report.getFragments(pair);
        return pairToFilePair(pair, fragments);
    });
}
