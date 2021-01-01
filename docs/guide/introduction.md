# Introduction

## Overview

Vite (French word for "fast", pronounced `/vit/`) is a new breed of frontend build tool that significantly improves the frontend development experience. It consists of two major parts:

- A dev server that serves your source files over [native ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), with [rich built-in features](./features) and astonishingly fast [Hot Module Replacement (HMR)](./features#hot-module-replacement).

- A [build command](./build) that bundles your code with [Rollup](https://rollupjs.org), pre-configured to output highly optimized static assets for production.

In addition, Vite is highly extensible via its [Plugin API](./api-plugin) and [JavaScript API](./api-javascript) with full typing support.

## Why native ESM

Today most JavaScript developers are familiar with the following ES modules syntax:

```js
import { foo } from './other-module'
```

Today, this syntax has [wide native support in major browsers](https://caniuse.com/es6-module). However, before browsers had native support for ES modules, we had to rely on bundlers (Browserify, webpack, Parcel or Rollup) to combine all our module source code into a single file so that it can be served by the browser, even during development.

There are two downsides to bundling during development:

- **Slow server start:** When starting the dev server, the bundler always eagerly crawls your entire application, even when there are code-split points present. For example, in an application with a dozen routes where ecah route is lazy loaded, you still have to wait for the bundler to process every single file in your app before you can start working on a single route page.

  ![bundler based dev server](/images/bundler.png)

  **How Vite solves it:** There's no preparation work to be done on server start - Vite simply compiles and serves the files on-demand as the requests come in from the browser. In code-split applications, only modules used by the current route page needs to be served.

  ![esm based dev server](/images/esm.png)

- **Slow updates:** When a file is edited, in addition to re-building the file itself, the bundler also needs to invalidate part of its module graph and re-construct the entire bundle. This means the feedback speed between saving a file and seeing the changes reflected in the browser deteriorates linearly as the size of your application grows. In large applications, this bundle re-constrction step can become prohibitively expensive even with Hot Module Replacement enabled.

  **How Vite solves it:** Every served file is cached via HTTP headers (304 Not Modified whenever possible) and, if browser cache is disabled, Vite's in-memory cache. On file edits, we simply invalidate the cache for that file. In addition, [Hot Module Replacement](./features#hot-module-replacement) over native ESM only needs to precisely re-fetch the invalidated modules, making it consistently fast regardless of the size of your application.

Once you experience how fast Vite is, we highly doubt you'd be willing to put up with bundled development again.

## Why Bundle for Production

Even though native ESM is now widely supported, shipping unbundled ESM in production is still inefficient (even with HTTP/2) due to the additional network round trips caused by nested imports. To get the optimal loading performance in production, it is still better to bundle your code with tree-shaking, lazy-loading and common chunk splitting (for better caching).

Ensuring optimal output and behavioral consistency between the dev server and the production build isn't easy. This is why Vite ships with a pre-configured [build command](./build) that does this out of the box.

## Browser Support

- Vite requires [native ES module support](https://caniuse.com/#feat=es6-module) during development.

- The production build assumes a baseline support for [Native ES modules dynamic imports](https://caniuse.com/es6-module-dynamic-import). Legacy browsers can be supported via plugins that post-process the build output for compatibility. More details in the [Building for Production](./build) section.
