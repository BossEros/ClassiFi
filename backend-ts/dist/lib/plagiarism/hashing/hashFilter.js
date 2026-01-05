import { TokenHash } from "./tokenHash.js";
/**
 * Abstract base class for hash filtering algorithms.
 * Subclasses implement specific fingerprint selection strategies.
 */
export class HashFilter {
    hasher = new TokenHash();
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
//# sourceMappingURL=hashFilter.js.map