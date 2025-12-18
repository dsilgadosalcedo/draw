import { describe, it, expect } from "bun:test"
import { cn } from "./utils"

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz")
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz")
  })

  it("should handle undefined and null", () => {
    expect(cn("foo", undefined, "bar", null, "baz")).toBe("foo bar baz")
  })

  it("should merge Tailwind classes correctly", () => {
    // Tailwind merge should resolve conflicts
    expect(cn("px-2 py-1", "px-4")).toContain("px-4")
    expect(cn("px-2 py-1", "px-4")).not.toContain("px-2")
  })

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
  })

  it("should handle objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz")
  })

  it("should handle mixed inputs", () => {
    expect(cn("foo", ["bar", "baz"], { qux: true, quux: false })).toBe(
      "foo bar baz qux"
    )
  })

  it("should handle empty inputs", () => {
    expect(cn()).toBe("")
    expect(cn("")).toBe("")
    expect(cn("", "")).toBe("")
  })
})
