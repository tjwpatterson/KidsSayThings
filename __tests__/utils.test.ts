import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar")
    })

    it("should handle conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz")
    })

    it("should handle undefined values", () => {
      expect(cn("foo", undefined, "bar")).toBe("foo bar")
    })
  })
})



