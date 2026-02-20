import { injectable } from "tsyringe"
import { PlagiarismDetector, LanguageName } from "@/lib/plagiarism/index.js"
import { PLAGIARISM_CONFIG } from "@/modules/plagiarism/plagiarism.mapper.js"

export interface PlagiarismDetectorConfig {
  language: LanguageName
  kgramLength?: number
  kgramsInWindow?: number
}

@injectable()
export class PlagiarismDetectorFactory {
  create(config: PlagiarismDetectorConfig): PlagiarismDetector {
    return new PlagiarismDetector({
      language: config.language,
      kgramLength: config.kgramLength ?? PLAGIARISM_CONFIG.DEFAULT_KGRAM_LENGTH,
      kgramsInWindow:
        config.kgramsInWindow ?? PLAGIARISM_CONFIG.DEFAULT_KGRAMS_IN_WINDOW,
    })
  }
}
