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

3. 在生产环境中：在运行 `vite build` 之后，一个 `manifest.json` 文件将与静态资源文件一同生成。一个示例清单文件会像下面这样：

   ```json
   {
     "main.js": {
       "file": "assets/main.4889e940.js",
       "src": "main.js",
       "isEntry": true,
       "dynamicImports": ["views/foo.js"],
       "css": "assets/main.b82dbe22.css",
       "assets": ["assets/asset.0ab0f9cd.png"]
     },
     "views/foo.js": {
       "file": "assets/foo.869aea0d.js",
       "src": "views/foo.js",
       "isDynamicEntry": true,
       "imports": ["_shared.83069a53.js"]
     },
     "_shared.83069a53.js": {
       "file": "assets/shared.83069a53.js"
     }
   }
   ```

   - 清单是一个 `Record<name, chunk>` 结构的对象。
   - 对于 入口 或动态入口 chunk，键是相对于项目根目录的资源路径。
   - 对于非入口 chunk，键是生成文件的名称并加上前缀 `_`。
   - Chunk 将信息包含在其静态和动态导入上（两者都是映射到清单中相应 chunk 的键)，以及任何与之相关的 CSS 和资源文件。

   你可以使用这个文件来渲染链接或者用散列文件名预加载指令（注意：这里的语法只是为了解释，实际使用时请你的服务器模板语言代替）：

   ```html
   <!-- 如果是在生产环境中 -->
   <link rel="stylesheet" href="/assets/{{ manifest['style.css'].file }}" />
   <script type="module" src="/assets/{{ manifest['index.js].file }}"></script>
   ```
