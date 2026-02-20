/**
 * Palette used for deterministic class color assignment.
 */
export const CLASS_COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#10B981", // Green
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EAB308", // Yellow
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#A855F7", // Violet
  "#84CC16", // Lime
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#0EA5E9", // Sky
  "#F472B6", // Light Pink
  "#FB923C", // Light Orange
] as const

/**
 * Generates a deterministic color for a class ID.
 *
 * @param classId - Class identifier.
 * @returns Hex color string.
 */
export function getClassColor(classId: number): string {
  const hash = (classId * 2654435761) % CLASS_COLOR_PALETTE.length
  const paletteIndex = Math.abs(hash)

  return CLASS_COLOR_PALETTE[paletteIndex]
}
