import { assert } from "./utils.js";

/**
 * Represents a range of integers [from, to).
 * Used for tracking k-gram indices.
 */
export class Range {
    public readonly to: number;

    constructor(
        public readonly from: number,
        to: number = -1
    ) {
        if (to === -1) {
            this.to = from + 1;
        } else {
            this.to = to;
        }
        assert(this.from < this.to, "'from' should be smaller than 'to'");
    }

    /**
     * Length of the range.
     */
    get length(): number {
        return this.to - this.from;
    }

    /**
     * Compare two ranges by start position, then by end position.
     */
    public static compare(one: Range, other: Range): number {
        if (one.from === other.from) {
            return one.to - other.to;
        }
        return one.from - other.from;
    }

    /**
     * Compare two ranges by end position, then by start position.
     */
    public static compareEnds(one: Range, other: Range): number {
        if (one.to === other.to) {
            return one.from - other.from;
        }
        return one.to - other.to;
    }

    /**
     * Merge two ranges into a range that covers both.
     */
    public static merge(one: Range, other: Range): Range {
        return new Range(
            Math.min(one.from, other.from),
            Math.max(one.to, other.to)
        );
    }

    /**
     * Calculate total coverage of multiple ranges (handling overlaps).
     */
    public static totalCovered(ranges: Array<Range>): number {
        let total = 0;
        let last = 0;
        for (const range of ranges.sort(Range.compare)) {
            if (last < range.to) {
                total += range.to - Math.max(last, range.from);
                last = range.to;
            }
        }
        return total;
    }

    /**
     * Check if this range overlaps with another.
     */
    public overlapsWith(other: Range): boolean {
        if (this.from < other.from) {
            return this.to > other.from;
        } else if (this.from > other.from) {
            return other.to > this.from;
        } else {
            return true;
        }
    }

    /**
     * Check if this range fully contains another.
     */
    public contains(other: Range): boolean {
        return this.from <= other.from && other.to <= this.to;
    }
}
