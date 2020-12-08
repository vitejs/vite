# Vite Maintenance Principles

## Think before adding a dependency

Vite aims to be lightweight, and this includes being aware of the number of npm dependencies and their size.

We use rollup to pre-bundle most dependencies before publishing! Therefore most dependencies, even used in src code, should be added under `devDependencies` by default.

Some exceptions are:

- Type packages. Example: `@types/*`.
- Deps that cannot be properly bundled due to binary files. Example: `esbuild`.
- Deps that ships its own types and its type is used in vite's own public types. Example: `rollup`.

Avoid deps that has large transitive dependencies that results in bloated size compared to the functionality it provides. For example, `http-proxy` itself plus `@types/http-proxy` is a little over 1MB in size, but `http-proxy-middleware` pulls in a ton of dependencies that makes it 7MB(!) when a minimal custom middleware on top of `http-proxy` only requires a couple lines of code.

## Ensure type support

Vite aims to be fully usable as a dependency in a TypeScript project (e.g. it should provide proper typings for VitePress), and also in `vite.config.ts`. This means any types that are exposed needs to be part of `dependencies` instead of `devDependencies`. For example, if a config option uses an imported type from a `@types/x` package, that type package should be included as a dependency (e.g. `@types/http-proxy`)

On the contrary, if a dependency's type isn't exposed, then its typing should be left in `devDependencies` to reduce user dependency downloads (e.g. `@types/ws`).

## Think before adding yet another option

We already have many config options, and we should avoid fixing an issue by adding yet another one. Before adding an option, try to think about:

- Whether the problem is really worth addressing
- Whether the problem can be fixed with a smarter default
- Whether the problem has workaround using existing options
- Whether the problem can be addressed with a plugin instead
