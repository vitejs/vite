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

1. 它将非 ESM 依赖项（例如 CommonJS）转换为 ESM 格式，这样它就可以被浏览器作为原生 ES 模块导入。

   此外，Vite 还会执行智能导入分析，这样即使导出是动态分配的（如 React），具名导入也会符合预期效果：

   ```js
   // 符合预期
   import React, { useState } from 'react'
   ```

2. 它将有许多内部模块的 ESM 依赖关系转换为单个模块，以提高后续页面加载性能。

   一些包将它们的 ES 模块构建作为许多单独的文件相互导入。例如，[`lodash-es` 有超过 600 个内置模块](https://unpkg.com/browse/lodash-es/)！当我们执行 `import { debounce } from 'lodash-es` 时，浏览器同时发出 600 多个 HTTP 请求！尽管服务器在处理这些请求时没有问题，但大量的请求会在浏览器端造成网络拥塞，导致页面的加载速度相当慢。

   通过预构建 `lodash-es` 成为一个模块，我们就只需要一个 HTTP 请求了！

## 预构建条件

只有当依赖项列在 `package.json` 的 `dependencies` 中时，才会检查它是否预绑定。如果以下任何一个是正确的，它将有资格进行预捆绑:

- 该依赖项没有包含有效的 ES 模块导出（被视为 CommonJS）
- 依赖项包含其他模块或依赖项（多个内部模块）的导入

这也意味着你应该避免将不需要导入源代码的依赖项放在 `dependencies` 下（应该将它们移到 `devDependencies`)。

## Monorepo 和链接依赖

在一个 monorepo 启动中，该仓库中的某个依赖可能会成为另一个包的依赖。Vite 会自动侦测没有从 `node_modules` 解析的依赖项，并将链接的依赖视为源代码。它不会尝试打包被链接的依赖，而是会分析被链接依赖的依赖列表。

## 自定义行为

默认启发式的预构建行为可能并不总是可取的。如果您想要显式地从列表中包含/排除依赖项，请使用[`optimizeDeps` 配置项](/config/#dep-optimization-options)。

## 缓存

Vite 会将预构建的依赖缓存到 `node_modules/.vite`。它根据几个源来决定是否需要重新运行预构建步骤:

- `package.json` 中的 `dependencies` 列表
- 包管理器的 lockfile，例如 `package-lock.json`, `yarn.lock`，或者 `pnpm-lock.yaml`
- 可能存在的 `vite.config.js`

只有当上面的一个步骤发生变化时，才需要重新运行预构建步骤。

如果出于某些原因，你想要强制 Vite 重新绑定依赖，你可以用 `--force` 命令行选项启动开发服务器，或者手动删除 `node_modules/.vite` 目录。
