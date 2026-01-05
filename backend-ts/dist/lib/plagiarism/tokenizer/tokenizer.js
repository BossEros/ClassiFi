import { TokenizedFile } from "../file/tokenizedFile.js";
/**
 * Abstract base class for tokenizers.
 * Subclasses implement language-specific parsing.
 */
export class Tokenizer {
    languageName;
    options;
    constructor(languageName, options = {}) {
        this.languageName = languageName;
        this.options = options;
    }
    /**
     * Tokenize a file and return a TokenizedFile.
     */
    tokenizeFile(file) {
        const [ast, mapping] = this.tokenizeWithMapping(file.content);
        return new TokenizedFile(file, ast, mapping);
    }
    /**
     * Tokenize text and return both tokens and position mappings.
     */
    tokenizeWithMapping(text) {
        const resultTokens = [];
        const positionMapping = [];
        for (const { token, location } of this.generateTokens(text)) {
            resultTokens.push(token);
            positionMapping.push(location);
        }
        return [resultTokens, positionMapping];
    }
    /**
     * Helper to create a Token object.
     */
    newToken(token, location) {
        return { token, location };
    }
}
//# sourceMappingURL=tokenizer.js.map