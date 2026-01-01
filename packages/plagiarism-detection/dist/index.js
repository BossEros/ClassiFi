"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identifiable = exports.Range = exports.Region = exports.CodeTokenizer = exports.Tokenizer = exports.TokenHash = exports.RollingHash = exports.HashFilter = exports.WinnowFilter = exports.PairedOccurrence = exports.SharedFingerprint = exports.Fragment = exports.Pair = exports.FingerprintIndex = exports.TokenizedFile = exports.File = exports.createDefaultRegistry = exports.LanguageRegistry = exports.ProgrammingLanguage = exports.Options = exports.Report = exports.PlagiarismDetector = void 0;
// Main entry point
var dolos_js_1 = require("./dolos.js");
Object.defineProperty(exports, "PlagiarismDetector", { enumerable: true, get: function () { return dolos_js_1.PlagiarismDetector; } });
var report_js_1 = require("./report.js");
Object.defineProperty(exports, "Report", { enumerable: true, get: function () { return report_js_1.Report; } });
var options_js_1 = require("./options.js");
Object.defineProperty(exports, "Options", { enumerable: true, get: function () { return options_js_1.Options; } });
// Language support
var language_js_1 = require("./language.js");
Object.defineProperty(exports, "ProgrammingLanguage", { enumerable: true, get: function () { return language_js_1.ProgrammingLanguage; } });
Object.defineProperty(exports, "LanguageRegistry", { enumerable: true, get: function () { return language_js_1.LanguageRegistry; } });
Object.defineProperty(exports, "createDefaultRegistry", { enumerable: true, get: function () { return language_js_1.createDefaultRegistry; } });
// File classes
var file_js_1 = require("./file/file.js");
Object.defineProperty(exports, "File", { enumerable: true, get: function () { return file_js_1.File; } });
var tokenizedFile_js_1 = require("./file/tokenizedFile.js");
Object.defineProperty(exports, "TokenizedFile", { enumerable: true, get: function () { return tokenizedFile_js_1.TokenizedFile; } });
// Algorithm classes
var fingerprintIndex_js_1 = require("./algorithm/fingerprintIndex.js");
Object.defineProperty(exports, "FingerprintIndex", { enumerable: true, get: function () { return fingerprintIndex_js_1.FingerprintIndex; } });
var pair_js_1 = require("./algorithm/pair.js");
Object.defineProperty(exports, "Pair", { enumerable: true, get: function () { return pair_js_1.Pair; } });
var fragment_js_1 = require("./algorithm/fragment.js");
Object.defineProperty(exports, "Fragment", { enumerable: true, get: function () { return fragment_js_1.Fragment; } });
var sharedFingerprint_js_1 = require("./algorithm/sharedFingerprint.js");
Object.defineProperty(exports, "SharedFingerprint", { enumerable: true, get: function () { return sharedFingerprint_js_1.SharedFingerprint; } });
var pairedOccurrence_js_1 = require("./algorithm/pairedOccurrence.js");
Object.defineProperty(exports, "PairedOccurrence", { enumerable: true, get: function () { return pairedOccurrence_js_1.PairedOccurrence; } });
// Hashing classes
var winnowFilter_js_1 = require("./hashing/winnowFilter.js");
Object.defineProperty(exports, "WinnowFilter", { enumerable: true, get: function () { return winnowFilter_js_1.WinnowFilter; } });
var hashFilter_js_1 = require("./hashing/hashFilter.js");
Object.defineProperty(exports, "HashFilter", { enumerable: true, get: function () { return hashFilter_js_1.HashFilter; } });
var rollingHash_js_1 = require("./hashing/rollingHash.js");
Object.defineProperty(exports, "RollingHash", { enumerable: true, get: function () { return rollingHash_js_1.RollingHash; } });
var tokenHash_js_1 = require("./hashing/tokenHash.js");
Object.defineProperty(exports, "TokenHash", { enumerable: true, get: function () { return tokenHash_js_1.TokenHash; } });
// Tokenizer classes
var tokenizer_js_1 = require("./tokenizer/tokenizer.js");
Object.defineProperty(exports, "Tokenizer", { enumerable: true, get: function () { return tokenizer_js_1.Tokenizer; } });
var codeTokenizer_js_1 = require("./tokenizer/codeTokenizer.js");
Object.defineProperty(exports, "CodeTokenizer", { enumerable: true, get: function () { return codeTokenizer_js_1.CodeTokenizer; } });
// Utility classes
var region_js_1 = require("./util/region.js");
Object.defineProperty(exports, "Region", { enumerable: true, get: function () { return region_js_1.Region; } });
var range_js_1 = require("./util/range.js");
Object.defineProperty(exports, "Range", { enumerable: true, get: function () { return range_js_1.Range; } });
var identifiable_js_1 = require("./util/identifiable.js");
Object.defineProperty(exports, "Identifiable", { enumerable: true, get: function () { return identifiable_js_1.Identifiable; } });
//# sourceMappingURL=index.js.map