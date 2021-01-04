# 后端集成

如果你想使用传统的后端（如 Rails, Laravel）来服务 HTML，但使用 Vite 来服务资源，以下是你可以做的:

1. 在你的 Vite 配置中启用 `cors` 和 `emitManifest`:

   ```js
   // vite.config.js
   export default {
     build: {
       manifest: true
     }
   }
   ```

2. 在开发环境中，在服务器的 HTML 模板中注入以下内容（用正在运行的本地 URL 替换 `http://localhost:3000`）：

   ```html
   <!-- 如果是在开发环境中 -->
   <script type="module" src="http://localhost:3000/@vite/client"></script>
   <script type="module" src="http://localhost:3000/main.js"></script>
   ```

   还要确保服务器配置为提供 Vite 工作目录中的静态资源，否则图片等资源将无法正确加载。

3. 在生产环境中：在运行 `vite build` 之后，一个 `manifest.json` 文件将与静态资源文件一同生成，你可以使用这个文件来渲染带有散列文件名的链接（注意：这里的语法仅供解释，请用你的服务器模板语言代替）：

   ```html
   <!-- 如果是在生产环境中 -->
   <link rel="stylesheet" href="/assets/{{ manifest['style.css'].file }}" />
   <script type="module" src="/assets/{{ manifest['index.js].file }}"></script>
   ```
