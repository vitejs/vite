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
