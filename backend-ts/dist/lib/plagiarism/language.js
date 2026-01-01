import { CodeTokenizer } from "./tokenizer/codeTokenizer.js";
/**
 * Represents a programming language with its tree-sitter grammar.
 */
export class ProgrammingLanguage {
    name;
    extensions;
    grammar;
    constructor(name, extensions, grammar) {
        this.name = name;
        this.extensions = extensions;
        this.grammar = grammar;
    }
    /**
     * Check if a file path matches this language's extensions.
     */
    extensionMatches(path) {
        const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
        return this.extensions.includes(ext);
    }
    /**
     * Create a tokenizer for this language.
     */
    createTokenizer(options) {
        return new CodeTokenizer(this, options);
    }
}
/**
 * Registry of supported languages.
 */
export class LanguageRegistry {
    languages = new Map();
    /**
     * Register a new language.
     */
    register(language) {
        this.languages.set(language.name.toLowerCase(), language);
    }
    /**
     * Get a language by name.
     */
    get(name) {
        return this.languages.get(name.toLowerCase());
    }
    /**
     * Get all registered languages.
     */
    all() {
        return Array.from(this.languages.values());
    }
    /**
     * Detect language from file extension.
     */
    detectFromPath(path) {
        for (const lang of this.languages.values()) {
            if (lang.extensionMatches(path)) {
                return lang;
            }
        }
        return undefined;
    }
}
/**
 * Create the default language registry with Java, Python, and C.
 *
 * @returns A promise that resolves to the language registry
 */
export async function createDefaultRegistry() {
    const registry = new LanguageRegistry();
    try {
        // Import tree-sitter grammars dynamically
        const [javaModule, pythonModule, cModule] = await Promise.all([
            import("tree-sitter-java"),
            import("tree-sitter-python"),
            import("tree-sitter-c")
        ]);
        registry.register(new ProgrammingLanguage("java", [".java"], javaModule.default));
        registry.register(new ProgrammingLanguage("python", [".py"], pythonModule.default));
        registry.register(new ProgrammingLanguage("c", [".c", ".h"], cModule.default));
    }
    catch (error) {
        console.warn("Failed to load tree-sitter grammars:", error);
        console.warn("Make sure tree-sitter-java, tree-sitter-python, and tree-sitter-c are installed.");
    }
    return registry;
}
//# sourceMappingURL=language.js.map