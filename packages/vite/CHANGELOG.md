## 6.2.0 (2025-02-25)

* fix(deps): update all non-major dependencies (#19501) ([c94c9e0](https://github.com/vitejs/vite/commit/c94c9e052127cf4796374de1d698ec60b2973dfa)), closes [#19501](https://github.com/vitejs/vite/issues/19501)
* fix(worker): string interpolation in dynamic worker options (#19476) ([07091a1](https://github.com/vitejs/vite/commit/07091a1e804e5934208ef0b6324a04317dd0d815)), closes [#19476](https://github.com/vitejs/vite/issues/19476)
* chore: use unicode cross icon instead of x (#19497) ([5c70296](https://github.com/vitejs/vite/commit/5c70296ffb22fe5a0f4039835aa14feb096b4a97)), closes [#19497](https://github.com/vitejs/vite/issues/19497)



## 6.2.0-beta.1 (2025-02-21)

* fix(css): temporary add `?.` after `this.getModuleInfo` in `vite:css-post` (#19478) ([12b0b8a](https://github.com/vitejs/vite/commit/12b0b8a953ad7d08ba0540cb4f5cb26a7fa69da2)), closes [#19478](https://github.com/vitejs/vite/issues/19478)



## 6.2.0-beta.0 (2025-02-21)

* feat: show `mode` on server start and add env debugger (#18808) ([c575b82](https://github.com/vitejs/vite/commit/c575b825596ccaedfac1cfecbb9a464e5e584a60)), closes [#18808](https://github.com/vitejs/vite/issues/18808)
* feat: use host url to open browser (#19414) ([f6926ca](https://github.com/vitejs/vite/commit/f6926caa1f2c9433ca544172378412795722d8e1)), closes [#19414](https://github.com/vitejs/vite/issues/19414)
* feat(css): allow scoping css to importers exports (#19418) ([3ebd838](https://github.com/vitejs/vite/commit/3ebd83833f723dde64098bc617c61b37adb3ad01)), closes [#19418](https://github.com/vitejs/vite/issues/19418)
* chore: bump esbuild to 0.25.0 (#19389) ([73987f2](https://github.com/vitejs/vite/commit/73987f22ec3f2df0d36154f1766ca7a7dc4c2460)), closes [#19389](https://github.com/vitejs/vite/issues/19389)



## <small>6.1.1 (2025-02-19)</small>

* fix: ensure `.[cm]?[tj]sx?` static assets are JS mime (#19453) ([e7ba55e](https://github.com/vitejs/vite/commit/e7ba55e7d57ad97ab43682b152159e29fa4b3753)), closes [#19453](https://github.com/vitejs/vite/issues/19453)
* fix: ignore `*.ipv4` address in cert (#19416) ([973283b](https://github.com/vitejs/vite/commit/973283bf84c3dca42e2e20a9f9b8761011878b8b)), closes [#19416](https://github.com/vitejs/vite/issues/19416)
* fix(css): run rewrite plugin if postcss plugin exists (#19371) ([bcdb51a](https://github.com/vitejs/vite/commit/bcdb51a1ac082f4e8ed6f820787d6745dfaa972d)), closes [#19371](https://github.com/vitejs/vite/issues/19371)
* fix(deps): bump tsconfck (#19375) ([746a583](https://github.com/vitejs/vite/commit/746a583d42592a31e1e8e80cc790a7c9e6acf58e)), closes [#19375](https://github.com/vitejs/vite/issues/19375)
* fix(deps): update all non-major dependencies (#19392) ([60456a5](https://github.com/vitejs/vite/commit/60456a54fe90872dbd4bed332ecbd85bc88deb92)), closes [#19392](https://github.com/vitejs/vite/issues/19392)
* fix(deps): update all non-major dependencies (#19440) ([ccac73d](https://github.com/vitejs/vite/commit/ccac73d9d0e92c7232f09207d1d6b893e823ed8e)), closes [#19440](https://github.com/vitejs/vite/issues/19440)
* fix(html): ignore malformed src attrs (#19397) ([aff7812](https://github.com/vitejs/vite/commit/aff7812f0aed059c05ca36c86bf907d25964119a)), closes [#19397](https://github.com/vitejs/vite/issues/19397)
* fix(worker): fix web worker type detection (#19462) ([edc65ea](https://github.com/vitejs/vite/commit/edc65eafa332b57ce44835deb7d7707e2d036c24)), closes [#19462](https://github.com/vitejs/vite/issues/19462)
* refactor: remove custom .jxl mime (#19457) ([0c85464](https://github.com/vitejs/vite/commit/0c854645bd17960abbe8f01b602d1a1da1a2b9fd)), closes [#19457](https://github.com/vitejs/vite/issues/19457)
* feat: add support for injecting debug IDs (#18763) ([0ff556a](https://github.com/vitejs/vite/commit/0ff556a6d9b55bff7cac17396ce7d4397becacaa)), closes [#18763](https://github.com/vitejs/vite/issues/18763)
* chore: update 6.1.0 changelog (#19363) ([fa7c211](https://github.com/vitejs/vite/commit/fa7c211bf3e51269f8a8601e5994fb3ebb6859f9)), closes [#19363](https://github.com/vitejs/vite/issues/19363)



## 6.1.0 (2025-02-05)


### Features

* feat: show hosts in cert in CLI (#19317) ([a5e306f](https://github.com/vitejs/vite/commit/a5e306f2fc34fc70d543028c319367ff9b232ea0)), closes [#19317](https://github.com/vitejs/vite/issues/19317)
* feat: support for env var for defining allowed hosts (#19325) ([4d88f6c](https://github.com/vitejs/vite/commit/4d88f6c9391f96275b1359f1343ee2ec3e1adb7b)), closes [#19325](https://github.com/vitejs/vite/issues/19325)
* feat: use native runtime to import the config (#19178) ([7c2a794](https://github.com/vitejs/vite/commit/7c2a7942cc8494a98fbc2b0235d91faf25242d30)), closes [#19178](https://github.com/vitejs/vite/issues/19178)
* feat: print `port` in the logged error message after failed WS connection with `EADDRINUSE` (#19212) ([14027b0](https://github.com/vitejs/vite/commit/14027b0f2a9b01c14815c38aab22baf5b29594bb)), closes [#19212](https://github.com/vitejs/vite/issues/19212)
* perf(css): only run postcss when needed (#19061) ([30194fa](https://github.com/vitejs/vite/commit/30194fa1e41dda6470aa20f2bb34655c4bfd9cd1)), closes [#19061](https://github.com/vitejs/vite/issues/19061)
* feat: add support for `.jxl` (#18855) ([57b397c](https://github.com/vitejs/vite/commit/57b397c4aa3d3c657e0117c2468800d627049c8d)), closes [#18855](https://github.com/vitejs/vite/issues/18855)
* feat: add the `builtins` environment `resolve` (#18584) ([2c2d521](https://github.com/vitejs/vite/commit/2c2d521abfd7a3263b5082f9420738ad0ef67c71)), closes [#18584](https://github.com/vitejs/vite/issues/18584)
* feat: call Logger for plugin logs in build (#13757) ([bf3e410](https://github.com/vitejs/vite/commit/bf3e41082932f4bf7d828e18ab0346b2ac8b59c9)), closes [#13757](https://github.com/vitejs/vite/issues/13757)
* feat: export `defaultAllowedOrigins` for user-land config and 3rd party plugins (#19259) ([dc8946b](https://github.com/vitejs/vite/commit/dc8946b9f6483ca7d63df3a5cbba307f1c21041e)), closes [#19259](https://github.com/vitejs/vite/issues/19259)
* feat: expose createServerModuleRunnerTransport (#18730) ([8c24ee4](https://github.com/vitejs/vite/commit/8c24ee4b4fcfa16fdd8bb699643a92ee81f9c92b)), closes [#18730](https://github.com/vitejs/vite/issues/18730)
* feat: support async for proxy.bypass (#18940) ([a6b9587](https://github.com/vitejs/vite/commit/a6b958741bd97d631aba21aa5925bbf2bca65dac)), closes [#18940](https://github.com/vitejs/vite/issues/18940)
* feat: support log related functions in dev (#18922) ([3766004](https://github.com/vitejs/vite/commit/3766004289fde3300d1278fcf35f3bb980d9785f)), closes [#18922](https://github.com/vitejs/vite/issues/18922)
* feat: use module runner to import the config (#18637) ([b7e0e42](https://github.com/vitejs/vite/commit/b7e0e42098dd2d42285a9d3c4f39c48a580367e7)), closes [#18637](https://github.com/vitejs/vite/issues/18637)
* feat(css): add friendly errors for IE hacks that are not supported by lightningcss (#19072) ([caad985](https://github.com/vitejs/vite/commit/caad985abca6450d56ca3d4e27e1e859fe8909b9)), closes [#19072](https://github.com/vitejs/vite/issues/19072)
* feat(optimizer): support bun text lockfile (#18403) ([05b005f](https://github.com/vitejs/vite/commit/05b005fc25a1e8dda749fb14149aa2f3c988b6a1)), closes [#18403](https://github.com/vitejs/vite/issues/18403)
* feat(reporter): add `wasm` to the compressible assets regex (#19085) ([ce84142](https://github.com/vitejs/vite/commit/ce84142110584eadfccbd6ce9319573358af31a6)), closes [#19085](https://github.com/vitejs/vite/issues/19085)
* feat(worker): support dynamic worker option fields (#19010) ([d0c3523](https://github.com/vitejs/vite/commit/d0c35232c6ccbcf448941328df34d15e9f73919b)), closes [#19010](https://github.com/vitejs/vite/issues/19010)


### Fixes

* fix: avoid builtStart during vite optimize (#19356) ([fdb36e0](https://github.com/vitejs/vite/commit/fdb36e076969c763d4249f6db890f8bf26e9f5d1)), closes [#19356](https://github.com/vitejs/vite/issues/19356)
* fix(build): fix stale build manifest on watch rebuild (#19361) ([fcd5785](https://github.com/vitejs/vite/commit/fcd578587b2fbdef0ff8de8a0d97c9fc6da19ce1)), closes [#19361](https://github.com/vitejs/vite/issues/19361)
* fix: allow expanding env vars in reverse order (#19352) ([3f5f2bd](https://github.com/vitejs/vite/commit/3f5f2bddf142b2d1b162d4553d26f1ff0758b10d)), closes [#19352](https://github.com/vitejs/vite/issues/19352)
* fix: avoid packageJson without name in `resolveLibCssFilename` (#19324) ([f183bdf](https://github.com/vitejs/vite/commit/f183bdf2a799e703672ab1887d707ce120053eb2)), closes [#19324](https://github.com/vitejs/vite/issues/19324)
* fix(html): fix css disorder when building multiple entry html (#19143) ([e7b4ba3](https://github.com/vitejs/vite/commit/e7b4ba37f90a033036326b45023a1753584dd259)), closes [#19143](https://github.com/vitejs/vite/issues/19143)
* fix: don't call buildStart hooks for `vite optimize` (#19347) ([19ffad0](https://github.com/vitejs/vite/commit/19ffad0a5aaf8c0ff55409e746048431b8b6640d)), closes [#19347](https://github.com/vitejs/vite/issues/19347)
* fix: don't call next middleware if user sent response in proxy.bypass (#19318) ([7e6364d](https://github.com/vitejs/vite/commit/7e6364de2b0f3bf65aefaf451646ca500bad8239)), closes [#19318](https://github.com/vitejs/vite/issues/19318)
* fix: respect top-level `server.preTransformRequests` (#19272) ([12aaa58](https://github.com/vitejs/vite/commit/12aaa585bc3fac403bf93f48ea117482cc7f43b1)), closes [#19272](https://github.com/vitejs/vite/issues/19272)
* fix: use `nodeLikeBuiltins` for `ssr.target: 'webworker'` without `noExternal: true` (#19313) ([9fc31b6](https://github.com/vitejs/vite/commit/9fc31b6e4d4f2a5bd9711d4f84dcb55061ebead0)), closes [#19313](https://github.com/vitejs/vite/issues/19313)
* fix(css): less `@plugin` imports of JS files treated as CSS and rebased (fix #19268) (#19269) ([602b373](https://github.com/vitejs/vite/commit/602b373dcdc755816ce28913873f70550347e936)), closes [#19268](https://github.com/vitejs/vite/issues/19268) [#19269](https://github.com/vitejs/vite/issues/19269)
* fix(deps): update all non-major dependencies (#19296) ([2bea7ce](https://github.com/vitejs/vite/commit/2bea7cec4b7fddbd5f2fb6090a7eaf5ae7ca0f1b)), closes [#19296](https://github.com/vitejs/vite/issues/19296)
* fix(resolve): preserve hash/search of file url (#19300) ([d1e1b24](https://github.com/vitejs/vite/commit/d1e1b24c57328b5a808b981829503caa6ffadb56)), closes [#19300](https://github.com/vitejs/vite/issues/19300)
* fix(resolve): warn if node-like builtin was imported when `resolve.builtin` is empty (#19312) ([b7aba0b](https://github.com/vitejs/vite/commit/b7aba0bc925f6d672bbb6a1e6c8c5c123a3bef55)), closes [#19312](https://github.com/vitejs/vite/issues/19312)
* fix(ssr): fix transform error due to export all id scope (#19331) ([e28bce2](https://github.com/vitejs/vite/commit/e28bce244918dac27b26d4e428f86b323a1c51ba)), closes [#19331](https://github.com/vitejs/vite/issues/19331)
* fix(ssr): pretty print plugin error in `ssrLoadModule` (#19290) ([353c467](https://github.com/vitejs/vite/commit/353c467610e2d92c0929fa4abd03f2cbd26e34ed)), closes [#19290](https://github.com/vitejs/vite/issues/19290)
* fix: change ResolvedConfig type to interface to allow extending it (#19210) ([bc851e3](https://github.com/vitejs/vite/commit/bc851e31d88cb26a2cba3fa46763bcd368e8df36)), closes [#19210](https://github.com/vitejs/vite/issues/19210)
* fix: correctly resolve hmr dep ids and fallback to url  (#18840) ([b84498b](https://github.com/vitejs/vite/commit/b84498b6def7d57ff6719da2d2baf6e29f0bb819)), closes [#18840](https://github.com/vitejs/vite/issues/18840)
* fix: make `--force` work for all environments (#18901) ([51a42c6](https://github.com/vitejs/vite/commit/51a42c6b6a285fb1f092be5bbd2e18cd1fe2b214)), closes [#18901](https://github.com/vitejs/vite/issues/18901)
* fix: use loc.file from rollup errors if available (#19222) ([ce3fe23](https://github.com/vitejs/vite/commit/ce3fe236de625de745643e127e27f2a5b52c6d2e)), closes [#19222](https://github.com/vitejs/vite/issues/19222)
* fix(deps): update all non-major dependencies (#19190) ([f2c07db](https://github.com/vitejs/vite/commit/f2c07dbfc874b46f6e09bb04996d0514663e4544)), closes [#19190](https://github.com/vitejs/vite/issues/19190)
* fix(hmr): register inlined assets as a dependency of CSS file (#18979) ([eb22a74](https://github.com/vitejs/vite/commit/eb22a74d29813d30be48d4413d785eedb0064b2c)), closes [#18979](https://github.com/vitejs/vite/issues/18979)
* fix(resolve): support resolving TS files by JS extension specifiers in JS files (#18889) ([612332b](https://github.com/vitejs/vite/commit/612332b9bbe8d489265aea31c9c9a712319abc51)), closes [#18889](https://github.com/vitejs/vite/issues/18889)
* fix(ssr): combine empty source mappings (#19226) ([ba03da2](https://github.com/vitejs/vite/commit/ba03da2a8c9ea6b26533cbcc4e50d58dc36499e2)), closes [#19226](https://github.com/vitejs/vite/issues/19226)
* fix(utils): clone `RegExp` values with `new RegExp` instead of `structuredClone` (fix #19245, fix #1 ([56ad2be](https://github.com/vitejs/vite/commit/56ad2bef0353a4d00cd18789de7f4e7e5329d663)), closes [#19245](https://github.com/vitejs/vite/issues/19245) [#18875](https://github.com/vitejs/vite/issues/18875) [#19247](https://github.com/vitejs/vite/issues/19247)


### Chore

* refactor: deprecate `vite optimize` command (#19348) ([6e0e3c0](https://github.com/vitejs/vite/commit/6e0e3c0b990f1132db923e4599e18b270baa3a93)), closes [#19348](https://github.com/vitejs/vite/issues/19348)
* chore: update deprecate links domain (#19353) ([2b2299c](https://github.com/vitejs/vite/commit/2b2299cbac37548a163f0523c0cb92eb70a9aacf)), closes [#19353](https://github.com/vitejs/vite/issues/19353)
* docs: rephrase browser range and features relation (#19286) ([97569ef](https://github.com/vitejs/vite/commit/97569efd9d26b5c24d3a702d3171426f97c403cc)), closes [#19286](https://github.com/vitejs/vite/issues/19286)
* docs: update `build.manifest` jsdocs (#19332) ([4583781](https://github.com/vitejs/vite/commit/45837817dea1fd76fbc3dcf05ca7fcd46daa7b23)), closes [#19332](https://github.com/vitejs/vite/issues/19332)
* chore: remove outdated code comment about `scanImports` not being used in ssr (#19285) ([fbbc6da](https://github.com/vitejs/vite/commit/fbbc6da186d72b7c2ad1efce22d42d302f673516)), closes [#19285](https://github.com/vitejs/vite/issues/19285)
* chore: unneeded name in lockfileFormats (#19275) ([96092cb](https://github.com/vitejs/vite/commit/96092cb566ee50881edb391187d33f71af8f47b1)), closes [#19275](https://github.com/vitejs/vite/issues/19275)
* chore(deps): update dependency strip-literal to v3 (#19231) ([1172d65](https://github.com/vitejs/vite/commit/1172d655c19e689e03e6a6346eefe3ac7cc5baad)), closes [#19231](https://github.com/vitejs/vite/issues/19231)



### Beta Changelogs


#### [6.1.0-beta.2](https://github.com/vitejs/vite/compare/v6.1.0-beta.1...v6.1.0-beta.2) (2025-02-04)

See [6.1.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v6.1.0-beta.2/packages/vite/CHANGELOG.md)


#### [6.1.0-beta.1](https://github.com/vitejs/vite/compare/v6.1.0-beta.0...v6.1.0-beta.1) (2025-02-04)

See [6.1.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v6.1.0-beta.1/packages/vite/CHANGELOG.md)


#### [6.1.0-beta.0](https://github.com/vitejs/vite/compare/v6.0.11...v6.1.0-beta.0) (2025-01-24)

See [6.1.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.10/packages/vite/CHANGELOG.md)



## <small>6.0.11 (2025-01-21)</small>

* fix: `preview.allowedHosts` with specific values was not respected (#19246) ([aeb3ec8](https://github.com/vitejs/vite/commit/aeb3ec84a288d6be227a1284607f13428a4f14a1)), closes [#19246](https://github.com/vitejs/vite/issues/19246)
* fix: allow CORS from loopback addresses by default (#19249) ([3d03899](https://github.com/vitejs/vite/commit/3d038997377a30022b6a6b7916e0b4b5d8b9a363)), closes [#19249](https://github.com/vitejs/vite/issues/19249)



## <small>6.0.10 (2025-01-20)</small>

* fix: try parse `server.origin` URL (#19241) ([2495022](https://github.com/vitejs/vite/commit/2495022420fda05ee389c2dcf26921b21e2aed3b)), closes [#19241](https://github.com/vitejs/vite/issues/19241)



## <small>6.0.9 (2025-01-20)</small>

* fix!: check host header to prevent DNS rebinding attacks and introduce `server.allowedHosts` ([bd896fb](https://github.com/vitejs/vite/commit/bd896fb5f312fc0ff1730166d1d142fc0d34ba6d))
* fix!: default `server.cors: false` to disallow fetching from untrusted origins ([b09572a](https://github.com/vitejs/vite/commit/b09572acc939351f4e4c50ddf793017a92c678b1))
* fix: verify token for HMR WebSocket connection ([029dcd6](https://github.com/vitejs/vite/commit/029dcd6d77d3e3ef10bc38e9a0829784d9760fdb))



## <small>6.0.8 (2025-01-20)</small>

* fix: avoid SSR HMR for HTML files (#19193) ([3bd55bc](https://github.com/vitejs/vite/commit/3bd55bcb7e831d2c4f66c90d7bbb3e1fbf7a02b6)), closes [#19193](https://github.com/vitejs/vite/issues/19193)
* fix: build time display 7m 60s (#19108) ([cf0d2c8](https://github.com/vitejs/vite/commit/cf0d2c8e232a1af716c71cdd2218d180f7ecc02b)), closes [#19108](https://github.com/vitejs/vite/issues/19108)
* fix: don't resolve URL starting with double slash (#19059) ([35942cd](https://github.com/vitejs/vite/commit/35942cde11fd8a68fa89bf25f7aa1ddb87d775b2)), closes [#19059](https://github.com/vitejs/vite/issues/19059)
* fix: ensure `server.close()` only called once (#19204) ([db81c2d](https://github.com/vitejs/vite/commit/db81c2dada961f40c0882b5182adf2f34bb5c178)), closes [#19204](https://github.com/vitejs/vite/issues/19204)
* fix: resolve.conditions in ResolvedConfig was `defaultServerConditions` (#19174) ([ad75c56](https://github.com/vitejs/vite/commit/ad75c56dce5618a3a416e18f9a5c3880d437a107)), closes [#19174](https://github.com/vitejs/vite/issues/19174)
* fix: tree shake stringified JSON imports (#19189) ([f2aed62](https://github.com/vitejs/vite/commit/f2aed62d0bf1b66e870ee6b4aab80cd1702793ab)), closes [#19189](https://github.com/vitejs/vite/issues/19189)
* fix: use shared sigterm callback (#19203) ([47039f4](https://github.com/vitejs/vite/commit/47039f4643179be31a8d7c7fbff83c5c13deb787)), closes [#19203](https://github.com/vitejs/vite/issues/19203)
* fix(deps): update all non-major dependencies (#19098) ([8639538](https://github.com/vitejs/vite/commit/8639538e6498d1109da583ad942c1472098b5919)), closes [#19098](https://github.com/vitejs/vite/issues/19098)
* fix(optimizer): use correct default install state path for yarn PnP (#19119) ([e690d8b](https://github.com/vitejs/vite/commit/e690d8bb1e5741e81df5b7a6a5c8c3c1c971fa41)), closes [#19119](https://github.com/vitejs/vite/issues/19119)
* fix(types): improve `ESBuildOptions.include / exclude` type to allow `readonly (string | RegExp)[]`  ([ea53e70](https://github.com/vitejs/vite/commit/ea53e7095297ea4192490fd58556414cc59a8975)), closes [#19146](https://github.com/vitejs/vite/issues/19146)
* chore(deps): update dependency pathe to v2 (#19139) ([71506f0](https://github.com/vitejs/vite/commit/71506f0a8deda5254cb49c743cd439dfe42859ce)), closes [#19139](https://github.com/vitejs/vite/issues/19139)



## <small>6.0.7 (2025-01-02)</small>

* fix: fix `minify` when `builder.sharedPlugins: true` (#19025) ([f7b1964](https://github.com/vitejs/vite/commit/f7b1964d3a93a21f80b61638fa6ae9606d0a6f4f)), closes [#19025](https://github.com/vitejs/vite/issues/19025)
* fix: skip the plugin if it has been called before with the same id and importer (#19016) ([b178c90](https://github.com/vitejs/vite/commit/b178c90c7d175ea31f8b67dccad3918f820357a4)), closes [#19016](https://github.com/vitejs/vite/issues/19016)
* fix(html): error while removing `vite-ignore` attribute for inline script (#19062) ([a492253](https://github.com/vitejs/vite/commit/a4922537a8d705da7769d30626a0d846511fc124)), closes [#19062](https://github.com/vitejs/vite/issues/19062)
* fix(ssr): fix semicolon injection by ssr transform (#19097) ([1c102d5](https://github.com/vitejs/vite/commit/1c102d517de52531faf5765632703977a17de65a)), closes [#19097](https://github.com/vitejs/vite/issues/19097)
* perf: skip globbing for static path in warmup (#19107) ([677508b](https://github.com/vitejs/vite/commit/677508bf8268a7b8661e5557a3d0a2a76cab8bd1)), closes [#19107](https://github.com/vitejs/vite/issues/19107)
* feat(css): show lightningcss warnings (#19076) ([b07c036](https://github.com/vitejs/vite/commit/b07c036faf6849fe5ffd03125f25dc00f460f8ba)), closes [#19076](https://github.com/vitejs/vite/issues/19076)



## <small>6.0.6 (2024-12-26)</small>

* fix: replace runner-side path normalization with `fetchModule`-side resolve (#18361) ([9f10261](https://github.com/vitejs/vite/commit/9f10261e7609098b832fd0fb23a64840b3a0d1a0)), closes [#18361](https://github.com/vitejs/vite/issues/18361)
* fix(css): resolve style tags in HTML files correctly for lightningcss (#19001) ([afff05c](https://github.com/vitejs/vite/commit/afff05c03266fc76d5ab8928215c89f5992f40f8)), closes [#19001](https://github.com/vitejs/vite/issues/19001)
* fix(css): show correct error when unknown placeholder is used for CSS modules pattern in lightningcs ([9290d85](https://github.com/vitejs/vite/commit/9290d85b5d2ad64991bd296157cb3bcb959c341d)), closes [#19070](https://github.com/vitejs/vite/issues/19070)
* fix(resolve): handle package.json with UTF-8 BOM (#19000) ([902567a](https://github.com/vitejs/vite/commit/902567ac5327e915ce65d090045fa4922ef9f2b5)), closes [#19000](https://github.com/vitejs/vite/issues/19000)
* fix(ssrTransform): preserve line offset when transforming imports (#19004) ([1aa434e](https://github.com/vitejs/vite/commit/1aa434e8017012bf0939b2ff1a3a66b4bd12b76d)), closes [#19004](https://github.com/vitejs/vite/issues/19004)
* chore: fix typo in comment (#19067) ([eb06ec3](https://github.com/vitejs/vite/commit/eb06ec30bb02ced66274f0fc6e90aff2bb20c632)), closes [#19067](https://github.com/vitejs/vite/issues/19067)
* chore: update comment about `build.target` (#19047) ([0e9e81f](https://github.com/vitejs/vite/commit/0e9e81f622f13d78ee238c0fa72ba920e23419f4)), closes [#19047](https://github.com/vitejs/vite/issues/19047)
* revert: unpin esbuild version (#19043) ([8bfe247](https://github.com/vitejs/vite/commit/8bfe247511517c631a26f3931bb3c93a7b0b7446)), closes [#19043](https://github.com/vitejs/vite/issues/19043)
* test(ssr): test virtual module with query (#19044) ([a1f4b46](https://github.com/vitejs/vite/commit/a1f4b46896cb4b442b54a8336db8eca6df9ee02d)), closes [#19044](https://github.com/vitejs/vite/issues/19044)



## <small>6.0.5 (2024-12-20)</small>

* fix: esbuild regression (pin to 0.24.0) (#19027) ([4359e0d](https://github.com/vitejs/vite/commit/4359e0d5b33afd6259a4dcef787cc2670e963126)), closes [#19027](https://github.com/vitejs/vite/issues/19027)



## <small>6.0.4 (2024-12-19)</small>

* fix: `this.resolve` skipSelf should not skip for different `id` or `import` (#18903) ([4727320](https://github.com/vitejs/vite/commit/472732057cb2273908e1fca8aa7dc18a7e1f7c74)), closes [#18903](https://github.com/vitejs/vite/issues/18903)
* fix: fallback terser to main thread when function options are used (#18987) ([12b612d](https://github.com/vitejs/vite/commit/12b612d8be2a18456fd94a2f0291d32d1ffb29d4)), closes [#18987](https://github.com/vitejs/vite/issues/18987)
* fix: merge client and ssr values for `pluginContainer.getModuleInfo` (#18895) ([258cdd6](https://github.com/vitejs/vite/commit/258cdd637d1ee80a3c4571685135e89fe283f3a6)), closes [#18895](https://github.com/vitejs/vite/issues/18895)
* fix(css): escape double quotes in `url()` when lightningcss is used (#18997) ([3734f80](https://github.com/vitejs/vite/commit/3734f8099e3922c189497ce404fe7ff2f8929ae1)), closes [#18997](https://github.com/vitejs/vite/issues/18997)
* fix(css): root relative import in sass modern API on Windows (#18945) ([c4b532c](https://github.com/vitejs/vite/commit/c4b532cc900bf988073583511f57bd581755d5e3)), closes [#18945](https://github.com/vitejs/vite/issues/18945)
* fix(css): skip non css in custom sass importer (#18970) ([21680bd](https://github.com/vitejs/vite/commit/21680bdf9ca7c12f677136b56e47f46469db8be2)), closes [#18970](https://github.com/vitejs/vite/issues/18970)
* fix(deps): update all non-major dependencies (#18967) ([d88d000](https://github.com/vitejs/vite/commit/d88d0004a8e891ca6026d356695e0b319caa7fce)), closes [#18967](https://github.com/vitejs/vite/issues/18967)
* fix(deps): update all non-major dependencies (#18996) ([2b4f115](https://github.com/vitejs/vite/commit/2b4f115129fb3fbd730a92078acb724f8527b7f7)), closes [#18996](https://github.com/vitejs/vite/issues/18996)
* fix(optimizer): keep NODE_ENV as-is when keepProcessEnv is `true` (#18899) ([8a6bb4e](https://github.com/vitejs/vite/commit/8a6bb4e11d5c1b61511ae1e5ed3ae3c65a33b2dc)), closes [#18899](https://github.com/vitejs/vite/issues/18899)
* fix(ssr): recreate ssrCompatModuleRunner on restart (#18973) ([7d6dd5d](https://github.com/vitejs/vite/commit/7d6dd5d1d655d173668192509f63ac4ebf7af299)), closes [#18973](https://github.com/vitejs/vite/issues/18973)
* chore: better validation error message for dts build (#18948) ([63b82f1](https://github.com/vitejs/vite/commit/63b82f1e29a00d06a82144fd03ea8d6eff114290)), closes [#18948](https://github.com/vitejs/vite/issues/18948)
* chore(deps): update all non-major dependencies (#18916) ([ef7a6a3](https://github.com/vitejs/vite/commit/ef7a6a35e6827b92445e5a0c2c0022616efc80dd)), closes [#18916](https://github.com/vitejs/vite/issues/18916)
* chore(deps): update dependency @rollup/plugin-node-resolve to v16 (#18968) ([62fad6d](https://github.com/vitejs/vite/commit/62fad6d79f83daf916dde866909a2a3dd0c79583)), closes [#18968](https://github.com/vitejs/vite/issues/18968)
* refactor: make internal invoke event to use the same interface with `handleInvoke` (#18902) ([27f691b](https://github.com/vitejs/vite/commit/27f691b0c7dca2259108fe6b79583b459429bf7f)), closes [#18902](https://github.com/vitejs/vite/issues/18902)
* refactor: simplify manifest plugin code (#18890) ([1bfe21b](https://github.com/vitejs/vite/commit/1bfe21b9440f318c940f90e425a18588595225fd)), closes [#18890](https://github.com/vitejs/vite/issues/18890)
* test: test `ModuleRunnerTransport` `invoke` API (#18865) ([e5f5301](https://github.com/vitejs/vite/commit/e5f5301924b775837b2a1253c37f76555bce3e3e)), closes [#18865](https://github.com/vitejs/vite/issues/18865)
* test: test output hash changes (#18898) ([bfbb130](https://github.com/vitejs/vite/commit/bfbb130fccefbe7e3880f09defb4fceacce39481)), closes [#18898](https://github.com/vitejs/vite/issues/18898)



## <small>6.0.3 (2024-12-05)</small>

* fix: handle postcss load unhandled rejections (#18886) ([d5fb653](https://github.com/vitejs/vite/commit/d5fb653c15903ccf84a093f212da86f0327a9a6f)), closes [#18886](https://github.com/vitejs/vite/issues/18886)
* fix: make handleInvoke interface compatible with invoke (#18876) ([a1dd396](https://github.com/vitejs/vite/commit/a1dd396da856401a12c921d0cd2c4e97cb63f1b5)), closes [#18876](https://github.com/vitejs/vite/issues/18876)
* fix: make result interfaces for `ModuleRunnerTransport#invoke` more explicit (#18851) ([a75fc31](https://github.com/vitejs/vite/commit/a75fc3193d5e8d8756dfb3a046873e9c222bb6c8)), closes [#18851](https://github.com/vitejs/vite/issues/18851)
* fix: merge `environments.ssr.resolve` with root `ssr` config (#18857) ([3104331](https://github.com/vitejs/vite/commit/310433106e1e8a0c39dc397e3eace8a71a2416c2)), closes [#18857](https://github.com/vitejs/vite/issues/18857)
* fix: no permission to create vite config file (#18844) ([ff47778](https://github.com/vitejs/vite/commit/ff47778004d609dbeef7f192783e6f253dd66237)), closes [#18844](https://github.com/vitejs/vite/issues/18844)
* fix: remove CSS import in CJS correctly in some cases (#18885) ([690a36f](https://github.com/vitejs/vite/commit/690a36ffdb7d6f6568f35a304b4904e7aa475f17)), closes [#18885](https://github.com/vitejs/vite/issues/18885)
* fix(config): bundle files referenced with imports field (#18887) ([2b5926a](https://github.com/vitejs/vite/commit/2b5926a0e79ce47d22536d38eed2629d326caca0)), closes [#18887](https://github.com/vitejs/vite/issues/18887)
* fix(config): make stacktrace path correct when sourcemap is enabled (#18833) ([20fdf21](https://github.com/vitejs/vite/commit/20fdf210ee0ac0824b2db74876527cb7f378a9e8)), closes [#18833](https://github.com/vitejs/vite/issues/18833)
* fix(css): rewrite url when image-set and url exist at the same time (#18868) ([d59efd8](https://github.com/vitejs/vite/commit/d59efd8dfd1c5bf2e7c45c7cdb1c0abc2a05ba02)), closes [#18868](https://github.com/vitejs/vite/issues/18868)
* fix(deps): update all non-major dependencies (#18853) ([5c02236](https://github.com/vitejs/vite/commit/5c0223636fa277d5daeb4d93c3f32d9f3cd69fc5)), closes [#18853](https://github.com/vitejs/vite/issues/18853)
* fix(html): allow unexpected question mark in tag name (#18852) ([1b54e50](https://github.com/vitejs/vite/commit/1b54e506a44420d0c8a9e000cf45b1c4f5e33026)), closes [#18852](https://github.com/vitejs/vite/issues/18852)
* fix(module-runner): decode uri for file url passed to import (#18837) ([88e49aa](https://github.com/vitejs/vite/commit/88e49aa0418cb3f6b579b744ba59daeda68432f3)), closes [#18837](https://github.com/vitejs/vite/issues/18837)
* refactor: fix logic errors found by no-unnecessary-condition rule (#18891) ([ea802f8](https://github.com/vitejs/vite/commit/ea802f8f8bcf3771a35c1eaf687378613fbabb24)), closes [#18891](https://github.com/vitejs/vite/issues/18891)
* chore: fix duplicate attributes issue number in comment (#18860) ([ffee618](https://github.com/vitejs/vite/commit/ffee61893cfe9f2b0db4aecf9ddb62ca79c80458)), closes [#18860](https://github.com/vitejs/vite/issues/18860)



## <small>6.0.2 (2024-12-02)</small>

* chore: run typecheck in unit tests (#18858) ([49f20bb](https://github.com/vitejs/vite/commit/49f20bb77749ec7b44344fd9c42d593ae20c78f0)), closes [#18858](https://github.com/vitejs/vite/issues/18858)
* chore: update broken links in changelog (#18802) ([cb754f8](https://github.com/vitejs/vite/commit/cb754f8acc1b579dae9fe70a08e3ef53984402cc)), closes [#18802](https://github.com/vitejs/vite/issues/18802)
* chore: update broken links in changelog (#18804) ([47ec49f](https://github.com/vitejs/vite/commit/47ec49ffa170cac5d04cf2eef01f45e0b5ccde03)), closes [#18804](https://github.com/vitejs/vite/issues/18804)
* fix: don't store temporary vite config file in `node_modules` if deno (#18823) ([a20267b](https://github.com/vitejs/vite/commit/a20267bb93118468a2e20f0f77b77ed7bfa94165)), closes [#18823](https://github.com/vitejs/vite/issues/18823)
* fix(css): referencing aliased svg asset with lightningcss enabled errored (#18819) ([ae68958](https://github.com/vitejs/vite/commit/ae6895869157e48b32088f0a1f85d2fddb2d713f)), closes [#18819](https://github.com/vitejs/vite/issues/18819)
* fix(manifest): use `style.css` as a key for the style file for `cssCodesplit: false` (#18820) ([ec51115](https://github.com/vitejs/vite/commit/ec511152558cb573acf55e88e5244bdead1b5a17)), closes [#18820](https://github.com/vitejs/vite/issues/18820)
* fix(optimizer): resolve all promises when cancelled (#18826) ([d6e6194](https://github.com/vitejs/vite/commit/d6e6194706f0e3a889caa9303de2293cc0f131b2)), closes [#18826](https://github.com/vitejs/vite/issues/18826)
* fix(resolve): don't set builtinModules to `external` by default (#18821) ([2250ffa](https://github.com/vitejs/vite/commit/2250ffac62e55c89232d745d2f99ece539be9195)), closes [#18821](https://github.com/vitejs/vite/issues/18821)
* fix(ssr): set `ssr.target: 'webworker'` defaults as fallback (#18827) ([b39e696](https://github.com/vitejs/vite/commit/b39e69638b3e2e658ff6712be83b549b28103c3d)), closes [#18827](https://github.com/vitejs/vite/issues/18827)
* feat(css): format lightningcss error (#18818) ([dac7992](https://github.com/vitejs/vite/commit/dac7992e8725234007c7515f86f543992874c7b8)), closes [#18818](https://github.com/vitejs/vite/issues/18818)
* refactor: make properties of ResolvedServerOptions and ResolvedPreviewOptions required (#18796) ([51a5569](https://github.com/vitejs/vite/commit/51a5569e66bd7f0de79ac14b9e902d1382ccd0aa)), closes [#18796](https://github.com/vitejs/vite/issues/18796)



## <small>6.0.1 (2024-11-27)</small>

* fix: default empty server `proxy` prevents starting http2 server (#18788) ([bbaf514](https://github.com/vitejs/vite/commit/bbaf514fb718952e0f17a15545c593125f1d1b9c)), closes [#18788](https://github.com/vitejs/vite/issues/18788)
* fix(manifest): do not override existing js manifest entry  (#18776) ([3b0837e](https://github.com/vitejs/vite/commit/3b0837e0b997e14dacc347719353b8b0cea35bda)), closes [#18776](https://github.com/vitejs/vite/issues/18776)
* fix(server): close _ssrCompatModuleRunner on server close (#18784) ([9b4c410](https://github.com/vitejs/vite/commit/9b4c410dddb80c8858549355e175735976a82134)), closes [#18784](https://github.com/vitejs/vite/issues/18784)
* fix(server): skip hot channel client normalization for wsServer  (#18782) ([cc7670a](https://github.com/vitejs/vite/commit/cc7670abaffeda1338cf3acfef2bc41a38c223a0)), closes [#18782](https://github.com/vitejs/vite/issues/18782)
* fix(worker): fix `applyToEnvironment` hooks on worker build (#18793) ([0c6cdb0](https://github.com/vitejs/vite/commit/0c6cdb0f88d32ce041272977e786006008223f44)), closes [#18793](https://github.com/vitejs/vite/issues/18793)
* chore: flat v6 config file (#18777) ([c7b3308](https://github.com/vitejs/vite/commit/c7b330832675ee6385ee1a8750762e496c8e18e6)), closes [#18777](https://github.com/vitejs/vite/issues/18777)
* chore: split changelog (#18787) ([8542632](https://github.com/vitejs/vite/commit/8542632b3b205b61999b6d998928d5fb17ba90c4)), closes [#18787](https://github.com/vitejs/vite/issues/18787)
* chore: update changelog for v6 (#18773) ([b254fac](https://github.com/vitejs/vite/commit/b254fac4aa35a3522aeafb3259e60acd050aeb51)), closes [#18773](https://github.com/vitejs/vite/issues/18773)
* revert: update moduleResolution value casing (#18409) (#18774) ([b0fc6e3](https://github.com/vitejs/vite/commit/b0fc6e3c2591a30360d3714263cf7cc0e2acbfdf)), closes [#18409](https://github.com/vitejs/vite/issues/18409) [#18774](https://github.com/vitejs/vite/issues/18774)



## 6.0.0 (2024-11-26)

![Vite 6 is out!](../../docs/public/og-image-announcing-vite6.png)

Today, we're taking another big step in Vite's story. The Vite [team](https://vite.dev/team), [contributors](https://github.com/vitejs/vite/graphs/contributors), and ecosystem partners are excited to announce the release of the next Vite major:

- **[Vite 6.0 announcement blog post](https://vite.dev/blog/announcing-vite6.html)**
- [Docs](https://vite.dev/)
- Translations: [简体中文](https://cn.vite.dev/), [日本語](https://ja.vite.dev/), [Español](https://es.vite.dev/), [Português](https://pt.vite.dev/), [한국어](https://ko.vite.dev/), [Deutsch](https://de.vite.dev/)
- [Migration Guide](https://vite.dev/guide/migration.html)

We want to thank the more than [1K contributors to Vite Core](https://github.com/vitejs/vite/graphs/contributors) and the maintainers and contributors of Vite plugins, integrations, tools, and translations that have helped us craft this new major. We invite you to get involved and help us improve Vite for the whole ecosystem. Learn more at our [Contributing Guide](https://github.com/vitejs/vite/blob/main/CONTRIBUTING.md).



### Breaking Changes

* feat!: drop node 21 support in version ranges (#18729) ([a384d8f](https://github.com/vitejs/vite/commit/a384d8fd39162190675abcfea31ba657383a3d03)), closes [#18729](https://github.com/vitejs/vite/issues/18729)
* fix(deps)!: update dependency dotenv-expand to v12 (#18697) ([0c658de](https://github.com/vitejs/vite/commit/0c658de41f4c1576c526a8c48a8ea0a019c6311c)), closes [#18697](https://github.com/vitejs/vite/issues/18697)
* feat(html)!: support more asset sources (#11138) ([8a7af50](https://github.com/vitejs/vite/commit/8a7af50b5ddf72f21098406e9668bc609b323899)), closes [#11138](https://github.com/vitejs/vite/issues/11138)
* feat(resolve)!: allow removing conditions (#18395) ([d002e7d](https://github.com/vitejs/vite/commit/d002e7d05a0f23110f9185b39222819bcdfffc16)), closes [#18395](https://github.com/vitejs/vite/issues/18395)
* refactor!: remove fs.cachedChecks option (#18493) ([94b0857](https://github.com/vitejs/vite/commit/94b085735372588d5f92c7f4a8cf68e8291f2db0)), closes [#18493](https://github.com/vitejs/vite/issues/18493)
* feat!: proxy bypass with WebSocket (#18070) ([3c9836d](https://github.com/vitejs/vite/commit/3c9836d96f118ff5748916241bc3871a54247ad1)), closes [#18070](https://github.com/vitejs/vite/issues/18070)
* feat!: support `file://` resolution (#18422) ([6a7e313](https://github.com/vitejs/vite/commit/6a7e313754dce5faa5cd7c1e2343448cd7f3a2a2)), closes [#18422](https://github.com/vitejs/vite/issues/18422)
* feat!: update to chokidar v4 (#18453) ([192d555](https://github.com/vitejs/vite/commit/192d555f88bba7576e8a40cc027e8a11e006079c)), closes [#18453](https://github.com/vitejs/vite/issues/18453)
* feat(lib)!: use package name for css output file name (#18488) ([61cbf6f](https://github.com/vitejs/vite/commit/61cbf6f2cfcd5afc91fe0a0ad56abfc36a32f1ab)), closes [#18488](https://github.com/vitejs/vite/issues/18488)
* fix(css)!: remove default import in ssr dev (#17922) ([eccf663](https://github.com/vitejs/vite/commit/eccf663e35a17458425860895bb30b3b0613ea96)), closes [#17922](https://github.com/vitejs/vite/issues/17922)
* chore(deps)!: update postcss-load-config to v6 (#15235) ([3a27f62](https://github.com/vitejs/vite/commit/3a27f627df278f6c9778a55f44cb347665b65204)), closes [#15235](https://github.com/vitejs/vite/issues/15235)
* feat(css)!: change default sass api to modern/modern-compiler (#17937) ([d4e0442](https://github.com/vitejs/vite/commit/d4e0442f9d6adc70b72ea0713dc8abb4b1f75ae4)), closes [#17937](https://github.com/vitejs/vite/issues/17937)
* feat(css)!: load postcss config within workspace root only (#18440) ([d23a493](https://github.com/vitejs/vite/commit/d23a493cc4b54a2e2b2c1337b3b1f0c9b1be311e)), closes [#18440](https://github.com/vitejs/vite/issues/18440)
* feat(json)!: add `json.stringify: 'auto'` and make that the default (#18303) ([b80daa7](https://github.com/vitejs/vite/commit/b80daa7c0970645dca569d572892648f66c6799c)), closes [#18303](https://github.com/vitejs/vite/issues/18303)
* fix!: default `build.cssMinify` to `'esbuild'` for SSR (#15637) ([f1d3bf7](https://github.com/vitejs/vite/commit/f1d3bf74cc7f12e759442fd7111d07e2c0262a67)), closes [#15637](https://github.com/vitejs/vite/issues/15637)
* chore(deps)!: migrate `fast-glob` to `tinyglobby` (#18243) ([6f74a3a](https://github.com/vitejs/vite/commit/6f74a3a1b2469a24a86743d16267b0cc3653bc4a)), closes [#18243](https://github.com/vitejs/vite/issues/18243)
* refactor!: bump minimal terser version to 5.16.0 (#18209) ([19ce525](https://github.com/vitejs/vite/commit/19ce525b974328e4668ad8c6540c2a5ea652795b)), closes [#18209](https://github.com/vitejs/vite/issues/18209)
* feat!: Environment API (#16471) ([242f550](https://github.com/vitejs/vite/commit/242f550eb46c93896fca6b55495578921e29a8af)), closes [#16471](https://github.com/vitejs/vite/issues/16471)


### Features

* feat: add support for .cur type (#18680) ([5ec9eed](https://github.com/vitejs/vite/commit/5ec9eedc80bbf39a33b498198ba07ed1bd9cacc7)), closes [#18680](https://github.com/vitejs/vite/issues/18680)
* feat: enable HMR by default on ModuleRunner side (#18749) ([4d2abc7](https://github.com/vitejs/vite/commit/4d2abc7bba95cf516ce7341d5d8f349d61b75224)), closes [#18749](https://github.com/vitejs/vite/issues/18749)
* feat: support `module-sync` condition when loading config if enabled (#18650) ([cf5028d](https://github.com/vitejs/vite/commit/cf5028d4bf0a0d59b4a98323beaadc268204056b)), closes [#18650](https://github.com/vitejs/vite/issues/18650)
* feat: add `isSsrTargetWebWorker` flag to `configEnvironment` hook (#18620) ([3f5fab0](https://github.com/vitejs/vite/commit/3f5fab04aa64c0e9b45068e842f033583b365de0)), closes [#18620](https://github.com/vitejs/vite/issues/18620)
* feat: add `ssr.resolve.mainFields` option (#18646) ([a6f5f5b](https://github.com/vitejs/vite/commit/a6f5f5baca7a5d2064f5f4cb689764ad939fab4b)), closes [#18646](https://github.com/vitejs/vite/issues/18646)
* feat: expose default mainFields/conditions (#18648) ([c12c653](https://github.com/vitejs/vite/commit/c12c653ca5fab354e0f71394e2fbe636dccf6b2f)), closes [#18648](https://github.com/vitejs/vite/issues/18648)
* feat: extended applyToEnvironment and perEnvironmentPlugin (#18544) ([8fa70cd](https://github.com/vitejs/vite/commit/8fa70cdfa65ce8254ab8da8be0d92614126764c0)), closes [#18544](https://github.com/vitejs/vite/issues/18544)
* feat: show error when accessing variables not exposed in CJS build (#18649) ([87c5502](https://github.com/vitejs/vite/commit/87c55022490d4710934c482abf5fbd4fcda9c3c9)), closes [#18649](https://github.com/vitejs/vite/issues/18649)
* feat(optimizer): allow users to specify their esbuild `platform` option (#18611) ([0924879](https://github.com/vitejs/vite/commit/09248795ca79a7053b803af8977c3422f5cd5824)), closes [#18611](https://github.com/vitejs/vite/issues/18611)
* refactor: introduce `mergeWithDefaults` and organize how default values for config options are set ( ([0e1f437](https://github.com/vitejs/vite/commit/0e1f437d53683b57f0157ce3ff0b0f02acabb408)), closes [#18550](https://github.com/vitejs/vite/issues/18550)
* build: ignore cjs warning (#18660) ([33b0d5a](https://github.com/vitejs/vite/commit/33b0d5a6ca18e9f7c27b0159decd84fee3859e09)), closes [#18660](https://github.com/vitejs/vite/issues/18660)
* feat: use a single transport for fetchModule and HMR support (#18362) ([78dc490](https://github.com/vitejs/vite/commit/78dc4902ffef7f316e84d21648b04dc62dd0ae0a)), closes [#18362](https://github.com/vitejs/vite/issues/18362)
* feat(asset): add `?inline` and `?no-inline` queries to control inlining (#15454) ([9162172](https://github.com/vitejs/vite/commit/9162172e039ae67ad4ee8dce18f04b7444f7d9de)), closes [#15454](https://github.com/vitejs/vite/issues/15454)
* feat(asset): inline svg in dev if within limit (#18581) ([f08b146](https://github.com/vitejs/vite/commit/f08b1463db50f39b571faa871d05c92b10f3434c)), closes [#18581](https://github.com/vitejs/vite/issues/18581)
* feat: log complete config in debug mode (#18289) ([04f6736](https://github.com/vitejs/vite/commit/04f6736fd7ac3da22141929c01a151f5a6fe4e45)), closes [#18289](https://github.com/vitejs/vite/issues/18289)
* feat(html): support `vite-ignore` attribute to opt-out of processing (#18494) ([d951310](https://github.com/vitejs/vite/commit/d9513104e21175e1d23e0f614df55cd53291ab4e)), closes [#18494](https://github.com/vitejs/vite/issues/18494)
* feat: allow custom `console` in `createLogger` (#18379) ([0c497d9](https://github.com/vitejs/vite/commit/0c497d9cb63bd4a6bb8e01c0e3b843890a239d23)), closes [#18379](https://github.com/vitejs/vite/issues/18379)
* feat: read `sec-fetch-dest` header to detect JS in transform (#9981) ([e51dc40](https://github.com/vitejs/vite/commit/e51dc40b5907cf14d7aefaaf01fb8865a852ef15)), closes [#9981](https://github.com/vitejs/vite/issues/9981)
* feat(css): add more stricter typing of lightningcss (#18460) ([b9b925e](https://github.com/vitejs/vite/commit/b9b925eb3f911ab63972124dc8ab0455449b925d)), closes [#18460](https://github.com/vitejs/vite/issues/18460)
* feat: add .git to deny list by default (#18382) ([105ca12](https://github.com/vitejs/vite/commit/105ca12b34e466dc9de838643954a873ac1ce804)), closes [#18382](https://github.com/vitejs/vite/issues/18382)
* feat: add `environment::listen` (#18263) ([4d5f51d](https://github.com/vitejs/vite/commit/4d5f51d13f92cc8224a028c27df12834a0667659)), closes [#18263](https://github.com/vitejs/vite/issues/18263)
* feat: enable dependencies discovery and pre-bundling in ssr environments (#18358) ([9b21f69](https://github.com/vitejs/vite/commit/9b21f69405271f1b864fa934a96adcb0e1a2bc4d)), closes [#18358](https://github.com/vitejs/vite/issues/18358)
* feat: restrict characters useable for environment name (#18255) ([9ab6180](https://github.com/vitejs/vite/commit/9ab6180d3a20be71eb7aedef000f8c4ae3591c40)), closes [#18255](https://github.com/vitejs/vite/issues/18255)
* feat: support arbitrary module namespace identifier imports from cjs deps (#18236) ([4389a91](https://github.com/vitejs/vite/commit/4389a917f8f5e8e67222809fb7b166bb97f6d02c)), closes [#18236](https://github.com/vitejs/vite/issues/18236)
* feat: introduce RunnableDevEnvironment (#18190) ([fb292f2](https://github.com/vitejs/vite/commit/fb292f226f988e80fee4f4aea878eb3d5d229022)), closes [#18190](https://github.com/vitejs/vite/issues/18190)
* feat: support `this.environment` in `options` and `onLog` hook (#18142) ([7722c06](https://github.com/vitejs/vite/commit/7722c061646bc8587f55f560bfe06b2a9643639a)), closes [#18142](https://github.com/vitejs/vite/issues/18142)
* feat: expose `EnvironmentOptions` type (#18080) ([35cf59c](https://github.com/vitejs/vite/commit/35cf59c9d53ef544eb5f2fe2f9ff4d6cb225e63b)), closes [#18080](https://github.com/vitejs/vite/issues/18080)
* feat(css): support es2023 build target for lightningcss (#17998) ([1a76300](https://github.com/vitejs/vite/commit/1a76300cd16827f0640924fdc21747ce140c35fb)), closes [#17998](https://github.com/vitejs/vite/issues/17998)


### Performance

* perf: reduce bundle size for `Object.keys(import.meta.glob(...))` / `Object.values(import.meta.glob( ([ed99a2c](https://github.com/vitejs/vite/commit/ed99a2cd31e8d3c2b791885bcc4b188570539e45)), closes [#18666](https://github.com/vitejs/vite/issues/18666)
* perf(worker): inline worker without base64 (#18752) ([90c66c9](https://github.com/vitejs/vite/commit/90c66c95aba3d2edd86637a77adc699f3fd6c1ff)), closes [#18752](https://github.com/vitejs/vite/issues/18752)
* perf: remove strip-ansi for a node built-in (#18630) ([5182272](https://github.com/vitejs/vite/commit/5182272d52fc092a6219c8efe73ecb3f8e65a0b5)), closes [#18630](https://github.com/vitejs/vite/issues/18630)
* perf(css): skip style.css extraction if code-split css (#18470) ([34fdb6b](https://github.com/vitejs/vite/commit/34fdb6bef558724330d2411b9666facef669b3a0)), closes [#18470](https://github.com/vitejs/vite/issues/18470)
* perf: call `module.enableCompileCache()` (#18323) ([18f1dad](https://github.com/vitejs/vite/commit/18f1daddd125b07dcb8c32056ee0cec61bd65971)), closes [#18323](https://github.com/vitejs/vite/issues/18323)
* perf: use `crypto.hash` when available (#18317) ([2a14884](https://github.com/vitejs/vite/commit/2a148844cf2382a5377b75066351f00207843352)), closes [#18317](https://github.com/vitejs/vite/issues/18317)
* build: reduce package size (#18517) ([b83f60b](https://github.com/vitejs/vite/commit/b83f60b159f3b6f4a61db180fa03cc5b20bd110f)), closes [#18517](https://github.com/vitejs/vite/issues/18517)

### Fixes

* fix: `createRunnableDevEnvironment` returns `RunnableDevEnvironment`, not `DevEnvironment` (#18673) ([74221c3](https://github.com/vitejs/vite/commit/74221c391bffd61b9ef39b7c0f9ea2e405913a6f)), closes [#18673](https://github.com/vitejs/vite/issues/18673)
* fix: `getModulesByFile` should return a `serverModule` (#18715) ([b80d5ec](https://github.com/vitejs/vite/commit/b80d5ecbbcc374bd8f32b2ed5ceb3cbfffaae77b)), closes [#18715](https://github.com/vitejs/vite/issues/18715)
* fix: catch error in full reload handler (#18713) ([a10e741](https://github.com/vitejs/vite/commit/a10e7410656d3614cbfd07ba772776ff334a8d60)), closes [#18713](https://github.com/vitejs/vite/issues/18713)
* fix: display pre-transform error details (#18764) ([554f45f](https://github.com/vitejs/vite/commit/554f45f4d820c57c0874ebe48ef2fddfafdd0750)), closes [#18764](https://github.com/vitejs/vite/issues/18764)
* fix: exit code on `SIGTERM` (#18741) ([cc55e36](https://github.com/vitejs/vite/commit/cc55e36dd39fef134568f53acc66514cbb7175ea)), closes [#18741](https://github.com/vitejs/vite/issues/18741)
* fix: expose missing `InterceptorOptions` type (#18766) ([6252c60](https://github.com/vitejs/vite/commit/6252c6035695365c93773fbe06a4b2a307e86368)), closes [#18766](https://github.com/vitejs/vite/issues/18766)
* fix: log error when send in module runner failed (#18753) ([ba821bb](https://github.com/vitejs/vite/commit/ba821bb63eca6d8a9199ee2253ef2607375f5702)), closes [#18753](https://github.com/vitejs/vite/issues/18753)
* fix(client): overlay not appearing when multiple vite clients were loaded (#18647) ([27d70b5](https://github.com/vitejs/vite/commit/27d70b5fa61f1c1a836d52809549cb57569f42a4)), closes [#18647](https://github.com/vitejs/vite/issues/18647)
* fix(deps): update all non-major dependencies (#18691) ([f005461](https://github.com/vitejs/vite/commit/f005461ecce89ada21cb0c021f7af460b5479736)), closes [#18691](https://github.com/vitejs/vite/issues/18691)
* fix(html): fix inline proxy modules invalidation (#18696) ([8ab04b7](https://github.com/vitejs/vite/commit/8ab04b70ada119fbca2fc5a53c36f233423febbe)), closes [#18696](https://github.com/vitejs/vite/issues/18696)
* fix(module-runner): make evaluator optional (#18672) ([fd1283f](https://github.com/vitejs/vite/commit/fd1283fe27cc1a19b5c7d9d72664832e4daa1bbf)), closes [#18672](https://github.com/vitejs/vite/issues/18672)
* fix(optimizer): detect npm / yarn / pnpm dependency changes correctly (#17336) (#18560) ([818cf3e](https://github.com/vitejs/vite/commit/818cf3e7bf1b6c2dc56e7cd8f056bc1d185c2cd7)), closes [#17336](https://github.com/vitejs/vite/issues/17336) [#18560](https://github.com/vitejs/vite/issues/18560)
* fix(optimizer): trigger onCrawlEnd after manual included deps are registered (#18733) ([dc60410](https://github.com/vitejs/vite/commit/dc6041099ccd5767764fb8c99a169869bbd13f16)), closes [#18733](https://github.com/vitejs/vite/issues/18733)
* fix(optimizer): workaround firefox's false warning for no sources source map (#18665) ([473424e](https://github.com/vitejs/vite/commit/473424ee8d6b743c1565bf0749deb5d9fbedcea7)), closes [#18665](https://github.com/vitejs/vite/issues/18665)
* fix(ssr): replace `__vite_ssr_identity__` with `(0, ...)` and inject `;` between statements (#18748) ([94546be](https://github.com/vitejs/vite/commit/94546be18354a457bced5107aa31533b09e304ec)), closes [#18748](https://github.com/vitejs/vite/issues/18748)
* refactor: first character judgment replacement regexp (#18658) ([58f1df3](https://github.com/vitejs/vite/commit/58f1df3288b0f9584bb413dd34b8d65671258f6f)), closes [#18658](https://github.com/vitejs/vite/issues/18658)
* refactor(resolve): remove `allowLinkedExternal` parameter from `tryNodeResolve` (#18670) ([b74d363](https://github.com/vitejs/vite/commit/b74d3632693b6a829b4d1cdc2a9d4ba8234c093b)), closes [#18670](https://github.com/vitejs/vite/issues/18670)
* revert: use chokidar v3 (#18659) ([49783da](https://github.com/vitejs/vite/commit/49783da298bc45f3f3c5ad4ce2fb1260ee8856bb)), closes [#18659](https://github.com/vitejs/vite/issues/18659)
* fix: cjs build for perEnvironmentState et al (#18656) ([95c4b3c](https://github.com/vitejs/vite/commit/95c4b3c371dc7fb12c28cb1307f6f389887eb1e1)), closes [#18656](https://github.com/vitejs/vite/issues/18656)
* fix: include more modules to prefix-only module list (#18667) ([5a2103f](https://github.com/vitejs/vite/commit/5a2103f0d486a7725c23c70710b11559c00e9b93)), closes [#18667](https://github.com/vitejs/vite/issues/18667)
* fix(html): externalize `rollup.external` scripts correctly (#18618) ([55461b4](https://github.com/vitejs/vite/commit/55461b43329db6a5e737eab591163a8681ba9230)), closes [#18618](https://github.com/vitejs/vite/issues/18618)
* fix(ssr): format `ssrTransform` parse error  (#18644) ([d9be921](https://github.com/vitejs/vite/commit/d9be92187cb17d740856af27d0ab60c84e04d58c)), closes [#18644](https://github.com/vitejs/vite/issues/18644)
* fix(ssr): preserve fetchModule error details (#18626) ([866a433](https://github.com/vitejs/vite/commit/866a433a34ab2f6d2910506e781b346091de1b9e)), closes [#18626](https://github.com/vitejs/vite/issues/18626)
* fix: browser field should not be included by default for `consumer: 'server'` (#18575) ([87b2347](https://github.com/vitejs/vite/commit/87b2347a13ea8ae8282f0f1e2233212c040bfed8)), closes [#18575](https://github.com/vitejs/vite/issues/18575)
* fix: use `server.perEnvironmentStartEndDuringDev` (#18549) ([fe30349](https://github.com/vitejs/vite/commit/fe30349d350ef08bccd56404ccc3e6d6e0a2e156)), closes [#18549](https://github.com/vitejs/vite/issues/18549)
* fix(client): detect ws close correctly (#18548) ([637d31b](https://github.com/vitejs/vite/commit/637d31bcc59d964e51f7969093cc369deee88ca1)), closes [#18548](https://github.com/vitejs/vite/issues/18548)
* fix(resolve): run ensureVersionQuery for SSR (#18591) ([63207e5](https://github.com/vitejs/vite/commit/63207e5d0fbedc8ddddb7d1faaa8ea9a45a118d4)), closes [#18591](https://github.com/vitejs/vite/issues/18591)
* refactor(resolve): remove `environmentsOptions` parameter (#18590) ([3ef0bf1](https://github.com/vitejs/vite/commit/3ef0bf19a3457c46395bdcb2201bbf32807d7231)), closes [#18590](https://github.com/vitejs/vite/issues/18590)
* fix: allow nested dependency selector to be used for `optimizeDeps.include` for SSR (#18506) ([826c81a](https://github.com/vitejs/vite/commit/826c81a40bb25914d55cd2e96b548f1a2c384a19)), closes [#18506](https://github.com/vitejs/vite/issues/18506)
* fix: asset `new URL(,import.meta.url)` match (#18194) ([5286a90](https://github.com/vitejs/vite/commit/5286a90a3c1b693384f99903582a1f70b7b44945)), closes [#18194](https://github.com/vitejs/vite/issues/18194)
* fix: close watcher if it's disabled (#18521) ([85bd0e9](https://github.com/vitejs/vite/commit/85bd0e9b0dc637c7645f2b56f93071d6e1ec149c)), closes [#18521](https://github.com/vitejs/vite/issues/18521)
* fix(config): write temporary vite config to node_modules (#18509) ([72eaef5](https://github.com/vitejs/vite/commit/72eaef5300d20b7163050461733c3208a4013e1e)), closes [#18509](https://github.com/vitejs/vite/issues/18509)
* fix(css): `cssCodeSplit` uses the current environment configuration (#18486) ([eefe895](https://github.com/vitejs/vite/commit/eefe8957167681b85f0e1b07bc5feefa307cccb0)), closes [#18486](https://github.com/vitejs/vite/issues/18486)
* fix(json): don't `json.stringify` arrays (#18541) ([fa50b03](https://github.com/vitejs/vite/commit/fa50b03390dae280293174f65f850522599b9ab7)), closes [#18541](https://github.com/vitejs/vite/issues/18541)
* fix(less): prevent rebasing `@import url(...)` (#17857) ([aec5fdd](https://github.com/vitejs/vite/commit/aec5fdd72e3aeb2aa26796001b98f3f330be86d1)), closes [#17857](https://github.com/vitejs/vite/issues/17857)
* fix(lib): only resolve css bundle name if have styles (#18530) ([5d6dc49](https://github.com/vitejs/vite/commit/5d6dc491b6bb78613694eaf686e2e305b71af5e1)), closes [#18530](https://github.com/vitejs/vite/issues/18530)
* fix(scss): improve error logs (#18522) ([3194a6a](https://github.com/vitejs/vite/commit/3194a6a60714a3978f5e4b39d6223f32a8dc01ef)), closes [#18522](https://github.com/vitejs/vite/issues/18522)
* refactor: client-only top-level warmup (#18524) ([a50ff60](https://github.com/vitejs/vite/commit/a50ff6000bca46a6fe429f2c3a98c486ea5ebc8e)), closes [#18524](https://github.com/vitejs/vite/issues/18524)
* fix: `define` in environment config was not working (#18515) ([052799e](https://github.com/vitejs/vite/commit/052799e8939cfcdd7a7ff48daf45a766bf6cc546)), closes [#18515](https://github.com/vitejs/vite/issues/18515)
* fix: consider URLs with any protocol to be external (#17369) ([a0336bd](https://github.com/vitejs/vite/commit/a0336bd5197bb4427251be4c975e30fb596c658f)), closes [#17369](https://github.com/vitejs/vite/issues/17369)
* fix: use picomatch to align with tinyglobby (#18503) ([437795d](https://github.com/vitejs/vite/commit/437795db8307ce4491d066bcaaa5bd9432193773)), closes [#18503](https://github.com/vitejs/vite/issues/18503)
* fix(build): apply resolve.external/noExternal to server environments (#18495) ([5a967cb](https://github.com/vitejs/vite/commit/5a967cb596c7c4b0548be1d9025bc1e34b36169a)), closes [#18495](https://github.com/vitejs/vite/issues/18495)
* fix(config): remove error if require resolve to esm (#18437) ([f886f75](https://github.com/vitejs/vite/commit/f886f75396cdb5a43ec5377bbbaaffc0e8ae03e9)), closes [#18437](https://github.com/vitejs/vite/issues/18437)
* refactor: separate tsconfck caches per config in a weakmap (#17317) ([b9b01d5](https://github.com/vitejs/vite/commit/b9b01d57fdaf5d291c78a8156e17b534c8c51eb4)), closes [#17317](https://github.com/vitejs/vite/issues/17317)
* fix: handle warmup glob hang (#18462) ([409fa5c](https://github.com/vitejs/vite/commit/409fa5c9dee0e394bcdc3b111f5b2e4261131ca0)), closes [#18462](https://github.com/vitejs/vite/issues/18462)
* fix: return the same instance of ModuleNode for the same EnvironmentModuleNode (#18455) ([5ead461](https://github.com/vitejs/vite/commit/5ead461b374d76ceb134063477eaf3f97fe3da97)), closes [#18455](https://github.com/vitejs/vite/issues/18455)
* fix: set scripts imported by HTML moduleSideEffects=true (#18411) ([2ebe4b4](https://github.com/vitejs/vite/commit/2ebe4b44430dd311028f72520ac977bb202ce50b)), closes [#18411](https://github.com/vitejs/vite/issues/18411)
* fix: use websocket to test server liveness before client reload (#17891) ([7f9f8c6](https://github.com/vitejs/vite/commit/7f9f8c6851d1eb49a72dcb6c134873148a2e81eb)), closes [#17891](https://github.com/vitejs/vite/issues/17891)
* fix(css): `cssCodeSplit` in `environments.xxx.build` is invalid (#18464) ([993e71c](https://github.com/vitejs/vite/commit/993e71c4cb227bd8c347b918f52ccd83f85a645a)), closes [#18464](https://github.com/vitejs/vite/issues/18464)
* fix(css): make sass types work with sass-embedded (#18459) ([89f8303](https://github.com/vitejs/vite/commit/89f8303e727791aa7be6f35833a708b6a50e9120)), closes [#18459](https://github.com/vitejs/vite/issues/18459)
* fix(deps): update all non-major dependencies (#18484) ([2ec12df](https://github.com/vitejs/vite/commit/2ec12df98d07eb4c986737e86a4a9f8066724658)), closes [#18484](https://github.com/vitejs/vite/issues/18484)
* fix(manifest): non entry CSS chunk src was wrong (#18133) ([c148676](https://github.com/vitejs/vite/commit/c148676c90dc4823bc6bdeb8ba1e36386c5d9654)), closes [#18133](https://github.com/vitejs/vite/issues/18133)
* fix(module-runner): delay function eval until module runner instantiation (#18480) ([472afbd](https://github.com/vitejs/vite/commit/472afbd010db3f1c7a59826c7bf4067191b7f48a)), closes [#18480](https://github.com/vitejs/vite/issues/18480)
* fix(plugins): noop if config hook returns same config reference (#18467) ([bd540d5](https://github.com/vitejs/vite/commit/bd540d52eb609ca12dad8e2f3fe8011821bda878)), closes [#18467](https://github.com/vitejs/vite/issues/18467)
* fix: add typing to `CSSOptions.preprocessorOptions` (#18001) ([7eeb6f2](https://github.com/vitejs/vite/commit/7eeb6f2f97abf5dfc71c225b9cff9779baf2ed2f)), closes [#18001](https://github.com/vitejs/vite/issues/18001)
* fix(dev): prevent double URL encoding in server.open on macOS (#18443) ([56b7176](https://github.com/vitejs/vite/commit/56b71768f3ee498962fba898804086299382bb59)), closes [#18443](https://github.com/vitejs/vite/issues/18443)
* fix(preview): set resolvedUrls null after close (#18445) ([65014a3](https://github.com/vitejs/vite/commit/65014a32ef618619c5a34b729d67340d9253bdd5)), closes [#18445](https://github.com/vitejs/vite/issues/18445)
* fix(ssr): inject identity function at the top (#18449) ([0ab20a3](https://github.com/vitejs/vite/commit/0ab20a3ee26eacf302415b3087732497d0a2f358)), closes [#18449](https://github.com/vitejs/vite/issues/18449)
* fix(ssr): preserve source maps for hoisted imports (fix #16355) (#16356) ([8e382a6](https://github.com/vitejs/vite/commit/8e382a6a1fed2cd41051b81f9cd9c94b484352a5)), closes [#16355](https://github.com/vitejs/vite/issues/16355) [#16356](https://github.com/vitejs/vite/issues/16356)
* fix: augment hash for CSS files to prevent chromium erroring by loading previous files (#18367) ([a569f42](https://github.com/vitejs/vite/commit/a569f42ee93229308be7a327b7a71e79f3d58b01)), closes [#18367](https://github.com/vitejs/vite/issues/18367)
* fix: more robust plugin.sharedDuringBuild (#18351) ([47b1270](https://github.com/vitejs/vite/commit/47b12706ce2d0c009d6078a61e16e81a04c9f49c)), closes [#18351](https://github.com/vitejs/vite/issues/18351)
* fix(cli): `--watch` should not override `build.watch` options (#18390) ([b2965c8](https://github.com/vitejs/vite/commit/b2965c8e9f74410bc8047a05528c74b68a3856d7)), closes [#18390](https://github.com/vitejs/vite/issues/18390)
* fix(css): don't transform sass function calls with namespace (#18414) ([dbb2604](https://github.com/vitejs/vite/commit/dbb260499f894d495bcff3dcdf5635d015a2f563)), closes [#18414](https://github.com/vitejs/vite/issues/18414)
* fix(deps): update `open` dependency to 10.1.0 (#18349) ([5cca4bf](https://github.com/vitejs/vite/commit/5cca4bfd3202c7aea690acf63f60bfe57fa165de)), closes [#18349](https://github.com/vitejs/vite/issues/18349)
* fix(deps): update all non-major dependencies (#18345) ([5552583](https://github.com/vitejs/vite/commit/5552583a2272cd4208b30ad60e99d984e34645f0)), closes [#18345](https://github.com/vitejs/vite/issues/18345)
* fix(ssr): `this` in exported function should be `undefined` (#18329) ([bae6a37](https://github.com/vitejs/vite/commit/bae6a37628c4870f3db92351e8af2a7b4a07e248)), closes [#18329](https://github.com/vitejs/vite/issues/18329)
* fix(worker): rewrite rollup `output.format` with `worker.format` on worker build error (#18165) ([dc82334](https://github.com/vitejs/vite/commit/dc823347bb857a9f63eee7e027a52236d7e331e0)), closes [#18165](https://github.com/vitejs/vite/issues/18165)
* fix: `injectQuery` double encoding (#18246) ([2c5f948](https://github.com/vitejs/vite/commit/2c5f948d0646f6a0237570ab5d36b06d31cb94c9)), closes [#18246](https://github.com/vitejs/vite/issues/18246)
* fix: add position to import analysis resolve exception (#18344) ([0fe95d4](https://github.com/vitejs/vite/commit/0fe95d4a71930cf55acd628efef59e6eae0f77f7)), closes [#18344](https://github.com/vitejs/vite/issues/18344)
* fix: destroy the runner when runnable environment is closed (#18282) ([5212d09](https://github.com/vitejs/vite/commit/5212d09579a82bc09b149c77e996d0e5c3972455)), closes [#18282](https://github.com/vitejs/vite/issues/18282)
* fix: handle yarn command fail when root does not exist (#18141) ([460aaff](https://github.com/vitejs/vite/commit/460aaffbf134a9eda6e092a564afc2eeebf8f935)), closes [#18141](https://github.com/vitejs/vite/issues/18141)
* fix: make it easier to configure environment runner (#18273) ([fb35a78](https://github.com/vitejs/vite/commit/fb35a7800e21ed2c6f9d0f843898afa1fcc87795)), closes [#18273](https://github.com/vitejs/vite/issues/18273)
* fix(assets): make srcset parsing HTML spec compliant (#16323) (#18242) ([0e6d4a5](https://github.com/vitejs/vite/commit/0e6d4a5e23cdfb2ec433f687e455b9827269527c)), closes [#16323](https://github.com/vitejs/vite/issues/16323) [#18242](https://github.com/vitejs/vite/issues/18242)
* fix(css): dont remove JS chunk for pure CSS chunk when the export is used (#18307) ([889bfc0](https://github.com/vitejs/vite/commit/889bfc0ada6d6cd356bb7a92efdce96298f82fef)), closes [#18307](https://github.com/vitejs/vite/issues/18307)
* fix(deps): bump tsconfck (#18322) ([67783b2](https://github.com/vitejs/vite/commit/67783b2d5513e013bf74844186eb9b2b70d17d5c)), closes [#18322](https://github.com/vitejs/vite/issues/18322)
* fix(deps): update all non-major dependencies (#18292) ([5cac054](https://github.com/vitejs/vite/commit/5cac0544dca2764f0114aac38e9922a0c13d7ef4)), closes [#18292](https://github.com/vitejs/vite/issues/18292)
* fix(hmr): don't try to rewrite imports for direct CSS soft invalidation (#18252) ([a03bb0e](https://github.com/vitejs/vite/commit/a03bb0e2ba35af314c57fc98600bb76566592239)), closes [#18252](https://github.com/vitejs/vite/issues/18252)
* fix(middleware-mode): call all hot.listen when server restart (#18261) ([007773b](https://github.com/vitejs/vite/commit/007773b550e7c6bcaeb8d88970fd6dfe999d5a4a)), closes [#18261](https://github.com/vitejs/vite/issues/18261)
* fix(optimizer): don't externalize transitive dep package name with asset extension (#18152) ([fafc7e2](https://github.com/vitejs/vite/commit/fafc7e28d3395292fbc2f2355417dcc15871ab1e)), closes [#18152](https://github.com/vitejs/vite/issues/18152)
* fix(resolve): fix resolve cache key for external conditions (#18332) ([93d286c](https://github.com/vitejs/vite/commit/93d286c4c1af0b379002a6ff495e82bb87acd65c)), closes [#18332](https://github.com/vitejs/vite/issues/18332)
* fix(resolve): fix resolve cache to consider `conditions` and more (#18302) ([2017a33](https://github.com/vitejs/vite/commit/2017a330f5576dfc9db1538e0b899a1776cd100a)), closes [#18302](https://github.com/vitejs/vite/issues/18302)
* fix(types): add more overload to `defineConfig` (#18299) ([94e34cf](https://github.com/vitejs/vite/commit/94e34cf1dfe6fdb331b6508e830b2cc446000aac)), closes [#18299](https://github.com/vitejs/vite/issues/18299)
* fix: asset import should skip handling data URIs (#18163) ([70813c7](https://github.com/vitejs/vite/commit/70813c7f05fc9a45d102a53514ecac23831e6d6b)), closes [#18163](https://github.com/vitejs/vite/issues/18163)
* fix: cache the runnable environment module runner (#18215) ([95020ab](https://github.com/vitejs/vite/commit/95020ab49e12d143262859e095025cf02423c1d9)), closes [#18215](https://github.com/vitejs/vite/issues/18215)
* fix: call `this.hot.close` for non-ws HotChannel (#18212) ([bad0ccc](https://github.com/vitejs/vite/commit/bad0cccee80c02fa309f274220f6d324d03c3b19)), closes [#18212](https://github.com/vitejs/vite/issues/18212)
* fix: close HotChannel on environment close (#18206) ([2d148e3](https://github.com/vitejs/vite/commit/2d148e347e8fbcc6f0e4e627a20acc81d9ced3e0)), closes [#18206](https://github.com/vitejs/vite/issues/18206)
* fix: require serialization for `HMRConnection.send` on implementation side (#18186) ([9470011](https://github.com/vitejs/vite/commit/9470011570503a917021915c47e6a2f36aae16b5)), closes [#18186](https://github.com/vitejs/vite/issues/18186)
* fix: use `config.consumer` instead of `options?.ssr` / `config.build.ssr` (#18140) ([21ec1ce](https://github.com/vitejs/vite/commit/21ec1ce7f041efa5cd781924f7bc536ab406a197)), closes [#18140](https://github.com/vitejs/vite/issues/18140)
* fix(config): treat all files as ESM on deno (#18081) ([c1ed8a5](https://github.com/vitejs/vite/commit/c1ed8a595a02ec7f8f5a8d23f97b2f21d3834ab1)), closes [#18081](https://github.com/vitejs/vite/issues/18081)
* fix(css): ensure sass compiler initialized only once (#18128) ([4cc5322](https://github.com/vitejs/vite/commit/4cc53224e9b207aa6a5a111e40ed0a0464cf37f4)), closes [#18128](https://github.com/vitejs/vite/issues/18128)
* fix(css): fix lightningcss dep url resolution with custom root (#18125) ([eb08f60](https://github.com/vitejs/vite/commit/eb08f605ddadef99a5d68f55de143e3e47c91618)), closes [#18125](https://github.com/vitejs/vite/issues/18125)
* fix(css): fix missing source file warning with sass modern api custom importer (#18113) ([d7763a5](https://github.com/vitejs/vite/commit/d7763a5615a238cb1b5dceb7bdfc4aac7678fb0a)), closes [#18113](https://github.com/vitejs/vite/issues/18113)
* fix(data-uri): only match ids starting with `data:` (#18241) ([ec0efe8](https://github.com/vitejs/vite/commit/ec0efe8a06d0271ef0154f38fb9beabcd4b1bd89)), closes [#18241](https://github.com/vitejs/vite/issues/18241)
* fix(deps): update all non-major dependencies (#18170) ([c8aea5a](https://github.com/vitejs/vite/commit/c8aea5ae0af90dc6796ef3bdd612d1eb819f157b)), closes [#18170](https://github.com/vitejs/vite/issues/18170)
* fix(deps): upgrade rollup 4.22.4+ to ensure avoiding XSS (#18180) ([ea1d0b9](https://github.com/vitejs/vite/commit/ea1d0b9af9b28b57166d4ca67bece21650221a04)), closes [#18180](https://github.com/vitejs/vite/issues/18180)
* fix(html): make build-html plugin work with `sharedPlugins` (#18214) ([34041b9](https://github.com/vitejs/vite/commit/34041b9d8ea39aa9138d0c2417bfbe39cc9aabdc)), closes [#18214](https://github.com/vitejs/vite/issues/18214)
* fix(mixedModuleGraph): handle undefined id in getModulesByFile (#18201) ([768a50f](https://github.com/vitejs/vite/commit/768a50f7ac668dbf876feef557d8c0f8ff32b8ff)), closes [#18201](https://github.com/vitejs/vite/issues/18201)
* fix(optimizer): re-optimize when changing config `webCompatible` (#18221) ([a44b0a2](https://github.com/vitejs/vite/commit/a44b0a2690812788aaaba00fd3acd2c6fa36669b)), closes [#18221](https://github.com/vitejs/vite/issues/18221)
* fix(ssr): fix source map remapping with multiple sources (#18150) ([e003a2c](https://github.com/vitejs/vite/commit/e003a2ca73b04648e14ebf40f3616838e2da3d6d)), closes [#18150](https://github.com/vitejs/vite/issues/18150)
* fix(vite): refactor "module cache" to "evaluated modules", pass down module to "runInlinedModule" (# ([e83beff](https://github.com/vitejs/vite/commit/e83beff596072f9c7a42f6e2410f154668981d71)), closes [#18092](https://github.com/vitejs/vite/issues/18092)
* fix: avoid DOM Clobbering gadget in `getRelativeUrlFromDocument` (#18115) ([ade1d89](https://github.com/vitejs/vite/commit/ade1d89660e17eedfd35652165b0c26905259fad)), closes [#18115](https://github.com/vitejs/vite/issues/18115)
* fix: fs raw query (#18112) ([9d2413c](https://github.com/vitejs/vite/commit/9d2413c8b64bfb1dfd953340b4e1b5972d5440aa)), closes [#18112](https://github.com/vitejs/vite/issues/18112)
* fix(preload): throw error preloading module as well (#18098) ([ba56cf4](https://github.com/vitejs/vite/commit/ba56cf43b5480f8519349f7d7fe60718e9af5f1a)), closes [#18098](https://github.com/vitejs/vite/issues/18098)
* fix: allow scanning exports from `script module` in svelte (#18063) ([7d699aa](https://github.com/vitejs/vite/commit/7d699aa98155cbf281e3f7f6a8796dcb3b4b0fd6)), closes [#18063](https://github.com/vitejs/vite/issues/18063)
* fix: ensure req.url matches moduleByEtag URL to avoid incorrect 304 (#17997) ([abf04c3](https://github.com/vitejs/vite/commit/abf04c3a84f4d9962a6f9697ca26cd639fa76e87)), closes [#17997](https://github.com/vitejs/vite/issues/17997)
* fix: incorrect environment consumer option resolution (#18079) ([0e3467e](https://github.com/vitejs/vite/commit/0e3467e503aef45119260fe75b399b26f7a80b66)), closes [#18079](https://github.com/vitejs/vite/issues/18079)
* fix: store backwards compatible `ssrModule` and `ssrError` (#18031) ([cf8ced5](https://github.com/vitejs/vite/commit/cf8ced56ea4932e917e2c4ef3d04a87f0ab4f20b)), closes [#18031](https://github.com/vitejs/vite/issues/18031)
* fix(build): declare `preload-helper` has no side effects (#18057) ([587ad7b](https://github.com/vitejs/vite/commit/587ad7b17beba50279eaf46b06c5bf5559c4f36e)), closes [#18057](https://github.com/vitejs/vite/issues/18057)
* fix(css): fallback to mainthread if logger or pkgImporter option is set for sass (#18071) ([d81dc59](https://github.com/vitejs/vite/commit/d81dc59473b1053bf48c45a9d45f87ee6ecf2c02)), closes [#18071](https://github.com/vitejs/vite/issues/18071)
* fix(dynamicImportVars): correct glob pattern for paths with parentheses (#17940) ([2a391a7](https://github.com/vitejs/vite/commit/2a391a7df6e5b4a8d9e8313fba7ddf003df41e12)), closes [#17940](https://github.com/vitejs/vite/issues/17940)
* fix(html): escape html attribute (#18067) ([5983f36](https://github.com/vitejs/vite/commit/5983f366d499f74d473097154bbbcc8e51476dc4)), closes [#18067](https://github.com/vitejs/vite/issues/18067)
* fix(preload): allow ignoring dep errors (#18046) ([3fb2889](https://github.com/vitejs/vite/commit/3fb28896d916e03cef1b5bd6877ac184c7ec8003)), closes [#18046](https://github.com/vitejs/vite/issues/18046)


### Chore

* chore: add 5.4.x changelogs (#18768) ([26b58c8](https://github.com/vitejs/vite/commit/26b58c8130f232dcd4e839a337bbe478352f23ab)), closes [#18768](https://github.com/vitejs/vite/issues/18768)
* chore: add some comments about mimes (#18705) ([f07e9b9](https://github.com/vitejs/vite/commit/f07e9b9d01d790c727edc2497304f07b1ef5d28f)), closes [#18705](https://github.com/vitejs/vite/issues/18705)
* chore(deps): update all non-major dependencies (#18746) ([0ad16e9](https://github.com/vitejs/vite/commit/0ad16e92d57453d9e5392c90fd06bda947be9de6)), closes [#18746](https://github.com/vitejs/vite/issues/18746)
* docs: rename `HotUpdateContext` to `HotUpdateOptions` (#18718) ([824c347](https://github.com/vitejs/vite/commit/824c347fa21aaf5bbf811994385b790db4287ab0)), closes [#18718](https://github.com/vitejs/vite/issues/18718)
* test: simplify `playground/json/__tests__/ssr` (#18701) ([f731ca2](https://github.com/vitejs/vite/commit/f731ca21ea4cfe38418880f15f6064e156a43a5e)), closes [#18701](https://github.com/vitejs/vite/issues/18701)
* chore: tweak build config (#18622) ([2a88f71](https://github.com/vitejs/vite/commit/2a88f71aef87ed23b155af26f8aca6bb7f65e899)), closes [#18622](https://github.com/vitejs/vite/issues/18622)
* chore(deps): update all non-major dependencies (#18634) ([e2231a9](https://github.com/vitejs/vite/commit/e2231a92af46db144b9c94fb57918ac683dc93cb)), closes [#18634](https://github.com/vitejs/vite/issues/18634)
* chore(deps): update transitive deps (#18602) ([0c8b152](https://github.com/vitejs/vite/commit/0c8b15238b669b8ab0a3f90bcf2f690d4450e18f)), closes [#18602](https://github.com/vitejs/vite/issues/18602)
* chore: add warning for `/` mapping in `resolve.alias` (#18588) ([a51c254](https://github.com/vitejs/vite/commit/a51c254265bbfe3d77f834fe81a503ce27c05b32)), closes [#18588](https://github.com/vitejs/vite/issues/18588)
* chore: remove unused `ssr` variable (#18594) ([23c39fc](https://github.com/vitejs/vite/commit/23c39fc994a6164bc68d69e56f39735a6bb7a71d)), closes [#18594](https://github.com/vitejs/vite/issues/18594)
* chore(deps): update all non-major dependencies (#18562) ([fb227ec](https://github.com/vitejs/vite/commit/fb227ec4402246b5a13e274c881d9de6dd8082dd)), closes [#18562](https://github.com/vitejs/vite/issues/18562)
* test: update filename regex (#18593) ([dd25c1a](https://github.com/vitejs/vite/commit/dd25c1ab5d5510b955fa24830bc223cacc855560)), closes [#18593](https://github.com/vitejs/vite/issues/18593)
* chore: fix moduleSideEffects in build script on Windows (#18518) ([25fe9e3](https://github.com/vitejs/vite/commit/25fe9e3b48e29d49e90d6aed5ec3825dceafec18)), closes [#18518](https://github.com/vitejs/vite/issues/18518)
* chore: use premove instead of rimraf (#18499) ([f97a578](https://github.com/vitejs/vite/commit/f97a57893b3a7ddf11ca4c126b6be33cd2d9283b)), closes [#18499](https://github.com/vitejs/vite/issues/18499)
* docs: add jsdocs to flags in BuilderOptions (#18516) ([1507068](https://github.com/vitejs/vite/commit/1507068b6d460cf54336fe7e8d3539fdb4564bfb)), closes [#18516](https://github.com/vitejs/vite/issues/18516)
* docs: missing changes guides (#18491) ([5da78a6](https://github.com/vitejs/vite/commit/5da78a6859f3b5c677d896144b915381e4497432)), closes [#18491](https://github.com/vitejs/vite/issues/18491)
* docs: update fs.deny default in JSDoc (#18514) ([1fcc83d](https://github.com/vitejs/vite/commit/1fcc83dd7ade429f889e4ce19d5c67b3e5b46419)), closes [#18514](https://github.com/vitejs/vite/issues/18514)
* refactor: optimizeDeps back to top level (#18465) ([1ac22de](https://github.com/vitejs/vite/commit/1ac22de41cf5a8647847070eadeac3231c94c3ed)), closes [#18465](https://github.com/vitejs/vite/issues/18465)
* refactor: top-level createEnvironment is client-only (#18475) ([6022fc2](https://github.com/vitejs/vite/commit/6022fc2c87e0f59c3e6ccfa307a352a378d8273a)), closes [#18475](https://github.com/vitejs/vite/issues/18475)
* refactor(css): hide internal preprocessor types and expose types used for options (#18458) ([c32837c](https://github.com/vitejs/vite/commit/c32837cf868f0fdb97a22a0be8c95c433f4069c8)), closes [#18458](https://github.com/vitejs/vite/issues/18458)
* refactor: use `originalFileNames`/`names` (#18240) ([f2957c8](https://github.com/vitejs/vite/commit/f2957c84f69c14c882809889fbd0fc66b97ca3e9)), closes [#18240](https://github.com/vitejs/vite/issues/18240)
* test: fix test conflict (#18446) ([94cd1e6](https://github.com/vitejs/vite/commit/94cd1e6f95e2434d2b52b5c16d50fe0472214634)), closes [#18446](https://github.com/vitejs/vite/issues/18446)
* chore(deps): update dependency picomatch to v4 (#15876) ([3774881](https://github.com/vitejs/vite/commit/377488178a7ef372d9b76526bb01fd60b97f51df)), closes [#15876](https://github.com/vitejs/vite/issues/15876)
* refactor: use builder in `build` (#18432) ([cc61d16](https://github.com/vitejs/vite/commit/cc61d169a4826996f7b2289618c383f8c5c6d470)), closes [#18432](https://github.com/vitejs/vite/issues/18432)
* refactor(resolve): remove `tryEsmOnly` flag (#18394) ([7cebe38](https://github.com/vitejs/vite/commit/7cebe3847f934ff4875ff3ecc6a96a82bac5f8f4)), closes [#18394](https://github.com/vitejs/vite/issues/18394)
* chore: combine deps license with same text (#18356) ([b5d1a05](https://github.com/vitejs/vite/commit/b5d1a058f9dab6a6b1243c2a0b11d2c421dd3291)), closes [#18356](https://github.com/vitejs/vite/issues/18356)
* chore: fix grammar (#18385) ([8030231](https://github.com/vitejs/vite/commit/8030231596edcd688e324ea507dc1ba80564f75c)), closes [#18385](https://github.com/vitejs/vite/issues/18385)
* chore: mark builder api experimental (#18436) ([b57321c](https://github.com/vitejs/vite/commit/b57321cc198ee7b9012f1be632cfd4bea006cd89)), closes [#18436](https://github.com/vitejs/vite/issues/18436)
* chore: tiny typo (#18374) ([7d97a9b](https://github.com/vitejs/vite/commit/7d97a9b2ba11ab566865dcf9ee0350a9e479dfca)), closes [#18374](https://github.com/vitejs/vite/issues/18374)
* chore: update moduleResolution value casing (#18409) ([ff018dc](https://github.com/vitejs/vite/commit/ff018dca959c73481ae5f8328cd77d3b02f02134)), closes [#18409](https://github.com/vitejs/vite/issues/18409)
* chore(create-vite): mark template files as CC0 (#18366) ([f6b9074](https://github.com/vitejs/vite/commit/f6b90747eb2b1ad863e5f147a80c75b15e38a51b)), closes [#18366](https://github.com/vitejs/vite/issues/18366)
* chore(deps): bump TypeScript to 5.6 (#18254) ([57a0e85](https://github.com/vitejs/vite/commit/57a0e85186b88118bf5f79dd53391676fb91afec)), closes [#18254](https://github.com/vitejs/vite/issues/18254)
* chore(deps): update all non-major dependencies (#18404) ([802839d](https://github.com/vitejs/vite/commit/802839d48335a69eb15f71f2cd816d0b6e4d3556)), closes [#18404](https://github.com/vitejs/vite/issues/18404)
* chore(deps): update dependency sirv to v3 (#18346) ([5ea4b00](https://github.com/vitejs/vite/commit/5ea4b00a984bc76d0d000f621ab72763a4c9a48b)), closes [#18346](https://github.com/vitejs/vite/issues/18346)
* test: remove unnecessary logs from output (#18368) ([f50d358](https://github.com/vitejs/vite/commit/f50d3583e2c460bb02c118371a79b5ceac9877f3)), closes [#18368](https://github.com/vitejs/vite/issues/18368)
* test: replace fs mocking in css module compose test (#18413) ([ddee0ad](https://github.com/vitejs/vite/commit/ddee0ad38fd53993155fc11174d5ee194d6648d8)), closes [#18413](https://github.com/vitejs/vite/issues/18413)
* test: ssr external / resolveId test (#18327) ([4c5cf91](https://github.com/vitejs/vite/commit/4c5cf91d124d423fe028beecda952125698c1d5d)), closes [#18327](https://github.com/vitejs/vite/issues/18327)
* test: test optimized dep as ssr entry (#18301) ([466f94a](https://github.com/vitejs/vite/commit/466f94aa6465f0a3b932f55e93660f7cf6cd936e)), closes [#18301](https://github.com/vitejs/vite/issues/18301)
* chore: point deprecation error URLs to main branch docs (#18321) ([11c0fb1](https://github.com/vitejs/vite/commit/11c0fb1388744624dac40cc267ad21dc7f85cb4e)), closes [#18321](https://github.com/vitejs/vite/issues/18321)
* chore: update all url references of vitejs.dev to vite.dev (#18276) ([7052c8f](https://github.com/vitejs/vite/commit/7052c8f6fc253f0a88ff04a4c18c108f3bfdaa78)), closes [#18276](https://github.com/vitejs/vite/issues/18276)
* chore: update built LICENSE ([69b6764](https://github.com/vitejs/vite/commit/69b6764d49dd0d04819a8aa9b4061974e0e00f62))
* chore: update license copyright (#18278) ([56eb869](https://github.com/vitejs/vite/commit/56eb869a67551a257d20cba00016ea59b1e1a2c4)), closes [#18278](https://github.com/vitejs/vite/issues/18278)
* chore(deps): update dependency @rollup/plugin-commonjs to v28 (#18231) ([78e749e](https://github.com/vitejs/vite/commit/78e749ea9a42e7f82dbca37c26e8ab2a5e6e0c16)), closes [#18231](https://github.com/vitejs/vite/issues/18231)
* refactor: rename runner.destroy() to runner.close() (#18304) ([cd368f9](https://github.com/vitejs/vite/commit/cd368f9fed393a8649597f0e5d873504a9ac62e2)), closes [#18304](https://github.com/vitejs/vite/issues/18304)
* docs: update homepage (#18274) ([a99a0aa](https://github.com/vitejs/vite/commit/a99a0aab7c600301a5c314b6071afa46915ce248)), closes [#18274](https://github.com/vitejs/vite/issues/18274)
* test: fix server-worker-runner flaky test (#18247) ([8f82730](https://github.com/vitejs/vite/commit/8f82730b86abed953800ade6e726f70ee55ab7fe)), closes [#18247](https://github.com/vitejs/vite/issues/18247)
* refactor: break circular dependencies to fix test-unit (#18237) ([a577828](https://github.com/vitejs/vite/commit/a577828d826805c5693d773eea4c4179e21f1a16)), closes [#18237](https://github.com/vitejs/vite/issues/18237)
* refactor: remove `_onCrawlEnd` (#18207) ([bea0272](https://github.com/vitejs/vite/commit/bea0272decd908cd04ac0a2c87dd0a676f218a1a)), closes [#18207](https://github.com/vitejs/vite/issues/18207)
* refactor: remove the need for "processSourceMap" (#18187) ([08ff233](https://github.com/vitejs/vite/commit/08ff23319964903b9f380859c216b10e577ddb6f)), closes [#18187](https://github.com/vitejs/vite/issues/18187)
* refactor: replace `parse` with `splitFileAndPostfix` (#18185) ([6f030ec](https://github.com/vitejs/vite/commit/6f030ec15f25a2a1d7d912f1b84d83ebb28a3515)), closes [#18185](https://github.com/vitejs/vite/issues/18185)
* refactor: use `resolvePackageData` to get rollup version (#18208) ([220d6ec](https://github.com/vitejs/vite/commit/220d6ec2bf3fc7063eac7c625d4ccda9a4204cb7)), closes [#18208](https://github.com/vitejs/vite/issues/18208)
* chore: escape template tag in CHANGELOG.md (#18126) ([caaa683](https://github.com/vitejs/vite/commit/caaa6836e9a104cc9d63b68ad850149687ad104c)), closes [#18126](https://github.com/vitejs/vite/issues/18126)
* chore(deps): update all non-major dependencies (#18108) ([a73bbaa](https://github.com/vitejs/vite/commit/a73bbaadb512a884924cc884060e50ea6d809d74)), closes [#18108](https://github.com/vitejs/vite/issues/18108)
* chore(deps): update all non-major dependencies (#18230) ([c0edd26](https://github.com/vitejs/vite/commit/c0edd26bbfeb9a8d80ebaa420e54fbb7f165bd9b)), closes [#18230](https://github.com/vitejs/vite/issues/18230)
* chore(deps): update esbuild (#18173) ([e59e2ca](https://github.com/vitejs/vite/commit/e59e2cacab476305c3cdfb31732c27b174fb8fe2)), closes [#18173](https://github.com/vitejs/vite/issues/18173)
* chore(optimizer): fix typo in comment (#18239) ([b916ab6](https://github.com/vitejs/vite/commit/b916ab601d2ec1c842ea0c6139bf216166010e56)), closes [#18239](https://github.com/vitejs/vite/issues/18239)
* docs: fix typo in proxy.ts (#18162) ([49087bd](https://github.com/vitejs/vite/commit/49087bd5738a2cf69ee46b10a74cfd61c18e9959)), closes [#18162](https://github.com/vitejs/vite/issues/18162)
* chore: enable some eslint rules (#18084) ([e9a2746](https://github.com/vitejs/vite/commit/e9a2746ca77473b1814fd05db3d299c074135fe5)), closes [#18084](https://github.com/vitejs/vite/issues/18084)
* chore: remove npm-run-all2 (#18083) ([41180d0](https://github.com/vitejs/vite/commit/41180d02730a7ce7c9b6ec7ac71fc6e750dd22c6)), closes [#18083](https://github.com/vitejs/vite/issues/18083)
* chore: silence unnecessary logs during test (#18052) ([a3ef052](https://github.com/vitejs/vite/commit/a3ef052d408edbec71081fd2f7b3e4b1d4ea0174)), closes [#18052](https://github.com/vitejs/vite/issues/18052)
* chore(deps): update all non-major dependencies (#18050) ([7cac03f](https://github.com/vitejs/vite/commit/7cac03fa5197a72d2e2422bd0243a85a9a18abfc)), closes [#18050](https://github.com/vitejs/vite/issues/18050)
* refactor: remove custom resolveOptions from pre-alias plugin (#18041) ([6f60adc](https://github.com/vitejs/vite/commit/6f60adc15283c6b25218d2392738671b6ab4b392)), closes [#18041](https://github.com/vitejs/vite/issues/18041)
* refactor: remove unnecessary escape (#18044) ([8062d36](https://github.com/vitejs/vite/commit/8062d36773cafaec98196965d33d79887e58f437)), closes [#18044](https://github.com/vitejs/vite/issues/18044)
* refactor(create-vite): use picocolors (#18085) ([ba37df0](https://github.com/vitejs/vite/commit/ba37df0813ad3864fc4b8c6c0b289a1f2bc00c36)), closes [#18085](https://github.com/vitejs/vite/issues/18085)
* test: move glob test root to reduce snapshot change (#18053) ([04d7e77](https://github.com/vitejs/vite/commit/04d7e7749496f5d1972338c7de1502c7f6f65cb6)), closes [#18053](https://github.com/vitejs/vite/issues/18053)



### Beta Changelogs


#### [6.0.0-beta.10](https://github.com/vitejs/vite/compare/v6.0.0-beta.9...v6.0.0-beta.10) (2024-11-14)

See [6.0.0-beta.10 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.10/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.9](https://github.com/vitejs/vite/compare/v6.0.0-beta.8...v6.0.0-beta.9) (2024-11-07)

See [6.0.0-beta.9 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.9/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.8](https://github.com/vitejs/vite/compare/v6.0.0-beta.7...v6.0.0-beta.8) (2024-11-01)

See [6.0.0-beta.8 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.8/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.7](https://github.com/vitejs/vite/compare/v6.0.0-beta.6...v6.0.0-beta.7) (2024-10-30)

See [6.0.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.7/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.6](https://github.com/vitejs/vite/compare/v6.0.0-beta.5...v6.0.0-beta.6) (2024-10-28)

See [6.0.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.6/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.5](https://github.com/vitejs/vite/compare/v6.0.0-beta.4...v6.0.0-beta.5) (2024-10-24)

See [6.0.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.5/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.4](https://github.com/vitejs/vite/compare/v6.0.0-beta.3...v6.0.0-beta.4) (2024-10-23)

See [6.0.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.4/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.3](https://github.com/vitejs/vite/compare/v6.0.0-beta.2...v6.0.0-beta.3) (2024-10-15)

See [6.0.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.3/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.2](https://github.com/vitejs/vite/compare/v6.0.0-beta.1...v6.0.0-beta.2) (2024-10-01)

See [6.0.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.2/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.1](https://github.com/vitejs/vite/compare/v6.0.0-beta.0...v6.0.0-beta.1) (2024-09-16)

See [6.0.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.1/packages/vite/CHANGELOG.md)


#### [6.0.0-beta.0](https://github.com/vitejs/vite/compare/v5.4.11...v6.0.0-beta.0) (2024-09-12)

See [6.0.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v6.0.0-beta.0/packages/vite/CHANGELOG.md)



## Previous Changelogs

### 5.4.x (2024-08-07 - 2024-11-11)
See [5.4.11 changelog](https://github.com/vitejs/vite/blob/v5.4.11/packages/vite/CHANGELOG.md)

### 5.3.x (2024-06-13 - 2024-07-25)
See [5.3.5 changelog](https://github.com/vitejs/vite/blob/v5.3.5/packages/vite/CHANGELOG.md)

### 5.2.x (2024-03-20 - 2024-05-28)
See [5.2.12 changelog](https://github.com/vitejs/vite/blob/v5.2.12/packages/vite/CHANGELOG.md)

### 5.1.x (2024-02-08 - 2024-03-11)
See [5.1.6 changelog](https://github.com/vitejs/vite/blob/v5.1.6/packages/vite/CHANGELOG.md)

### 5.0.x (2023-11-16 - 2024-01-05)
See [5.0.11 changelog](https://github.com/vitejs/vite/blob/v5.0.11/packages/vite/CHANGELOG.md)

### 4.5.x (2023-10-18)
See [4.5.0 changelog](https://github.com/vitejs/vite/blob/v4.5.0/packages/vite/CHANGELOG.md)

### 4.4.x (2023-07-06 - 2023-10-05)
See [4.4.11 changelog](https://github.com/vitejs/vite/blob/v4.4.11/packages/vite/CHANGELOG.md)

### 4.3.x (2023-04-20 - 2023-05-26)
See [4.3.0 changelog](https://github.com/vitejs/vite/blob/v4.3.9/packages/vite/CHANGELOG.md)

### 4.2.x (2023-03-16 - 2023-04-18)
See [4.2.2 changelog](https://github.com/vitejs/vite/blob/v4.2.2/packages/vite/CHANGELOG.md)

### 4.1.x (2023-02-02 - 2023-02-21)
See [4.1.4 changelog](https://github.com/vitejs/vite/blob/v4.1.4/packages/vite/CHANGELOG.md)

### 4.0.x (2022-12-09 - 2023-01-03)
See [4.0.4 changelog](https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/CHANGELOG.md)

### 3.2.x (2022-10-26 - 2023-04-18)
See [3.2.6 changelog](https://github.com/vitejs/vite/blob/v3.2.6/packages/vite/CHANGELOG.md)

### 3.1.x (2022-09-05 - 2022-09-19)
See [3.1.3 changelog](https://github.com/vitejs/vite/blob/v3.1.3/packages/vite/CHANGELOG.md)

### 3.0.x (2022-07-13 - 2022-08-19)
See [3.0.9 changelog](https://github.com/vitejs/vite/blob/v3.0.9/packages/vite/CHANGELOG.md)

### 2.9.x (2022-03-30 - 2022-08-12)
See [2.9.15 changelog](https://github.com/vitejs/vite/blob/v2.9.15/packages/vite/CHANGELOG.md)

### 2.8.x (2022-02-09 - 2022-03-01)
See [2.8.6 changelog](https://github.com/vitejs/vite/blob/v2.8.6/packages/vite/CHANGELOG.md)

### 2.7.x (2021-10-28 - 2021-12-28)
See [2.7.13 changelog](https://github.com/vitejs/vite/blob/v2.7.13/packages/vite/CHANGELOG.md)

### 2.6.x (2021-09-20 - 2021-10-27)
See [2.6.14 changelog](https://github.com/vitejs/vite/blob/v2.6.14/packages/vite/CHANGELOG.md)

### 2.5.x (2021-08-03 - 2021-09-13)
See [2.5.10 changelog](https://github.com/vitejs/vite/blob/v2.5.10/packages/vite/CHANGELOG.md)

### 2.4.x (2021-06-27 - 2021-07-27)
See [2.4.4 changelog](https://github.com/vitejs/vite/blob/v2.4.4/packages/vite/CHANGELOG.md)

### 2.3.x (2021-05-11 - 2021-06-19)
See [2.3.8 changelog](https://github.com/vitejs/vite/blob/v2.3.8/packages/vite/CHANGELOG.md)

### 2.2.x (2021-04-19 - 2021-05-03)
See [2.2.4 changelog](https://github.com/vitejs/vite/blob/v2.2.4/packages/vite/CHANGELOG.md)

### 2.1.x (2021-03-15 - 2021-03-31)
See [2.1.5 changelog](https://github.com/vitejs/vite/blob/v2.1.5/packages/vite/CHANGELOG.md)

### 2.0.x (2021-02-16 - 2021-03-02)
See [2.0.5 changelog](https://github.com/vitejs/vite/blob/v2.0.5/packages/vite/CHANGELOG.md)
