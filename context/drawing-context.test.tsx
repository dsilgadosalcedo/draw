import { describe, it, expect } from "bun:test"
import { render, screen } from "@testing-library/react"
import { DrawingProvider, useDrawing } from "./drawing-context"

// Test component that uses the hook
function TestComponent() {
  const { currentDrawingId, setCurrentDrawingId } = useDrawing()
  return (
    <div>
      <div data-testid="drawing-id">{currentDrawingId ?? "null"}</div>
      <button
        onClick={() => setCurrentDrawingId("test-id")}
        data-testid="set-button"
      >
        Set ID
      </button>
    </div>
  )
}

describe("DrawingContext", () => {
  it("should provide default values", () => {
    render(
      <DrawingProvider>
        <TestComponent />
      </DrawingProvider>
    )

    const drawingId = screen.getByTestId("drawing-id")
    expect(drawingId).toHaveTextContent("null")
  })

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useDrawing must be used within a DrawingProvider")

    console.error = originalError
  })

  it("should update drawing ID", async () => {
    const userEvent = (await import("@testing-library/user-event")).default

    render(
      <DrawingProvider>
        <TestComponent />
      </DrawingProvider>
    )

    const button = screen.getByTestId("set-button")
    const user = userEvent.setup()
    await user.click(button)

    const drawingId = screen.getByTestId("drawing-id")
    expect(drawingId).toHaveTextContent("test-id")
  })
})
