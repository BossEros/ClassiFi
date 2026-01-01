# Plagiarism Detection Library

A TypeScript library for detecting source code plagiarism using the Winnow fingerprinting algorithm (same algorithm used by Stanford's MOSS).

## Supported Languages

- **Java** (`.java`)
- **Python** (`.py`)
- **C** (`.c`, `.h`)

## Installation

```bash
npm install
```

## Quick Start

```typescript
import { PlagiarismDetector, File } from './src/index.js';

// Create detector
const detector = new PlagiarismDetector({
  language: 'java',
  kgramLength: 25,      // Size of token sequences to compare
  kgramsInWindow: 40,   // Winnow window size
});

// Create files from source code
const files = [
  new File('student1/Solution.java', sourceCode1),
  new File('student2/Solution.java', sourceCode2),
];

// Analyze
const report = await detector.analyze(files);

// Get suspicious pairs (> 50% similarity)
for (const pair of report.getSuspiciousPairs(0.5)) {
  console.log(`${pair.leftFile.filename} <-> ${pair.rightFile.filename}`);
  console.log(`Similarity: ${(pair.similarity * 100).toFixed(1)}%`);
  
  // Get matching code fragments
  const fragments = report.getFragments(pair);
  for (const frag of fragments) {
    console.log(`Match: lines ${frag.leftSelection.startRow+1}-${frag.leftSelection.endRow+1}`);
  }
}
```

## How It Works

### 1. Tokenization
Source code is parsed into Abstract Syntax Tree (AST) tokens using tree-sitter. This normalizes the code so variable renaming and formatting changes don't affect detection.

```javascript
// "function add(a, b) { return a + b; }" becomes:
// ( program ( function_declaration ( identifier ) ( parameters ... ) ( block ... ) ) )
```

### 2. Fingerprinting (Winnow Algorithm)
K-grams (sequences of tokens) are hashed and the Winnow algorithm selects representative "fingerprints":
- Guarantees at least one fingerprint per window
- Reduces total fingerprints while maintaining detection quality
- Based on: http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf

### 3. Comparison
Files sharing fingerprints are compared:
- **Similarity Score**: `(covered_left + covered_right) / total_tokens`
- **Fragments**: Consecutive matching k-grams are merged into fragments
- **Longest Match**: Length of longest common subsequence

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `language` | auto-detect | `'java'`, `'python'`, or `'c'` |
| `kgramLength` | 25 | Number of tokens per k-gram |
| `kgramsInWindow` | 40 | Winnow window size |
| `maxFingerprintPercentage` | null | Ignore common fingerprints |
| `includeComments` | false | Include comments in analysis |

## API Reference

### PlagiarismDetector

```typescript
const detector = new PlagiarismDetector(options);
const report = await detector.analyze(files);
```

### Report

```typescript
report.getPairs()              // All pairs sorted by similarity
report.getSuspiciousPairs(0.5) // Pairs with similarity >= 50%
report.getFragments(pair)      // Matching code regions
report.getSummary()            // Statistics
```

### Pair

```typescript
pair.similarity     // 0-1 score
pair.leftFile       // First file
pair.rightFile      // Second file
pair.longest        // Longest matching fragment length
pair.overlap        // Total overlapping k-grams
```

### Fragment

```typescript
fragment.leftSelection   // Region in left file (startRow, startCol, endRow, endCol)
fragment.rightSelection  // Region in right file
fragment.pairs           // Individual k-gram matches
```

## Project Structure

```
src/
├── dolos.ts              # Main PlagiarismDetector class
├── report.ts             # Analysis results
├── options.ts            # Configuration
├── language.ts           # Language definitions
├── algorithm/
│   ├── fingerprintIndex.ts   # Main comparison engine
│   ├── pair.ts               # File pair comparison
│   ├── fragment.ts           # Matching code region
│   └── sharedFingerprint.ts  # Shared hash tracking
├── hashing/
│   ├── winnowFilter.ts   # Winnow algorithm
│   ├── rollingHash.ts    # Rabin-Karp hash
│   └── tokenHash.ts      # Token hashing
├── tokenizer/
│   ├── tokenizer.ts      # Base tokenizer
│   └── codeTokenizer.ts  # Tree-sitter tokenizer
├── file/
│   ├── file.ts           # Source file
│   └── tokenizedFile.ts  # Tokenized file
└── util/
    ├── region.ts         # Line/column selection
    ├── range.ts          # Numeric range
    └── identifiable.ts   # ID generation
```

## License

Based on the Dolos project (MIT License).
