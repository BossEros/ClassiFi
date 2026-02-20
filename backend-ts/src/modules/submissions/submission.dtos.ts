/** DTO for file upload in SubmissionService.submitAssignment */
export interface SubmissionFileDTO {
  filename: string
  data: Buffer
  mimetype: string
}
