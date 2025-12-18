import { BinaryFiles } from "@excalidraw/excalidraw/types"

// Valid Excalidraw image mime types
const VALID_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/x-icon",
  "image/avif",
  "image/jfif"
] as const

// Helper function to load files from URLs
export async function loadFiles(
  fileUrls: Record<string, string> | undefined
): Promise<BinaryFiles | undefined> {
  if (!fileUrls || Object.keys(fileUrls).length === 0) {
    return undefined
  }

  const loadedFiles: BinaryFiles = {} as BinaryFiles
  for (const [fileId, url] of Object.entries(fileUrls)) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const dataURL = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      // Map blob type to valid Excalidraw mime type
      let mimeType: string = blob.type || "image/png"
      // Normalize jpg to jpeg
      if (mimeType === "image/jpg") {
        mimeType = "image/jpeg"
      }
      if (
        !VALID_IMAGE_TYPES.includes(
          mimeType as (typeof VALID_IMAGE_TYPES)[number]
        )
      ) {
        mimeType = "application/octet-stream"
      }

      // Type assertion needed because BinaryFiles uses internal types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadedFiles[fileId as any] = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: fileId as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mimeType: mimeType as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataURL: dataURL as any,
        created: Date.now()
      }
    } catch (error) {
      console.error("Error loading file:", error)
    }
  }

  return loadedFiles
}
