import { render } from "@testing-library/react"
import { LanguageIcon } from "./LanguageIcon"
import { describe, it, expect } from "vitest"

describe("LanguageIcon", () => {
  it("renders python icon", () => {
    const { container } = render(<LanguageIcon language="python" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("renders java icon", () => {
    const { container } = render(<LanguageIcon language="java" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("renders c icon", () => {
    const { container } = render(<LanguageIcon language="c" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("renders pdf icon", () => {
    const { container } = render(<LanguageIcon language="pdf" />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <LanguageIcon language="python" className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("applies correct color for each language", () => {
    const { container, rerender } = render(<LanguageIcon language="python" />)
    expect(container.querySelector(".text-blue-400")).toBeInTheDocument()

    rerender(<LanguageIcon language="java" />)
    expect(container.querySelector(".text-orange-400")).toBeInTheDocument()
  })
})
