/**
 * Rabin-Karp rolling hash for k-grams.
 * Efficiently computes hash of sliding window over tokens.
 */
export class RollingHash {
    /**
     * Modulus: largest 26-bit prime (JS has 53-bit precision)
     */
    readonly mod: number = 33554393;

    /**
     * Base: largest 22-bit prime
     */
    readonly base: number = 4194301;

    /**
     * Size of the k-gram window.
     */
    readonly k: number;

    private readonly memory: number[];
    private readonly maxBase: number;
    private i = 0;
    private hash = 0;

    constructor(k: number) {
        this.k = k;
        this.maxBase = this.mod - this.modPow(this.base, this.k, this.mod);
        this.memory = new Array(this.k).fill(0);
    }

    /**
     * Calculate the next hash value given a new token.
     * This is the "rolling" part - we add the new token and
     * remove the oldest token from the window.
     */
    public nextHash(token: number): number {
        this.hash = (this.base * this.hash + token + this.maxBase * this.memory[this.i]) % this.mod;
        this.memory[this.i] = token;
        this.i = (this.i + 1) % this.k;
        return this.hash;
    }

    /**
     * Modular exponentiation without overflow.
     * Computes (base^exp) % mod efficiently.
     */
    private modPow(base: number, exp: number, mod: number): number {
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
