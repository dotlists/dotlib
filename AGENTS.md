## Agentic Coding Conventions

This document outlines the conventions for agentic coding in this repository.

### Build, Lint, and Test

- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Test:**
  1. `npx convex dev`
  2. `npm run dev`

### Code Style

- **Formatting:** Use `eslint . --fix` to format the code.
- **Types:** The project uses TypeScript. Use types for all new code.
- **Naming Conventions:** Follow existing naming conventions.
- **Error Handling:** Throw errors for unauthorized access and other critical issues.
- **Imports:** Use absolute imports for modules within the project.

### Commits

- **Conventional Commits:** All commits must follow the Conventional Commits specification.
- **Commit Messages:** Commit messages should be informed by past commit messages.
- **Branching:** Create a new branch for each new feature or fix.
