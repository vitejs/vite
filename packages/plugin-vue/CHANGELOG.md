# [1.10.0-beta.0](https://github.com/vitejs/vite/compare/plugin-vue@1.9.4...plugin-vue@1.10.0-beta.0) (2021-10-28)



## [1.9.4](https://github.com/vitejs/vite/compare/plugin-vue@1.9.3...plugin-vue@1.9.4) (2021-10-27)


### Bug Fixes

* **plugin-vue:** exclude direct css request from hmr target ([#5422](https://github.com/vitejs/vite/issues/5422)) ([4331c26](https://github.com/vitejs/vite/commit/4331c26a5e5d7a9efc08a8b7bf7056785a1bcd94))



## [1.9.3](https://github.com/vitejs/vite/compare/plugin-vue@1.9.2...plugin-vue@1.9.3) (2021-10-05)


### Bug Fixes

* **plugin-vue:** don't use object spread in the config hook ([#5155](https://github.com/vitejs/vite/issues/5155)) ([c1ce471](https://github.com/vitejs/vite/commit/c1ce471c07264db034f42573662971f0dc531df7))



## [1.9.2](https://github.com/vitejs/vite/compare/plugin-vue@1.9.1...plugin-vue@1.9.2) (2021-09-24)


### Bug Fixes

* **plugin-vue:** handle rewrite default edge case with TS ([609a342](https://github.com/vitejs/vite/commit/609a342986b2d3b05ef59dc23523239938264008))


### Reverts

* Revert "feat(plugin-vue): define __VUE_SSR__ flag" ([3e2c1bf](https://github.com/vitejs/vite/commit/3e2c1bf74bb8ef583d66c67c715fdeae8d8fe432))



## [1.9.1](https://github.com/vitejs/vite/compare/plugin-vue@1.9.0...plugin-vue@1.9.1) (2021-09-23)


### Features

* ~~**plugin-vue:** define __VUE_SSR__ flag ([49618c1](https://github.com/vitejs/vite/commit/49618c17f38ee54ea17b4b04d58eb5fbf3e532fe))~~ (Reverted)



# [1.9.0](https://github.com/vitejs/vite/compare/plugin-vue@1.8.1...plugin-vue@1.9.0) (2021-09-21)


### Bug Fixes

* **plugin-vue:** enable ts in template also for lang=tsx ([ed88df3](https://github.com/vitejs/vite/commit/ed88df30a93d759e5c4ac0f079b9f604fad2ce40))


### Features

* **plugin-vue:** support optional @vue/compiler-sfc peer dep ([b17b5ae](https://github.com/vitejs/vite/commit/b17b5ae68de50413a95fb992ceda92ec0fceaa86))



## [1.8.1](https://github.com/vitejs/vite/compare/plugin-vue@1.8.0...plugin-vue@1.8.1) (2021-09-19)


### Bug Fixes

* **plugin-vue:** generate tree-shakable code ([316d7af](https://github.com/vitejs/vite/commit/316d7afc0c84e51359938a12ebe1b09ca34ea8bd))



# [1.8.0](https://github.com/vitejs/vite/compare/plugin-vue@1.7.1...plugin-vue@1.8.0) (2021-09-18)


### Bug Fixes

* **deps:** update all non-major dependencies ([#4545](https://github.com/vitejs/vite/issues/4545)) ([a44fd5d](https://github.com/vitejs/vite/commit/a44fd5d38679da0be2536103e83af730cda73a95))


### Performance Improvements

* **plugin-vue:** inline main script for build + avoid sourcemap generation when possible ([93d9a2d](https://github.com/vitejs/vite/commit/93d9a2d175b1a1e3fe54197856a86887b1dadb74))



## [1.7.1](https://github.com/vitejs/vite/compare/plugin-vue@1.7.0...plugin-vue@1.7.1) (2021-09-18)


### Bug Fixes

* **plugin-vue:** properly handle in-template TS syntax + tests ([0a2a5e1](https://github.com/vitejs/vite/commit/0a2a5e1c8b9d2765faecfb5e4641b1c5a94575e1))



# [1.7.0](https://github.com/vitejs/vite/compare/plugin-vue@1.6.2...plugin-vue@1.7.0) (2021-09-18)


### Features

* **plugin-vue:** support TS in template expressions ([01fa2ab](https://github.com/vitejs/vite/commit/01fa2abe901834c1c3168c343120429700e82983))



## [1.6.2](https://github.com/vitejs/vite/compare/plugin-vue@1.6.1...plugin-vue@1.6.2) (2021-09-08)


### Bug Fixes

* **plugin-vue:** ensure descriptor in case main request is cached ([85612fe](https://github.com/vitejs/vite/commit/85612fe69da98759dbf3b5352cf47a74f20374ff))



## [1.6.1](https://github.com/vitejs/vite/compare/plugin-vue@1.6.0...plugin-vue@1.6.1) (2021-09-06)


### Bug Fixes

* hmr doesn't work when modifying the code of jsx in sfc ([#4563](https://github.com/vitejs/vite/issues/4563)) ([1012367](https://github.com/vitejs/vite/commit/101236794c5d6d28591302d5552cb1c0ab8f4115))
* **plugin-vue:** avoid applying ref transform to dependencies by default ([cd4f341](https://github.com/vitejs/vite/commit/cd4f341201d5598c3ec9cc594949e7d5304ac7ec))



# [1.6.0](https://github.com/vitejs/vite/compare/plugin-vue@1.5.0...plugin-vue@1.6.0) (2021-08-24)


### Features

* **plugin-vue:** latest ref transform support ([533b002](https://github.com/vitejs/vite/commit/533b0029adc912257251b5021879ab1d676a16ab))
* **plugin-vue:** warn compiler-sfc version mismatch ([e7263b9](https://github.com/vitejs/vite/commit/e7263b98f2e174198b322d26c6a7207d706a6639))



# [1.5.0](https://github.com/vitejs/vite/compare/plugin-vue@1.4.0...plugin-vue@1.5.0) (2021-08-24)



# [1.4.0](https://github.com/vitejs/vite/compare/plugin-vue@1.3.0...plugin-vue@1.4.0) (2021-08-07)

### Features

* Custom Elements mode behavior changed: now only inlines the CSS and no longer exports the custom element constructor (exports the component as in normal mode). Users now need to explicitly call `defineCustomElement` on the component. This allows the custom element to be defined using an async version of the source component.

### Bug Fixes

* revert update dependency slash to v4 ([#4118](https://github.com/vitejs/vite/issues/4118)) ([#4519](https://github.com/vitejs/vite/issues/4519)) ([9b4fe1f](https://github.com/vitejs/vite/commit/9b4fe1fa68c522878d1bdef87d7aa02ae08e986f))



# [1.3.0](https://github.com/vitejs/vite/compare/plugin-vue@1.2.5...plugin-vue@1.3.0) (2021-07-27)


### Bug Fixes

* reuse the old preprocessor after changing the lang attr ([#4224](https://github.com/vitejs/vite/issues/4224)) ([7a3c6e6](https://github.com/vitejs/vite/commit/7a3c6e616385cbc069620ae583d6739a972c0ead))


### Features

* **plugin-vue:** support importing vue files as custom elements ([3a3af6e](https://github.com/vitejs/vite/commit/3a3af6eeafbc9fc686fc909ec6a61c61283316fc))



## [1.2.5](https://github.com/vitejs/vite/compare/plugin-vue@1.2.4...plugin-vue@1.2.5) (2021-07-12)



## [1.2.4](https://github.com/vitejs/vite/compare/plugin-vue@1.2.3...plugin-vue@1.2.4) (2021-06-27)


### Bug Fixes

* **ssr:** normalize manifest filenames ([#3706](https://github.com/vitejs/vite/issues/3706)) ([aa8ca3f](https://github.com/vitejs/vite/commit/aa8ca3f35218c9fb48f87d3f6f4681d379ee45ca)), closes [#3303](https://github.com/vitejs/vite/issues/3303)



## [1.2.3](https://github.com/vitejs/vite/compare/plugin-vue@1.2.2...plugin-vue@1.2.3) (2021-06-01)


### Bug Fixes

* **plugin-vue:** rewrite default after ts compiled ([#3591](https://github.com/vitejs/vite/issues/3591)) ([ea5bafa](https://github.com/vitejs/vite/commit/ea5bafaefbafd858389f88e537cb3473b4669802))



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
