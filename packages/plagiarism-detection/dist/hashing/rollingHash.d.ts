/**
 * Rabin-Karp rolling hash for k-grams.
 * Efficiently computes hash of sliding window over tokens.
 */
export declare class RollingHash {
    /**
     * Modulus: largest 26-bit prime (JS has 53-bit precision)
     */
    readonly mod: number;
    /**
     * Base: largest 22-bit prime
     */
    readonly base: number;
    /**
     * Size of the k-gram window.
     */
    readonly k: number;
    private readonly memory;
    private readonly maxBase;
    private i;
    private hash;
    constructor(k: number);
    /**
     * Calculate the next hash value given a new token.
     * This is the "rolling" part - we add the new token and
     * remove the oldest token from the window.
     */
    nextHash(token: number): number;
    /**
     * Modular exponentiation without overflow.
     * Computes (base^exp) % mod efficiently.
     */
    private modPow;
}
//# sourceMappingURL=rollingHash.d.ts.map