import { describe, it, expect } from "vitest"
import { getMonacoLanguage } from "./monacoUtils"

describe("getMonacoLanguage", () => {
  it("should map C language correctly", () => {
    expect(getMonacoLanguage("c")).toBe("c")
    expect(getMonacoLanguage("C")).toBe("c")
  })

  it("should map C++ language correctly", () => {
    expect(getMonacoLanguage("cpp")).toBe("cpp")
    expect(getMonacoLanguage("CPP")).toBe("cpp")
    expect(getMonacoLanguage("c++")).toBe("cpp")
    expect(getMonacoLanguage("C++")).toBe("cpp")
  })

  it("should map Python language correctly", () => {
    expect(getMonacoLanguage("python")).toBe("python")
    expect(getMonacoLanguage("Python")).toBe("python")
    expect(getMonacoLanguage("py")).toBe("python")
    expect(getMonacoLanguage("PY")).toBe("python")
  })

  it("should map Java language correctly", () => {
    expect(getMonacoLanguage("java")).toBe("java")
    expect(getMonacoLanguage("Java")).toBe("java")
    expect(getMonacoLanguage("JAVA")).toBe("java")
  })

  it("should map JavaScript language correctly", () => {
    expect(getMonacoLanguage("javascript")).toBe("javascript")
    expect(getMonacoLanguage("JavaScript")).toBe("javascript")
    expect(getMonacoLanguage("js")).toBe("javascript")
    expect(getMonacoLanguage("JS")).toBe("javascript")
  })

  it("should map TypeScript language correctly", () => {
    expect(getMonacoLanguage("typescript")).toBe("typescript")
    expect(getMonacoLanguage("TypeScript")).toBe("typescript")
    expect(getMonacoLanguage("ts")).toBe("typescript")
    expect(getMonacoLanguage("TS")).toBe("typescript")
  })

  it("should return plaintext for unknown languages", () => {
    expect(getMonacoLanguage("unknown")).toBe("plaintext")
    expect(getMonacoLanguage("ruby")).toBe("plaintext")
    expect(getMonacoLanguage("")).toBe("plaintext")
  })
})
