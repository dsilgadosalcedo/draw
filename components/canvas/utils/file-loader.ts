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

type LoadedFileEntry = {
  id: string
  mimeType: string
  dataURL: string
  created: number
}

async function loadOneFile(
  fileId: string,
  url: string
): Promise<{ fileId: string; entry: LoadedFileEntry } | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const dataURL = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })

    let mimeType: string = blob.type || "image/png"
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

    const entry: LoadedFileEntry = {
      id: fileId,
      mimeType,
      dataURL,
      created: Date.now()
    }
    return { fileId, entry }
  } catch (error) {
    console.error("Error loading file:", error)
    return null
  }
}

// Load all files in parallel
export async function loadFiles(
  fileUrls: Record<string, string> | undefined
): Promise<BinaryFiles | undefined> {
  if (!fileUrls || Object.keys(fileUrls).length === 0) {
    return undefined
  }

  const entries = Object.entries(fileUrls)
  const results = await Promise.all(
    entries.map(([fileId, url]) => loadOneFile(fileId, url))
  )

  const loadedFiles: BinaryFiles = {} as BinaryFiles
  for (const result of results) {
    if (result) {
      // Type assertion needed because BinaryFiles uses internal types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadedFiles[result.fileId as any] = result.entry as any
    }
  }

  return loadedFiles
}
