import { TokenHash } from "./tokenHash.js";

/**
 * A fingerprint represents a k-gram hash with its position.
 */
export interface Fingerprint {
    /** Optional: the actual token strings in this k-gram */
    data: Array<string> | null;
    /** The hash value of this k-gram */
    hash: number;
    /** Start index in the token array */
    start: number;
    /** End index (inclusive) in the token array */
    stop: number;
}

/**
 * Abstract base class for hash filtering algorithms.
 * Subclasses implement specific fingerprint selection strategies.
 */
export abstract class HashFilter {
    protected hasher: TokenHash = new TokenHash();
    protected readonly kgramData: boolean;

    protected constructor(kgramData = false) {
        this.kgramData = kgramData;
    }

    /**
     * Hash all tokens and return pairs of (hash, token).
     */
    public hashTokens(tokens: string[]): Array<[number, string]> {
        const hashes: Array<[number, string]> = [];
        for (const token of tokens) {
            hashes.push([this.hasher.hashToken(token), token]);
        }
        return hashes;
    }

    /**
     * Generate fingerprints from tokens.
     * Each fingerprint contains a hash and position information.
     */
    public abstract fingerprints(tokens: string[]): Array<Fingerprint>;
}
