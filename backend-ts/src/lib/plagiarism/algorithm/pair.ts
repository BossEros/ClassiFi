import { Range } from "../util/range.js"
import { PairedOccurrence } from "./pairedOccurrence.js"
import { Fragment } from "./fragment.js"
import { Identifiable } from "../util/identifiable.js"
import { SharedFingerprint, Occurrence } from "./sharedFingerprint.js"
import { TokenizedFile } from "../file/tokenizedFile.js"
import { FileEntry } from "./types.js"

type LeftRight = string

interface Kgram {
  hash: number
  index: number
}

/**
 * A Pair represents the comparison between two files.
 * It calculates similarity scores and can extract matching fragments.
 */
export class Pair extends Identifiable {
  /** Shared fingerprints between the two files */
  private readonly shared: Array<SharedFingerprint>

  /** The left file */
  public readonly leftFile: TokenizedFile
  /** The right file */
  public readonly rightFile: TokenizedFile

  /** Number of covered k-grams in left file */
  public readonly leftCovered: number
  /** Number of covered k-grams in right file */
  public readonly rightCovered: number
  /** Total k-grams in left file */
  public readonly leftTotal: number
  /** Total k-grams in right file */
  public readonly rightTotal: number
  /** Length of longest matching fragment */
  public readonly longest: number
  /** Overall similarity score (0-1) */
  public readonly similarity: number
  /** Number of ignored k-grams in left file */
  public readonly leftIgnored: number
  /** Number of ignored k-grams in right file */
  public readonly rightIgnored: number

  constructor(
    public readonly leftEntry: FileEntry,
    public readonly rightEntry: FileEntry,
  ) {
    super()
    this.leftFile = leftEntry.file
    this.rightFile = rightEntry.file

    // Find shared fingerprints between the two files
    let small: FileEntry, large: FileEntry
    this.shared = []

    if (leftEntry.shared.size < rightEntry.shared.size) {
      small = leftEntry
      large = rightEntry
    } else {
      small = rightEntry
      large = leftEntry
    }

    for (const fingerprint of small.shared) {
      if (large.shared.has(fingerprint)) {
        this.shared.push(fingerprint)
      }
    }

    // Build sorted lists of k-grams for each file
    const left: Kgram[] = []
    const right: Kgram[] = []

    for (const fingerprint of this.shared) {
      for (const occurrence of fingerprint.occurrencesOf(this.leftFile)) {
        left.push({ hash: fingerprint.hash, index: occurrence.side.index })
      }
      for (const occurrence of fingerprint.occurrencesOf(this.rightFile)) {
        right.push({ hash: fingerprint.hash, index: occurrence.side.index })
      }
    }

    left.sort((a, b) => a.index - b.index)
    right.sort((a, b) => a.index - b.index)

    // Calculate longest common substring
    this.longest = this.longestCommonSubstring(left, right)

    // Calculate coverage statistics
    this.leftCovered = left.length
    this.rightCovered = right.length
    this.leftIgnored = leftEntry.ignored.size
    this.rightIgnored = rightEntry.ignored.size
    this.leftTotal = leftEntry.kgrams.length
    this.rightTotal = rightEntry.kgrams.length

    // Calculate similarity score
    const denominator =
      this.leftTotal + this.rightTotal - this.leftIgnored - this.rightIgnored
    if (denominator > 0) {
      this.similarity = (this.leftCovered + this.rightCovered) / denominator
    } else {
      this.similarity = 0
    }
  }

  /**
   * Calculate the longest common substring of k-grams.
   */
  private longestCommonSubstring(l: Kgram[], r: Kgram[]): number {
    let short: Kgram[], long: Kgram[]
    if (l.length < r.length) {
      short = l
      long = r
    } else {
      short = r
      long = l
    }

    let longest = 0
    let prev: Array<number> = []
    let curr: Array<number> = []

    for (const lg of long) {
      for (const sh of short) {
        if (lg.hash === sh.hash) {
          curr[sh.index] = (prev[sh.index - 1] || 0) + 1
          longest = curr[sh.index] > longest ? curr[sh.index] : longest
        }
      }
      const tmp = prev
      tmp.length = 0
      prev = curr
      curr = tmp
    }

    return longest
  }

  /**
   * Get total overlap (left + right covered).
   */
  get overlap(): number {
    return this.leftCovered + this.rightCovered
  }

