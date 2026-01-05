import { File } from "./file.js";
import { Region } from "../util/region.js";
/**
 * A file that has been tokenized into AST tokens.
 * Contains the tokens and mapping from token index to source location.
 */
export declare class TokenizedFile extends File {
    originalFile: File;
    readonly tokens: Array<string>;
    readonly mapping: Array<Region>;
    constructor(originalFile: File, tokens: Array<string>, mapping: Array<Region>);
    /**
     * Get the number of tokens in this file.
     */
    get tokenCount(): number;
}
//# sourceMappingURL=tokenizedFile.d.ts.map