/**
 * Hashes individual tokens using Rabin-Karp style hashing.
 * Uses a different base than RollingHash to avoid collisions
 * between similar token sequences.
 */
export declare class TokenHash {
    /**
     * Modulus: largest 26-bit prime (JS has 53-bit precision)
     */
    readonly mod: number;
    /**
     * Base: chosen so that 127 * base < mod
     * This ensures character codes hash well.
     */
    readonly base: number;
    /**
     * Hash a token string to a numeric value.
     */
    hashToken(token: string): number;
}
//# sourceMappingURL=tokenHash.d.ts.map