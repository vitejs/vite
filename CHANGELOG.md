## [0.10.2](https://github.com/vuejs/vite/compare/v0.10.1...v0.10.2) (2020-05-04)


### Bug Fixes

* fix build index asset injection ([ccce482](https://github.com/vuejs/vite/commit/ccce48228d8220de4312585c716c1c27ea9ef1c2))
* properly handle absolute asset urls ([5ca0ec4](https://github.com/vuejs/vite/commit/5ca0ec4abc183a3942ef169b39034ff403dd9eae)), closes [#45](https://github.com/vuejs/vite/issues/45)
* **moduleResolve:** do not rewrite external imports ([dd7af0a](https://github.com/vuejs/vite/commit/dd7af0a9b3e77fcbdec6fe7fcda26443f1e2c8fa)), closes [#42](https://github.com/vuejs/vite/issues/42)


### Features

* support CSS modules for *.module.css ([1782f83](https://github.com/vuejs/vite/commit/1782f831c62e73d961fcf71de4d1024a1f8acaf7))



## [0.10.1](https://github.com/vuejs/vite/compare/v1.0.1...v0.10.1) (2020-05-04)


### Bug Fixes

* crash when importing component with no script tag ([#46](https://github.com/vuejs/vite/issues/46)) ([586626f](https://github.com/vuejs/vite/commit/586626fb4099042abe1964700387ee6d0946d43b))
* should not write assets when buildOptions.write is false ([#49](https://github.com/vuejs/vite/issues/49)) ([ef28ee4](https://github.com/vuejs/vite/commit/ef28ee44d690713666d2f9b656276324a0abcd42))



# [0.10.0](https://github.com/vuejs/vite/compare/v0.9.1...v0.10.0) (2020-05-04)


### Bug Fixes

* fix isImportRequest check on request with queies ([348a7e8](https://github.com/vuejs/vite/commit/348a7e88e4cd104b110eb6296f5a18fdff351d32))
* fix vue style hmr ([d0b896f](https://github.com/vuejs/vite/commit/d0b896fde6502298cf8ef6c1a8bb79c8d9b1963d)), closes [#37](https://github.com/vuejs/vite/issues/37)


### Features

* load custom postcss config ([#41](https://github.com/vuejs/vite/issues/41)) ([d271e59](https://github.com/vuejs/vite/commit/d271e594a14d5c941d96d1189ffb3b7aee994f2e))
* support json hmr ([634a432](https://github.com/vuejs/vite/commit/634a4328041434434260844cf8fa95d0c3340f85))
* support postcss config in js css imports as well ([0187d3f](https://github.com/vuejs/vite/commit/0187d3f525fd76fa9855284b23836f4c3b68952a))
* support postcss in build ([c9ffb45](https://github.com/vuejs/vite/commit/c9ffb452133abc65067167e0895627703dcaeb5b))
* vue source map ([c9c9c87](https://github.com/vuejs/vite/commit/c9c9c87c855994e2f307475353c1cbb7bf9cc46a))


### Performance Improvements

* lazy load postcss-load-config ([1e8b584](https://github.com/vuejs/vite/commit/1e8b58403e83b0835ee136de7e5c9f7f0adf03f0))



## [0.9.1](https://github.com/vuejs/vite/compare/v0.9.0...v0.9.1) (2020-05-03)


### Bug Fixes

* readBody can return null ([a83637e](https://github.com/vuejs/vite/commit/a83637e82c86df43edaf28e469bec6cbf6ad8b33))



# [0.9.0](https://github.com/vuejs/vite/compare/v0.8.0...v0.9.0) (2020-05-03)


### Bug Fixes

* disable trasnformAssetUrls for now ([2677c93](https://github.com/vuejs/vite/commit/2677c934fdeccf8d4a2b0a6f174ee55ab001b25a))
* fix resolver ensurejs check ([7b126af](https://github.com/vuejs/vite/commit/7b126af193459da777fa0ca581e8f31d163541fa))


### Features

* handle `<script src>` in index.html ([63b4de6](https://github.com/vuejs/vite/commit/63b4de6405e5a2e1375f8360420c7cd11fdcd665))
* handle js css import hmr ([538198c](https://github.com/vuejs/vite/commit/538198c8ec795d0030a0a11c076d717a26f389a9))
* handle relative asset paths ([5d7ac46](https://github.com/vuejs/vite/commit/5d7ac468091adf2d6809e6a735990bf20b28de87))
* resolve css relative urls + base64 inline ([f29037d](https://github.com/vuejs/vite/commit/f29037d536de415ee115d5a48ec7a7e2b785656e))
* support importing css from js ([a3bb973](https://github.com/vuejs/vite/commit/a3bb973a3c593d25ebcf74eee7b1345c4a844e9f))
* support importing json ([97dc7ba](https://github.com/vuejs/vite/commit/97dc7ba8e1d77f63dd1cecfc08f2bb513b3a708f))
* support passing --flag=false via cli ([3ff579c](https://github.com/vuejs/vite/commit/3ff579c7de84787d2533ae0f1e2695900949e7d9))
* support string literal dynamic imports ([8ef6d4d](https://github.com/vuejs/vite/commit/8ef6d4d12b5fc75b137fed7258114a2c5a17101c))
* ws protocol based on location protocol ([#31](https://github.com/vuejs/vite/issues/31)) ([9af9ec1](https://github.com/vuejs/vite/commit/9af9ec1694f1c5c09c5ce46f81b62af175997b25))



## [0.8.1](https://github.com/vuejs/vite/compare/v0.8.0...v0.8.1) (2020-04-30)


### Bug Fixes

* fix resolver ensurejs check ([3a3442f](https://github.com/vuejs/vite/commit/3a3442f0b95873dd2a6869b00d8ac19b74d650a3))



# [0.8.0](https://github.com/vuejs/vite/compare/v0.7.0...v0.8.0) (2020-04-30)


### Features

* allow passing rollupPluginVueOptions for build ([a0053a0](https://github.com/vuejs/vite/commit/a0053a0eccd2659da685427ac3057cf5b436df80))
* support process.env.NODE_ENV ([d4ccd15](https://github.com/vuejs/vite/commit/d4ccd154f54f71fb02e746924f9811d3a0e61a8f))
* support self-accepting hmr ([30ab444](https://github.com/vuejs/vite/commit/30ab444bd28b47eec1cf070a3c41116e8e9c64be))



# [0.7.0](https://github.com/vuejs/vite/compare/v0.6.1...v0.7.0) (2020-04-29)


### Bug Fixes

* support deep file paths on write ([48f2459](https://github.com/vuejs/vite/commit/48f2459444fd2affa053ad5857cb8bd325ea2af6))


### Features

* support `__DEV__` flag
* allow adjusting `cssFileName` in build ([d9a0798](https://github.com/vuejs/vite/commit/d9a0798b0d8746a816ac516bd4267a409fb82c16))
* allow customizing build via options ([1b0b4ba](https://github.com/vuejs/vite/commit/1b0b4ba340b5d552abd7fa0457f9b2de55fc1647))
* allow plugins to send custom hmr events ([a22472d](https://github.com/vuejs/vite/commit/a22472d35718d08b4a947d064c82d645cfd49349))
* support omitting .js extension ([d00523f](https://github.com/vuejs/vite/commit/d00523f0efbc4453e31b138ca508d7d5d2479e34))

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



