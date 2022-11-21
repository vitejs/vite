---
title: Command Line Interface | Guide
---

# Command Line Interface

## Dev server

### `vite`

Start Vite dev server in the current directory. Will enter the watch mode in development environment and run mode in CI automatically.

#### Usage

```bash
vite [root]
```

#### Options

| Options                  |                                                                 |
| ------------------------ | --------------------------------------------------------------- | ------------------------------- | ----- | ------ |
| `--host [host]`          | [string] specify hostname                                       |
| `--port <port>`          | [number] specify port                                           |
| `--https`                | [boolean] use TLS + HTTP/2                                      |
| `--open [path]`          | [boolean \\                                                     | string] open browser on startup |
| `--cors`                 | [boolean] enable CORS                                           |
| `--strictPort`           | [boolean] exit if specified port is already in use              |
| `--force`                | [boolean] force the optimizer to ignore the cache and re-bundle |
| `-c, --config <file>`    | [string] use specified config file                              |
| `--base <path>`          | [string] public base path (default: `/`)                        |
| `-l, --logLevel <level>` | [string] info                                                   | warn                            | error | silent |
| `--clearScreen`          | [boolean] allow/disable clear screen when logging               |
| `-d, --debug [feat]`     | [string \\                                                      | boolean] show debug logs        |
| `-f, --filter <filter>`  | [string] filter debug logs                                      |
| `-m, --mode <mode>`      | [string] set env mode                                           |
| `-h, --help`             | Display available CLI options                                   |
| `-v, --version`          | Display version number                                          |

## Build

### `vite build`

Build for production.

#### Usage

```bash
vite build [root]
```

#### Options

| Options                        |                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| `--target <target>`            | [string] transpile target (default: `'modules'`)                               |
| `--outDir <dir>`               | [string] output directory (default: `dist`)                                    |
| `--assetsDir <dir>`            | [string] directory under outDir to place assets in (default: `assets`)         |
| `--assetsInlineLimit <number>` | [number] static asset base64 inline threshold in bytes (default: `4096`)       |
| `--ssr [entry]`                | [string] build specified entry for server-side rendering                       |
| `--sourcemap`                  | [boolean] output source maps for build (default: `false`)                      |
| `--minify [minifier]`          | [boolean \\                                                                    | "terser"                         | "esbuild"] enable/disable minification, or specify minifier to use (default: `esbuild`) |
| `--manifest [name]`            | [boolean \\                                                                    | string] emit build manifest json |
| `--ssrManifest [name]`         | [boolean \\                                                                    | string] emit ssr manifest json   |
| `--force`                      | [boolean] force the optimizer to ignore the cache and re-bundle (experimental) |
| `--emptyOutDir`                | [boolean] force empty outDir when it's outside of root                         |
| `-w, --watch`                  | [boolean] rebuilds when modules have changed on disk                           |
| `-c, --config <file>`          | [string] use specified config file                                             |
| `--base <path>`                | [string] public base path (default: `/`)                                       |
| `-l, --logLevel <level>`       | [string] info                                                                  | warn                             | error                                                                                   | silent |
| `--clearScreen`                | [boolean] allow/disable clear screen when logging                              |
| `-d, --debug [feat]`           | [string \\                                                                     | boolean] show debug logs         |
| `-f, --filter <filter>`        | [string] filter debug logs                                                     |
| `-m, --mode <mode>`            | [string] set env mode                                                          |
| `-h, --help`                   | Display available CLI options                                                  |

## Others

### `vite optimize`

Pre-bundle dependencies.

#### Usage

```bash
vite optimize [root]
```

#### Options

| Options                  |                                                                 |
| ------------------------ | --------------------------------------------------------------- | ------------------------ | ----- | ------ |
| `--force`                | [boolean] force the optimizer to ignore the cache and re-bundle |
| `-c, --config <file>`    | [string] use specified config file                              |
| `--base <path>`          | [string] public base path (default: `/`)                        |
| `-l, --logLevel <level>` | [string] info                                                   | warn                     | error | silent |
| `--clearScreen`          | [boolean] allow/disable clear screen when logging               |
| `-d, --debug [feat]`     | [string \\                                                      | boolean] show debug logs |
| `-f, --filter <filter>`  | [string] filter debug logs                                      |
| `-m, --mode <mode>`      | [string] set env mode                                           |
| `-h, --help`             | Display available CLI options                                   |

### `vite preview`

Locally preview production build.

#### Usage

```bash
vite preview [root]
```

#### Options

| Options                  |                                                    |
| ------------------------ | -------------------------------------------------- | ------------------------------- | ----- | ------ |
| `--host [host]`          | [string] specify hostname                          |
| `--port <port>`          | [number] specify port                              |
| `--strictPort`           | [boolean] exit if specified port is already in use |
| `--https`                | [boolean] use TLS + HTTP/2                         |
| `--open [path]`          | [boolean                                           | string] open browser on startup |
| `--outDir <dir>`         | [string] output directory (default: dist)          |
| `-c, --config <file>`    | [string] use specified config file                 |
| `--base <path>`          | [string] public base path (default: /)             |
| `-l, --logLevel <level>` | [string] info                                      | warn                            | error | silent |
| `--clearScreen`          | [boolean] allow/disable clear screen when logging  |
| `-d, --debug [feat]`     | [string                                            | boolean] show debug logs        |
| `-f, --filter <filter>`  | [string] filter debug logs                         |
| `-m, --mode <mode>`      | [string] set env mode                              |
| `-h, --help`             | Display available CLI options                      |
