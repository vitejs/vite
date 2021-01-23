# [2.0.0-beta.39](https://github.com/vitejs/vite/compare/v2.0.0-beta.38...v2.0.0-beta.39) (2021-01-23)


### Bug Fixes

* **optimizer:** fix es interop heuristics for entry with only export * from ([ef1a7e3](https://github.com/vitejs/vite/commit/ef1a7e33cc19bac7893bca85b6df14adeb847516))
* **ssr:** do not inject ?import query for ssr transforms ([7d26119](https://github.com/vitejs/vite/commit/7d261191e5ebf0c2fede0c6fc82137999d58cc5c)), closes [#1655](https://github.com/vitejs/vite/issues/1655)
* hmr port fallback in middlewareMode ([36a9456](https://github.com/vitejs/vite/commit/36a94560399e03cdbdbdbdb16913c05deb87ab9b))
* **ssr:** avoid resolving externals to mjs ([3955fe3](https://github.com/vitejs/vite/commit/3955fe37fe4498e6c7df122376a942d63afe6acb))
* file dir resolve should prioritize package.json ([ce2d49a](https://github.com/vitejs/vite/commit/ce2d49ab396aa7b4ed582650e569d7f2f6d3ef9f))
* **ssr:** remove import query in ssrLoadModule ([80473c1](https://github.com/vitejs/vite/commit/80473c1423209824d143df77b38f1bdb8723f47b))



# [2.0.0-beta.38](https://github.com/vitejs/vite/compare/v2.0.0-beta.37...v2.0.0-beta.38) (2021-01-23)


### Bug Fixes

* **dev:** remove comment for sourcemap reference at debug ([#1658](https://github.com/vitejs/vite/issues/1658)) ([16248c0](https://github.com/vitejs/vite/commit/16248c02844c5447eeb7c441cc4b051becef2346))
* **optimizer:** improve exports analysis ([406cbea](https://github.com/vitejs/vite/commit/406cbeaa4f52472ce356980840f1a2a824eaa497))
* **ssr:** fix ssr transform edge cases ([f22ddbd](https://github.com/vitejs/vite/commit/f22ddbdb52d4579a5756215c320a13cd674a38a0)), closes [#1646](https://github.com/vitejs/vite/issues/1646)
* exclude spa-fallback middleware in middlewareMode ([#1645](https://github.com/vitejs/vite/issues/1645)) ([843c879](https://github.com/vitejs/vite/commit/843c87915082b36f7d1ffeb81515b45d5d65aabb))


### Code Refactoring

* remove optimizeDeps.plugins ([38524f6](https://github.com/vitejs/vite/commit/38524f6c6e864f9805dd0083da1dfa8ce20fa816))


### Features

* esbuild based dep pre-bundling ([6e7f652](https://github.com/vitejs/vite/commit/6e7f652d89dde43806a2323560486c9b4b771a35))
* support `base` option during dev, deprecate `build.base` ([#1556](https://github.com/vitejs/vite/issues/1556)) ([809d4bd](https://github.com/vitejs/vite/commit/809d4bd3bf62d3bc6b35f182178922d2ab2175f1))


### BREAKING CHANGES

* `optimizeDeps.plugins` has been removed. The dep
optimizer is now using `esbuild`, and all non-js files are automatically
externalized to be processed by Vite's transform pipeline when imported.



# [2.0.0-beta.37](https://github.com/vitejs/vite/compare/v2.0.0-beta.35...v2.0.0-beta.37) (2021-01-22)


### Bug Fixes

* **css:** fix url rewriting in [@imported](https://github.com/imported) css ([52ae44f](https://github.com/vitejs/vite/commit/52ae44fe97b53ce82633268030bb46594f385860)), closes [#1629](https://github.com/vitejs/vite/issues/1629)
* **manifest:** avoid chunks with same name overwriting one another ([cf81aa3](https://github.com/vitejs/vite/commit/cf81aa399b2df1ee8441a1b8922908f4e36358d6)), closes [#1632](https://github.com/vitejs/vite/issues/1632)
* **ssr:** do not inject inlined css in ssr build ([5d77665](https://github.com/vitejs/vite/commit/5d77665def42ffafc699a0006e4527536dfd1114)), closes [#1643](https://github.com/vitejs/vite/issues/1643)
* always reload when html is edited in middleware mode ([85c89be](https://github.com/vitejs/vite/commit/85c89bea9807090d928942a72b972183ebf8483a))
* handle esm config syntax error in Node 12 ([20cf718](https://github.com/vitejs/vite/commit/20cf718ac77abfce5656ee9836f8c06ddbbc440d)), closes [#1635](https://github.com/vitejs/vite/issues/1635)
* normalize paths for cjs optimized deps on windows ([#1631](https://github.com/vitejs/vite/issues/1631)) ([b462e33](https://github.com/vitejs/vite/commit/b462e33ce3d31df49ada436324a9c32cd5c9053a))
* still resolve jsnext fields ([4e0cd73](https://github.com/vitejs/vite/commit/4e0cd7384e850e4b7f23b68e5b591bb717650b79))


### Features

* allow inline postcss config ([6bd2140](https://github.com/vitejs/vite/commit/6bd21402a9e5955433656024f5548f12b12ea2fa)), closes [#1061](https://github.com/vitejs/vite/issues/1061)
* hmr for glob import ([edd2fd9](https://github.com/vitejs/vite/commit/edd2fd9de904a194f25e18136dfe298c7bcbbd8d))



# [2.0.0-beta.36](https://github.com/vitejs/vite/compare/v2.0.0-beta.35...v2.0.0-beta.36) (2021-01-21)


### Bug Fixes

* always reload when html is edited in middleware mode ([85c89be](https://github.com/vitejs/vite/commit/85c89bea9807090d928942a72b972183ebf8483a))
* still resolve jsnext fields ([6e06108](https://github.com/vitejs/vite/commit/6e061089c62898086c07fad7154b178446a18da5))


### Features

* allow inline postcss config ([6bd2140](https://github.com/vitejs/vite/commit/6bd21402a9e5955433656024f5548f12b12ea2fa)), closes [#1061](https://github.com/vitejs/vite/issues/1061)
* hmr for glob import ([edd2fd9](https://github.com/vitejs/vite/commit/edd2fd9de904a194f25e18136dfe298c7bcbbd8d))



# [2.0.0-beta.35](https://github.com/vitejs/vite/compare/v2.0.0-beta.34...v2.0.0-beta.35) (2021-01-20)


### Bug Fixes

* allow direct inspection of static file via browser ([a3c334f](https://github.com/vitejs/vite/commit/a3c334f66dbe1e5c49c4e5d77381aa0098c4a8a9)), closes [#1612](https://github.com/vitejs/vite/issues/1612)
* also resolve for module condition ([3a3029e](https://github.com/vitejs/vite/commit/3a3029effa0b83775f02fbd9469ef104eb6adb33)), closes [#1583](https://github.com/vitejs/vite/issues/1583)
* do not apply jsxInject on ts files ([a72a59c](https://github.com/vitejs/vite/commit/a72a59c55355a2a247b84178e63ce8c7cc1d7564))
* inline async css for legacy builds ([940d483](https://github.com/vitejs/vite/commit/940d48333f6572314576da9312f36018fd70bdc8))
* manually test global regex codeframeRE index ([#1608](https://github.com/vitejs/vite/issues/1608)) ([20d6c0f](https://github.com/vitejs/vite/commit/20d6c0fae160e25ab6cb76484baf910388dccdc6))
* properly format css pre-processor errors from [@imported](https://github.com/imported) files ([ec18bde](https://github.com/vitejs/vite/commit/ec18bde7ee4045a47362240a6f5ff4997657c7ba)), closes [#1600](https://github.com/vitejs/vite/issues/1600) [#1601](https://github.com/vitejs/vite/issues/1601)
* **asset:** use stricter asset url marker and regex ([e6c8478](https://github.com/vitejs/vite/commit/e6c8478dd765e63f56e2c4559daf03f976f60b4c)), closes [#1602](https://github.com/vitejs/vite/issues/1602)
* **plugin-dynamic-import:** include assetDir in dynamic import polyfill module path ([#1610](https://github.com/vitejs/vite/issues/1610)) ([47ff0f4](https://github.com/vitejs/vite/commit/47ff0f4307da6a90db2fc43fcf0aaffdb9e36643))
* **resolve:** get pkg  from importer for relative id ([#1599](https://github.com/vitejs/vite/issues/1599)) ([c821f09](https://github.com/vitejs/vite/commit/c821f094c25a7acde87b868dced265aa6e792a57))


### Features

* **manifest:** include dynamic entries and dynamic imports ([#1609](https://github.com/vitejs/vite/issues/1609)) ([9ed4908](https://github.com/vitejs/vite/commit/9ed49085ae860fb96d51ac50845f96ceb9fa649f))
* detect and warn against imports to transitively optimized deps ([3841e70](https://github.com/vitejs/vite/commit/3841e702213efac178aa90ab01825a813d3b4819)), closes [#1543](https://github.com/vitejs/vite/issues/1543)



# [2.0.0-beta.34](https://github.com/vitejs/vite/compare/v2.0.0-beta.33...v2.0.0-beta.34) (2021-01-20)


### Bug Fixes

* default changeOrigin to true in proxy option shorthand ([b008bd5](https://github.com/vitejs/vite/commit/b008bd59674c6d46ca41108b1c9d5076374bd1b8)), closes [#1577](https://github.com/vitejs/vite/issues/1577)
* emit css only once when there are multiple outputs ([6bce108](https://github.com/vitejs/vite/commit/6bce1081991501f3779bff1a81e5dd1e63e5d38e)), closes [#1590](https://github.com/vitejs/vite/issues/1590)
* **optimizer:** handle commonjs require css ([#1568](https://github.com/vitejs/vite/issues/1568)) ([3d09b50](https://github.com/vitejs/vite/commit/3d09b50b8774cf85a8c1dee24b3e379cbd3e9eb5)), closes [#1566](https://github.com/vitejs/vite/issues/1566)
* handle legacy chunks in manifest ([123b6f6](https://github.com/vitejs/vite/commit/123b6f67f7e159d098109d5c65a74dc0d17bd495)), closes [#1551](https://github.com/vitejs/vite/issues/1551)
* use safe dynamic import rewrite ([5cb02ce](https://github.com/vitejs/vite/commit/5cb02ce0b24ff167b7da3e2de9b0237186d9e95a)), closes [#1563](https://github.com/vitejs/vite/issues/1563)
* **hmr:** fix hmr invalidation on circular deps ([ca8442c](https://github.com/vitejs/vite/commit/ca8442c19e51526e2fa75f0c4976941a2b9089e6)), closes [#1477](https://github.com/vitejs/vite/issues/1477)
* **resolve:** node resolve from virtual modules ([c6d5ed8](https://github.com/vitejs/vite/commit/c6d5ed833befafaaea14fbd2fb62a7ed8d58c409))



# [2.0.0-beta.33](https://github.com/vitejs/vite/compare/v2.0.0-beta.32...v2.0.0-beta.33) (2021-01-19)


### Bug Fixes

* fix ssr module invalidation infinite loop ([30885d1](https://github.com/vitejs/vite/commit/30885d1673a282a12e0c7471fc80236b72ebeb16)), closes [#1591](https://github.com/vitejs/vite/issues/1591)



# [2.0.0-beta.32](https://github.com/vitejs/vite/compare/v2.0.0-beta.31...v2.0.0-beta.32) (2021-01-19)


### Bug Fixes

* avoid preloading owner chunk ([61969d7](https://github.com/vitejs/vite/commit/61969d787200ab0b03179ecf2855c5b4aff3baa6))
* ssr transform check valid inMap ([bf4b3e9](https://github.com/vitejs/vite/commit/bf4b3e9b416bb0f2a8ee8bfce969d452429a8282))
* support resolving .json ext to be consistent with Node ([a1d1dde](https://github.com/vitejs/vite/commit/a1d1dde70c4626ab603ed07234fe296ef8d5a65f))


### Code Refactoring

* rename ViteDevServer.app -> ViteDevServer.middlewares ([394390a](https://github.com/vitejs/vite/commit/394390a983deccd8cbca101066db93f60577b810))


### Features

* import.meta.env.SSR ([fe7396d](https://github.com/vitejs/vite/commit/fe7396d3896d04db17f73ea265eebe0397414e65))
* ssr manifest for preload inference ([107e79e](https://github.com/vitejs/vite/commit/107e79e7b7d422f0d1dbe8b7b435636df7c6281c))
* **ssr:** isolated mode ([e954ed2](https://github.com/vitejs/vite/commit/e954ed25099d9217d30a5a4d38e5dfee5acee0fd))
* ssr sourcemap + stacktrace fix ([6cb04fa](https://github.com/vitejs/vite/commit/6cb04fa3b3a7a4ac4676a7b1c41d9d5068fae5de))


### BREAKING CHANGES

* `ViteDevServer.app` is now `ViteDevServer.middlewares`.
In addition, Vite no longer serves `index.html` in middleware mode. The
server using Vite as middleware is responsible for serving HTML with
`/@vite/client` injected.



# [2.0.0-beta.31](https://github.com/vitejs/vite/compare/v2.0.0-beta.30...v2.0.0-beta.31) (2021-01-18)


### Bug Fixes

* workaround for ts config + native esm w/ imports ([4a7d2eb](https://github.com/vitejs/vite/commit/4a7d2ebca1719d83c22d7dce5214e61f7906a772)), closes [#1560](https://github.com/vitejs/vite/issues/1560)
* **resolve:** also respect browser mapping of dependencies ([12b706d](https://github.com/vitejs/vite/commit/12b706d6ecd99c98f326deae53f9aa79cd8a81f4)), closes [#1547](https://github.com/vitejs/vite/issues/1547)



# [2.0.0-beta.30](https://github.com/vitejs/vite/compare/v2.0.0-beta.29...v2.0.0-beta.30) (2021-01-15)


### Bug Fixes

* **config:** delete cache correctly when restarting server ([#1541](https://github.com/vitejs/vite/issues/1541)) ([bd3b1bf](https://github.com/vitejs/vite/commit/bd3b1bfd83488b05a188a9d1c7093e3003721d91))
* **config:** load native esm ts config string with base64 encoding ([55b05db](https://github.com/vitejs/vite/commit/55b05dba3d157da72eaf9c445b0bb5084b9858d0)), closes [#1548](https://github.com/vitejs/vite/issues/1548)



# [2.0.0-beta.29](https://github.com/vitejs/vite/compare/v2.0.0-beta.28...v2.0.0-beta.29) (2021-01-14)


### Bug Fixes

* **optimizer:** fix empty exclude filter ([4579c38](https://github.com/vitejs/vite/commit/4579c382d4a1b0385510bb708f74305c87c4a68a))
* fix graceful shutdown on sigint ([fe7238c](https://github.com/vitejs/vite/commit/fe7238c530533d7ea7bff20ce97485669c7dfb46))
* warn failed source map load instead of erroring ([7a1261b](https://github.com/vitejs/vite/commit/7a1261b51695cbe7d41da6835c360b9bb26d189e))



# [2.0.0-beta.28](https://github.com/vitejs/vite/compare/v2.0.0-beta.27...v2.0.0-beta.28) (2021-01-14)


### Bug Fixes

* alias should work for optimized deps ([54dab71](https://github.com/vitejs/vite/commit/54dab71e41cdd9f516460d153b024d0c0cc05097))
* serve out of root static file on windows ([#1537](https://github.com/vitejs/vite/issues/1537)) ([506bf2d](https://github.com/vitejs/vite/commit/506bf2d542a27ee19a1b1b2d05aad845f4387cf6))
* **dev:** correct responce for html qurey ([#1526](https://github.com/vitejs/vite/issues/1526)) ([49d294d](https://github.com/vitejs/vite/commit/49d294d36d0f32d00a025a03017c9049d3f48ebd)), closes [#1524](https://github.com/vitejs/vite/issues/1524)
* **optimizer:** should respect rollup external during pre-bundling ([db97317](https://github.com/vitejs/vite/commit/db9731753abf36563172b02961ded54be23dd215)), closes [#1528](https://github.com/vitejs/vite/issues/1528)


### Features

* add clearScreen option ([c5c3298](https://github.com/vitejs/vite/commit/c5c32982f207055229b6bce61ce205d8d20db023))
* close server on sigint/sigterm ([4338d7d](https://github.com/vitejs/vite/commit/4338d7d6f32c8e0e67ff58f0cb8c1a9120294756)), closes [#1525](https://github.com/vitejs/vite/issues/1525)
* support specifying URL path via server.open option ([#1514](https://github.com/vitejs/vite/issues/1514)) ([25e9c44](https://github.com/vitejs/vite/commit/25e9c44992c8b868cec97dbdeddd3a4837d5bb07))
* support using vite as a middleware ([960b420](https://github.com/vitejs/vite/commit/960b42068579dddc2c216720a7f16d8d189e8225))



# [2.0.0-beta.27](https://github.com/vitejs/vite/compare/v2.0.0-beta.26...v2.0.0-beta.27) (2021-01-13)


### Bug Fixes

* transform import.meta.url in config files ([98e57de](https://github.com/vitejs/vite/commit/98e57deb9d16b23b7ae0c382cca49a9420443b47)), closes [#1511](https://github.com/vitejs/vite/issues/1511)


### Features

* **vite:** support RegExp strings as server.proxy keys ([#1510](https://github.com/vitejs/vite/issues/1510)) ([f39a2aa](https://github.com/vitejs/vite/commit/f39a2aafd35a70effc298d53b0b7539fbac79e89))
* warn unintended dependency during pre-bundling ([ae6cc27](https://github.com/vitejs/vite/commit/ae6cc27349e66945a0964635e6ad64933fe33960))



# [2.0.0-beta.26](https://github.com/vitejs/vite/compare/v2.0.0-beta.25...v2.0.0-beta.26) (2021-01-13)


### Bug Fixes

* properly externalize resolved external urls ([6cda88d](https://github.com/vitejs/vite/commit/6cda88d882ffcd5b3fdaa005296bfe1f0991925c))



# [2.0.0-beta.25](https://github.com/vitejs/vite/compare/v2.0.0-beta.24...v2.0.0-beta.25) (2021-01-12)


### Bug Fixes

* Revert "feat: allow browser new window view source ([#1496](https://github.com/vitejs/vite/issues/1496))" ([64fde38](https://github.com/vitejs/vite/commit/64fde3883e07f66fee6f6234f84ad35288a24b62)), closes [#1507](https://github.com/vitejs/vite/issues/1507)


### Features

* support aliasing to external url ([abf7844](https://github.com/vitejs/vite/commit/abf784403e1d9e36653ee4fd167c4cf341fd343f))



# [2.0.0-beta.24](https://github.com/vitejs/vite/compare/v2.0.0-beta.23...v2.0.0-beta.24) (2021-01-12)


### Bug Fixes

* **hmr:** watch file changes even when HMR is disabled ([#1504](https://github.com/vitejs/vite/issues/1504)) ([cc5fa6e](https://github.com/vitejs/vite/commit/cc5fa6efb3448e2f83b5d6d428e79803c8993657))
* always replace preload marker with value ([2d6f524](https://github.com/vitejs/vite/commit/2d6f5243e16f7debd7ba0de4bf22706df35ccf73))
* more consistent outDir formatting ([50bff79](https://github.com/vitejs/vite/commit/50bff797c536b08661791a833cfbb9179ff54422)), closes [#1497](https://github.com/vitejs/vite/issues/1497)
* show target build mode in logs ([#1498](https://github.com/vitejs/vite/issues/1498)) ([ae2e14b](https://github.com/vitejs/vite/commit/ae2e14baf1771c2ccdeece8bbc2b9bd11b279490))
* support import.meta.url in ts esm config file ([cf5f3ab](https://github.com/vitejs/vite/commit/cf5f3ab2c33aca6ab6bff8d600854f93586adcf0)), closes [#1499](https://github.com/vitejs/vite/issues/1499)


### Features

* allow browser new window view source ([#1496](https://github.com/vitejs/vite/issues/1496)) ([1629c54](https://github.com/vitejs/vite/commit/1629c546158253f155afecb55846771013f90ec0))
* require explicit option to empty outDir when it is out of root ([730d2f0](https://github.com/vitejs/vite/commit/730d2f0d8081e11c88b1151086d99b23e0c58823)), closes [#1501](https://github.com/vitejs/vite/issues/1501)



# [2.0.0-beta.23](https://github.com/vitejs/vite/compare/v2.0.0-beta.22...v2.0.0-beta.23) (2021-01-12)


### Bug Fixes

* fix ts config loading on windows ([ec370d2](https://github.com/vitejs/vite/commit/ec370d22db875cca0b2319073d9025b05e7ffc54)), closes [#1493](https://github.com/vitejs/vite/issues/1493)



# [2.0.0-beta.22](https://github.com/vitejs/vite/compare/v2.0.0-beta.21...v2.0.0-beta.22) (2021-01-11)


### Bug Fixes

* handle http proxy error ([4ca20f2](https://github.com/vitejs/vite/commit/4ca20f2e16c1bba0dc330c7e5879ca322b2ab21c)), closes [#1485](https://github.com/vitejs/vite/issues/1485)
* optimizer hash should take inline mode into account ([0aed0e8](https://github.com/vitejs/vite/commit/0aed0e89f84aff26cfdf57879925a76fa696331d)), closes [#1490](https://github.com/vitejs/vite/issues/1490)
* support resolved Ids that start with null bytes ([7074414](https://github.com/vitejs/vite/commit/70744143cd09863412a59aad14de888067bd8531)), closes [#1471](https://github.com/vitejs/vite/issues/1471)
* **config:** support native esm config on windows + support TS config in native esm projects ([803f6da](https://github.com/vitejs/vite/commit/803f6da2ad04846c3ae2622e15b5a18f0691204e)), closes [#1487](https://github.com/vitejs/vite/issues/1487)


### Features

* **resolve:** support subpath patterns + production/development conditinals in exports field ([62cbd53](https://github.com/vitejs/vite/commit/62cbd53f25411ddfc7cfd5446c2f487a260da191))
* **server:** add strict-port option ([#1453](https://github.com/vitejs/vite/issues/1453)) ([0501084](https://github.com/vitejs/vite/commit/05010846cb266f540039f13e280b486c97803f03))



# [2.0.0-beta.21](https://github.com/vitejs/vite/compare/v2.0.0-beta.20...v2.0.0-beta.21) (2021-01-11)


### Bug Fixes

* properly remove dynamic import args for full dynamic imports ([d9c3fdb](https://github.com/vitejs/vite/commit/d9c3fdb4073d49d427d825007154e873d8aa3d9a))



# [2.0.0-beta.20](https://github.com/vitejs/vite/compare/v2.0.0-beta.19...v2.0.0-beta.20) (2021-01-11)


### Bug Fixes

* **optimizer:** exclude should not be resolve ([#1469](https://github.com/vitejs/vite/issues/1469)) ([f8c34ee](https://github.com/vitejs/vite/commit/f8c34eeb89e327f484293f3156119ba6d14f6aee))
* **resolve:** heuristics for browser vs. module field ([1865e6e](https://github.com/vitejs/vite/commit/1865e6ee4c3e07c0f4a199c1ba7e1c1c4f68862f)), closes [#1467](https://github.com/vitejs/vite/issues/1467)


### Features

* allow passing options to rollup commonjs plugin via build.commonjsOptions ([6ed8e28](https://github.com/vitejs/vite/commit/6ed8e286f149f9474e0fc624110de5f787551d62)), closes [#1460](https://github.com/vitejs/vite/issues/1460)
* async chunk loading optimizations ([e6f7fba](https://github.com/vitejs/vite/commit/e6f7fbad75c1b406b9a95060c5d2a42d3a8994a8))



# [2.0.0-beta.19](https://github.com/vitejs/vite/compare/v2.0.0-beta.18...v2.0.0-beta.19) (2021-01-10)


### Bug Fixes

* transform json in deep import ([#1459](https://github.com/vitejs/vite/issues/1459)) ([cf8342b](https://github.com/vitejs/vite/commit/cf8342bef45bebb05d020d4f220b12d2bf526256)), closes [#1458](https://github.com/vitejs/vite/issues/1458)



# [2.0.0-beta.18](https://github.com/vitejs/vite/compare/v2.0.0-beta.17...v2.0.0-beta.18) (2021-01-10)


### Bug Fixes

* fix dynamic import with parent relative paths ([bbfe06c](https://github.com/vitejs/vite/commit/bbfe06ce1af8f89490032e609377c6516f7da773)), closes [#1461](https://github.com/vitejs/vite/issues/1461)
* **optimizer:** properly externalize css/asset imports in optimized deps ([5d180db](https://github.com/vitejs/vite/commit/5d180db4bd19e26de20bb816d594226b4d492804)), closes [#1443](https://github.com/vitejs/vite/issues/1443)


### Features

* **optimizer:** support specifying plugins for the optimizer ([1ea0168](https://github.com/vitejs/vite/commit/1ea016823975f3d0e37bf7b65614eded213e0869))



# [2.0.0-beta.17](https://github.com/vitejs/vite/compare/v2.0.0-beta.16...v2.0.0-beta.17) (2021-01-10)


### Code Refactoring

* support glob import under `import.meta.glob` ([23d0f2b](https://github.com/vitejs/vite/commit/23d0f2b85d8eb8677e30456342000cabed8e684e))


### BREAKING CHANGES

* Glob import syntax has changed. The feature is now
exposed under `import.meta.glob` (lazy, exposes dynamic import functions)
and `import.meta.globEager` (eager, exposes already imported modules).



# [2.0.0-beta.16](https://github.com/vitejs/vite/compare/v2.0.0-beta.15...v2.0.0-beta.16) (2021-01-09)


### Bug Fixes

* inject css link when cssCodeSplit is disabled ([51a02ff](https://github.com/vitejs/vite/commit/51a02ff902c3afa4dff76b43f75b9221768cd7f8)), closes [#1141](https://github.com/vitejs/vite/issues/1141)
* set NODE_ENV for build ([d7ceabe](https://github.com/vitejs/vite/commit/d7ceabe92efe1c523ee05a6941e3f5042733b2bf)), closes [#1445](https://github.com/vitejs/vite/issues/1445) [#1452](https://github.com/vitejs/vite/issues/1452)


### Features

* allow tag injection after body open (body-prepend) ([#1435](https://github.com/vitejs/vite/issues/1435)) ([432487e](https://github.com/vitejs/vite/commit/432487e24cb8688c86502e3b4e284e25c81b7dd8))



# [2.0.0-beta.15](https://github.com/vitejs/vite/compare/v2.0.0-beta.14...v2.0.0-beta.15) (2021-01-09)


### Bug Fixes

* **hmr:** ensure all modules are fetched as import ([98bc767](https://github.com/vitejs/vite/commit/98bc7675a0f515ec6a908c6f18b2947a4a117836))



# [2.0.0-beta.14](https://github.com/vitejs/vite/compare/v2.0.0-beta.13...v2.0.0-beta.14) (2021-01-09)


### Features

* support ../ paths in glob import ([7f399e1](https://github.com/vitejs/vite/commit/7f399e1a628240fdcd866cddc45c5522b07fd7f6))



# [2.0.0-beta.13](https://github.com/vitejs/vite/compare/v2.0.0-beta.12...v2.0.0-beta.13) (2021-01-09)


### Bug Fixes

* always rebase path against root ([d704b7c](https://github.com/vitejs/vite/commit/d704b7c55fcbf347b5277a1d92dee4cc9583bab5)), closes [#1413](https://github.com/vitejs/vite/issues/1413)
* handle potential imports that has no correspodning chunks ([d47e10c](https://github.com/vitejs/vite/commit/d47e10c77d642b0446cb6ea1d5fd5a33346e9391))
* raw fetch requests should not be transformed ([0356c3c](https://github.com/vitejs/vite/commit/0356c3c5193a5aeb8586e5588c8c873df7a1a427)), closes [#1433](https://github.com/vitejs/vite/issues/1433)
* skip cjs rewrite for export * declarations ([cca015b](https://github.com/vitejs/vite/commit/cca015b1c46fff41e047a92430937f31df5e6dfb)), closes [#1439](https://github.com/vitejs/vite/issues/1439)
* **cli:** fix help for --root ([#1429](https://github.com/vitejs/vite/issues/1429)) ([7a55c5b](https://github.com/vitejs/vite/commit/7a55c5be36a6d04a5a1e434147f4208c4a64c492))
* **dev:** decode url before `sirv` resolve ([#1432](https://github.com/vitejs/vite/issues/1432)) ([7cc3cf1](https://github.com/vitejs/vite/commit/7cc3cf1044594297320ed62e1b38b27883f3f6c0)), closes [#1426](https://github.com/vitejs/vite/issues/1426)


### Features

* allow user define to overwrite default process.env. defines ([351ad4e](https://github.com/vitejs/vite/commit/351ad4ee56d46eb8837b6a90af19ef953e3fe28b))
* build support for data uri import ([4fd0b86](https://github.com/vitejs/vite/commit/4fd0b8615ef5ecff704ed44cadece613368cf18b))
* support import "glob:./*" ([8d8e2cc](https://github.com/vitejs/vite/commit/8d8e2cc9ea0e1cc8f620c0a9d143294c1efb37b0))



# [2.0.0-beta.12](https://github.com/vitejs/vite/compare/v2.0.0-beta.11...v2.0.0-beta.12) (2021-01-07)


### Bug Fixes

* **plugin-legacy:** avoid esbuild transform on legacy chunks ([7734105](https://github.com/vitejs/vite/commit/7734105093c6dabf64da6bfc11486aa9ac62efea))



# [2.0.0-beta.11](https://github.com/vitejs/vite/compare/v2.0.0-beta.10...v2.0.0-beta.11) (2021-01-07)


### Bug Fixes

* preserve html comments during dev ([b295400](https://github.com/vitejs/vite/commit/b2954009f48da0a0d3202eee802e51eb7a1fb6c5)), closes [#1420](https://github.com/vitejs/vite/issues/1420)
* **resolve:** respect exports env key order ([b58c860](https://github.com/vitejs/vite/commit/b58c860f1771deecb78e126dfe8b6f663bd5e7c9)), closes [#1418](https://github.com/vitejs/vite/issues/1418)
* avoid excessive quote in css public urls ([1437129](https://github.com/vitejs/vite/commit/1437129541b36c0453fcecb1f1d44b574cc3326f)), closes [#1399](https://github.com/vitejs/vite/issues/1399)
* do not rewrite dynamic import if format is not native es ([eb35bd5](https://github.com/vitejs/vite/commit/eb35bd546333f4edea94607d05581b887b2ce9b6))
* esbuild transform should filter id with and wihtout query ([4cda5be](https://github.com/vitejs/vite/commit/4cda5beb9f62c766dc8a8ab5d7b17704355348fc))
* fix cache invalidation for non-optimized deps with cross imports ([11c407a](https://github.com/vitejs/vite/commit/11c407a085e9facd810914a5d4256946c11a1ca9)), closes [#1401](https://github.com/vitejs/vite/issues/1401)
* html transform should not render boolean attr with false value ([a59ffef](https://github.com/vitejs/vite/commit/a59ffefe1087a45cc4c13ab9e15e1d43ccac114a))
* remove vue from optimize ignore list ([9eab790](https://github.com/vitejs/vite/commit/9eab79088079e95fb32f458a4bf573af7618bec6)), closes [#1408](https://github.com/vitejs/vite/issues/1408)
* support serving extension-less files in /public ([a7bca9c](https://github.com/vitejs/vite/commit/a7bca9c324db280ad3fa8255a36dee838a29255b)), closes [#1364](https://github.com/vitejs/vite/issues/1364)
* **build:** inline quotes css url to base64 ([#1412](https://github.com/vitejs/vite/issues/1412)) ([9b5b352](https://github.com/vitejs/vite/commit/9b5b3526de3288fc5d0e0a40fd80378db24674a1)), closes [#1409](https://github.com/vitejs/vite/issues/1409) [#1413](https://github.com/vitejs/vite/issues/1413)


### Code Refactoring

* pass `configFile` via inline config instead of extra arg in most ([24b3b5a](https://github.com/vitejs/vite/commit/24b3b5a4e4402543d45bd8e3e4ff9ff26c09d7cb))


### Features

* support specifying mode in user config ([396bbf8](https://github.com/vitejs/vite/commit/396bbf8c869b23360a39bc4d99b760e25645c84b)), closes [#1380](https://github.com/vitejs/vite/issues/1380)
* **plugin-legacy:** @vitejs/plugin-legacy ([8c34870](https://github.com/vitejs/vite/commit/8c34870040f8c2f4be7d00245a3683f9e64d894e))
* **proxy:** add rewrite support for ws ([#1407](https://github.com/vitejs/vite/issues/1407)) ([fa3bc34](https://github.com/vitejs/vite/commit/fa3bc34e23e757d57ca42e66c41dc8e712ae5547))
* also expose correspodning chunk in build html transform ([b2f4836](https://github.com/vitejs/vite/commit/b2f4836ea83d7ba86c2ef3a082773d5045f2e7d9))
* expose loadConfigFromFile API ([#1403](https://github.com/vitejs/vite/issues/1403)) ([9582171](https://github.com/vitejs/vite/commit/958217177c3173b7e5dec7f29048a2e83168649b))


### BREAKING CHANGES

* the following JavaScript APIs now expect `configFile`
as a property of the config object passed in instead of an argument:

    - `createServer`
    - `build`
    - `resolveConfig`



# [2.0.0-beta.10](https://github.com/vitejs/vite/compare/v2.0.0-beta.9...v2.0.0-beta.10) (2021-01-06)


### Bug Fixes

* **alias:** normalize alias behavior when there is ending slash ([c4739a3](https://github.com/vitejs/vite/commit/c4739a3f6d341db220cc5732857cf194c7cecc0d)), closes [#1363](https://github.com/vitejs/vite/issues/1363)
* **build:** Pass `allowNodeBuiltins` to rollup instead of empty array (Fixes [#1392](https://github.com/vitejs/vite/issues/1392)) ([#1393](https://github.com/vitejs/vite/issues/1393)) ([f209ad9](https://github.com/vitejs/vite/commit/f209ad9c858235ea317db6beb3bf2ab5ec26c153))
* avoid replacing process.env member expression ([c8f4bb9](https://github.com/vitejs/vite/commit/c8f4bb92337c8882f238ea395f169af96a59d2ae)), closes [#930](https://github.com/vitejs/vite/issues/930)



# [2.0.0-beta.9](https://github.com/vitejs/vite/compare/v2.0.0-beta.8...v2.0.0-beta.9) (2021-01-06)


### Bug Fixes

* properly handle browser: false resolving ([da09320](https://github.com/vitejs/vite/commit/da09320e3671dbf08a5f8c4a78bd273f75fdcd7d)), closes [#1386](https://github.com/vitejs/vite/issues/1386)
* properly handle ts worker source ([eea1224](https://github.com/vitejs/vite/commit/eea122434740a60d353df54cb4dc108e29d4ef87)), closes [#1385](https://github.com/vitejs/vite/issues/1385)


### Features

* **env:** also expose VITE_ variables from actual env ([956cd2c](https://github.com/vitejs/vite/commit/956cd2c76e69ba046f51a36af8e44ae9fb3a67ab))



# [2.0.0-beta.8](https://github.com/vitejs/vite/compare/v2.0.0-beta.7...v2.0.0-beta.8) (2021-01-05)


### Bug Fixes

* **resolve:** handle exports field w/ mapped directory ([724aa8a](https://github.com/vitejs/vite/commit/724aa8a5fcb0ccaea283b3bf065d29ebf2cdf5a2))


### Features

* **build:** default build target to 'modules' with dynamic import polyfill ([756e90f](https://github.com/vitejs/vite/commit/756e90ff9b7d0b838ac3a2d7a20c36c801f72d8c))
* allow boolean attr values in html transform tag descriptors ([#1381](https://github.com/vitejs/vite/issues/1381)) ([0fad96e](https://github.com/vitejs/vite/commit/0fad96e5cbff48efd3a13bb27580de894e1ec728))



# [2.0.0-beta.7](https://github.com/vitejs/vite/compare/v2.0.0-beta.6...v2.0.0-beta.7) (2021-01-05)


### Code Refactoring

* update client type usage ([245303c](https://github.com/vitejs/vite/commit/245303ca35ff2a40eca49e102b4f82cb1210f597))


### BREAKING CHANGES

* client types are now exposed under `vite/client.d.ts`.
It can now be included via the following `tsconfig.json`:

    ```ts
    {
      "compilerOptions": {
        "types": ["vite/client"]
      }
    }
    ```



# [2.0.0-beta.6](https://github.com/vitejs/vite/compare/v2.0.0-beta.5...v2.0.0-beta.6) (2021-01-05)


### Bug Fixes

* **css:** ensure options for .styl ([b3237ff](https://github.com/vitejs/vite/commit/b3237fff697b4b8b0e10adc9e0041f64c33fbc2d)), closes [#1351](https://github.com/vitejs/vite/issues/1351)
* **error-handling:** avoid serilaizing unnecessary error properties when seinding to client ([61aec65](https://github.com/vitejs/vite/commit/61aec651b470d5b97f2340a1b692b82cfe0c8ba5)), closes [#1373](https://github.com/vitejs/vite/issues/1373)
* **optimizer:** optimizer should not be affected by config rollup options ([ba08310](https://github.com/vitejs/vite/commit/ba08310b9e82668670af8a95e889e7cb68388e84)), closes [#1372](https://github.com/vitejs/vite/issues/1372)
* support aliases in html references ([68eac64](https://github.com/vitejs/vite/commit/68eac643f907fb4d57bd25925a342692441b1d97)), closes [#1363](https://github.com/vitejs/vite/issues/1363)
* **optimizer:** resolve linked dep from relative root ([#1375](https://github.com/vitejs/vite/issues/1375)) ([034bbcd](https://github.com/vitejs/vite/commit/034bbcd1738426d89e6c942f27dd1ccc8ede3990))


### Code Refactoring

* remove the need for specifying `transformInclude` ([99522d0](https://github.com/vitejs/vite/commit/99522d0edf06da4b8519c209f5f928cdf2951105))


### Features

* exclude vue from optimization ([1046fe0](https://github.com/vitejs/vite/commit/1046fe008b3288633bf8b38efdc2401a5ad2bf47))
* improve import analysis fail warning ([2b39fce](https://github.com/vitejs/vite/commit/2b39fce9450dc0d8bc99b06a6d757f4e48193001)), closes [#1368](https://github.com/vitejs/vite/issues/1368)


### BREAKING CHANGES

* `transformInclude` option has been removed and is no
longer necessary. This allows full dynamic imports to custom file types
to automatically qualify for the transform pipeline.

    - All requests that accept `*/*` AND is not declared an asset type
    will now qualify for the transform pipeline.

    - To exclude an asset type from being transformed when requested
    directly, declare it as asset via `config.assetsInclude`.



# [2.0.0-beta.5](https://github.com/vitejs/vite/compare/v2.0.0-beta.4...v2.0.0-beta.5) (2021-01-05)


### Bug Fixes

* only append dep version query for known types ([42cd8b2](https://github.com/vitejs/vite/commit/42cd8b217de6afb53163eef69e96514c75de4443))
* **css:** fix css comment removal ([7b9dee0](https://github.com/vitejs/vite/commit/7b9dee020785022acaa8e6989dcb2cc7ec03c3f2)), closes [#1359](https://github.com/vitejs/vite/issues/1359)
* **css:** inline css in all non-entry split chunks ([e90ff76](https://github.com/vitejs/vite/commit/e90ff76d1c6d5ad1d079c953ba4fbfc84be73185)), closes [#1356](https://github.com/vitejs/vite/issues/1356)
* do not bundle resolve for yarn 2 compat ([3524e96](https://github.com/vitejs/vite/commit/3524e96da0de59e5dddf2210dc78e2a1de3f07e0)), closes [#1353](https://github.com/vitejs/vite/issues/1353)
* do not error on unresolved commonjs externals ([60a4708](https://github.com/vitejs/vite/commit/60a470880034fcd7e54c15b4cf92f738b973a3df)), closes [#1339](https://github.com/vitejs/vite/issues/1339)
* only allow built-ins as externals if building for ssr ([804c9a3](https://github.com/vitejs/vite/commit/804c9a30e673386c419a0582d0da11f805c285c4))
* run mutiple output builds sequantially ([ab80522](https://github.com/vitejs/vite/commit/ab805228e55bd79275b6ac67b0408419a8ab5c70))


### Features

* **types:** separate client type shims from main types ([0cddbbc](https://github.com/vitejs/vite/commit/0cddbbc4bfc8e85329ba710117b9aec1d67d318d))
* default clean-css level to 1 + expose options ([ef100d0](https://github.com/vitejs/vite/commit/ef100d09cbd1c6745108afc2877396fe69b08bdd)), closes [#936](https://github.com/vitejs/vite/issues/936)
* support plugin.apply ([d914b54](https://github.com/vitejs/vite/commit/d914b542450cd7b4bbeb057a0fee8f79efd2bb9d))



# [2.0.0-beta.4](https://github.com/vitejs/vite/compare/v2.0.0-beta.3...v2.0.0-beta.4) (2021-01-04)


### Bug Fixes

* stop service in build esbuild plugin as well ([1a90b4e](https://github.com/vitejs/vite/commit/1a90b4e50250c4011a058e9e121b7b80caff888e))
* **build:** rollup import resolving message ([#1336](https://github.com/vitejs/vite/issues/1336)) [skip ci] ([87d55f4](https://github.com/vitejs/vite/commit/87d55f43e90edb36c2f0d49d71ffadd20f82e97a))
* **resolve:** always prioritize browser field ([409988f](https://github.com/vitejs/vite/commit/409988fbbb5d854ccbbae0dd81f757eb42e24c40))
* [@fs](https://github.com/fs) paths resolving for win32 ([#1317](https://github.com/vitejs/vite/issues/1317)) ([0a94c88](https://github.com/vitejs/vite/commit/0a94c88238f265a14c116c2f1306d3be74b182e6))
* do not error on css deep imports ([25adf1e](https://github.com/vitejs/vite/commit/25adf1eefaf6817f9443365f5ee3fcf0d63ffd6f))
* ensure consistent module entry urls by removing import query ([2b82e84](https://github.com/vitejs/vite/commit/2b82e84a272db2a4269d742dd7b9a8a1ad8351dd)), closes [#1321](https://github.com/vitejs/vite/issues/1321)
* load source map from sourceMappingURL comment ([#1327](https://github.com/vitejs/vite/issues/1327)) ([1f89b0e](https://github.com/vitejs/vite/commit/1f89b0e704d4315246836d2cd7faf3cdcdf89dd9))
* sourcemap path mangled by browser ([#1326](https://github.com/vitejs/vite/issues/1326)) ([1da12ba](https://github.com/vitejs/vite/commit/1da12baf00ab8e7c3366f9c0e088c09cce903934)), closes [#1323](https://github.com/vitejs/vite/issues/1323)
* **dev:** display localetime correctly ([#1310](https://github.com/vitejs/vite/issues/1310)) ([06663a7](https://github.com/vitejs/vite/commit/06663a7e7825bedd61593d299f00110f6ac40916))


### Features

* esbuild.(include|exclude|jsxInject) ([b5b1496](https://github.com/vitejs/vite/commit/b5b14962b53d8dcbae850b9eb6abf2ca5820b3db))
* **wasm:** use `instantiateStreaming` when available ([#1330](https://github.com/vitejs/vite/issues/1330)) ([2286f62](https://github.com/vitejs/vite/commit/2286f629ab6d96fb0b90c9825582962bf8f0f2a5)), closes [#1143](https://github.com/vitejs/vite/issues/1143)
* export normalizePath helper ([#1313](https://github.com/vitejs/vite/issues/1313)) ([37d1a5d](https://github.com/vitejs/vite/commit/37d1a5de019cfd5db397f5c8e0365222950c1dff))



# [2.0.0-beta.3](https://github.com/vitejs/vite/compare/v2.0.0-beta.2...v2.0.0-beta.3) (2021-01-03)


### Bug Fixes

* **build:** fix import-fresh shim ([b57d74c](https://github.com/vitejs/vite/commit/b57d74c2b72498aee251ed7ed45ff046a98d5499)), closes [#1306](https://github.com/vitejs/vite/issues/1306)
* decode incoming URL ([f52db58](https://github.com/vitejs/vite/commit/f52db5898dfb1eecb4b3427a73ffd7ecd2ac15d6)), closes [#1308](https://github.com/vitejs/vite/issues/1308)
* keep `this` defined in `configureServer` hook ([#1304](https://github.com/vitejs/vite/issues/1304)) ([b665b92](https://github.com/vitejs/vite/commit/b665b92323521475a568f8c5204a83c0e80a6b75))
* **resolve:** prioritize module + avoid mutating path when ([6ce6d5c](https://github.com/vitejs/vite/commit/6ce6d5c2908c20b8308725a5f91f5a618aa09d8a)), closes [#1299](https://github.com/vitejs/vite/issues/1299)


### Features

* dedupe option ([7858e62](https://github.com/vitejs/vite/commit/7858e629273269ca2aedf9891d560521a4bd0c8d)), closes [#1302](https://github.com/vitejs/vite/issues/1302)
* export `resolvePackageData` and `resolvePackageEntry` helpers ([#1307](https://github.com/vitejs/vite/issues/1307)) ([38b9613](https://github.com/vitejs/vite/commit/38b9613832d1af569ca5aba4226895f0bd7897a0))
* expose `loadEnv` in public api ([#1300](https://github.com/vitejs/vite/issues/1300)) ([9d0a8e7](https://github.com/vitejs/vite/commit/9d0a8e74d1553c8c9108caeaf0c22cd938a502c7))



# [2.0.0-beta.2](https://github.com/vitejs/vite/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2021-01-02)


### Bug Fixes

* do not attempt to transform html requests ([a7a5c5b](https://github.com/vitejs/vite/commit/a7a5c5bbd9d26e46fb3a175c80bd898cdfce5572))
* fix spa fallback on paths ending with slash ([60fe476](https://github.com/vitejs/vite/commit/60fe476638930702fb94f906afcf6d1dc4dfab7b))
* **resolve:** prioritize browser field ([dfef3de](https://github.com/vitejs/vite/commit/dfef3de9a5875c238d9a795a461e47634db9809f)), closes [#1154](https://github.com/vitejs/vite/issues/1154)
* **resolve:** resolve inline package ([e27fe30](https://github.com/vitejs/vite/commit/e27fe30e7920d22f4ad786e5bfb14415d73cc2cc)), closes [#1291](https://github.com/vitejs/vite/issues/1291)
* dynamic load postcss plugin ([#1292](https://github.com/vitejs/vite/issues/1292)) ([00c7370](https://github.com/vitejs/vite/commit/00c737024a72ab3e2c5c17f74b2bf28c5b0d158f)), closes [#1287](https://github.com/vitejs/vite/issues/1287)
* fix transform result check for empty result ([2adfa8b](https://github.com/vitejs/vite/commit/2adfa8b1bdc01297a030f8cb3066df7f7a753d3c)), closes [#1278](https://github.com/vitejs/vite/issues/1278)


### Code Refactoring

* **hmr:** pass context object to `handleHotUpdate` plugin hook ([b314771](https://github.com/vitejs/vite/commit/b3147710e96a8f88ab81b2e45dbf7e7174ad976c))


### Reverts

* Revert "types: worker types" (#1295) ([806ef96](https://github.com/vitejs/vite/commit/806ef9697069db581eaa2c1721db5d3e08707a7d)), closes [#1295](https://github.com/vitejs/vite/issues/1295)


### BREAKING CHANGES

* **hmr:** `handleHotUpdate` plugin hook now receives a single
`HmrContext` argument instead of multiple args.



# [2.0.0-beta.1](https://github.com/vitejs/vite/compare/v2.0.0-alpha.5...v2.0.0-beta.1) (2021-01-02)


### Bug Fixes

* --open and --filter arguments ([#1259](https://github.com/vitejs/vite/issues/1259)) ([0c0bc4a](https://github.com/vitejs/vite/commit/0c0bc4a33c99da22be96214af872344f930732d4))
* handle hmr errors ([ff2b3ce](https://github.com/vitejs/vite/commit/ff2b3cef01750c3cb33d39dc726317cbd832568b))
* overlay z-index ([6b3278e](https://github.com/vitejs/vite/commit/6b3278eff8702c45bd8dbace35baca337fb89682))
* **css:** respect minify option for chunk css ([6a287a1](https://github.com/vitejs/vite/commit/6a287a176dd4be6e290d3be0490e39b92916a0d0))


### Features

* also call buildEnd on container close ([94a8def](https://github.com/vitejs/vite/commit/94a8def3bcc673c00ff56f9d19b9933c6426c605))
* provide default typing for supported file types ([a9c7eac](https://github.com/vitejs/vite/commit/a9c7eaca1cf8ab0f590bb605da49fd4daa766244))
* support resolveId returning arbitrary value ([b782af4](https://github.com/vitejs/vite/commit/b782af44cc968cc4f18ef0722302991406fa82de))



# [2.0.0-alpha.5](https://github.com/vitejs/vite/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2020-12-30)


### Bug Fixes

* **css:** properly prevent css from being tree-shaken ([7f08835](https://github.com/vitejs/vite/commit/7f088352894f3fcc06e6936917de4bb70b5763dc))



# [2.0.0-alpha.4](https://github.com/vitejs/vite/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2020-12-30)


### Bug Fixes

* **css:** fix cssCodeSplit: false ([9a02203](https://github.com/vitejs/vite/commit/9a0220304bd6bc655078b7705b95f3cfd1059e36))
* disable cssCodeSplit by default in lib mode ([e64509a](https://github.com/vitejs/vite/commit/e64509a680fdb01ff25393f9c65f34ac87eb799a))
* fix terser worker thread when vite is linked ([a28419b](https://github.com/vitejs/vite/commit/a28419bafc649192cdb6eca3f6014e3b823d1c0a))
* inline assets in lib mode ([c976d10](https://github.com/vitejs/vite/commit/c976d10ac1e40f0c59bcb02c1016ed6f39563ca0))



# [2.0.0-alpha.3](https://github.com/vitejs/vite/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2020-12-30)



# [2.0.0-alpha.2](https://github.com/vitejs/vite/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2020-12-29)


### Bug Fixes

* **plugin-vue:** avoid throwing on never requested file ([48a24c1](https://github.com/vitejs/vite/commit/48a24c1fa1f64e89ca853635580911859ef5881b))



# [2.0.0-alpha.1](https://github.com/vitejs/vite/compare/v1.0.0-rc.13...v2.0.0-alpha.1) (2020-12-29)

- [x] new universal plugin format
- [x] framework agnostic core
- [x] smaller and faster install
- [x] improved JS API
- [x] improved alias and resolving
- [x] improved page reload performance (strong caching of npm deps)
- [x] error overlay
- [x] better vue perf (single request in most cases)
- [x] multi entry mode
- [x] lib mode
