<p align="center">
  <br>
  <br>
  <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://vite.dev/vite-light.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://vite.dev/vite-dark.svg">
      <img alt="vite logo" src="https://vite.dev/vite-dark.svg" height="60">
    </picture>
  </a>
  <br>
  <br>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/vite"><img src="https://img.shields.io/npm/v/vite.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/vite.svg" alt="node compatibility"></a>
  <a href="https://github.com/vitejs/vite/actions/workflows/ci.yml"><img src="https://github.com/vitejs/vite/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
  <a href="https://chat.vite.dev"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
</p>
<br/>

# Vite ⚡

> 下一代前端工具

- 💡 即时服务器启动
- ⚡️ 闪电般的 HMR
- 🛠️ 丰富的功能
- 📦 优化的构建
- 🔩 通用插件接口
- 🔑 完全类型化的 API

Vite（法语单词"快速"，发音为 [`/viːt/`](https://cdn.jsdelivr.net/gh/vitejs/vite@main/docs/public/vite.mp3)，类似"veet"）是一个构建工具，旨在为现代 Web 项目提供更快、更精简的开发体验。它由两个主要部分组成：

- 一个开发服务器，为[原生 ES 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)提供[丰富的功能增强](https://vite.dev/guide/features)，例如极快的[热模块替换（HMR）](https://vite.dev/guide/features#hot-module-replacement)
- 一个构建命令，使用 [Rollup](https://rollupjs.org) 捆绑你的代码，预配置为输出高度优化的静态资源用于生产

## 特性

### 即时服务器启动

Vite 不需要打包，可以立即启动开发服务器。无论你的应用有多大，启动时间都是即时的。

### 闪电般的 HMR

Vite 的 HMR 实现与模块数量无关。无论你的应用有多大，HMR 都是即时的。

### 丰富的功能

Vite 支持开箱即用的 TypeScript、JSX、CSS 等，无需配置。

### 优化的构建

Vite 使用 Rollup 进行生产构建，输出高度优化的静态资源。

### 通用插件接口

Vite 的插件接口与 Rollup 兼容，可以重用现有的 Rollup 插件。

### 完全类型化的 API

Vite 的 API 完全类型化，提供出色的开发体验。

## 安装

### 使用 npm

```bash
npm create vite@latest
```

### 使用 yarn

```bash
yarn create vite
```

### 使用 pnpm

```bash
pnpm create vite
```

## 快速开始

### 创建项目

```bash
npm create vite@latest my-vue-app -- --template vue
```

### 启动开发服务器

```bash
cd my-vue-app
npm install
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 模板

Vite 提供多种模板：

### Vanilla

```bash
npm create vite@latest my-app -- --template vanilla
```

### Vue

```bash
npm create vite@latest my-app -- --template vue
```

### React

```bash
npm create vite@latest my-app -- --template react
```

### Preact

```bash
npm create vite@latest my-app -- --template preact
```

### Lit

```bash
npm create vite@latest my-app -- --template lit
```

### Svelte

```bash
npm create vite@latest my-app -- --template svelte
```

### Solid

```bash
npm create vite@latest my-app -- --template solid
```

### Qwik

```bash
npm create vite@latest my-app -- --template qwik
```

## 配置

### 配置文件

Vite 使用 `vite.config.js` 或 `vite.config.ts` 文件进行配置：

```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // 配置选项
})
```

### 开发服务器选项

```javascript
export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
```

### 构建选项

```javascript
export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
  },
})
```

### 插件

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

## 静态资源处理

### 导入静态资源

```javascript
// 导入图片
import logo from './logo.png'

// 导入 CSS
import './style.css'

// 导入 JSON
import data from './data.json'
```

### 公共目录

放在 `public` 目录下的文件会被直接复制到输出目录，不会被处理。

```html
<!-- 引用公共目录中的文件 -->
<img src="/logo.png" alt="Logo">
```

## CSS

### CSS 预处理器

Vite 支持开箱即用的 CSS 预处理器：

```bash
# Sass
npm install -D sass

# Less
npm install -D less

# Stylus
npm install -D stylus
```

### CSS 模块

```css
/* style.module.css */
.button {
  background: blue;
  color: white;
}
```

```javascript
import styles from './style.module.css'

function App() {
  return <button className={styles.button}>Click me</button>
}
```

### PostCSS

Vite 自动应用 PostCSS 配置：

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## TypeScript

Vite 原生支持 TypeScript：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // TypeScript 配置
})
```

## 环境变量

Vite 使用 `.env` 文件加载环境变量：

```bash
# .env
VITE_API_URL=https://api.example.com
```

```javascript
// 在代码中使用
console.log(import.meta.env.VITE_API_URL)
```

## 框架支持

### Vue

```bash
npm create vite@latest my-vue-app -- --template vue
```

### React

```bash
npm create vite@latest my-react-app -- --template react
```

### Svelte

```bash
npm create vite@latest my-svelte-app -- --template svelte
```

### Preact

```bash
npm create vite@latest my-preact-app -- --template preact
```

### Lit

```bash
npm create vite@latest my-lit-app -- --template lit
```

### Solid

```bash
npm create vite@latest my-solid-app -- --template solid
```

## 部署

### 静态部署

```bash
npm run build
# 将 dist 目录部署到静态托管服务
```

### Node.js 服务器

```javascript
// server.js
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()
  
  const vite = await createViteServer({
    server: { middlewareMode: true },
  })
  
  app.use(vite.middlewares)
  
  app.listen(3000)
}

createServer()
```

## 与传统工具的比较

### 与 Webpack 的比较

| 特性 | Vite | Webpack |
|------|------|---------|
| 启动速度 | 即时 | 慢 |
| HMR 速度 | 即时 | 慢 |
| 配置复杂度 | 简单 | 复杂 |
| 生态系统 | 丰富 | 丰富 |
| 学习曲线 | 低 | 中等 |

### 与 Parcel 的比较

| 特性 | Vite | Parcel |
|------|------|--------|
| 启动速度 | 即时 | 快 |
| HMR 速度 | 即时 | 快 |
| 配置复杂度 | 简单 | 简单 |
| 生态系统 | 丰富 | 中等 |
| 学习曲线 | 低 | 低 |

## 最佳实践

### 1. 使用环境变量

```bash
# .env.development
VITE_API_URL=http://localhost:8080

# .env.production
VITE_API_URL=https://api.example.com
```

### 2. 使用别名

```javascript
// vite.config.js
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### 3. 使用代理

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

## 性能优化

### 1. 使用动态导入

```javascript
// 动态导入模块
const module = await import('./module.js')
```

### 2. 使用代码分割

```javascript
// 自动代码分割
import('./module.js').then(module => {
  // 使用模块
})
```

### 3. 优化静态资源

```javascript
// 压缩图片
import logo from './logo.png?w=200&h=200'
```

## 文档

完整文档请访问 [vite.dev](https://vite.dev)。

## 社区

如需帮助、讨论最佳实践或功能建议：

[在 Discord 上讨论 Vite](https://chat.vite.dev)

## 贡献

如果您有兴趣为 Vite 做出贡献，请在提交拉取请求之前阅读我们的[贡献文档](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md)。

## 许可证

MIT
