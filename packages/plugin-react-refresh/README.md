# @vitejs/plugin-react-refresh [![npm](https://img.shields.io/npm/v/@vitejs/plugin-react-refresh.svg)](https://npmjs.com/package/@vitejs/plugin-react-refresh)

Provides [React Refresh](https://www.npmjs.com/package/react-refresh) support for Vite.

```js
// vite.config.js
import reactRefresh from '@vitejs/plugin-react-refresh'

export default {
  plugins: [reactRefresh()]
}
```

## Specifying Additional Parser Plugins

If you are using ES syntax that are still in proposal status (e.g. class properties), you can selectively enable them via the `parserPlugins` option:

```js
export default {
  plugins: [reactRefresh({
    parserPlugins: [
      'classProperties',
      'classPrivateProperties
    ]
  })]
}
```

[Full list of Babel parser plugins](https://babeljs.io/docs/en/babel-parser#ecmascript-proposalshttpsgithubcombabelproposals).

**Notes**

- If using TSX, any TS-supported syntax will already be transpiled away so you won't need to specify them here.

- This option only enables the plugin to parse these syntax - it does not perform any transpilation since this plugin is dev-only.

- If you wish to transpile the syntax for production, you will need to configure the transform separately using [@rollup/plugin-babel](https://github.com/rollup/plugins/tree/master/packages/babel) as a build-only plugin.

## Middleware Mode Notes

When Vite is launched in **Middleware Mode**, you need to make sure your entry `index.html` file is transformed with `ViteDevServer.transformIndexHtml`. Otherwise, you may get an error prompting `Uncaught Error: vite-plugin-react can't detect preamble. Something is wrong.`

To mitigate this issue, you can explicitly transform your `index.html` like this when configuring your express server:

```ts
app.get('/', async (req, res, next) => {
  try {
    let html = fs.readFileSync(
      path.resolve(root, 'index.html'),
      'utf-8'
    );
    html = await viteServer.transformIndexHtml(req.url, html);
    res.send(html);
  } catch (e) {
    return next(e);
  }
});
```
