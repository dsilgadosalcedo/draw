# Architecture Documentation

This document describes the architecture, component hierarchy, data flow, and design decisions for the Draw application.

## Overview

Draw is a collaborative drawing application built with:

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Convex (database, real-time sync, authentication)
- **Drawing Engine**: Excalidraw
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Runtime**: Bun

## Component Hierarchy

```
app/
├── layout.tsx (Root layout with providers)
├── page.tsx (Main workspace)
└── signin/
    └── page.tsx (Authentication)

components/
├── workspace/
│   └── drawing-workspace.tsx (Main workspace container)
├── canvas/
│   ├── canvas.tsx (Excalidraw wrapper with crossfade)
│   └── editable-name-badge.tsx (Drawing name editor)
├── sidebar/
│   ├── sidebar.tsx (Main sidebar)
│   ├── drawing-list.tsx (List of drawings)
│   ├── folder-section.tsx (Folder organization)
│   └── [other sidebar components]
└── error-boundary.tsx (Error handling)

context/
└── drawing-context.tsx (Global drawing state)

convex/
├── drawings.ts (Drawing queries/mutations)
├── folders.ts (Folder queries/mutations)
└── schema.ts (Database schema)
```

## Data Flow

### Drawing Creation Flow

1. User creates new drawing → `crypto.randomUUID()` generates ID
2. ID stored in `DrawingContext`
3. Canvas component detects new ID
4. User draws → Excalidraw `onChange` fires
5. Changes debounced (1 second)
6. `saveWithFiles` action called
7. Files uploaded to Convex storage
8. Drawing data saved to database
9. Real-time updates propagate to other clients

### Drawing Loading Flow

1. User selects drawing from sidebar
2. `setCurrentDrawingId` updates context
3. Canvas component queries `drawings.get`
4. Drawing data loaded
5. Files loaded from storage URLs
6. Excalidraw initialized with data
7. Crossfade animation between drawings

### Collaboration Flow

1. Owner shares drawing via email
2. `addCollaboratorByEmail` mutation called
3. Collaborator record created
4. Collaborator can now access drawing
5. Real-time updates sync across all clients

## State Management

### Global State

- **DrawingContext**: Manages current drawing ID
  - Simple React Context
  - Used throughout app for drawing selection

### Component State

- **Canvas**: Complex state for dual-instance crossfade
  - Two Excalidraw instances (drawing01, drawing02)
  - Fade animation states
  - File loading states
  - Theme synchronization

- **Sidebar**: Local state for UI interactions
  - Editing states
  - Dialog open/close
  - Folder expansion
  - Search state

### Server State (Convex)

- All drawing/folder data managed by Convex
- Real-time subscriptions via `useQuery`
- Mutations via `useMutation` and `useAction`

## Key Design Decisions

### Dual Canvas Instances

**Decision**: Use two Excalidraw instances for smooth transitions

**Rationale**:

- Excalidraw doesn't support hot-swapping data
- Two instances allow crossfade animation
- Better UX when switching between drawings

**Implementation**:

- `drawing01` and `drawing02` alternate
- Z-index and opacity control visibility
- 500ms fade transition

### Debounced Auto-Save

**Decision**: 1 second debounce for auto-save

**Rationale**:

- Reduces database writes
- Prevents excessive API calls
- Still feels responsive

**Implementation**:

- Custom `useDebouncedCallback` hook
- Flushes on drawing change
- Handles file uploads efficiently

### Soft Deletes

**Decision**: Mark items as inactive instead of hard delete

**Rationale**:

- Allows recovery
- Maintains referential integrity
- Easier collaboration management

**Implementation**:

- `isActive` field on drawings and folders
- Queries filter `isActive !== false`
- Files deleted asynchronously after soft delete

### File Storage

**Decision**: Store files in Convex storage, reference by ID

**Rationale**:

- Integrated with Convex
- Automatic URL generation
- Efficient file management

**Implementation**:

- Files uploaded via `ctx.storage.store()`
- Storage IDs stored in drawing document
- URLs generated on-demand via `ctx.storage.getUrl()`

## Error Handling Strategy

### Error Boundaries

- React Error Boundary wraps canvas
- Next.js error pages for route-level errors
- Global error page for critical failures

### Error Classification

- Network errors
- Authentication errors
- Validation errors
- Permission errors
- Not found errors

### Error Reporting

- Centralized error handling utilities
- User-friendly error messages
- Error tracking integration (ready for Sentry)

## Performance Optimizations

### Code Splitting

- Dynamic imports for Excalidraw
- Lazy loading for heavy components
- Route-based code splitting (Next.js)

### Rendering Optimizations

- `useMemo` for expensive computations
- `useCallback` for stable function references
- Virtual scrolling (planned for large lists)

### Bundle Optimization

- Tree shaking enabled
- Bundle analyzer configured
- Optimized imports

## Security Considerations

### Input Validation

- All user inputs validated
- String sanitization
- Length limits enforced

### Authentication

- Convex Auth handles authentication
- All mutations check user ID
- Role-based access control (owner/collaborator)

### Authorization

- Drawing access checked on every query
- Collaborator records enforce permissions
- Owner-only actions protected

## Testing Strategy

### Unit Tests

- Utility functions
- Custom hooks
- Helper functions

### Component Tests

- React Testing Library
- User interactions
- State management

### Integration Tests

- Component integration
- Data flow
- Error scenarios

### E2E Tests

- Playwright for browser testing
- Critical user flows
- Cross-browser compatibility

## Future Improvements

1. **Virtual Scrolling**: For large drawing lists
2. **Image Optimization**: Compression and progressive loading
3. **Rate Limiting**: API protection
4. **Caching**: Client-side caching for better performance
5. **Offline Support**: Service worker for offline access

## Architecture Decision Records (ADRs)

### ADR-001: Bun as Runtime

**Status**: Accepted

**Context**: Need fast development and execution

**Decision**: Use Bun instead of Node.js

**Consequences**:

- Faster package installation
- Built-in test runner
- Native TypeScript support
- Some ecosystem compatibility considerations

### ADR-002: Convex for Backend

**Status**: Accepted

**Context**: Need real-time sync and simple backend

**Decision**: Use Convex instead of traditional backend

**Consequences**:

- Real-time updates out of the box
- Simplified deployment
- Vendor lock-in
- Learning curve for team

### ADR-003: Dual Canvas Instances

**Status**: Accepted

**Context**: Need smooth transitions between drawings

**Decision**: Use two Excalidraw instances with crossfade

**Consequences**:

- Better UX
- More complex state management
- Slightly higher memory usage
