# Monorepo packages

Vite has first-class support for bundling local packages in a monorepo without the need for a build step. We currently support 2 methods for bundling (A and B below), each with their own tradeoffs, so use the method that works best for you!

## A) Add `vite` entry points (experimental)

This method is based entirely around `package.json` entry points. For local packages using `exports`, add a `vite` condition that maps to a source file (condition must be listed first). For other packages, add a `vite` entry point similar to `main`.

### Requirements

- Requires entry points within the package's `package.json`.
- Requires package (npm, pnpm, yarn) workspaces.
- Requires the package to exist in `node_modules` (symlinked via workspaces).

### Implementation

For each local package that you want to bundle source files, add `vite` entry points (1 or 2, not both).

```json
// 1) Using exports (supports deep imports)
{
  "exports": {
    "." {
      "vite": "./src/index.ts",
      "module": "./lib/index.js"
    },
    "./*": {
      "vite": ["./src/*.ts", "./src/*.tsx"],
      "module": "./lib/*.js"
    }
  }
}

// 2) Not using exports (default import only)
{
  "vite": "src/index.ts",
  "main": "lib/index.js"
}
```

:::info
For packages that are depended on (not symlinked in `node_modules`), the `vite` entry points are ignored, and are safe to publish.
:::

### Caveats

- If using `vite` exports condition:
  - To support deep imports, the `./*` entry point must be defined, which maps 1:1 to the file system.
  - To support multiple source files with different extensions, use an array as the `vite` condition (example above).
- If using `vite` main entry point:
  - Only default imports are supported.
  - Deep imports are not supported.
- Packages that are not symlinked into `node_modules` will _not_ use the `vite` entry points. For reference, `workspace:`, `portal:`, and `link:` are supported, while `file:`, `git:`, etc are not.

## B) Define resolve aliases

The tried-and-true method for bundling local packages is to define the [`resolve.alias`](/config/shared-options.html#resolve-alias) setting, and map each package name to their source folder.

### Requirements

- Ignores `main` and `exports` within the package's `package.json`.
- Does not require package workspaces.
- Does not require the package to exist in `node_modules`.

### Implementation

```js
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@brand/components': path.join(__dirname, '../packages/components'),
      '@brand/utils': path.join(__dirname, '../packages/utils'),
    },
  },
})
```

Once aliases have been defined, you can import from them as if they were installed from npm. Both default and deep imports are supported!

```js
import Button from '@brand/components/Button.vue'
import { camelCase } from '@brand/utils/string'
```

## TypeScript path aliases

Regardless of the method you choose above, you'll most likely need to define `tsconfig.json` paths for TypeScript to resolve type information from the local package source files.

```json
{
  "compilerOptions": {
    "paths": {
      // Default import only
      "@brand/components": ["../packages/components/src/index.ts"],
      // With deep imports
      "@brand/components/*": ["../packages/components/src/*"]
    }
  }
}
```
