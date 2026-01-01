import { assert } from "../util/utils.js";
import { PairedOccurrence } from "./pairedOccurrence.js";
import { Region } from "../util/region.js";
import { Range } from "../util/range.js";

/**
 * A fragment is a contiguous region of matching code between two files.
 * It's built from consecutive paired k-gram occurrences.
 */
export class Fragment {
    /** All the paired occurrences that make up this fragment */
    public pairs: Array<PairedOccurrence>;

    /** Range of k-gram indices in the left file */
    public leftkgrams: Range;
    /** Range of k-gram indices in the right file */
    public rightkgrams: Range;

    /** Source code region in the left file */
    public leftSelection: Region;
    /** Source code region in the right file */
    public rightSelection: Region;

    /** Merged token data (if available) */
    public mergedData: Array<string> | null;
    private mergedStart: number;
    private mergedStop: number;

    constructor(initial: PairedOccurrence) {
        this.pairs = [initial];
        this.leftkgrams = new Range(initial.left.index);
        this.rightkgrams = new Range(initial.right.index);
        this.leftSelection = initial.left.location;
        this.rightSelection = initial.right.location;
        this.mergedStart = initial.left.start;
        this.mergedData = initial.left.data;
        this.mergedStop = initial.left.stop;
    }

    /**
     * Check if another occurrence can extend this fragment.
     * An occurrence extends if its indices are exactly +1 from our end.
     */
    private extendable(other: PairedOccurrence): boolean {
        return this.leftkgrams.to === other.left.index &&
            this.rightkgrams.to === other.right.index;
    }

    /**
     * Extend this fragment with a new paired occurrence.
     */
    public extendWith(other: PairedOccurrence): void {
        assert(this.extendable(other), "Occurrence does not extend this fragment");
        this.pairs.push(other);

        // Merge token data if available
        if (this.mergedData && other.left.data) {
            if (this.mergedStop < other.left.start) {
                // Gap between current end and new start - add placeholders
                for (let i = 0; i < (other.left.start - this.mergedStop - 1); i++) {
                    this.mergedData.push("?");
                }
                for (let i = 0; i < other.left.data.length; i++) {
                    this.mergedData.push(other.left.data[i]);
                }
            } else {
                // Overlapping - only add non-overlapping tokens
                for (let i = this.mergedStop - other.left.start + 1; i < other.left.data.length; i++) {
                    this.mergedData.push(other.left.data[i]);
                }
            }
        }

        this.mergedStop = other.left.stop;

        // Merge k-gram index ranges
        this.leftkgrams = Range.merge(this.leftkgrams, new Range(other.left.index));
        this.rightkgrams = Range.merge(this.rightkgrams, new Range(other.right.index));

        // Merge source code selections
        this.leftSelection = Region.merge(this.leftSelection, other.left.location);
        this.rightSelection = Region.merge(this.rightSelection, other.right.location);
    }

    /**
     * Extend this fragment with another fragment.
     */
    public extendWithFragment(other: Fragment): void {
        const otherFirst = other.pairs[0];
        assert(this.extendable(otherFirst), "Fragment does not extend this fragment");

        this.pairs = this.pairs.concat(other.pairs);

        // Merge token data
        if (this.mergedData && other.mergedData) {
            if (this.mergedStop < other.leftkgrams.from) {
                for (let i = 0; i < (other.mergedStart - this.mergedStop - 1); i++) {
                    this.mergedData.push("?");
                }
                for (let i = 0; i < other.mergedData.length; i++) {
                    this.mergedData.push(other.mergedData[i]);
                }
            } else {
                for (let i = this.mergedStop - other.leftkgrams.from + 1; i < other.mergedData.length; i++) {
                    this.mergedData.push(other.mergedData[i]);
                }
            }
        }

        this.mergedStop = other.mergedStop;

        // Merge ranges
        this.leftkgrams = Range.merge(this.leftkgrams, other.leftkgrams);
        this.rightkgrams = Range.merge(this.rightkgrams, other.rightkgrams);

        // Merge selections
        this.leftSelection = Region.merge(this.leftSelection, other.leftSelection);
        this.rightSelection = Region.merge(this.rightSelection, other.rightSelection);
    }

    /**
     * Get the length of this fragment (number of k-grams).
     */
    get length(): number {
        return this.pairs.length;
    }
}
