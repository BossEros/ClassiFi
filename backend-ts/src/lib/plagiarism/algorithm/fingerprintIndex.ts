import { HashFilter } from "@/lib/plagiarism/hashing/hashFilter.js"
import { Range } from "@/lib/plagiarism/util/range.js"
import { Region } from "@/lib/plagiarism/util/region.js"
import { WinnowFilter } from "@/lib/plagiarism/hashing/winnowFilter.js"
import { TokenizedFile } from "@/lib/plagiarism/file/tokenizedFile.js"
import {
  SharedFingerprint,
  Occurrence,
} from "@/lib/plagiarism/algorithm/sharedFingerprint.js"
import { Pair } from "@/lib/plagiarism/algorithm/pair.js"
import { FileEntry } from "@/lib/plagiarism/algorithm/types.js"
import { assert, assertDefined } from "@/lib/plagiarism/util/utils.js"

export type Hash = number

/**
 * The FingerprintIndex is the main comparison engine.
 *
 * It:
 * 1. Generates fingerprints from tokenized files using the Winnow algorithm
 * 2. Builds an inverted index mapping fingerprint hashes to files
 * 3. Identifies shared fingerprints between files
 * 4. Can generate Pairs for comparison between any two files
 */
export class FingerprintIndex {
  /** The hash filter (Winnow algorithm) */
  private readonly hashFilter: HashFilter

  /** Map of file ID to FileEntry */
  private readonly files: Map<number, FileEntry>

  /** Map of ignored files (template/boilerplate) */
  private readonly ignoredFiles: Map<number, FileEntry>

  /** The main index: hash -> SharedFingerprint */
  private readonly index: Map<Hash, SharedFingerprint>

  /** Manually ignored hashes */
  private readonly ignoredHashes: Set<number>

  /**
   * Create a new FingerprintIndex.
   *
   * @param kgramLength Length of each k-gram (number of tokens)
   * @param kgramsInWindow Window size for Winnow algorithm
   * @param kgramData Whether to store the actual token data
   * @param maxFingerprintFileCount Ignore fingerprints appearing in more files
   */
  constructor(
    private readonly kgramLength: number,
    private readonly kgramsInWindow: number,
    kgramData?: boolean,
    private maxFingerprintFileCount = Number.MAX_SAFE_INTEGER,
  ) {
    this.hashFilter = new WinnowFilter(
      this.kgramLength,
      this.kgramsInWindow,
      kgramData,
    )
    this.files = new Map<number, FileEntry>()
    this.ignoredFiles = new Map<number, FileEntry>()
    this.index = new Map<Hash, SharedFingerprint>()
    this.ignoredHashes = new Set<number>()
  }

  /**
   * Add files to be analyzed.
   */
  public addFiles(
    tokenizedFiles: TokenizedFile[],
  ): Map<Hash, SharedFingerprint> {
    for (const f of tokenizedFiles) {
      assert(!this.files.has(f.id), `File already analyzed: ${f.path}`)
    }

    for (const file of tokenizedFiles) {
      const entry: FileEntry = {
        file,
        kgrams: [],
        isIgnored: false,
        shared: new Set<SharedFingerprint>(),
        ignored: new Set<SharedFingerprint>(),
        ignoredKgramIndices: new Set<number>(),
      }

      this.files.set(file.id, entry)
      this.addEntry(entry)
    }

    return this.index
  }

  /**
   * Add a file that should be ignored (template/boilerplate code).
   * Any fingerprints from this file will be marked as ignored.
   */
  public addIgnoredFile(file: TokenizedFile): void {
    assert(
      !this.ignoredFiles.has(file.id),
      `File already ignored: ${file.path}`,
    )

    const entry: FileEntry = {
      file,
      kgrams: [],
      isIgnored: true,
      shared: new Set<SharedFingerprint>(),
      ignored: new Set<SharedFingerprint>(),
      ignoredKgramIndices: new Set<number>(),
    }

    this.ignoredFiles.set(file.id, entry)
    this.addEntry(entry)
  }

  /**
   * Process a file entry and add its fingerprints to the index.
   */
  private addEntry(entry: FileEntry): void {
    const file = entry.file
    let kgram = 0

    // STEP 1: Run the Winnow algorithm over this file's token array.
    // It slides a window across the tokens, hashes every k-gram, and picks
    // the minimum hash in each window — those are the file's fingerprints.
    for (const { data, hash, start, stop } of this.hashFilter.fingerprints(
      file.tokens,
    )) {
      // STEP 2: Record which token range (start → stop) this fingerprint covers.
      // Used later to highlight the matching region in the source file.
      entry.kgrams.push(new Range(start, stop))

      // Sanity check: token positions must be in source order.
      assert(
        Region.isInOrder(file.mapping[start], file.mapping[stop]) ||
          file.tokens[stop] === ")",
        `Invalid ordering in ${file.path}`,
      )

      // STEP 3: Convert the token range to an actual source location (row/col).
      const location = Region.merge(file.mapping[start], file.mapping[stop])

      // STEP 4: Build an Occurrence — records which file and where in it this fingerprint appears.
      const part: Occurrence = {
        file,
        side: { index: kgram, start, stop, data, location },
      }

      // STEP 5: Look up this hash in the inverted index.
      // If it's new, create a SharedFingerprint entry for it.
      // If it already exists (seen in another file), add this occurrence to it — that's a match.
      let shared: SharedFingerprint | undefined = this.index.get(hash)
      if (!shared) {
        shared = new SharedFingerprint(hash, data)
        this.index.set(hash, shared)
      }

      shared.add(part)

      // STEP 6: Reconcile the fingerprint state. This keeps shared/ignored sets and
      // ignored k-gram bookkeeping aligned after every new occurrence.
      this.syncSharedFingerprintIgnoreState(shared)

      kgram += 1
    }
  }

