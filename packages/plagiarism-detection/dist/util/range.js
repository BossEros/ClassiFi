"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Range = void 0;
const utils_js_1 = require("./utils.js");
/**
 * Represents a range of integers [from, to).
 * Used for tracking k-gram indices.
 */
class Range {
    from;
    to;
    constructor(from, to = -1) {
        this.from = from;
        if (to === -1) {
            this.to = from + 1;
        }
        else {
            this.to = to;
        }
        (0, utils_js_1.assert)(this.from < this.to, "'from' should be smaller than 'to'");
    }
    /**
     * Length of the range.
     */
    get length() {
        return this.to - this.from;
    }
    /**
     * Compare two ranges by start position, then by end position.
     */
    static compare(one, other) {
        if (one.from === other.from) {
            return one.to - other.to;
        }
        return one.from - other.from;
    }
    /**
     * Compare two ranges by end position, then by start position.
     */
    static compareEnds(one, other) {
        if (one.to === other.to) {
            return one.from - other.from;
        }
        return one.to - other.to;
    }
    /**
     * Merge two ranges into a range that covers both.
     */
    static merge(one, other) {
        return new Range(Math.min(one.from, other.from), Math.max(one.to, other.to));
    }
    /**
     * Calculate total coverage of multiple ranges (handling overlaps).
     */
    static totalCovered(ranges) {
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
    overlapsWith(other) {
        if (this.from < other.from) {
            return this.to > other.from;
        }
        else if (this.from > other.from) {
            return other.to > this.from;
        }
        else {
            return true;
        }
    }
    /**
     * Check if this range fully contains another.
     */
    contains(other) {
        return this.from <= other.from && other.to <= this.to;
    }
}
exports.Range = Range;
//# sourceMappingURL=range.js.map