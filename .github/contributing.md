# Vite Contributing Guide

Hi! We are really excited that you are interested in contributing to Vite. Before submitting your contribution, please make sure to take a moment and read through the following guide:

## Repo Setup

The Vite repo is a monorepo using Yarn workspaces. The package manager used to install and link dependencies must be [Yarn v1](https://classic.yarnpkg.com/).

To development and test the core `vite` package:

1. Go to `packages/vite` and run `yarn dev`. This starts `tsc` in watch mode.

2. Run `yarn link` in `packages/vite`. This links `vite` globally so that you can:

    - Run `yarn link vite` in another Vite project to use the locally built Vite;
    - Use the `vite` binary anywhere.

## Running Tests

Each package under `packages/playground/` contains a `__tests__` directory. The tests are run using [Jest](https://jestjs.io/) + [Playwright](https://playwright.dev/) with custom integrations to make writing tests simple. The detailed setup is inside `jest.config.js` and `scripts/jest*` files.

Each test can be run under either dev server mode or build mode.

- `yarn test` by default runs every test in both serve and build mode.

- `yarn test-serve` runs tests only under serve mode.

- `yarn test-build` runs tests only under build mode.

- You can also use `yarn test-serve [match]` or `yarn test-build [match]` to run tests in a specific playground package, e.g. `yarn test-serve css` will run tests for both `playground/css` and `playground/css-codesplit` under serve mode.

  Note package matching is not aviable for the `yarn test` script, which always runs all tests.

### Test Env and Helpers

Inside playground tests, a global `page` object is automatically available, which is a Playwright [`Page`](https://playwright.dev/docs/api/class-page) instance that has already navigated to the served page of the current playground. So writing a test is as simple as:

```js
test('should work', async () => {
  expect(await page.textContent('.foo')).toMatch('foo')
})
```

Some common test helpers, e.g. `testDir`, `isBuild` or `editFile` are available in `packages/playground/testUtils.ts`.

## Pull Request Guidelines

- Checkout a topic branch from a base branch, e.g. `main`, and merge back against that branch.

- If adding a new feature:

  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:

  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `fix: update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable. You can check the coverage of your code addition by running `yarn test --coverage`.

- It's OK to have multiple small commits as you work on the PR - GitHub can automatically squash them before merging.

- Make sure tests pass!

- Commit messages must follow the [commit message convention](./commit-convention.md) so that changelogs can be automatically generated. Commit messages are automatically validated before commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

- No need to worry about code style as long as you have installed the dev dependencies - modified files are automatically formatted with Prettier on commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

## Maintenance Guidelines

> The following section is mostly for maintainers who have commit access, but it's helpful to go through if you intend to make non-trivial contributions to the codebase.

Vite aims to be lightweight, and this includes being aware of the number of npm dependencies and their size.

We use rollup to pre-bundle most dependencies before publishing! Therefore most dependencies, even used in src code, should be added under `devDependencies` by default. This also creates a number of constraints that we need to be aware of in the codebase:

### Usage of `require()`

In some cases we intentionally lazy-require some dependencies to improve startup performance. However, note that we cannot use simple `require('somedep')` calls since these are ignored in ESM files so the dependency won't be included in the bundle, and the actual dependency won't even be there when published since they are in `devDependencies`.

Instead, use `(await import('somedep')).default`.

### Think before adding a dependency

Most deps should be added to `devDependencies` even if they are needed at runtime. Some exceptions are:

- Type packages. Example: `@types/*`.
- Deps that cannot be properly bundled due to binary files. Example: `esbuild`.
- Deps that ships its own types and its type is used in vite's own public types. Example: `rollup`.

Avoid deps that has large transitive dependencies that results in bloated size compared to the functionality it provides. For example, `http-proxy` itself plus `@types/http-proxy` is a little over 1MB in size, but `http-proxy-middleware` pulls in a ton of dependencies that makes it 7MB(!) when a minimal custom middleware on top of `http-proxy` only requires a couple lines of code.

### Ensure type support

Vite aims to be fully usable as a dependency in a TypeScript project (e.g. it should provide proper typings for VitePress), and also in `vite.config.ts`. This means technically a dependency whose types are exposed needs to be part of `dependencies` instead of `devDependencies`. However, these means we won't be able to bundle it.

To get around this, we inline some of these dependencies' types in `packages/vite/types`. This way we can still expose the typing but bundle the dependency's source code.

### Think before adding yet another option

We already have many config options, and we should avoid fixing an issue by adding yet another one. Before adding an option, try to think about:

- Whether the problem is really worth addressing
- Whether the problem can be fixed with a smarter default
- Whether the problem has workaround using existing options
- Whether the problem can be addressed with a plugin instead
