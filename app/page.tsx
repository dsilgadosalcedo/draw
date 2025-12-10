"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { useEffect } from "react"
import dynamic from "next/dynamic"
import { DrawingProvider, useDrawing } from "../context/DrawingContext"
import Sidebar from "../components/Sidebar"
import Connecting from "@/components/Connecting"

// 1. Dynamically import the Canvas component and disable SSR
const Canvas = dynamic(() => import("../components/Canvas"), {
  ssr: false,
  loading: () => <Connecting />
})

// --- Core Drawing Workspace Component ---
function DrawingWorkspace() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const { currentDrawingId, setCurrentDrawingId } = useDrawing()

  // Query the latest ID only once upon initial load
  const latestDrawingId = useQuery(api.drawings.getLatest)

  // --- Effect to set initial drawing ID ---
  useEffect(() => {
    // Run only if authenticated, latest ID is known, and no current ID is set in Context
    if (
      !authLoading &&
      isAuthenticated &&
      latestDrawingId !== undefined &&
      !currentDrawingId
    ) {
      if (latestDrawingId) {
        // Found previous work -> Load it
        setCurrentDrawingId(latestDrawingId)
      } else {
        // No previous work -> Create new ID and set it (Canvas will auto-insert on save)
        const newId = crypto.randomUUID()
        setCurrentDrawingId(newId)
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    latestDrawingId,
    currentDrawingId,
    setCurrentDrawingId
  ])

  // --- RENDER LOGIC ---

  // 1. Initial Load/Auth Check
  if (authLoading) {
    return <Connecting />
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return null
  }

  // 3. Fully Loaded Workspace
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 w-full h-full">
        <Canvas />
      </main>
    </div>
  )
}

// --- Main Export: Wrap everything in the DrawingProvider ---
export default function Home() {
  return (
    <DrawingProvider>
      <DrawingWorkspace />
    </DrawingProvider>
  )
}
