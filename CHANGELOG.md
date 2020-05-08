# [0.13.0](https://github.com/vuejs/vite/compare/v0.12.0...v0.13.0) (2020-05-08)


### Features

* **hmr:** change hmr API path to `vite/hmr` and provide typing ([eab49a4](https://github.com/vuejs/vite/commit/eab49a4b7dd7e3bb0ff215c7e7937814cd63bb4f)), closes [#92](https://github.com/vuejs/vite/issues/92)
* cli help message ([a882aa4](https://github.com/vuejs/vite/commit/a882aa48cb447ec3b84019a2ce838ee75d848555))
* **hmr:** support hot.dispose ([e5cf447](https://github.com/vuejs/vite/commit/e5cf447762c73aafd686a69a8b0d8e24c4e00048))
* support --debug flag from cli ([12a5d47](https://github.com/vuejs/vite/commit/12a5d47b2bf2cb7e1badae2e2ee1129c0ae29fe5))
* support asset path import from js + special treatment of /public dir ([9061e44](https://github.com/vuejs/vite/commit/9061e442a7de8f94ca2931299450464f78f82148))



# [0.12.0](https://github.com/vuejs/vite/compare/v0.11.5...v0.12.0) (2020-05-07)


### Bug Fixes

* fix index resolving double append ([4c5a31e](https://github.com/vuejs/vite/commit/4c5a31e7b32e63ffb219cf75d8c69ce482a5753d))
* fix vue resolving without local install ([29099ae](https://github.com/vuejs/vite/commit/29099ae214d9ad8d8bfe3b930a509087450f3e38))
* only bust vue cache on non-vue file change if it is a src import ([cd8794c](https://github.com/vuejs/vite/commit/cd8794c380559aae45908a64708214b2d0778c93))



## [0.11.5](https://github.com/vuejs/vite/compare/v0.11.4...v0.11.5) (2020-05-07)


### Bug Fixes

* support linked monorepos (close [#56](https://github.com/vuejs/vite/issues/56)) ([eb0a885](https://github.com/vuejs/vite/commit/eb0a88514df344cbe4be3165cfa1a26af4f9f6ef))



## [0.11.4](https://github.com/vuejs/vite/compare/v0.11.3...v0.11.4) (2020-05-07)


### Bug Fixes

* avoid spinner in tests ([19f8358](https://github.com/vuejs/vite/commit/19f8358a47251b35557f4c2bdd8a3ac2b7ef96c0))
* fix resolve path on windows ([#73](https://github.com/vuejs/vite/issues/73)) ([9f6f0a6](https://github.com/vuejs/vite/commit/9f6f0a619af6f7fba22033b9540680862df3dc09))
* fix windows path resolution ([82414b8](https://github.com/vuejs/vite/commit/82414b88bb057630f096123fb820105817c4707c)), closes [#69](https://github.com/vuejs/vite/issues/69) [#72](https://github.com/vuejs/vite/issues/72)
* support directory index resolving (close [#74](https://github.com/vuejs/vite/issues/74)) ([904266b](https://github.com/vuejs/vite/commit/904266bc726e672926da3b01a8990dccd16d4e8b))
* use esm-bundler build of vue ([5741b79](https://github.com/vuejs/vite/commit/5741b798c1dc535d83154e5c0e9f1c3e7e5f92b7)), closes [#71](https://github.com/vuejs/vite/issues/71)


### Features

* **create-vite-app:** use valid html file ([#76](https://github.com/vuejs/vite/issues/76)) ([f3265c1](https://github.com/vuejs/vite/commit/f3265c1a833ac74403a673004a0127801bf02a99))
* improve sfc compilation error output ([44a8250](https://github.com/vuejs/vite/commit/44a8250fc69e2d2c06d80a711a2598e4dc449f53))
* src import support ([ffd1fee](https://github.com/vuejs/vite/commit/ffd1fee9e04073ff87faa1b730c07dd828c70664))
* support build sourcemap ([6b63b34](https://github.com/vuejs/vite/commit/6b63b34a521df17b645bb4ec72df03294cb3b5c6))



## [0.11.3](https://github.com/vuejs/vite/compare/v0.11.2...v0.11.3) (2020-05-07)


### Bug Fixes

* fix module rewrite resolution with base paths (fix [#61](https://github.com/vuejs/vite/issues/61)) ([ca421cd](https://github.com/vuejs/vite/commit/ca421cdf9348076a53ad1ff1a9e6ee4095776eae))


### Features

* improve build error output ([b1d6be7](https://github.com/vuejs/vite/commit/b1d6be7cf3e436fce7b187d2139ee43349ca5f40))



## [0.11.2](https://github.com/vuejs/vite/compare/v0.11.1...v0.11.2) (2020-05-07)


### Bug Fixes

* avoid mutating esbuild options ([bd58858](https://github.com/vuejs/vite/commit/bd588584231cd41fb016811cf22f76d0ffa13c72))
* fix web_modules resolving for build ([fc75323](https://github.com/vuejs/vite/commit/fc75323ff5861318a77c0680eb94a094ceee0b27))
* skip asset processing for data uri in css ([e01e26d](https://github.com/vuejs/vite/commit/e01e26dc93070b995d75784bb48e97a024148338)), closes [#66](https://github.com/vuejs/vite/issues/66)
* warn non wrapped hot.accept calls ([7aaf458](https://github.com/vuejs/vite/commit/7aaf45816fe5ceadb163b5faa294eebf26044c62))


### Features

* support --open flag ([957945f](https://github.com/vuejs/vite/commit/957945faada703513174151a4fff4cf2f97f6efc))



## [0.11.1](https://github.com/vuejs/vite/compare/v0.11.0...v0.11.1) (2020-05-06)


### Bug Fixes

* fix rewrite when encountering external url ([e78c9f7](https://github.com/vuejs/vite/commit/e78c9f7680c2652b13f4270182c860417e388b2e))



# [0.11.0](https://github.com/vuejs/vite/compare/v0.10.3...v0.11.0) (2020-05-06)


### Bug Fixes

* fix direct index script src hmr ([73d94b9](https://github.com/vuejs/vite/commit/73d94b9ba75836b995ed276747a32ce94344c1eb))


### Features

* dev support for ts ([7cbaf5d](https://github.com/vuejs/vite/commit/7cbaf5d8e5b70db2ec642bd1d34f1e0322927ccf))
* support minification with esbuild ([b87ba7e](https://github.com/vuejs/vite/commit/b87ba7e321b9dd319009a55154540805969f0039))
* ts build support for vue files ([8262108](https://github.com/vuejs/vite/commit/8262108db14b35126bcaae3253bf3f6391c9d283))
* tsx? support for build ([81ffbc5](https://github.com/vuejs/vite/commit/81ffbc548c3d5f9db1f040c360167f95963674d6))



## [0.10.3](https://github.com/vuejs/vite/compare/v0.10.2...v0.10.3) (2020-05-05)


### Bug Fixes

* fix module entry redirect on Windows (fix [#55](https://github.com/vuejs/vite/issues/55)) ([01135fa](https://github.com/vuejs/vite/commit/01135fa1edede1f46acd7c83d18e5131ebc7cbd7))
* only log target exist when error says so ([59b8638](https://github.com/vuejs/vite/commit/59b8638d966feb7c9433911d7ba2a66617cb708c))


### Features

* add asset options into build options ([#53](https://github.com/vuejs/vite/issues/53)) ([a5c608d](https://github.com/vuejs/vite/commit/a5c608d2a0b98fc7b121d9c5eb1a4b7238dfb74b))
* public base path support ([c82a597](https://github.com/vuejs/vite/commit/c82a5976acd2ad3f39f6ee2b9efc20b1f918e687))
* support ssrBuild ([4808f41](https://github.com/vuejs/vite/commit/4808f4106fe0d71c3178c1d66272eef913efd61f))
* support template pre-processors ([b6cafee](https://github.com/vuejs/vite/commit/b6cafee5ce9e4e141bd2ba2f2646ad5db78caf0f)), closes [#17](https://github.com/vuejs/vite/issues/17)



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



