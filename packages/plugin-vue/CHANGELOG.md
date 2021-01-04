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