  /**
   * Returns whether a shared fingerprint should currently be suppressed.
   */
  private shouldIgnoreSharedFingerprint(shared: SharedFingerprint): boolean {
    if (this.ignoredHashes.has(shared.hash)) {
      return true
    }

    if (shared.fileCount() > this.maxFingerprintFileCount) {
      return true
    }

    return shared.files().some((file) => this.ignoredFiles.has(file.id))
  }

  /**
   * Synchronize ignored/shared bookkeeping for a fingerprint after rules or occurrences change.
   */
  private syncSharedFingerprintIgnoreState(shared: SharedFingerprint): void {
    if (this.shouldIgnoreSharedFingerprint(shared)) {
      this.applyIgnoredSharedFingerprint(shared)
      return
    }

    this.applyActiveSharedFingerprint(shared)
  }

  /**
   * Marks a fingerprint as ignored and records its ignored k-gram positions per file.
   */
  private applyIgnoredSharedFingerprint(shared: SharedFingerprint): void {
    shared.ignored = true

    for (const file of shared.files()) {
      const trackedFileEntry = this.getTrackedFileEntry(file)
      trackedFileEntry.shared.delete(shared)
      trackedFileEntry.ignored.add(shared)

      for (const occurrence of shared.occurrencesOf(file)) {
        trackedFileEntry.ignoredKgramIndices.add(occurrence.side.index)
      }
    }
  }

  /**
   * Restores a fingerprint to the active shared set and clears its ignored k-gram bookkeeping.
   */
  private applyActiveSharedFingerprint(shared: SharedFingerprint): void {
    shared.ignored = false

    for (const file of shared.files()) {
      const trackedFileEntry = this.getTrackedFileEntry(file)
      trackedFileEntry.ignored.delete(shared)

      for (const occurrence of shared.occurrencesOf(file)) {
        trackedFileEntry.ignoredKgramIndices.delete(occurrence.side.index)
      }

      if (!trackedFileEntry.isIgnored) {
        trackedFileEntry.shared.add(shared)
      }
    }
  }

  /**
   * Resolve a tracked file entry regardless of whether it is analyzable or ignored boilerplate.
   */
  private getTrackedFileEntry(file: TokenizedFile): FileEntry {
    const trackedFileEntry =
      this.files.get(file.id) || this.ignoredFiles.get(file.id)
    assertDefined(trackedFileEntry, `File not found in index: ${file.path}`)

    return trackedFileEntry
  }

  /**
   * Manually add hashes to ignore (e.g., common patterns).
   */
  public addIgnoredHashes(hashes: Array<Hash>): void {
    for (const hash of hashes) {
      this.ignoredHashes.add(hash)
      const shared = this.index.get(hash)
      if (shared) {
        this.syncSharedFingerprintIgnoreState(shared)
      }
    }
  }

  /**
   * Update the max fingerprint file count threshold.
   */
  public updateMaxFingerprintFileCount(
    maxFingerprintFileCount: number | undefined,
  ): void {
    if (maxFingerprintFileCount === this.maxFingerprintFileCount) return

    this.maxFingerprintFileCount =
      maxFingerprintFileCount || Number.MAX_SAFE_INTEGER

    for (const shared of this.index.values()) {
      this.syncSharedFingerprintIgnoreState(shared)
    }
  }

  /**
   * Get all shared fingerprints.
   */
  public sharedFingerprints(): Array<SharedFingerprint> {
    return Array.from(this.index.values())
  }

  /**
   * Get all file entries.
   */
  public entries(): Array<FileEntry> {
    return Array.from(this.files.values())
  }

  /**
   * Get all ignored file entries.
   */
  public ignoredEntries(): Array<FileEntry> {
    return Array.from(this.ignoredFiles.values())
  }

  /**
   * Get a Pair for comparing two specific files.
   */
  public getPair(file1: TokenizedFile, file2: TokenizedFile): Pair {
    const entry1 = this.files.get(file1.id)
    const entry2 = this.files.get(file2.id)
    assertDefined(entry1, `File not found in index: ${file1.path}`)
    assertDefined(entry2, `File not found in index: ${file2.path}`)
    return new Pair(entry1, entry2)
  }

  /**
   * Get all pairs of files, optionally sorted.
   */
  public allPairs(sortBy?: string): Array<Pair> {
    const pairs: Pair[] = []
    const entries = Array.from(this.files.values())

    // Generate all unique pairs
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        pairs.push(new Pair(entries[i], entries[j]))
      }
    }

    // Sort if requested
    if (sortBy) {
      type SortFn = (a: Pair, b: Pair) => number
      const sortOptions: Record<string, SortFn> = {
        "total overlap": (a, b) => b.overlap - a.overlap,
        "longest fragment": (a, b) => b.longest - a.longest,
        similarity: (a, b) => b.similarity - a.similarity,
      }

      const sortFn =
        sortOptions[sortBy.toLowerCase()] || sortOptions["similarity"]
      pairs.sort(sortFn)
    }

    return pairs
  }
}
