# Plugin API

Vite plugins extends Rollup's well-designed plugin interface with a few extra vite-specific options. As a result, you can write a Vite plugin once and have it work for both dev and build.

**It is recommended to go through [Rollup's plugin documentation](https://rollupjs.org/guide/en/#plugin-development) first before reading the sections below.**

## Simple Examples

:::tip
It is common convention to author a Vite/Rollup plugin as a factory function that returns the actual plugin object. The function can accept options which allows users to customize the behavior of the plugin.
:::

### Serving a Virtual File

```js
export default function myPlugin() {
  const vitualFileId = '@my-virtual-file'

  return {
    name: 'my-plugin', // required, will show up in warnings and errors
    resolveId(id) {
      if (id === vitualFileId) {
        return vitualFileId
      }
    },
    load(id) {
      if ((id === vitualFileId)) {
        return `export const msg = "from virtual file"`
      }
    }
  }
}
```

### Transforming Custom File Types

```js
export default function myPlugin() {
  return {
    name: 'transform-file',
    transform(src, id) {
      if (!/\.(my-file-ext)$/.test(id)) {
        return {
          code: compileFileToJS(src),
          map: null // provide source map if available
        }
      }
    }
  }
}
```

## Universal Hooks

During dev, the Vite dev server creates a plugin container that invokes [Rollup Build Hooks](https://rollupjs.org/guide/en/#build-hooks) the same way Rollup does it.

The following hooks are called once on server start:

- [`options`](https://rollupjs.org/guide/en/#options)
- [`buildStart`](https://rollupjs.org/guide/en/#buildstart)

The following hooks are called on each incoming module request:

- [`resolveId`](https://rollupjs.org/guide/en/#resolveid)
- [`load`](https://rollupjs.org/guide/en/#load)
- [`transform`](https://rollupjs.org/guide/en/#transform)

The following hooks are called when the server is closed:

- [`buildEnd`](https://rollupjs.org/guide/en/#buildend)
- [`closeBundle`](https://rollupjs.org/guide/en/#closebundle)

Note that the [`moduleParsed`](https://rollupjs.org/guide/en/#moduleparsed) hook is **not** called during dev, because Vite avoids full AST parses for better performance.

[Output Generation Hooks](https://rollupjs.org/guide/en/#output-generation-hooks) (except `closeBundle`) are **not** called during dev. You can think of Vite's dev server as only calling `rollup.rollup()` without calling `bundle.generate()`.

## Vite Specific Hooks

Vite plugins can also provide hooks that serve Vite-specific purposes. These hooks are ignored by Rollup.

### `config`

- **Type:** `(config: UserConfig) => UserConfig | null | void`
- **Kind:** `sync`, `sequential`

  Modify Vite config before it's resolved. The hook receives the raw user config (CLI options merged with config file). It can return a partial config object that will be deeply merged into existing config, or directly mutate the config (if the default merging cannot achieve the desired result).

  **Example**

  ```js
  // return partial config (recommended)
  const partialConfigPlugin = () => ({
    name: 'return-partial',
    config: () => ({
      alias: {
        foo: 'bar'
      }
    })
  })

  // mutate the config directly (use only when merging doesn't work)
  const mutateConfigPlugin = () => ({
    name: 'mutate-config',
    config(config) {
      config.root = __dirname
    }
  })
  ```

  ::: warning Note
  User plugins are resolved before running this hook so injecting other plugins inside the `config` hook will have no effect.
  :::

### `configResolved`

- **Type:** `(config: ResolvedConfig) => void`
- **Kind:** `sync`, `sequential`

  Called after the Vite config is resolved. Use this hook to read and store the final resolved config. It is also useful when the plugin needs to do something different based the command is being run.

  **Example:**

  ```js
  const exmaplePlugin = () => {
    let config

    return {
      name: 'read-config',

      configResolved(resolvedConfig) {
        // store the resolved config
        config = resolvedConfig
      },

      // use stored config in other hooks
      transform(code, id) {
        if (config.command === 'serve') {
          // serve: plugin invoked by dev server
        } else {
          // build: plugin invoked by Rollup
        }
      }
    }
  }
  ```

### `configureServer`

- **Type:** `(server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>`
- **Kind:** `async`, `sequential`
- **See also:** [ViteDevServer](./api-javascript#vitedevserver)

  Hook for configuring the dev server. The most common use case is adding custom middlewares to the internal [connect](https://github.com/senchalabs/connect) app:

  ```js
  const myPlugin = () => ({
    name: 'configure-server',
    configureServer(server) {
      server.app.use((req, res, next) => {
        // custom handle request...
      })
    }
  })
  ```

  **Injecting Post Middleware**

  The `configureServer` hook is called before internal middlewares are installed, so the custom middlewares will run before internal middlewares by default. If you want to inject a middleware **after** internal middlewares, you can return a function from `configureServer`, which will be called after internal middlewares are installed:

  ```js
  const myPlugin = () => ({
    name: 'configure-server',
    configureServer(server) {
      // return a post hook that is called after internal middlewares are
      // installed
      return () => {
        server.app.use((req, res, next) => {
          // custom handle request...
        })
      }
    }
  })
  ```

  **Storing Server Access**

  In some cases, other plugin hooks may need access to the dev server instance (e.g. accessing the web socket server, the file system watcher, or the module graph). This hook can also be used to store the server instance for access in other hooks:

  ```js
  const myPlugin = () => {
    let server
    return {
      name: 'configure-server',
      configureServer(_server) {
        server = _server
      },
      transform(code, id) {
        if (server) {
          // use server...
        }
      }
    }
  }
  ```

  Note `configureServer` is not called when running the production build so your other hooks need to guard against its absence.

### `transformIndexHtml`

- **Type:** `IndexHtmlTransformHook | { enforce?: 'pre' | 'post' transform: IndexHtmlTransformHook }`
- **Kind:** `async`, `sequential`

  Dedicated hook for transforming `index.html`. The hook receives the current HTML string and a transform context. The context exposes the [`ViteDevServer`](./api-javascript#vitedevserver) instance during dev, and exposes the Rollup output bundle during build.

  The hook can be async and can return one of the following:

  - Transformed HTML string
  - An array of tag descriptor objects (`{ tag, attrs, children }`) to inject to the existing HTML. Each tag can also specify where it should be injected to (default is prepending to `<head>`)
  - An object containing both as `{ html, tags }`

  **Basic Example**

  ```js
  const htmlPlugin = () => {
    return {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          /<title>(.*?)<\/title>/,
          `<title>Title replaced!</title>`
        )
      }
    }
  }
  ```

  **Full Hook Signature:**

  ```ts
  type IndexHtmlTransformHook = (
    html: string,
    ctx: {
      path: string
      filename: string
      server?: ViteDevServer
      bundle?: OutputBundle
    }
  ) =>
    | IndexHtmlTransformResult
    | void
    | Promise<IndexHtmlTransformResult | void>

  type IndexHtmlTransformResult =
    | string
    | HtmlTagDescriptor[]
    | {
        html: string
        tags: HtmlTagDescriptor[]
      }

  interface HtmlTagDescriptor {
    tag: string
    attrs?: Record<string, string>
    children?: string | HtmlTagDescriptor[]
    /**
     * default: 'head-prepend'
     */
    injectTo?: 'head' | 'body' | 'head-prepend'
  }
  ```

### `handleHotUpdate`

- **Type:** `(ctx: HmrContext) => Array<ModuleNode> | void | Promise<Array<ModuleNode> | void>`

  Perform custom HMR update handling. The hook receives a context object with the following signature:

  ```ts
  interface HmrContext {
    file: string
    timestamp: number
    modules: Array<ModuleNode>
    read: () => string | Promise<string>
    server: ViteDevServer
  }
  ```

  - `modules` is an array of modules that are affected by the changed file. It's an array because a single file may map to multiple served modules (e.g. Vue SFCs).

  - `read` is an async read function that returns the content of the file. This is provided because on some systems, the file change callback may fire too fast before the editor finishes updating the file and direct `fs.readFile` will return empty content. The read function passed in normalizes this behavior.

  The hook can choose to:

  - Filter and narrow down the affected module list so that the HMR is more accurate.

  - Return an empty array and perform complete custom HMR handling by sending custom events to the client:

    ```js
    handleHotUpdate({ server }) {
      server.ws.send({
        type: 'custom',
        event: 'special-update',
        data: {}
      })
      return []
    }
    ```

    Client code should register corresponding handler using the [HMR API](./api-hmr) (this could be injected by the same plugin's `transform` hook):

    ```js
    if (import.meta.hot) {
      import.meta.hot.on('special-update', (data) => {
        // perform custom update
      })
    }
    ```

## Plugin Ordering

A Vite plugin can additionally specify an `enforce` property (similar to webpack loaders) to adjust its application order. The value of `enforce` can be either `"pre"` or `"post"`. The resolved plugins will be in the following order:

- Alias
- User plugins with `enforce: 'pre'`
- Vite internal plugins
- User plugins without enforce value
- Vite build-specific plugins
- User plugins with `enforce: 'post'`

## Rollup Plugin Compatiblity

A fair number of Rollup plugins will work directly as a Vite plugin (e.g. `@rollup/plugin-alias` or `@rollup/plugin-json`), but not all of them, since some plugin hooks do not make sense in an unbundled dev server context.

In general, as long as a rollup plugin fits the following criterias then it should just work as a Vite plugin:

- It doesn't use the [`moduleParsed`](https://rollupjs.org/guide/en/#moduleparsed) hook.
- It doesn't have strong coupling between bundle-phase hooks and output-phase hooks.

If a Rollup plugin only makes sense for the build phase, then it can be specified under `build.rollupOptions.plugins` instead.
