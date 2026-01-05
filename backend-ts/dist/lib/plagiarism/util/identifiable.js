/**
 * Base class that provides auto-incrementing IDs for objects.
 * Used by files, pairs, and fingerprints to have unique identifiers.
 */
export class Identifiable {
    static nextId = 0;
    id;
    constructor(id) {
        if (id !== undefined) {
            this.id = id;
            Identifiable.nextId = Math.max(Identifiable.nextId, id + 1);
        }
        else {
            this.id = Identifiable.nextId++;
        }
    }
    /**
     * Reset the ID counter. Useful for testing.
     */
    static resetIdCounter() {
        Identifiable.nextId = 0;
    }
}
//# sourceMappingURL=identifiable.js.map