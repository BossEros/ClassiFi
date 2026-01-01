import { Fragment } from "./fragment.js";
import { Identifiable } from "../util/identifiable.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { FileEntry } from "./types.js";
/**
 * A Pair represents the comparison between two files.
 * It calculates similarity scores and can extract matching fragments.
 */
export declare class Pair extends Identifiable {
    readonly leftEntry: FileEntry;
    readonly rightEntry: FileEntry;
    /** Shared fingerprints between the two files */
    private readonly shared;
    /** The left file */
    readonly leftFile: TokenizedFile;
    /** The right file */
    readonly rightFile: TokenizedFile;
    /** Number of covered k-grams in left file */
    readonly leftCovered: number;
    /** Number of covered k-grams in right file */
    readonly rightCovered: number;
    /** Total k-grams in left file */
    readonly leftTotal: number;
    /** Total k-grams in right file */
    readonly rightTotal: number;
    /** Length of longest matching fragment */
    readonly longest: number;
    /** Overall similarity score (0-1) */
    readonly similarity: number;
    /** Number of ignored k-grams in left file */
    readonly leftIgnored: number;
    /** Number of ignored k-grams in right file */
    readonly rightIgnored: number;
    constructor(leftEntry: FileEntry, rightEntry: FileEntry);
    /**
     * Calculate the longest common substring of k-grams.
     */
    private longestCommonSubstring;
    /**
     * Get total overlap (left + right covered).
     */
    get overlap(): number;
    /**
     * Build matching fragments from shared fingerprints.
     *
     * @param minimumOccurrences Minimum k-grams required for a fragment
     */
    buildFragments(minimumOccurrences?: number): Array<Fragment>;
    /**
     * Add a new paired occurrence, extending existing fragments or creating new ones.
     */
    private addPair;
    /**
     * Remove fragments that are fully contained within larger fragments.
     */
    private squash;
    /**
     * Remove a fragment from the maps.
     */
    private removeFragment;
    /**
     * Create a unique key for a left/right index pair.
     */
    private key;
}
//# sourceMappingURL=pair.d.ts.map