"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fragment = void 0;
const utils_js_1 = require("../util/utils.js");
const region_js_1 = require("../util/region.js");
const range_js_1 = require("../util/range.js");
/**
 * A fragment is a contiguous region of matching code between two files.
 * It's built from consecutive paired k-gram occurrences.
 */
class Fragment {
    /** All the paired occurrences that make up this fragment */
    pairs;
    /** Range of k-gram indices in the left file */
    leftkgrams;
    /** Range of k-gram indices in the right file */
    rightkgrams;
    /** Source code region in the left file */
    leftSelection;
    /** Source code region in the right file */
    rightSelection;
    /** Merged token data (if available) */
    mergedData;
    mergedStart;
    mergedStop;
    constructor(initial) {
        this.pairs = [initial];
        this.leftkgrams = new range_js_1.Range(initial.left.index);
        this.rightkgrams = new range_js_1.Range(initial.right.index);
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
    extendable(other) {
        return this.leftkgrams.to === other.left.index &&
            this.rightkgrams.to === other.right.index;
    }
    /**
     * Extend this fragment with a new paired occurrence.
     */
    extendWith(other) {
        (0, utils_js_1.assert)(this.extendable(other), "Occurrence does not extend this fragment");
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
            }
            else {
                // Overlapping - only add non-overlapping tokens
                for (let i = this.mergedStop - other.left.start + 1; i < other.left.data.length; i++) {
                    this.mergedData.push(other.left.data[i]);
                }
            }
        }
        this.mergedStop = other.left.stop;
        // Merge k-gram index ranges
        this.leftkgrams = range_js_1.Range.merge(this.leftkgrams, new range_js_1.Range(other.left.index));
        this.rightkgrams = range_js_1.Range.merge(this.rightkgrams, new range_js_1.Range(other.right.index));
        // Merge source code selections
        this.leftSelection = region_js_1.Region.merge(this.leftSelection, other.left.location);
        this.rightSelection = region_js_1.Region.merge(this.rightSelection, other.right.location);
    }
    /**
     * Extend this fragment with another fragment.
     */
    extendWithFragment(other) {
        const otherFirst = other.pairs[0];
        (0, utils_js_1.assert)(this.extendable(otherFirst), "Fragment does not extend this fragment");
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
            }
            else {
                for (let i = this.mergedStop - other.leftkgrams.from + 1; i < other.mergedData.length; i++) {
                    this.mergedData.push(other.mergedData[i]);
                }
            }
        }
        this.mergedStop = other.mergedStop;
        // Merge ranges
        this.leftkgrams = range_js_1.Range.merge(this.leftkgrams, other.leftkgrams);
        this.rightkgrams = range_js_1.Range.merge(this.rightkgrams, other.rightkgrams);
        // Merge selections
        this.leftSelection = region_js_1.Region.merge(this.leftSelection, other.leftSelection);
        this.rightSelection = region_js_1.Region.merge(this.rightSelection, other.rightSelection);
    }
    /**
     * Get the length of this fragment (number of k-grams).
     */
    get length() {
        return this.pairs.length;
    }
}
exports.Fragment = Fragment;
//# sourceMappingURL=fragment.js.map