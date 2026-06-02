This is a TypeScript project that implements a frontend build tooling called Vite. Please follow these guidelines when contributing:

## Code Standards

- Run `pnpm run lint` to ensure that your code adheres to the code standards.
- Run `pnpm run format` to format your code.
- Build: `pnpm run build`
- Test: `pnpm run test` (uses Vitest and Playwright)

## Repository Structure

- `docs/`: Documentation
- `packages/create-vite`: The source code for the `create-vite` command
- `packages/plugin-legacy`: The source code for the `@vitejs/plugin-legacy` plugin
- `packages/vite`: The source code for the Vite core
- `playground/`: E2E tests

## PR Guidelines

### PR Title & Commit Messages

- Follow the [commit message convention](./commit-convention.md)

### PR Description

- What does this PR solve? - Clear problem/feature description
- Why was this approach chosen? - Implementation rationale
- If this is a new feature, include a convincing reason.
- If this adds a new config option, verify problem can't be solved with smarter defaults, existing options, or a plugin
- If this is a bug fix, explain what caused the bug - Link to relevant code if possible

### Code Style & Standards

- Code follows TypeScript best practices
- Maintains existing code structure and organization
- Comments explain "why", not "what"

### Testing

- Prefer unit tests if it can be tested without using mocks
- E2E tests should be added in the `playground/` directory

### Documentation

- Update documentation for public API changes
- Documentation changes go in `docs/` folder

### Other Considerations

- No concerning performance impacts
