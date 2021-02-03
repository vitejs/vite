# 静态资源处理

- 相关: [公共基础路径](./build#公共基础路径)
- 相关: [`assetsInclude` 配置项](/zh/config/#assetsinclude)

## 将资源引入为 URL

服务时引入一个静态资源会返回解析后的公共路径：

```js
import imgUrl from './img.png'
document.getElementById('hero-img').src = imgUrl
```

例如，`imgUrl` 在开发时会是 `/img.png`，在生产构建后会是 `/assets/img.2d8efhg.png`。

行为类似于 Webpack 的 `file-loader`。区别在于导入既可以使用绝对公共路径（基于开发期间的项目根路径），也可以使用相对路径。

- `url()` 在 CSS 中的引用也以同样的方式处理。

- 如果 Vite 使用了 Vue 插件，Vue SFC 模板中的资源引用都将自动转换为导入。

- 常见的图像、媒体和字体文件类型被自动检测为资源。您可以使用 [`assetsInclude` 选项](/zh/config/#assetsinclude) 扩展内部列表。

- 引用的资源作为构建资源图的一部分包括在内，将生成散列文件名，并可以由插件进行处理以进行优化。

- 较小的资源体积小于 [`assetsInlineLimit` 选项值](/zh/config/#assetsinlinelimit) 则会被内联为 base64 data URL。

### 显式 URL 引入

未被包含在内部列表中的、或者在 `assetsInclude` 中的资源，可以使用 `?url` 后缀导入为一个 URL。这十分有用，例如，要导入 [Houdini Paint Worklets](https://houdini.how/usage) 时：

```js
import workletURL from 'extra-scalloped-border/worklet.js?url'
CSS.paintWorklet.addModule(workletURL)
```

### `public` 目录

如果你有下列这些资源：

- 不会被源代码引用（例如 `robots.txt`）
- 必须保持原有文件名（没有经过 hash）
- ...或者您只是不想为了获取 URL 而首先导入该资源

那么你可以将该资源放在一个特别的 `public` 目录中，它应位于你的项目根目录。该目录中的资源应该在开发时能直接通过 `/` 根路径访问到，并且打包时会被完整复制到目标目录的根目录下。

目录默认是 `<root>/public`，但可以通过 [`publicDir` 选项](/zh/config/#publicdir) 来配置。

请注意：

- 引入 `public` 中的资源永远应该使用根绝对路径 - 举个例子，`public/icon.png` 应该在源代码中被引用为 `/icon.png`。
- `public` 中的资源不应该被 JavaScript 文件引用。
