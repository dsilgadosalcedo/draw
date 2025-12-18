import { describe, it, expect, beforeEach, mock, spyOn } from "bun:test"
import { render, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditableNameBadge } from "./editable-name-badge"
import * as convexReact from "convex/react"
import React from "react"

// Mock window.matchMedia for responsive classes
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mock((query: string) => ({
    matches: query.includes("(min-width: 1024px)"), // lg breakpoint
    media: query,
    onchange: null,
    addListener: mock(),
    removeListener: mock(),
    addEventListener: mock(),
    removeEventListener: mock(),
    dispatchEvent: mock()
  }))
})

// Mock Convex hooks
const mockUpdateName = mock(() => Promise.resolve(null))

// Spy on useMutation
const useMutationSpy = spyOn(convexReact, "useMutation").mockImplementation(
  () => mockUpdateName
)

describe("EditableNameBadge", () => {
  beforeEach(() => {
    mockUpdateName.mockClear()
    useMutationSpy.mockReturnValue(mockUpdateName)
    // Set viewport to large screen to show the component
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920
    })
  })

  it("should render with initial name", () => {
    const { container } = render(
      <EditableNameBadge drawingId="test-id" name="Test Drawing" />
    )
    const input = container.querySelector(
      'input[value="Test Drawing"]'
    ) as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input?.value).toBe("Test Drawing")
  })

  it("should show 'Untitled' when name is empty", () => {
    const { container } = render(
      <EditableNameBadge drawingId="test-id" name="" />
    )
    // Component is hidden on small screens (lg:flex), query directly from container
    const input = container.querySelector(
      'input[aria-label="Drawing name"]'
    ) as HTMLInputElement
    expect(input).toBeTruthy()
    // When name is empty string, the component logic shows "Untitled" as the value
    // The component uses: name.trim() || "Untitled" in the initial state
    // So empty string becomes "Untitled" value
    expect(input?.value).toBe("Untitled")
  })

  it("should be disabled when no drawingId", () => {
    const { container } = render(
      <EditableNameBadge drawingId={null} name="Test" />
    )
    const input = container.querySelector(
      'input[aria-label="Drawing name"]'
    ) as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input?.disabled).toBe(true)
  })

  it("should update name on blur", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <EditableNameBadge drawingId="test-id" name="Old Name" />
    )

    const input = container.querySelector(
      'input[aria-label="Drawing name"]'
    ) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "New Name")
    await user.tab() // Triggers blur

    await waitFor(() => {
      expect(mockUpdateName).toHaveBeenCalled()
    })
  })

  it("should debounce name updates", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <EditableNameBadge drawingId="test-id" name="Initial" />
    )

    const input = container.querySelector(
      'input[aria-label="Drawing name"]'
    ) as HTMLInputElement

    // Type a character
    await user.type(input, "N")

    // Should not call immediately
    expect(mockUpdateName).not.toHaveBeenCalled()

    // Wait for debounce (600ms + buffer)
    await waitFor(
      () => {
        expect(mockUpdateName).toHaveBeenCalled()
      },
      { timeout: 800 }
    )

    // Verify it was called with the correct value
    expect(mockUpdateName).toHaveBeenCalledWith({
      drawingId: "test-id",
      name: "InitialN"
    })
  })

  it("should save on Enter key", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <EditableNameBadge drawingId="test-id" name="Old" />
    )

    const input = container.querySelector(
      'input[aria-label="Drawing name"]'
    ) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "New{Enter}")

    await waitFor(() => {
      expect(mockUpdateName).toHaveBeenCalled()
    })
  })

  it("should handle theme prop", () => {
    const { container } = render(
      <EditableNameBadge drawingId="test-id" name="Test" theme="light" />
    )
    const input = container.querySelector('input[aria-label="Drawing name"]')
    // Theme affects text color class
    expect(input).toBeTruthy()
    expect(input).toHaveClass("text-[#1B1B1F]")
  })
})
