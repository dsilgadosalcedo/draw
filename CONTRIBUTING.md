# Contributing to Draw

Thank you for your interest in contributing to Draw! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (>=1.0.0) or [Node.js](https://nodejs.org/) (>=18.0.0)
- A [Convex](https://www.convex.dev/) account
- Git

### Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/draw.git
   cd draw
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up Convex**

   ```bash
   bunx convex dev
   ```

4. **Configure environment variables**
   Create a `.env.local` file:

   ```env
   CONVEX_DEPLOYMENT=your-deployment
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   ```

5. **Start development servers**
   ```bash
   bun run dev
   ```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode (already configured)
- Avoid `any` types - use specific types or `unknown`
- Add JSDoc comments for public APIs

### React

- Use functional components with hooks
- Prefer `useCallback` and `useMemo` for performance optimization
- Keep components focused and small (< 300 lines when possible)
- Extract complex logic into custom hooks

### Naming Conventions

- Files: Use kebab-case (e.g., `editable-name-badge.tsx`)
- Components: Use PascalCase (e.g., `EditableNameBadge`)
- Functions/variables: Use camelCase
- Constants: Use UPPER_SNAKE_CASE

### Code Formatting

- Use Prettier (configured in the project)
- Format on save is enabled in VS Code
- Run `bun run format` before committing

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Use Bun's test runner (Jest-compatible API)
- Use React Testing Library for component tests
- Write E2E tests for critical user flows

### Test Structure

```typescript
import { describe, it, expect } from "bun:test"

describe("ComponentName", () => {
  it("should do something", () => {
    // Test implementation
  })
})
```

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:

```
feat: add virtual scrolling to drawing list
```

## Pull Request Process

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the style guide
   - Add tests for new features
   - Update documentation as needed

3. **Run checks**

   ```bash
   bun run lint
   bun run type-check
   bun test
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: your commit message"
   ```

5. **Push and create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - All tests must pass
   - Code must be linted and formatted
   - Type checking must pass
   - PR description should explain the changes

## Development Guidelines

### Error Handling

- Use error boundaries for React components
- Use centralized error handling utilities
- Provide user-friendly error messages
- Log errors appropriately

### Performance

- Use code splitting for large components
- Implement virtual scrolling for long lists
- Optimize images and assets
- Monitor bundle size

### Security

- Validate all user inputs
- Sanitize data before storing
- Follow security best practices
- Report security issues privately

## Questions?

If you have questions, please:

- Open an issue for bugs or feature requests
- Check existing issues and discussions
- Review the codebase and documentation

Thank you for contributing!
