"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedFingerprint = void 0;
const identifiable_js_1 = require("../util/identifiable.js");
/**
 * A shared fingerprint is a k-gram hash that appears in multiple files.
 * It tracks all occurrences of this fingerprint across files.
 */
class SharedFingerprint extends identifiable_js_1.Identifiable {
    hash;
    kgram;
    /** Whether this fingerprint is from boilerplate/template code */
    ignored = false;
    /** Map from file -> list of occurrences in that file */
    partMap = new Map();
    constructor(hash, kgram) {
        super();
        this.hash = hash;
        this.kgram = kgram;
    }
    /**
     * Add an occurrence of this fingerprint.
     */
    add(part) {
        const parts = this.partMap.get(part.file) || [];
        if (parts.length === 0) {
            this.partMap.set(part.file, parts);
        }
        parts.push(part);
    }
    /**
     * Get all occurrences in a specific file.
     */
    occurrencesOf(file) {
        return this.partMap.get(file) || [];
    }
    /**
     * Get all occurrences across all files.
     */
    allOccurrences() {
        return Array.from(this.partMap.values()).flat();
    }
    /**
     * Get all files that contain this fingerprint.
     */
    files() {
        return Array.from(this.partMap.keys());
    }
    /**
     * Get the number of files containing this fingerprint.
     */
    fileCount() {
        return this.partMap.size;
    }
    /**
     * Check if a specific file contains this fingerprint.
     */
    includesFile(file) {
        return this.partMap.has(file);
    }
}
exports.SharedFingerprint = SharedFingerprint;
//# sourceMappingURL=sharedFingerprint.js.map