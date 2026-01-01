"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = void 0;
const tokenizedFile_js_1 = require("../file/tokenizedFile.js");
/**
 * Abstract base class for tokenizers.
 * Subclasses implement language-specific parsing.
 */
class Tokenizer {
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
        return new tokenizedFile_js_1.TokenizedFile(file, ast, mapping);
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
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=tokenizer.js.map