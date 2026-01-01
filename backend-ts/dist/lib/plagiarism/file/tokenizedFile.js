import { File } from "./file.js";
/**
 * A file that has been tokenized into AST tokens.
 * Contains the tokens and mapping from token index to source location.
 */
export class TokenizedFile extends File {
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
//# sourceMappingURL=tokenizedFile.js.map