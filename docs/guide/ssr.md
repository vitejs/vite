# Server-Side Rendering

:::tip Note
SSR specifically refers to front-end frameworks (for example React, Preact, Vue, and Svelte) that support running the same application in Node.js, pre-rendering it to HTML, and finally hydrating it on the client. If you are looking for integration with traditional server-side frameworks, check out the [Backend Integration guide](./backend-integration) instead.

The following guide also assumes prior experience working with SSR in your framework of choice, and will only focus on Vite-specific integration details.
:::

:::warning Low-level API
This is a low-level API meant for library and framework authors. If your goal is to create an application, make sure to check out the higher-level SSR plugins and tools at [Awesome Vite SSR section](https://github.com/vitejs/awesome-vite#ssr) first. That said, many applications are successfully built directly on top of Vite's native low-level API.
:::

:::tip Help
If you have questions, the community is usually helpful at [Vite Discord's #ssr channel](https://discord.gg/PkbxgzPhJv).
:::

## Example Projects

Vite provides built-in support for server-side rendering (SSR). The Vite playground contains example SSR setups for Vue 3 and React, which can be used as references for this guide:

- [Vue 3](https://github.com/vitejs/vite-plugin-vue/tree/main/playground/ssr-vue)
- [React](https://github.com/vitejs/vite-plugin-react/tree/main/playground/ssr-react)

## Source Structure

A typical SSR application will have the following source file structure:

```
- index.html
- server.js # main application server
- src/
  - main.js          # exports env-agnostic (universal) app code
  - entry-client.js  # mounts the app to a DOM element
  - entry-server.js  # renders the app using the framework's SSR API
```

The `index.html` will need to reference `entry-client.js` and include a placeholder where the server-rendered markup should be injected:

```html
<div id="app"><!--ssr-outlet--></div>
<script type="module" src="/src/entry-client.js"></script>
```

You can use any placeholder you prefer instead of `<!--ssr-outlet-->`, as long as it can be precisely replaced.

## Conditional Logic

If you need to perform conditional logic based on SSR vs. client, you can use

```js
if (import.meta.env.SSR) {
  // ... server only logic
}
```

This is statically replaced during build so it will allow tree-shaking of unused branches.

## Setting Up the Dev Server

When building an SSR app, you likely want to have full control over your main server and decouple Vite from the production environment. It is therefore recommended to use Vite in middleware mode. Here is an example with [express](https://expressjs.com/):

**server.js**

```js{15-18}
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })

  // Use vite's connect instance as middleware. If you use your own
  // express router (express.Router()), you should use router.use
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    // serve index.html - we will tackle this next
  })

  app.listen(5173)
}

createServer()
```

Here `vite` is an instance of [ViteDevServer](./api-javascript#vitedevserver). `vite.middlewares` is a [Connect](https://github.com/senchalabs/connect) instance which can be used as a middleware in any connect-compatible Node.js framework.

The next step is implementing the `*` handler to serve server-rendered HTML:

```js
app.use('*', async (req, res, next) => {
  const url = req.originalUrl

  try {
    // 1. Read index.html
    let template = fs.readFileSync(
      path.resolve(__dirname, 'index.html'),
      'utf-8',
    )

    // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
    //    and also applies HTML transforms from Vite plugins, e.g. global
    //    preambles from @vitejs/plugin-react
    template = await vite.transformIndexHtml(url, template)

    // 3. Load the server entry. ssrLoadModule automatically transforms
    //    ESM source code to be usable in Node.js! There is no bundling
    //    required, and provides efficient invalidation similar to HMR.
    const { render } = await vite.ssrLoadModule('/src/entry-server.js')

    // 4. render the app HTML. This assumes entry-server.js's exported
    //     `render` function calls appropriate framework SSR APIs,
    //    e.g. ReactDOMServer.renderToString()
    const appHtml = await render(url)

    // 5. Inject the app-rendered HTML into the template.
    const html = template.replace(`<!--ssr-outlet-->`, appHtml)

    // 6. Send the rendered HTML back.
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    // If an error is caught, let Vite fix the stack trace so it maps back
    // to your actual source code.
    vite.ssrFixStacktrace(e)
    next(e)
  }
})
```

The `dev` script in `package.json` should also be changed to use the server script instead:

```diff
  "scripts": {
-   "dev": "vite"
+   "dev": "node server"
  }
```

## Building for Production

To ship an SSR project for production, we need to:

1. Produce a client build as normal;
2. Produce an SSR build, which can be directly loaded via `import()` so that we don't have to go through Vite's `ssrLoadModule`;

Our scripts in `package.json` will look like this:

```json
{
  "scripts": {
    "dev": "node server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js"
  }
}
```

Note the `--ssr` flag which indicates this is an SSR build. It should also specify the SSR entry.

Then, in `server.js` we need to add some production specific logic by checking `process.env.`<wbr>`NODE_ENV`:

- Instead of reading the root `index.html`, use the `dist/client/index.html` as the template instead, since it contains the correct asset links to the client build.

- Instead of `await vite.ssrLoadModule('/src/entry-server.js')`, use `import('./dist/server/entry-server.js')` instead (this file is the result of the SSR build).

- Move the creation and all usage of the `vite` dev server behind dev-only conditional branches, then add static file serving middlewares to serve files from `dist/client`.

Refer to the [Vue](https://github.com/vitejs/vite-plugin-vue/tree/main/playground/ssr-vue) and [React](https://github.com/vitejs/vite-plugin-react/tree/main/playground/ssr-react) demos for a working setup.

## Generating Preload Directives

`vite build` supports the `--ssrManifest` flag which will generate `ssr-manifest.json` in build output directory:

```diff
- "build:client": "vite build --outDir dist/client",
+ "build:client": "vite build --outDir dist/client --ssrManifest",
```

The above script will now generate `dist/client/ssr-manifest.json` for the client build (Yes, the SSR manifest is generated from the client build because we want to map module IDs to client files). The manifest contains mappings of module IDs to their associated chunks and asset files.

To leverage the manifest, frameworks need to provide a way to collect the module IDs of the components that were used during a server render call.

`@vitejs/plugin-vue` supports this out of the box and automatically registers used component module IDs on to the associated Vue SSR context:

```js
// src/entry-server.js
const ctx = {}
const html = await vueServerRenderer.renderToString(app, ctx)
// ctx.modules is now a Set of module IDs that were used during the render
```

In the production branch of `server.js` we need to read and pass the manifest to the `render` function exported by `src/entry-server.js`. This would provide us with enough information to render preload directives for files used by async routes! See [demo source](https://github.com/vitejs/vite-plugin-vue/blob/main/playground/ssr-vue/src/entry-server.js) for a full example. You can also use this information for [103 Early Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103).

## Pre-Rendering / SSG

If the routes and the data needed for certain routes are known ahead of time, we can pre-render these routes into static HTML using the same logic as production SSR. This can also be considered a form of Static-Site Generation (SSG). See [demo pre-render script](https://github.com/vitejs/vite-plugin-vue/blob/main/playground/ssr-vue/prerender.js) for working example.

## SSR Externals

Dependencies are "externalized" from Vite's SSR transform module system by default when running SSR. This speeds up both dev and build.

If a dependency needs to be transformed by Vite's pipeline, for example, because Vite features are used untranspiled in them, they can be added to [`ssr.noExternal`](../config/ssr-options.md#ssr-noexternal).

For linked dependencies, they are not externalized by default to take advantage of Vite's HMR. If this isn't desired, for example, to test dependencies as if they aren't linked, you can add it to [`ssr.external`](../config/ssr-options.md#ssr-external).

:::warning Working with Aliases
If you have configured aliases that redirect one package to another, you may want to alias the actual `node_modules` packages instead to make it work for SSR externalized dependencies. Both [Yarn](https://classic.yarnpkg.com/en/docs/cli/add/#toc-yarn-add-alias) and [pnpm](https://pnpm.js.org/en/aliases) support aliasing via the `npm:` prefix.
:::

## SSR-specific Plugin Logic

Some frameworks such as Vue or Svelte compile components into different formats based on client vs. SSR. To support conditional transforms, Vite passes an additional `ssr` property in the `options` object of the following plugin hooks:

- `resolveId`
- `load`
- `transform`

**Example:**

```js
export function mySSRPlugin() {
  return {
    name: 'my-ssr',
    transform(code, id, options) {
      if (options?.ssr) {
        // perform ssr-specific transform...
      }
    },
  }
}
```

The options object in `load` and `transform` is optional, rollup is not currently using this object but may extend these hooks with additional metadata in the future.

:::tip Note
Before Vite 2.7, this was informed to plugin hooks with a positional `ssr` param instead of using the `options` object. All major frameworks and plugins are updated but you may find outdated posts using the previous API.
:::

## SSR Target

The default target for the SSR build is a node environment, but you can also run the server in a Web Worker. Packages entry resolution is different for each platform. You can configure the target to be Web Worker using the `ssr.target` set to `'webworker'`.

## SSR Bundle

In some cases like `webworker` runtimes, you might want to bundle your SSR build into a single JavaScript file. You can enable this behavior by setting `ssr.noExternal` to `true`. This will do two things:

- Treat all dependencies as `noExternal`
- Throw an error if any Node.js built-ins are imported

## Vite CLI

The CLI commands `$ vite dev` and `$ vite preview` can also be used for SSR apps. You can add your SSR middlewares to the development server with [`configureServer`](/guide/api-plugin#configureserver) and to the preview server with [`configurePreviewServer`](/guide/api-plugin#configurepreviewserver).

:::tip Note
Use a post hook so that your SSR middleware runs _after_ Vite's middlewares.
:::

## SSR Format

By default, Vite generates the SSR bundle in ESM. There is experimental support for configuring `ssr.format`, but it isn't recommended. Future efforts around SSR development will be based on ESM, and CommonJS remains available for backward compatibility. If using ESM for SSR isn't possible in your project, you can set `legacy.buildSsrCjsExternalHeuristics: true` to generate a CJS bundle using the same [externalization heuristics of Vite v2](https://v2.vitejs.dev/guide/ssr.html#ssr-externals).
