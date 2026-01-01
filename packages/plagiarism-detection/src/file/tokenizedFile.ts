import { File } from "./file.js";
import { Region } from "../util/region.js";

/**
 * A file that has been tokenized into AST tokens.
 * Contains the tokens and mapping from token index to source location.
 */
export class TokenizedFile extends File {
    constructor(
        public originalFile: File,
        public readonly tokens: Array<string>,
        public readonly mapping: Array<Region>
    ) {
        super(originalFile.path, originalFile.content, originalFile.info, originalFile.id);
    }

    /**
     * Get the number of tokens in this file.
     */
    get tokenCount(): number {
        return this.tokens.length;
    }
}
