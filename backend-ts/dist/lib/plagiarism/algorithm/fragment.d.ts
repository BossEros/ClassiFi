import { PairedOccurrence } from "./pairedOccurrence.js";
import { Region } from "../util/region.js";
import { Range } from "../util/range.js";
/**
 * A fragment is a contiguous region of matching code between two files.
 * It's built from consecutive paired k-gram occurrences.
 */
export declare class Fragment {
    /** All the paired occurrences that make up this fragment */
    pairs: Array<PairedOccurrence>;
    /** Range of k-gram indices in the left file */
    leftkgrams: Range;
    /** Range of k-gram indices in the right file */
    rightkgrams: Range;
    /** Source code region in the left file */
    leftSelection: Region;
    /** Source code region in the right file */
    rightSelection: Region;
    /** Merged token data (if available) */
    mergedData: Array<string> | null;
    private mergedStart;
    private mergedStop;
    constructor(initial: PairedOccurrence);
    /**
     * Check if another occurrence can extend this fragment.
     * An occurrence extends if its indices are exactly +1 from our end.
     */
    private extendable;
    /**
     * Extend this fragment with a new paired occurrence.
     */
    extendWith(other: PairedOccurrence): void;
    /**
     * Extend this fragment with another fragment.
     */
    extendWithFragment(other: Fragment): void;
    /**
     * Get the length of this fragment (number of k-grams).
     */
    get length(): number;
}
//# sourceMappingURL=fragment.d.ts.map