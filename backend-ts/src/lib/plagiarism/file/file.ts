import { Identifiable } from "@/lib/plagiarism/util/identifiable.js"

/**
 * Optional metadata for a file.
 */
export interface FileInfo {
  filename?: string
  studentId?: string
  studentName?: string
  submissionId?: string
  labels?: string[]
}

/**
 * Represents a source code file.
 */
export class File extends Identifiable {
  public readonly charCount: number
  public readonly lineCount: number
  public readonly lines: Array<string>
  public readonly info?: FileInfo

  constructor(
    public readonly path: string,
    content: string,
    info?: FileInfo,
    id?: number,
  ) {
    super(id)
    this.charCount = content.length
    this.lines = content.split("\n")
    this.lineCount = this.lines.length
    this.info = info
  }

  /**
   * Get the full content of the file.
   */
  get content(): string {
    return this.lines.join("\n")
  }

  /**
   * Get the file extension (including the dot).
   */
  get extension(): string {
    const idx = this.path.lastIndexOf(".")
    if (idx < 0) {
      return ""
    }
    return this.path.substring(idx)
  }

  /**
   * Get just the filename (without directory path).
   */
  get filename(): string {
    const idx = Math.max(
      this.path.lastIndexOf("/"),
      this.path.lastIndexOf("\\"),
    )
    return this.path.substring(idx + 1)
  }

  /**
   * Compare files by path for sorting.
   */
  public static compare(a: File, b: File): number {
    if (a.path < b.path) return -1
    if (a.path > b.path) return 1
    return 0
  }
}
