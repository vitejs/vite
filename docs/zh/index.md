---
home: true
actionText: 开始
actionLink: /zh/guide/

altActionText: 了解更多
altActionLink: /zh/guide/introduction

features:
  - title: 💡 极速的服务启动
    details: 使用原生 ESM 文件，无需打包!
  - title: ⚡️ 轻量快速的热重载
    details: 无论应用程序大小如何，都始终极快的模块热重载（HMR）
  - title: 🛠️ 丰富的功能
    details: 对 TypeScript、JSX、CSS 等支持开箱即用。
  - title: 📦 优化的构建
    details: 可选 “多页应用” 或 “库” 模式的预配置 Rollup 构建
  - title: 🔩 通用的插件
    details: 在开发和构建之间共享 Rollup-superset 插件接口。
  - title: 🔑 完全类型化的API
    details: 灵活的 API 和完整 TypeScript 类型。
footer: MIT Licensed | Copyright © 2019-present Evan You & Vite Contributors
---

<div class="frontpage sponsors">
  <h2>赞助</h2>
  <a v-for="{ href, src, name } of sponsors" :href="href" target="_blank" rel="noopener" aria-label="sponsor-img">
    <img :src="src" :alt="name">
  </a>
  <br>
  <a href="https://github.com/sponsors/yyx990803" target="_blank" rel="noopener">在 GitHub 上赞助我们</a>
</div>

<script setup>
import sponsors from '../.vitepress/theme/sponsors.json'
</script>
