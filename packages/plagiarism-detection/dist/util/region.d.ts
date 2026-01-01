/**
 * Represents a selection/region in a source file.
 * Uses 0-indexed row and column numbers.
 */
export declare class Region {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    constructor(startRow: number, startCol: number, endRow: number, endCol: number);
    /**
     * Check if the region coordinates are valid.
     */
    static valid(startRow: number, startCol: number, endRow: number, endCol: number): boolean;
    /**
     * Check if two regions are in order (first before second).
     */
    static isInOrder(first: Region, second: Region): boolean;
    /**
     * Compare two regions for sorting.
     */
    static compare(left: Region, right: Region): number;
    /**
     * Merge two regions into a region that covers both.
     */
    static merge(one: Region, other: Region): Region;
    /**
     * Check if this region overlaps with another.
     */
    overlapsWith(other: Region): boolean;
    toString(): string;
}
//# sourceMappingURL=region.d.ts.map