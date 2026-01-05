import { assert } from "./utils.js";
/**
 * Represents a selection/region in a source file.
 * Uses 0-indexed row and column numbers.
 */
export class Region {
    startRow;
    startCol;
    endRow;
    endCol;
    constructor(startRow, startCol, endRow, endCol) {
        this.startRow = startRow;
        this.startCol = startCol;
        this.endRow = endRow;
        this.endCol = endCol;
        assert(Region.valid(startRow, startCol, endRow, endCol), `Invalid region: (${startRow}, ${startCol}) -> (${endRow}, ${endCol})`);
    }
    /**
     * Check if the region coordinates are valid.
     */
    static valid(startRow, startCol, endRow, endCol) {
        return startRow < endRow || (startRow === endRow && startCol <= endCol);
    }
    /**
     * Check if two regions are in order (first before second).
     */
    static isInOrder(first, second) {
        return Region.valid(first.startRow, first.startCol, second.endRow, second.endCol);
    }
    /**
     * Compare two regions for sorting.
     */
    static compare(left, right) {
        let diff = left.startRow - right.startRow;
        if (diff !== 0)
            return diff;
        diff = left.startCol - right.startCol;
        if (diff !== 0)
            return diff;
        diff = left.endRow - right.endRow;
        if (diff !== 0)
            return diff;
        return left.endCol - right.endCol;
    }
    /**
     * Merge two regions into a region that covers both.
     */
    static merge(one, other) {
        let startRow, startCol, endRow, endCol;
        if (one.startRow < other.startRow) {
            startRow = one.startRow;
            startCol = one.startCol;
        }
        else if (one.startRow > other.startRow) {
            startRow = other.startRow;
            startCol = other.startCol;
        }
        else {
            startRow = one.startRow;
            startCol = Math.min(one.startCol, other.startCol);
        }
        if (one.endRow > other.endRow) {
            endRow = one.endRow;
            endCol = one.endCol;
        }
        else if (one.endRow < other.endRow) {
            endRow = other.endRow;
            endCol = other.endCol;
        }
        else {
            endRow = one.endRow;
            endCol = Math.max(one.endCol, other.endCol);
        }
        return new Region(startRow, startCol, endRow, endCol);
    }
    /**
     * Check if this region overlaps with another.
     */
    overlapsWith(other) {
        const [left, right] = [this, other].sort(Region.compare);
        if (left.endRow < right.startRow) {
            return false;
        }
        else if (left.endRow === right.startRow) {
            return right.startCol < left.endCol;
        }
        else {
            return true;
        }
    }
    toString() {
        return `Region {${this.startRow}:${this.startCol} -> ${this.endRow}:${this.endCol}}`;
    }
}
//# sourceMappingURL=region.js.map