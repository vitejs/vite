## [1.1.3](https://github.com/vitejs/vite/compare/plugin-vue@1.1.2...plugin-vue@1.1.3) (2021-01-29)


### Bug Fixes

* **plugin-vue:** special handling for class default export in sfc ([d3397e6](https://github.com/vitejs/vite/commit/d3397e61cd9d0761606506dcc176a1cbc845d8b5)), closes [#1476](https://github.com/vitejs/vite/issues/1476)



## [1.1.2](https://github.com/vitejs/vite/compare/plugin-vue@1.1.1...plugin-vue@1.1.2) (2021-01-24)



## [1.1.1](https://github.com/vitejs/vite/compare/plugin-vue@1.1.0...plugin-vue@1.1.1) (2021-01-23)


### Bug Fixes

* avoid eager hmr api access ([fa37456](https://github.com/vitejs/vite/commit/fa37456584a09b52b39a61760a6d130e261886ff))


### Features

* support `base` option during dev, deprecate `build.base` ([#1556](https://github.com/vitejs/vite/issues/1556)) ([809d4bd](https://github.com/vitejs/vite/commit/809d4bd3bf62d3bc6b35f182178922d2ab2175f1))



# [1.1.0](https://github.com/vitejs/vite/compare/plugin-vue@1.0.6...plugin-vue@1.1.0) (2021-01-19)


### Features

* ssr manifest for preload inference ([107e79e](https://github.com/vitejs/vite/commit/107e79e7b7d422f0d1dbe8b7b435636df7c6281c))
* **plugin-vue:** support for vite core new ssr impl ([a93ab23](https://github.com/vitejs/vite/commit/a93ab23491ee9fee78345ddc20567e1b0ceec2a7))



## [1.0.6](https://github.com/vitejs/vite/compare/plugin-vue@1.0.5...plugin-vue@1.0.6) (2021-01-15)


### Bug Fixes

* **plugin-vue:** sfc src import respect alias ([#1544](https://github.com/vitejs/vite/issues/1544)) ([d8754de](https://github.com/vitejs/vite/commit/d8754deeb16ef0d86b17dfa2a3394d0919bcd72e)), closes [#1542](https://github.com/vitejs/vite/issues/1542)



## [1.0.5](https://github.com/vitejs/vite/compare/plugin-vue@1.0.4...plugin-vue@1.0.5) (2021-01-09)


### Bug Fixes

* **plugin-vue:** default pug doctype ([756a0f2](https://github.com/vitejs/vite/commit/756a0f26911e5bff9c1ea3f780a0a1eccd1f1cfd)), closes [#1383](https://github.com/vitejs/vite/issues/1383)
* **plugin-vue:** pass on script and style options to compiler-sfc ([0503d42](https://github.com/vitejs/vite/commit/0503d42aaddbc4b8428c94ede07cf7b84f800cef)), closes [#1450](https://github.com/vitejs/vite/issues/1450)



## [1.0.4](https://github.com/vitejs/vite/compare/plugin-vue@1.0.3...plugin-vue@1.0.4) (2021-01-04)


### Bug Fixes

* **plugin-vue:** mark SFC compiler options as `Partial` ([#1316](https://github.com/vitejs/vite/issues/1316)) ([331484c](https://github.com/vitejs/vite/commit/331484c2600e96543aa8007b4940d023cb5cc19f))


### Features

* **plugin-vue:** export vue query parse API ([#1303](https://github.com/vitejs/vite/issues/1303)) ([56bcb0c](https://github.com/vitejs/vite/commit/56bcb0c475a5dff31527cad6dcd7c61fde424f5e))



## [1.0.3](https://github.com/vitejs/vite/compare/plugin-vue@1.0.2...plugin-vue@1.0.3) (2021-01-02)


### Bug Fixes

* **plugin-vue:** custom block prev handling ([8dbc2b4](https://github.com/vitejs/vite/commit/8dbc2b47dd8fea4a953fb05057edb47122e2dcb7))


### Code Refactoring

* **hmr:** pass context object to `handleHotUpdate` plugin hook ([b314771](https://github.com/vitejs/vite/commit/b3147710e96a8f88ab81b2e45dbf7e7174ad976c))


### BREAKING CHANGES

* **hmr:** `handleHotUpdate` plugin hook now receives a single
`HmrContext` argument instead of multiple args.



## [1.0.2](https://github.com/vitejs/vite/compare/plugin-vue@1.0.2...plugin-vue@1.0.2) (2021-01-02)


### Bug Fixes

* **plugin-vue:** avoid throwing on never requested file ([48a24c1](https://github.com/vitejs/vite/commit/48a24c1fa1f64e89ca853635580911859ef5881b))
* **plugin-vue:** custom block prev handling ([8dbc2b4](https://github.com/vitejs/vite/commit/8dbc2b47dd8fea4a953fb05057edb47122e2dcb7))
* avoid self referencing type in plugin-vue ([9cccdaa](https://github.com/vitejs/vite/commit/9cccdaa0935ca664c8a709a89ebd1f2216565546))
* **plugin-vue:** ensure id on descriptor ([91217f6](https://github.com/vitejs/vite/commit/91217f6d968485303e71128bb79ad4400b9b4412))
