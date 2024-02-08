# Command Line Interface

## Dev server

### `vite`

Start Vite dev server in the current directory.

#### Usage

```bash
vite [root]
```

#### Options

| Options                  |                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--host [host]`          | Specify hostname (`string`)                                                                                        |
| `--port <port>`          | Specify port (`number`)                                                                                            |
| `--open [path]`          | Open browser on startup (`boolean \| string`)                                                                      |
| `--cors`                 | Enable CORS (`boolean`)                                                                                            |
| `--strictPort`           | Exit if specified port is already in use (`boolean`)                                                               |
| `--force`                | Force the optimizer to ignore the cache and re-bundle (`boolean`)                                                  |
| `-c, --config <file>`    | Use specified config file (`string`)                                                                               |
| `--base <path>`          | Public base path (default: `/`) (`string`)                                                                         |
| `-l, --logLevel <level>` | info \| warn \| error \| silent (`string`)                                                                         |
| `--clearScreen`          | Allow/disable clear screen when logging (`boolean`)                                                                |
| `--profile`              | Start built-in Node.js inspector (check [Performance bottlenecks](/guide/troubleshooting#performance-bottlenecks)) |
| `-d, --debug [feat]`     | Show debug logs (`string \| boolean`)                                                                              |
| `-f, --filter <filter>`  | Filter debug logs (`string`)                                                                                       |
| `-m, --mode <mode>`      | Set env mode (`string`)                                                                                            |
| `-h, --help`             | Display available CLI options                                                                                      |
| `-v, --version`          | Display version number                                                                                             |

## Build

### `vite build`

Build for production.

#### Usage

```bash
vite build [root]
```

#### Options

| Options                        |                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `--target <target>`            | Transpile target (default: `"modules"`) (`string`)                                                                  |
| `--outDir <dir>`               | Output directory (default: `dist`) (`string`)                                                                       |
| `--assetsDir <dir>`            | Directory under outDir to place assets in (default: `"assets"`) (`string`)                                          |
| `--assetsInlineLimit <number>` | Static asset base64 inline threshold in bytes (default: `4096`) (`number`)                                          |
| `--ssr [entry]`                | Build specified entry for server-side rendering (`string`)                                                          |
| `--sourcemap [output]`         | Output source maps for build (default: `false`) (`boolean \| "inline" \| "hidden"`)                                 |
| `--minify [minifier]`          | Enable/disable minification, or specify minifier to use (default: `"esbuild"`) (`boolean \| "terser" \| "esbuild"`) |
| `--manifest [name]`            | Emit build manifest json (`boolean \| string`)                                                                      |
| `--ssrManifest [name]`         | Emit ssr manifest json (`boolean \| string`)                                                                        |
| `--emptyOutDir`                | Force empty outDir when it's outside of root (`boolean`)                                                            |
| `-w, --watch`                  | Rebuilds when modules have changed on disk (`boolean`)                                                              |
| `-c, --config <file>`          | Use specified config file (`string`)                                                                                |
| `--base <path>`                | Public base path (default: `/`) (`string`)                                                                          |
| `-l, --logLevel <level>`       | Info \| warn \| error \| silent (`string`)                                                                          |
| `--clearScreen`                | Allow/disable clear screen when logging (`boolean`)                                                                 |
| `--profile`                    | Start built-in Node.js inspector (check [Performance bottlenecks](/guide/troubleshooting#performance-bottlenecks))  |
| `-d, --debug [feat]`           | Show debug logs (`string \| boolean`)                                                                               |
| `-f, --filter <filter>`        | Filter debug logs (`string`)                                                                                        |
| `-m, --mode <mode>`            | Set env mode (`string`)                                                                                             |
| `-h, --help`                   | Display available CLI options                                                                                       |

## Others

### `vite optimize`

Pre-bundle dependencies.

#### Usage

```bash
vite optimize [root]
```

#### Options

| Options                  |                                                                   |
| ------------------------ | ----------------------------------------------------------------- |
| `--force`                | Force the optimizer to ignore the cache and re-bundle (`boolean`) |
| `-c, --config <file>`    | Use specified config file (`string`)                              |
| `--base <path>`          | Public base path (default: `/`) (`string`)                        |
| `-l, --logLevel <level>` | Info \| warn \| error \| silent (`string`)                        |
| `--clearScreen`          | Allow/disable clear screen when logging (`boolean`)               |
| `-d, --debug [feat]`     | Show debug logs (`string \| boolean`)                             |
| `-f, --filter <filter>`  | Filter debug logs (`string`)                                      |
| `-m, --mode <mode>`      | Set env mode (`string`)                                           |
| `-h, --help`             | Display available CLI options                                     |

### `vite preview`

Locally preview the production build. Do not use this as a production server as it's not designed for it.

#### Usage

```bash
vite preview [root]
```

#### Options

| Options                  |                                                      |
| ------------------------ | ---------------------------------------------------- |
| `--host [host]`          | Specify hostname (`string`)                          |
| `--port <port>`          | Specify port (`number`)                              |
| `--strictPort`           | Exit if specified port is already in use (`boolean`) |
| `--open [path]`          | Open browser on startup (`boolean \| string`)        |
| `--outDir <dir>`         | Output directory (default: `dist`)(`string`)         |
| `-c, --config <file>`    | Use specified config file (`string`)                 |
| `--base <path>`          | Public base path (default: `/`) (`string`)           |
| `-l, --logLevel <level>` | Info \| warn \| error \| silent (`string`)           |
| `--clearScreen`          | Allow/disable clear screen when logging (`boolean`)  |
| `-d, --debug [feat]`     | Show debug logs (`string \| boolean`)                |
| `-f, --filter <filter>`  | Filter debug logs (`string`)                         |
| `-m, --mode <mode>`      | Set env mode (`string`)                              |
| `-h, --help`             | Display available CLI options                        |
