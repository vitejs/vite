# Vite Maintenance Principles

## Ensure type support

Vite aims to be fully usable as a dependency in a TypeScript project (e.g. it should provide proper typings for VitePress), and also in `vite.config.ts`. This means any types that are exposed needs to be part of `dependencies` instead of `devDependencies`. For example, if a config option uses an imported type from a `@types/x` package, that type package should be included as a dependency (e.g. `@types/http-proxy`)

On the contrary, if a dependency's type isn't exposed, then its typing should be left in `devDependencies` to reduce user dependency downloads (e.g. `@types/ws`).

## Think before adding a dependency

Vite aims to be lightweight, and this includes being aware of the number of npm dependencies and their size.

Note we pre-bundle most dependencies with rollup before publishing! Therefore most non-type dependencies should be added under `devDependencies` by default.

Avoid dependencies that:

- Cannot be properly bundled due to native deps. If it must be included due to critical functionality, put it under `dependencies` (auto excluded during rollup build). Example: `esbuild`.

- Simple enought that it can be substituted with a local helper (e.g. one-function packages like `p-map-series`)

- Has large transitive dependencies that results in bloated `node_modules` size compared to the functionality it provides. For example, `http-proxy` itself plus `@types/http-proxy` is a little over 1MB in size, but `http-proxy-middleware` pulls in a ton of dependencies that makes it 7MB(!) when a minimal custom middleware on top of `http-proxy` only requires a couple lines of code.

## Think before adding yet another option

We already have many config options, and we should avoid fixing an issue by adding yet another one. Before adding an option, try to think about:

- Whether the problem is really worth addressing
- Whether the problem can be fixed with a smarter default
- Whether the problem has workaround using existing options
- Whether the problem can be addressed with a plugin instead
