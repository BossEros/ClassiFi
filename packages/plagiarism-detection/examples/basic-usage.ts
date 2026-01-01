/**
 * Example: Basic Usage of Plagiarism Detection Library
 * 
 * This example demonstrates how to:
 * 1. Create a detector with options
 * 2. Analyze source files for plagiarism
 * 3. Get similarity scores and fragments
 * 
 * Run with: npx ts-node examples/basic-usage.ts
 */

import { PlagiarismDetector, File, Report, Pair, Fragment } from "../src/index.js";

// Sample Java source files for testing
const sampleFiles = new Map<string, string>([
    ["student1/Solution.java", `
public class Solution {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        int result = 0;
        for (int i = 0; i < b; i++) {
            result = add(result, a);
        }
        return result;
    }
    
    public static void main(String[] args) {
        System.out.println(add(3, 5));
        System.out.println(multiply(4, 6));
    }
}
`],
    ["student2/Solution.java", `
public class Solution {
    // This student copied and slightly modified
    public static int add(int x, int y) {
        return x + y;
    }
    
    public static int multiply(int x, int y) {
        int result = 0;
        for (int i = 0; i < y; i++) {
            result = add(result, x);
        }
        return result;
    }
    
    public static void main(String[] args) {
        System.out.println(add(3, 5));
        System.out.println(multiply(4, 6));
    }
}
`],
    ["student3/Solution.java", `
public class Solution {
    // This student wrote their own solution
    public static int sum(int first, int second) {
        return first + second;
    }
    
    public static int product(int first, int second) {
        return first * second;
    }
    
    public static void main(String[] args) {
        int a = 3, b = 5;
        System.out.println("Sum: " + sum(a, b));
        System.out.println("Product: " + product(a, b));
    }
}
`]
]);

async function main() {
    console.log("=== Plagiarism Detection Example ===\n");

    // Create detector with options
    const detector = new PlagiarismDetector({
        language: "java",
        kgramLength: 20,      // Smaller k-grams for demo
        kgramsInWindow: 30,   // Smaller window for more fingerprints
    });

    // Convert sample files to File objects
    const files: File[] = [];
    for (const [path, content] of sampleFiles) {
        files.push(new File(path, content));
    }

    console.log(`Analyzing ${files.length} files...\n`);

    try {
        // Run analysis
        const report: Report = await detector.analyzeStrings(sampleFiles);

        // Print summary
        const summary = report.getSummary();
        console.log("=== Analysis Summary ===");
        console.log(`Total files: ${summary.totalFiles}`);
        console.log(`Total pairs: ${summary.totalPairs}`);
        console.log(`Language: ${summary.language}`);
        console.log(`Average similarity: ${(summary.averageSimilarity * 100).toFixed(1)}%`);
        console.log(`Max similarity: ${(summary.maxSimilarity * 100).toFixed(1)}%`);

        if (summary.warnings.length > 0) {
            console.log("\nWarnings:");
            for (const warning of summary.warnings) {
                console.log(`  - ${warning}`);
            }
        }

        // Print all pairs sorted by similarity
        console.log("\n=== All Pairs (sorted by similarity) ===");
        const pairs = report.getPairs();
        for (const pair of pairs) {
            console.log(
                `${pair.leftFile.filename} <-> ${pair.rightFile.filename}: ` +
                `${(pair.similarity * 100).toFixed(1)}% similar`
            );
        }

        // Print suspicious pairs (> 50% similarity)
        console.log("\n=== Suspicious Pairs (> 50% similarity) ===");
        const suspicious = report.getSuspiciousPairs(0.5);
        if (suspicious.length === 0) {
            console.log("No suspicious pairs found.");
        } else {
            for (const pair of suspicious) {
                console.log(`\n--- ${pair.leftFile.filename} <-> ${pair.rightFile.filename} ---`);
                console.log(`Similarity: ${(pair.similarity * 100).toFixed(1)}%`);
                console.log(`Longest matching fragment: ${pair.longest} k-grams`);

                // Get and print fragments
                const fragments = report.getFragments(pair);
                console.log(`Number of matching fragments: ${fragments.length}`);

                for (let i = 0; i < Math.min(3, fragments.length); i++) {
                    const fragment = fragments[i];
                    console.log(`  Fragment ${i + 1}:`);
                    console.log(`    Left:  lines ${fragment.leftSelection.startRow + 1}-${fragment.leftSelection.endRow + 1}`);
                    console.log(`    Right: lines ${fragment.rightSelection.startRow + 1}-${fragment.rightSelection.endRow + 1}`);
                }
            }
        }

    } catch (error) {
        console.error("Analysis failed:", error);
    }
}

main().catch(console.error);
