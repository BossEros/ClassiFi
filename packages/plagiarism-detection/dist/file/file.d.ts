import { Identifiable } from "../util/identifiable.js";
/**
 * Optional metadata for a file.
 */
export interface FileInfo {
    filename?: string;
    studentId?: string;
    studentName?: string;
    submissionId?: string;
    labels?: string[];
}
/**
 * Represents a source code file.
 */
export declare class File extends Identifiable {
    readonly path: string;
    readonly charCount: number;
    readonly lineCount: number;
    readonly lines: Array<string>;
    readonly info?: FileInfo;
    constructor(path: string, content: string, info?: FileInfo, id?: number);
    /**
     * Get the full content of the file.
     */
    get content(): string;
    /**
     * Get the file extension (including the dot).
     */
    get extension(): string;
    /**
     * Get just the filename (without directory path).
     */
    get filename(): string;
    /**
     * Compare files by path for sorting.
     */
    static compare(a: File, b: File): number;
}
//# sourceMappingURL=file.d.ts.map