# Vite Contributing Guide

Hi! We are really excited that you are interested in contributing to Vite. Before submitting your contribution, please make sure to take a moment and read through the following guide:

## Repo Setup

The Vite repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

To develop and test the core `vite` package:

1. Run `pnpm i` in Vite's root folder

2. Run `pnpm run build` in Vite's root folder.

3. If you are developing Vite itself, you can go to `packages/vite` and run `pnpm run dev` to automatically rebuild Vite whenever you change its code.

You can alternatively use [Vite.js Docker Dev](https://github.com/nystudio107/vitejs-docker-dev) for a containerized Docker setup for Vite.js development.

> Vite uses pnpm v7. If you are working on multiple projects with different versions of pnpm, it's recommend to enable [Corepack](https://github.com/nodejs/corepack) by running `corepack enable`.

## Debugging

If you want to use break point and explore code execution you can use the ["Run and debug"](https://code.visualstudio.com/docs/editor/debugging) feature from vscode.

1. Add a `debugger` statement where you want to stop the code execution.

2. Click on the "Run and Debug" icon in the activity bar of the editor.

3. Click on the "JavaScript Debug Terminal" button.

4. It will open a terminal, then go to `playground/xxx` and run `pnpm run dev`.

5. The execution will stop and you'll use the [Debug toolbar](https://code.visualstudio.com/docs/editor/debugging#_debug-actions) to continue, step over, restart the process...

### Debugging errors in Vitest tests using Playwright (Chromium)

Some errors are masked and hidden away because of the layers of abstraction and sandboxed nature added by Vitest, Playwright, and Chromium. In order to see what's actually going wrong and the contents of the devtools console in those instances, follow this setup:

1. Add a `debugger` statement to the `playground/vitestSetup.ts` -> `afterAll` hook. This will pause execution before the tests quit and the Playwright browser instance exits.

1. Run the tests with the `debug-serve` script command which will enable remote debugging: `pnpm run debug-serve resolve`.

1. Wait for inspector devtools to open in your browser and the debugger to attach.

1. In the sources panel in the right column, click the play button to resume execution and allow the tests to run which will open a Chromium instance.

1. Focusing the Chromium instance, you can open the browser devtools and inspect the console there to find the underlying problems.

1. To close everything, just stop the test process back in your terminal.

## Testing Vite against external packages

You may wish to test your locally-modified copy of Vite against another package that is built with Vite. For pnpm, after building Vite, you can use [`pnpm.overrides`](https://pnpm.io/package_json#pnpmoverrides). Please note that `pnpm.overrides` must be specified in the root `package.json` and you must first list the package as a dependency in the root `package.json`:

```json
{
  "dependencies": {
    "vite": "^2.0.0"
  },
  "pnpm": {
    "overrides": {
      "vite": "link:../path/to/vite/packages/vite"
    }
  }
}
```

And re-run `pnpm install` to link the package.

## Running Tests

### Integration Tests

Each package under `playground/` contains a `__tests__` directory. The tests are run using [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) with custom integrations to make writing tests simple. The detailed setup is inside `vitest.config.e2e.js` and `playground/vitest*` files.

Before running the tests, make sure that [Vite has been built](#repo-setup). On Windows, you may want to [activate Developer Mode](https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development) to solve [issues with symlink creation for non-admins](https://github.com/vitejs/vite/issues/7390). Also you may want to [set git `core.symlinks` to `true` to solve issues with symlinks in git](https://github.com/vitejs/vite/issues/5242).

Each integration test can be run under either dev server mode or build mode.

- `pnpm test` by default runs every integration test in both serve and build mode, and also unit tests.

- `pnpm run test-serve` runs tests only under serve mode.

- `pnpm run test-build` runs tests only under build mode.

- You can also use `pnpm run test-serve [match]` or `pnpm run test-build [match]` to run tests in a specific playground package, e.g. `pnpm run test-serve asset` will run tests for both `playground/asset` and `vite/src/node/__tests__/asset` under serve mode and `vite/src/node/__tests__/**/*` just run in serve mode.

  Note package matching is not available for the `pnpm test` script, which always runs all tests.

### Unit Tests

Other than tests under `playground/` for integration tests, packages might contains unit tests under their `__tests__` directory. Unit tests are powered by [Vitest](https://vitest.dev/). The detailed config is inside `vitest.config.ts` files.

- `pnpm run test-unit` runs unit tests under each package.

- You can also use `pnpm run test-unit [match]` to run related tests.

### Test Env and Helpers

Inside playground tests, you can import the `page` object from `~utils`, which is a Playwright [`Page`](https://playwright.dev/docs/api/class-page) instance that has already navigated to the served page of the current playground. So writing a test is as simple as:

```js
import { page } from '~utils'

test('should work', async () => {
  expect(await page.textContent('.foo')).toMatch('foo')
})
```

Some common test helpers, e.g. `testDir`, `isBuild` or `editFile` are also available in the utils. Source code is located at `playground/test-utils.ts`.

Note: The test build environment uses a [different default set of Vite config](https://github.com/vitejs/vite/blob/main/playground/vitestSetup.ts#L102-L122) to skip transpilation during tests to make it faster. This may produce a different result compared to the default production build.

### Extending the Test Suite

To add new tests, you should find a related playground to the fix or feature (or create a new one). As an example, static assets loading are tested in the [assets playground](https://github.com/vitejs/vite/tree/main/playground/assets). In this Vite App, there is a test for `?raw` imports, with [a section is defined in the `index.html` for it](https://github.com/vitejs/vite/blob/main/playground/assets/index.html#L121):

```html
<h2>?raw import</h2>
<code class="raw"></code>
```

This will be modified [with the result of a file import](https://github.com/vitejs/vite/blob/main/playground/assets/index.html#L151):

```js
import rawSvg from './nested/fragment.svg?raw'
text('.raw', rawSvg)
```

Where the `text` util is defined as:

```js
function text(el, text) {
  document.querySelector(el).textContent = text
}
```

In the [spec tests](https://github.com/vitejs/vite/blob/main/playground/assets/__tests__/assets.spec.ts#L180), the modifications to the DOM listed above are used to test this feature:

```js
test('?raw import', async () => {
  expect(await page.textContent('.raw')).toMatch('SVG')
})
```

## Note on Test Dependencies

In many test cases we need to mock dependencies using `link:` and `file:` protocols. `pnpm` treats `link:` as symlinks and `file:` as hardlinks. To test dependencies as if they are copied into `node_modules`, use the `file:` protocol, other cases should use the `link:` protocol.

## Debug Logging

You can set the `DEBUG` environment variable to turn on debugging logs. E.g. `DEBUG="vite:resolve"`. To see all debug logs you can set `DEBUG="vite:*"`, but be warned that it will be quite noisy. You can run `grep -r "createDebugger('vite:" packages/vite/src/` to see a list of available debug scopes.

## Pull Request Guidelines

- Checkout a topic branch from a base branch, e.g. `main`, and merge back against that branch.

- If adding a new feature:

  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:

  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `fix: update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable.

- It's OK to have multiple small commits as you work on the PR - GitHub can automatically squash them before merging.

- Make sure tests pass!

- Commit messages must follow the [commit message convention](./.github/commit-convention.md) so that changelogs can be automatically generated. Commit messages are automatically validated before commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

- No need to worry about code style as long as you have installed the dev dependencies - modified files are automatically formatted with Prettier on commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

## Maintenance Guidelines

> The following section is mostly for maintainers who have commit access, but it's helpful to go through if you intend to make non-trivial contributions to the codebase.

### Issue Triaging Workflow

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/issue-workflow-dark.png">
  <img src="./.github/issue-workflow.png">
</picture>

### Pull Request Review Workflow

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/pr-workflow-dark.png">
  <img src="./.github/pr-workflow.png">
</picture>

## Notes on Dependencies

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

Use `pnpm run check-dist-types` to check bundled types does not rely on types in `devDependencies`. If you are adding `dependencies`, make sure to configure `tsconfig.check.json`.

### Think before adding yet another option

We already have many config options, and we should avoid fixing an issue by adding yet another one. Before adding an option, try to think about:

- Whether the problem is really worth addressing
- Whether the problem can be fixed with a smarter default
- Whether the problem has workaround using existing options
- Whether the problem can be addressed with a plugin instead

## Docs translation contribution

If you would like to start a translation in your language, you are welcome to contribute! Please join [the #translations channel in Vite Land](https://chat.vitejs.dev) to discuss and coordinate with others.

The english docs are embedded in the main Vite repo, to allow contributors to work on docs, tests and implementation in the same PR. Translations are done by forking the main repo.

### How to start a translation repo

1. In order to get all doc files, you first need to clone this repo in your personal account.
2. Keep all the files in `docs/` and remove everything else.

   - You should setup your translation site based on all the files in `docs/` folder as a VitePress project.
     (that said, `package.json` is need).

   - Refresh git history by removing `.git` and then `git init`

3. Translate the docs.

   - During this stage, you may be translating documents and synchronizing updates at the same time, but don't worry about that, it's very common in translation contribution.

4. Push your commits to your GitHub repo. you can setup a netlify preview as well.
5. Use [Ryu-cho](https://github.com/vuejs-translations/ryu-cho) tool to setup a GitHub Action, automatically track English docs update later.

We recommend talking with others in Vite Land so you find more contributors for your language to share the maintenance work. Once the translation is done, communicate it to the Vite team so the repo can be moved to the official vitejs org in GitHub.
