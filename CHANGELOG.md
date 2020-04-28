## [0.6.1](https://github.com/vuejs/vite/compare/v0.6.0...v0.6.1) (2020-04-28)


### Bug Fixes

* rewrite should only serve cache if upstream is 304 ([c3a7a96](https://github.com/vuejs/vite/commit/c3a7a967ee9048ca6fc2642b3494b0e60978bf24))
* tag -> etag ([43fe56f](https://github.com/vuejs/vite/commit/43fe56f61b3f5cd8fc51d33916d79e154042bc8c))



# [0.6.0](https://github.com/vuejs/vite/compare/v0.5.3...v0.6.0) (2020-04-27)


### Bug Fixes

* fix hmr for windows
* only set 304 if etag matches ([e0c7354](https://github.com/vuejs/vite/commit/e0c73543a6c792046f9d7e9a0a481f567f4e21ec))
* fix resolving scoped packages and relative imports inside `node_modules` ([#15](https://github.com/vuejs/vite/issues/15)) ([78ae1b7](https://github.com/vuejs/vite/commit/78ae1b745bc5cf269b6ccfc12b129b404f0e9026))


### Features

* http caching for vue requests ([ecc7219](https://github.com/vuejs/vite/commit/ecc7219786e363988976f15d9223565a34a673eb))



## [0.5.3](https://github.com/vuejs/vite/compare/v0.5.1...v0.5.3) (2020-04-26)


### Bug Fixes

* **hmr:** fix template + style update hmr ([cdcb930](https://github.com/vuejs/vite/commit/cdcb930e62fe46cf4cdb229f747eefdf09385fc8)), closes [#13](https://github.com/vuejs/vite/issues/13)
* fix `<style module>` hmr ([6cef3fe](https://github.com/vuejs/vite/commit/6cef3fea75adf7ba666239234951fd6722d5fc9e))


### Features

* added local addresses ([#8](https://github.com/vuejs/vite/issues/8)) ([f402c7b](https://github.com/vuejs/vite/commit/f402c7b8e9cf369ec56be5bc70749395d4cb37b6))



## [0.5.1](https://github.com/vuejs/vite/compare/v0.5.0...v0.5.1) (2020-04-24)



# [0.5.0](https://github.com/vuejs/vite/compare/v0.4.0...v0.5.0) (2020-04-24)


### Features

* add import analysis cache ([868aa21](https://github.com/vuejs/vite/commit/868aa217243da2284bab0eb7fc9e7cc549df8ea1))
* css modules support ([fbbdb19](https://github.com/vuejs/vite/commit/fbbdb19005384879c91d249aef1acddda9ac0374))
* support preprocessors in vite build ([5a7a4e2](https://github.com/vuejs/vite/commit/5a7a4e287711148608966cad1c97cc5c00090c10))
* vite build ([0ea7970](https://github.com/vuejs/vite/commit/0ea79707334b4e6769a8450bd2f51e2507e73bc4))



# [0.4.0](https://github.com/vuejs/vite/compare/v0.3.2...v0.4.0) (2020-04-23)


### Features

* hmr propagation ([6e66766](https://github.com/vuejs/vite/commit/6e66766c858ff4fb16d14f4eb8659617fcbcba77))
* js hmr API ([3e5076d](https://github.com/vuejs/vite/commit/3e5076d41c908e7662ac4e8ba07dd084947fede0))
* sourcemap handling for deep imports ([b100683](https://github.com/vuejs/vite/commit/b1006830488367e3119af7e383657cf00582aced))
* style lang="x" support ([35b23e1](https://github.com/vuejs/vite/commit/35b23e19b0a379176e0eb27707c93a228f491345))
* support deep module imports ([c11cfc8](https://github.com/vuejs/vite/commit/c11cfc8703ffdec4d46bfb37878a817d16c0cbaf))
* support resolving snowpack web_modules ([#4](https://github.com/vuejs/vite/issues/4)) ([a183791](https://github.com/vuejs/vite/commit/a18379177c2efc69396765277df6b5a316fc5870))



## [0.3.2](https://github.com/vuejs/vite/compare/v0.3.1...v0.3.2) (2020-04-22)



## [0.3.1](https://github.com/vuejs/vite/compare/v0.3.0...v0.3.1) (2020-04-22)


### Bug Fixes

* do not attempt rewrite on 304 ([7b75253](https://github.com/vuejs/vite/commit/7b752538a9531c3cda6329836205348af85cc733))



# [0.3.0](https://github.com/vuejs/vite/compare/v0.2.0...v0.3.0) (2020-04-22)



# [0.2.0](https://github.com/vuejs/vite/compare/v0.1.2...v0.2.0) (2020-04-21)


### Features

* support import rewriting in index.html ([4ed433a](https://github.com/vuejs/vite/commit/4ed433a16512e965095e06314f142185c9cfc961))



## [0.1.2](https://github.com/vuejs/vite/compare/v0.1.1...v0.1.2) (2020-04-21)


### Bug Fixes

* use correct vue & compiler-sfc ([0d5a2a4](https://github.com/vuejs/vite/commit/0d5a2a47a6f78c938c2c9c8fca8f438d42e9fd1b))
* use dependency vue if user has no local installation ([bb9baa2](https://github.com/vuejs/vite/commit/bb9baa2f61136a7083c92ef67c92eb727eba3b40))



## [0.1.1](https://github.com/vuejs/vite/compare/4a04d8102ae9d76939c8462461d1ac01fdefbe8c...v0.1.1) (2020-04-21)


### Features

* auto inject hmr client ([4a04d81](https://github.com/vuejs/vite/commit/4a04d8102ae9d76939c8462461d1ac01fdefbe8c))
* module rewrite ([33488fe](https://github.com/vuejs/vite/commit/33488fe7e63921ace334db6da0e0ae287a913668))
* style hot reload ([140f2b2](https://github.com/vuejs/vite/commit/140f2b2091fa3ca996be7906560819bfd121673d))



