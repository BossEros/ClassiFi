import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import { generateUniqueClassCode } from "../../src/modules/classes/class-code.util.js"

const { uuidMock } = vi.hoisted(() => ({
  uuidMock: vi.fn(),
}))

vi.mock("uuid", () => ({
  v4: uuidMock,
}))

describe("generateUniqueClassCode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns uppercase 8-character code when first candidate is unique", async () => {
    uuidMock.mockReturnValue("abcd1234-9999-0000-1111-222233334444")

    const classRepository = {
      checkClassCodeExists: vi.fn().mockResolvedValue(false),
    } as unknown as ClassRepository

    const code = await generateUniqueClassCode(classRepository)

    expect(code).toBe("ABCD1234")
    expect(classRepository.checkClassCodeExists).toHaveBeenCalledWith("ABCD1234")
    expect(classRepository.checkClassCodeExists).toHaveBeenCalledTimes(1)
  })

  it("retries when generated code already exists", async () => {
    uuidMock
      .mockReturnValueOnce("duplicate-aaaa-bbbb-cccc-ddddeeeeffff")
      .mockReturnValueOnce("unique222-aaaa-bbbb-cccc-ddddeeeeffff")

    const classRepository = {
      checkClassCodeExists: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    } as unknown as ClassRepository

    const code = await generateUniqueClassCode(classRepository)

    expect(code).toBe("UNIQUE22")
    expect(classRepository.checkClassCodeExists).toHaveBeenNthCalledWith(1, "DUPLICAT")
    expect(classRepository.checkClassCodeExists).toHaveBeenNthCalledWith(2, "UNIQUE22")
    expect(classRepository.checkClassCodeExists).toHaveBeenCalledTimes(2)
  })
})
