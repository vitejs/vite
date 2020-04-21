# vue-dev-server

**⚠️ Warning: Experimental ⚠️**

```bash
npx -p @vue/dev-server vds
```

## How It Works

Imports are requested by the browser as native ES module imports - there's no bundling.

The server intercepts requests to *.vue files, compiles them on the fly, and sends them back as JavaScript.

For libraries that provide ES modules builds that work in browsers, just directly import them from a CDN.

Imports to npm packages inside .js files (package name only) are re-written on the fly to point to locally installed files. Currently, only vue is supported as a special case. Other packages will likely need to be transformed to be exposed as a native browser-targeting ES module.
