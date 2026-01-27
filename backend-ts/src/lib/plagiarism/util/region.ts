import { assert } from "./utils.js"

/**
 * Represents a selection/region in a source file.
 * Uses 0-indexed row and column numbers.
 */
export class Region {
  constructor(
    public startRow: number,
    public startCol: number,
    public endRow: number,
    public endCol: number,
  ) {
    assert(
      Region.valid(startRow, startCol, endRow, endCol),
      `Invalid region: (${startRow}, ${startCol}) -> (${endRow}, ${endCol})`,
    )
  }

  /**
   * Check if the region coordinates are valid.
   */
  public static valid(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ): boolean {
    return startRow < endRow || (startRow === endRow && startCol <= endCol)
  }

  /**
   * Check if two regions are in order (first before second).
   */
  public static isInOrder(first: Region, second: Region): boolean {
    return Region.valid(
      first.startRow,
      first.startCol,
      second.endRow,
      second.endCol,
    )
  }

  /**
   * Compare two regions for sorting.
   */
  public static compare(left: Region, right: Region): number {
    let diff = left.startRow - right.startRow
    if (diff !== 0) return diff
    diff = left.startCol - right.startCol
    if (diff !== 0) return diff
    diff = left.endRow - right.endRow
    if (diff !== 0) return diff
    return left.endCol - right.endCol
  }

  /**
   * Merge two regions into a region that covers both.
   */
  public static merge(one: Region, other: Region): Region {
    let startRow: number, startCol: number, endRow: number, endCol: number

    if (one.startRow < other.startRow) {
      startRow = one.startRow
      startCol = one.startCol
    } else if (one.startRow > other.startRow) {
      startRow = other.startRow
      startCol = other.startCol
    } else {
      startRow = one.startRow
      startCol = Math.min(one.startCol, other.startCol)
    }

    if (one.endRow > other.endRow) {
      endRow = one.endRow
      endCol = one.endCol
    } else if (one.endRow < other.endRow) {
      endRow = other.endRow
      endCol = other.endCol
    } else {
      endRow = one.endRow
      endCol = Math.max(one.endCol, other.endCol)
    }

    return new Region(startRow, startCol, endRow, endCol)
  }

  /**
   * Check if this region overlaps with another.
   */
  public overlapsWith(other: Region): boolean {
    const [left, right] = [this, other].sort(Region.compare)
    if (left.endRow < right.startRow) {
      return false
    } else if (left.endRow === right.startRow) {
      return right.startCol < left.endCol
    } else {
      return true
    }
  }

  public toString(): string {
    return `Region {${this.startRow}:${this.startCol} -> ${this.endRow}:${this.endCol}}`
  }
}
