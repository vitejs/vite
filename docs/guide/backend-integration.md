# Backend Integration

If you want to serve the HTML using a traditional backend (e.g. Rails, Laravel) but use Vite for serving assets, here's what you can do:

1. In your Vite config, configure the entry and enable build manifest:

   ```js
   // vite.config.js
   export default {
     build: {
       manifest: true,
       rollupOptions: {
         // overwrite default .html entry
         input: '/path/to/main.js'
       }
     }
   }
   ```

2. For development, inject the following in your server's HTML template (substitute `http://localhost:3000` with the local URL Vite is running at):

   ```html
   <!-- if development -->
   <script type="module" src="http://localhost:3000/@vite/client"></script>
   <script type="module" src="http://localhost:3000/main.js"></script>
   ```

   Also make sure the server is configured to serve static assets in the Vite working directory, otherwise assets such as images won't be loaded properly.

3. For production: after running `vite build`, a `manifest.json` file will be generated alongside other asset files. You can use this file to render links with hashed filenames (note: the syntax here is for explanation only, substitute with your server templating language):

   ```html
   <!-- if production -->
   <link rel="stylesheet" href="/assets/{{ manifest['style.css'].file }}" />
   <script type="module" src="/assets/{{ manifest['index.js'].file }}"></script>
   ```
