# Command Line Interface

## Dev server

### `vite`

Start Vite dev server in the current directory.

#### Usage

```bash
vite [root]
```

#### Options

| Options                  |                                                                   |
| ------------------------ | ----------------------------------------------------------------- |
| `--host [host]`          | Specify hostname (`string`)                                       |
| `--port <port>`          | Specify port (`number`)                                           |
| `--https`                | Use TLS + HTTP/2 (`boolean`)                                      |
| `--open [path]`          | Open browser on startup (`boolean \| string`)                     |
| `--cors`                 | Enable CORS (`boolean`)                                           |
| `--strictPort`           | Exit if specified port is already in use (`boolean`)              |
| `--force`                | Force the optimizer to ignore the cache and re-bundle (`boolean`) |
| `-c, --config <file>`    | Use specified config file (`string`)                              |
| `--base <path>`          | Public base path (default: `/`) (`string`)                        |
| `-l, --logLevel <level>` | Info \| warn \| error \| silent (`string`)                        |
| `--clearScreen`          | Allow/disable clear screen when logging (`boolean`)               |
| `--profile`              | Start built-in Node.js inspector                                  |
| `-d, --debug [feat]`     | Show debug logs (`string \| boolean`)                             |
| `-f, --filter <filter>`  | Filter debug logs (`string`)                                      |
| `-m, --mode <mode>`      | Set env mode (`string`)                                           |
| `-h, --help`             | Display available CLI options                                     |
| `-v, --version`          | Display version number                                            |

::: tip Start built-in Node.js inspector
If you suffer any application performance bottlenecks resulting in slow load times, you can start built-in Node.js inspector with your Vite dev server to profile your application:

```shell
vite --profile --open
```

Once your application is opened in the browser, await finish loading and then go back to the terminal and press `p` key (will stop the Node.js inspector) then press `q` key to stop the dev server.
Node.js inspector will generate `vite-profile-0.cpuprofile` in the root folder, go to https://www.speedscope.app/ and upload the cpu profile using the `BROWSE` button to inspector the result.
:::

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
| `--force`                      | Force the optimizer to ignore the cache and re-bundle (experimental)(`boolean`)                                     |
| `--emptyOutDir`                | Force empty outDir when it's outside of root (`boolean`)                                                            |
| `-w, --watch`                  | Rebuilds when modules have changed on disk (`boolean`)                                                              |
| `-c, --config <file>`          | Use specified config file (`string`)                                                                                |
| `--base <path>`                | Public base path (default: `/`) (`string`)                                                                          |
| `-l, --logLevel <level>`       | Info \| warn \| error \| silent (`string`)                                                                          |
| `--clearScreen`                | Allow/disable clear screen when logging (`boolean`)                                                                 |
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
| `--https`                | Use TLS + HTTP/2 (`boolean`)                         |
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
