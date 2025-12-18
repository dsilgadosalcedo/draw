# API Documentation

This document describes all Convex queries, mutations, and actions available in the Draw application.

## Authentication

All endpoints require authentication. Unauthenticated requests will return `null` or throw an "Unauthorized" error.

## Drawings API

### Queries

#### `drawings.get`

Get a drawing by ID.

**Parameters:**

- `drawingId: string` - The drawing ID

**Returns:**

- Drawing object with elements, appState, and files, or `null` if not found/unauthorized

**Example:**

```typescript
const drawing = useQuery(api.drawings.get, { drawingId: "drawing-123" })
```

#### `drawings.list`

List all drawings for the current user.

**Parameters:**

- `folderId?: string | null` - Optional folder ID to filter by

**Returns:**

- Array of drawing metadata (id, name, folderId, etc.)

**Example:**

```typescript
const drawings = useQuery(api.drawings.list, {})
const folderDrawings = useQuery(api.drawings.list, { folderId: "folder-123" })
```

#### `drawings.listShared`

List all drawings shared with the current user.

**Returns:**

- Array of shared drawing metadata

#### `drawings.listCollaborators`

List collaborators for a drawing.

**Parameters:**

- `drawingId: string` - The drawing ID

**Returns:**

- Array of collaborator objects (userId, email, name)

**Errors:**

- "Unauthorized" if user is not the owner
- "Drawing not found" if drawing doesn't exist

#### `drawings.getLatest`

Get the most recent drawing ID for the current user.

**Returns:**

- Drawing ID string or `null`

#### `drawings.getUserStorage`

Get storage usage for the current user.

**Returns:**

- Object with `totalBytes: number`

### Mutations

#### `drawings.save`

Save drawing data (without files).

**Parameters:**

- `drawingId: string`
- `elements: ExcalidrawElement[]`
- `appState: SerializedAppState`
- `files?: Record<string, StorageId>` - Optional file map

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if user doesn't have access
- "Drawing not found" if drawing is inactive

#### `drawings.updateName`

Update drawing name.

**Parameters:**

- `drawingId: string`
- `name: string` - Must be 1-100 characters

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if user doesn't have access
- "Drawing not found" if drawing doesn't exist

#### `drawings.remove`

Soft delete a drawing.

**Parameters:**

- `drawingId: string`

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if user is not the owner
- "Drawing not found" if drawing doesn't exist

#### `drawings.addCollaboratorByEmail`

Add a collaborator by email.

**Parameters:**

- `drawingId: string`
- `email: string`

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if user is not the owner
- "User not found" if email doesn't match a user
- "You cannot share with yourself"
- "User is already a collaborator"

#### `drawings.removeCollaborator`

Remove a collaborator.

**Parameters:**

- `drawingId: string`
- `collaboratorUserId: string`

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if user is not the owner
- "Owner cannot remove themselves"

#### `drawings.leaveCollaboration`

Leave a shared drawing.

**Parameters:**

- `drawingId: string`

**Returns:**

- `null`

### Actions

#### `drawings.saveWithFiles`

Save drawing with file handling (uploads new files, deletes removed files).

**Parameters:**

- `drawingId: string`
- `elements: ExcalidrawElement[]`
- `appState: SerializedAppState`
- `files?: BinaryFiles` - Excalidraw BinaryFiles object

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if user doesn't have access
- "Drawing not found" if drawing is inactive

## Folders API

### Queries

#### `folders.list`

List all folders for the current user.

**Returns:**

- Array of folder objects (id, name, icon, color)

### Mutations

#### `folders.create`

Create a new folder.

**Parameters:**

- `name: string` - Must be 1-50 characters
- `icon?: string` - Optional icon identifier
- `color?: string` - Optional color identifier

**Returns:**

- Object with `folderId: string`

**Errors:**

- "Unauthorized" if not authenticated

#### `folders.updateName`

Update folder name.

**Parameters:**

- `folderId: string`
- `name: string` - Must be 1-50 characters, cannot be empty

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if not authenticated
- "Folder not found" if folder doesn't exist
- "Folder name cannot be empty"
- "Folder name must be at most 50 characters"

#### `folders.updateAppearance`

Update folder icon and color.

**Parameters:**

- `folderId: string`
- `icon: string`
- `color: string`

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if not authenticated
- "Folder not found" if folder doesn't exist

#### `folders.remove`

Soft delete a folder and all its drawings.

**Parameters:**

- `folderId: string`

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if not authenticated
- "Folder not found" if folder doesn't exist

#### `folders.moveDrawingToFolder`

Move a drawing to a folder (or remove from folder if `folderId` is null).

**Parameters:**

- `drawingId: string`
- `folderId: string | null`

**Returns:**

- `null`

**Errors:**

- "Unauthorized" if not authenticated
- "Drawing not found" if drawing doesn't exist
- "Folder not found" if folderId is provided but folder doesn't exist

## Error Codes

Common error messages and their meanings:

- `"Unauthorized"` - User is not authenticated or doesn't have permission
- `"Drawing not found"` - Drawing doesn't exist or is inactive
- `"Folder not found"` - Folder doesn't exist or is inactive
- `"User not found"` - User with the specified email doesn't exist
- `"You cannot share with yourself"` - Attempted to share with own account
- `"User is already a collaborator"` - User already has access
- `"Only the owner can perform this action"` - Action requires owner permissions

## Rate Limiting

Currently, there are no rate limits implemented. This may change in the future.

## Best Practices

1. **Error Handling**: Always handle errors from queries and mutations
2. **Loading States**: Check for `undefined` when queries are loading
3. **Optimistic Updates**: Consider optimistic UI updates for better UX
4. **File Handling**: Use `saveWithFiles` action for drawings with images/files
5. **Validation**: Validate inputs on the client before calling mutations
