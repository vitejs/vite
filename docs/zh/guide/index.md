# 开始

如果你有兴趣在尝试之前了解更多关于 Vite 的信息，请移步 [介绍](./introduction) 章节。

## 第一个 Vite 项目

::: tip 兼容性注意
Vite 需要 [Node.js](https://nodejs.org/en/) 版本 >= 12.0.0。
:::

使用 NPM:

```bash
npm init @vitejs/app
```

使用 Yarn:

```bash
yarn create @vitejs/app
```

然后按照提示操作即可！

您还可以通过附加的命令行选项直接指定项目名称和您想要使用的模板。例如，要构建一个 Vite + Vue 项目，运行:

```bash
npm init @vitejs/app my-vue-app --template vue
```

支持的模板预设包括：

- `vue`
- `vue-ts`
- `react`
- `react-ts`

查看 [@vitejs/create-app](https://github.com/vitejs/vite/tree/main/packages/create-app) 获取每个模板的更多细节。

## 命令行接口

在安装了 Vite 的项目中，可以在 npm scripts 中使用 `vite` 可执行文件，或者直接使用 `npx vite` 运行它。下面是通过脚手架创建的 Vite 项目中默认的 npm scripts：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

可以指定额外的命令行选项，如 `--port` 或 `--https`。运行 `npx vite --help` 获得完整的命令行选项列表。

## 项目根目录

由于 Vite 是一个开发服务器，对所服务的文件 “根目录” 的概念，类似于静态文件服务器（不过功能更强大）。

运行 `vite` 后会使用当前工作目录作为根目录启动一个开发服务器。可以使用 `vite serve some/sub/dir` 指定一个替代的根目录。

当用浏览器访问服务器的本地地址，Vite 则会打开 **`<root>/index.html`**。它也被用作默认的构建入口点。与一些把 HTML 作后置处理的打包程序不同，Vite 把 HTML 文件作为应用程序图的一部分（类似于 Parcel）。因此，应该将 `index.html` 作为源代码的一部分，而不只是一个静态文件。Vite 还支持多个 `.html` 的入口点的 [多页应用程序](./build#多页面应用)。

如果存在 **`<root>/vite.config.js`**，Vite 会自动启用，也可以通过命令行选项 `--config <file>` 显式指定一个要使用的配置文件。

与静态文件服务器不同，Vite 实际上可以解析和服务文件系统上任何地方的依赖项，即使它们不在项目根目录下。这使得 Vite 可以在 monorepo 的子包中正常工作。

## 使用未发布的特性

如果等不及一个新版本来测试最新的特性，可以自行克隆 [vite 仓库](https://github.com/vitejs/vite) 到本地机器上然后将其自行链接（将需要 [Yarn 1.x](https://classic.yarnpkg.com/lang/en/)）：

```bash
git clone https://github.com/vitejs/vite.git
cd vite
yarn
cd packages/vite
yarn build
yarn link
```

然后回到基于 vite 的项目并运行 `yarn link vite`。重新启动开发服务器（`yarn dev`）来体验最前沿功能吧！
