"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashFilter = void 0;
const tokenHash_js_1 = require("./tokenHash.js");
/**
 * Abstract base class for hash filtering algorithms.
 * Subclasses implement specific fingerprint selection strategies.
 */
class HashFilter {
    hasher = new tokenHash_js_1.TokenHash();
    kgramData;
    constructor(kgramData = false) {
        this.kgramData = kgramData;
    }
    /**
     * Hash all tokens and return pairs of (hash, token).
     */
    hashTokens(tokens) {
        const hashes = [];
        for (const token of tokens) {
            hashes.push([this.hasher.hashToken(token), token]);
        }
        return hashes;
    }
}
exports.HashFilter = HashFilter;
//# sourceMappingURL=hashFilter.js.map