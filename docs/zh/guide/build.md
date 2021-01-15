# 构建生产版本

当需要将应用程序部署到生产环境时，只需运行 `vite build` 命令。默认情况下，它使用 `<root>/index.html` 作为构建入口点，并生成一个适合通过静态部署的应用程序包。

## 浏览器兼容性

生产版本假设浏览器对 [原生 ES 模块动态导入](https://caniuse.com/es6-module-dynamic-import) 有基本支持。默认情况下，所有代码构建都会以 [支持原生 ESM script 标签的浏览器](https://caniuse.com/es6-module) 为目标。

一个轻量级的 [动态导入 polyfill](https://github.com/GoogleChromeLabs/dynamic-import-polyfill) 也会同时自动注入。

你也可以通过 [`build.target` 配置项](/zh/config/#build-target) 指定构建目标，最低支持 `es2015`。

- Chrome >=61
- Firefox >=60
- Safari >=11
- Edge >=16

请注意，默认情况下 Vite 只处理语法转译，并 **不默认包含任何 polyfill**。你可以前往 [Polyfill.io](https://polyfill.io/v3/) 查看，这是一个基于用户浏览器 User-Agent 字符串自动生成 polyfill 包的服务。

传统浏览器可以通过插件 [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) 来支持，它将自动生成传统版本的 chunk 和其相应 ES 语言特性方面的 polyfill。兼容版的 chunk 只会在不支持原生 ESM 的浏览器中有按需加载。

## public base 路径

- 相关内容：[资源处理](./features#asset-handling)

如果您正在嵌套的公共路径下部署项目，可以简单指定一个 [`build.base` 配置项](/zh/config/#build-base) 然后所有资源的路径都将据此重写。这个选项也可以通过命令行参数指定，例如 `vite build --base=/my/public/path/`。

由 JS 导入的资源路径，CSS 中的 `url()` 引用，和 `.html` 文件中的资源引用在构建过程中都会自动调整以适配此选项。

例外情况是需要动态连接 url。在这种情况下，你可以使用全局注入的 `import.meta.env.BASE_URL` 变量，它将是 public base 路径。注意这个变量在构建中是被静态替换的所以它必须是原本的样子（例如 `import.meta.env['BASE_URL']` 是无效的）

## 自定义构建

构建过程可以通过多种 [构建配置选项](/zh/config/#build-options) 来自定义。特别地，你可以通过 `build.rollupOptions` 直接调整底层的 [Rollup 选项](https://rollupjs.org/guide/en/#big-list-of-options)：

```js
// vite.config.js
module.exports = {
  build: {
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
    }
  }
}
```

例如，您可以使用仅在构建期间应用的插件来指定多个 Rollup 输出。

## 多页面应用模式

假设你有下面这样的项目文件结构

```
|-package.json
|-vite.config.js
|-index.html
|-main.js
|-nested/
|---index.html
|---nested.js
```

在开发中，简单地导航或链接到 `/nested/` - 将会按预期工作，就如同一个正常的静态文件服务器。

在构建中，你要做的只有指定多个 `.html` 文件作为入口点：

```js
// vite.config.js
const { resolve } = require('path')

module.exports = {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'nested/index.html')
      }
    }
  }
}
```

## 库模式

当您开发面向浏览器的库时，您可能会将大部分时间花在该库的测试/演示页面上。使用 Vite，你可以使用 `index.html` 来获得如丝般顺滑的开发体验。

当需要构建你的库用于发布时，请使用 [`build.lib` 配置项](/zh/config/#build-lib)，请确保将你不想打包进你库中的依赖进行外部化，例如 `vue` 或 `react`：

```js
// vite.config.js
const path = require('path')

module.exports = {
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'MyLib'
    },
    rollupOptions: {
      external: ['vue']
    }
  }
}
```

运行 `vite build` 配合如上配置将会使用一套 Rollup 预设，为发行该库提供两种构建格式：`es` 和 `umd`（在 `build.lib` 中配置的）：

```
$ vite build
building for production...
[write] my-lib.es.js 0.08kb, brotli: 0.07kb
[write] my-lib.umd.js 0.30kb, brotli: 0.16kb
```

推荐你的库中 `package.json` 的采用如下格式:

```json
{
  "name": "my-lib",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.js",
  "module": "./dist/my-lib.es.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.es.js",
      "require": "./dist/my-lib.umd.js"
    }
  }
}
```
