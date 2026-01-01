import { Identifiable } from "../util/identifiable.js";
/**
 * Represents a source code file.
 */
export class File extends Identifiable {
    path;
    charCount;
    lineCount;
    lines;
    info;
    constructor(path, content, info, id) {
        super(id);
        this.path = path;
        this.charCount = content.length;
        this.lines = content.split("\n");
        this.lineCount = this.lines.length;
        this.info = info;
    }
    /**
     * Get the full content of the file.
     */
    get content() {
        return this.lines.join("\n");
    }
    /**
     * Get the file extension (including the dot).
     */
    get extension() {
        const idx = this.path.lastIndexOf(".");
        if (idx < 0) {
            return "";
        }
        return this.path.substring(idx);
    }
    /**
     * Get just the filename (without directory path).
     */
    get filename() {
        const idx = Math.max(this.path.lastIndexOf("/"), this.path.lastIndexOf("\\"));
        return this.path.substring(idx + 1);
    }
    /**
     * Compare files by path for sorting.
     */
    static compare(a, b) {
        if (a.path < b.path)
            return -1;
        if (a.path > b.path)
            return 1;
        return 0;
    }
}
//# sourceMappingURL=file.js.map