## [0.19.2](https://github.com/vuejs/vite/compare/v0.19.1...v0.19.2) (2020-05-31)


### Bug Fixes

* fix rewrite extension resolving for relative imports under [@module](https://github.com/module) ([34c9233](https://github.com/vuejs/vite/commit/34c92338ba3f6631e22a8d4ef34927ad5f1c2f8b))



## [0.19.1](https://github.com/vuejs/vite/compare/v0.19.0...v0.19.1) (2020-05-31)


### Bug Fixes

* better module id regex for builtin bail message ([#310](https://github.com/vuejs/vite/issues/310)) ([29e36ab](https://github.com/vuejs/vite/commit/29e36ab02fa39d397a2ffb3b6fcccdbcde44ab67))
* use strict resolving for vue resolution ([ee60f64](https://github.com/vuejs/vite/commit/ee60f64d9011fe54358fc8fa88739f8fff8586ec))


### Features

* bring back browser field resolution with consistent behavior ([a0272f0](https://github.com/vuejs/vite/commit/a0272f07701f0b2cbdc2fe9ce936bf025bfd9e5d))



# [0.19.0](https://github.com/vuejs/vite/compare/v0.18.1...v0.19.0) (2020-05-30)


### Bug Fixes

* remove incorrect conditional exports handling ([3fdfe8a](https://github.com/vuejs/vite/commit/3fdfe8a78c803b712c2064c1defb43845b2a0039))
* remove support for browser fields. ([ce3ec6c](https://github.com/vuejs/vite/commit/ce3ec6c4dd2f2d637e00d6f7000ed56d54206f57))
* respect module over browser field during dev ([c790499](https://github.com/vuejs/vite/commit/c790499f0efab491322bca07d6dc69a838083f48)), closes [#307](https://github.com/vuejs/vite/issues/307)


### Features

* support css `@import` hmr ([#281](https://github.com/vuejs/vite/issues/281)) ([9bc3fbd](https://github.com/vuejs/vite/commit/9bc3fbde36d8a526da9a328f603e34d9e1a8081f))
* watch aliased files that are out of root ([8fe4284](https://github.com/vuejs/vite/commit/8fe4284dc8ac3f15e433222fcf37090791ccf17a))


### BREAKING CHANGES

* support for resolving `browser` field has been removed.

  The `browser` field has very inconsitent usage across the ecosystem
  and is often used in a way that conflicts with ES-module-first tooling
  (e.g. firebase/app points browser to cjs build).



## [0.18.1](https://github.com/vuejs/vite/compare/v0.18.0...v0.18.1) (2020-05-29)


### Bug Fixes

* add vite to ignore list of optimization ([#297](https://github.com/vuejs/vite/issues/297)) ([cddbebc](https://github.com/vuejs/vite/commit/cddbebcb4da74a41887475913b6cdbfc37cd5f2a))
* fix browser field resolving on windows ([8144044](https://github.com/vuejs/vite/commit/8144044f95a03f74fee6df38429b7f4d97f3adb1))
* resolve browser field in package.json ([#301](https://github.com/vuejs/vite/issues/301)) ([28d9714](https://github.com/vuejs/vite/commit/28d9714f035848e61f55ddd9e85b83342094e194)), closes [#294](https://github.com/vuejs/vite/issues/294)
* support reference a scss files which installed to node_modules ([#302](https://github.com/vuejs/vite/issues/302)) ([d623437](https://github.com/vuejs/vite/commit/d6234371e2a5afd9430797c2f99881064f19e79a)), closes [#291](https://github.com/vuejs/vite/issues/291)
* use full mime lookup in cached read ([#303](https://github.com/vuejs/vite/issues/303)) ([7a59ec8](https://github.com/vuejs/vite/commit/7a59ec85fca210e686597eb27a037f73815897a6))


### Features

* bail early on failed optimization of Node dependencies ([0752910](https://github.com/vuejs/vite/commit/0752910a0e26ffe084c78cbf7ffa4d1462371829))



# [0.18.0](https://github.com/vuejs/vite/compare/v0.17.2...v0.18.0) (2020-05-28)


### Bug Fixes

* should apply full ext resolve on module entries ([63b0e3c](https://github.com/vuejs/vite/commit/63b0e3cca2975a180e8372882c4e8d9b513fc7cf))
* should resolve env even without config file ([482bd34](https://github.com/vuejs/vite/commit/482bd3482687697d7092c0ae18fb699228a4cc5d)), closes [#290](https://github.com/vuejs/vite/issues/290)


### Features

* improve commonjs dependency handling ([2f071b3](https://github.com/vuejs/vite/commit/2f071b386175737f7e1146ba8154944ca2b7390a))
* support aliasing directories ([801951e](https://github.com/vuejs/vite/commit/801951e28a92aaf7437647094081825ec308e645))


### BREAKING CHANGES

* The following config options have been removed:

  - `rollupPluginCommonJSNamedExports`
  - `optimizeDeps.commonJSWhitelist`

  CommonJS deps are now optimized by default.



## [0.17.2](https://github.com/vuejs/vite/compare/v0.17.1...v0.17.2) (2020-05-28)


### Bug Fixes

* compat for package entries without extension ([6269b7f](https://github.com/vuejs/vite/commit/6269b7f499c96bbe47fc1d8bce7fa77d115e1da6)), closes [#284](https://github.com/vuejs/vite/issues/284)
* import.meta.hot should be injected before first `if (import.meta.hot)` ([#285](https://github.com/vuejs/vite/issues/285)) ([9ac63b1](https://github.com/vuejs/vite/commit/9ac63b1320ca929010a9cfd78e3c1a7797bd3a80))



## [0.17.1](https://github.com/vuejs/vite/compare/v0.17.0...v0.17.1) (2020-05-27)


### Bug Fixes

* **hmr:** avoid fetching stale modules on nested hmr updates ([0554f06](https://github.com/vuejs/vite/commit/0554f063f6392fa49da0478fef68c80f10c391fc))
* fix export default rewrite when at beginning of file ([3045112](https://github.com/vuejs/vite/commit/3045112780a8eeb5b8f455b82939cb00da1eef7d))
* fix import chain walking ([9a44248](https://github.com/vuejs/vite/commit/9a4424822a8d3b3583504b827e1b7089b4319a30))
* lazy require @vue/compiler-dom so it respects NODE_ENV ([e2594df](https://github.com/vuejs/vite/commit/e2594dffe42776cf8c53725d79525fb0b8b08d68))
* remove query from resolved src import ([0330b2a](https://github.com/vuejs/vite/commit/0330b2a1f56ea8fa443207c524d817d7de772b56))
* resolve full extension for SFC src imports ([ae6b49d](https://github.com/vuejs/vite/commit/ae6b49d5bd71a18f917d3a5e57ec3c4b9351da59))



# [0.17.0](https://github.com/vuejs/vite/compare/v0.16.12...v0.17.0) (2020-05-26)


### Bug Fixes

* await rollup resolve result ([#267](https://github.com/vuejs/vite/issues/267)) ([d71a06d](https://github.com/vuejs/vite/commit/d71a06da04954282896e53e16692590101b82c2e))
* css cache check ([#262](https://github.com/vuejs/vite/issues/262)) ([5435737](https://github.com/vuejs/vite/commit/5435737d126a2d08e7e950dbf4952fc903574d19))
* default mode for build API usage ([86d2143](https://github.com/vuejs/vite/commit/86d2143e31cba594377da43116c161a87d2d1874))
* dotenv debug option ([#263](https://github.com/vuejs/vite/issues/263)) ([ca1b551](https://github.com/vuejs/vite/commit/ca1b551c541ed3364374652b9b55e9f0e78b0c3c))
* fix type dependencies ([e86da9e](https://github.com/vuejs/vite/commit/e86da9e6b56aeaf985ecf590fd775582952279b0))
* only append import query if has no existing query ([df526b1](https://github.com/vuejs/vite/commit/df526b127e63ff2f52458ea796f9c813880a1a65))
* ora swallow rollup warning ([#269](https://github.com/vuejs/vite/issues/269)) ([610a004](https://github.com/vuejs/vite/commit/610a00441f8c0faa2e048a0910cf04f9f3810eef))
* resolve vuePath in all cases ([e67b698](https://github.com/vuejs/vite/commit/e67b698a9ba18a99cb64f52df61fae176382f9ff)), closes [#270](https://github.com/vuejs/vite/issues/270)
* respect user configured css modules options for rollup-plugin-vue ([0ce1eef](https://github.com/vuejs/vite/commit/0ce1eef7bd77eb8468c8b9e6878c2a78167efc4f))
* unset service when stopping esbuild service ([dd0205f](https://github.com/vuejs/vite/commit/dd0205f321c57ad0b59813181591dafe1d8d3f90))
* updateType may contains extra & ([#260](https://github.com/vuejs/vite/issues/260)) ([301d7a3](https://github.com/vuejs/vite/commit/301d7a3b151a8fdefd09db0d742c7b6d0ce206db))
* use more robust export default replacement for SFC scripts ([2e81e64](https://github.com/vuejs/vite/commit/2e81e64929d9c2909ff5882b26933ea54a353aab)), closes [#271](https://github.com/vuejs/vite/issues/271)


### Features

* expose process.env.BASE_URL ([9503762](https://github.com/vuejs/vite/commit/9503762e103f304228ceb7d572b17c24ed008501))
* support referencing public dir files from root ([319b37b](https://github.com/vuejs/vite/commit/319b37bbf4cef4804b56061ab5354d361c90dacb))
* **hmr:** re-design HMR API ([a68bfc3](https://github.com/vuejs/vite/commit/a68bfc307dd636d5e1b5d42d6df248da1beea2ff))


### Performance Improvements

* revert special handling for vue hmr ([43ccaf7](https://github.com/vuejs/vite/commit/43ccaf77e89ebf219c15aaf12b06a4632beb3968))


### BREAKING CHANGES

* `__BASE__` special global has been removed. Use
`process.env.BASE_URL` instead.
* **hmr:** HRM API has been re-designed.

  - All HMR APIs are now exposed on `import.meta.hot` and HMR API
    calls should be nested inside `if (import.meta.hot) {}` conditional
    checks.

  - `import.meta.hot.accept()` is now only used for self-accepting updates.

  - `import.meta.hot.acceptDeps()` is now used for accepting dependency
    updates without re-instantiating acceptor.

  - `import.meta.hot.data` is an object that is persisted across hot
    updates of a module.

  - `import.meta.hot.dispose()` callback now receives the persisted data
    object.

  - `import.meta.hot.decline()` can be used to decline updates and if
    the module is affected in an HMR update chain and force full page
    reload.

  - `import.meta.hot.invalidate()` can be used inside an acceptance
    callback to conditionally reject the update and force full page
    reload.

  See `hmr.d.ts` for full API definitions.



## [0.16.12](https://github.com/vuejs/vite/compare/v0.16.11...v0.16.12) (2020-05-25)


### Bug Fixes

* fix rewrite extension appending for out of root files ([84fcfb6](https://github.com/vuejs/vite/commit/84fcfb66ecd9822ebb9dd56505332acce20da568))
* use upward search for env files ([4fceaea](https://github.com/vuejs/vite/commit/4fceaea1b60ba71f954796dfc601e91300344d3f))


### Features

* support webp as static assets ([5589fa3](https://github.com/vuejs/vite/commit/5589fa3ea51f5442083eb4a31844e23386c89af4))



## [0.16.11](https://github.com/vuejs/vite/compare/v0.16.10...v0.16.11) (2020-05-25)


### Bug Fixes

* fix history fallback when serving non cwd root (fix [#251](https://github.com/vuejs/vite/issues/251)) ([c239067](https://github.com/vuejs/vite/commit/c239067969677bc09ad809baf02495072a38b2ff))
* fix plain css reference via link (fix [#252](https://github.com/vuejs/vite/issues/252)) ([146a49d](https://github.com/vuejs/vite/commit/146a49d78bd8225f846db8baa4adfa604d4cbf4a))
* fix unused css filter check on windows ([3486d21](https://github.com/vuejs/vite/commit/3486d2117faac0d83bc093f0c8c21b783b8f9f2d))
* more graceful handling for packages with no main field ([8816d3b](https://github.com/vuejs/vite/commit/8816d3bca6aef8df11f70f934031178accde5163)), closes [#247](https://github.com/vuejs/vite/issues/247)
* skip hmr for unused css ([#253](https://github.com/vuejs/vite/issues/253)) ([8f7ee38](https://github.com/vuejs/vite/commit/8f7ee38965327cf15dbb4f2d6f3db6e4b642b635))
* **build:** should ignore assets hash and query ([#256](https://github.com/vuejs/vite/issues/256)) ([528aad6](https://github.com/vuejs/vite/commit/528aad6b66c407e70bab2012d24a5ca0df30edd5))


### Features

* support specify env mode ([#235](https://github.com/vuejs/vite/issues/235)) ([db8b6b2](https://github.com/vuejs/vite/commit/db8b6b23d6e230505b48890cc95e0d8642e98804))



## [0.16.10](https://github.com/vuejs/vite/compare/v0.16.9...v0.16.10) (2020-05-24)


### Bug Fixes

* __DEV__ replace should also apply to vite modules ([7c4b64c](https://github.com/vuejs/vite/commit/7c4b64c47ae5271fe262796e1459ff02baf132e2))
* fix build resolve for vue jsx shim ([1f4518b](https://github.com/vuejs/vite/commit/1f4518b69b6d6d4afdb485570ed795fe4f557a77))



## [0.16.9](https://github.com/vuejs/vite/compare/v0.16.8...v0.16.9) (2020-05-23)


### Bug Fixes

* public dir should be copied to dist root ([bf2b2a9](https://github.com/vuejs/vite/commit/bf2b2a9c7d66b001260e60d825ae72e8c3e0c301))
* quote resolved urls in rendered html ([fd68ecf](https://github.com/vuejs/vite/commit/fd68ecfa5c5e74a1a463ed5c91b9fecba356f846))



## [0.16.8](https://github.com/vuejs/vite/compare/v0.16.7...v0.16.8) (2020-05-23)


### Bug Fixes

* defaultRequestToFile should consider optimized modules ([#239](https://github.com/vuejs/vite/issues/239)) ([b5ddcdc](https://github.com/vuejs/vite/commit/b5ddcdcc65f62bf3fd50e487dc2d9bfa61624539))
* properly resolve file extensions ([aaf61f4](https://github.com/vuejs/vite/commit/aaf61f4d0d6843d0b34c9c75c4dec8a95e95b9d1)), closes [#237](https://github.com/vuejs/vite/issues/237)



## [0.16.7](https://github.com/vuejs/vite/compare/v0.16.6...v0.16.7) (2020-05-22)


### Bug Fixes

* defaultRequestToFile should handle uncached node_modules request ([#230](https://github.com/vuejs/vite/issues/230)) ([7a3e822](https://github.com/vuejs/vite/commit/7a3e822597b94f8440e7436e3cc54a2764fff4eb)), closes [#228](https://github.com/vuejs/vite/issues/228)
* disable cssCodeSplit in ssr build ([457f1f2](https://github.com/vuejs/vite/commit/457f1f2aca32f968f4ffe822633a2b4c49456fd4))
* do not attempt to rewrite css urls that are hash fragments ([029de6b](https://github.com/vuejs/vite/commit/029de6b30bfc307d4b02f28703cd8d73a706b1cd))
* ensure env vairable replacements are efficient for bundle size ([1be6121](https://github.com/vuejs/vite/commit/1be61219d1e253d6edec812ff7828b69d775c093))
* ensure rewrite middlewares have highest priority ([e741628](https://github.com/vuejs/vite/commit/e74162857ad33788f6fa02a4dca863aa7354fc76))
* fix entry resolving for packages with explicit exports ([c493629](https://github.com/vuejs/vite/commit/c4936290380891353de0581e432389310147a8e0)), closes [#227](https://github.com/vuejs/vite/issues/227)
* only apply vite-specific global replacements to non-dep code ([b96ed68](https://github.com/vuejs/vite/commit/b96ed689970a1c0ab87f21c7cdf7d72a12c493c2))


### Features

* support built-in css preprocess ([#220](https://github.com/vuejs/vite/issues/220)) ([bef67f5](https://github.com/vuejs/vite/commit/bef67f50a56d190a0cd5fd2bcea94ad2d4f80185))
* support loading customize env variables from .env file ([#223](https://github.com/vuejs/vite/issues/223)) ([89fe0a9](https://github.com/vuejs/vite/commit/89fe0a9c912cb944e87556ca3cc344c6fac0fc0d)), closes [#213](https://github.com/vuejs/vite/issues/213)



## [0.16.6](https://github.com/vuejs/vite/compare/v0.16.4...v0.16.6) (2020-05-21)


### Bug Fixes

* make sure aliased deps are externaled correctly ([#218](https://github.com/vuejs/vite/issues/218)) ([a1f5488](https://github.com/vuejs/vite/commit/a1f54889a95a24f89804b0fbdfc876cde5615c98))
* redirect url in case index.html is not present ([8a9710b](https://github.com/vuejs/vite/commit/8a9710b1a90cadfa69889cf00c224ea41ca13a9f))
* respect cssCodeSplit option ([4a0b6cc](https://github.com/vuejs/vite/commit/4a0b6cc573840f3f74ac4f1b59bc957f1c626a92))



## [0.16.5](https://github.com/vuejs/vite/compare/v0.16.4...v0.16.5) (2020-05-21)


### Bug Fixes

* redirect url in case index.html is not present ([df733d9](https://github.com/vuejs/vite/commit/df733d9cd93ad1d1d01c11b8b7a3a9659a7b9cbf))
* respect cssCodeSplit option ([3751551](https://github.com/vuejs/vite/commit/375155164ec68c78f07fc57d34cdc477249dc3a2))



## [0.16.4](https://github.com/vuejs/vite/compare/v0.16.3...v0.16.4) (2020-05-20)


### Features

* **dev:** support dev https server ([#208](https://github.com/vuejs/vite/issues/208)) ([8b95954](https://github.com/vuejs/vite/commit/8b95954c87a04fae90be0a3e769f385a87182c8e))
* css code splitting in async chunks ([09879b3](https://github.com/vuejs/vite/commit/09879b30f321ca70789fd8afc3cd95bf68947698)), closes [#190](https://github.com/vuejs/vite/issues/190)



## [0.16.3](https://github.com/vuejs/vite/compare/v0.16.1...v0.16.3) (2020-05-20)


### Bug Fixes

* adjust history fallback ([ba614ef](https://github.com/vuejs/vite/commit/ba614ef59b576c2ea34baa580adb59d6d16625e8)), closes [#193](https://github.com/vuejs/vite/issues/193)
* fix cross import between optimized modules and avoid duplication ([eedc985](https://github.com/vuejs/vite/commit/eedc985b1f7108373a762b9d1fc94842fd40c17f)), closes [#210](https://github.com/vuejs/vite/issues/210)
* fix external url check for protocol-less urls ([91f829d](https://github.com/vuejs/vite/commit/91f829dc1bfb5c1ed8411751b31f17c2322ed0a7))
* html rewrite cache should be based on content ([3752874](https://github.com/vuejs/vite/commit/3752874481ceef6188d5783d21e1fbc5e150a932))
* only warn deep imports on js src types ([ada8886](https://github.com/vuejs/vite/commit/ada8886e36578c7f43b7cd12bacd65e5a7c4c6e4))


### Features

* allow user to configure known named exports ([#206](https://github.com/vuejs/vite/issues/206)) ([25852fa](https://github.com/vuejs/vite/commit/25852fa8f7087ed50764a4a955a9397b930c1f87))



## [0.16.2](https://github.com/vuejs/vite/compare/v0.16.1...v0.16.2) (2020-05-20)


### Bug Fixes

* adjust history fallback ([ba614ef](https://github.com/vuejs/vite/commit/ba614ef59b576c2ea34baa580adb59d6d16625e8)), closes [#193](https://github.com/vuejs/vite/issues/193)
* html rewrite cache should be based on content ([3752874](https://github.com/vuejs/vite/commit/3752874481ceef6188d5783d21e1fbc5e150a932))


### Features

* allow user to configure known named exports ([#206](https://github.com/vuejs/vite/issues/206)) ([25852fa](https://github.com/vuejs/vite/commit/25852fa8f7087ed50764a4a955a9397b930c1f87))



## [0.16.1](https://github.com/vuejs/vite/compare/v0.16.0...v0.16.1) (2020-05-20)


### Bug Fixes

* **hmr:** should fire self accept callback on hmr propagation ([c553de2](https://github.com/vuejs/vite/commit/c553de26234e64ed3cdccd216630a6b5cd49f8f8))


### Features

* warn against conditional hot.accept() calls ([feb3b6d](https://github.com/vuejs/vite/commit/feb3b6d29381c80e6e24a7f629941d1401401cf5))


### Performance Improvements

* only perform hmr rewrite if import from client has hot ([02e2d94](https://github.com/vuejs/vite/commit/02e2d94bb77b93103987f6940ca3b11ae30d65b4))



# [0.16.0](https://github.com/vuejs/vite/compare/v0.15.5...v0.16.0) (2020-05-19)


### Bug Fixes

* apply user transforms after esbuild ([5b75f56](https://github.com/vuejs/vite/commit/5b75f567a5c2e17d48fde0e2df6666f456eccc58))
* fix configureServer option ([45fde5b](https://github.com/vuejs/vite/commit/45fde5ba3171c7788535a67a5abc0b171b38e3f1)), closes [#188](https://github.com/vuejs/vite/issues/188)
* fix css relative url during dev ([e483fc6](https://github.com/vuejs/vite/commit/e483fc67a16392d15a56001da9a795473d495b8d))
* fix dep optimize cache path when serving nested directory ([86e9fb5](https://github.com/vuejs/vite/commit/86e9fb598ffb702074f8b6153493ca5c6597f671))
* only append ?import when request has extension ([6683bb8](https://github.com/vuejs/vite/commit/6683bb8fb819c6f4935b40f25c2a377037e5ec7d))


### Features

* build-in dev server proxy support ([dafaccb](https://github.com/vuejs/vite/commit/dafaccbe291f8cc1db9716827366ddd418637f40)), closes [#147](https://github.com/vuejs/vite/issues/147)
* pass isBuild, path & query to transform functions ([ce4032b](https://github.com/vuejs/vite/commit/ce4032b4e12adf2dd4c5480b596d532e0f27d086))
* support arg-less hot.accept() call ([ef4fc42](https://github.com/vuejs/vite/commit/ef4fc42291d9ddb34400da1c93680edfb965530d))



## [0.15.6](https://github.com/vuejs/vite/compare/v0.15.5...v0.15.6) (2020-05-19)


### Bug Fixes

* fix configureServer option ([45fde5b](https://github.com/vuejs/vite/commit/45fde5ba3171c7788535a67a5abc0b171b38e3f1)), closes [#188](https://github.com/vuejs/vite/issues/188)
* fix css relative url during dev ([e483fc6](https://github.com/vuejs/vite/commit/e483fc67a16392d15a56001da9a795473d495b8d))


### Features

* build-in dev server proxy support ([dafaccb](https://github.com/vuejs/vite/commit/dafaccbe291f8cc1db9716827366ddd418637f40)), closes [#147](https://github.com/vuejs/vite/issues/147)



## [0.15.5](https://github.com/vuejs/vite/compare/v0.15.4...v0.15.5) (2020-05-19)


### Features

* more detailed warning for non esm dependencies ([0e68cc1](https://github.com/vuejs/vite/commit/0e68cc18bc0ad60b6d469b41da66d5bfa7f86109))
* support css imports in bundled deps ([62a720a](https://github.com/vuejs/vite/commit/62a720a8f23b958f91d5f6ae79989535b356cec6))



## [0.15.4](https://github.com/vuejs/vite/compare/v0.15.3...v0.15.4) (2020-05-19)


### Bug Fixes

* ensure vue is actually installed in resolveVue ([84cff52](https://github.com/vuejs/vite/commit/84cff5282a56369eeea360cf001e398a2d25dd56))
* fix history fallback redirect for html files ([d16f567](https://github.com/vuejs/vite/commit/d16f567ef2b6fb7b764b5be4402dd81ba7061596)), closes [#160](https://github.com/vuejs/vite/issues/160)
* fix resolve plugin infinite loop with node-resolve plugin ([d1bdf5a](https://github.com/vuejs/vite/commit/d1bdf5a07fdae032a69987ac238bc0d68881b3f2))
* force esbuild to output ES2019 ([#155](https://github.com/vuejs/vite/issues/155)) ([00f4a83](https://github.com/vuejs/vite/commit/00f4a8319fcc79ebdf939ecb5aea990c46690fd8))
* ignore tailwindui for dep optimization ([#169](https://github.com/vuejs/vite/issues/169)) ([1f3a9b1](https://github.com/vuejs/vite/commit/1f3a9b1adc73e2569425e7ab4c129734d59bdfcd)), closes [#168](https://github.com/vuejs/vite/issues/168)
* inject dev only script tags directly ([89ac245](https://github.com/vuejs/vite/commit/89ac24552f5cf644d416230058293d0d0d8eef5f)), closes [#161](https://github.com/vuejs/vite/issues/161)
* make style injection sync on component mount ([#176](https://github.com/vuejs/vite/issues/176)) ([f6a21b2](https://github.com/vuejs/vite/commit/f6a21b268b262ddbdd585288e599fed2b3a41ec6)), closes [#175](https://github.com/vuejs/vite/issues/175)
* **hmr:** support multiple accept calls ([#170](https://github.com/vuejs/vite/issues/170)) ([59da38c](https://github.com/vuejs/vite/commit/59da38c185b428a178d320b8bd5187b34bd942aa)), closes [#158](https://github.com/vuejs/vite/issues/158)


### Features

* add `shouldPreload` option ([#144](https://github.com/vuejs/vite/issues/144)) ([bdc7e70](https://github.com/vuejs/vite/commit/bdc7e70499916d7668d40a84c3f726ab50fbce9a))
* use hashed filenames for entry and css ([0cc57c8](https://github.com/vuejs/vite/commit/0cc57c80d92dabb024a18d81d92a1dabe8eda702))



## [0.15.3](https://github.com/vuejs/vite/compare/v0.15.2...v0.15.3) (2020-05-14)


### Bug Fixes

* add tailwind to dep optimization ignore list ([fc7b978](https://github.com/vuejs/vite/commit/fc7b978ac334422e919ad026b800a674cbf3d875)), closes [#146](https://github.com/vuejs/vite/issues/146)


### Features

* add optimizeDeps option for customizing dep optimization behavior ([57c1b66](https://github.com/vuejs/vite/commit/57c1b6691c06408cc56b4625e3245ed2de32b317))



## [0.15.2](https://github.com/vuejs/vite/compare/v0.15.1...v0.15.2) (2020-05-14)


### Bug Fixes

* fix non-local vue resolving ([39a7640](https://github.com/vuejs/vite/commit/39a76408c8722a7eaa3f371d2e08114eea25c82a))



## [0.15.1](https://github.com/vuejs/vite/compare/v0.15.0...v0.15.1) (2020-05-14)


### Bug Fixes

* do not warn when postcss config is not present ([b03d1c3](https://github.com/vuejs/vite/commit/b03d1c3091ac870ad6b86c796ee584417393fb6e))



# [0.15.0](https://github.com/vuejs/vite/compare/v0.14.4...v0.15.0) (2020-05-14)


### Bug Fixes

* fix support for non-js module imports ([d7fb6a9](https://github.com/vuejs/vite/commit/d7fb6a9e8a6caf4041a2a602564583e4c34346e0)), closes [#132](https://github.com/vuejs/vite/issues/132)
* forward source file path to esbuild ([#141](https://github.com/vuejs/vite/issues/141)) ([b1726d8](https://github.com/vuejs/vite/commit/b1726d84e1bf694797f30c62ca509644577ef583)), closes [#137](https://github.com/vuejs/vite/issues/137)
* log postcss config loading error (close [#140](https://github.com/vuejs/vite/issues/140)) ([0819bcb](https://github.com/vuejs/vite/commit/0819bcb597673c329e5699b91295b22dd07c4dc7))
* only add ?import when bare import has extension ([2dd45af](https://github.com/vuejs/vite/commit/2dd45affef2ece21821b208910fc00c23775c331))
* respect exports field in package.json ([e49742e](https://github.com/vuejs/vite/commit/e49742e40dcc385c03c1e16a3a0a3fad60fcb417))


### Features

* automatically optimize deps on server start ([49a44b6](https://github.com/vuejs/vite/commit/49a44b648f263ff058f730913ea1ee6c62e3cd2d))
* reload page when editing index.html ([a6a76a7](https://github.com/vuejs/vite/commit/a6a76a7946bd4d4c68edd22eb0295f758ea48990))



## [0.14.4](https://github.com/vuejs/vite/compare/v0.14.3...v0.14.4) (2020-05-13)


### Bug Fixes

* fix cva react template build + handle alias during build ([c243d09](https://github.com/vuejs/vite/commit/c243d09dbb7cbc7aaf5c79e2e2ea3be899d37933))
* fix windows node resolving ([4f2953e](https://github.com/vuejs/vite/commit/4f2953e429718c28ec4f1a8e6559d7c75630e70b))
* support resolving .mjs and other exts in module deep imports ([02753b7](https://github.com/vuejs/vite/commit/02753b7fda300bd15b7fa61d5e9ed2cce1a6ac4f)), closes [#127](https://github.com/vuejs/vite/issues/127)
* **history-fallback:** properly redirect urls with dot ([7f5e459](https://github.com/vuejs/vite/commit/7f5e4596a4e7254cc5f173fbf5261f3f47c926a9)), closes [#130](https://github.com/vuejs/vite/issues/130)
* replace cleanUrl with ctx.path ([#133](https://github.com/vuejs/vite/issues/133)) ([f558a88](https://github.com/vuejs/vite/commit/f558a880a3aa04f6024ff05f25924568a94a9b54))


### Features

* improve module resolving ([405f685](https://github.com/vuejs/vite/commit/405f685f7b0772881f5bd296b136296e94e35085))



## [0.14.3](https://github.com/vuejs/vite/compare/v0.14.2...v0.14.3) (2020-05-12)


### Bug Fixes

* first request on server start should never 304 ([c8a1ffd](https://github.com/vuejs/vite/commit/c8a1ffd71db0916cd6386130e3eb170fa09c31d2))
* fix web modules resolve ([ce41994](https://github.com/vuejs/vite/commit/ce41994ee4e395bb304191b5d9a26f0f32d3b47a))
* make transformed imports work in Safari ([b2377bf](https://github.com/vuejs/vite/commit/b2377bf3b6b14ed972327930644fe6937fa814dd))
* only register sw if available ([2efe9b3](https://github.com/vuejs/vite/commit/2efe9b3215f04e751d19cd50169bddf4250d114d))
* should resolve web_modules during rewrite too ([b5871eb](https://github.com/vuejs/vite/commit/b5871eba505e5a109b8b8ae07d6f8a70c6d970eb))


### Features

* **cva:** use @pika/react + alias ([f9b267f](https://github.com/vuejs/vite/commit/f9b267fbe3f6e8cc11a3e6855f7775aeb863b0f8))
* **sw:** use lockfile hash ([3bb1324](https://github.com/vuejs/vite/commit/3bb13240d9d6c3ef84020cd69b2e60835f206f8f))
* service worker caching ([ee6a03d](https://github.com/vuejs/vite/commit/ee6a03d3497433150c13fc9370b17daaa43e1e1d))



## [0.14.2](https://github.com/vuejs/vite/compare/v0.14.1...v0.14.2) (2020-05-11)



## [0.14.1](https://github.com/vuejs/vite/compare/v0.14.0...v0.14.1) (2020-05-11)


### Bug Fixes

* stop spinner before logging writes ([3d16951](https://github.com/vuejs/vite/commit/3d1695100a17502dcb49d074ed15627604cd03f0))


### Features

* **cva:** update templates ([8cd2354](https://github.com/vuejs/vite/commit/8cd235451f91b9a73c5419067af0c1bf7c992655))



# [0.14.0](https://github.com/vuejs/vite/compare/v0.13.2...v0.14.0) (2020-05-10)


### Bug Fixes

* do not rewrite external scripts in index.html (fix [#116](https://github.com/vuejs/vite/issues/116)) ([06e51cc](https://github.com/vuejs/vite/commit/06e51cc3ce2fbaeec3150394dac0b630b7601b78))
* fix loading ts config ([b85de93](https://github.com/vuejs/vite/commit/b85de93c49952b4de56a319915ef1527c30b8f93))
* run all transforms that pass particular `test` ([#113](https://github.com/vuejs/vite/issues/113)) ([ed5b9e7](https://github.com/vuejs/vite/commit/ed5b9e7f51e906d3a42d056571c0d5091ed5cd4c))
* **types:** fix hmr hot.on callback type ([a4524b4](https://github.com/vuejs/vite/commit/a4524b443ba6bfb53b78c053c27ac7ccb9f66749))


### Features

* expose base path as __BASE__ ([97ae7c3](https://github.com/vuejs/vite/commit/97ae7c3d19453eb72aeb958d95e58bbaeedbc4ae))
* **cva:** support creating project in cwd (close [#111](https://github.com/vuejs/vite/issues/111), [#112](https://github.com/vuejs/vite/issues/112)) ([02491a4](https://github.com/vuejs/vite/commit/02491a4be84cce43a4c84598e4a51b9b247d0b71))
* build --ssr ([49e79e7](https://github.com/vuejs/vite/commit/49e79e7603f5a53756f016494dd17ee5f76f37b6))
* expose `rewriteImports` ([#104](https://github.com/vuejs/vite/issues/104)) ([d6151bf](https://github.com/vuejs/vite/commit/d6151bf06d555693211693d9a45ef11cb45adc13))
* log hmr updates from server ([b0713fe](https://github.com/vuejs/vite/commit/b0713fed745988162ed507ea2bd06fff10d85280))
* resolve plugins + support vueCompilerOptions ([7cdaa0b](https://github.com/vuejs/vite/commit/7cdaa0bfd3d9acd6f3a4a2d92989a82f6864ffb9))
* support alias in config ([86d550a](https://github.com/vuejs/vite/commit/86d550a434505a2efa62602bf39ab4959b92356a))
* support config file ([ab940fd](https://github.com/vuejs/vite/commit/ab940fdf409ea44754b5e5e9550ff9dcc5ee562d))
* transforms ([87ee998](https://github.com/vuejs/vite/commit/87ee9981f8cd03b13f959e3754f9e48697e66022))
* Vue JSX support ([efc853f](https://github.com/vuejs/vite/commit/efc853fcfecd23df2024fd3e134754c9c7f65d63))


### Performance Improvements

* **hmr:** avoid re-fetching files not in the direct import chain ([2ac7469](https://github.com/vuejs/vite/commit/2ac746933603bd55431fe8f7be1b0373f51e5b29))
* lazy load all compiler-sfc imports ([d6dd2f0](https://github.com/vuejs/vite/commit/d6dd2f061537e658bb7e768adf4d6a1b60eb4e19))


### BREAKING CHANGES

* JSX support has been adjusted

  - Default JSX support is now configured for Vue 3 JSX
  - `jsx` option now accepts string presets ('vue' | 'preact' | 'react')
    e.g. to Use Preact with Vite, use `vite --jsx preact`. In addition,
    when using the Preact preset, Vite auto injects `h` import in `.jsx`
    and `.tsx` files so the user no longer need to import it.
* in resolvers, idToRequest has been renamed to alias



## [0.13.2](https://github.com/vuejs/vite/compare/v0.13.1...v0.13.2) (2020-05-09)


### Bug Fixes

* --open throwing error ([#105](https://github.com/vuejs/vite/issues/105)) ([6ee0168](https://github.com/vuejs/vite/commit/6ee016892d7b375cc8dd8cbc4dc10c03325d4dc8))
* handle lowercase doctypes (close [#107](https://github.com/vuejs/vite/issues/107)) ([32cf37f](https://github.com/vuejs/vite/commit/32cf37fd5125be7dd3b65de2024e89685d7cbc8e))
* single quote 'src' attribute for <script> ([#106](https://github.com/vuejs/vite/issues/106)) ([9336dac](https://github.com/vuejs/vite/commit/9336dacaeaae37bd2adf36ab1816c063eddbd4eb))
* **cva:** fix package.json files include for template-* ([#100](https://github.com/vuejs/vite/issues/100)) ([122851e](https://github.com/vuejs/vite/commit/122851ee802c8e6374be42e704883e6ed91b0b02))


### Features

* improve cli output looks like vue-cli ([#98](https://github.com/vuejs/vite/issues/98)) ([e00bf3a](https://github.com/vuejs/vite/commit/e00bf3a7fb029416c394e2606a3ce4ed8f3079b1))
* **cva:** support multiple templates ([decbfc2](https://github.com/vuejs/vite/commit/decbfc2ee9e0c88c9e94a8f4f39032cdf5b5d6c5))



## [0.13.1](https://github.com/vuejs/vite/compare/v0.13.0...v0.13.1) (2020-05-09)


### Bug Fixes

* **hmr:** fix hot.accept() module resolution ([#97](https://github.com/vuejs/vite/issues/97)) ([7ffa9c0](https://github.com/vuejs/vite/commit/7ffa9c0b953f4a78251a8c379a2edf8e31fd368b))
* fix snowpack common chunk resolving + warn jsx in non jsx files ([3653793](https://github.com/vuejs/vite/commit/3653793a2f713b126aaefb01b00878614fc4c63c)), closes [#94](https://github.com/vuejs/vite/issues/94)


### Features

* **build:** log brotli-compressed size of outputs ([#95](https://github.com/vuejs/vite/issues/95)) ([b7f5ad2](https://github.com/vuejs/vite/commit/b7f5ad245f10efac89be0954155639e310c46e00))



# [0.13.0](https://github.com/vuejs/vite/compare/v0.12.0...v0.13.0) (2020-05-08)


### Features

* **hmr:** change hmr API path to `vite/hmr` and provide typing ([eab49a4](https://github.com/vuejs/vite/commit/eab49a4b7dd7e3bb0ff215c7e7937814cd63bb4f)), closes [#92](https://github.com/vuejs/vite/issues/92)
* cli help message ([a882aa4](https://github.com/vuejs/vite/commit/a882aa48cb447ec3b84019a2ce838ee75d848555))
* **hmr:** support hot.dispose ([e5cf447](https://github.com/vuejs/vite/commit/e5cf447762c73aafd686a69a8b0d8e24c4e00048))
* support --debug flag from cli ([12a5d47](https://github.com/vuejs/vite/commit/12a5d47b2bf2cb7e1badae2e2ee1129c0ae29fe5))
* support asset path import from js + special treatment of /public dir ([9061e44](https://github.com/vuejs/vite/commit/9061e442a7de8f94ca2931299450464f78f82148))

### Breaking Changes

- HMR API import path has changed from `@hmr` to `vite/hmr` so that it can enjoy type support.

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



