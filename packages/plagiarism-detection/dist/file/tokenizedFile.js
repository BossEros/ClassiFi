"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenizedFile = void 0;
const file_js_1 = require("./file.js");
/**
 * A file that has been tokenized into AST tokens.
 * Contains the tokens and mapping from token index to source location.
 */
class TokenizedFile extends file_js_1.File {
    originalFile;
    tokens;
    mapping;
    constructor(originalFile, tokens, mapping) {
        super(originalFile.path, originalFile.content, originalFile.info, originalFile.id);
        this.originalFile = originalFile;
        this.tokens = tokens;
        this.mapping = mapping;
    }
    /**
     * Get the number of tokens in this file.
     */
    get tokenCount() {
        return this.tokens.length;
    }
}
exports.TokenizedFile = TokenizedFile;
//# sourceMappingURL=tokenizedFile.js.map