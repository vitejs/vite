# HMR API

:::tip 注意
这里是客户端 HMR API。若要在插件中处理 HMR 更新，详见 [handleHotUpdate](./api-plugin#handlehotupdate).

手动 HMR API 主要用于框架和工具作者。作为最终用户，HMR 可能已经在特定于框架的启动器模板中为您处理过了。
:::

Vite 通过特殊的 `import.meta` 对象暴露手动 HMR API。

```ts
interface ImportMeta {
  readonly hot?: {
    readonly data: any

    accept(): void
    accept(cb: (mod: any) => void): void
    accept(dep: string, cb: (mod: any) => void): void
    accept(deps: string[], cb: (mods: any[]) => void): void

    dispose(cb: (data: any) => void): void
    decline(): void
    invalidate(): void

    on(event: string, cb: (...args: any[]) => void): void
  }
}
```

## 必需的条件守卫

首先，请确保用一个条件语句守护所有 HMR API 的使用，这样代码就可以在生产环境中被 tree-shaking 优化:

```js
if (import.meta.hot) {
  // HMR 代码
}
```

## `hot.accept(cb)`

要接收模块自身，应使用 `import.meta.hot.accept`，参数为接收已更新模块的回调函数：

```js
export const count = 1

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('updated: count is now ', newModule.count)
  })
}
```

“接受” 热更新的模块被认为是 **HMR 边界**。

请注意，Vite 的 HMR 实际上并不替换最初导入的模块：如果 HMR 边界模块从某个依赖重新导出其导入，则它负责更新这些重新导出的模块（这些导出必须使用 `let`）。此外，边界模块链上的导入者将不会收到更新。

这种简化的 HMR 实现对于大多数开发用例来说已经足够了，同时允许我们跳过生成代理模块的昂贵工作。

## `hot.accept(deps, cb)`

模块也可以接受直接依赖项的更新，而无需重新加载自身：

```js
import { foo } from './foo.js'

foo()

if (import.meta.hot) {
  import.meta.hot.accept('./foo.js', (newFoo) => {
    // 回调函数接收到更新后的'./foo.js' 模块
    newFoo.foo()
  })

  // 也可以接受一个依赖模块的数组：
  import.meta.hot.accept(
    ['./foo.js', './bar.js'],
    ([newFooModule, newBarModule]) => {
      // 回调函数接收一个更新后模块的数组
    }
  )
}
```

## `hot.dispose(cb)`

一个接收自身的模块或一个期望被其他模块接收的模块可以使用 `hot.dispose` 来清除任何由其更新副本产生的持久副作用：

```js
function setupSideEffect() {}

setupSideEffect()

if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    // 清理副作用
  })
}
```

## `hot.data`

`import.meta.hot.data` 对象在同一个更新模块的不同实例之间持久化。它可以用于将信息从模块的前一个版本传递到下一个版本。

## `hot.decline()`

调用 `import.meta.hot.decline()` 表示此模块不可热更新，如果在传播 HMR 更新时遇到此模块，浏览器应该执行完全重新加载。

## `hot.invalidate()`

现在调用 `import.meta.hot.invalidate()` 只是重新加载页面。

## `hot.on(event, cb)`

监听自定义 HMR 事件。自定义 HMR 事件可以由插件发送。更多细节详见 [handleHotUpdate](./api-plugin#handleHotUpdate)。