  /**
   * Build matching fragments from shared fingerprints.
   *
   * @param minimumOccurrences Minimum k-grams required for a fragment
   */
  public buildFragments(minimumOccurrences = 1): Array<Fragment> {
    const fragmentStart: Map<LeftRight, Fragment> = new Map()
    const fragmentEnd: Map<LeftRight, Fragment> = new Map()

    // Process all shared fingerprints
    for (const fingerprint of this.shared) {
      const left = Array.from(fingerprint.occurrencesOf(this.leftFile).values())
      const right = Array.from(
        fingerprint.occurrencesOf(this.rightFile).values(),
      )

      for (let i = 0; i < left.length; i++) {
        const leftOcc: Occurrence = left[i]
        for (let j = 0; j < right.length; j++) {
          const rightOcc: Occurrence = right[j]
          const occ = new PairedOccurrence(
            leftOcc.side,
            rightOcc.side,
            fingerprint,
          )
          this.addPair(fragmentStart, fragmentEnd, occ)
        }
      }
    }

    // Remove nested fragments
    this.squash(fragmentStart, fragmentEnd)

    // Filter by minimum occurrences
    for (const fragment of fragmentStart.values()) {
      if (fragment.pairs.length < minimumOccurrences) {
        this.removeFragment(fragmentStart, fragmentEnd, fragment)
      }
    }

    // Return sorted fragments
    return Array.from(fragmentStart.values()).sort((a, b) =>
      Range.compare(a.leftkgrams, b.leftkgrams),
    )
  }

  /**
   * Add a new paired occurrence, extending existing fragments or creating new ones.
   */
  private addPair(
    fragmentStart: Map<LeftRight, Fragment>,
    fragmentEnd: Map<LeftRight, Fragment>,
    newPair: PairedOccurrence,
  ): Fragment {
    const start = this.key(newPair.left.index, newPair.right.index)
    const end = this.key(newPair.left.index + 1, newPair.right.index + 1)

    let fragment = fragmentEnd.get(start)
    if (fragment) {
      // Extend existing fragment
      fragmentEnd.delete(start)
      fragment.extendWith(newPair)
    } else {
      // Create new fragment
      fragment = new Fragment(newPair)
      fragmentStart.set(start, fragment)
      fragmentEnd.set(end, fragment)
    }

    // Check if we can merge with a following fragment
    const nextFragment = fragmentStart.get(end)
    if (nextFragment) {
      fragmentStart.delete(end)
      fragment.extendWithFragment(nextFragment)
      fragmentEnd.set(
        this.key(nextFragment.leftkgrams.to, nextFragment.rightkgrams.to),
        fragment,
      )
    } else {
      fragmentEnd.set(end, fragment)
    }

    return fragment
  }

  /**
   * Remove fragments that are fully contained within larger fragments.
   */
  private squash(
    fragmentStart: Map<LeftRight, Fragment>,
    fragmentEnd: Map<LeftRight, Fragment>,
  ): void {
    const sortedByStart = Array.from(fragmentStart.values()).sort((a, b) =>
      Range.compare(a.leftkgrams, b.leftkgrams),
    )

    const sortedByEnd = Array.from(sortedByStart)
    sortedByEnd.sort((a, b) => Range.compareEnds(a.leftkgrams, b.leftkgrams))

    let j = 0
    const seen = new Set<Fragment>()

    for (const started of sortedByStart) {
      if (seen.has(started)) continue

      while (started !== sortedByEnd[j]) {
        const candidate = sortedByEnd[j]
        seen.add(candidate)

        if (
          started.leftkgrams.contains(candidate.leftkgrams) &&
          started.rightkgrams.contains(candidate.rightkgrams)
        ) {
          this.removeFragment(fragmentStart, fragmentEnd, candidate)
        }
        j += 1
      }
      j += 1
    }
  }

  /**
   * Remove a fragment from the maps.
   */
  private removeFragment(
    fragmentStart: Map<LeftRight, Fragment>,
    fragmentEnd: Map<LeftRight, Fragment>,
    fragment: Fragment,
  ): void {
    fragmentStart.delete(
      this.key(fragment.leftkgrams.from, fragment.rightkgrams.from),
    )
    fragmentEnd.delete(
      this.key(fragment.leftkgrams.to, fragment.rightkgrams.to),
    )
  }

  /**
   * Create a unique key for a left/right index pair.
   */
  private key(left: number, right: number): LeftRight {
    return `${left}|${right}`
  }
}
