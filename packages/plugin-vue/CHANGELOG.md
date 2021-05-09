## [1.2.2](https://github.com/vitejs/vite/compare/plugin-vue@1.2.1...plugin-vue@1.2.2) (2021-04-24)


### Bug Fixes

* **plugin-vue:** add newline character before class components, fix [#2787](https://github.com/vitejs/vite/issues/2787) ([#2933](https://github.com/vitejs/vite/issues/2933)) ([8fe828e](https://github.com/vitejs/vite/commit/8fe828e9be9e9de67463af6f5dc35ebdbfdbda28))
* **plugin-vue:** avoid duplicate import, fix [#2640](https://github.com/vitejs/vite/issues/2640) ([#2897](https://github.com/vitejs/vite/issues/2897)) ([011438d](https://github.com/vitejs/vite/commit/011438d16dc42408d5229b842d67dba28868566b))
* **plugin-vue:** respect `hmr: false` server config, fix [#2790](https://github.com/vitejs/vite/issues/2790) ([#2797](https://github.com/vitejs/vite/issues/2797)) ([27e0c3f](https://github.com/vitejs/vite/commit/27e0c3fffd32a0ff90d06a909a5d5cc7d73f44b0))



## [1.2.1](https://github.com/vitejs/vite/compare/plugin-vue@1.2.0...plugin-vue@1.2.1) (2021-03-31)


### Bug Fixes

* **plugin-vue:** allow to overwrite feature flags ([#2675](https://github.com/vitejs/vite/issues/2675)) ([a4acc16](https://github.com/vitejs/vite/commit/a4acc161e10fb6d122f808ad6211feef389d41a9))



# [1.2.0](https://github.com/vitejs/vite/compare/plugin-vue@1.1.5...plugin-vue@1.2.0) (2021-03-26)


### Features

* **plugin-vue:** enable :slotted usage detection ([c40c49f](https://github.com/vitejs/vite/commit/c40c49f6fa806406364f4982fe45a69db15c204f))



## [1.1.5](https://github.com/vitejs/vite/compare/plugin-vue@1.1.4...plugin-vue@1.1.5) (2021-02-26)


### Bug Fixes

* **plugin-vue:** fix hmr when emptying sfc file ([#2142](https://github.com/vitejs/vite/issues/2142)) ([493b942](https://github.com/vitejs/vite/commit/493b94259d6a499e03684d6001fea1a96d56810c)), closes [#2128](https://github.com/vitejs/vite/issues/2128)
* **plugin-vue:** handle default rewrite edge case for commented class ([2900a9a](https://github.com/vitejs/vite/commit/2900a9a6a501628588b31f7453e2fe5a71fe45ce)), closes [#2277](https://github.com/vitejs/vite/issues/2277)
* **plugin-vue:** import vue file as raw correctly ([#1923](https://github.com/vitejs/vite/issues/1923)) ([5b56d70](https://github.com/vitejs/vite/commit/5b56d70c1d173d4c5e3d9532f9c3bc6f8bfc020c))



## [1.1.4](https://github.com/vitejs/vite/compare/plugin-vue@1.1.3...plugin-vue@1.1.4) (2021-01-30)


### Bug Fixes

* **plugin-vue:** handle block src pointing to dependency files ([bb7da3f](https://github.com/vitejs/vite/commit/bb7da3f0f07da6558f0e81bd82ede4cfe1785a56)), closes [#1812](https://github.com/vitejs/vite/issues/1812)



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
