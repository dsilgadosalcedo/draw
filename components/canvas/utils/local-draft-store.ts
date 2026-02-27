import { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import { SerializedAppState } from "../types"

const DRAFT_KEY_PREFIX = "draw:draft:v1:"
const MAX_DRAFT_AGE_MS = 1000 * 60 * 60 * 24 * 7

type LocalDraftRecord = {
  version: 1
  drawingId: string
  elements: readonly OrderedExcalidrawElement[] | null
  appState: SerializedAppState | null | undefined
  revision: number
  lastUpdatedAt: number
  dirty: boolean
}

function getDraftKey(drawingId: string): string {
  return `${DRAFT_KEY_PREFIX}${drawingId}`
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  )
}

function safeParseDraft(rawValue: string | null): LocalDraftRecord | null {
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as LocalDraftRecord
    if (parsed?.version !== 1 || !parsed?.drawingId) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function removeDraftByKey(draftKey: string) {
  if (!canUseStorage()) {
    return
  }
  window.localStorage.removeItem(draftKey)
}

export function getLocalDraft(drawingId: string): LocalDraftRecord | null {
  if (!canUseStorage()) {
    return null
  }
  return safeParseDraft(window.localStorage.getItem(getDraftKey(drawingId)))
}

export function saveLocalDraft(args: {
  drawingId: string
  elements: readonly OrderedExcalidrawElement[] | null
  appState: SerializedAppState | null | undefined
  revision: number
  dirty: boolean
}): LocalDraftRecord | null {
  if (!canUseStorage()) {
    return null
  }

  const draftRecord: LocalDraftRecord = {
    version: 1,
    drawingId: args.drawingId,
    elements: args.elements,
    appState: args.appState,
    revision: args.revision,
    lastUpdatedAt: Date.now(),
    dirty: args.dirty
  }

  const serialized = JSON.stringify(draftRecord)
  const key = getDraftKey(args.drawingId)

  try {
    window.localStorage.setItem(key, serialized)
    return draftRecord
  } catch {
    // Best effort: prune and retry once for quota pressure.
    pruneOldLocalDrafts()
    try {
      window.localStorage.setItem(key, serialized)
      return draftRecord
    } catch {
      return null
    }
  }
}

export function markLocalDraftSynced(
  drawingId: string,
  revision: number
): LocalDraftRecord | null {
  const current = getLocalDraft(drawingId)
  if (!current || current.revision !== revision) {
    return current
  }

  return saveLocalDraft({
    drawingId,
    elements: current.elements,
    appState: current.appState,
    revision,
    dirty: false
  })
}

export function clearLocalDraft(drawingId: string) {
  removeDraftByKey(getDraftKey(drawingId))
}

export function pruneOldLocalDrafts() {
  if (!canUseStorage()) {
    return
  }

  const now = Date.now()
  const keysToRemove: string[] = []

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) {
      continue
    }

    const draft = safeParseDraft(window.localStorage.getItem(key))
    if (!draft) {
      keysToRemove.push(key)
      continue
    }

    if (!draft.dirty && now - draft.lastUpdatedAt > MAX_DRAFT_AGE_MS) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    removeDraftByKey(key)
  }
}
