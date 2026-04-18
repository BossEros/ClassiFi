import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PairComparison } from "@/presentation/components/teacher/plagiarism/PairComparison"
import type { FilePair } from "@/presentation/components/teacher/plagiarism/types"

vi.mock("@/presentation/components/teacher/plagiarism/PairCodeEditor", () => ({
  PairCodeEditor: ({ side }: { side: "left" | "right" }) => (
    <div>{side === "left" ? "Left editor" : "Right editor"}</div>
  ),
}))

const pairFixture: FilePair = {
  id: 101,
  leftFile: {
    id: 11,
    path: "left/Main.java",
    filename: "Main.java",
    content: "class Main {}",
    lineCount: 1,
    studentName: "Student A",
    submittedAt: "2026-04-18T08:00:00.000Z",
  },
  rightFile: {
    id: 12,
    path: "right/Main.java",
    filename: "Main.java",
    content: "class Main {}",
    lineCount: 1,
    studentName: "Student B",
    submittedAt: "2026-04-18T09:00:00.000Z",
  },
  similarity: 0.91,
  overlap: 41,
  longest: 32,
  fragments: [
    {
      id: 1,
      leftSelection: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 10, endCol: 5 },
      length: 32,
    },
    {
      id: 2,
      leftSelection: { startRow: 12, startCol: 0, endRow: 20, endCol: 5 },
      rightSelection: { startRow: 12, startCol: 0, endRow: 20, endCol: 5 },
      length: 9,
    },
  ],
}

describe("PairComparison", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it("shows fragment navigation without the structural fingerprint count", async () => {
    render(<PairComparison pair={pairFixture} variant="light" />)

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Next fragment" }))

    expect(
      screen.getByText((_, element) => {
        if (element?.tagName !== "SPAN") {
          return false
        }

        return element.textContent === "Fragment 1 / 2"
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByText(/structural fingerprint/i),
    ).not.toBeInTheDocument()
  })
})
