# Backend Integration

:::tip Note
If you want to serve the HTML using a traditional backend (e.g. Rails, Laravel) but use Vite for serving assets, check for existing integrations listed in [Awesome Vite](https://github.com/vitejs/awesome-vite#integrations-with-backends).

If you need a custom integration, you can follow the steps in this guide to configure it manually
:::

1. In your Vite config, configure the entry and enable build manifest:

   ```js
   // vite.config.js
   export default defineConfig({
     build: {
       // generate manifest.json in outDir
       manifest: true,
       rollupOptions: {
         // overwrite default .html entry
         input: '/path/to/main.js'
       }
     }
   })
   ```

   If you haven't disabled the [module preload polyfill](/config/build-options.md#build-polyfillmodulepreload), you also need to import the polyfill in your entry

   ```js
   // add the beginning of your app entry
   import 'vite/modulepreload-polyfill'
   ```

2. For development, inject the following in your server's HTML template (substitute `http://localhost:5173` with the local URL Vite is running at):

   ```html
   <!-- if development -->
   <script type="module" src="http://localhost:5173/@vite/client"></script>
   <script type="module" src="http://localhost:5173/main.js"></script>
   ```

   In order to properly serve assets, you have two options:

   - Make sure the server is configured to proxy static assets requests to the Vite server
   - Set [`server.origin`](/config/server-options.md#server-origin) so that generated asset URLs will be resolved using the back-end server URL instead of a relative path

   This is needed for assets such as images to load properly.

   Note if you are using React with `@vitejs/plugin-react`, you'll also need to add this before the above scripts, since the plugin is not able to modify the HTML you are serving:

   ```html
   <script type="module">
     import RefreshRuntime from 'http://localhost:5173/@react-refresh'
     RefreshRuntime.injectIntoGlobalHook(window)
     window.$RefreshReg$ = () => {}
     window.$RefreshSig$ = () => (type) => type
     window.__vite_plugin_react_preamble_installed__ = true
   </script>
   ```

3. For production: after running `vite build`, a `manifest.json` file will be generated alongside other asset files. An example manifest file looks like this:

   ```json
   {
     "main.js": {
       "file": "assets/main.4889e940.js",
       "src": "main.js",
       "isEntry": true,
       "dynamicImports": ["views/foo.js"],
       "css": ["assets/main.b82dbe22.css"],
       "assets": ["assets/asset.0ab0f9cd.png"]
     },
     "views/foo.js": {
       "file": "assets/foo.869aea0d.js",
       "src": "views/foo.js",
       "isDynamicEntry": true,
       "imports": ["_shared.83069a53.js"]
     },
     "_shared.83069a53.js": {
       "file": "assets/shared.83069a53.js"
     }
   }
   ```

   - The manifest has a `Record<name, chunk>` structure
   - For entry or dynamic entry chunks, the key is the relative src path from project root.
   - For non entry chunks, the key is the base name of the generated file prefixed with `_`.
   - Chunks will contain information on its static and dynamic imports (both are keys that maps to the corresponding chunk in the manifest), and also its corresponding CSS and asset files (if any).

   You can use this file to render links or preload directives with hashed filenames (note: the syntax here is for explanation only, substitute with your server templating language):

   ```html
   <!-- if production -->
   <link rel="stylesheet" href="/assets/{{ manifest['main.js'].css }}" />
   <script type="module" src="/assets/{{ manifest['main.js'].file }}"></script>
   ```
