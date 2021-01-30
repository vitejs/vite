# 依赖预构建

当你首次启动 `vite` 时，你可能会注意到打印出了以下信息：

```
Optimizable dependencies detected: （侦测到可优化的依赖：）
react, react-dom
Pre-bundling them to speed up dev server page load...（将预构建它们以提升开发服务器页面加载速度）
(this will be run only when your dependencies have changed)（这将只会在你的依赖发生变化时执行）
```

## 原因

这就是 Vite 执行的所谓的“依赖预绑定”。这个过程有两个目的:

1. **CommonJS 和 UMD 兼容性:** 开发阶段中，Vite 的开发服务器将所有代码视为原生 ES 模块。因此，Vite 必须先将作为 CommonJS 或 UMD 发布的依赖项转换为 ESM。

   当转换 CommonJS 依赖时，Vite 会执行智能导入分析，这样即使导出是动态分配的（如 React），动态导入也会符合预期效果：

   ```js
   // 符合预期
   import React, { useState } from 'react'
   ```

2. **性能：** Vite 将有许多内部模块的 ESM 依赖关系转换为单个模块，以提高后续页面加载性能。

   一些包将它们的 ES 模块构建作为许多单独的文件相互导入。例如，[`lodash-es` 有超过 600 个内置模块](https://unpkg.com/browse/lodash-es/)！当我们执行 `import { debounce } from 'lodash-es` 时，浏览器同时发出 600 多个 HTTP 请求！尽管服务器在处理这些请求时没有问题，但大量的请求会在浏览器端造成网络拥塞，导致页面的加载速度相当慢。

   通过预构建 `lodash-es` 成为一个模块，我们就只需要一个 HTTP 请求了！

## 自动依赖搜寻

如果没有找到存在的缓存，Vite 将抓取你的源代码，并自动发现依赖项导入（即
"裸引入"，期望从 `node_modules` 解析），并使用这些发现的导入作为预构建包的入口点。预绑定是用 `esbuild` 执行的，所以它通常非常快。

在服务器已经启动之后，如果在缓存中没有遇到新的依赖项导入，Vite 将重新运行依赖构建进程并重新加载页面。

## 依赖兼容性

尽管 Vite 尽其所能来适应非 ESM 依赖关系，但仍有一些依赖关系不能开箱即用。最常见的就是那些导入 Node.js 内置模块的部分（例如 `os` 或 `path`），期望打包程序自动填补它们。这些包通常是在假设所有用户都将使用 `webpack` 的情况下编写的，但在针对浏览器环境时，这样的使用是没有意义的。

当使用 Vite 时，十分推荐总是选择那些提供 ESM 格式的依赖。这会使你的构建更快，由于出色有效的 tree-shaking，产物也会更小。

## Monorepo 和链接依赖

在一个 monorepo 启动中，该仓库中的某个依赖可能会成为另一个包的依赖。Vite 会自动侦测没有从 `node_modules` 解析的依赖项，并将链接的依赖视为源代码。它不会尝试打包被链接的依赖，而是会分析被链接依赖的依赖列表。

## 自定义行为

默认的依赖项发现为启发式可能并不总是可取的。在您想要显式地从列表中包含/排除依赖项的情况下, 使用 [`optimizeDeps` 配置项](/zh/config/#依赖优化选项)。

一个典型的用例对 `optimizeDeps.include` 或 `optimizeDeps.exclude` 是当您有一个不能直接在源代码中发现的导入时。例如，导入可能是插件转换的结果。这意味着 Vite 无法在初始扫描时发现导入 —— 它只能在浏览器请求文件并进行转换后发现它。这将导致服务器在启动后立即重新打包。

`include` 和 `exclude` 都可以用来处理这个问题。如果依赖项很大（包含很多内部模块）或者是 CommonJS，那么你应该包含它；如果依赖项很小，并且已经是有效的 ESM，则可以排除它，让浏览器直接加载它。

## 缓存

Vite 会将预构建的依赖缓存到 `node_modules/.vite`。它根据几个源来决定是否需要重新运行预构建步骤:

- `package.json` 中的 `dependencies` 列表
- 包管理器的 lockfile，例如 `package-lock.json`, `yarn.lock`，或者 `pnpm-lock.yaml`
- 可能在 `vite.config.js` 相关字段中配置过的

只有当上面的一个步骤发生变化时，才需要重新运行预构建步骤。

如果出于某些原因，你想要强制 Vite 重新绑定依赖，你可以用 `--force` 命令行选项启动开发服务器，或者手动删除 `node_modules/.vite` 目录。
