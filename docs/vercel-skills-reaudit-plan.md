# Vercel Skills Re-Audit: Changes Only When Needed

Second pass over the codebase against all 57 React best-practice rules and 8 composition-pattern rules. This plan lists **only** items that were unsearched before, newly relevant, or still worth changing. Already-done items (derived state, use(), ref as prop, optimizePackageImports) are not repeated.

---

## 1. Async: Parallel file loading (required)

**Rule:** `async-parallel` – use `Promise.all()` for independent async work.

**File:** `components/canvas/utils/file-loader.ts`

**Current:** `loadFiles()` loops over `Object.entries(fileUrls)` and **sequentially** awaits `fetch(url)` → `response.blob()` → `FileReader` for each file. N files ⇒ N round-trips in sequence.

**Change:** Load each file in a small helper (same logic as today), then run all loads in parallel with `Promise.all(entries.map(([fileId, url]) => loadOneFile(fileId, url)))`. Build `loadedFiles` from the array of results. Keep the same `BinaryFiles` shape and error handling (per-file try/catch so one failure does not break the rest).

**Why:** Same API and behavior, faster when a drawing has multiple images (e.g. 5 images: ~5× faster). Clear win with no API change.

---

## 2. Rendering: content-visibility for long lists (optional)

**Rule:** `rendering-content-visibility` – use `content-visibility: auto` (and optionally `contain-intrinsic-size`) for long, scrollable lists.

**Files:** List UI that renders many items – e.g. `components/sidebar/components/drawing-list.tsx`, `components/sidebar/components/folder-section.tsx`, `components/sidebar/components/share-dialog.tsx` (collaborators).

**Current:** No `content-visibility`. All list items are laid out and painted even when off-screen.

**Change (only when needed):** If you expect or already see long lists (e.g. dozens of drawings or folders), add a class such as `content-visibility-auto` (with Tailwind or a small CSS rule) and, if needed, `contain-intrinsic-size` (e.g. approximate row height) to list item containers so the browser can skip off-screen work.

**Why optional:** Low impact for small lists; high impact for 100+ items. Do this when optimizing scroll performance or when lists grow.

---

## 3. Rerender: startTransition for non-urgent updates (optional)

**Rule:** `rerender-transitions` – wrap frequent, non-urgent state updates in `startTransition` so the UI stays responsive.

**Relevant spots:** Search/filter that updates list state on every keystroke (e.g. `searchQuery` → `filteredDrawings` in `use-sidebar-state.ts` and search dialog). If typing feels heavy or blocks input, consider marking the filter result update as a transition.

**Change (only when needed):** Where you set state that drives the filtered list (e.g. `setSearchQuery` or the derived filtered list state), wrap that update in `startTransition(() => { ... })` so React can keep input responsive.

**Why optional:** Convex + useMemo may already keep this fast. Apply only if you measure or observe input jank.

---

## 4. Bundle: Defer third-party when analytics is added (future)

**Rule:** `bundle-defer-third-party` – load analytics/logging after hydration (e.g. `next/dynamic` with `ssr: false`).

**Current:** `lib/analytics.ts` and related files have TODOs; no analytics component is mounted in the app yet.

**Change (only when needed):** When you integrate an analytics/tracking component, load it with `dynamic(..., { ssr: false })` (or equivalent) so it does not block the initial bundle or hydration.

**Why future:** No change until the TODO is implemented.

---

## 5. Composition: Context interface state/actions/meta (optional)

**Rule:** `state-context-interface` – prefer a generic context value with `state`, `actions`, and optionally `meta` for dependency injection and consistency.

**File:** `context/drawing-context.tsx`

**Current:** Context value is `{ currentDrawingId, setCurrentDrawingId }` (flat). Already using `use()` (React 19).

**Change (only when needed):** If you add more drawing-related state or want a consistent pattern for other contexts, you could reshape to e.g. `{ state: { currentDrawingId }, actions: { setCurrentDrawingId } }` and update `useDrawing()` and all consumers. Not required for a single provider and two fields.

**Why optional:** Purely structural; no functional or performance gain for the current usage.

---

## 6. What was checked and does not need changes

- **forwardRef / useContext:** None left; already migrated to ref-as-prop and `use()`.
- **Barrel imports:** App code imports from specific paths; `optimizePackageImports` is already set in `next.config.ts`.
- **Dynamic imports:** Excalidraw and Canvas already use `next/dynamic` with `ssr: false`.
- **Derived state in effect:** Theme in canvas is derived in render; no duplicate state/effect.
- **Conditional render:** Uses like `length > 0 &&` and object checks; no numeric `0` or `NaN` rendered. No change for `rendering-conditional-render`.
- **Functional setState:** Used where appropriate (e.g. `setRemovingIds((prev) => ...)`, `setExpandedFolders((prev) => ...)`).
- **Lazy state init:** `useState(() => new Set())` for `expandedFolders`; no expensive non-function initializers found.
- **useMemo for simple primitives:** `shareTargetName` useMemo does a `.find()`; not a trivial primitive expression. No oversimplification.
- **React.memo / default non-primitive props:** No `memo()` components with default object/array/function props; rule N/A.
- **Async waterfalls (client):** Convex `useQuery` is used; no sequential client-side awaits that should be parallelized except file loading (covered above).
- **Async defer await:** No obvious "await in a branch that's rarely used" in client code; Convex backend has its own flow.
- **addEventListener / passive:** No global scroll/wheel listeners in app code (only in tests). `client-event-listeners` / `client-passive-event-listeners` N/A.
- **localStorage:** Not used; `client-localstorage-schema` N/A.
- **Server-side rules:** App uses Convex; no RSC/server actions in the same way. `server-*` rules (cache-react, parallel-fetching, etc.) are N/A for this stack.
- **Boolean prop proliferation:** Sidebar has a single `isOpen`; no multi-boolean component that needs compound components. `architecture-avoid-boolean-props` does not require change.
- **Render props:** No `renderX` or function-as-children patterns; `patterns-children-over-render-props` N/A.
- **RegExp in loops / .sort() for min-max / chained filter+map:** No violations found; `.sort()` is used for ordering (e.g. creation time), not for min/max.
- **Index maps / Set lookups:** No repeated `.find()` by same key in a tight loop; single lookups (e.g. shareTargetName, leaveCollaboration) are fine.
- **Activity component / useTransition for loading:** Not required for current UI; consider only if you add heavy show/hide or loading states later.

---

## Summary

| Priority | Item                         | File(s)                                    | Action                             |
| -------- | ---------------------------- | ------------------------------------------ | ---------------------------------- |
| Required | Parallel file loading        | file-loader.ts                             | Use Promise.all for multiple files |
| Optional | content-visibility for lists | drawing-list, folder-section, share-dialog | Add when lists are long            |
| Optional | startTransition for search   | sidebar/search                             | Add if input feels heavy           |
| Future   | Defer analytics bundle       | When adding analytics                      | Use dynamic(..., { ssr: false })   |
| Optional | Context state/actions shape  | drawing-context.tsx                        | Refactor only if expanding context |

Implement the **required** item (parallel file loading). Treat the rest as "when needed" or "when you touch that code."
