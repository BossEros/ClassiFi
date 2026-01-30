import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card"

describe("Card", () => {
  describe("Card Component", () => {
    it("renders children", () => {
      render(<Card>Card Content</Card>)
      expect(screen.getByText("Card Content")).toBeInTheDocument()
    })

    it("applies default styling", () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId("card")
      expect(card).toHaveClass("rounded-xl")
      expect(card).toHaveClass("border")
      expect(card).toHaveClass("backdrop-blur-md")
    })

    it("applies custom className", () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>,
      )
      expect(screen.getByTestId("card")).toHaveClass("custom-class")
    })

    describe("Variants", () => {
      it("applies default variant styles", () => {
        render(
          <Card variant="default" data-testid="card">
            Content
          </Card>,
        )
        const card = screen.getByTestId("card")
        expect(card).not.toHaveClass("cursor-pointer")
      })

      it("applies hover variant styles", () => {
        render(
          <Card variant="hover" data-testid="card">
            Content
          </Card>,
        )
        const card = screen.getByTestId("card")
        expect(card.className).toContain("hover:bg-white/12")
      })

      it("applies interactive variant styles", () => {
        render(
          <Card variant="interactive" data-testid="card">
            Content
          </Card>,
        )
        const card = screen.getByTestId("card")
        expect(card).toHaveClass("cursor-pointer")
      })
    })

    it("forwards ref", () => {
      const ref = vi.fn()
      render(<Card ref={ref}>Content</Card>)
      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe("CardHeader", () => {
    it("renders children", () => {
      render(<CardHeader>Header Content</CardHeader>)
      expect(screen.getByText("Header Content")).toBeInTheDocument()
    })

    it("applies default styling", () => {
      render(<CardHeader data-testid="header">Content</CardHeader>)
      expect(screen.getByTestId("header")).toHaveClass("p-6")
    })

    it("applies custom className", () => {
      render(
        <CardHeader className="custom" data-testid="header">
          Content
        </CardHeader>,
      )
      expect(screen.getByTestId("header")).toHaveClass("custom")
    })

    it("forwards ref", () => {
      const ref = vi.fn()
      render(<CardHeader ref={ref}>Content</CardHeader>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe("CardTitle", () => {
    it("renders as h3", () => {
      render(<CardTitle>Title</CardTitle>)
      expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument()
    })

    it("renders children", () => {
      render(<CardTitle>My Title</CardTitle>)
      expect(screen.getByText("My Title")).toBeInTheDocument()
    })

    it("applies text styling", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      expect(screen.getByTestId("title")).toHaveClass("font-semibold")
    })

    it("forwards ref", () => {
      const ref = vi.fn()
      render(<CardTitle ref={ref}>Title</CardTitle>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe("CardDescription", () => {
    it("renders children", () => {
      render(<CardDescription>Description text</CardDescription>)
      expect(screen.getByText("Description text")).toBeInTheDocument()
    })

    it("applies text styling", () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>)
      expect(screen.getByTestId("desc")).toHaveClass("text-slate-300")
    })

    it("forwards ref", () => {
      const ref = vi.fn()
      render(<CardDescription ref={ref}>Description</CardDescription>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe("CardContent", () => {
    it("renders children", () => {
      render(<CardContent>Content here</CardContent>)
      expect(screen.getByText("Content here")).toBeInTheDocument()
    })

    it("applies padding", () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      expect(screen.getByTestId("content")).toHaveClass("px-6")
    })

    it("forwards ref", () => {
      const ref = vi.fn()
      render(<CardContent ref={ref}>Content</CardContent>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe("CardFooter", () => {
    it("renders children", () => {
      render(<CardFooter>Footer content</CardFooter>)
      expect(screen.getByText("Footer content")).toBeInTheDocument()
    })

    it("applies flex layout", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      expect(screen.getByTestId("footer")).toHaveClass("flex")
    })

    it("forwards ref", () => {
      const ref = vi.fn()
      render(<CardFooter ref={ref}>Footer</CardFooter>)
      expect(ref).toHaveBeenCalled()
    })
  })

  describe("Full Card Composition", () => {
    it("renders complete card structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>A test description</CardDescription>
          </CardHeader>
          <CardContent>Main content goes here</CardContent>
          <CardFooter>Footer actions</CardFooter>
        </Card>,
      )

      expect(screen.getByText("Test Card")).toBeInTheDocument()
      expect(screen.getByText("A test description")).toBeInTheDocument()
      expect(screen.getByText("Main content goes here")).toBeInTheDocument()
      expect(screen.getByText("Footer actions")).toBeInTheDocument()
    })
  })
})
