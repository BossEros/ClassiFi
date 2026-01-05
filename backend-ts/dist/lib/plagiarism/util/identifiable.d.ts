/**
 * Base class that provides auto-incrementing IDs for objects.
 * Used by files, pairs, and fingerprints to have unique identifiers.
 */
export declare abstract class Identifiable {
    private static nextId;
    readonly id: number;
    protected constructor(id?: number);
    /**
     * Reset the ID counter. Useful for testing.
     */
    static resetIdCounter(): void;
}
//# sourceMappingURL=identifiable.d.ts.map