import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { TeacherFeedbackCard } from "@/presentation/components/shared/assignmentDetail/TeacherFeedbackCard"

vi.mock("@/business/services/assignmentService", () => ({
  saveSubmissionFeedback: vi.fn(),
}))

vi.mock("@/shared/store/useToastStore", () => ({
  useToastStore: (selector: (state: { showToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ showToast: vi.fn() }),
}))

describe("TeacherFeedbackCard", () => {
  it("syncs textarea value when initialFeedback prop changes", async () => {
    const onFeedbackSaved = vi.fn()

    const { rerender } = render(
      <TeacherFeedbackCard
        submissionId={1}
        initialFeedback="Initial comment"
        feedbackGivenAt={null}
        onFeedbackSaved={onFeedbackSaved}
      />,
    )

    const feedbackTextarea = screen.getByPlaceholderText(
      "Add your feedback for this submission...",
    )
    expect(feedbackTextarea).toHaveValue("Initial comment")

    rerender(
      <TeacherFeedbackCard
        submissionId={2}
        initialFeedback="Updated comment"
        feedbackGivenAt={null}
        onFeedbackSaved={onFeedbackSaved}
      />,
    )

    await waitFor(() => {
      expect(feedbackTextarea).toHaveValue("Updated comment")
    })
  })
})
