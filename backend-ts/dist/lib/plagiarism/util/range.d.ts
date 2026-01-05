/**
 * Represents a range of integers [from, to).
 * Used for tracking k-gram indices.
 */
export declare class Range {
    readonly from: number;
    readonly to: number;
    constructor(from: number, to?: number);
    /**
     * Length of the range.
     */
    get length(): number;
    /**
     * Compare two ranges by start position, then by end position.
     */
    static compare(one: Range, other: Range): number;
    /**
     * Compare two ranges by end position, then by start position.
     */
    static compareEnds(one: Range, other: Range): number;
    /**
     * Merge two ranges into a range that covers both.
     */
    static merge(one: Range, other: Range): Range;
    /**
     * Calculate total coverage of multiple ranges (handling overlaps).
     */
    static totalCovered(ranges: Array<Range>): number;
    /**
     * Check if this range overlaps with another.
     */
    overlapsWith(other: Range): boolean;
    /**
     * Check if this range fully contains another.
     */
    contains(other: Range): boolean;
}
//# sourceMappingURL=range.d.ts.map