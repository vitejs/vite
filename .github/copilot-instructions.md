This is a TypeScript project that implements a frontend build tooling called Vite. Please follow these guidelines when contributing:

## Code Standards

### Required Before Each Commit

- Run `pnpm run lint` to ensure that your code adheres to the code standards.
- Run `pnpm run format` to format your code.

### Development Flow

- Build: `pnpm run build`
- Test: `pnpm run test` (uses Vitest and Playwright)

## Repository Structure

- `docs/`: Documentation.
- `packages/create-vite`: Contains the source code for the `create-vite` command.
- `packages/plugin-legacy`: Contains the source code for `@vitejs/plugin-legacy`.
- `packages/vite`: Contains the source code for the Vite core.
- `playground/`: E2E tests

## Key Guidelines

1. Follow TypeScript best practices.
2. Maintain existing code structure and organization.
3. Write tests for new functionality. Prefer unit tests if it can be tested without using mocks. E2E tests should be added in the `playground/` directory.
4. Never write comments that explain what the code does. Instead, write comments that explain why the code does what it does.
5. Suggest changes to the documentation if public API changes are made.
