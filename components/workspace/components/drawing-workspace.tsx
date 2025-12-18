"use client"

import dynamic from "next/dynamic"
import { DrawingProvider } from "../../../context/drawing-context"
import Sidebar from "../../sidebar/components/sidebar"
import Connecting from "@/components/connecting"
import { useDrawingInitialization } from "../hooks/use-drawing-initialization"

// Dynamically import the Canvas component and disable SSR
const Canvas = dynamic(() => import("../../canvas/components/canvas"), {
  ssr: false,
  loading: () => <Connecting />
})

function WorkspaceContent() {
  useDrawingInitialization()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 w-full h-full">
        <Canvas />
      </main>
    </div>
  )
}

export function DrawingWorkspace() {
  return (
    <DrawingProvider>
      <WorkspaceContent />
    </DrawingProvider>
  )
}
