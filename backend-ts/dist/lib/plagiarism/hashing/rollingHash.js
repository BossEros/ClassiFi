/**
 * Rabin-Karp rolling hash for k-grams.
 * Efficiently computes hash of sliding window over tokens.
 */
export class RollingHash {
    /**
     * Modulus: largest 26-bit prime (JS has 53-bit precision)
     */
    mod = 33554393;
    /**
     * Base: largest 22-bit prime
     */
    base = 4194301;
    /**
     * Size of the k-gram window.
     */
    k;
    memory;
    maxBase;
    i = 0;
    hash = 0;
    constructor(k) {
        this.k = k;
        this.maxBase = this.mod - this.modPow(this.base, this.k, this.mod);
        this.memory = new Array(this.k).fill(0);
    }
    /**
     * Calculate the next hash value given a new token.
     * This is the "rolling" part - we add the new token and
     * remove the oldest token from the window.
     */
    nextHash(token) {
        this.hash = (this.base * this.hash + token + this.maxBase * this.memory[this.i]) % this.mod;
        this.memory[this.i] = token;
        this.i = (this.i + 1) % this.k;
        return this.hash;
    }
    /**
     * Modular exponentiation without overflow.
     * Computes (base^exp) % mod efficiently.
     */
    modPow(base, exp, mod) {
        let y = 1;
        let b = base;
        let e = exp;
        while (e > 1) {
            if (e & 1) {
                y = (b * y) % mod;
            }
            b = (b * b) % mod;
            e >>= 1;
        }
        return (b * y) % mod;
    }
}
//# sourceMappingURL=rollingHash.js.map