/**
 * Hashes individual tokens using Rabin-Karp style hashing.
 * Uses a different base than RollingHash to avoid collisions
 * between similar token sequences.
 */
export class TokenHash {
    /**
     * Modulus: largest 26-bit prime (JS has 53-bit precision)
     */
    mod = 33554393;
    /**
     * Base: chosen so that 127 * base < mod
     * This ensures character codes hash well.
     */
    base = 747287;
    /**
     * Hash a token string to a numeric value.
     */
    hashToken(token) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = ((hash + token.charCodeAt(i)) * this.base) % this.mod;
        }
        return hash;
    }
}
//# sourceMappingURL=tokenHash.js.map