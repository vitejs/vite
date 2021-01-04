# 环境变量与模式

## 环境变量

Vite 在一个特殊的 **`import.meta.env`** 对象上暴露环境变量。这里有一些普遍适用的内建变量：

- **`import.meta.env.MODE`**: {string} 应用运行基于的 [模式](#modes)。

- **`import.meta.env.BASE_URL`**: {string} 应用正被部署在的 base url。在开发中将总是 `/`。在生产环境中，它由 [`build.base` 配置项](/config/#build-base) 决定。

- **`import.meta.env.PROD`**: {boolean} 应用是否运行在生产环境

- **`import.meta.env.DEV`**: {boolean} 应用是否运行在开发环境 (永远与 `import.meta.env.PROD` 相反)

:::tip
这些环境变量在构建过程中会被静态替换，因此请确保始终使用完整格式引用它们。
:::

## `.env` Files

Vite 使用 [dotenv](https://github.com/motdotla/dotenv) 在你的项目根目录下从以下文件加载额外的环境变量:

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

加载的环境变量也会通过 `import.meta.env` 暴露给客户端源代码。

为了防止意外地将一些环境变量泄漏到客户端，只有以 `VITE_` 为前缀的变量才会暴露给经过 vite 处理的代码。例如下面这个文件中：

```
DB_PASSWORD=foobar
VITE_SOME_KEY=123
```

只有 `VITE_SOME_KEY` 会被暴露为 `import.meta.env.VITE_SOME_KEY` 提供给客户端源代码，而 `DB_PASSWORD` 则不会。

:::warning 安全警告

- `.env.*.local` 文件应是本地的，可以包含敏感变量。你应该加上 `.local` 到你的 `.git` 避免他们被检出到 git。

- 由于暴露在 Vite 源代码中的任何变量都将最终出现在客户端包中，`VITE_*` 变量应该不包含任何敏感信息。

:::

## 模式

默认情况下，开发服务器 (`serve` 命令) 运行在 `development` （开发）模式，而 `build` 命令运行在 `production` （生产）模式。

这意味着当启动 `vite build`，它会自动加载 `.env.production` 中可能存在的环境变量：

```
# .env.production
VITE_APP_TITLE=My App
```

在你的应用中，你可以使用 `import.meta.env.VITE_APP_TITLE` 作为渲染标题。

然而重要的是，要理解**模式**是一个更广泛的概念，而不仅仅是开发和生产。一个典型的例子是，您可能希望有一个 “staging” 模式，它应该具有类似于生产的行为，但环境变量与生产环境略有不同。

您可以通过传递 `--mode` 选项标志来覆盖命令使用的默认模式。例如，如果你想为我们假设的 staging 模式构建应用:

```bash
vite build --mode staging
```

为了使应用实现预期行为，我们还需要一个 `.env.staging` 文件：

```
# .env.staging
NODE_ENV=production
VITE_APP_TITLE=My App (staging)
```

现在，staging 应用应该具有类似于生产的行为，但显示的标题与生产环境不同。
