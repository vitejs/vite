## 6.0.0 (2024-11-26)

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
* chore: add 5.4.x changelogs (#18768) ([26b58c8](https://github.com/vitejs/vite/commit/26b58c8130f232dcd4e839a337bbe478352f23ab)), closes [#18768](https://github.com/vitejs/vite/issues/18768)
* chore: add some comments about mimes (#18705) ([f07e9b9](https://github.com/vitejs/vite/commit/f07e9b9d01d790c727edc2497304f07b1ef5d28f)), closes [#18705](https://github.com/vitejs/vite/issues/18705)
* chore(deps): update all non-major dependencies (#18746) ([0ad16e9](https://github.com/vitejs/vite/commit/0ad16e92d57453d9e5392c90fd06bda947be9de6)), closes [#18746](https://github.com/vitejs/vite/issues/18746)
* perf: reduce bundle size for `Object.keys(import.meta.glob(...))` / `Object.values(import.meta.glob( ([ed99a2c](https://github.com/vitejs/vite/commit/ed99a2cd31e8d3c2b791885bcc4b188570539e45)), closes [#18666](https://github.com/vitejs/vite/issues/18666)
* perf(worker): inline worker without base64 (#18752) ([90c66c9](https://github.com/vitejs/vite/commit/90c66c95aba3d2edd86637a77adc699f3fd6c1ff)), closes [#18752](https://github.com/vitejs/vite/issues/18752)
* feat: add support for .cur type (#18680) ([5ec9eed](https://github.com/vitejs/vite/commit/5ec9eedc80bbf39a33b498198ba07ed1bd9cacc7)), closes [#18680](https://github.com/vitejs/vite/issues/18680)
* feat: enable HMR by default on ModuleRunner side (#18749) ([4d2abc7](https://github.com/vitejs/vite/commit/4d2abc7bba95cf516ce7341d5d8f349d61b75224)), closes [#18749](https://github.com/vitejs/vite/issues/18749)
* feat: support `module-sync` condition when loading config if enabled (#18650) ([cf5028d](https://github.com/vitejs/vite/commit/cf5028d4bf0a0d59b4a98323beaadc268204056b)), closes [#18650](https://github.com/vitejs/vite/issues/18650)
* feat!: drop node 21 support in version ranges (#18729) ([a384d8f](https://github.com/vitejs/vite/commit/a384d8fd39162190675abcfea31ba657383a3d03)), closes [#18729](https://github.com/vitejs/vite/issues/18729)
* fix(deps)!: update dependency dotenv-expand to v12 (#18697) ([0c658de](https://github.com/vitejs/vite/commit/0c658de41f4c1576c526a8c48a8ea0a019c6311c)), closes [#18697](https://github.com/vitejs/vite/issues/18697)
* docs: rename `HotUpdateContext` to `HotUpdateOptions` (#18718) ([824c347](https://github.com/vitejs/vite/commit/824c347fa21aaf5bbf811994385b790db4287ab0)), closes [#18718](https://github.com/vitejs/vite/issues/18718)
* test: simplify `playground/json/__tests__/ssr` (#18701) ([f731ca2](https://github.com/vitejs/vite/commit/f731ca21ea4cfe38418880f15f6064e156a43a5e)), closes [#18701](https://github.com/vitejs/vite/issues/18701)
* refactor: first character judgment replacement regexp (#18658) ([58f1df3](https://github.com/vitejs/vite/commit/58f1df3288b0f9584bb413dd34b8d65671258f6f)), closes [#18658](https://github.com/vitejs/vite/issues/18658)



## 6.0.0-beta.10 (2024-11-14)

* feat: add `isSsrTargetWebWorker` flag to `configEnvironment` hook (#18620) ([3f5fab0](https://github.com/vitejs/vite/commit/3f5fab04aa64c0e9b45068e842f033583b365de0)), closes [#18620](https://github.com/vitejs/vite/issues/18620)
* feat: add `ssr.resolve.mainFields` option (#18646) ([a6f5f5b](https://github.com/vitejs/vite/commit/a6f5f5baca7a5d2064f5f4cb689764ad939fab4b)), closes [#18646](https://github.com/vitejs/vite/issues/18646)
* feat: expose default mainFields/conditions (#18648) ([c12c653](https://github.com/vitejs/vite/commit/c12c653ca5fab354e0f71394e2fbe636dccf6b2f)), closes [#18648](https://github.com/vitejs/vite/issues/18648)
* feat: extended applyToEnvironment and perEnvironmentPlugin (#18544) ([8fa70cd](https://github.com/vitejs/vite/commit/8fa70cdfa65ce8254ab8da8be0d92614126764c0)), closes [#18544](https://github.com/vitejs/vite/issues/18544)
* feat: show error when accessing variables not exposed in CJS build (#18649) ([87c5502](https://github.com/vitejs/vite/commit/87c55022490d4710934c482abf5fbd4fcda9c3c9)), closes [#18649](https://github.com/vitejs/vite/issues/18649)
* feat(optimizer): allow users to specify their esbuild `platform` option (#18611) ([0924879](https://github.com/vitejs/vite/commit/09248795ca79a7053b803af8977c3422f5cd5824)), closes [#18611](https://github.com/vitejs/vite/issues/18611)
* revert: use chokidar v3 (#18659) ([49783da](https://github.com/vitejs/vite/commit/49783da298bc45f3f3c5ad4ce2fb1260ee8856bb)), closes [#18659](https://github.com/vitejs/vite/issues/18659)
* fix: cjs build for perEnvironmentState et al (#18656) ([95c4b3c](https://github.com/vitejs/vite/commit/95c4b3c371dc7fb12c28cb1307f6f389887eb1e1)), closes [#18656](https://github.com/vitejs/vite/issues/18656)
* fix: include more modules to prefix-only module list (#18667) ([5a2103f](https://github.com/vitejs/vite/commit/5a2103f0d486a7725c23c70710b11559c00e9b93)), closes [#18667](https://github.com/vitejs/vite/issues/18667)
* fix(html): externalize `rollup.external` scripts correctly (#18618) ([55461b4](https://github.com/vitejs/vite/commit/55461b43329db6a5e737eab591163a8681ba9230)), closes [#18618](https://github.com/vitejs/vite/issues/18618)
* fix(ssr): format `ssrTransform` parse error  (#18644) ([d9be921](https://github.com/vitejs/vite/commit/d9be92187cb17d740856af27d0ab60c84e04d58c)), closes [#18644](https://github.com/vitejs/vite/issues/18644)
* fix(ssr): preserve fetchModule error details (#18626) ([866a433](https://github.com/vitejs/vite/commit/866a433a34ab2f6d2910506e781b346091de1b9e)), closes [#18626](https://github.com/vitejs/vite/issues/18626)
* refactor: introduce `mergeWithDefaults` and organize how default values for config options are set ( ([0e1f437](https://github.com/vitejs/vite/commit/0e1f437d53683b57f0157ce3ff0b0f02acabb408)), closes [#18550](https://github.com/vitejs/vite/issues/18550)
* refactor(resolve): remove `allowLinkedExternal` parameter from `tryNodeResolve` (#18670) ([b74d363](https://github.com/vitejs/vite/commit/b74d3632693b6a829b4d1cdc2a9d4ba8234c093b)), closes [#18670](https://github.com/vitejs/vite/issues/18670)
* build: ignore cjs warning (#18660) ([33b0d5a](https://github.com/vitejs/vite/commit/33b0d5a6ca18e9f7c27b0159decd84fee3859e09)), closes [#18660](https://github.com/vitejs/vite/issues/18660)
* perf: remove strip-ansi for a node built-in (#18630) ([5182272](https://github.com/vitejs/vite/commit/5182272d52fc092a6219c8efe73ecb3f8e65a0b5)), closes [#18630](https://github.com/vitejs/vite/issues/18630)
* chore: tweak build config (#18622) ([2a88f71](https://github.com/vitejs/vite/commit/2a88f71aef87ed23b155af26f8aca6bb7f65e899)), closes [#18622](https://github.com/vitejs/vite/issues/18622)
* chore(deps): update all non-major dependencies (#18634) ([e2231a9](https://github.com/vitejs/vite/commit/e2231a92af46db144b9c94fb57918ac683dc93cb)), closes [#18634](https://github.com/vitejs/vite/issues/18634)
* chore(deps): update transitive deps (#18602) ([0c8b152](https://github.com/vitejs/vite/commit/0c8b15238b669b8ab0a3f90bcf2f690d4450e18f)), closes [#18602](https://github.com/vitejs/vite/issues/18602)



## 6.0.0-beta.9 (2024-11-07)

* feat: use a single transport for fetchModule and HMR support (#18362) ([78dc490](https://github.com/vitejs/vite/commit/78dc4902ffef7f316e84d21648b04dc62dd0ae0a)), closes [#18362](https://github.com/vitejs/vite/issues/18362)
* feat(asset): add `?inline` and `?no-inline` queries to control inlining (#15454) ([9162172](https://github.com/vitejs/vite/commit/9162172e039ae67ad4ee8dce18f04b7444f7d9de)), closes [#15454](https://github.com/vitejs/vite/issues/15454)
* feat(asset): inline svg in dev if within limit (#18581) ([f08b146](https://github.com/vitejs/vite/commit/f08b1463db50f39b571faa871d05c92b10f3434c)), closes [#18581](https://github.com/vitejs/vite/issues/18581)
* chore: add warning for `/` mapping in `resolve.alias` (#18588) ([a51c254](https://github.com/vitejs/vite/commit/a51c254265bbfe3d77f834fe81a503ce27c05b32)), closes [#18588](https://github.com/vitejs/vite/issues/18588)
* chore: remove unused `ssr` variable (#18594) ([23c39fc](https://github.com/vitejs/vite/commit/23c39fc994a6164bc68d69e56f39735a6bb7a71d)), closes [#18594](https://github.com/vitejs/vite/issues/18594)
* chore(deps): update all non-major dependencies (#18562) ([fb227ec](https://github.com/vitejs/vite/commit/fb227ec4402246b5a13e274c881d9de6dd8082dd)), closes [#18562](https://github.com/vitejs/vite/issues/18562)
* fix: browser field should not be included by default for `consumer: 'server'` (#18575) ([87b2347](https://github.com/vitejs/vite/commit/87b2347a13ea8ae8282f0f1e2233212c040bfed8)), closes [#18575](https://github.com/vitejs/vite/issues/18575)
* fix: use `server.perEnvironmentStartEndDuringDev` (#18549) ([fe30349](https://github.com/vitejs/vite/commit/fe30349d350ef08bccd56404ccc3e6d6e0a2e156)), closes [#18549](https://github.com/vitejs/vite/issues/18549)
* fix(client): detect ws close correctly (#18548) ([637d31b](https://github.com/vitejs/vite/commit/637d31bcc59d964e51f7969093cc369deee88ca1)), closes [#18548](https://github.com/vitejs/vite/issues/18548)
* fix(resolve): run ensureVersionQuery for SSR (#18591) ([63207e5](https://github.com/vitejs/vite/commit/63207e5d0fbedc8ddddb7d1faaa8ea9a45a118d4)), closes [#18591](https://github.com/vitejs/vite/issues/18591)
* refactor(resolve): remove `environmentsOptions` parameter (#18590) ([3ef0bf1](https://github.com/vitejs/vite/commit/3ef0bf19a3457c46395bdcb2201bbf32807d7231)), closes [#18590](https://github.com/vitejs/vite/issues/18590)
* test: update filename regex (#18593) ([dd25c1a](https://github.com/vitejs/vite/commit/dd25c1ab5d5510b955fa24830bc223cacc855560)), closes [#18593](https://github.com/vitejs/vite/issues/18593)



## 6.0.0-beta.8 (2024-11-01)

* fix: allow nested dependency selector to be used for `optimizeDeps.include` for SSR (#18506) ([826c81a](https://github.com/vitejs/vite/commit/826c81a40bb25914d55cd2e96b548f1a2c384a19)), closes [#18506](https://github.com/vitejs/vite/issues/18506)
* fix: asset `new URL(,import.meta.url)` match (#18194) ([5286a90](https://github.com/vitejs/vite/commit/5286a90a3c1b693384f99903582a1f70b7b44945)), closes [#18194](https://github.com/vitejs/vite/issues/18194)
* fix: close watcher if it's disabled (#18521) ([85bd0e9](https://github.com/vitejs/vite/commit/85bd0e9b0dc637c7645f2b56f93071d6e1ec149c)), closes [#18521](https://github.com/vitejs/vite/issues/18521)
* fix(config): write temporary vite config to node_modules (#18509) ([72eaef5](https://github.com/vitejs/vite/commit/72eaef5300d20b7163050461733c3208a4013e1e)), closes [#18509](https://github.com/vitejs/vite/issues/18509)
* fix(css): `cssCodeSplit` uses the current environment configuration (#18486) ([eefe895](https://github.com/vitejs/vite/commit/eefe8957167681b85f0e1b07bc5feefa307cccb0)), closes [#18486](https://github.com/vitejs/vite/issues/18486)
* fix(json): don't `json.stringify` arrays (#18541) ([fa50b03](https://github.com/vitejs/vite/commit/fa50b03390dae280293174f65f850522599b9ab7)), closes [#18541](https://github.com/vitejs/vite/issues/18541)
* fix(less): prevent rebasing `@import url(...)` (#17857) ([aec5fdd](https://github.com/vitejs/vite/commit/aec5fdd72e3aeb2aa26796001b98f3f330be86d1)), closes [#17857](https://github.com/vitejs/vite/issues/17857)
* fix(lib): only resolve css bundle name if have styles (#18530) ([5d6dc49](https://github.com/vitejs/vite/commit/5d6dc491b6bb78613694eaf686e2e305b71af5e1)), closes [#18530](https://github.com/vitejs/vite/issues/18530)
* fix(scss): improve error logs (#18522) ([3194a6a](https://github.com/vitejs/vite/commit/3194a6a60714a3978f5e4b39d6223f32a8dc01ef)), closes [#18522](https://github.com/vitejs/vite/issues/18522)
* feat(html)!: support more asset sources (#11138) ([8a7af50](https://github.com/vitejs/vite/commit/8a7af50b5ddf72f21098406e9668bc609b323899)), closes [#11138](https://github.com/vitejs/vite/issues/11138)
* feat(resolve)!: allow removing conditions (#18395) ([d002e7d](https://github.com/vitejs/vite/commit/d002e7d05a0f23110f9185b39222819bcdfffc16)), closes [#18395](https://github.com/vitejs/vite/issues/18395)
* refactor!: remove fs.cachedChecks option (#18493) ([94b0857](https://github.com/vitejs/vite/commit/94b085735372588d5f92c7f4a8cf68e8291f2db0)), closes [#18493](https://github.com/vitejs/vite/issues/18493)
* refactor: client-only top-level warmup (#18524) ([a50ff60](https://github.com/vitejs/vite/commit/a50ff6000bca46a6fe429f2c3a98c486ea5ebc8e)), closes [#18524](https://github.com/vitejs/vite/issues/18524)



## 6.0.0-beta.7 (2024-10-30)

* chore: fix moduleSideEffects in build script on Windows (#18518) ([25fe9e3](https://github.com/vitejs/vite/commit/25fe9e3b48e29d49e90d6aed5ec3825dceafec18)), closes [#18518](https://github.com/vitejs/vite/issues/18518)
* chore: use premove instead of rimraf (#18499) ([f97a578](https://github.com/vitejs/vite/commit/f97a57893b3a7ddf11ca4c126b6be33cd2d9283b)), closes [#18499](https://github.com/vitejs/vite/issues/18499)
* feat!: proxy bypass with WebSocket (#18070) ([3c9836d](https://github.com/vitejs/vite/commit/3c9836d96f118ff5748916241bc3871a54247ad1)), closes [#18070](https://github.com/vitejs/vite/issues/18070)
* feat!: support `file://` resolution (#18422) ([6a7e313](https://github.com/vitejs/vite/commit/6a7e313754dce5faa5cd7c1e2343448cd7f3a2a2)), closes [#18422](https://github.com/vitejs/vite/issues/18422)
* feat!: update to chokidar v4 (#18453) ([192d555](https://github.com/vitejs/vite/commit/192d555f88bba7576e8a40cc027e8a11e006079c)), closes [#18453](https://github.com/vitejs/vite/issues/18453)
* feat(lib)!: use package name for css output file name (#18488) ([61cbf6f](https://github.com/vitejs/vite/commit/61cbf6f2cfcd5afc91fe0a0ad56abfc36a32f1ab)), closes [#18488](https://github.com/vitejs/vite/issues/18488)
* fix(css)!: remove default import in ssr dev (#17922) ([eccf663](https://github.com/vitejs/vite/commit/eccf663e35a17458425860895bb30b3b0613ea96)), closes [#17922](https://github.com/vitejs/vite/issues/17922)
* fix: `define` in environment config was not working (#18515) ([052799e](https://github.com/vitejs/vite/commit/052799e8939cfcdd7a7ff48daf45a766bf6cc546)), closes [#18515](https://github.com/vitejs/vite/issues/18515)
* fix: consider URLs with any protocol to be external (#17369) ([a0336bd](https://github.com/vitejs/vite/commit/a0336bd5197bb4427251be4c975e30fb596c658f)), closes [#17369](https://github.com/vitejs/vite/issues/17369)
* fix: use picomatch to align with tinyglobby (#18503) ([437795d](https://github.com/vitejs/vite/commit/437795db8307ce4491d066bcaaa5bd9432193773)), closes [#18503](https://github.com/vitejs/vite/issues/18503)
* fix(build): apply resolve.external/noExternal to server environments (#18495) ([5a967cb](https://github.com/vitejs/vite/commit/5a967cb596c7c4b0548be1d9025bc1e34b36169a)), closes [#18495](https://github.com/vitejs/vite/issues/18495)
* fix(config): remove error if require resolve to esm (#18437) ([f886f75](https://github.com/vitejs/vite/commit/f886f75396cdb5a43ec5377bbbaaffc0e8ae03e9)), closes [#18437](https://github.com/vitejs/vite/issues/18437)
* feat: log complete config in debug mode (#18289) ([04f6736](https://github.com/vitejs/vite/commit/04f6736fd7ac3da22141929c01a151f5a6fe4e45)), closes [#18289](https://github.com/vitejs/vite/issues/18289)
* feat(html): support `vite-ignore` attribute to opt-out of processing (#18494) ([d951310](https://github.com/vitejs/vite/commit/d9513104e21175e1d23e0f614df55cd53291ab4e)), closes [#18494](https://github.com/vitejs/vite/issues/18494)
* refactor: separate tsconfck caches per config in a weakmap (#17317) ([b9b01d5](https://github.com/vitejs/vite/commit/b9b01d57fdaf5d291c78a8156e17b534c8c51eb4)), closes [#17317](https://github.com/vitejs/vite/issues/17317)
* docs: add jsdocs to flags in BuilderOptions (#18516) ([1507068](https://github.com/vitejs/vite/commit/1507068b6d460cf54336fe7e8d3539fdb4564bfb)), closes [#18516](https://github.com/vitejs/vite/issues/18516)
* docs: missing changes guides (#18491) ([5da78a6](https://github.com/vitejs/vite/commit/5da78a6859f3b5c677d896144b915381e4497432)), closes [#18491](https://github.com/vitejs/vite/issues/18491)
* docs: update fs.deny default in JSDoc (#18514) ([1fcc83d](https://github.com/vitejs/vite/commit/1fcc83dd7ade429f889e4ce19d5c67b3e5b46419)), closes [#18514](https://github.com/vitejs/vite/issues/18514)
* build: reduce package size (#18517) ([b83f60b](https://github.com/vitejs/vite/commit/b83f60b159f3b6f4a61db180fa03cc5b20bd110f)), closes [#18517](https://github.com/vitejs/vite/issues/18517)



## 6.0.0-beta.6 (2024-10-28)

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
* refactor: optimizeDeps back to top level (#18465) ([1ac22de](https://github.com/vitejs/vite/commit/1ac22de41cf5a8647847070eadeac3231c94c3ed)), closes [#18465](https://github.com/vitejs/vite/issues/18465)
* refactor: top-level createEnvironment is client-only (#18475) ([6022fc2](https://github.com/vitejs/vite/commit/6022fc2c87e0f59c3e6ccfa307a352a378d8273a)), closes [#18475](https://github.com/vitejs/vite/issues/18475)
* refactor(css): hide internal preprocessor types and expose types used for options (#18458) ([c32837c](https://github.com/vitejs/vite/commit/c32837cf868f0fdb97a22a0be8c95c433f4069c8)), closes [#18458](https://github.com/vitejs/vite/issues/18458)
* feat: allow custom `console` in `createLogger` (#18379) ([0c497d9](https://github.com/vitejs/vite/commit/0c497d9cb63bd4a6bb8e01c0e3b843890a239d23)), closes [#18379](https://github.com/vitejs/vite/issues/18379)
* feat: read `sec-fetch-dest` header to detect JS in transform (#9981) ([e51dc40](https://github.com/vitejs/vite/commit/e51dc40b5907cf14d7aefaaf01fb8865a852ef15)), closes [#9981](https://github.com/vitejs/vite/issues/9981)
* feat(css): add more stricter typing of lightningcss (#18460) ([b9b925e](https://github.com/vitejs/vite/commit/b9b925eb3f911ab63972124dc8ab0455449b925d)), closes [#18460](https://github.com/vitejs/vite/issues/18460)
* chore(deps)!: update postcss-load-config to v6 (#15235) ([3a27f62](https://github.com/vitejs/vite/commit/3a27f627df278f6c9778a55f44cb347665b65204)), closes [#15235](https://github.com/vitejs/vite/issues/15235)
* feat(css)!: change default sass api to modern/modern-compiler (#17937) ([d4e0442](https://github.com/vitejs/vite/commit/d4e0442f9d6adc70b72ea0713dc8abb4b1f75ae4)), closes [#17937](https://github.com/vitejs/vite/issues/17937)
* perf(css): skip style.css extraction if code-split css (#18470) ([34fdb6b](https://github.com/vitejs/vite/commit/34fdb6bef558724330d2411b9666facef669b3a0)), closes [#18470](https://github.com/vitejs/vite/issues/18470)



## 6.0.0-beta.5 (2024-10-24)

* fix: add typing to `CSSOptions.preprocessorOptions` (#18001) ([7eeb6f2](https://github.com/vitejs/vite/commit/7eeb6f2f97abf5dfc71c225b9cff9779baf2ed2f)), closes [#18001](https://github.com/vitejs/vite/issues/18001)
* fix(dev): prevent double URL encoding in server.open on macOS (#18443) ([56b7176](https://github.com/vitejs/vite/commit/56b71768f3ee498962fba898804086299382bb59)), closes [#18443](https://github.com/vitejs/vite/issues/18443)
* fix(preview): set resolvedUrls null after close (#18445) ([65014a3](https://github.com/vitejs/vite/commit/65014a32ef618619c5a34b729d67340d9253bdd5)), closes [#18445](https://github.com/vitejs/vite/issues/18445)
* fix(ssr): inject identity function at the top (#18449) ([0ab20a3](https://github.com/vitejs/vite/commit/0ab20a3ee26eacf302415b3087732497d0a2f358)), closes [#18449](https://github.com/vitejs/vite/issues/18449)
* fix(ssr): preserve source maps for hoisted imports (fix #16355) (#16356) ([8e382a6](https://github.com/vitejs/vite/commit/8e382a6a1fed2cd41051b81f9cd9c94b484352a5)), closes [#16355](https://github.com/vitejs/vite/issues/16355) [#16356](https://github.com/vitejs/vite/issues/16356)
* feat(css)!: load postcss config within workspace root only (#18440) ([d23a493](https://github.com/vitejs/vite/commit/d23a493cc4b54a2e2b2c1337b3b1f0c9b1be311e)), closes [#18440](https://github.com/vitejs/vite/issues/18440)
* feat(json)!: add `json.stringify: 'auto'` and make that the default (#18303) ([b80daa7](https://github.com/vitejs/vite/commit/b80daa7c0970645dca569d572892648f66c6799c)), closes [#18303](https://github.com/vitejs/vite/issues/18303)
* fix!: default `build.cssMinify` to `'esbuild'` for SSR (#15637) ([f1d3bf7](https://github.com/vitejs/vite/commit/f1d3bf74cc7f12e759442fd7111d07e2c0262a67)), closes [#15637](https://github.com/vitejs/vite/issues/15637)
* refactor: use `originalFileNames`/`names` (#18240) ([f2957c8](https://github.com/vitejs/vite/commit/f2957c84f69c14c882809889fbd0fc66b97ca3e9)), closes [#18240](https://github.com/vitejs/vite/issues/18240)
* test: fix test conflict (#18446) ([94cd1e6](https://github.com/vitejs/vite/commit/94cd1e6f95e2434d2b52b5c16d50fe0472214634)), closes [#18446](https://github.com/vitejs/vite/issues/18446)
* chore(deps): update dependency picomatch to v4 (#15876) ([3774881](https://github.com/vitejs/vite/commit/377488178a7ef372d9b76526bb01fd60b97f51df)), closes [#15876](https://github.com/vitejs/vite/issues/15876)



## 6.0.0-beta.4 (2024-10-23)

* refactor: use builder in `build` (#18432) ([cc61d16](https://github.com/vitejs/vite/commit/cc61d169a4826996f7b2289618c383f8c5c6d470)), closes [#18432](https://github.com/vitejs/vite/issues/18432)
* refactor(resolve): remove `tryEsmOnly` flag (#18394) ([7cebe38](https://github.com/vitejs/vite/commit/7cebe3847f934ff4875ff3ecc6a96a82bac5f8f4)), closes [#18394](https://github.com/vitejs/vite/issues/18394)
* chore(deps)!: migrate `fast-glob` to `tinyglobby` (#18243) ([6f74a3a](https://github.com/vitejs/vite/commit/6f74a3a1b2469a24a86743d16267b0cc3653bc4a)), closes [#18243](https://github.com/vitejs/vite/issues/18243)
* refactor!: bump minimal terser version to 5.16.0 (#18209) ([19ce525](https://github.com/vitejs/vite/commit/19ce525b974328e4668ad8c6540c2a5ea652795b)), closes [#18209](https://github.com/vitejs/vite/issues/18209)
* chore: combine deps license with same text (#18356) ([b5d1a05](https://github.com/vitejs/vite/commit/b5d1a058f9dab6a6b1243c2a0b11d2c421dd3291)), closes [#18356](https://github.com/vitejs/vite/issues/18356)
* chore: fix grammar (#18385) ([8030231](https://github.com/vitejs/vite/commit/8030231596edcd688e324ea507dc1ba80564f75c)), closes [#18385](https://github.com/vitejs/vite/issues/18385)
* chore: mark builder api experimental (#18436) ([b57321c](https://github.com/vitejs/vite/commit/b57321cc198ee7b9012f1be632cfd4bea006cd89)), closes [#18436](https://github.com/vitejs/vite/issues/18436)
* chore: tiny typo (#18374) ([7d97a9b](https://github.com/vitejs/vite/commit/7d97a9b2ba11ab566865dcf9ee0350a9e479dfca)), closes [#18374](https://github.com/vitejs/vite/issues/18374)
* chore: update moduleResolution value casing (#18409) ([ff018dc](https://github.com/vitejs/vite/commit/ff018dca959c73481ae5f8328cd77d3b02f02134)), closes [#18409](https://github.com/vitejs/vite/issues/18409)
* chore(create-vite): mark template files as CC0 (#18366) ([f6b9074](https://github.com/vitejs/vite/commit/f6b90747eb2b1ad863e5f147a80c75b15e38a51b)), closes [#18366](https://github.com/vitejs/vite/issues/18366)
* chore(deps): bump TypeScript to 5.6 (#18254) ([57a0e85](https://github.com/vitejs/vite/commit/57a0e85186b88118bf5f79dd53391676fb91afec)), closes [#18254](https://github.com/vitejs/vite/issues/18254)
* chore(deps): update all non-major dependencies (#18404) ([802839d](https://github.com/vitejs/vite/commit/802839d48335a69eb15f71f2cd816d0b6e4d3556)), closes [#18404](https://github.com/vitejs/vite/issues/18404)
* chore(deps): update dependency sirv to v3 (#18346) ([5ea4b00](https://github.com/vitejs/vite/commit/5ea4b00a984bc76d0d000f621ab72763a4c9a48b)), closes [#18346](https://github.com/vitejs/vite/issues/18346)
* feat: add .git to deny list by default (#18382) ([105ca12](https://github.com/vitejs/vite/commit/105ca12b34e466dc9de838643954a873ac1ce804)), closes [#18382](https://github.com/vitejs/vite/issues/18382)
* feat: add `environment::listen` (#18263) ([4d5f51d](https://github.com/vitejs/vite/commit/4d5f51d13f92cc8224a028c27df12834a0667659)), closes [#18263](https://github.com/vitejs/vite/issues/18263)
* feat: enable dependencies discovery and pre-bundling in ssr environments (#18358) ([9b21f69](https://github.com/vitejs/vite/commit/9b21f69405271f1b864fa934a96adcb0e1a2bc4d)), closes [#18358](https://github.com/vitejs/vite/issues/18358)
* fix: augment hash for CSS files to prevent chromium erroring by loading previous files (#18367) ([a569f42](https://github.com/vitejs/vite/commit/a569f42ee93229308be7a327b7a71e79f3d58b01)), closes [#18367](https://github.com/vitejs/vite/issues/18367)
* fix: more robust plugin.sharedDuringBuild (#18351) ([47b1270](https://github.com/vitejs/vite/commit/47b12706ce2d0c009d6078a61e16e81a04c9f49c)), closes [#18351](https://github.com/vitejs/vite/issues/18351)
* fix(cli): `--watch` should not override `build.watch` options (#18390) ([b2965c8](https://github.com/vitejs/vite/commit/b2965c8e9f74410bc8047a05528c74b68a3856d7)), closes [#18390](https://github.com/vitejs/vite/issues/18390)
* fix(css): don't transform sass function calls with namespace (#18414) ([dbb2604](https://github.com/vitejs/vite/commit/dbb260499f894d495bcff3dcdf5635d015a2f563)), closes [#18414](https://github.com/vitejs/vite/issues/18414)
* fix(deps): update `open` dependency to 10.1.0 (#18349) ([5cca4bf](https://github.com/vitejs/vite/commit/5cca4bfd3202c7aea690acf63f60bfe57fa165de)), closes [#18349](https://github.com/vitejs/vite/issues/18349)
* fix(deps): update all non-major dependencies (#18345) ([5552583](https://github.com/vitejs/vite/commit/5552583a2272cd4208b30ad60e99d984e34645f0)), closes [#18345](https://github.com/vitejs/vite/issues/18345)
* fix(ssr): `this` in exported function should be `undefined` (#18329) ([bae6a37](https://github.com/vitejs/vite/commit/bae6a37628c4870f3db92351e8af2a7b4a07e248)), closes [#18329](https://github.com/vitejs/vite/issues/18329)
* fix(worker): rewrite rollup `output.format` with `worker.format` on worker build error (#18165) ([dc82334](https://github.com/vitejs/vite/commit/dc823347bb857a9f63eee7e027a52236d7e331e0)), closes [#18165](https://github.com/vitejs/vite/issues/18165)
* test: remove unnecessary logs from output (#18368) ([f50d358](https://github.com/vitejs/vite/commit/f50d3583e2c460bb02c118371a79b5ceac9877f3)), closes [#18368](https://github.com/vitejs/vite/issues/18368)
* test: replace fs mocking in css module compose test (#18413) ([ddee0ad](https://github.com/vitejs/vite/commit/ddee0ad38fd53993155fc11174d5ee194d6648d8)), closes [#18413](https://github.com/vitejs/vite/issues/18413)



## 6.0.0-beta.3 (2024-10-15)

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
* test: ssr external / resolveId test (#18327) ([4c5cf91](https://github.com/vitejs/vite/commit/4c5cf91d124d423fe028beecda952125698c1d5d)), closes [#18327](https://github.com/vitejs/vite/issues/18327)
* test: test optimized dep as ssr entry (#18301) ([466f94a](https://github.com/vitejs/vite/commit/466f94aa6465f0a3b932f55e93660f7cf6cd936e)), closes [#18301](https://github.com/vitejs/vite/issues/18301)
* perf: call `module.enableCompileCache()` (#18323) ([18f1dad](https://github.com/vitejs/vite/commit/18f1daddd125b07dcb8c32056ee0cec61bd65971)), closes [#18323](https://github.com/vitejs/vite/issues/18323)
* perf: use `crypto.hash` when available (#18317) ([2a14884](https://github.com/vitejs/vite/commit/2a148844cf2382a5377b75066351f00207843352)), closes [#18317](https://github.com/vitejs/vite/issues/18317)
* chore: point deprecation error URLs to main branch docs (#18321) ([11c0fb1](https://github.com/vitejs/vite/commit/11c0fb1388744624dac40cc267ad21dc7f85cb4e)), closes [#18321](https://github.com/vitejs/vite/issues/18321)
* chore: update all url references of vitejs.dev to vite.dev (#18276) ([7052c8f](https://github.com/vitejs/vite/commit/7052c8f6fc253f0a88ff04a4c18c108f3bfdaa78)), closes [#18276](https://github.com/vitejs/vite/issues/18276)
* chore: update built LICENSE ([69b6764](https://github.com/vitejs/vite/commit/69b6764d49dd0d04819a8aa9b4061974e0e00f62))
* chore: update license copyright (#18278) ([56eb869](https://github.com/vitejs/vite/commit/56eb869a67551a257d20cba00016ea59b1e1a2c4)), closes [#18278](https://github.com/vitejs/vite/issues/18278)
* chore(deps): update dependency @rollup/plugin-commonjs to v28 (#18231) ([78e749e](https://github.com/vitejs/vite/commit/78e749ea9a42e7f82dbca37c26e8ab2a5e6e0c16)), closes [#18231](https://github.com/vitejs/vite/issues/18231)
* refactor: rename runner.destroy() to runner.close() (#18304) ([cd368f9](https://github.com/vitejs/vite/commit/cd368f9fed393a8649597f0e5d873504a9ac62e2)), closes [#18304](https://github.com/vitejs/vite/issues/18304)
* feat: restrict characters useable for environment name (#18255) ([9ab6180](https://github.com/vitejs/vite/commit/9ab6180d3a20be71eb7aedef000f8c4ae3591c40)), closes [#18255](https://github.com/vitejs/vite/issues/18255)
* feat: support arbitrary module namespace identifier imports from cjs deps (#18236) ([4389a91](https://github.com/vitejs/vite/commit/4389a917f8f5e8e67222809fb7b166bb97f6d02c)), closes [#18236](https://github.com/vitejs/vite/issues/18236)
* docs: update homepage (#18274) ([a99a0aa](https://github.com/vitejs/vite/commit/a99a0aab7c600301a5c314b6071afa46915ce248)), closes [#18274](https://github.com/vitejs/vite/issues/18274)



## 6.0.0-beta.2 (2024-10-01)

* test: fix server-worker-runner flaky test (#18247) ([8f82730](https://github.com/vitejs/vite/commit/8f82730b86abed953800ade6e726f70ee55ab7fe)), closes [#18247](https://github.com/vitejs/vite/issues/18247)
* refactor: break circular dependencies to fix test-unit (#18237) ([a577828](https://github.com/vitejs/vite/commit/a577828d826805c5693d773eea4c4179e21f1a16)), closes [#18237](https://github.com/vitejs/vite/issues/18237)
* refactor: remove `_onCrawlEnd` (#18207) ([bea0272](https://github.com/vitejs/vite/commit/bea0272decd908cd04ac0a2c87dd0a676f218a1a)), closes [#18207](https://github.com/vitejs/vite/issues/18207)
* refactor: remove the need for "processSourceMap" (#18187) ([08ff233](https://github.com/vitejs/vite/commit/08ff23319964903b9f380859c216b10e577ddb6f)), closes [#18187](https://github.com/vitejs/vite/issues/18187)
* refactor: replace `parse` with `splitFileAndPostfix` (#18185) ([6f030ec](https://github.com/vitejs/vite/commit/6f030ec15f25a2a1d7d912f1b84d83ebb28a3515)), closes [#18185](https://github.com/vitejs/vite/issues/18185)
* refactor: use `resolvePackageData` to get rollup version (#18208) ([220d6ec](https://github.com/vitejs/vite/commit/220d6ec2bf3fc7063eac7c625d4ccda9a4204cb7)), closes [#18208](https://github.com/vitejs/vite/issues/18208)
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
* chore: escape template tag in CHANGELOG.md (#18126) ([caaa683](https://github.com/vitejs/vite/commit/caaa6836e9a104cc9d63b68ad850149687ad104c)), closes [#18126](https://github.com/vitejs/vite/issues/18126)
* chore(deps): update all non-major dependencies (#18108) ([a73bbaa](https://github.com/vitejs/vite/commit/a73bbaadb512a884924cc884060e50ea6d809d74)), closes [#18108](https://github.com/vitejs/vite/issues/18108)
* chore(deps): update all non-major dependencies (#18230) ([c0edd26](https://github.com/vitejs/vite/commit/c0edd26bbfeb9a8d80ebaa420e54fbb7f165bd9b)), closes [#18230](https://github.com/vitejs/vite/issues/18230)
* chore(deps): update esbuild (#18173) ([e59e2ca](https://github.com/vitejs/vite/commit/e59e2cacab476305c3cdfb31732c27b174fb8fe2)), closes [#18173](https://github.com/vitejs/vite/issues/18173)
* chore(optimizer): fix typo in comment (#18239) ([b916ab6](https://github.com/vitejs/vite/commit/b916ab601d2ec1c842ea0c6139bf216166010e56)), closes [#18239](https://github.com/vitejs/vite/issues/18239)
* feat: introduce RunnableDevEnvironment (#18190) ([fb292f2](https://github.com/vitejs/vite/commit/fb292f226f988e80fee4f4aea878eb3d5d229022)), closes [#18190](https://github.com/vitejs/vite/issues/18190)
* feat: support `this.environment` in `options` and `onLog` hook (#18142) ([7722c06](https://github.com/vitejs/vite/commit/7722c061646bc8587f55f560bfe06b2a9643639a)), closes [#18142](https://github.com/vitejs/vite/issues/18142)
* docs: fix typo in proxy.ts (#18162) ([49087bd](https://github.com/vitejs/vite/commit/49087bd5738a2cf69ee46b10a74cfd61c18e9959)), closes [#18162](https://github.com/vitejs/vite/issues/18162)



## 6.0.0-beta.1 (2024-09-16)

* fix: avoid DOM Clobbering gadget in `getRelativeUrlFromDocument` (#18115) ([ade1d89](https://github.com/vitejs/vite/commit/ade1d89660e17eedfd35652165b0c26905259fad)), closes [#18115](https://github.com/vitejs/vite/issues/18115)
* fix: fs raw query (#18112) ([9d2413c](https://github.com/vitejs/vite/commit/9d2413c8b64bfb1dfd953340b4e1b5972d5440aa)), closes [#18112](https://github.com/vitejs/vite/issues/18112)
* fix(preload): throw error preloading module as well (#18098) ([ba56cf4](https://github.com/vitejs/vite/commit/ba56cf43b5480f8519349f7d7fe60718e9af5f1a)), closes [#18098](https://github.com/vitejs/vite/issues/18098)



## 6.0.0-beta.0 (2024-09-12)

* chore: enable some eslint rules (#18084) ([e9a2746](https://github.com/vitejs/vite/commit/e9a2746ca77473b1814fd05db3d299c074135fe5)), closes [#18084](https://github.com/vitejs/vite/issues/18084)
* chore: remove npm-run-all2 (#18083) ([41180d0](https://github.com/vitejs/vite/commit/41180d02730a7ce7c9b6ec7ac71fc6e750dd22c6)), closes [#18083](https://github.com/vitejs/vite/issues/18083)
* chore: silence unnecessary logs during test (#18052) ([a3ef052](https://github.com/vitejs/vite/commit/a3ef052d408edbec71081fd2f7b3e4b1d4ea0174)), closes [#18052](https://github.com/vitejs/vite/issues/18052)
* chore(deps): update all non-major dependencies (#18050) ([7cac03f](https://github.com/vitejs/vite/commit/7cac03fa5197a72d2e2422bd0243a85a9a18abfc)), closes [#18050](https://github.com/vitejs/vite/issues/18050)
* refactor: remove custom resolveOptions from pre-alias plugin (#18041) ([6f60adc](https://github.com/vitejs/vite/commit/6f60adc15283c6b25218d2392738671b6ab4b392)), closes [#18041](https://github.com/vitejs/vite/issues/18041)
* refactor: remove unnecessary escape (#18044) ([8062d36](https://github.com/vitejs/vite/commit/8062d36773cafaec98196965d33d79887e58f437)), closes [#18044](https://github.com/vitejs/vite/issues/18044)
* refactor(create-vite): use picocolors (#18085) ([ba37df0](https://github.com/vitejs/vite/commit/ba37df0813ad3864fc4b8c6c0b289a1f2bc00c36)), closes [#18085](https://github.com/vitejs/vite/issues/18085)
* feat: Environment API (#16471) ([242f550](https://github.com/vitejs/vite/commit/242f550eb46c93896fca6b55495578921e29a8af)), closes [#16471](https://github.com/vitejs/vite/issues/16471)
* feat: expose `EnvironmentOptions` type (#18080) ([35cf59c](https://github.com/vitejs/vite/commit/35cf59c9d53ef544eb5f2fe2f9ff4d6cb225e63b)), closes [#18080](https://github.com/vitejs/vite/issues/18080)
* feat(css): support es2023 build target for lightningcss (#17998) ([1a76300](https://github.com/vitejs/vite/commit/1a76300cd16827f0640924fdc21747ce140c35fb)), closes [#17998](https://github.com/vitejs/vite/issues/17998)
* fix: allow scanning exports from `script module` in svelte (#18063) ([7d699aa](https://github.com/vitejs/vite/commit/7d699aa98155cbf281e3f7f6a8796dcb3b4b0fd6)), closes [#18063](https://github.com/vitejs/vite/issues/18063)
* fix: ensure req.url matches moduleByEtag URL to avoid incorrect 304 (#17997) ([abf04c3](https://github.com/vitejs/vite/commit/abf04c3a84f4d9962a6f9697ca26cd639fa76e87)), closes [#17997](https://github.com/vitejs/vite/issues/17997)
* fix: incorrect environment consumer option resolution (#18079) ([0e3467e](https://github.com/vitejs/vite/commit/0e3467e503aef45119260fe75b399b26f7a80b66)), closes [#18079](https://github.com/vitejs/vite/issues/18079)
* fix: store backwards compatible `ssrModule` and `ssrError` (#18031) ([cf8ced5](https://github.com/vitejs/vite/commit/cf8ced56ea4932e917e2c4ef3d04a87f0ab4f20b)), closes [#18031](https://github.com/vitejs/vite/issues/18031)
* fix(build): declare `preload-helper` has no side effects (#18057) ([587ad7b](https://github.com/vitejs/vite/commit/587ad7b17beba50279eaf46b06c5bf5559c4f36e)), closes [#18057](https://github.com/vitejs/vite/issues/18057)
* fix(css): fallback to mainthread if logger or pkgImporter option is set for sass (#18071) ([d81dc59](https://github.com/vitejs/vite/commit/d81dc59473b1053bf48c45a9d45f87ee6ecf2c02)), closes [#18071](https://github.com/vitejs/vite/issues/18071)
* fix(dynamicImportVars): correct glob pattern for paths with parentheses (#17940) ([2a391a7](https://github.com/vitejs/vite/commit/2a391a7df6e5b4a8d9e8313fba7ddf003df41e12)), closes [#17940](https://github.com/vitejs/vite/issues/17940)
* fix(html): escape html attribute (#18067) ([5983f36](https://github.com/vitejs/vite/commit/5983f366d499f74d473097154bbbcc8e51476dc4)), closes [#18067](https://github.com/vitejs/vite/issues/18067)
* fix(preload): allow ignoring dep errors (#18046) ([3fb2889](https://github.com/vitejs/vite/commit/3fb28896d916e03cef1b5bd6877ac184c7ec8003)), closes [#18046](https://github.com/vitejs/vite/issues/18046)
* test: move glob test root to reduce snapshot change (#18053) ([04d7e77](https://github.com/vitejs/vite/commit/04d7e7749496f5d1972338c7de1502c7f6f65cb6)), closes [#18053](https://github.com/vitejs/vite/issues/18053)



## <small>5.4.11 (2024-11-11)</small>

* fix(deps): update dependencies of postcss-modules ([ceb15db](https://github.com/vitejs/vite/commit/ceb15db613d107e29f7cc1d441364f7b5c831ed3)), closes [#18617](https://github.com/vitejs/vite/issues/18617)



## <small>5.4.10 (2024-10-23)</small>

* fix: backport #18367,augment hash for CSS files to prevent chromium erroring by loading previous fil ([7d1a3bc](https://github.com/vitejs/vite/commit/7d1a3bcc436e1697b314bdc9d24c948664a1afb7)), closes [#18367](https://github.com/vitejs/vite/issues/18367) [#18412](https://github.com/vitejs/vite/issues/18412)



## <small>5.4.9 (2024-10-14)</small>

* fix: bump launch-editor-middleware to v2.9.1 (#18348) ([508d9ab](https://github.com/vitejs/vite/commit/508d9ab83412c36e33f4c4ca57b891171429cdd3)), closes [#18348](https://github.com/vitejs/vite/issues/18348)
* fix(css): fix lightningcss dep url resolution with custom root (#18125) ([eae00b5](https://github.com/vitejs/vite/commit/eae00b561e04f1fe1679d3acf4f88b3c42019e4d)), closes [#18125](https://github.com/vitejs/vite/issues/18125)
* fix(data-uri): only match ids starting with `data:` (#18241) ([96084d6](https://github.com/vitejs/vite/commit/96084d6e752c03332d101a50bce161a8e3f311cc)), closes [#18241](https://github.com/vitejs/vite/issues/18241)
* fix(deps): bump tsconfck (#18322) ([dc5434c](https://github.com/vitejs/vite/commit/dc5434ce8781d206bcc4b55e90201691125e662c)), closes [#18322](https://github.com/vitejs/vite/issues/18322)
* fix(hmr): don't try to rewrite imports for direct CSS soft invalidation (#18252) ([851b258](https://github.com/vitejs/vite/commit/851b258c346fdddd4467a12f41189b7855df8c43)), closes [#18252](https://github.com/vitejs/vite/issues/18252)
* fix(ssr): (backport #18150) fix source map remapping with multiple sources (#18204) ([262a879](https://github.com/vitejs/vite/commit/262a8796d4be2c4b9c812f203ea9177f42360b13)), closes [#18204](https://github.com/vitejs/vite/issues/18204)
* chore: update all url references of vitejs.dev to vite.dev (#18276) ([c23558a](https://github.com/vitejs/vite/commit/c23558a7af341d13f0c9da691047713965bc7e7d)), closes [#18276](https://github.com/vitejs/vite/issues/18276)
* chore: update license copyright (#18278) ([1864eb1](https://github.com/vitejs/vite/commit/1864eb17b21ef21564bd66c6f6a30c2c495e2d4e)), closes [#18278](https://github.com/vitejs/vite/issues/18278)
* docs: update homepage (#18274) ([ae44163](https://github.com/vitejs/vite/commit/ae4416349e1a373023d0e9e05955d96ae5fa9ab2)), closes [#18274](https://github.com/vitejs/vite/issues/18274)



## <small>5.4.8 (2024-09-25)</small>

* fix(css): backport #18113, fix missing source file warning with sass modern api custom importer (#18 ([7d47fc1](https://github.com/vitejs/vite/commit/7d47fc1c749053095a3345ca1d47406a5f31792a)), closes [#18183](https://github.com/vitejs/vite/issues/18183)
* fix(css): backport #18128, ensure sass compiler initialized only once (#18184) ([8464d97](https://github.com/vitejs/vite/commit/8464d976b1d9280ed915622c0e7477b36bdb7d8c)), closes [#18128](https://github.com/vitejs/vite/issues/18128) [#18184](https://github.com/vitejs/vite/issues/18184)



## <small>5.4.7 (2024-09-20)</small>

* fix: treat config file as ESM in Deno (#18158) ([b5908a2](https://github.com/vitejs/vite/commit/b5908a24ba0808380e3c8ec415624b108c65e08d)), closes [#18158](https://github.com/vitejs/vite/issues/18158)



## <small>5.4.6 (2024-09-16)</small>

* fix: avoid DOM Clobbering gadget in `getRelativeUrlFromDocument` (#18115) ([179b177](https://github.com/vitejs/vite/commit/179b17773cf35c73ddb041f9e6c703fd9f3126af)), closes [#18115](https://github.com/vitejs/vite/issues/18115)
* fix: fs raw query (#18112) ([6820bb3](https://github.com/vitejs/vite/commit/6820bb3b9a54334f3268fc5ee1e967d2e1c0db34)), closes [#18112](https://github.com/vitejs/vite/issues/18112)



## <small>5.4.5 (2024-09-13)</small>

* fix(preload): backport #18098, throw error preloading module as well (#18099) ([faa2405](https://github.com/vitejs/vite/commit/faa2405e5d1da07a7c7fb6d48e887bf97a2f3dba)), closes [#18098](https://github.com/vitejs/vite/issues/18098) [#18099](https://github.com/vitejs/vite/issues/18099)



## <small>5.4.4 (2024-09-11)</small>

* fix: backport #17997, ensure req.url matches moduleByEtag URL to avoid incorrect 304 (#18078) ([74a79c5](https://github.com/vitejs/vite/commit/74a79c53b2286c91739d1473945012b5d206eddf)), closes [#17997](https://github.com/vitejs/vite/issues/17997) [#18078](https://github.com/vitejs/vite/issues/18078)
* fix: backport #18063, allow scanning exports from `script module` in svelte (#18077) ([d90ba40](https://github.com/vitejs/vite/commit/d90ba40474aa1da8e722e1660ba739621238e5ac)), closes [#18063](https://github.com/vitejs/vite/issues/18063) [#18077](https://github.com/vitejs/vite/issues/18077)
* fix(preload): backport #18046, allow ignoring dep errors (#18076) ([8760293](https://github.com/vitejs/vite/commit/8760293d6836dac554d1d6f214b8b09ed97cccd4)), closes [#18046](https://github.com/vitejs/vite/issues/18046) [#18076](https://github.com/vitejs/vite/issues/18076)



## <small>5.4.3 (2024-09-03)</small>

* fix: allow getting URL of JS files in publicDir (#17915) ([943ece1](https://github.com/vitejs/vite/commit/943ece177e7709b3ba574e810afce347c51d4442)), closes [#17915](https://github.com/vitejs/vite/issues/17915)
* fix: cjs warning respect the logLevel flag (#17993) ([dc3c14f](https://github.com/vitejs/vite/commit/dc3c14f39fcd57867c8ae81b75ae768b53b4b880)), closes [#17993](https://github.com/vitejs/vite/issues/17993)
* fix: improve CJS warning trace information (#17926) ([5c5f82c](https://github.com/vitejs/vite/commit/5c5f82c84bb64309875b42eee9d4dd525ab42e8c)), closes [#17926](https://github.com/vitejs/vite/issues/17926)
* fix: only remove entry assets handled by Vite core (#17916) ([ebfaa7e](https://github.com/vitejs/vite/commit/ebfaa7e6019783f308db5e759a6a67abb7cc626c)), closes [#17916](https://github.com/vitejs/vite/issues/17916)
* fix: waitForRequestIdle locked (#17982) ([ad13760](https://github.com/vitejs/vite/commit/ad1376018a94b42540a8488d897cc520849e1228)), closes [#17982](https://github.com/vitejs/vite/issues/17982)
* fix(css): fix directory index import in sass modern api (#17960) ([9b001ba](https://github.com/vitejs/vite/commit/9b001baa70c8489ac5550107c110a5dca281cda4)), closes [#17960](https://github.com/vitejs/vite/issues/17960)
* fix(css): fix sass `file://` reference (#17909) ([561b940](https://github.com/vitejs/vite/commit/561b940f6f963fbb78058a6e23b4adad53a2edb9)), closes [#17909](https://github.com/vitejs/vite/issues/17909)
* fix(css): fix sass modern source map (#17938) ([d428e7e](https://github.com/vitejs/vite/commit/d428e7e3a05f8da5ea00bb1b6a0827a5cc225899)), closes [#17938](https://github.com/vitejs/vite/issues/17938)
* fix(deps): bump tsconfck  (#17990) ([8c661b2](https://github.com/vitejs/vite/commit/8c661b20e92f33eb2e3ba3841b20dd6f6076f1ef)), closes [#17990](https://github.com/vitejs/vite/issues/17990)
* fix(html): rewrite assets url in `<template>` (#17988) ([413c86a](https://github.com/vitejs/vite/commit/413c86aa971bc1ad8958578c929f45a368799f74)), closes [#17988](https://github.com/vitejs/vite/issues/17988)
* fix(preload): add crossorigin attribute in CSS link tags (#17930) ([15871c7](https://github.com/vitejs/vite/commit/15871c75e0722adeda23f771fd6c45fecba4d118)), closes [#17930](https://github.com/vitejs/vite/issues/17930)
* chore: reduce diffs with v6 branch (#17942) ([bf9065a](https://github.com/vitejs/vite/commit/bf9065aa13da6a519014c3bc1d34cfb1cb49ccca)), closes [#17942](https://github.com/vitejs/vite/issues/17942)
* chore(deps): update all non-major dependencies (#17945) ([cfb621e](https://github.com/vitejs/vite/commit/cfb621e7a5a3e24d710a9af156e6855e73caf891)), closes [#17945](https://github.com/vitejs/vite/issues/17945)
* chore(deps): update all non-major dependencies (#17991) ([0ca53cf](https://github.com/vitejs/vite/commit/0ca53cff9ff49108fcec75ff01d2445f9c2f2a4c)), closes [#17991](https://github.com/vitejs/vite/issues/17991)



## <small>5.4.2 (2024-08-20)</small>

* chore: remove stale TODOs (#17866) ([e012f29](https://github.com/vitejs/vite/commit/e012f296df583bd133d26399397bd4ae49de1497)), closes [#17866](https://github.com/vitejs/vite/issues/17866)
* refactor: remove redundant prepend/strip base (#17887) ([3b8f03d](https://github.com/vitejs/vite/commit/3b8f03d789ec3ef1a099c884759bd4e61b03ce7c)), closes [#17887](https://github.com/vitejs/vite/issues/17887)
* fix: resolve relative URL generated by `renderBuiltUrl` passed to module preload (#16084) ([fac3a8e](https://github.com/vitejs/vite/commit/fac3a8ed6855c4ab3032957137b74f21ec501e72)), closes [#16084](https://github.com/vitejs/vite/issues/16084)
* feat: support originalFilename (#17867) ([7d8c0e2](https://github.com/vitejs/vite/commit/7d8c0e2dcbdea3a3465a1d87e259988e82561035)), closes [#17867](https://github.com/vitejs/vite/issues/17867)



## <small>5.4.1 (2024-08-15)</small>

* fix: `build.modulePreload.resolveDependencies` is optimizable (#16083) ([e961b31](https://github.com/vitejs/vite/commit/e961b31493f8493277b46773156cc6e546b9c86b)), closes [#16083](https://github.com/vitejs/vite/issues/16083)
* fix: align CorsOptions.origin type with @types/cors (#17836) ([1bda847](https://github.com/vitejs/vite/commit/1bda847329022d5279cfa2b51719dd19a161fd64)), closes [#17836](https://github.com/vitejs/vite/issues/17836)
* fix: typings for vite:preloadError (#17868) ([6700594](https://github.com/vitejs/vite/commit/67005949999054ab3cd079890ed220bc359bcf62)), closes [#17868](https://github.com/vitejs/vite/issues/17868)
* fix(build): avoid re-define `__vite_import_meta_env__` (#17876) ([e686d74](https://github.com/vitejs/vite/commit/e686d749d673c02ff4395971ac74340082da14e5)), closes [#17876](https://github.com/vitejs/vite/issues/17876)
* fix(deps): update all non-major dependencies (#17869) ([d11711c](https://github.com/vitejs/vite/commit/d11711c7e4c082fd0400245bfdc766006fd38ac8)), closes [#17869](https://github.com/vitejs/vite/issues/17869)
* fix(lightningcss): search for assets with correct base path (#17856) ([4e5ce3c](https://github.com/vitejs/vite/commit/4e5ce3c7a90966b1f942df35b8b3e8a550a4f031)), closes [#17856](https://github.com/vitejs/vite/issues/17856)
* fix(worker): handle self reference url worker in dependency for build (#17846) ([391bb49](https://github.com/vitejs/vite/commit/391bb4917b55baf3fdb01c6fc3d782d6c51be6c8)), closes [#17846](https://github.com/vitejs/vite/issues/17846)
* chore: fix picocolors import for local dev (#17884) ([9018255](https://github.com/vitejs/vite/commit/9018255c697a8c0888dce57aaa755d25bf66beba)), closes [#17884](https://github.com/vitejs/vite/issues/17884)
* refactor: remove `handleHotUpdate` from watch-package-data plugin (#17865) ([e16bf1f](https://github.com/vitejs/vite/commit/e16bf1fb14b7a3a950de4d74fce31416746829b3)), closes [#17865](https://github.com/vitejs/vite/issues/17865)



## 5.4.0 (2024-08-07)

* fix(build): windows platform build output path error (#17818) ([6ae0615](https://github.com/vitejs/vite/commit/6ae0615416762dd1b89393316308cf8edf115c34)), closes [#17818](https://github.com/vitejs/vite/issues/17818)
* fix(deps): update launch-editor to consume fix for windows paths (#17828) ([cf2f90d](https://github.com/vitejs/vite/commit/cf2f90d4b9f9b16b8009b0f9d0d9f7e71e98c54d)), closes [#17828](https://github.com/vitejs/vite/issues/17828)
* fix(ssr): fix `global` variable name conflict (#17809) ([6aa2206](https://github.com/vitejs/vite/commit/6aa220607b4f5457c1ef9ff68d75885a9abbdaf6)), closes [#17809](https://github.com/vitejs/vite/issues/17809)
* fix(worker): fix `importScripts` injection breaking iife code (#17827) ([bb4ba9f](https://github.com/vitejs/vite/commit/bb4ba9f448da01782f585369f80c4517da087000)), closes [#17827](https://github.com/vitejs/vite/issues/17827)
* chore: bump typescript-eslint to v8 (#17624) ([d1891fd](https://github.com/vitejs/vite/commit/d1891fda026d27f53409dec97e156a59da609196)), closes [#17624](https://github.com/vitejs/vite/issues/17624)
* chore(deps): update all non-major dependencies (#17820) ([bb2f8bb](https://github.com/vitejs/vite/commit/bb2f8bb55fdd64e4f16831ff98921c221a5e734a)), closes [#17820](https://github.com/vitejs/vite/issues/17820)
* perf(ssr): do a single-pass over AST with node cache arrays (#17812) ([81327eb](https://github.com/vitejs/vite/commit/81327eb980c308474a586a9cb9c0c5fff10eba34)), closes [#17812](https://github.com/vitejs/vite/issues/17812)



## 5.4.0-beta.1 (2024-08-01)

* fix: handle encoded base paths (#17577) ([720447e](https://github.com/vitejs/vite/commit/720447ee725046323387f661341d44e2ad390f41)), closes [#17577](https://github.com/vitejs/vite/issues/17577)
* fix: opt-in server.fs.cachedChecks (#17807) ([4de659c](https://github.com/vitejs/vite/commit/4de659c351589b83a83a7a42f3da5b071a625662)), closes [#17807](https://github.com/vitejs/vite/issues/17807)
* feat(css): support sass compiler api and sass-embedded package (#17754) ([1025bb6](https://github.com/vitejs/vite/commit/1025bb6d8f21c0cb9fe72405d42e0f91bb3f1d8e)), closes [#17754](https://github.com/vitejs/vite/issues/17754)



## 5.4.0-beta.0 (2024-07-30)

* fix: specify own Node version as target when bundling config files (#17307) ([bbf001f](https://github.com/vitejs/vite/commit/bbf001f0ecb4e9b826bbeb75b91d39f20aab3142)), closes [#17307](https://github.com/vitejs/vite/issues/17307)
* fix(build): handle invalid JSON in import.meta.env (#17648) ([659b720](https://github.com/vitejs/vite/commit/659b7206930d660779ad504beef89744fb97d339)), closes [#17648](https://github.com/vitejs/vite/issues/17648)
* fix(deps): update all non-major dependencies (#17780) ([e408542](https://github.com/vitejs/vite/commit/e408542748edebd93dba07f21e3fd107725cadca)), closes [#17780](https://github.com/vitejs/vite/issues/17780)
* fix(mergeConfig): don't recreate server.hmr.server instance (#17763) ([5c55b29](https://github.com/vitejs/vite/commit/5c55b291cf1d41664b0e949acf41d70c956659da)), closes [#17763](https://github.com/vitejs/vite/issues/17763)
* feat(css): support sass modern api (#17728) ([73a3de0](https://github.com/vitejs/vite/commit/73a3de01d2baaeefeabfa46c28fb49550643b23a)), closes [#17728](https://github.com/vitejs/vite/issues/17728)
* feat(types): support custom VitePreloadErrorEvent (#17615) ([116e37a](https://github.com/vitejs/vite/commit/116e37acf1a9ce808bc7a7f3a1439ab749c168e3)), closes [#17615](https://github.com/vitejs/vite/issues/17615)
* perf: improve regex performance (#17789) ([952bae3](https://github.com/vitejs/vite/commit/952bae3efcbd871fc3df5b1947060de7ebdafa36)), closes [#17789](https://github.com/vitejs/vite/issues/17789)
* chore: minor config.logger refactor (#17770) ([b947fdc](https://github.com/vitejs/vite/commit/b947fdcc9d0db51ee6ac64d9712e8f04077280a7)), closes [#17770](https://github.com/vitejs/vite/issues/17770)
* chore: update eslint config (#17788) ([796eef3](https://github.com/vitejs/vite/commit/796eef3af1291facc47b5273f83b0ef16d6d76b7)), closes [#17788](https://github.com/vitejs/vite/issues/17788)



## <small>5.3.5 (2024-07-25)</small>

* refactor(asset): remove rollup 3 public file watch workaround (#16331) ([66bdb1d](https://github.com/vitejs/vite/commit/66bdb1d7b41e46b5361606ff3811bdad6f625bcc)), closes [#16331](https://github.com/vitejs/vite/issues/16331)
* fix: make `server` type less restrictive (fix #17627) (#17628) ([b55c32f](https://github.com/vitejs/vite/commit/b55c32f7e36ee7cc3754a5d667785d066dece10a)), closes [#17627](https://github.com/vitejs/vite/issues/17627) [#17628](https://github.com/vitejs/vite/issues/17628)
* fix: show error if vite client cannot be loaded (#17419) ([db5ab1d](https://github.com/vitejs/vite/commit/db5ab1dfc4fb55c6387136ee31fed35910a046b0)), closes [#17419](https://github.com/vitejs/vite/issues/17419)
* fix(build): env output is not stable (#17748) ([b240a83](https://github.com/vitejs/vite/commit/b240a8347e7b62bee9d2212625732bb0d8c78633)), closes [#17748](https://github.com/vitejs/vite/issues/17748)
* fix(client): fix vite error path (#17744) ([3c1bde3](https://github.com/vitejs/vite/commit/3c1bde340693e1de89ed2853225a5c1b6812accc)), closes [#17744](https://github.com/vitejs/vite/issues/17744)
* fix(css): resolve url aliases with fragments (fix: #17690) (#17691) ([d906d3f](https://github.com/vitejs/vite/commit/d906d3f8e1199fb9fc09f4c3397a91b274bb65c8))
* fix(deps): update all non-major dependencies (#17629) ([93281b0](https://github.com/vitejs/vite/commit/93281b0e09ff8b00e21c24b80ed796db89cbc1ef)), closes [#17629](https://github.com/vitejs/vite/issues/17629)
* fix(importMetaGlob): handle alias that starts with hash (#17743) ([b58b423](https://github.com/vitejs/vite/commit/b58b423ba85a7cede97d00a0160a188770928ae4)), closes [#17743](https://github.com/vitejs/vite/issues/17743)
* fix(ssrTransform): sourcemaps with multiple sources (#17677) ([f321fa8](https://github.com/vitejs/vite/commit/f321fa8de2c8cf4f1758365abad4e7b352363a2f)), closes [#17677](https://github.com/vitejs/vite/issues/17677)
* chore: extend commit hash (#17709) ([4fc9b64](https://github.com/vitejs/vite/commit/4fc9b6424c27aca8004c368b69991a56264e4fdb)), closes [#17709](https://github.com/vitejs/vite/issues/17709)
* chore(deps): update all non-major dependencies (#17734) ([9983731](https://github.com/vitejs/vite/commit/998373120c8306326469d4f342690c17774acdf9)), closes [#17734](https://github.com/vitejs/vite/issues/17734)
* chore(deps): update typescript (#17699) ([df5ceb3](https://github.com/vitejs/vite/commit/df5ceb35b7f744cfcdfe3a28834f890f35f2b18f)), closes [#17699](https://github.com/vitejs/vite/issues/17699)
* revert: fix(logger): truncate log over 5000 characters long (#16581) (#17729) ([f4f488f](https://github.com/vitejs/vite/commit/f4f488fe83a0b710dd3de34a7075398cfce59605)), closes [#16581](https://github.com/vitejs/vite/issues/16581) [#17729](https://github.com/vitejs/vite/issues/17729)



## <small>5.3.4 (2024-07-16)</small>

* fix: update Terser type definitions (fix #17668) (#17669) ([b723a75](https://github.com/vitejs/vite/commit/b723a753ced0667470e72b4853ecda27b17f546a)), closes [#17668](https://github.com/vitejs/vite/issues/17668) [#17669](https://github.com/vitejs/vite/issues/17669)
* fix(build): skip preload treeshaking for nested braces (#17687) ([4be96b4](https://github.com/vitejs/vite/commit/4be96b48bca30a692eb528b0b43a27bdc440e811)), closes [#17687](https://github.com/vitejs/vite/issues/17687)
* fix(css): include `.css?url` in assets field of manifest (#17623) ([1465b20](https://github.com/vitejs/vite/commit/1465b2064ee23ac5df5414b13355a394ccd931af)), closes [#17623](https://github.com/vitejs/vite/issues/17623)
* fix(worker): nested inlined worker always fallbacked to data URI worker instead of using blob worker ([07bc489](https://github.com/vitejs/vite/commit/07bc489b310e8173e4929193f3f283e1e50fa87f)), closes [#17509](https://github.com/vitejs/vite/issues/17509)
* refactor: replace includes with logical operations (#17620) ([c4a2227](https://github.com/vitejs/vite/commit/c4a2227c74d35d4065c764616a85a76971c53c7f)), closes [#17620](https://github.com/vitejs/vite/issues/17620)
* chore: add callback to http-proxy.d.ts jsdoc (#17646) ([d8a5d70](https://github.com/vitejs/vite/commit/d8a5d700bc5a625ee2be7cc6e2f79b3c84b29e7c)), closes [#17646](https://github.com/vitejs/vite/issues/17646)



## <small>5.3.3 (2024-07-03)</small>

* fix: lazily evaluate __vite__mapDeps files (#17602) ([dafff4a](https://github.com/vitejs/vite/commit/dafff4ae6eabf22b7f08a582f3663eb8a08bfc32)), closes [#17602](https://github.com/vitejs/vite/issues/17602)
* fix(deps): update all non-major dependencies (#17590) ([012490c](https://github.com/vitejs/vite/commit/012490ca8682e2b560737cb54dbb465ab4f36471)), closes [#17590](https://github.com/vitejs/vite/issues/17590)
* fix(lib): remove pure CSS dynamic import (#17601) ([055f1c1](https://github.com/vitejs/vite/commit/055f1c16e55b527543e7af0e65e820b245b12d2e)), closes [#17601](https://github.com/vitejs/vite/issues/17601)
* fix(proxy): replace changeOrigin changes in 5.3.0 with new rewriteWsOrigin option (#17563) ([14c3d49](https://github.com/vitejs/vite/commit/14c3d49303e4db459728c43b2d3a7c2aff8cd383)), closes [#17563](https://github.com/vitejs/vite/issues/17563)



## <small>5.3.2 (2024-06-27)</small>

* fix(client): uniform variable `location` (#17528) ([a8e2f6f](https://github.com/vitejs/vite/commit/a8e2f6fafcf106ccc0d5a46972e66c2bf73155e3)), closes [#17528](https://github.com/vitejs/vite/issues/17528)
* fix(deps): update all non-major dependencies (#17494) ([bf123f2](https://github.com/vitejs/vite/commit/bf123f2c6242424a3648cf9234281fd9ff44e3d5)), closes [#17494](https://github.com/vitejs/vite/issues/17494)
* fix(typescript): correctly expand ${configDir} in tsconfig.json (#17576) ([24c799b](https://github.com/vitejs/vite/commit/24c799b121c4d72cc08a52a46f82a831b64b1e6f)), closes [#17576](https://github.com/vitejs/vite/issues/17576)
* chore: fix some comments (#17495) ([ec16a5e](https://github.com/vitejs/vite/commit/ec16a5efc04d8ab50301d184c20e7bd0c8d8f6a2)), closes [#17495](https://github.com/vitejs/vite/issues/17495)
* chore(deps): update all non-major dependencies (#17553) ([a33a97f](https://github.com/vitejs/vite/commit/a33a97f8c32bdeadcad5a9e0de50612ac985d3d0)), closes [#17553](https://github.com/vitejs/vite/issues/17553)
* chore(deps): update dependency eslint to v9 (#16661) ([6c10662](https://github.com/vitejs/vite/commit/6c106622812480d2bb134f8ed8efa84e2eb942c4)), closes [#16661](https://github.com/vitejs/vite/issues/16661)
* chore(deps): update es-module-lexer to 1.5.4 (#17555) ([2d6672f](https://github.com/vitejs/vite/commit/2d6672fd8a8da58b61d502418064ac2e3080a26e)), closes [#17555](https://github.com/vitejs/vite/issues/17555)
* refactor(optimizer): use early continues (#17551) ([7c06ef0](https://github.com/vitejs/vite/commit/7c06ef07f835308b1ff2de3df02d201a8dbfb3b6)), closes [#17551](https://github.com/vitejs/vite/issues/17551)



## <small>5.3.1 (2024-06-14)</small>

* fix(build): handle preload treeshaking for braces (#17479) ([d355568](https://github.com/vitejs/vite/commit/d355568e8d2dbc30b94b7d7680943f7db713ddc4)), closes [#17479](https://github.com/vitejs/vite/issues/17479)
* fix(build): handle preload treeshaking for commas (#17472) ([3e27071](https://github.com/vitejs/vite/commit/3e2707122033a5be074d88dbeb244526dee85bb9)), closes [#17472](https://github.com/vitejs/vite/issues/17472)
* fix(build): preload treeshaking ignore equal (#17480) ([6ced135](https://github.com/vitejs/vite/commit/6ced135c6fc9367f8d4f8207666e208f90547af5)), closes [#17480](https://github.com/vitejs/vite/issues/17480)
* chore: consolidate changelog for 5.3 (#17476) ([1f09344](https://github.com/vitejs/vite/commit/1f09344b57b253c0435290de1d6e147c8c9b50d5)), closes [#17476](https://github.com/vitejs/vite/issues/17476)



## 5.3.0 (2024-06-13)

### Features

* feat: asset type add bmp (#17439) ([ec287f8](https://github.com/vitejs/vite/commit/ec287f81420e67380aabfde78f667b04a4d9b5d9)), closes [#17439](https://github.com/vitejs/vite/issues/17439)
* feat(typescript): update tsconfck to add support for `${configDir}` replacement in ts 5.5 (#17350) ([4835e2b](https://github.com/vitejs/vite/commit/4835e2bf77b84d53a94aa4d94502df974b8b7fc4)), closes [#17350](https://github.com/vitejs/vite/issues/17350)
* refactor(build): remove quotes from preload marker (#16562) ([9853190](https://github.com/vitejs/vite/commit/98531901eef3ac64242f8438c3ef83e65c2ac88c)), closes [#16562](https://github.com/vitejs/vite/issues/16562)
* feat: add 'system' library format (#11256) ([4102ca9](https://github.com/vitejs/vite/commit/4102ca9b0f9160d79b915a4fc6a5fd5af7eb7112)), closes [#11256](https://github.com/vitejs/vite/issues/11256)
* feat: add an option to not start a websocket server (#16219) ([14b5ced](https://github.com/vitejs/vite/commit/14b5cedbfdc0a9e0f43855b44bfd6212105ebfdb)), closes [#16219](https://github.com/vitejs/vite/issues/16219)
* feat: add headTagInsertCheck warning (#16555) ([9f02a9f](https://github.com/vitejs/vite/commit/9f02a9f7d044775b3cdd1af0219b1fca93b93619)), closes [#16555](https://github.com/vitejs/vite/issues/16555)
* feat(asset): support `/*@vite-ignore*/` for `new URL(, import.meta.url)` (#16590) ([8880bc5](https://github.com/vitejs/vite/commit/8880bc5a9a09fcd1a2e0590048c0c61e47a43b73)), closes [#16590](https://github.com/vitejs/vite/issues/16590)
* chore(deps): update esbuild (#17290) ([5f13bf8](https://github.com/vitejs/vite/commit/5f13bf8cf9271dec2bdcbd056a019ece8b7b0881)), closes [#17290](https://github.com/vitejs/vite/issues/17290)

### Performance

* refactor: plugin container (#17288) ([4aa4a80](https://github.com/vitejs/vite/commit/4aa4a807c3d4fa93457e5958988edfdf8fe4533c)), closes [#17288](https://github.com/vitejs/vite/issues/17288)
* refactor: remove acorn (#16238) ([454e2d1](https://github.com/vitejs/vite/commit/454e2d1089d5979f7f4c3597fc24ac60183b109d)), closes [#16238](https://github.com/vitejs/vite/issues/16238)

### Fixes

* fix: typo in client log (#17363) ([68aa9f8](https://github.com/vitejs/vite/commit/68aa9f8e217c54809338d57b2fb60ff9d6e409c3)), closes [#17363](https://github.com/vitejs/vite/issues/17363)
* fix(ssrTransform): handle arbitrary module namespace identifiers (#17446) ([0a76652](https://github.com/vitejs/vite/commit/0a76652c335e7c0bd8d223186b5533c0e10cac90)), closes [#17446](https://github.com/vitejs/vite/issues/17446)
* fix: gracefully shutdown preview server on `SIGTERM` (fix #12990) (#17333) ([2207a68](https://github.com/vitejs/vite/commit/2207a68d9362bbe9f9ed5738ddee4e9e9825f0ec)), closes [#12990](https://github.com/vitejs/vite/issues/12990) [#17333](https://github.com/vitejs/vite/issues/17333)
* fix(css): ensure order of extracted CSS (#16588) ([a52ed1d](https://github.com/vitejs/vite/commit/a52ed1d640d5bc8afaac394e2326a514c0537fa6)), closes [#16588](https://github.com/vitejs/vite/issues/16588)
* fix(deps): update all non-major dependencies (#17430) ([4453d35](https://github.com/vitejs/vite/commit/4453d3578b343d16a8a5298bf154f280088968d9)), closes [#17430](https://github.com/vitejs/vite/issues/17430)
* fix(build): allow dynamic import treeshaking when injecting preload (#14221) ([f43f71f](https://github.com/vitejs/vite/commit/f43f71f22436832abaa0cac74f4e35e4f9c16e17)), closes [#14221](https://github.com/vitejs/vite/issues/14221)
* fix(css): handle lightningcss minification in Deno (#17372) ([b3f5bd1](https://github.com/vitejs/vite/commit/b3f5bd17e20aeb3a8072ca8a7ce2d5d40e1f80ff)), closes [#17372](https://github.com/vitejs/vite/issues/17372)
* fix(css): handle url replacing when preprocessing with lightningcss (#17364) ([6fbb5e0](https://github.com/vitejs/vite/commit/6fbb5e0a036faa835f4154ae0489db4c9b47c44c)), closes [#17364](https://github.com/vitejs/vite/issues/17364)
* fix(ssr): remove pure CSS dynamic import (#17371) ([67ff94b](https://github.com/vitejs/vite/commit/67ff94b70c0bd9a392a6b8941cfee61004b26970)), closes [#17371](https://github.com/vitejs/vite/issues/17371)
* fix(ssr): resolve interlocking circular dependency issues (#15395) ([687c38b](https://github.com/vitejs/vite/commit/687c38be8695481d905abe678e00e24a6fb011f5)), closes [#15395](https://github.com/vitejs/vite/issues/15395)
* fix: adjust import analysis behavior to match Node (#16738) ([f599ab4](https://github.com/vitejs/vite/commit/f599ab4ae4881aa5c0118563ca01128e5223c139)), closes [#16738](https://github.com/vitejs/vite/issues/16738)
* fix: prevent unhandledRejection if `--open` fails (#16726) ([1f60647](https://github.com/vitejs/vite/commit/1f60647885df0d74bcaa671da332fd02f3a757ae)), closes [#16726](https://github.com/vitejs/vite/issues/16726)
* fix(optimize-deps): don't externalize JS files imported with asset extensions (#16242) ([4161843](https://github.com/vitejs/vite/commit/416184376e128611215d257cc3ea6c1b23e61f2f)), closes [#16242](https://github.com/vitejs/vite/issues/16242)
* fix(proxy): rewrite the origin header to match the target for ws proxy (#16558) ([7b0a65e](https://github.com/vitejs/vite/commit/7b0a65e2002b8d09fd2fee0873b5fb8384fdf08b)), closes [#16558](https://github.com/vitejs/vite/issues/16558)

### Chore

* test: disable isolate for unit test (#17448) ([f16fae5](https://github.com/vitejs/vite/commit/f16fae582b218c8dce634d618a17cd653f784ae9)), closes [#17448](https://github.com/vitejs/vite/issues/17448)
* build: use esbuild to speedup building vite package (#17299) ([6db2515](https://github.com/vitejs/vite/commit/6db2515437121dd52e8930e255080fe1977ac552)), closes [#17299](https://github.com/vitejs/vite/issues/17299)
* chore: add error recovery option to LightningCSSOptions (#17420) ([e04193f](https://github.com/vitejs/vite/commit/e04193f26b8761e9c470187bb95a02c8b7c9d7e0)), closes [#17420](https://github.com/vitejs/vite/issues/17420)
* chore(deps): update dependency @rollup/plugin-commonjs to v26 (#17431) ([507b3de](https://github.com/vitejs/vite/commit/507b3defd3bbcf7527a08a58cf19e4090ed2eb24)), closes [#17431](https://github.com/vitejs/vite/issues/17431)
* chore: add region comment (#17370) ([a8c7083](https://github.com/vitejs/vite/commit/a8c7083a3d7d7fe2e83e994ff008f39ee4f298f8)), closes [#17370](https://github.com/vitejs/vite/issues/17370)
* chore(deps): update all non-major dependencies (#17373) ([f2d52f1](https://github.com/vitejs/vite/commit/f2d52f1384e4048ebe7d6bb8c5410e81540c469a)), closes [#17373](https://github.com/vitejs/vite/issues/17373)



### Previous Changelogs

#### [5.3.0-beta.2](https://github.com/vitejs/vite/compare/v5.3.0-beta.1...v5.3.0-beta.2) (2024-06-10)
See [5.3.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v5.3.0-beta.2/packages/vite/CHANGELOG.md)

#### [5.3.0-beta.1](https://github.com/vitejs/vite/compare/v5.3.0-beta.0...v5.3.0-beta.1) (2024-06-07)
See [5.3.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v5.3.0-beta.1/packages/vite/CHANGELOG.md)

#### [5.3.0-beta.0](https://github.com/vitejs/vite/compare/v5.2.12....v5.3.0-beta.0) (2024-05-30)
See [5.3.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v5.3.0-beta.0/packages/vite/CHANGELOG.md)




## <small>5.2.12 (2024-05-28)</small>

* chore: move to eslint flat config (#16743) ([8f16765](https://github.com/vitejs/vite/commit/8f167653ede5d61f9d08ffa86c91e218557199ae)), closes [#16743](https://github.com/vitejs/vite/issues/16743)
* chore(deps): remove unused deps (#17329) ([5a45745](https://github.com/vitejs/vite/commit/5a457454bfee1892b0d58c4b1c401cfb15986097)), closes [#17329](https://github.com/vitejs/vite/issues/17329)
* chore(deps): update all non-major dependencies (#16722) ([b45922a](https://github.com/vitejs/vite/commit/b45922a91d4a73c27f78f26e369b7b1fd8d800e3)), closes [#16722](https://github.com/vitejs/vite/issues/16722)
* fix: mention `build.rollupOptions.output.manualChunks` instead of  `build.rollupOutput.manualChunks` ([89378c0](https://github.com/vitejs/vite/commit/89378c07b64cc977fae2f231d087f24ba0e5d348)), closes [#16721](https://github.com/vitejs/vite/issues/16721)
* fix(build): make SystemJSWrapRE match lazy (#16633) ([6583ad2](https://github.com/vitejs/vite/commit/6583ad25a1333b80bfeb6829e6034266ab9bfc91)), closes [#16633](https://github.com/vitejs/vite/issues/16633)
* fix(css): avoid generating empty JS files when JS files becomes empty but has CSS files imported (#1 ([95fe5a7](https://github.com/vitejs/vite/commit/95fe5a79c434c0078075fc25e244689410447bab)), closes [#16078](https://github.com/vitejs/vite/issues/16078)
* fix(css): handle lightningcss compiled css in Deno (#17301) ([8e4e932](https://github.com/vitejs/vite/commit/8e4e932b4979bc40a03b0ffb65b960df62226def)), closes [#17301](https://github.com/vitejs/vite/issues/17301)
* fix(css): only use files the current bundle contains (#16684) ([15a6ebb](https://github.com/vitejs/vite/commit/15a6ebb414e3155583e3e9ad970afbdb598b0609)), closes [#16684](https://github.com/vitejs/vite/issues/16684)
* fix(css): page reload was not happening with .css?raw (#16455) ([8041846](https://github.com/vitejs/vite/commit/804184654b6858d35cefe16dfe269613d56d308a)), closes [#16455](https://github.com/vitejs/vite/issues/16455)
* fix(deps): update all non-major dependencies (#16603) ([6711553](https://github.com/vitejs/vite/commit/671155337af795156fe40a95935a8d2b27af1048)), closes [#16603](https://github.com/vitejs/vite/issues/16603)
* fix(deps): update all non-major dependencies (#16660) ([bf2f014](https://github.com/vitejs/vite/commit/bf2f0145fecb67ca2342c3530716f4c5ddd35a68)), closes [#16660](https://github.com/vitejs/vite/issues/16660)
* fix(deps): update all non-major dependencies (#17321) ([4a89766](https://github.com/vitejs/vite/commit/4a89766d838527c144f14e842211100b16792018)), closes [#17321](https://github.com/vitejs/vite/issues/17321)
* fix(error-logging): rollup errors weren't displaying id and codeframe (#16540) ([22dc196](https://github.com/vitejs/vite/commit/22dc19601e2d83e3db3ec86eb2a274934284ac05)), closes [#16540](https://github.com/vitejs/vite/issues/16540)
* fix(hmr): normalize the path info (#14255) ([6a085d0](https://github.com/vitejs/vite/commit/6a085d0467ca3b044b4f2108a323af3305a0eae7)), closes [#14255](https://github.com/vitejs/vite/issues/14255)
* fix(hmr): trigger page reload when calling invalidate on root module (#16636) ([2b61cc3](https://github.com/vitejs/vite/commit/2b61cc39a986c44d733aba8c23036d9d83667fac)), closes [#16636](https://github.com/vitejs/vite/issues/16636)
* fix(logger): truncate log over 5000 characters long (#16581) ([b0b839a](https://github.com/vitejs/vite/commit/b0b839accc88d8b3326733a94f76cb7c527fdb06)), closes [#16581](https://github.com/vitejs/vite/issues/16581)
* fix(optimizer): log dependencies added by plugins (#16729) ([f0fb987](https://github.com/vitejs/vite/commit/f0fb9876deef3c66c60a2d0588a140f11a977011)), closes [#16729](https://github.com/vitejs/vite/issues/16729)
* fix(sourcemap): improve sourcemap compatibility for vue2 (#16594) ([913c040](https://github.com/vitejs/vite/commit/913c0403a5de13a09dd37dac71f59db3339012ce)), closes [#16594](https://github.com/vitejs/vite/issues/16594)
* docs: correct proxy shorthand example (#15938) ([abf766e](https://github.com/vitejs/vite/commit/abf766e939a0f02e5c08959bd101a6c72a29558b)), closes [#15938](https://github.com/vitejs/vite/issues/15938)
* docs: deprecate server.hot (#16741) ([e7d38ab](https://github.com/vitejs/vite/commit/e7d38ab1c45b9d17f182f89d0c129932e2f994eb)), closes [#16741](https://github.com/vitejs/vite/issues/16741)

## <small>5.2.11 (2024-05-02)</small>

* feat: improve dynamic import variable failure error message (#16519) ([f8feeea](https://github.com/vitejs/vite/commit/f8feeea41c3f505d8491fa9b299c26deaad9106a)), closes [#16519](https://github.com/vitejs/vite/issues/16519)
* fix: dynamic-import-vars plugin normalize path issue (#16518) ([f71ba5b](https://github.com/vitejs/vite/commit/f71ba5b94a6e862460a96c7bf5e16d8ae66f9fe7)), closes [#16518](https://github.com/vitejs/vite/issues/16518)
* fix: scripts and styles were missing from built HTML on Windows (#16421) ([0e93f58](https://github.com/vitejs/vite/commit/0e93f588b9056ca2535c23430ea0a176c53c8202)), closes [#16421](https://github.com/vitejs/vite/issues/16421)
* fix(deps): update all non-major dependencies (#16488) ([2d50be2](https://github.com/vitejs/vite/commit/2d50be2a5424e4f4c22774652ed313d2a232f8af)), closes [#16488](https://github.com/vitejs/vite/issues/16488)
* fix(deps): update all non-major dependencies (#16549) ([2d6a13b](https://github.com/vitejs/vite/commit/2d6a13b0aa1f3860482dac2ce260cfbb0713033f)), closes [#16549](https://github.com/vitejs/vite/issues/16549)
* fix(dev): watch publicDir explicitly to include it outside the root (#16502) ([4d83eb5](https://github.com/vitejs/vite/commit/4d83eb58cdea0d2e4ec4f0da6e1dd6b72014e67e)), closes [#16502](https://github.com/vitejs/vite/issues/16502)
* fix(preload): skip preload for non-static urls (#16556) ([bb79c9b](https://github.com/vitejs/vite/commit/bb79c9b653eeab366dccc855713369aea9f90d8f)), closes [#16556](https://github.com/vitejs/vite/issues/16556)
* fix(ssr): handle class declaration and expression name scoping (#16569) ([c071eb3](https://github.com/vitejs/vite/commit/c071eb38221bdd9981e061472a8b6f402ea21138)), closes [#16569](https://github.com/vitejs/vite/issues/16569)
* fix(ssr): handle function expression name scoping (#16563) ([02db947](https://github.com/vitejs/vite/commit/02db9479acfa022503a6e668d347360d916cc298)), closes [#16563](https://github.com/vitejs/vite/issues/16563)



## <small>5.2.10 (2024-04-20)</small>

* revert: perf: use workspace root for fs cache (#15712) (#16476) ([77e7359](https://github.com/vitejs/vite/commit/77e73590837f710d79d1653e1800eed03b5dbb41)), closes [#15712](https://github.com/vitejs/vite/issues/15712) [#16476](https://github.com/vitejs/vite/issues/16476)
* fix: add base to virtual html (#16442) ([721f94d](https://github.com/vitejs/vite/commit/721f94ddacdc8cbc4342a9c791d7fecba5a0f7ca)), closes [#16442](https://github.com/vitejs/vite/issues/16442)
* fix: adjust esm syntax judgment logic (#16436) ([af72eab](https://github.com/vitejs/vite/commit/af72eabab170c05a7b1e7fb99000e1344ff83a37)), closes [#16436](https://github.com/vitejs/vite/issues/16436)
* fix: don't add outDirs to watch.ignored if emptyOutDir is false (#16453) ([6a127d6](https://github.com/vitejs/vite/commit/6a127d67ba953004ab10c21b50429050c7eadf11)), closes [#16453](https://github.com/vitejs/vite/issues/16453)
* fix(cspNonce): don't overwrite existing nonce values (#16415) ([b872635](https://github.com/vitejs/vite/commit/b8726357c90fb6b641e8c6654e25a5d7e8fa29d4)), closes [#16415](https://github.com/vitejs/vite/issues/16415)
* feat: show warning if root is in build.outDir (#16454) ([11444dc](https://github.com/vitejs/vite/commit/11444dcee0404bae738e61b903acf37163915d6e)), closes [#16454](https://github.com/vitejs/vite/issues/16454)
* feat: write cspNonce to style tags (#16419) ([8e54bbd](https://github.com/vitejs/vite/commit/8e54bbd74d86537b449641a6623b1bc3800e82b2)), closes [#16419](https://github.com/vitejs/vite/issues/16419)
* chore(deps): update dependency eslint-plugin-n to v17 (#16381) ([6cccef7](https://github.com/vitejs/vite/commit/6cccef78a52492c24d9b28f3a1784824f34f5cc3)), closes [#16381](https://github.com/vitejs/vite/issues/16381)



## <small>5.2.9 (2024-04-15)</small>

* fix: `fsp.rm` removing files does not take effect (#16032) ([b05c405](https://github.com/vitejs/vite/commit/b05c405f6884f9612fd8b6c1e7587a553cf58baf)), closes [#16032](https://github.com/vitejs/vite/issues/16032)
* fix: fix accumulated stacks in error overlay (#16393) ([102c2fd](https://github.com/vitejs/vite/commit/102c2fd5ad32a607f2b14dd728e8a802b7ddce34)), closes [#16393](https://github.com/vitejs/vite/issues/16393)
* fix(deps): update all non-major dependencies (#16376) ([58a2938](https://github.com/vitejs/vite/commit/58a2938a9766981fdc2ed89bec8ff1c96cae0716)), closes [#16376](https://github.com/vitejs/vite/issues/16376)
* chore: update region comment (#16380) ([77562c3](https://github.com/vitejs/vite/commit/77562c3ff2005c7ca7fc3749214c76d019fff4e3)), closes [#16380](https://github.com/vitejs/vite/issues/16380)
* perf: reduce size of injected __vite__mapDeps code (#16184) ([c0ec6be](https://github.com/vitejs/vite/commit/c0ec6bea69b6160553f4a5b30652dcef891788fc)), closes [#16184](https://github.com/vitejs/vite/issues/16184)
* perf(css): only replace empty chunk if imported (#16349) ([e2658ad](https://github.com/vitejs/vite/commit/e2658ad6fe81278069d75d0b3b9c260c3021b922)), closes [#16349](https://github.com/vitejs/vite/issues/16349)



## <small>5.2.8 (2024-04-03)</small>

* fix: csp nonce injection when no closing tag (#16281) (#16282) ([3c85c6b](https://github.com/vitejs/vite/commit/3c85c6b52edbae22cf812e72680d210a644d9313)), closes [#16281](https://github.com/vitejs/vite/issues/16281) [#16282](https://github.com/vitejs/vite/issues/16282)
* fix: do not access document in `/@vite/client` when not defined (#16318) ([646319c](https://github.com/vitejs/vite/commit/646319cc845f24a12ac5f8f6d176597a5bf66fd3)), closes [#16318](https://github.com/vitejs/vite/issues/16318)
* fix: fix sourcemap when using object as `define` value  (#15805) ([445c4f2](https://github.com/vitejs/vite/commit/445c4f21583334edb37c7b32a1474903a0852b01)), closes [#15805](https://github.com/vitejs/vite/issues/15805)
* fix(css): unknown file error happened with lightningcss (#16306) ([01af308](https://github.com/vitejs/vite/commit/01af308dfd271df604a3fc9e9b3a9fcc2063e5d8)), closes [#16306](https://github.com/vitejs/vite/issues/16306)
* fix(hmr): multiple updates happened when invalidate is called while multiple tabs open (#16307) ([21cc10b](https://github.com/vitejs/vite/commit/21cc10bfda99a5818bfd709beff260e72b4b4ec5)), closes [#16307](https://github.com/vitejs/vite/issues/16307)
* fix(scanner): duplicate modules for same id if glob is used in html-like types (#16305) ([eca68fa](https://github.com/vitejs/vite/commit/eca68fa942818b69d08eae4dceaf46a330684a5e)), closes [#16305](https://github.com/vitejs/vite/issues/16305)
* chore(deps): update all non-major dependencies (#16325) ([a78e265](https://github.com/vitejs/vite/commit/a78e265822ebf06c5775c2083ee345e974488c6b)), closes [#16325](https://github.com/vitejs/vite/issues/16325)
* refactor: use types from sass instead of @types/sass (#16340) ([4581e83](https://github.com/vitejs/vite/commit/4581e8371d0c2481e859f4496f928d1dcacd3a9d)), closes [#16340](https://github.com/vitejs/vite/issues/16340)



## <small>5.2.7 (2024-03-29)</small>

* chore: deprecate splitVendorChunkPlugin (#16274) ([45a06da](https://github.com/vitejs/vite/commit/45a06daac82524cf318a4dff7ae0b5f9cf67a0b2)), closes [#16274](https://github.com/vitejs/vite/issues/16274)
* fix: skip injecting `__vite__mapDeps` when it's not used (#16271) ([890538a](https://github.com/vitejs/vite/commit/890538a694d683fcd3fdd00ef6545d6760a1d1bc)), closes [#16271](https://github.com/vitejs/vite/issues/16271)
* fix(deps): update all non-major dependencies (#16258) ([7caef42](https://github.com/vitejs/vite/commit/7caef4216e16d9ac71e38598a9ecedce2281d42f)), closes [#16258](https://github.com/vitejs/vite/issues/16258)
* fix(hmr): don't mutate module graph when collecting modules (#16302) ([dfffea1](https://github.com/vitejs/vite/commit/dfffea1f4363c07d6ebc05db6f0dae8bd8a0885d)), closes [#16302](https://github.com/vitejs/vite/issues/16302)
* fix(hmr): trigger hmr for missing file import errored module after file creation (#16303) ([ffedc06](https://github.com/vitejs/vite/commit/ffedc06cab6357fe8857a2bc432d57adef3c34d3)), closes [#16303](https://github.com/vitejs/vite/issues/16303)
* fix(sourcemap): don't warn even if the sourcesContent is an empty string (#16273) ([24e376a](https://github.com/vitejs/vite/commit/24e376ad8624ac9ca2f8f49b3c3e06947a0f0ce2)), closes [#16273](https://github.com/vitejs/vite/issues/16273)
* feat(hmr): reload when HTML file is created/deleted (#16288) ([1f53796](https://github.com/vitejs/vite/commit/1f5379601e80d63916b7d77dd16d5dd8387e0002)), closes [#16288](https://github.com/vitejs/vite/issues/16288)



## <small>5.2.6 (2024-03-24)</small>

* fix: `fs.deny` with globs with directories (#16250) ([ba5269c](https://github.com/vitejs/vite/commit/ba5269cca81de3f5fbb0f49d58a1c55688043258)), closes [#16250](https://github.com/vitejs/vite/issues/16250)



## <small>5.2.5 (2024-03-24)</small>

* fix: avoid SSR requests in waitForRequestIdle (#16246) ([7093f77](https://github.com/vitejs/vite/commit/7093f779b7db2e0fdcb3f41affd76696b783a5fc)), closes [#16246](https://github.com/vitejs/vite/issues/16246)
* docs: clarify enforce vs hook.order (#16226) ([3a73e48](https://github.com/vitejs/vite/commit/3a73e485cd4c08954fcb06698b5f721dea6e9f44)), closes [#16226](https://github.com/vitejs/vite/issues/16226)



## <small>5.2.4 (2024-03-23)</small>

* fix: dont resolve imports with malformed URI (#16244) ([fbf69d5](https://github.com/vitejs/vite/commit/fbf69d5f6cef335fc18640fed7da16593b13c9b3)), closes [#16244](https://github.com/vitejs/vite/issues/16244)



## <small>5.2.3 (2024-03-22)</small>

* fix: handle warmup request error correctly (#16223) ([d7c5256](https://github.com/vitejs/vite/commit/d7c52569963508a33516dc892e65edf0def36088)), closes [#16223](https://github.com/vitejs/vite/issues/16223)
* fix: skip encode if is data uri (#16233) ([8617e76](https://github.com/vitejs/vite/commit/8617e7638ec105c7a6019a7ebac3b3185297b90d)), closes [#16233](https://github.com/vitejs/vite/issues/16233)
* fix(optimizer): fix `optimizeDeps.include` glob syntax for `./*` exports (#16230) ([f184c80](https://github.com/vitejs/vite/commit/f184c8032bec6e668265a98d254a442e1024b6f3)), closes [#16230](https://github.com/vitejs/vite/issues/16230)
* fix(runtime): fix sourcemap with `prepareStackTrace` (#16220) ([dad7f4f](https://github.com/vitejs/vite/commit/dad7f4f5a51433c2ac91a8aed1a5556a1e3fc640)), closes [#16220](https://github.com/vitejs/vite/issues/16220)
* chore: `utf8` replaced with `utf-8` (#16232) ([9800c73](https://github.com/vitejs/vite/commit/9800c738b53f09da6d8f996255a831303983a376)), closes [#16232](https://github.com/vitejs/vite/issues/16232)



## <small>5.2.2 (2024-03-20)</small>

* fix(importAnalysis): skip encode in ssr (#16213) ([e4d2d60](https://github.com/vitejs/vite/commit/e4d2d601177c2dd58fe672e2da9d9e487595fbf3)), closes [#16213](https://github.com/vitejs/vite/issues/16213)



## <small>5.2.1 (2024-03-20)</small>

* fix: encode path uri only (#16212) ([0b2e40b](https://github.com/vitejs/vite/commit/0b2e40b1a0ff97cd9bb6f010b9245d8695c82733)), closes [#16212](https://github.com/vitejs/vite/issues/16212)



## 5.2.0 (2024-03-20)

* fix: update client.ts@cleanUrl to accomodate blob protocol (#16182) ([1a3b1d7](https://github.com/vitejs/vite/commit/1a3b1d73d7babdab6a52a5fb1ef193fd63666877)), closes [#16182](https://github.com/vitejs/vite/issues/16182)
* fix(assets): avoid splitting `,` inside query parameter of image URI in srcset property (#16081) ([50caf67](https://github.com/vitejs/vite/commit/50caf673f635f5a77f4cd72297c40fb4d77ead9b)), closes [#16081](https://github.com/vitejs/vite/issues/16081)
* chore(deps): update all non-major dependencies (#16186) ([842643d](https://github.com/vitejs/vite/commit/842643d82b5fc2b17e994cf47f8fc1a39c09201e)), closes [#16186](https://github.com/vitejs/vite/issues/16186)
* perf(transformRequest): fast-path watch and sourcemap handling (#16170) ([de60f1e](https://github.com/vitejs/vite/commit/de60f1e3d1eb03167362cf8ce0c6c4071430f812)), closes [#16170](https://github.com/vitejs/vite/issues/16170)
* docs: add `@shikiji/vitepress-twoslash` (#16168) ([6f8a320](https://github.com/vitejs/vite/commit/6f8a3206653127a1ca9e20880af117d3a7c4fadc)), closes [#16168](https://github.com/vitejs/vite/issues/16168)



## 5.2.0-beta.1 (2024-03-14)

* feat: csp nonce support (#16052) ([1d5eec4](https://github.com/vitejs/vite/commit/1d5eec477e5f1951e024e2105fd4a7ad536cb48b)), closes [#16052](https://github.com/vitejs/vite/issues/16052)
* feat: formalize waitForRequestsIdle (experimental) (#16135) ([9888843](https://github.com/vitejs/vite/commit/98888439e07c1dc6425deea3474330ad27b8bf33)), closes [#16135](https://github.com/vitejs/vite/issues/16135)
* feat(optimizer): show a friendly warning with 404 instead of 504 outdated optimize dep (#16080) ([7ee4261](https://github.com/vitejs/vite/commit/7ee426194f2c675ec9c5f6ffcaffd3229f3271ae)), closes [#16080](https://github.com/vitejs/vite/issues/16080)
* fix: `sideEffects: []` should work as `sideEffects: false` (#16152) ([f377a84](https://github.com/vitejs/vite/commit/f377a840ad79e1f9b5a5aa3251c41d6c3445fef6)), closes [#16152](https://github.com/vitejs/vite/issues/16152)
* fix(esbuild): preserve import.meta even if esbuild.target is set to lower versions (#16151) ([6f77b2b](https://github.com/vitejs/vite/commit/6f77b2b22012ad1b810f4ec0511609ead35363dd)), closes [#16151](https://github.com/vitejs/vite/issues/16151)
* fix(ssr): crash on circular import (#14441) ([8cd846c](https://github.com/vitejs/vite/commit/8cd846cdbf5cc3214e6a32accf31a187726a23cd)), closes [#14441](https://github.com/vitejs/vite/issues/14441)



## 5.2.0-beta.0 (2024-03-12)

* chore: use `@polka/compression` (#16146) ([592c95a](https://github.com/vitejs/vite/commit/592c95ad5423c63ecbf4ce86266e2ff0699f1b75)), closes [#16146](https://github.com/vitejs/vite/issues/16146)
* chore(deps): bump rollup to 4.13.0 (#15295) ([2f95c2b](https://github.com/vitejs/vite/commit/2f95c2bd9e95b6d005f53ede25163dfd6ea546d6)), closes [#15295](https://github.com/vitejs/vite/issues/15295)
* feat: accept assets to be specified as input (#16087) ([75a9fc6](https://github.com/vitejs/vite/commit/75a9fc668f97bfd0fe79891e9ebc5713b2a22471)), closes [#16087](https://github.com/vitejs/vite/issues/16087)
* feat: add entry name to manifest (#15849) ([6d6ae10](https://github.com/vitejs/vite/commit/6d6ae10f5d80a9c9b6737377333424fe76652b81)), closes [#15849](https://github.com/vitejs/vite/issues/15849)
* feat: convert overlay template to DOM (#15852) ([dd49505](https://github.com/vitejs/vite/commit/dd49505cfd623cf547e957f18f4af99e64bf7c92)), closes [#15852](https://github.com/vitejs/vite/issues/15852)
* feat: support for self-referencing (#16068) ([03b9674](https://github.com/vitejs/vite/commit/03b9674cb294e96ba118600262d22a567c5ae7aa)), closes [#16068](https://github.com/vitejs/vite/issues/16068)
* feat(config): `import.meta.filename`/`dirname` support (#15888) ([3efb1a1](https://github.com/vitejs/vite/commit/3efb1a11a0f22bdc49dc619b6a53f41d6932da07)), closes [#15888](https://github.com/vitejs/vite/issues/15888)
* feat(resolve): auto externalize node builtins for `noExternal: true` in node (#16019) ([1cc88c1](https://github.com/vitejs/vite/commit/1cc88c13d8bbe48d037d27a4f26a85dd825daae6)), closes [#16019](https://github.com/vitejs/vite/issues/16019)
* feat(ssr): `import.meta.filename`/`dirname` support (#15887) ([74dc73a](https://github.com/vitejs/vite/commit/74dc73a5705294a886d55060867601cee0ecfeb4)), closes [#15887](https://github.com/vitejs/vite/issues/15887)
* fix: apply correct fs restrictions for Yarn PnP when serving files from node_modules (#15957) ([a149d9e](https://github.com/vitejs/vite/commit/a149d9e9559b9e56b5c8a653edcd67d15b4849b0)), closes [#15957](https://github.com/vitejs/vite/issues/15957)
* fix: encode URLs correctly (fix #15298) (#15311) ([b10d162](https://github.com/vitejs/vite/commit/b10d1628d56a8105a5c3dd583bb0a3094ec8d30d)), closes [#15298](https://github.com/vitejs/vite/issues/15298) [#15311](https://github.com/vitejs/vite/issues/15311)
* fix: upgrade esbuild to 0.20.x (#16079) ([30e5ae3](https://github.com/vitejs/vite/commit/30e5ae361673628abf78a8ebb492e2ff171dca65)), closes [#16079](https://github.com/vitejs/vite/issues/16079)
* fix(css): treeshake css modules (#16051) ([17d71ec](https://github.com/vitejs/vite/commit/17d71ecf74bdcb16fd1d80c13106a28f804c325f)), closes [#16051](https://github.com/vitejs/vite/issues/16051)
* fix(hmr): call dispose before prune (#15782) ([57628dc](https://github.com/vitejs/vite/commit/57628dc780fde15ae64f95557cc87c35344af6b9)), closes [#15782](https://github.com/vitejs/vite/issues/15782)
* fix(ssr): apply alias to resolvable dependencies during dev (#15602) ([8e54af6](https://github.com/vitejs/vite/commit/8e54af67dbe5f94b57c65caea707341dcdca7828)), closes [#15602](https://github.com/vitejs/vite/issues/15602)
* refactor: normalize cache package dir (#15546) ([e030f4b](https://github.com/vitejs/vite/commit/e030f4bfd1104703ea2ff825c8cb1b93a771cacc)), closes [#15546](https://github.com/vitejs/vite/issues/15546)
* style: update overlay style on mobile (#15760) ([4559ac0](https://github.com/vitejs/vite/commit/4559ac02ed511c9b9314866c170a79543b677cfe)), closes [#15760](https://github.com/vitejs/vite/issues/15760)



## <small>5.1.6 (2024-03-11)</small>

* chore(deps): update all non-major dependencies (#16131) ([a862ecb](https://github.com/vitejs/vite/commit/a862ecb941a432b6e3bab62331012e4b53ddd4e8)), closes [#16131](https://github.com/vitejs/vite/issues/16131)
* fix: check for publicDir before checking if it is a parent directory (#16046) ([b6fb323](https://github.com/vitejs/vite/commit/b6fb3235c33b1490eb0d7a33b2b62d6fa7a5496f)), closes [#16046](https://github.com/vitejs/vite/issues/16046)
* fix: escape single quote when relative base is used (#16060) ([8f74ce4](https://github.com/vitejs/vite/commit/8f74ce4ff3c159c7f797ab024200d7893a29fbfe)), closes [#16060](https://github.com/vitejs/vite/issues/16060)
* fix: handle function property extension in namespace import (#16113) ([f699194](https://github.com/vitejs/vite/commit/f6991948f59e36bc5d108e2befa5883be99f934f)), closes [#16113](https://github.com/vitejs/vite/issues/16113)
* fix: server middleware mode resolve (#16122) ([8403546](https://github.com/vitejs/vite/commit/840354601a2dbdb6419429999e1f9feff31a641f)), closes [#16122](https://github.com/vitejs/vite/issues/16122)
* fix(esbuild): update tsconfck to fix bug that could cause a deadlock  (#16124) ([fd9de04](https://github.com/vitejs/vite/commit/fd9de0473e075c8d69bb3a8867ab15300506e67b)), closes [#16124](https://github.com/vitejs/vite/issues/16124)
* fix(worker): hide "The emitted file overwrites" warning if the content is same (#16094) ([60dfa9e](https://github.com/vitejs/vite/commit/60dfa9e15c5cb052db45356c574ae724d86ca73b)), closes [#16094](https://github.com/vitejs/vite/issues/16094)
* fix(worker): throw error when circular worker import is detected and support self referencing worker ([eef9da1](https://github.com/vitejs/vite/commit/eef9da13d0028161eacc0ea699988814f29a56e4)), closes [#16103](https://github.com/vitejs/vite/issues/16103)
* style(utils): remove null check (#16112) ([0d2df52](https://github.com/vitejs/vite/commit/0d2df527168dec95b2967a3013bbf8c1ec8b0286)), closes [#16112](https://github.com/vitejs/vite/issues/16112)
* refactor(runtime): share more code between runtime and main bundle (#16063) ([93be84e](https://github.com/vitejs/vite/commit/93be84eccde7623781d4be17d63a8bc5bc88a0f5)), closes [#16063](https://github.com/vitejs/vite/issues/16063)



## <small>5.1.5 (2024-03-04)</small>

* fix: `__vite__mapDeps` code injection (#15732) ([aff54e1](https://github.com/vitejs/vite/commit/aff54e1d5e3129a442aeec8b6aef024024ba5b1b)), closes [#15732](https://github.com/vitejs/vite/issues/15732)
* fix: analysing build chunk without dependencies (#15469) ([bd52283](https://github.com/vitejs/vite/commit/bd52283a70a1451a4ad6f058787b18382d306880)), closes [#15469](https://github.com/vitejs/vite/issues/15469)
* fix: import with query with imports field (#16085) ([ab823ab](https://github.com/vitejs/vite/commit/ab823ab618c2036913076abe15c10fd7fbe4d6ba)), closes [#16085](https://github.com/vitejs/vite/issues/16085)
* fix: normalize literal-only entry pattern (#16010) ([1dccc37](https://github.com/vitejs/vite/commit/1dccc3713a383ac274a36dfcaabcaaa88e380bd1)), closes [#16010](https://github.com/vitejs/vite/issues/16010)
* fix: optimizeDeps.entries with literal-only pattern(s) (#15853) ([49300b3](https://github.com/vitejs/vite/commit/49300b3487ec8a057b61e29466d4595c577cd225)), closes [#15853](https://github.com/vitejs/vite/issues/15853)
* fix: output correct error for empty import specifier (#16055) ([a9112eb](https://github.com/vitejs/vite/commit/a9112ebb2111f9d7059138a5287a587947606f92)), closes [#16055](https://github.com/vitejs/vite/issues/16055)
* fix: upgrade esbuild to 0.20.x (#16062) ([899d9b1](https://github.com/vitejs/vite/commit/899d9b1d272b7057aafc6fa01570d40f288a473b)), closes [#16062](https://github.com/vitejs/vite/issues/16062)
* fix(runtime): runtime HMR affects only imported files (#15898) ([57463fc](https://github.com/vitejs/vite/commit/57463fc53fedc8f29e05ef3726f156a6daf65a94)), closes [#15898](https://github.com/vitejs/vite/issues/15898)
* fix(scanner): respect  `experimentalDecorators: true` (#15206) ([4144781](https://github.com/vitejs/vite/commit/4144781fbcebb9143fb28caac05db97ca149d8a9)), closes [#15206](https://github.com/vitejs/vite/issues/15206)
* revert: "fix: upgrade esbuild to 0.20.x" (#16072) ([11cceea](https://github.com/vitejs/vite/commit/11cceeab392504c1af262a0fa033345f22c6ffae)), closes [#16072](https://github.com/vitejs/vite/issues/16072)
* refactor: share code with vite runtime (#15907) ([b20d542](https://github.com/vitejs/vite/commit/b20d54257e6105333c19676a403c574667878e0f)), closes [#15907](https://github.com/vitejs/vite/issues/15907)
* refactor(runtime): use functions from `pathe` (#16061) ([aac2ef7](https://github.com/vitejs/vite/commit/aac2ef77521f66ddd908f9d97020b8df532148cf)), closes [#16061](https://github.com/vitejs/vite/issues/16061)
* chore(deps): update all non-major dependencies (#16028) ([7cfe80d](https://github.com/vitejs/vite/commit/7cfe80d0df7edfe861b8cc281303f20fc7633841)), closes [#16028](https://github.com/vitejs/vite/issues/16028)



## <small>5.1.4 (2024-02-21)</small>

* perf: remove unnecessary regex s modifier (#15766) ([8dc1b73](https://github.com/vitejs/vite/commit/8dc1b731463bfa5c2cb0c159b98050b55377581c)), closes [#15766](https://github.com/vitejs/vite/issues/15766)
* fix: fs cached checks disabled by default for yarn pnp (#15920) ([8b11fea](https://github.com/vitejs/vite/commit/8b11fea91560c5f084c31aa9b19e64832ac6c3b5)), closes [#15920](https://github.com/vitejs/vite/issues/15920)
* fix: resolve directory correctly when `fs.cachedChecks: true` (#15983) ([4fe971f](https://github.com/vitejs/vite/commit/4fe971fda39ab1a323461c09b35108cc7a271484)), closes [#15983](https://github.com/vitejs/vite/issues/15983)
* fix: srcSet with optional descriptor (#15905) ([81b3bd0](https://github.com/vitejs/vite/commit/81b3bd09cff926534ea667edfa5417b944cdf01c)), closes [#15905](https://github.com/vitejs/vite/issues/15905)
* fix(deps): update all non-major dependencies (#15959) ([571a3fd](https://github.com/vitejs/vite/commit/571a3fde438d60540cfeba132e24646badf5ff2f)), closes [#15959](https://github.com/vitejs/vite/issues/15959)
* fix(watch): build watch fails when outDir is empty string (#15979) ([1d263d3](https://github.com/vitejs/vite/commit/1d263d39d32838cf5b77eeb44426ae81e969309c)), closes [#15979](https://github.com/vitejs/vite/issues/15979)



## <small>5.1.3 (2024-02-15)</small>

* fix: cachedTransformMiddleware for direct css requests (#15919) ([5099028](https://github.com/vitejs/vite/commit/509902807c841742e0d64ca7ea12c0b44ab54489)), closes [#15919](https://github.com/vitejs/vite/issues/15919)
* refactor(runtime): minor tweaks (#15904) ([63a39c2](https://github.com/vitejs/vite/commit/63a39c244b08cf1f2299bc2c3cfddcb82070d05b)), closes [#15904](https://github.com/vitejs/vite/issues/15904)
* refactor(runtime): seal ES module namespace object instead of feezing (#15914) ([4172f02](https://github.com/vitejs/vite/commit/4172f02b70a8ae44bb8f3bc22d5fd5cffe458274)), closes [#15914](https://github.com/vitejs/vite/issues/15914)



## <small>5.1.2 (2024-02-14)</small>

* fix: normalize import file path info (#15772) ([306df44](https://github.com/vitejs/vite/commit/306df44f6eebd49d2b5ee4216701b447eb65bd1b)), closes [#15772](https://github.com/vitejs/vite/issues/15772)
* fix(build): do not output build time when build fails (#15711) ([added3e](https://github.com/vitejs/vite/commit/added3ee101522d0cf0c318ac1c2016c10271c47)), closes [#15711](https://github.com/vitejs/vite/issues/15711)
* fix(runtime): pass path instead of fileURL to `isFilePathESM` (#15908) ([7b15607](https://github.com/vitejs/vite/commit/7b1560765e474869c2f2096cff6d519ef01afe48)), closes [#15908](https://github.com/vitejs/vite/issues/15908)
* fix(worker): support UTF-8 encoding in inline workers (fixes #12117) (#15866) ([570e0f1](https://github.com/vitejs/vite/commit/570e0f185203ceec02b89ff53c7a13add1309e77)), closes [#12117](https://github.com/vitejs/vite/issues/12117) [#15866](https://github.com/vitejs/vite/issues/15866)
* chore: update license file (#15885) ([d9adf18](https://github.com/vitejs/vite/commit/d9adf18e634c1790d9d64c5624a0d0be268711ac)), closes [#15885](https://github.com/vitejs/vite/issues/15885)
* chore(deps): update all non-major dependencies (#15874) ([d16ce5d](https://github.com/vitejs/vite/commit/d16ce5db2f0c4dd327093bae2cbaab0d20c511e9)), closes [#15874](https://github.com/vitejs/vite/issues/15874)
* chore(deps): update dependency dotenv-expand to v11 (#15875) ([642d528](https://github.com/vitejs/vite/commit/642d528b7b403eb91c67ff809ffa0fb99a1ff56e)), closes [#15875](https://github.com/vitejs/vite/issues/15875)



## <small>5.1.1 (2024-02-09)</small>

* fix: empty CSS file was output when only .css?url is used (#15846) ([b2873ac](https://github.com/vitejs/vite/commit/b2873ac3936de25ca8784327cb9ef16bd4881805)), closes [#15846](https://github.com/vitejs/vite/issues/15846)
* fix: skip not only .js but also .mjs manifest entries (#15841) ([3d860e7](https://github.com/vitejs/vite/commit/3d860e7916b9b160da39d080d7d6d72ab8d56ae9)), closes [#15841](https://github.com/vitejs/vite/issues/15841)
* chore: post 5.1 release edits (#15840) ([9da6502](https://github.com/vitejs/vite/commit/9da6502fe7015d33aaaae59031f7f3aa448f484b)), closes [#15840](https://github.com/vitejs/vite/issues/15840)



## 5.1.0 (2024-02-08)

Vite 5.1 is out! Read the announcement blog post at https://vite.dev/blog/announcing-vite5-1!


* chore: revert #15746 (#15839) ([ed875f8](https://github.com/vitejs/vite/commit/ed875f88f6e40333807001279d29d45789fe8c21)), closes [#15746](https://github.com/vitejs/vite/issues/15746) [#15839](https://github.com/vitejs/vite/issues/15839)
* fix: pass `customLogger` to `loadConfigFromFile` (fix #15824) (#15831) ([55a3427](https://github.com/vitejs/vite/commit/55a3427ef8ff491de913f304cb404551e33265bd)), closes [#15824](https://github.com/vitejs/vite/issues/15824) [#15831](https://github.com/vitejs/vite/issues/15831)
* fix(deps): update all non-major dependencies (#15803) ([e0a6ef2](https://github.com/vitejs/vite/commit/e0a6ef2b9e6f1df8c5e71efab6182b7cf662d18d)), closes [#15803](https://github.com/vitejs/vite/issues/15803)
* refactor: remove `vite build --force` (#15837) ([f1a4242](https://github.com/vitejs/vite/commit/f1a42429e1d24230a4a78cca82657e2d3602a7b2)), closes [#15837](https://github.com/vitejs/vite/issues/15837)



## 5.1.0-beta.7 (2024-02-07)

* fix: disable fs.cachedChecks for custom watch ignore patterns (#15828) ([9070be3](https://github.com/vitejs/vite/commit/9070be36eb8dcbf027d44844addbe0a1ca2c492b)), closes [#15828](https://github.com/vitejs/vite/issues/15828)
* fix: judge next dirent cache type (#15787) ([5fbeba3](https://github.com/vitejs/vite/commit/5fbeba315699b06928df49a5920c0552a9ef0317)), closes [#15787](https://github.com/vitejs/vite/issues/15787)
* fix: scan entries when the root is in node_modules (#15746) ([c3e83bb](https://github.com/vitejs/vite/commit/c3e83bb078e84a8a2d377455801b2a689557763e)), closes [#15746](https://github.com/vitejs/vite/issues/15746)
* fix(config): improved warning when root path includes bad characters (#15761) ([1c0dc3d](https://github.com/vitejs/vite/commit/1c0dc3db2c8f19b5a8411a159765667800acae13)), closes [#15761](https://github.com/vitejs/vite/issues/15761)
* docs: fix typos in CHANGELOG (#15825) ([3ee4e7b](https://github.com/vitejs/vite/commit/3ee4e7b083a17703cc9b1478146d8510f3729849)), closes [#15825](https://github.com/vitejs/vite/issues/15825)
* perf: use transform cache by resolved id (#15785) ([78d838a](https://github.com/vitejs/vite/commit/78d838a23bae44bd1b657c39e0989a8cf5d5fcf0)), closes [#15785](https://github.com/vitejs/vite/issues/15785)
* chore: release notes (#15777) ([775bb50](https://github.com/vitejs/vite/commit/775bb5026ee1d7e15b75c8829e7f528c1b26c493)), closes [#15777](https://github.com/vitejs/vite/issues/15777)



## 5.1.0-beta.6 (2024-02-01)

* feat: experimental Vite Runtime API (#12165) ([8b3ab07](https://github.com/vitejs/vite/commit/8b3ab0771842bda44129148c07739ebd86bdd62f)), closes [#12165](https://github.com/vitejs/vite/issues/12165)
* fix: add ref() and unref() to chokidar.d.ts for typescript build to work (#15706) ([6b45037](https://github.com/vitejs/vite/commit/6b45037bda9b69bb51bfb7cd9a41e0d978feb11a)), closes [#15706](https://github.com/vitejs/vite/issues/15706)
* perf: simplify explicit import mark in import analysis (#15724) ([2805b2d](https://github.com/vitejs/vite/commit/2805b2d2f2ad216811092fc4e5df938aedbe21a2)), closes [#15724](https://github.com/vitejs/vite/issues/15724)



## 5.1.0-beta.5 (2024-01-27)

* fix: do not init optimizer during build (#15727) ([a08f646](https://github.com/vitejs/vite/commit/a08f646a95fdf02d5da1dced9f2ffb85e6bf697e)), closes [#15727](https://github.com/vitejs/vite/issues/15727)
* fix(deps): update all non-major dependencies (#15675) ([4d9363a](https://github.com/vitejs/vite/commit/4d9363ad6bc460fe2da811cb48b036e53b8cfc75)), closes [#15675](https://github.com/vitejs/vite/issues/15675)



## 5.1.0-beta.4 (2024-01-26)

* perf: lazy load rollup during dev (#15621) ([6f88a90](https://github.com/vitejs/vite/commit/6f88a90c411ccbeb0f487b9255d4c871a16ea4db)), closes [#15621](https://github.com/vitejs/vite/issues/15621)
* perf: use workspace root for fs cache (#15712) ([8815763](https://github.com/vitejs/vite/commit/8815763b71788e4787616bccc824468dfd2b45d5)), closes [#15712](https://github.com/vitejs/vite/issues/15712)
* chore: remove unneeded normalizePath (#15713) ([92f2747](https://github.com/vitejs/vite/commit/92f2747ce71213a3fb1e99a39ef9c5c088bf1099)), closes [#15713](https://github.com/vitejs/vite/issues/15713)
* chore(proxy): update proxy error info (#15678) ([09bd58d](https://github.com/vitejs/vite/commit/09bd58d909b3c50b4ff4480485fa32ad33e4b286)), closes [#15678](https://github.com/vitejs/vite/issues/15678)
* feat: enable fs.cachedChecks by default (#15704) ([a05c709](https://github.com/vitejs/vite/commit/a05c70977a6da4a3e8381b297240dba811229658)), closes [#15704](https://github.com/vitejs/vite/issues/15704)
* feat(optimizer): holdUntilCrawlEnd option (#15244) ([b7c6629](https://github.com/vitejs/vite/commit/b7c6629208cd53eb65dd8367c4a3634354b4b9a4)), closes [#15244](https://github.com/vitejs/vite/issues/15244)
* fix: normalize prettify url (#15705) ([98bc3dc](https://github.com/vitejs/vite/commit/98bc3dc357139e707fe9ce819ccb600d1dbf2c5b)), closes [#15705](https://github.com/vitejs/vite/issues/15705)
* fix: windows add/delete file ([3a7b650](https://github.com/vitejs/vite/commit/3a7b65041be14950585d582b5181f5ad1189d8e4))
* fix(build): build error message output twice (#15664) ([74382b9](https://github.com/vitejs/vite/commit/74382b9db68d61ef5e6dc2cb3cc7e387611ffc07)), closes [#15664](https://github.com/vitejs/vite/issues/15664)
* fix(hmr): pass id in `parseImports` for better debugging DX (#15707) ([fb4bddc](https://github.com/vitejs/vite/commit/fb4bddcdc77ce1cabfe58fc32a0b9bededf87a2a)), closes [#15707](https://github.com/vitejs/vite/issues/15707)
* fix(node): remove timestamp query of `staticImportedUrls` (#15663) ([6c4bf26](https://github.com/vitejs/vite/commit/6c4bf266a0bcae8512f6daf99dff57a73ae7bcf6)), closes [#15663](https://github.com/vitejs/vite/issues/15663)
* fix(preview): set isPreview true (#15695) ([93fce55](https://github.com/vitejs/vite/commit/93fce55aee8e4d2d37507c254e04bd4655715f25)), closes [#15695](https://github.com/vitejs/vite/issues/15695)



## 5.1.0-beta.3 (2024-01-22)

* perf: middleware to short-circuit on 304 (#15586) ([35ae4f8](https://github.com/vitejs/vite/commit/35ae4f8dd536d98272e33567d6bb73c3b3bd9cbf)), closes [#15586](https://github.com/vitejs/vite/issues/15586)
* perf: use thread for preprocessors (#13584) ([acd795f](https://github.com/vitejs/vite/commit/acd795f5528fdf9abce3ae478e51a369da40a70d)), closes [#13584](https://github.com/vitejs/vite/issues/13584)
* fix: default sideEffect option is delivered to rollup (#15665) ([f6cf3d1](https://github.com/vitejs/vite/commit/f6cf3d11affaf7c5159030acea0423e55b50674e)), closes [#15665](https://github.com/vitejs/vite/issues/15665)
* fix(ssr): mark builtin modules as side effect free (#15658) ([526cf23](https://github.com/vitejs/vite/commit/526cf23410c271425e7aa0cd8da2e2f4be23afc9)), closes [#15658](https://github.com/vitejs/vite/issues/15658)
* fix(ssr): support externalized builtins for webworker (#15656) ([639bbd6](https://github.com/vitejs/vite/commit/639bbd65c0f7be6ad5d5d4fbe57bc15e778b7bea)), closes [#15656](https://github.com/vitejs/vite/issues/15656)
* refactor: append tags logic in applyHtmlTransforms (#15647) ([09b1517](https://github.com/vitejs/vite/commit/09b15170af49895a8bbe60dc4e3a40f30ee1d680)), closes [#15647](https://github.com/vitejs/vite/issues/15647)
* refactor(hmr): provide a separate logger interface (#15631) ([110e2e1](https://github.com/vitejs/vite/commit/110e2e1651cf09b45e4c5e8700c3710b7908e6a5)), closes [#15631](https://github.com/vitejs/vite/issues/15631)



## 5.1.0-beta.2 (2024-01-19)

* fix: fs deny for case insensitive systems (#15653) ([89be67d](https://github.com/vitejs/vite/commit/89be67de47ae864d646ebeb7bdf5ef8bb8fcc7e1)), closes [#15653](https://github.com/vitejs/vite/issues/15653)
* perf: don't recalculate path.dirname(mod.file) (#15623) ([e459be4](https://github.com/vitejs/vite/commit/e459be4fb1287e1432662958149aa95abb866ff9)), closes [#15623](https://github.com/vitejs/vite/issues/15623)
* perf: optimize getSortedPluginsByHook (#15624) ([f08a037](https://github.com/vitejs/vite/commit/f08a037aa7dbcc3d55f4cefbfe9822b7d0373a8d)), closes [#15624](https://github.com/vitejs/vite/issues/15624)



## 5.1.0-beta.1 (2024-01-18)

* fix: handle namespace import and dynamic import interop consistently (#15619) ([ec8b420](https://github.com/vitejs/vite/commit/ec8b4206ac3650eb5e4b54fe795258d09a86e9e4)), closes [#15619](https://github.com/vitejs/vite/issues/15619)
* fix(css): track dependencies from addWatchFile for HMR (#15608) ([dfcb83d](https://github.com/vitejs/vite/commit/dfcb83d41ae566c139dd8d82168c5bfab1699428)), closes [#15608](https://github.com/vitejs/vite/issues/15608)
* fix(deps): update all non-major dependencies (#15603) ([109fb80](https://github.com/vitejs/vite/commit/109fb805fd28c9f738036985b90cf207d1c48e89)), closes [#15603](https://github.com/vitejs/vite/issues/15603)
* fix(hmr): normalize env files path (#15584) ([d0f1d2e](https://github.com/vitejs/vite/commit/d0f1d2e5fee1e923b89289c48fde79636afb1dc0)), closes [#15584](https://github.com/vitejs/vite/issues/15584)
* fix(ssr): externalize network imports during `ssrLoadModule` (#15599) ([af2aa09](https://github.com/vitejs/vite/commit/af2aa09575229462635b7cbb6d248ca853057ba2)), closes [#15599](https://github.com/vitejs/vite/issues/15599)
* fix(types): mark hmr update internal types optional (#15606) ([df8f5a5](https://github.com/vitejs/vite/commit/df8f5a50e6fde343653ee6b2ceaa42583ff33ebc)), closes [#15606](https://github.com/vitejs/vite/issues/15606)
* perf: avoid parseRequest (#15617) ([0cacfad](https://github.com/vitejs/vite/commit/0cacfadf3aeb3c9ce1db490290584387efb4f5ef)), closes [#15617](https://github.com/vitejs/vite/issues/15617)
* perf: avoid performance.now() call (#15634) ([e43f7ee](https://github.com/vitejs/vite/commit/e43f7eec9b7e877b929872a417a2159b0726ed6a)), closes [#15634](https://github.com/vitejs/vite/issues/15634)
* perf: do not bind plugin hook context functions (#15610) ([3b7e0c3](https://github.com/vitejs/vite/commit/3b7e0c3dd20d0d4f4c8d2d9aa93480724be8886d)), closes [#15610](https://github.com/vitejs/vite/issues/15610)
* perf: don't recreate html hooks on each transform call (#15579) ([bdb826c](https://github.com/vitejs/vite/commit/bdb826ca0a021c71d6a43d1f6c81fd3e906eea56)), closes [#15579](https://github.com/vitejs/vite/issues/15579)
* perf: simplify isHtmlProxy regex (#15590) ([644d120](https://github.com/vitejs/vite/commit/644d120248bbde6ed594b798092a7b5f6d7e58c5)), closes [#15590](https://github.com/vitejs/vite/issues/15590)
* feat: preview server add close method (#15630) ([947aa53](https://github.com/vitejs/vite/commit/947aa53bb8ea60ce03a207421a6e7a4117385e58)), closes [#15630](https://github.com/vitejs/vite/issues/15630)
* feat: support multiple HMR clients on the server (#15340) ([bf1e9c2](https://github.com/vitejs/vite/commit/bf1e9c2fd7b05f84d05e59f72b3fc26ca22807bb)), closes [#15340](https://github.com/vitejs/vite/issues/15340)
* feat(build): set `hoistTransitiveImports` to false in library builds (#15595) ([e6ebc7b](https://github.com/vitejs/vite/commit/e6ebc7bad710e1c9d86bf8ca9e994640a86e88fe)), closes [#15595](https://github.com/vitejs/vite/issues/15595)
* refactor: remove build time pre-bundling (#15184) ([757844f](https://github.com/vitejs/vite/commit/757844f0bd7e52a160cf3f0afe241c03d7414921)), closes [#15184](https://github.com/vitejs/vite/issues/15184)



## 5.1.0-beta.0 (2024-01-15)

* fix: await `configResolved` hooks of worker plugins (#15597) ([03c8004](https://github.com/vitejs/vite/commit/03c80049423125de980131edf2d30002d83eeabb)), closes [#15597](https://github.com/vitejs/vite/issues/15597)
* fix: hmr for env files, regression from #15365 (#15559) ([d1b143f](https://github.com/vitejs/vite/commit/d1b143fd58bed0e50ddf80609da3fcbcccf5c76d)), closes [#15365](https://github.com/vitejs/vite/issues/15365) [#15559](https://github.com/vitejs/vite/issues/15559)
* fix: init dev ssr optimizer on server init (#15561) ([db28b92](https://github.com/vitejs/vite/commit/db28b92caf0faf3c13c1add8da41e9463bbb530f)), closes [#15561](https://github.com/vitejs/vite/issues/15561)
* fix: only watch needed env files (#15365) ([476e572](https://github.com/vitejs/vite/commit/476e57241413411b2f0817dcd54d17e869495c75)), closes [#15365](https://github.com/vitejs/vite/issues/15365)
* fix: resolvedUrls is null in plugin's configureServer after server restart (#15450) ([653a48c](https://github.com/vitejs/vite/commit/653a48cda62de6a63f038822c466bdb93d56449b)), closes [#15450](https://github.com/vitejs/vite/issues/15450)
* fix: revert `package.json` change should trigger server restart (#15519) (#15558) ([9fc5d9c](https://github.com/vitejs/vite/commit/9fc5d9cb3a1b9df067e00959faa9da43ae03f776)), closes [#15519](https://github.com/vitejs/vite/issues/15519) [#15558](https://github.com/vitejs/vite/issues/15558)
* fix: set correct `isSsrBuild` value in dev (#15536) ([fdbe04d](https://github.com/vitejs/vite/commit/fdbe04d3d7c4fa6994fa17601201b3a6d2092fea)), closes [#15536](https://github.com/vitejs/vite/issues/15536)
* fix: update javascript mime type to text/javascript (#15427) ([a621de8](https://github.com/vitejs/vite/commit/a621de8dc5e11ab30e5b13e9a05618b4cdaf3478)), closes [#15427](https://github.com/vitejs/vite/issues/15427)
* fix(build): normalize html path (#15554) ([d0d5938](https://github.com/vitejs/vite/commit/d0d59385edf0390d955b79477cf86bd726bab5fe)), closes [#15554](https://github.com/vitejs/vite/issues/15554)
* fix(css): @import with .css in node_modules importing a different package failed to resolve (#15000) ([8ccf722](https://github.com/vitejs/vite/commit/8ccf7222e9ffaa5e97bd0797de101c8bc6ca8d41)), closes [#15000](https://github.com/vitejs/vite/issues/15000)
* fix(css): `.css?url` support (#15259) ([ed56d96](https://github.com/vitejs/vite/commit/ed56d96cec8fd3b9b6dae88d5511e386177e6d5c)), closes [#15259](https://github.com/vitejs/vite/issues/15259)
* fix(css): skip url replace for function calls (#15544) ([21a52e6](https://github.com/vitejs/vite/commit/21a52e65b5610f5520222bee45daa8d69835336b)), closes [#15544](https://github.com/vitejs/vite/issues/15544)
* fix(deps): update all non-major dependencies (#15375) ([ab56227](https://github.com/vitejs/vite/commit/ab56227d89c92bfa781264e1474ed522892e3b8f)), closes [#15375](https://github.com/vitejs/vite/issues/15375)
* fix(esbuild): update to tsconfck 3.0.1 to fix edge cases when resolving tsconfig.extends (#15502) ([1fcebeb](https://github.com/vitejs/vite/commit/1fcebeb3d3765c23cf44cfe81518da095a611865)), closes [#15502](https://github.com/vitejs/vite/issues/15502)
* fix(hmr): `package.json` change should trigger server restart (#15519) ([260ebbf](https://github.com/vitejs/vite/commit/260ebbfa96ae87e2c331d82b386e609ed865cbcb)), closes [#15519](https://github.com/vitejs/vite/issues/15519)
* fix(hmr): make watcher ignore build.outDir (#15326) ([2836276](https://github.com/vitejs/vite/commit/2836276dc0e132c4d64dc4c08fc730058406f2c0)), closes [#15326](https://github.com/vitejs/vite/issues/15326)
* fix(hmr): propagate `fs.stat` failure for `hmrContext.read` (#15568) ([c6d240b](https://github.com/vitejs/vite/commit/c6d240bd777e82b3f9d74d967e54a931635d8b2a)), closes [#15568](https://github.com/vitejs/vite/issues/15568)
* fix(sourcemap): sourcemap is incorrect when sourcemap has `sources: [null]` (#14588) ([f8c6a34](https://github.com/vitejs/vite/commit/f8c6a341fb4fd920e6aaed47d863606c38ad1291)), closes [#14588](https://github.com/vitejs/vite/issues/14588)
* feat: `build.assetsInlineLimit` callback (#15366) ([4d1342e](https://github.com/vitejs/vite/commit/4d1342ebe0969cbcfc9c6d7fc5347f85df07df7f)), closes [#15366](https://github.com/vitejs/vite/issues/15366)
* feat: add '*.m4a' to client.d.ts and constants (#15471) ([ebc37f6](https://github.com/vitejs/vite/commit/ebc37f678f56bde1c0fcd00149feff0c009f77ff)), closes [#15471](https://github.com/vitejs/vite/issues/15471)
* feat: add support for .vtt type (#15538) ([a5c6d3d](https://github.com/vitejs/vite/commit/a5c6d3d53c15178ca6ca464165f3a3fb28e825f7)), closes [#15538](https://github.com/vitejs/vite/issues/15538)
* feat(glob-import): deprecate as option (#14420) ([953e697](https://github.com/vitejs/vite/commit/953e697ea43c4aad6f728d0c44f8eb74b8218d41)), closes [#14420](https://github.com/vitejs/vite/issues/14420)
* feat(hmr): reload for circular imports only if error (#15118) ([6ace32b](https://github.com/vitejs/vite/commit/6ace32b41dbad2ea0ee10f97e7cc662dd03f81e1)), closes [#15118](https://github.com/vitejs/vite/issues/15118)
* feat(ssr): support external true (#10939) ([e451be2](https://github.com/vitejs/vite/commit/e451be224b0d5479e92b295f0e3920541c7788b2)), closes [#10939](https://github.com/vitejs/vite/issues/10939)
* refactor: extract '_metadata.json' string to a constant (#15541) ([adda370](https://github.com/vitejs/vite/commit/adda370fabd36c7010c7b8f8c9880d2417a962a1)), closes [#15541](https://github.com/vitejs/vite/issues/15541)
* refactor: normalize publicDir when resolving config (#15360) ([ea5fdeb](https://github.com/vitejs/vite/commit/ea5fdebb99b273d21dd3fad9475b21a1c9e66fe9)), closes [#15360](https://github.com/vitejs/vite/issues/15360)
* refactor: remove json-stable-stringify (#15571) ([b9b0816](https://github.com/vitejs/vite/commit/b9b081660505997826695ecad21d02d9147a4a65)), closes [#15571](https://github.com/vitejs/vite/issues/15571)
* refactor: reuse existing node utils (#15480) ([17ab48a](https://github.com/vitejs/vite/commit/17ab48a678278ec3fd5afb58dc5b91c1c6e806dd)), closes [#15480](https://github.com/vitejs/vite/issues/15480)
* refactor(hmr): keep buffer implementation internal, expose queueUpdate (#15486) ([c029efb](https://github.com/vitejs/vite/commit/c029efbc59955ffb6e2a4cdf43d24f26fc36b932)), closes [#15486](https://github.com/vitejs/vite/issues/15486)
* perf: optimize logger (#15574) ([0fb9071](https://github.com/vitejs/vite/commit/0fb9071a653adde1cacf91e5261f7504deab9c25)), closes [#15574](https://github.com/vitejs/vite/issues/15574)
* chore: avoid bundling resolve dep (#15570) ([ae49ac4](https://github.com/vitejs/vite/commit/ae49ac41394ca120acf7f2bdf4377a8963b7bbc0)), closes [#15570](https://github.com/vitejs/vite/issues/15570)
* chore(deps): update dependency postcss-import to v16 (#15533) ([36775c4](https://github.com/vitejs/vite/commit/36775c4b1ceb390fffe27c3e301d4cc75301a228)), closes [#15533](https://github.com/vitejs/vite/issues/15533)



## <small>5.0.11 (2024-01-05)</small>

* fix: don't pretransform classic script links (#15361) ([19e3c9a](https://github.com/vitejs/vite/commit/19e3c9a8a16847486fbad8a8cd48fc771b1538bb)), closes [#15361](https://github.com/vitejs/vite/issues/15361)
* fix: inject `__vite__mapDeps` code before sourcemap file comment (#15483) ([d2aa096](https://github.com/vitejs/vite/commit/d2aa0969ee316000d3b957d7e879f001e85e369e)), closes [#15483](https://github.com/vitejs/vite/issues/15483)
* fix(assets): avoid splitting `,` inside base64 value of `srcset` attribute (#15422) ([8de7bd2](https://github.com/vitejs/vite/commit/8de7bd2b68db27b83d9484cc8d4e26436615168e)), closes [#15422](https://github.com/vitejs/vite/issues/15422)
* fix(html): handle offset magic-string slice error (#15435) ([5ea9edb](https://github.com/vitejs/vite/commit/5ea9edbc9ceb991e85f893fe62d68ed028677451)), closes [#15435](https://github.com/vitejs/vite/issues/15435)
* chore(deps): update dependency strip-literal to v2 (#15475) ([49d21fe](https://github.com/vitejs/vite/commit/49d21fe1feaac30dee0196bd484480a8000a4363)), closes [#15475](https://github.com/vitejs/vite/issues/15475)
* chore(deps): update tj-actions/changed-files action to v41 (#15476) ([2a540ee](https://github.com/vitejs/vite/commit/2a540eee82f9a31deff8215bdbdccfa46d494a06)), closes [#15476](https://github.com/vitejs/vite/issues/15476)



## <small>5.0.10 (2023-12-15)</small>

* fix: omit protocol does not require pre-transform (#15355) ([d9ae1b2](https://github.com/vitejs/vite/commit/d9ae1b2e573e8e5e313c1f23a5a0b5d6d9dff887)), closes [#15355](https://github.com/vitejs/vite/issues/15355)
* fix(build): use base64 for inline SVG if it contains both single and double quotes (#15271) ([1bbff16](https://github.com/vitejs/vite/commit/1bbff16ff8c65d980d3843316ecbad8b1ec4e67a)), closes [#15271](https://github.com/vitejs/vite/issues/15271)



## <small>5.0.9 (2023-12-14)</small>

* fix: htmlFallbackMiddleware for favicon (#15301) ([c902545](https://github.com/vitejs/vite/commit/c902545476a4e7ba044c35b568e73683758178a3)), closes [#15301](https://github.com/vitejs/vite/issues/15301)
* fix: more stable hash calculation for depsOptimize (#15337) ([2b39fe6](https://github.com/vitejs/vite/commit/2b39fe6584a55e6fe07664ac497e41d70f1fa32b)), closes [#15337](https://github.com/vitejs/vite/issues/15337)
* fix(scanner): catch all external files for glob imports (#15286) ([129d0d0](https://github.com/vitejs/vite/commit/129d0d0983285d31bed41d2c7a08c138ad32e625)), closes [#15286](https://github.com/vitejs/vite/issues/15286)
* fix(server): avoid chokidar throttling on startup (#15347) ([56a5740](https://github.com/vitejs/vite/commit/56a5740bc7217b1a2690db156c5994ea9049f9e9)), closes [#15347](https://github.com/vitejs/vite/issues/15347)
* fix(worker): replace `import.meta` correctly for IIFE worker (#15321) ([08d093c](https://github.com/vitejs/vite/commit/08d093cb7deee07a293e7d82aa395f3c153e03d9)), closes [#15321](https://github.com/vitejs/vite/issues/15321)
* feat: log re-optimization reasons (#15339) ([b1a6c84](https://github.com/vitejs/vite/commit/b1a6c84c3b55f9a79f63e1fd9bd11ac9ef151e92)), closes [#15339](https://github.com/vitejs/vite/issues/15339)
* chore: temporary typo (#15329) ([7b71854](https://github.com/vitejs/vite/commit/7b7185494afee4ffe857a772cfa881d555f19520)), closes [#15329](https://github.com/vitejs/vite/issues/15329)
* perf: avoid computing paths on each request (#15318) ([0506812](https://github.com/vitejs/vite/commit/05068123dd5f6c3dd7ae372b432aa16118c7c4b7)), closes [#15318](https://github.com/vitejs/vite/issues/15318)
* perf: temporary hack to avoid fs checks for /@react-refresh (#15299) ([b1d6211](https://github.com/vitejs/vite/commit/b1d6211d8df4f33172766a56ed87bd8d37648fbb)), closes [#15299](https://github.com/vitejs/vite/issues/15299)



## <small>5.0.8 (2023-12-12)</small>

* perf: cached fs utils (#15279) ([c9b61c4](https://github.com/vitejs/vite/commit/c9b61c47b04977bbcc2771394ac6c89eeb9ea20c)), closes [#15279](https://github.com/vitejs/vite/issues/15279)
* fix: missing warmupRequest in transformIndexHtml (#15303) ([103820f](https://github.com/vitejs/vite/commit/103820fe3f5f3c2685922eeaec4175e7188eeb1b)), closes [#15303](https://github.com/vitejs/vite/issues/15303)
* fix: public files map will be updated on add/unlink in windows (#15317) ([921ca41](https://github.com/vitejs/vite/commit/921ca419d893a8a66871648d84008355d487c1e7)), closes [#15317](https://github.com/vitejs/vite/issues/15317)
* fix(build): decode urls in CSS files (fix #15109) (#15246) ([ea6a7a6](https://github.com/vitejs/vite/commit/ea6a7a6eb86ebc8ae5cf5aff88446a1b44fecec9)), closes [#15109](https://github.com/vitejs/vite/issues/15109) [#15246](https://github.com/vitejs/vite/issues/15246)
* fix(deps): update all non-major dependencies (#15304) ([bb07f60](https://github.com/vitejs/vite/commit/bb07f605cca698a81f1b4606ddefb34485069dd1)), closes [#15304](https://github.com/vitejs/vite/issues/15304)
* fix(ssr): check esm file with normal file path (#15307) ([1597170](https://github.com/vitejs/vite/commit/1597170d0310a167c67beb3f1f6b958cca8f9d1d)), closes [#15307](https://github.com/vitejs/vite/issues/15307)



## <small>5.0.7 (2023-12-08)</small>

* fix: suppress terser warning if minify disabled (#15275) ([3e42611](https://github.com/vitejs/vite/commit/3e42611da7812193338ce7cef03db14602332b17)), closes [#15275](https://github.com/vitejs/vite/issues/15275)
* fix: symbolic links in public dir (#15264) ([ef2a024](https://github.com/vitejs/vite/commit/ef2a0247937fb4c89f51ff116480f2ec4dcf7598)), closes [#15264](https://github.com/vitejs/vite/issues/15264)
* fix(html): skip inlining icon and manifest links (#14958) ([8ad81b4](https://github.com/vitejs/vite/commit/8ad81b470ca6f8d4cc9a56a1833c9475081b9ff9)), closes [#14958](https://github.com/vitejs/vite/issues/14958)
* chore: remove unneeded condition in getRealPath (#15267) ([8e4655c](https://github.com/vitejs/vite/commit/8e4655c96f7f9d0634f44997f2a9c9b2fdfcb685)), closes [#15267](https://github.com/vitejs/vite/issues/15267)
* perf: cache empty optimizer result (#15245) ([8409b66](https://github.com/vitejs/vite/commit/8409b662d6891491c997126d14bb88101851a3d5)), closes [#15245](https://github.com/vitejs/vite/issues/15245)



## <small>5.0.6 (2023-12-06)</small>

* perf: in-memory public files check (#15195) ([0f9e1bf](https://github.com/vitejs/vite/commit/0f9e1bfdc2d228c02690f9d858e8f8cce8d93264)), closes [#15195](https://github.com/vitejs/vite/issues/15195)
* chore: remove unneccessary eslint-disable-next-line regexp/no-unused-capturing-group (#15247) ([35a5bcf](https://github.com/vitejs/vite/commit/35a5bcf139f015f81c8e127f19ba6dc830a642d5)), closes [#15247](https://github.com/vitejs/vite/issues/15247)



## <small>5.0.5 (2023-12-04)</small>

* fix: emit `vite:preloadError` for chunks without deps (#15203) ([d8001c5](https://github.com/vitejs/vite/commit/d8001c546363af8dfa1c2acf90a904f4a23d1495)), closes [#15203](https://github.com/vitejs/vite/issues/15203)
* fix: esbuild glob import resolve error (#15140) ([676804d](https://github.com/vitejs/vite/commit/676804d95a8b26ad734f3e3c0b09ad361e9a9931)), closes [#15140](https://github.com/vitejs/vite/issues/15140)
* fix: json error with position (#15225) ([14be75f](https://github.com/vitejs/vite/commit/14be75f6a8497ae1416188e21b2b0f818443cc2a)), closes [#15225](https://github.com/vitejs/vite/issues/15225)
* fix: proxy html path should be encoded (#15223) ([5b85040](https://github.com/vitejs/vite/commit/5b8504048140cbbd5d9424132c998c506dece6ce)), closes [#15223](https://github.com/vitejs/vite/issues/15223)
* fix(deps): update all non-major dependencies (#15233) ([ad3adda](https://github.com/vitejs/vite/commit/ad3adda7215c33874a07cbd4d430fcffe4c85dce)), closes [#15233](https://github.com/vitejs/vite/issues/15233)
* fix(hmr): don't consider CSS dep as a circular dep (#15229) ([5f2cdec](https://github.com/vitejs/vite/commit/5f2cdec5d61b847352b3412725fcc957dca010d4)), closes [#15229](https://github.com/vitejs/vite/issues/15229)
* feat: add '*.mov' to client.d.ts (#15189) ([d93a211](https://github.com/vitejs/vite/commit/d93a211959cb5f9951653d717aceee2a0d93499a)), closes [#15189](https://github.com/vitejs/vite/issues/15189)
* feat(server): allow disabling built-in shortcuts (#15218) ([7fd7c6c](https://github.com/vitejs/vite/commit/7fd7c6cebfcad34ae7021ebee28f97b1f28ef3f3)), closes [#15218](https://github.com/vitejs/vite/issues/15218)
* chore: replace 'some' with 'includes' in resolveEnvPrefix (#15220) ([ee12f30](https://github.com/vitejs/vite/commit/ee12f30eaae70a8989cff0fe0a823e3f42a84832)), closes [#15220](https://github.com/vitejs/vite/issues/15220)
* chore: update the website url for homepage in package.json (#15181) ([282bd8f](https://github.com/vitejs/vite/commit/282bd8f31239717fec9842664d88b38320cdd939)), closes [#15181](https://github.com/vitejs/vite/issues/15181)
* chore: update vitest to 1.0.0-beta.6 (#15194) ([2fce647](https://github.com/vitejs/vite/commit/2fce647edae3c93915f43c2a2971b87aa2db53c3)), closes [#15194](https://github.com/vitejs/vite/issues/15194)
* refactor: make HMR agnostic to environment (#15179) ([0571b7c](https://github.com/vitejs/vite/commit/0571b7c6c3acc8ec46357a9ac1f20b60030cdd2f)), closes [#15179](https://github.com/vitejs/vite/issues/15179)
* refactor: use dedicated regex methods (#15228) ([0348137](https://github.com/vitejs/vite/commit/0348137a2315fc288f0e915169c36947f69bba63)), closes [#15228](https://github.com/vitejs/vite/issues/15228)
* perf: remove debug only prettifyUrl call (#15204) ([73e971f](https://github.com/vitejs/vite/commit/73e971f27a63b2d4ecb5acf44f8726cdd3d2082b)), closes [#15204](https://github.com/vitejs/vite/issues/15204)
* perf: skip computing sourceRoot in injectSourcesContent (#15207) ([1df1fd1](https://github.com/vitejs/vite/commit/1df1fd1047695c4d144de4b2b4bd4a69fc7d7440)), closes [#15207](https://github.com/vitejs/vite/issues/15207)



## <small>5.0.4 (2023-11-29)</small>

* fix: bindCLIShortcuts to proper server (#15162) ([67ac572](https://github.com/vitejs/vite/commit/67ac57283f20b8e3a2dc5809a761eefa38fffb59)), closes [#15162](https://github.com/vitejs/vite/issues/15162)
* fix: revert "fix: js fallback sourcemap content should be using original content (#15135)" (#15178) ([d2a2493](https://github.com/vitejs/vite/commit/d2a2493ddfe18d58f181e947d4a92b9df1c311d3)), closes [#15135](https://github.com/vitejs/vite/issues/15135) [#15178](https://github.com/vitejs/vite/issues/15178)
* fix(define): allow define process.env (#15173) ([ec401da](https://github.com/vitejs/vite/commit/ec401da07435f63968d4d3da361c1d40b57b6a0c)), closes [#15173](https://github.com/vitejs/vite/issues/15173)
* fix(resolve): respect order of browser in mainFields when resolving (#15137) ([4a111aa](https://github.com/vitejs/vite/commit/4a111aafd5b488514c84bc4a00f0e5640b0079fc)), closes [#15137](https://github.com/vitejs/vite/issues/15137)
* feat: preserve vite.middlewares connect instance after restarts (#15166) ([9474c4b](https://github.com/vitejs/vite/commit/9474c4be279e342db2264fa9e7a8b84abb54a93e)), closes [#15166](https://github.com/vitejs/vite/issues/15166)
* refactor: align with Promise.withResolvers() (#15171) ([642f9bc](https://github.com/vitejs/vite/commit/642f9bcb5d4a8c2455569117ef2984fe09c3acd4)), closes [#15171](https://github.com/vitejs/vite/issues/15171)



## <small>5.0.3 (2023-11-28)</small>

* fix: `generateCodeFrame` infinite loop (#15093) ([6619de7](https://github.com/vitejs/vite/commit/6619de7de498ec08b4af91412d611900282744a7)), closes [#15093](https://github.com/vitejs/vite/issues/15093)
* fix: js fallback sourcemap content should be using original content (#15135) ([227d56d](https://github.com/vitejs/vite/commit/227d56d37fbfcd1af4b5d93182770b4e650511ee)), closes [#15135](https://github.com/vitejs/vite/issues/15135)
* fix(css): render correct asset url when CSS chunk name is nested (#15154) ([ef403c0](https://github.com/vitejs/vite/commit/ef403c0e616499b52f5937bdb8479df3e639adc7)), closes [#15154](https://github.com/vitejs/vite/issues/15154)
* fix(css): use non-nested chunk name if facadeModule is not CSS file (#15155) ([811e392](https://github.com/vitejs/vite/commit/811e392b771ae6bc0b27612cf9a06d01c17c3351)), closes [#15155](https://github.com/vitejs/vite/issues/15155)
* fix(dev): bind plugin context functions (#14569) ([cb3243c](https://github.com/vitejs/vite/commit/cb3243c86ebc6bd7212620db27d50ea2a2bee460)), closes [#14569](https://github.com/vitejs/vite/issues/14569)
* chore(deps): update all non-major dependencies (#15145) ([7ff2c0a](https://github.com/vitejs/vite/commit/7ff2c0afe8c6b6901385af829f2e7e80c1fe344c)), closes [#15145](https://github.com/vitejs/vite/issues/15145)
* build: handle latest json-stable-stringify replacement (#15049) ([bcc4a61](https://github.com/vitejs/vite/commit/bcc4a6113521543ac17552c3b3cbda80514f0c04)), closes [#15049](https://github.com/vitejs/vite/issues/15049)



## <small>5.0.2 (2023-11-21)</small>

* fix: make htmlFallback more permissive (#15059) ([6fcceeb](https://github.com/vitejs/vite/commit/6fcceebe34863c4fcde809885976b12cf5398fe1)), closes [#15059](https://github.com/vitejs/vite/issues/15059)



## <small>5.0.1 (2023-11-21)</small>

* test: avoid read check when running as root (#14884) ([1d9516c](https://github.com/vitejs/vite/commit/1d9516c66af0e49b46d45f3eaabce84d933abfc7)), closes [#14884](https://github.com/vitejs/vite/issues/14884)
* perf(hmr): skip traversed modules when checking circular imports (#15034) ([41e437f](https://github.com/vitejs/vite/commit/41e437fd6ff566a158efeabcaf781a9a24803381)), closes [#15034](https://github.com/vitejs/vite/issues/15034)
* fix: run htmlFallbackMiddleware for no accept header requests (#15025) ([b93dfe3](https://github.com/vitejs/vite/commit/b93dfe3e08f56cafe2e549efd80285a12a3dc2f0)), closes [#15025](https://github.com/vitejs/vite/issues/15025)
* fix: update type CSSModulesOptions interface (#14987) ([d0b2153](https://github.com/vitejs/vite/commit/d0b2153a48165f9cbdbeadf1ca00935154fedd02)), closes [#14987](https://github.com/vitejs/vite/issues/14987)
* fix(legacy): error in build with --watch and manifest enabled (#14450) ([b9ee620](https://github.com/vitejs/vite/commit/b9ee620108819e06023e4303af75a61d3e4e4d76)), closes [#14450](https://github.com/vitejs/vite/issues/14450)
* chore: add comment about crossorigin attribute for script module (#15040) ([03c371e](https://github.com/vitejs/vite/commit/03c371e426d006148b7156d764bd9d4de664251b)), closes [#15040](https://github.com/vitejs/vite/issues/15040)
* chore: cleanup v5 beta changelog (#14694) ([531d3cb](https://github.com/vitejs/vite/commit/531d3cbd88e3024e264873653b2d3d203aebd15d)), closes [#14694](https://github.com/vitejs/vite/issues/14694)



## 5.0.0 (2023-11-16)

Vite 5 is out! Read the [announcement blog post here](https://vite.dev/blog/announcing-vite5)

[![Announcing Vite 5](https://vite.dev/og-image-announcing-vite5.png)](https://vite.dev/blog/announcing-vite5)

Today, we mark another big milestone in Vite's path. The Vite [team](https://vite.dev/team), [contributors](https://github.com/vitejs/vite/graphs/contributors), and ecosystem partners, are excited to announce the release of Vite 5. Vite is now using [Rollup 4](https://github.com/vitejs/vite/pull/14508), which already represents a big boost in build performance. And there are also new options to improve your dev server performance profile.

Vite 5 focuses on cleaning up the API (removing deprecated features) and streamlines several features closing long-standing issues, for example switching `define` to use proper AST replacements instead of regexes. We also continue to take steps to future-proof Vite (Node.js 18+ is now required, and [the CJS Node API has been deprecated](https://vite.dev/guide/migration#deprecate-cjs-node-api)).

Quick links:

- [Docs](https://vite.dev)
- [Migration Guide](https://vite.dev/guide/migration)

Docs in other languages:

- [简体中文](https://cn.vite.dev/)
- [日本語](https://ja.vite.dev/)
- [Español](https://es.vite.dev/)
- [Português](https://pt.vite.dev/)
- [한국어](https://ko.vite.dev/)
- [Deutsch](https://de.vite.dev/) (new translation!)

Learn more at [the Vite 5 announcement blog post](https://vite.dev/blog/announcing-vite5).


### Breaking changes

* feat!: add isPreview to ConfigEnv and resolveConfig (#14855) ([d195860](https://github.com/vitejs/vite/commit/d19586061639295257c7ea13b9ed68745aa90224)), closes [#14855](https://github.com/vitejs/vite/issues/14855)
* fix(types)!: expose httpServer with Http2SecureServer union (#14834) ([ab5bb40](https://github.com/vitejs/vite/commit/ab5bb40942c7023046fa6f6d0b49cabc105b6073)), closes [#14834](https://github.com/vitejs/vite/issues/14834)
* refactor(preview)!: use base middleware (#14818) ([69737f4](https://github.com/vitejs/vite/commit/69737f496cb888a459b6cb701e66610991393bc7)), closes [#14818](https://github.com/vitejs/vite/issues/14818)
* fix(html)!: align html serving between dev and preview (#14756) ([4f71ae8](https://github.com/vitejs/vite/commit/4f71ae8736ff5d2fc9eca876825d16b0c4402720)), closes [#14756](https://github.com/vitejs/vite/issues/14756)
* refactor!: remove non boolean middleware mode (#14792) ([deb5515](https://github.com/vitejs/vite/commit/deb5515c282c9fab52450a450848390333e2fef2)), closes [#14792](https://github.com/vitejs/vite/issues/14792)
* refactor(esbuild)!: remove esbuild 0.17 -> 0.18 compat (#14804) ([7234021](https://github.com/vitejs/vite/commit/72340211d3eedf0ffd12618622d6b8cdc4c133d0)), closes [#14804](https://github.com/vitejs/vite/issues/14804)
* feat(resolve)!: remove `resolve.browserField` (#14733) ([43cc3b9](https://github.com/vitejs/vite/commit/43cc3b9e6db4e8d2a5da69d6f75ae40601835e17)), closes [#14733](https://github.com/vitejs/vite/issues/14733)
* refactor!: move side effect of restart server to the caller (#8746) ([521ca58](https://github.com/vitejs/vite/commit/521ca58d5d7cf9fbd554169a449282c8163c81ac)), closes [#8746](https://github.com/vitejs/vite/issues/8746)
* refactor(shortcuts)!: tweak shortcuts api (#14749) ([0ae2e1d](https://github.com/vitejs/vite/commit/0ae2e1dc63950ac5ff45110a360514850226c962)), closes [#14749](https://github.com/vitejs/vite/issues/14749)
* fix(resolve)!: remove special .mjs handling (#14723) ([2141d31](https://github.com/vitejs/vite/commit/2141d3132d297c6dc3ad5698ef508fd08f5229a9)), closes [#14723](https://github.com/vitejs/vite/issues/14723)
* feat!: remove ssr proxy for externalized modules (#14521) ([5786837](https://github.com/vitejs/vite/commit/5786837a02566accaafe04a4a6cda9ea7d00ee2e)), closes [#14521](https://github.com/vitejs/vite/issues/14521)
* feat(build)!: inline SVGs (#14643) ([5acda5e](https://github.com/vitejs/vite/commit/5acda5e10a70908e82093b5cd302d103a346e693)), closes [#14643](https://github.com/vitejs/vite/issues/14643)
* fix!: worker.plugins is a function (#14685) ([9d09dfe](https://github.com/vitejs/vite/commit/9d09dfe53980ea882d99c3fc46ed5a2de98fba0d)), closes [#14685](https://github.com/vitejs/vite/issues/14685)
* refactor!: remove https flag (#14681) ([5b65bfd](https://github.com/vitejs/vite/commit/5b65bfdb4808660f63fcca15cbeea0fde1ae5b65)), closes [#14681](https://github.com/vitejs/vite/issues/14681)
* feat!: rollup v4 (#14508) ([dee6067](https://github.com/vitejs/vite/commit/dee6067ec78c9f9d7923d780b4941d835b34fcf4)), closes [#14508](https://github.com/vitejs/vite/issues/14508)
* refactor!: remove `resolvePackageEntry` and `resolvePackageData` APIs (#14584) ([339f300](https://github.com/vitejs/vite/commit/339f300eeadf92347df41400ee951b0feb2cecc4)), closes [#14584](https://github.com/vitejs/vite/issues/14584)
* refactor!: remove exporting internal APIs (#14583) ([7861a33](https://github.com/vitejs/vite/commit/7861a337f65376393a6dd88c0964d91f086e6ec6)), closes [#14583](https://github.com/vitejs/vite/issues/14583)
* fix!: return 404 for resources requests outside the base path (#5657) ([40fd2d9](https://github.com/vitejs/vite/commit/40fd2d9bf4073420e6c334f48dc3b63558b688ce)), closes [#5657](https://github.com/vitejs/vite/issues/5657)
* refactor!: remove `server.force` (#14530) ([33ecfd9](https://github.com/vitejs/vite/commit/33ecfd967136f8b05f204168971e7ba607e0eb5f)), closes [#14530](https://github.com/vitejs/vite/issues/14530)
* refactor!: remove jest condition (#14544) ([8d18a91](https://github.com/vitejs/vite/commit/8d18a910128db25b120218260ab911dd31ff6a5b)), closes [#14544](https://github.com/vitejs/vite/issues/14544)
* feat!: deprecate cjs node api (#14278) ([404f30f](https://github.com/vitejs/vite/commit/404f30f5a4f9d5ad8ac683fb8cd7adc87d308675)), closes [#14278](https://github.com/vitejs/vite/issues/14278)
* feat(shortcuts)!: remove setRawMode (#14342) ([536631a](https://github.com/vitejs/vite/commit/536631a2f54ce3f90105fc586a2c1a5b477eff5f)), closes [#14342](https://github.com/vitejs/vite/issues/14342)
* fix!: put manifest files in .vite directory by default (#14230) ([74fa024](https://github.com/vitejs/vite/commit/74fa024db4aaf04d0bdc6b6ec87e3095e1b24b12)), closes [#14230](https://github.com/vitejs/vite/issues/14230)
* feat!: allow path containing . to fallback to index.html (#14142) ([1ae4cbd](https://github.com/vitejs/vite/commit/1ae4cbd20f5de43b752cd4f203d5c03b0c8d6bcb)), closes [#14142](https://github.com/vitejs/vite/issues/14142)
* feat!: bump minimum node version to 18 (#14030) ([2c1a45c](https://github.com/vitejs/vite/commit/2c1a45c86cab6ecf02abb6e50385f773d5ed568e)), closes [#14030](https://github.com/vitejs/vite/issues/14030)
* fix!: avoid rewriting this (reverts #5312) (#14098) ([9b7b4ed](https://github.com/vitejs/vite/commit/9b7b4ed99ff30ca8eed520233b89e5f977015656)), closes [#5312](https://github.com/vitejs/vite/issues/5312) [#14098](https://github.com/vitejs/vite/issues/14098)
* refactor!: merge `PreviewServerForHook` into `PreviewServer` type (#14119) ([e0eb07c](https://github.com/vitejs/vite/commit/e0eb07c5d174456b19db81839383f39f3abb57fa)), closes [#14119](https://github.com/vitejs/vite/issues/14119)
* refactor(glob)!: remove `import.meta.globEager` (#14118) ([fdfb61f](https://github.com/vitejs/vite/commit/fdfb61f2a9ab596dc9b6bc09a6c52645aca18ef4)), closes [#14118](https://github.com/vitejs/vite/issues/14118)
* feat!: add extension to internal virtual modules (#14231) ([9594c70](https://github.com/vitejs/vite/commit/9594c7021bba606ab423fc9e18d638615a111360)), closes [#14231](https://github.com/vitejs/vite/issues/14231)
* feat(css)!: remove css default export ([b6c44cd](https://github.com/vitejs/vite/commit/b6c44cd693db763f071d7d1c3a15dd9580272f45))
* fix!: update node types peer dep range (#14280) ([8f87e86](https://github.com/vitejs/vite/commit/8f87e86cf180223b883134962a6357bba9e3a1c0)), closes [#14280](https://github.com/vitejs/vite/issues/14280)

### Features

* feat: allow providing parent httpServer on middleware mode (#14632) ([e0c86d4](https://github.com/vitejs/vite/commit/e0c86d4f210a302876fac280d9e79a2244e83b8b)), closes [#14632](https://github.com/vitejs/vite/issues/14632)
* style(client): overlay frame show scrollbar (#14701) ([8aa4134](https://github.com/vitejs/vite/commit/8aa4134ea78ddab7c696b0efe58ad905887f1346)), closes [#14701](https://github.com/vitejs/vite/issues/14701)
* feat: error when failed to resolve aliased import (#14973) ([6a564fa](https://github.com/vitejs/vite/commit/6a564fa92a368ae4b5f0c2392c49450d534d4b52)), closes [#14973](https://github.com/vitejs/vite/issues/14973)
* feat: add invalid `rollupOptions` warnings (#14909) ([7c240a0](https://github.com/vitejs/vite/commit/7c240a0d25bcba043fbf97bf0382b2da4f012aa0)), closes [#14909](https://github.com/vitejs/vite/issues/14909)
* feat: skip initial clear screen if has logs (#14936) ([a92bc61](https://github.com/vitejs/vite/commit/a92bc617cf47bbdf95061cf9c312330a1713d725)), closes [#14936](https://github.com/vitejs/vite/issues/14936)
* feat(hmr): add full reload reason (#14914) ([60a020e](https://github.com/vitejs/vite/commit/60a020e592893e5f58a83fb53a68bed19148970c)), closes [#14914](https://github.com/vitejs/vite/issues/14914)
* feat(hmr): improve circular import updates (#14867) ([b479055](https://github.com/vitejs/vite/commit/b47905577a9b4f78544c80c93fb005dabce8f02a)), closes [#14867](https://github.com/vitejs/vite/issues/14867)
* feat: implement AsyncDisposable (#14648) ([385d580](https://github.com/vitejs/vite/commit/385d580a7df67570b8014318a607f62fe15eaef9)), closes [#14648](https://github.com/vitejs/vite/issues/14648)
* feat: expose parseAst and parseAstAsync from rollup (#14833) ([6229485](https://github.com/vitejs/vite/commit/622948558af026141e1d46e890dd27e79b59e16b)), closes [#14833](https://github.com/vitejs/vite/issues/14833)
* feat: upgrade rollup to 4.2.0 and use parseAstAsync (#14821) ([86a5356](https://github.com/vitejs/vite/commit/86a5356721f64de8033c559d4afa1e045ca672d9)), closes [#14821](https://github.com/vitejs/vite/issues/14821)
* feat(pluginContainer): implement watchChange hook (#14822) ([9369d8d](https://github.com/vitejs/vite/commit/9369d8d8cbf765d5930ec22e47cd2e5bb337f616)), closes [#14822](https://github.com/vitejs/vite/issues/14822)
* feat(server): add warmupRequest api (#14787) ([8690581](https://github.com/vitejs/vite/commit/8690581bac3b466abb03e13e172bc3770fed0545)), closes [#14787](https://github.com/vitejs/vite/issues/14787)
* feat(define): handle replacement with esbuild (#11151) ([e4c801c](https://github.com/vitejs/vite/commit/e4c801c552edc4a60659720b89777e29eb93db6b)), closes [#11151](https://github.com/vitejs/vite/issues/11151)
* feat: add a runtime warning for the old object type transformIndexHtml hook (#14791) ([17fb5ee](https://github.com/vitejs/vite/commit/17fb5ee41f96e3e4aefc6d6258436676de048686)), closes [#14791](https://github.com/vitejs/vite/issues/14791)
* feat: add server.warmup option (#14291) ([da80372](https://github.com/vitejs/vite/commit/da80372ef5b5f11b30d66c57ff323e0f1d5cc14c)), closes [#14291](https://github.com/vitejs/vite/issues/14291)
* feat: add import-meta.d.ts (#14615) ([598d423](https://github.com/vitejs/vite/commit/598d42310696b8bed04db310076e7fe7a4651943)), closes [#14615](https://github.com/vitejs/vite/issues/14615)
* feat: add mdx as known js source (#14560) ([dd213b5](https://github.com/vitejs/vite/commit/dd213b5454c8dd448e0767edd42e2a50bfe933a7)), closes [#14560](https://github.com/vitejs/vite/issues/14560)
* feat: add off method to ViteHotContext (issue #14185) (#14518) ([31333bb](https://github.com/vitejs/vite/commit/31333bbb77ce3bf4a34380a2f07f926330993cac)), closes [#14185](https://github.com/vitejs/vite/issues/14185) [#14518](https://github.com/vitejs/vite/issues/14518)
* feat: show better parse error in build (#14600) ([84df7db](https://github.com/vitejs/vite/commit/84df7db1ea34b60a727628f8228f3ac31a27715d)), closes [#14600](https://github.com/vitejs/vite/issues/14600)
* feat(optimizer): check optimizeDeps.extensions for scannable files (#14543) ([23ef8a1](https://github.com/vitejs/vite/commit/23ef8a1a7abdb4a7e0400d7dd6ad3f7d444c548f)), closes [#14543](https://github.com/vitejs/vite/issues/14543)
* feat(ssr): support for ssr.resolve.conditions and ssr.resolve.externalConditions options (#14498) ([d0afc39](https://github.com/vitejs/vite/commit/d0afc3948bb246b0c4928c9350c0de4364bf61f9)), closes [#14498](https://github.com/vitejs/vite/issues/14498)
* feat: show warning to discourage putting process/global to `define` option (#14447) ([83a56f7](https://github.com/vitejs/vite/commit/83a56f7b46538d485a204a4b9309f3f10c94ee51)), closes [#14447](https://github.com/vitejs/vite/issues/14447)
* feat(terser): add `maxWorkers` option for terserOptions (#13858) ([884fc3d](https://github.com/vitejs/vite/commit/884fc3d8f721853de8d012fee104f449ba2b99e3)), closes [#13858](https://github.com/vitejs/vite/issues/13858)
* feat: add generic type for plugin api (#14238) ([830b26e](https://github.com/vitejs/vite/commit/830b26e8be88706982d3cee7c2df17d4120f92a5)), closes [#14238](https://github.com/vitejs/vite/issues/14238)
* feat: allow passing down "null" to disable server watcher (#14208) ([af5a95e](https://github.com/vitejs/vite/commit/af5a95e0142c46f89776b7a23c290015b1b99502)), closes [#14208](https://github.com/vitejs/vite/issues/14208)
* feat: improve deno and bun support (#14379) ([9884308](https://github.com/vitejs/vite/commit/9884308228d3c918d973c08a84f4cca5251cf23a)), closes [#14379](https://github.com/vitejs/vite/issues/14379)
* feat: build.ssrEmitAssets out of experimental (#14055) ([f88ab68](https://github.com/vitejs/vite/commit/f88ab6807f6596960c377e56a9e5e0bd041835e7)), closes [#14055](https://github.com/vitejs/vite/issues/14055)
* feat: ssrTransform support import assertion by default (#14202) ([70a379f](https://github.com/vitejs/vite/commit/70a379f1bf8a4767dc2d788d0f248ab9cde10c3f)), closes [#14202](https://github.com/vitejs/vite/issues/14202)
* feat: use `import.meta.url` instead of `self.location` (#14377) ([e9b1e85](https://github.com/vitejs/vite/commit/e9b1e85ab95685d2d34f2e8f66b8a31aef96c5a9)), closes [#14377](https://github.com/vitejs/vite/issues/14377)
* feat: warn if # in project root (#14188) ([f5ba696](https://github.com/vitejs/vite/commit/f5ba696d177c0027eed6a4a659cefdda9c0142ce)), closes [#14188](https://github.com/vitejs/vite/issues/14188)
* feat(css): stop injecting `?used` ([fc05454](https://github.com/vitejs/vite/commit/fc054542a31d00837676c7adb5f46d0cd8003eb1))
* feat: export `server.bindCLIShortcuts` (#13675) ([1a2e5e6](https://github.com/vitejs/vite/commit/1a2e5e6d9a6bb2531bf73be801c9778dbf39d51b)), closes [#13675](https://github.com/vitejs/vite/issues/13675)
* feat: copyPublicDir out of experimental (#14051) ([443c235](https://github.com/vitejs/vite/commit/443c235beec4b7b68a0d191e101ec85f4df02f67)), closes [#14051](https://github.com/vitejs/vite/issues/14051)
* feat(css): build assets with the entry name when it is an entry point (#11578) ([fd9a2cc](https://github.com/vitejs/vite/commit/fd9a2ccdf2e78616ff3c937538111dbe1586f537)), closes [#11578](https://github.com/vitejs/vite/issues/11578)
* feat(deps): upgrade rollup to 3.28.0 (#14049) ([490dad8](https://github.com/vitejs/vite/commit/490dad8feb8fbe3fb0031ef6707d05638867aee0)), closes [#14049](https://github.com/vitejs/vite/issues/14049)
* feat(worker): support a way to name the worker (#14032) ([1f214a4](https://github.com/vitejs/vite/commit/1f214a4df071b1f2f240a7209142c521d9deb4cb)), closes [#14032](https://github.com/vitejs/vite/issues/14032)

### Performance

* perf(define): create simple regex for checks (#14788) ([bd15537](https://github.com/vitejs/vite/commit/bd1553769b826f2bcd3100f2b603a2de7058ea26)), closes [#14788](https://github.com/vitejs/vite/issues/14788)
* perf(hmr): implement soft invalidation (#14654) ([4150bcb](https://github.com/vitejs/vite/commit/4150bcb0bd627b8c873e5f1ffce1b9aefc8766c7)), closes [#14654](https://github.com/vitejs/vite/issues/14654)
* perf: pre transform requests while opening the browser (#12809) ([96a4ce3](https://github.com/vitejs/vite/commit/96a4ce37d9fe17818b683c68455b9228f7307217)), closes [#12809](https://github.com/vitejs/vite/issues/12809)
* chore(deps): update tsconfck to 3.0.0 (#14629) ([4dcf9c4](https://github.com/vitejs/vite/commit/4dcf9c4e98652dea50e6339ab4c888eb5e618a5c)), closes [#14629](https://github.com/vitejs/vite/issues/14629)
* perf: reduce preload marker markup size (#14550) ([6f12fd8](https://github.com/vitejs/vite/commit/6f12fd8bd297e576eda1574fcda40f30a0994a53)), closes [#14550](https://github.com/vitejs/vite/issues/14550)
* perf: move up external url check before fs path checks (#13639) ([c2ebea1](https://github.com/vitejs/vite/commit/c2ebea16517a0b1d5690d5afb57dd95c1d701db6)), closes [#13639](https://github.com/vitejs/vite/issues/13639)
* refactor: update to tsconfck3 with lazy cache (#14234) ([6e0b0ee](https://github.com/vitejs/vite/commit/6e0b0eeed02c57002b53dd99689cb7d509a18af8)), closes [#14234](https://github.com/vitejs/vite/issues/14234)
* perf: reduce one if judgment (#14329) ([09ba7c6](https://github.com/vitejs/vite/commit/09ba7c62ab68e43b02236028c6f7641f8bd308b1)), closes [#14329](https://github.com/vitejs/vite/issues/14329)
* perf: replace startsWith with === (#14300) ([75cd29c](https://github.com/vitejs/vite/commit/75cd29cf6feea90de4aebae5e37cd0ca45866322)), closes [#14300](https://github.com/vitejs/vite/issues/14300)
* perf: replace fromEntries with a for loop (#14041) ([8b174fd](https://github.com/vitejs/vite/commit/8b174fdcc798092c5002d586e4f25cb2a6f8768a)), closes [#14041](https://github.com/vitejs/vite/issues/14041)
* perf: use `URL.canParse` (#14068) ([dcee6ef](https://github.com/vitejs/vite/commit/dcee6ef08e98548eea262695249134ab7ada0302)), closes [#14068](https://github.com/vitejs/vite/issues/14068)

### Fixes

* fix: caret position was incorrect (#14984) ([2b4e793](https://github.com/vitejs/vite/commit/2b4e7935d7bd05ce68320dc24eee3c3c04b0672d)), closes [#14984](https://github.com/vitejs/vite/issues/14984)
* fix: code frame was not generated for postcss errors (#14986) ([bedfcfa](https://github.com/vitejs/vite/commit/bedfcfad4b64cabde8008a6469a37c66b69372be)), closes [#14986](https://github.com/vitejs/vite/issues/14986)
* fix: don't append `/@fs/` for bare imports (#14995) ([2a519a1](https://github.com/vitejs/vite/commit/2a519a176d9f499d2b2814cc08549e9985a048e5)), closes [#14995](https://github.com/vitejs/vite/issues/14995)
* fix: server.preTransformRequests https error (#14991) (#14993) ([58ff849](https://github.com/vitejs/vite/commit/58ff8499d723ce6f87624faa1e17c218baa9793f)), closes [#14991](https://github.com/vitejs/vite/issues/14991) [#14993](https://github.com/vitejs/vite/issues/14993)
* fix(ssr): skip esm proxy guard for namespace imports (#14988) ([82a5b11](https://github.com/vitejs/vite/commit/82a5b11f80a8c5f04abab54336ee406d9e424d13)), closes [#14988](https://github.com/vitejs/vite/issues/14988)
* fix: don't watch SPA fallback paths (#14953) ([24c2c57](https://github.com/vitejs/vite/commit/24c2c57b4476a0f6e5075d9e32b4d5d17b2b85f8)), closes [#14953](https://github.com/vitejs/vite/issues/14953)
* fix: handle addWatchFile in load hooks (#14967) ([a0ab85b](https://github.com/vitejs/vite/commit/a0ab85bdf4abe39a6d2133b89b1bb041fd77019c)), closes [#14967](https://github.com/vitejs/vite/issues/14967)
* fix: preload marker duplicate deps (#14955) ([55335cc](https://github.com/vitejs/vite/commit/55335cc3d9f91238302d9fb94c3bfc0bdbfef385)), closes [#14955](https://github.com/vitejs/vite/issues/14955)
* fix: relax overlay frame regex (#14979) ([0b325bb](https://github.com/vitejs/vite/commit/0b325bbd25c93c8e14fff157fc83ff39b3eb3dae)), closes [#14979](https://github.com/vitejs/vite/issues/14979)
* fix(deps): update all non-major dependencies (#14961) ([0bb3995](https://github.com/vitejs/vite/commit/0bb3995a7d2245ef1cc7b2ed8a5242e33af16874)), closes [#14961](https://github.com/vitejs/vite/issues/14961)
* fix(esbuild): set js loader for build transpile (#14980) ([80beede](https://github.com/vitejs/vite/commit/80beedea0231e7d58ce7c318ba412c7ab638a026)), closes [#14980](https://github.com/vitejs/vite/issues/14980)
* fix(pluginContainer): run transform in this.load (#14965) ([3f57b05](https://github.com/vitejs/vite/commit/3f57b0579a70d81af1f352d9f6f3855129c642ac)), closes [#14965](https://github.com/vitejs/vite/issues/14965)
* fix: `server.headers` after restart in middleware mode (#14905) ([f9ce9db](https://github.com/vitejs/vite/commit/f9ce9dbc8cc8e9551b9b30bcfa1cf4977ae3d9a6)), closes [#14905](https://github.com/vitejs/vite/issues/14905)
* fix: add watch in fallback file load (#14938) ([b24b951](https://github.com/vitejs/vite/commit/b24b95119b0c3222024f44a6818c6e7820b3b0d2)), closes [#14938](https://github.com/vitejs/vite/issues/14938)
* fix: injectQuery check with double slash in the url (#14910) ([84c5ff6](https://github.com/vitejs/vite/commit/84c5ff69442fe4977568951a6b237b65d7572f8b)), closes [#14910](https://github.com/vitejs/vite/issues/14910)
* fix(build): make build error message clearer (#14761) ([350b4b2](https://github.com/vitejs/vite/commit/350b4b238dc055f267fe0d1ec13c831972e23cfa)), closes [#14761](https://github.com/vitejs/vite/issues/14761)
* fix(css): correctly set manifest source name and emit CSS file (#14945) ([28ccede](https://github.com/vitejs/vite/commit/28ccede5254d0801ba158f391df5a22844306368)), closes [#14945](https://github.com/vitejs/vite/issues/14945)
* fix(server): the server restart port should remain unchanged (#14418) ([8b96e97](https://github.com/vitejs/vite/commit/8b96e9723486667f6854f68741c9075f3a6fdf55)), closes [#14418](https://github.com/vitejs/vite/issues/14418)
* fix(worker): prevent inject esm in classic workers (#14918) ([2687dbb](https://github.com/vitejs/vite/commit/2687dbbd4e19c86f9888ee784c9b51598e8b79ca)), closes [#14918](https://github.com/vitejs/vite/issues/14918)
* fix: file link in overlay with custom backend (#14879) ([1bfb584](https://github.com/vitejs/vite/commit/1bfb584e5b1d9d236692883d282a2a7079f2b384)), closes [#14879](https://github.com/vitejs/vite/issues/14879)
* fix: processNodeUrl for srcset (#14870) ([0873bae](https://github.com/vitejs/vite/commit/0873bae0cfe0f0718ad2f5743dd34a17e4ab563d)), closes [#14870](https://github.com/vitejs/vite/issues/14870)
* fix: resovedUrls is null after server restart (#14890) ([bd4d29f](https://github.com/vitejs/vite/commit/bd4d29f9fc03ab92b351ae503c44f82ec0290795)), closes [#14890](https://github.com/vitejs/vite/issues/14890)
* fix: use latest module graph in transform middleware (#14892) ([b6b382c](https://github.com/vitejs/vite/commit/b6b382c8510f845ef1fcb8e79174ef9bc22c8ff4)), closes [#14892](https://github.com/vitejs/vite/issues/14892)
* fix(assets): use base64 when inlining SVG with foreignObject tag (#14875) ([9e20ed6](https://github.com/vitejs/vite/commit/9e20ed6ead291e67c30b79a50f0ca05d60a321eb)), closes [#14875](https://github.com/vitejs/vite/issues/14875)
* fix(build): mixed external and transpiled srcset  (#14888) ([b5653d3](https://github.com/vitejs/vite/commit/b5653d3075559a327b8d87a3863be3260d880e3a)), closes [#14888](https://github.com/vitejs/vite/issues/14888)
* fix(css): fix sourcemap warning in build with lightningCSS (#14871) ([11b1796](https://github.com/vitejs/vite/commit/11b1796456835120e4ad745cbabb843a4c96622e)), closes [#14871](https://github.com/vitejs/vite/issues/14871)
* fix(css): initialize lightningCSS targets when not using options (#14872) ([12f9230](https://github.com/vitejs/vite/commit/12f92305891052a7d479e54d708b5fc705596da0)), closes [#14872](https://github.com/vitejs/vite/issues/14872)
* fix: use correct publicDir in ERR_LOAD_PUBLIC_URL (#14847) ([66caef3](https://github.com/vitejs/vite/commit/66caef369dbe80bb3fbaabdae5ffb05c42124f32)), closes [#14847](https://github.com/vitejs/vite/issues/14847)
* fix(define): correctly replace same define values (#14786) ([f36fcd2](https://github.com/vitejs/vite/commit/f36fcd234d61b4b133667bda8f25c85d9687384d)), closes [#14786](https://github.com/vitejs/vite/issues/14786)
* fix(deps): update all non-major dependencies (#14729) ([d5d96e7](https://github.com/vitejs/vite/commit/d5d96e712788bc762d9c135bc84628dbcfc7fb58)), closes [#14729](https://github.com/vitejs/vite/issues/14729)
* fix(worker): force rollup to build workerImportMetaUrl under watch mode (#14712) ([8db40ee](https://github.com/vitejs/vite/commit/8db40ee5de67047e7f31a4d0cd27c6e86c91449c)), closes [#14712](https://github.com/vitejs/vite/issues/14712)
* fix: skip watchPackageDataPlugin for worker builds (#14762) ([9babef5](https://github.com/vitejs/vite/commit/9babef54c6d25c1948c95812b7ea95d618214736)), closes [#14762](https://github.com/vitejs/vite/issues/14762)
* fix: suppress addWatchFile invalid phase error (#14751) ([c3622d7](https://github.com/vitejs/vite/commit/c3622d70495d9f4fcfa9690f4f4dba7154d0a6c8)), closes [#14751](https://github.com/vitejs/vite/issues/14751)
* fix(css): ensure code is valid after empty css chunk imports are removed (fix #14515) (#14517) ([72f6a52](https://github.com/vitejs/vite/commit/72f6a52a0d0a042a05746419b1a5383138b7e8ff)), closes [#14515](https://github.com/vitejs/vite/issues/14515) [#14517](https://github.com/vitejs/vite/issues/14517)
* fix(html): ignore rewrite external urls (#14774) ([d6d1ef1](https://github.com/vitejs/vite/commit/d6d1ef156a33812f0723b8c3089ccbc3d316a3ab)), closes [#14774](https://github.com/vitejs/vite/issues/14774)
* fix(assets): fix svg inline in css url (#14714) ([eef4aaa](https://github.com/vitejs/vite/commit/eef4aaa063ed420c213cb9e24f680230cf2132b2)), closes [#14714](https://github.com/vitejs/vite/issues/14714)
* fix(resolve): make directory package.json check best effort (#14626) ([d520388](https://github.com/vitejs/vite/commit/d520388fca12f86df9dcc31e38cea76f180a2ff0)), closes [#14626](https://github.com/vitejs/vite/issues/14626)
* fix(assets): make timestamp invalidation lazy (#14675) ([dd610b5](https://github.com/vitejs/vite/commit/dd610b5f77fb596b3d64f2f7fb94ccce392777a7)), closes [#14675](https://github.com/vitejs/vite/issues/14675)
* fix(build): add crossorigin attribute to `link[rel="stylesheet"]` (#12991) ([6e7b25c](https://github.com/vitejs/vite/commit/6e7b25c7c60fe6c988a3cb66609e09dca6ea463c)), closes [#12991](https://github.com/vitejs/vite/issues/12991)
* fix(hmr): clean importers in module graph when file is deleted (#14315) ([7acb016](https://github.com/vitejs/vite/commit/7acb016fbbabcf6347b6c044b252a12f00f42d97)), closes [#14315](https://github.com/vitejs/vite/issues/14315)
* fix(manifest): include assets referenced in html (#14657) ([f627b91](https://github.com/vitejs/vite/commit/f627b91c23b968c6b44005934aa795e62f4fcd6a)), closes [#14657](https://github.com/vitejs/vite/issues/14657)
* fix: avoid --open optimization if preTransformRequests is disabled (#14666) ([d4f62e4](https://github.com/vitejs/vite/commit/d4f62e474b6860f0625173ce8ff4501bd3af7ad2)), closes [#14666](https://github.com/vitejs/vite/issues/14666)
* fix(dynamic-import-vars): preserve custom query string (#14459) ([1f2a982](https://github.com/vitejs/vite/commit/1f2a982360a0825a98d818517fb3d692dbed27bc)), closes [#14459](https://github.com/vitejs/vite/issues/14459)
* fix(hmr): add timestamp for assets in dev (#13371) ([40ee245](https://github.com/vitejs/vite/commit/40ee2457a7be80001e3d88ad9394c0591f620dd0)), closes [#13371](https://github.com/vitejs/vite/issues/13371)
* fix(html): srcset pointing image in public dir wasn't working during dev (#14663) ([4496ae7](https://github.com/vitejs/vite/commit/4496ae788387f350da09266defd7ded0bf3ab6c1)), closes [#14663](https://github.com/vitejs/vite/issues/14663)
* fix(deps): update all non-major dependencies (#14635) ([21017a9](https://github.com/vitejs/vite/commit/21017a9408643cbc7204215ecc5a3fdaf74dc81e)), closes [#14635](https://github.com/vitejs/vite/issues/14635)
* fix(esbuild): handle tsconfck cache undefined (#14650) ([4e763c5](https://github.com/vitejs/vite/commit/4e763c508267a17d841b3cee11d93f6cafe8a142)), closes [#14650](https://github.com/vitejs/vite/issues/14650)
* fix: off-by-one bug in HTML whitespace removal (#14589) ([f54e6d8](https://github.com/vitejs/vite/commit/f54e6d8dad6daeaede55d6363ed7f1cf6899f914)), closes [#14589](https://github.com/vitejs/vite/issues/14589)
* fix(html): import expression in classic script for dev (#14595) ([ea47b8f](https://github.com/vitejs/vite/commit/ea47b8fa51d958bc3fa9d27dc23c0bae2b6066d7)), closes [#14595](https://github.com/vitejs/vite/issues/14595)
* fix(html): inline style attribute not working in dev (#14592) ([a4a17b8](https://github.com/vitejs/vite/commit/a4a17b8e3e3acae0465c888e2e4ac8314c4cd036)), closes [#14592](https://github.com/vitejs/vite/issues/14592)
* fix(html): relative paths without leading dot wasn't rewritten (#14591) ([0a38e3b](https://github.com/vitejs/vite/commit/0a38e3b395d1e705321f6f18690acde5f0fc378c)), closes [#14591](https://github.com/vitejs/vite/issues/14591)
* fix(proxy): correct the logic of bypass returning false (#14579) ([261633a](https://github.com/vitejs/vite/commit/261633a1a1d22706728701b42b4b113662122802)), closes [#14579](https://github.com/vitejs/vite/issues/14579)
* fix(optimizer): limit bundled file name length to 170 characters (#14561) ([a3b6d8d](https://github.com/vitejs/vite/commit/a3b6d8da6be78eefe6fea4ebf9fc0614157d6117)), closes [#14561](https://github.com/vitejs/vite/issues/14561)
* fix: esbuild glob resolve error (#14533) ([3615c68](https://github.com/vitejs/vite/commit/3615c68172ca77da2da69ef2c7bd471fa276d174)), closes [#14533](https://github.com/vitejs/vite/issues/14533)
* fix: update transform error message (#14139) ([e0eb304](https://github.com/vitejs/vite/commit/e0eb30401b1875e2bb0b2f01362934aec161efa8)), closes [#14139](https://github.com/vitejs/vite/issues/14139)
* fix(deps): update all non-major dependencies (#14510) ([eb204fd](https://github.com/vitejs/vite/commit/eb204fd3c5bffb6c6fb40f562f762e426fbaf183)), closes [#14510](https://github.com/vitejs/vite/issues/14510)
* fix(deps): update all non-major dependencies (#14559) ([6868480](https://github.com/vitejs/vite/commit/6868480d0036f08388e82611992d58ee52cf97b7)), closes [#14559](https://github.com/vitejs/vite/issues/14559)
* fix(lib): esbuild helper functions injection not working with named exports (#14539) ([5004d00](https://github.com/vitejs/vite/commit/5004d004e7c86363a778b584ca3b94eb0b18950f)), closes [#14539](https://github.com/vitejs/vite/issues/14539)
* fix: allow path ending with .html to fallback to index.html ([dae6d0a](https://github.com/vitejs/vite/commit/dae6d0aa63d436da747cbc67ad9e735b0d1934f0))
* fix: handle fs.realpath.native MAX_PATH issue for Node.js <18.10 (#14487) ([17c5928](https://github.com/vitejs/vite/commit/17c5928415ebedbc6b4b13ac90592b2a0160c383)), closes [#14487](https://github.com/vitejs/vite/issues/14487)
* fix: update .html fallback in MPA ([b5637a7](https://github.com/vitejs/vite/commit/b5637a722ae64a9b5ed3d4700a8e064c55df0a76))
* fix(analysis): warnings for dynamic imports that use static template literals (#14458) ([ec7ee22](https://github.com/vitejs/vite/commit/ec7ee22cf15bed05a6c55693ecbac27cfd615118)), closes [#14458](https://github.com/vitejs/vite/issues/14458)
* fix(hmr): dev mode reduce unnecessary restart (#14426) ([6f9d39d](https://github.com/vitejs/vite/commit/6f9d39dcd3f18979a568bf93e751fea6ee405686)), closes [#14426](https://github.com/vitejs/vite/issues/14426)
* fix(import-analysis): preserve importedUrls import order (#14465) ([99b0645](https://github.com/vitejs/vite/commit/99b0645c4cc0ed9cab8362f0627dc27b8ccdb5d5)), closes [#14465](https://github.com/vitejs/vite/issues/14465)
* fix(preview): allow path containing . to fallback to index.html ([fddc151](https://github.com/vitejs/vite/commit/fddc1518d1c022ff0d372d55fac9cd396b1590de))
* fix(resolve): support submodules of optional peer deps (#14489) ([f80ff77](https://github.com/vitejs/vite/commit/f80ff77a4326669a07f76df3a2ccd66f9e0cafa5)), closes [#14489](https://github.com/vitejs/vite/issues/14489)
* fix: handle errors during `hasWorkspacePackageJSON` function (#14394) ([c3e4791](https://github.com/vitejs/vite/commit/c3e4791beb647661d81a4a36fd94d92ece965e19)), closes [#14394](https://github.com/vitejs/vite/issues/14394)
* fix: unify css collecting order (#11671) ([20a8a15](https://github.com/vitejs/vite/commit/20a8a15ffcc48b849be5a09d31688d63f9c1ca0d)), closes [#11671](https://github.com/vitejs/vite/issues/11671)
* fix(deps): update all non-major dependencies (#14092) ([68638f7](https://github.com/vitejs/vite/commit/68638f7b0b04ddfdf35dc8686c6a022aadbb9453)), closes [#14092](https://github.com/vitejs/vite/issues/14092)
* fix(deps): update all non-major dependencies (#14460) ([b77bff0](https://github.com/vitejs/vite/commit/b77bff0b93ba9449f63c8373ecf82289a39832a0)), closes [#14460](https://github.com/vitejs/vite/issues/14460)
* fix(deps): update dependency dotenv-expand to v10 (#14391) ([d6bde8b](https://github.com/vitejs/vite/commit/d6bde8b03d433778aaed62afc2be0630c8131908)), closes [#14391](https://github.com/vitejs/vite/issues/14391)
* fix: omit 'plugins' since it has no effect (#13879) ([64888b0](https://github.com/vitejs/vite/commit/64888b0d75040f61e6a2d2ac6edefec0dbd98c17)), closes [#13879](https://github.com/vitejs/vite/issues/13879)
* fix: typo (#14334) ([30df500](https://github.com/vitejs/vite/commit/30df500e7a93c8717c78f63839e3d8ae1b9bad5c)), closes [#14334](https://github.com/vitejs/vite/issues/14334)
* fix: typo (#14337) ([6ffe070](https://github.com/vitejs/vite/commit/6ffe0703e2ba968705832dd58ab2ed78deee8d22)), closes [#14337](https://github.com/vitejs/vite/issues/14337)
* fix: use relative path for sources field (#14247) ([a995907](https://github.com/vitejs/vite/commit/a99590762d7602666a7759bd2cdb51f9c41c773d)), closes [#14247](https://github.com/vitejs/vite/issues/14247)
* fix(manifest): preserve pure css chunk assets (#14297) ([4bf31e5](https://github.com/vitejs/vite/commit/4bf31e5c6071b87ecf754b496dc14b3d90d73608)), closes [#14297](https://github.com/vitejs/vite/issues/14297)
* fix(resolve): support `pkg?query` ([21bbceb](https://github.com/vitejs/vite/commit/21bbceb8003dcd3ab00704f35270988b3e5c1f1c))
* fix(sourcemap): dont inject fallback sourcemap if have existing (#14370) ([55a3b4f](https://github.com/vitejs/vite/commit/55a3b4fb2b3ea658ceff5399794f02a6585f2c2c)), closes [#14370](https://github.com/vitejs/vite/issues/14370)
* fix(worker): inline es worker does not work in build mode (#14307) ([7371c5c](https://github.com/vitejs/vite/commit/7371c5caac09ad2f512c2a87154fa6b8886a38dd)), closes [#14307](https://github.com/vitejs/vite/issues/14307)
* fix: add source map to Web Workers (fix #14216) (#14217) ([6f86de3](https://github.com/vitejs/vite/commit/6f86de356985b2604eb757897e039520195dcc23)), closes [#14216](https://github.com/vitejs/vite/issues/14216) [#14217](https://github.com/vitejs/vite/issues/14217)
* fix: handle sourcemap correctly when multiple line import exists (#14232) ([627159d](https://github.com/vitejs/vite/commit/627159d59b7ed03de4f283ad5240c949ef0487a0)), closes [#14232](https://github.com/vitejs/vite/issues/14232)
* fix: include `vite/types/*` in exports field (#14296) ([66a97be](https://github.com/vitejs/vite/commit/66a97bec6ea66e1fd9a4e047c3d47d65a9077647)), closes [#14296](https://github.com/vitejs/vite/issues/14296)
* fix: use string manipulation instead of regex to inject esbuild helpers (#14094) ([91a18c2](https://github.com/vitejs/vite/commit/91a18c2f7da796ff8217417a4bf189ddda719895)), closes [#14094](https://github.com/vitejs/vite/issues/14094)
* fix(cli): convert special base (#14283) ([34826aa](https://github.com/vitejs/vite/commit/34826aae015ed16dc9b9096c0f778154ca6981a6)), closes [#14283](https://github.com/vitejs/vite/issues/14283)
* fix(css): remove pure css chunk sourcemap (#14290) ([2b80089](https://github.com/vitejs/vite/commit/2b80089491eb028468c54b3f1e7cf375c94a4432)), closes [#14290](https://github.com/vitejs/vite/issues/14290)
* fix(css): reset render cache on renderStart (#14326) ([19bf0f1](https://github.com/vitejs/vite/commit/19bf0f1d0be03572d8303bc71e6d6df6a0b29e0e)), closes [#14326](https://github.com/vitejs/vite/issues/14326)
* fix(css): spread lightningcss options (#14313) ([80c6608](https://github.com/vitejs/vite/commit/80c6608dec9b524561c9f66467643c3f552ca6ae)), closes [#14313](https://github.com/vitejs/vite/issues/14313)
* fix(optimizer): define crawlDeps after scanProcessing and optimizationResult are complete (fix #1428 ([c5f6558](https://github.com/vitejs/vite/commit/c5f65587569f8dd7ef083261021c572e02248b29)), closes [#14284](https://github.com/vitejs/vite/issues/14284) [#14285](https://github.com/vitejs/vite/issues/14285)
* fix(vite): precisely check if files are in dirs (#14241) ([245d186](https://github.com/vitejs/vite/commit/245d186544a660afa7ec835f7ebed8766dca0361)), closes [#14241](https://github.com/vitejs/vite/issues/14241)
* revert: "fix(css): spread lightningcss options (#14024)" (#14209) ([5778365](https://github.com/vitejs/vite/commit/5778365a2478a9ba5bdd3f3f1a6d39d91d45385b)), closes [#14024](https://github.com/vitejs/vite/issues/14024) [#14209](https://github.com/vitejs/vite/issues/14209)
* fix: breakpoints in JS not working (#13514) ([0156bd2](https://github.com/vitejs/vite/commit/0156bd2cd7d61bb288ff69436a06f5b36109ef58)), closes [#13514](https://github.com/vitejs/vite/issues/13514)
* fix: if host is specified check whether it is valid (#14013) ([c39e6c1](https://github.com/vitejs/vite/commit/c39e6c1ccfcb37ff3328a6f5487e11a8f753cec1)), closes [#14013](https://github.com/vitejs/vite/issues/14013)
* fix: initWasm options should be optional (#14152) ([387a6e8](https://github.com/vitejs/vite/commit/387a6e875a77d9c2e515c1b56d9172493916d64d)), closes [#14152](https://github.com/vitejs/vite/issues/14152)
* fix: rollup watch crash on Windows (#13339) ([4f582c9](https://github.com/vitejs/vite/commit/4f582c91d7e0e17c144fadf02a2b2ff485973ab5)), closes [#13339](https://github.com/vitejs/vite/issues/13339)
* fix: ws never connects after restarting server if server.hmr.server is set (#14127) ([bd9b749](https://github.com/vitejs/vite/commit/bd9b749fe5c7d390a48368ca3a2f4ac55e730607)), closes [#14127](https://github.com/vitejs/vite/issues/14127)
* fix(client): correctly display the config file name (#14160) ([61e801d](https://github.com/vitejs/vite/commit/61e801d10da8d67f6886993e4a723014d3865a08)), closes [#14160](https://github.com/vitejs/vite/issues/14160)
* fix(css): spread lightningcss options (#14024) ([63a4451](https://github.com/vitejs/vite/commit/63a44511133276f903e54d4dde4296d5d5963298)), closes [#14024](https://github.com/vitejs/vite/issues/14024)
* fix(css): trim esbuild's minified css (#13893) ([7682a62](https://github.com/vitejs/vite/commit/7682a625fd74d5b2b4659dc99f2a5645ae839020)), closes [#13893](https://github.com/vitejs/vite/issues/13893)
* fix(glob): trigger HMR for glob in a  package (#14117) ([86cbf69](https://github.com/vitejs/vite/commit/86cbf6977d259cfbe87b287f42cf20668014aef3)), closes [#14117](https://github.com/vitejs/vite/issues/14117)

### Cleanup

* docs: point links in messages at https: (#14992) ([d3af879](https://github.com/vitejs/vite/commit/d3af8791c0973e3fe0aa3a65ed0af7d037cbf73d)), closes [#14992](https://github.com/vitejs/vite/issues/14992)
* build: dont strip single line comments (#14969) ([ea9ccb7](https://github.com/vitejs/vite/commit/ea9ccb7def71ebbbc01b1f2ac44c6e179d559040)), closes [#14969](https://github.com/vitejs/vite/issues/14969)
* build: strip internal parameters ([1168e57](https://github.com/vitejs/vite/commit/1168e5709765097f49d48d843015b7e9eabfcda9))
* chore: refactor as functions ([5684382](https://github.com/vitejs/vite/commit/5684382f482bae5f27b8d68687ada72bf56d4bfa))
* chore: add `PluginWithRequiredHook` type & extract `getHookHandler` function  (#14845) ([997f2d5](https://github.com/vitejs/vite/commit/997f2d53df423c5cf2ca6c534a6e852bc46458de)), closes [#14845](https://github.com/vitejs/vite/issues/14845)
* chore(optimizedDeps): remove unused return (#14773) ([9d744dd](https://github.com/vitejs/vite/commit/9d744dd775d82c388bc006d250be32f3c76a94d1)), closes [#14773](https://github.com/vitejs/vite/issues/14773)
* refactor: simplify build optimizer node_env handling (#14829) ([275907b](https://github.com/vitejs/vite/commit/275907b6a3a226198e8243e43b21e82dc9532dd7)), closes [#14829](https://github.com/vitejs/vite/issues/14829)
* chore: fix typo (#14820) ([eda1247](https://github.com/vitejs/vite/commit/eda12472baa80a6605440dba2656d9adc6c4a538)), closes [#14820](https://github.com/vitejs/vite/issues/14820)
* chore: revert "feat: show warning to discourage putting process/global to `define` option (#14447)"  ([0426910](https://github.com/vitejs/vite/commit/0426910c0301861186a668e4a3fba627f1c421d4)), closes [#14447](https://github.com/vitejs/vite/issues/14447) [#14827](https://github.com/vitejs/vite/issues/14827)
* chore: update license (#14790) ([ac5d8a7](https://github.com/vitejs/vite/commit/ac5d8a7745776f6d7921a110ac650ab48037debf)), closes [#14790](https://github.com/vitejs/vite/issues/14790)
* chore(shortcuts): resolve generic type error (#14802) ([a090742](https://github.com/vitejs/vite/commit/a090742a6528aa2eff88226d411d821de5b12e94)), closes [#14802](https://github.com/vitejs/vite/issues/14802)
* refactor: update es-module-lexer to 1.4.0 (#14937) ([374e6fd](https://github.com/vitejs/vite/commit/374e6fd863a2ae8891df0b6fb22fce20292626d3)), closes [#14937](https://github.com/vitejs/vite/issues/14937)
* chore(esbuild): fix typo (#14772) ([6cfc1e2](https://github.com/vitejs/vite/commit/6cfc1e23908b34b7936e939896ac821fb0225703)), closes [#14772](https://github.com/vitejs/vite/issues/14772)
* revert: remove AsyncDisposable (#14908) ([b953b0d](https://github.com/vitejs/vite/commit/b953b0dbab25e1beaf23ff80b0a508f72a98f899)), closes [#14908](https://github.com/vitejs/vite/issues/14908)
* refactor(ssr): remove unused metadata code (#14711) ([c5f2d60](https://github.com/vitejs/vite/commit/c5f2d609024467df23981a21d69600d2e8481199)), closes [#14711](https://github.com/vitejs/vite/issues/14711)
* refactor: use dynamic import directly (#14661) ([af60592](https://github.com/vitejs/vite/commit/af6059285d58d2412bbf0f0fb60b8e2100f933a6)), closes [#14661](https://github.com/vitejs/vite/issues/14661)
* chore(config): improve the readability of warning messages (#14594) ([b43b4df](https://github.com/vitejs/vite/commit/b43b4dfd8ffdccb571b517a82c32a1d299dcaeaa)), closes [#14594](https://github.com/vitejs/vite/issues/14594)
* build: clean generated type file (#14582) ([fffe16e](https://github.com/vitejs/vite/commit/fffe16ee9a9773910ef6cc8e9f0b75b3b9db7b58)), closes [#14582](https://github.com/vitejs/vite/issues/14582)
* build: use rollup-plugin-dts (#14571) ([d89725b](https://github.com/vitejs/vite/commit/d89725b1a424969245b7ec00c140efe483f3e2f8)), closes [#14571](https://github.com/vitejs/vite/issues/14571)
* refactor(css): make `getEmptyChunkReplacer` for unit test (#14528) ([18900fd](https://github.com/vitejs/vite/commit/18900fdd39d65da77846c01297e497995e234ece)), closes [#14528](https://github.com/vitejs/vite/issues/14528)
* refactor: ensure HTML is stripped of generated blank lines (#14274) ([bc97091](https://github.com/vitejs/vite/commit/bc97091ec0ccfc2d1393f78a4e6751d91117e6ce)), closes [#14274](https://github.com/vitejs/vite/issues/14274)
* refactor: remove unused record flatIdToExports (#14557) ([7e62710](https://github.com/vitejs/vite/commit/7e62710326f72b5f66d35068a6e736f9de628316)), closes [#14557](https://github.com/vitejs/vite/issues/14557)
* test(ssr): add import and export ordering snapshot (#14468) ([ca34c64](https://github.com/vitejs/vite/commit/ca34c64b1dc6e898495d655f89c300dd14758121)), closes [#14468](https://github.com/vitejs/vite/issues/14468)
* refactor: remove CJS ssr output format (#13944) ([2f60b9e](https://github.com/vitejs/vite/commit/2f60b9e9f728008f00eb5cb47155dda4f3e7be08)), closes [#13944](https://github.com/vitejs/vite/issues/13944)
* refactor: replace duplicate code with tryStatSync (#14461) ([be6b0c8](https://github.com/vitejs/vite/commit/be6b0c8cceb342212f042e7cc94c0bd5d1608c45)), closes [#14461](https://github.com/vitejs/vite/issues/14461)
* refactor(config): remove unnecessary esbuild option (#13580) ([67f4e52](https://github.com/vitejs/vite/commit/67f4e52102c9c9fd637a35e11644399d28da38f0)), closes [#13580](https://github.com/vitejs/vite/issues/13580)
* test(ssr): proper test coverage of SSR shebang import hoisting (#14448) ([fdd4669](https://github.com/vitejs/vite/commit/fdd466946c2a7fe4ff1a6d1b5950820b310c61f9)), closes [#14448](https://github.com/vitejs/vite/issues/14448)
* chore(optimizer): debug info on cache dir handle process (#12858) ([21a62da](https://github.com/vitejs/vite/commit/21a62daea59b66cf095f5de1a230ccc0bea5932b)), closes [#12858](https://github.com/vitejs/vite/issues/12858)
* refactor(css): remove `export {}` ([98fbdc3](https://github.com/vitejs/vite/commit/98fbdc32f2c01b0289b3bc6adb2cb71e57de497b))
* chore: fix ts error (#14053) ([6cb397f](https://github.com/vitejs/vite/commit/6cb397fd2de29a57ba67962b7865ff310aed4d70)), closes [#14053](https://github.com/vitejs/vite/issues/14053)
* chore: use "kB" everywhere with the correct definition (#14061) ([f97ef58](https://github.com/vitejs/vite/commit/f97ef58787ba02bf6dafa157e9bec534cfc27108)), closes [#14061](https://github.com/vitejs/vite/issues/14061)
* chore(client): remove redundant if statement (#14137) ([fe1c0b9](https://github.com/vitejs/vite/commit/fe1c0b92392ae19a2819aa8ff0087610c67e0f4a)), closes [#14137](https://github.com/vitejs/vite/issues/14137)
* refactor(css): use `preliminaryFileName` to detect pure CSS chunks (#13974) ([835249d](https://github.com/vitejs/vite/commit/835249d7351242308dde429003764656a15a6b6e)), closes [#13974](https://github.com/vitejs/vite/issues/13974)



### Previous Changelogs


#### [5.0.0-beta.20](https://github.com/vitejs/vite/compare/v5.0.0-beta.19...v5.0.0-beta.20) (2023-11-15)
See [5.0.0-beta.20 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.20/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.19](https://github.com/vitejs/vite/compare/v5.0.0-beta.18...v5.0.0-beta.19) (2023-11-14)
See [5.0.0-beta.19 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.19/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.18](https://github.com/vitejs/vite/compare/v5.0.0-beta.17...v5.0.0-beta.18) (2023-11-11)
See [5.0.0-beta.18 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.18/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.17](https://github.com/vitejs/vite/compare/v5.0.0-beta.16...v5.0.0-beta.17) (2023-11-07)
See [5.0.0-beta.17 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.17/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.16](https://github.com/vitejs/vite/compare/v5.0.0-beta.15...v5.0.0-beta.16) (2023-11-03)
See [5.0.0-beta.16 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.16/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.15](https://github.com/vitejs/vite/compare/v5.0.0-beta.14...v5.0.0-beta.15) (2023-11-01)
See [5.0.0-beta.15 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.15/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.14](https://github.com/vitejs/vite/compare/v5.0.0-beta.13...v5.0.0-beta.14) (2023-10-30)
See [5.0.0-beta.14 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.14/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.13](https://github.com/vitejs/vite/compare/v5.0.0-beta.12...v5.0.0-beta.13) (2023-10-27)
See [5.0.0-beta.13 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.13/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.12](https://github.com/vitejs/vite/compare/v5.0.0-beta.11...v5.0.0-beta.12) (2023-10-23)
See [5.0.0-beta.12 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.12/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.11](https://github.com/vitejs/vite/compare/v5.0.0-beta.10...v5.0.0-beta.11) (2023-10-19)
See [5.0.0-beta.11 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.11/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.10](https://github.com/vitejs/vite/compare/v5.0.0-beta.9...v5.0.0-beta.10) (2023-10-17)
See [5.0.0-beta.10 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.10/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.9](https://github.com/vitejs/vite/compare/v5.0.0-beta.8...v5.0.0-beta.9) (2023-10-17)

See [5.0.0-beta.9 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.9/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.8](https://github.com/vitejs/vite/compare/v5.0.0-beta.7...v5.0.0-beta.8) (2023-10-16)

See [5.0.0-beta.8 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.8/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.7](https://github.com/vitejs/vite/compare/v5.0.0-beta.6...v5.0.0-beta.7) (2023-10-12)

See [5.0.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.7/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.6](https://github.com/vitejs/vite/compare/v5.0.0-beta.5...v5.0.0-beta.6) (2023-10-10)

See [5.0.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.6/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.5](https://github.com/vitejs/vite/compare/v5.0.0-beta.4...v5.0.0-beta.5) (2023-10-09)

See [5.0.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.5/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.4](https://github.com/vitejs/vite/compare/v5.0.0-beta.3...v5.0.0-beta.4) (2023-10-02)

See [5.0.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.4/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.3](https://github.com/vitejs/vite/compare/v5.0.0-beta.2...v5.0.0-beta.3) (2023-09-25)

See [5.0.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.3/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.2](https://github.com/vitejs/vite/compare/v5.0.0-beta.1...v5.0.0-beta.2) (2023-09-15)

See [5.0.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.2/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.1](https://github.com/vitejs/vite/compare/v5.0.0-beta.0...v5.0.0-beta.1) (2023-09-08)

See [5.0.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.1/packages/vite/CHANGELOG.md)


#### [5.0.0-beta.0](https://github.com/vitejs/vite/compare/v4.4.9...v5.0.0-beta.0) (2023-08-24)

See [5.0.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v5.0.0-beta.0/packages/vite/CHANGELOG.md)


## 4.5.0 (2023-10-18)

* feat: backport mdx as known js source (#14560) (#14670) ([45595ef](https://github.com/vitejs/vite/commit/45595ef82f786d6b321ce002f2cd4951659114ac)), closes [#14560](https://github.com/vitejs/vite/issues/14560) [#14670](https://github.com/vitejs/vite/issues/14670)
* feat: scan .marko files (#14669) ([ed7bdc5](https://github.com/vitejs/vite/commit/ed7bdc520679577509466ce808a1794ba8377204)), closes [#14669](https://github.com/vitejs/vite/issues/14669)
* feat(ssr): backport ssr.resolve.conditions and ssr.resolve.externalConditions (#14498) (#14668) ([520139c](https://github.com/vitejs/vite/commit/520139cdff88ae3a0bf89692133cce3e453cb29a)), closes [#14498](https://github.com/vitejs/vite/issues/14498) [#14668](https://github.com/vitejs/vite/issues/14668)



## <small>4.4.11 (2023-10-05)</small>

* revert: "fix: use string manipulation instead of regex to inject esbuild helpers ([54e1275](https://github.com/vitejs/vite/commit/54e12755c06a3ac8622ed1da5706fef68b69c50e)), closes [#14094](https://github.com/vitejs/vite/issues/14094)



## <small>4.4.10 (2023-10-03)</small>

* fix: add source map to Web Workers (fix #14216) (#14217) ([df6f32f](https://github.com/vitejs/vite/commit/df6f32f4bc893dabebc2afbf68533e7cb8654ccb)), closes [#14216](https://github.com/vitejs/vite/issues/14216) [#14217](https://github.com/vitejs/vite/issues/14217)
* fix: handle errors during `hasWorkspacePackageJSON` function (#14394) ([6f6e5de](https://github.com/vitejs/vite/commit/6f6e5de0ad8418328d52f58f4786f78b70cc6d3d)), closes [#14394](https://github.com/vitejs/vite/issues/14394)
* fix: handle sourcemap correctly when multiple line import exists (#14232) ([218861f](https://github.com/vitejs/vite/commit/218861f746222cf4d11369a45e7ecbdc47f72a9d)), closes [#14232](https://github.com/vitejs/vite/issues/14232)
* fix: if host is specified check whether it is valid (#14013) ([b1b816a](https://github.com/vitejs/vite/commit/b1b816a6bb470637fac04b06a7637b6c3d053455)), closes [#14013](https://github.com/vitejs/vite/issues/14013)
* fix: include `vite/types/*` in exports field (#14296) ([40e99a1](https://github.com/vitejs/vite/commit/40e99a117ca499dcb1ab684a3c038e2a9699fb5d)), closes [#14296](https://github.com/vitejs/vite/issues/14296)
* fix: initWasm options should be optional (#14152) ([119c074](https://github.com/vitejs/vite/commit/119c0746042947fb6cb3113dc93e9dba93f1116c)), closes [#14152](https://github.com/vitejs/vite/issues/14152)
* fix: restore builtins list ([f8b9adb](https://github.com/vitejs/vite/commit/f8b9adb73dc838f14a41406def918cfd6c9a841e))
* fix: use string manipulation instead of regex to inject esbuild helpers (#14094) ([128ad8f](https://github.com/vitejs/vite/commit/128ad8f925d2965429b24d820d40edebab9986d8)), closes [#14094](https://github.com/vitejs/vite/issues/14094)
* fix: ws never connects after restarting server if server.hmr.server is set (#14127) ([441642e](https://github.com/vitejs/vite/commit/441642e848b7f9c8435a76b5b8b33988210fe9c6)), closes [#14127](https://github.com/vitejs/vite/issues/14127)
* fix(analysis): warnings for dynamic imports that use static template literals (#14458) ([0c6d289](https://github.com/vitejs/vite/commit/0c6d289a2a34f3e0cd872013c6b8aa7e97e45eb0)), closes [#14458](https://github.com/vitejs/vite/issues/14458)
* fix(cli): convert special base (#14283) ([d4bc0fb](https://github.com/vitejs/vite/commit/d4bc0fb9f40b3e508b01ab8485e5a5b9b517da22)), closes [#14283](https://github.com/vitejs/vite/issues/14283)
* fix(css): remove pure css chunk sourcemap (#14290) ([cd7e033](https://github.com/vitejs/vite/commit/cd7e033c980b3127edc6c72b23ab6d47f314db3a)), closes [#14290](https://github.com/vitejs/vite/issues/14290)
* fix(css): reset render cache on renderStart (#14326) ([d334b3d](https://github.com/vitejs/vite/commit/d334b3de8cfc968481189643a7ad9baba0c7c36a)), closes [#14326](https://github.com/vitejs/vite/issues/14326)
* fix(glob): trigger HMR for glob in a  package (#14117) ([0f582bf](https://github.com/vitejs/vite/commit/0f582bf49cdd68ac93f8e3edae8d490e0e2cad52)), closes [#14117](https://github.com/vitejs/vite/issues/14117)
* fix(import-analysis): preserve importedUrls import order (#14465) ([269aa43](https://github.com/vitejs/vite/commit/269aa4393e326888a4ce76cd7a2e6b1f4d5c3102)), closes [#14465](https://github.com/vitejs/vite/issues/14465)
* fix(manifest): preserve pure css chunk assets (#14297) ([3d63ae6](https://github.com/vitejs/vite/commit/3d63ae6774b1a1fb015c2d8fa9bd50c074d81827)), closes [#14297](https://github.com/vitejs/vite/issues/14297)
* fix(optimizer): define crawlDeps after scanProcessing and optimizationResult are complete (fix #1428 ([fcaf749](https://github.com/vitejs/vite/commit/fcaf7491f4fbfafbda066dc372a9d2d5249bbce2)), closes [#14284](https://github.com/vitejs/vite/issues/14284) [#14285](https://github.com/vitejs/vite/issues/14285)
* fix(resolve): support submodules of optional peer deps (#14489) ([104971d](https://github.com/vitejs/vite/commit/104971d9b4b6b3994bc8362e7ffabd7d2bf3c311)), closes [#14489](https://github.com/vitejs/vite/issues/14489)
* fix(vite): precisely check if files are in dirs (#14241) ([c4758d1](https://github.com/vitejs/vite/commit/c4758d17de7c0e34d7fe1ce67aac9835239518af)), closes [#14241](https://github.com/vitejs/vite/issues/14241)
* feat: improve deno and bun support (#14379) ([8bc1f9d](https://github.com/vitejs/vite/commit/8bc1f9d3c79137c31dae5fe50384fea0286bc55b)), closes [#14379](https://github.com/vitejs/vite/issues/14379)



## <small>4.4.9 (2023-08-07)</small>

* chore: fix eslint warnings (#14031) ([4021a0e](https://github.com/vitejs/vite/commit/4021a0e21479bb0b82c0f4adda7ba3034f0ef73e)), closes [#14031](https://github.com/vitejs/vite/issues/14031)
* chore(deps): update all non-major dependencies (#13938) ([a1b519e](https://github.com/vitejs/vite/commit/a1b519e2c71593b6b4286c2f0bd8bfe2e0ad046d)), closes [#13938](https://github.com/vitejs/vite/issues/13938)
* fix: dynamic import vars ignored warning (#14006) ([4479431](https://github.com/vitejs/vite/commit/4479431312540683d488544766ba0d8334a995f4)), closes [#14006](https://github.com/vitejs/vite/issues/14006)
* fix(build): silence warn dynamic import module when inlineDynamicImports true (#13970) ([7a77aaf](https://github.com/vitejs/vite/commit/7a77aaf28b7d2b384dff9f250cb886782b198166)), closes [#13970](https://github.com/vitejs/vite/issues/13970)
* perf: improve build times and memory utilization (#14016) ([9d7d45e](https://github.com/vitejs/vite/commit/9d7d45e56f98787cd6c7f4245ad5f9562d409997)), closes [#14016](https://github.com/vitejs/vite/issues/14016)
* perf: replace startsWith with === (#14005) ([f5c1224](https://github.com/vitejs/vite/commit/f5c1224150fc8bfb2549e5c46d6c228776f8c170)), closes [#14005](https://github.com/vitejs/vite/issues/14005)



## <small>4.4.8 (2023-07-31)</small>

* fix: modulePreload false (#13973) ([488085d](https://github.com/vitejs/vite/commit/488085d63115014a243ed93608a1667c356d8749)), closes [#13973](https://github.com/vitejs/vite/issues/13973)
* fix: multiple entries with shared css and no JS (#13962) ([89a3db0](https://github.com/vitejs/vite/commit/89a3db0d9f7f34278da2d8e03f656bdd5c8934a7)), closes [#13962](https://github.com/vitejs/vite/issues/13962)
* fix: use file extensions on type imports so they work with `moduleResolution: 'node16'` (#13947) ([aeef670](https://github.com/vitejs/vite/commit/aeef6708bd4d75982413c7781ec885fa2f8e3b3f)), closes [#13947](https://github.com/vitejs/vite/issues/13947)
* fix(css): enhance error message for missing preprocessor dependency (#11485) ([65e5c22](https://github.com/vitejs/vite/commit/65e5c229a362dd8cbb28393f6410e950dacaa04b)), closes [#11485](https://github.com/vitejs/vite/issues/11485)
* fix(esbuild): fix static properties transpile when useDefineForClassFields false (#13992) ([4ca7c13](https://github.com/vitejs/vite/commit/4ca7c13b73c15df68dfb731aa4f1b363dea7acb2)), closes [#13992](https://github.com/vitejs/vite/issues/13992)
* fix(importAnalysis): strip url base before passing as safeModulePaths (#13712) ([1ab06a8](https://github.com/vitejs/vite/commit/1ab06a86fcea4963f4454c3612e3d5f1982fcfbf)), closes [#13712](https://github.com/vitejs/vite/issues/13712)
* fix(importMetaGlob): avoid unnecessary hmr of negative glob (#13646) ([844451c](https://github.com/vitejs/vite/commit/844451c015109e52d5dc2745bb2a068a98332b65)), closes [#13646](https://github.com/vitejs/vite/issues/13646)
* fix(optimizer): avoid double-commit of optimized deps when discovery is disabled (#13865) ([df77991](https://github.com/vitejs/vite/commit/df7799181c9e65a1557ca6ae7275962f00afd09d)), closes [#13865](https://github.com/vitejs/vite/issues/13865)
* fix(optimizer): enable experimentalDecorators by default (#13981) ([f8a5ffc](https://github.com/vitejs/vite/commit/f8a5ffce31fec7e9d3f94a7ae27d8748521a92b1)), closes [#13981](https://github.com/vitejs/vite/issues/13981)
* perf: replace startsWith with === (#13989) ([3aab14e](https://github.com/vitejs/vite/commit/3aab14eb25446c0c5830a504b34d39ce434e37d6)), closes [#13989](https://github.com/vitejs/vite/issues/13989)
* perf: single slash does not need to be replaced (#13980) ([66f522c](https://github.com/vitejs/vite/commit/66f522cc5d312bf322b17104706f23737b38414f)), closes [#13980](https://github.com/vitejs/vite/issues/13980)
* perf: use Intl.DateTimeFormatter instead of toLocaleTimeString (#13951) ([af53a1d](https://github.com/vitejs/vite/commit/af53a1d5f74666fa8b391fa51426e587ef2c116c)), closes [#13951](https://github.com/vitejs/vite/issues/13951)
* perf: use Intl.NumberFormat instead of toLocaleString (#13949) ([a48bf88](https://github.com/vitejs/vite/commit/a48bf882e560febb9f1a1b83bfa20f52cf550d46)), closes [#13949](https://github.com/vitejs/vite/issues/13949)
* perf: use magic-string hires boundary for sourcemaps (#13971) ([b9a8d65](https://github.com/vitejs/vite/commit/b9a8d65fd64d101ea596bc98a0aea0f95674a95a)), closes [#13971](https://github.com/vitejs/vite/issues/13971)
* chore(reporter): remove unnecessary map (#13972) ([dd9d4c1](https://github.com/vitejs/vite/commit/dd9d4c13202c6b639d43cad18e43d3b5d1a62fb2)), closes [#13972](https://github.com/vitejs/vite/issues/13972)
* refactor: add new overload to the type of defineConfig (#13958) ([24c12fe](https://github.com/vitejs/vite/commit/24c12fef604438826d76f49c244ae8e76574b929)), closes [#13958](https://github.com/vitejs/vite/issues/13958)



## <small>4.4.7 (2023-07-24)</small>

* fix: `optimizeDeps.include` not working with paths inside packages (#13922) ([06e4f57](https://github.com/vitejs/vite/commit/06e4f57724f947b584dad68fdd446989bdc76aa0)), closes [#13922](https://github.com/vitejs/vite/issues/13922)
* fix: lightningcss fails with html-proxy (#13776) ([6b56094](https://github.com/vitejs/vite/commit/6b5609424c92e1891f79e2ca8116e06967bd6ae0)), closes [#13776](https://github.com/vitejs/vite/issues/13776)
* fix: prepend `config.base` to vite/env path (#13941) ([8e6cee8](https://github.com/vitejs/vite/commit/8e6cee8ddec6bdf5c738a0021bb0cb7a7974e4af)), closes [#13941](https://github.com/vitejs/vite/issues/13941)
* fix(html): support `import.meta.env` define replacement without quotes (#13425) ([883089c](https://github.com/vitejs/vite/commit/883089c10dcc92e4b220dffe638e2f0fd8ee9812)), closes [#13425](https://github.com/vitejs/vite/issues/13425)
* fix(proxy): handle error when proxy itself errors (#13929) ([4848e41](https://github.com/vitejs/vite/commit/4848e413a1db81957e2e4a263d1bd0c5a733ac56)), closes [#13929](https://github.com/vitejs/vite/issues/13929)
* chore(eslint): allow type annotations (#13920) ([d1264fd](https://github.com/vitejs/vite/commit/d1264fd34313a2da80af8dadbeab1c8e6013bb10)), closes [#13920](https://github.com/vitejs/vite/issues/13920)



## <small>4.4.6 (2023-07-21)</small>

* fix: constrain inject helpers for iife (#13909) ([c89f677](https://github.com/vitejs/vite/commit/c89f6775fc058af3938e47d95d6e6e4c0f18ab34)), closes [#13909](https://github.com/vitejs/vite/issues/13909)
* fix: display manualChunks warning only when a function is not used (#13797) (#13798) ([51c271f](https://github.com/vitejs/vite/commit/51c271f2bd97ce408e82952045ed516596176596)), closes [#13797](https://github.com/vitejs/vite/issues/13797) [#13798](https://github.com/vitejs/vite/issues/13798)
* fix: do not append `browserHash` on optimized deps during build (#13906) ([0fb2340](https://github.com/vitejs/vite/commit/0fb2340a6024e6eaf1ae18263b502c1c4e4d6435)), closes [#13906](https://github.com/vitejs/vite/issues/13906)
* fix: use Bun's implementation of `ws` instead of the bundled one (#13901) ([049404c](https://github.com/vitejs/vite/commit/049404c2ba5cbf0292d23552d4e292cf33798d16)), closes [#13901](https://github.com/vitejs/vite/issues/13901)
* feat(client): add guide to press Esc for closing the overlay (#13896) ([da389cc](https://github.com/vitejs/vite/commit/da389cc0ee09933ed2a843289be6fc9b93e4a888)), closes [#13896](https://github.com/vitejs/vite/issues/13896)



## <small>4.4.5 (2023-07-20)</small>

* fix: "EISDIR: illegal operation on a directory, realpath" error on RA… (#13655) ([6bd5434](https://github.com/vitejs/vite/commit/6bd543421e8479c311750fceb119a0b5a48c7703)), closes [#13655](https://github.com/vitejs/vite/issues/13655)
* fix: transform error message add file info (#13687) ([6dca41c](https://github.com/vitejs/vite/commit/6dca41c3185658d8b42300d061ecc9c73a7ff902)), closes [#13687](https://github.com/vitejs/vite/issues/13687)
* fix: warn when publicDir and outDir are nested (#13742) ([4eb3154](https://github.com/vitejs/vite/commit/4eb31542ab8f5ed7d3a891f9f7009e2e12ff5350)), closes [#13742](https://github.com/vitejs/vite/issues/13742)
* fix(build): remove warning about ineffective dynamic import from node_modules (#13884) ([33002dd](https://github.com/vitejs/vite/commit/33002dd06c6ed1b97ec8fd2714b02bd80df99e03)), closes [#13884](https://github.com/vitejs/vite/issues/13884)
* fix(build): style insert order for UMD builds (fix #13668) (#13669) ([49a1b99](https://github.com/vitejs/vite/commit/49a1b997751523d9ae095a67d6d84d7deaeb8a3c)), closes [#13668](https://github.com/vitejs/vite/issues/13668) [#13669](https://github.com/vitejs/vite/issues/13669)
* fix(deps): update all non-major dependencies (#13872) ([975a631](https://github.com/vitejs/vite/commit/975a631ec7c2373354aeeac6bc2977f24b54d13d)), closes [#13872](https://github.com/vitejs/vite/issues/13872)
* fix(types): narrow down the return type of `defineConfig` (#13792) ([c971f26](https://github.com/vitejs/vite/commit/c971f26e457c351bc78ce62ff335fe9d02429ec5)), closes [#13792](https://github.com/vitejs/vite/issues/13792)
* chore: fix typos (#13862) ([f54e8da](https://github.com/vitejs/vite/commit/f54e8da5e035f49dc67f8be05f90b90322d288bf)), closes [#13862](https://github.com/vitejs/vite/issues/13862)
* chore: replace `any` with `string` (#13850) ([4606fd8](https://github.com/vitejs/vite/commit/4606fd816e95d67412a5c542d6b0d9cfc7fcf426)), closes [#13850](https://github.com/vitejs/vite/issues/13850)
* chore(deps): update dependency prettier to v3 (#13759) ([5a56941](https://github.com/vitejs/vite/commit/5a56941a895fd0ffdbdbf0094336fb7f0f4099c1)), closes [#13759](https://github.com/vitejs/vite/issues/13759)
* docs: fix build.cssMinify link (#13840) ([8a2a3e1](https://github.com/vitejs/vite/commit/8a2a3e1e7f500a6c803187c965e49fe6cc5478b6)), closes [#13840](https://github.com/vitejs/vite/issues/13840)



## <small>4.4.4 (2023-07-14)</small>

* chore: warning about ssr cjs format removal (#13827) ([4646e9f](https://github.com/vitejs/vite/commit/4646e9f19b19563ffd52997f7fe839e3d6fd1d33)), closes [#13827](https://github.com/vitejs/vite/issues/13827)
* fix(esbuild): enable experimentalDecorators by default (#13805) ([e8880f0](https://github.com/vitejs/vite/commit/e8880f071992d0a5a7e2cd75a8a5600e286777d1)), closes [#13805](https://github.com/vitejs/vite/issues/13805)
* fix(scan): skip tsconfigRaw fallback if tsconfig is set (#13823) ([b6155a1](https://github.com/vitejs/vite/commit/b6155a1fad0f8787cdd63df1138252154d17521a)), closes [#13823](https://github.com/vitejs/vite/issues/13823)
* feat(client): close `vite-error-overlay` with Escape key (#13795) ([85bdcda](https://github.com/vitejs/vite/commit/85bdcda74705fdde94b2656e9ac7599c79292de5)), closes [#13795](https://github.com/vitejs/vite/issues/13795)



## <small>4.4.3 (2023-07-11)</small>

* fix: avoid early error when server is closed in ssr (#13787) ([89d01eb](https://github.com/vitejs/vite/commit/89d01ebb8eb4948f576f2d483082c5dd4bf056e7)), closes [#13787](https://github.com/vitejs/vite/issues/13787)
* fix(deps): update all non-major dependencies (#13758) ([8ead116](https://github.com/vitejs/vite/commit/8ead11648514ae4975bf4328d6e15bd4dd42e45e)), closes [#13758](https://github.com/vitejs/vite/issues/13758)
* fix(server): remove restart guard on restart (#13789) ([2a38ef7](https://github.com/vitejs/vite/commit/2a38ef7501972fbdb2531cc1207884b3fb9603a9)), closes [#13789](https://github.com/vitejs/vite/issues/13789)



## <small>4.4.2 (2023-07-07)</small>

* fix(css): use single postcss instance (#13738) ([c02fac4](https://github.com/vitejs/vite/commit/c02fac41d31608ef58054f28ee3d8e099c4c6ac8)), closes [#13738](https://github.com/vitejs/vite/issues/13738)



## <small>4.4.1 (2023-07-06)</small>

* fix: revert #13073, use consistent virtual module ID in module graph (#13734) ([f589ac0](https://github.com/vitejs/vite/commit/f589ac09098617c9c46bd1fe6e1e42696734ce68)), closes [#13073](https://github.com/vitejs/vite/issues/13073) [#13734](https://github.com/vitejs/vite/issues/13734)
* fix: revert import config module as data (#13731) ([b0bfa01](https://github.com/vitejs/vite/commit/b0bfa0158b5ffd86b04fde2ab66372eedf25b4bb)), closes [#13731](https://github.com/vitejs/vite/issues/13731)
* chore: changelog notes and clean for 4.4 (#13728) ([3f4e36e](https://github.com/vitejs/vite/commit/3f4e36e078456b06fa34c17d981726f53efd75c4)), closes [#13728](https://github.com/vitejs/vite/issues/13728)



## 4.4.0 (2023-07-06)

### Experimental support for Lightning CSS

Starting from Vite 4.4, there is experimental support for [Lightning CSS](https://lightningcss.dev/). You can opt into it by adding [`css.transformer: 'lightningcss'`](https://main.vite.dev/config/shared-options.html#css-transformer) to your config file and install the optional [`lightningcss`](https://www.npmjs.com/package/lightningcss) dev dependency. If enabled, CSS files will be processed by Lightning CSS instead of PostCSS.

Lightning CSS can also be used as the CSS minifier with [`build.cssMinify: 'lightningcss'`](https://main.vite.dev/config/build-options.html#build-cssminify).

See beta docs at the [Lighting CSS guide](https://main.vite.dev/guide/features.html#lightning-css).

### esbuild 0.18 update

[esbuild 0.18](https://github.com/evanw/esbuild/blob/main/CHANGELOG.md#0180) contains backwards-incompatible changes to esbuild's handling of `tsconfig.json` files. We think they shouldn't affect Vite users, you can review [#13525](https://github.com/vitejs/vite/issues/13525) for more information.

### Templates for Solid and Qwik in create-vite

New starter templates have been added to [create-vite](https://vite.dev/guide/#scaffolding-your-first-vite-project) for [Solid](https://www.solidjs.com/) and [Qwik](https://qwik.builder.io/). Try them online at [vite.new/solid-ts](https://vite.new/solid-ts) and [vite.new/qwik-ts](https://vite.new/qwik-ts).

### Korean Translation

Vite's docs are now translated to Korean, available at [ko.vite.dev](https://ko.vite.dev).

### Features

* feat: preview mode add keyboard shortcuts (#12968) ([126e93e](https://github.com/vitejs/vite/commit/126e93e6693474a038a5053b7cefb99295f21eb5)), closes [#12968](https://github.com/vitejs/vite/issues/12968)
* feat: asset type add apng (#13294) ([a11b6f6](https://github.com/vitejs/vite/commit/a11b6f6cbaa9c03078cbd5f9898e11aba5fb38dc)), closes [#13294](https://github.com/vitejs/vite/issues/13294)
* feat: emit event to handle chunk load errors (#12084) ([2eca54e](https://github.com/vitejs/vite/commit/2eca54eb736b21e48273a2083391dbd734d400f5)), closes [#12084](https://github.com/vitejs/vite/issues/12084)
* feat: import public non-asset URL (#13422) ([3a98558](https://github.com/vitejs/vite/commit/3a98558f780ed32577e48d8cae600e850723b83a)), closes [#13422](https://github.com/vitejs/vite/issues/13422)
* feat: support files for `fs.allow` (#12863) ([4a06e66](https://github.com/vitejs/vite/commit/4a06e66130ee4701b9461081ab09ad88cadc5ac2)), closes [#12863](https://github.com/vitejs/vite/issues/12863)
* feat(build): warn dynamic import module with a static import alongside (#12850) ([127c334](https://github.com/vitejs/vite/commit/127c334436244a8a3280d2c441a5d39254c08dc2)), closes [#12850](https://github.com/vitejs/vite/issues/12850)
* feat(client): add debounce on page reload (#13545) ([d080b51](https://github.com/vitejs/vite/commit/d080b51761e4b59e4a47e13b1ca328c09d25d493)), closes [#13545](https://github.com/vitejs/vite/issues/13545)
* feat(client): add WebSocket connections events (#13334) ([eb75103](https://github.com/vitejs/vite/commit/eb751032d5b18b87e5a6639fcc640f74d352cd23)), closes [#13334](https://github.com/vitejs/vite/issues/13334)
* feat(config): friendly ESM file require error (#13283) ([b9a6ba0](https://github.com/vitejs/vite/commit/b9a6ba044f5f551c9d7966802caa1bec714eedb3)), closes [#13283](https://github.com/vitejs/vite/issues/13283)
* feat(css): add support for Lightning CSS (#12807) ([c6c5d49](https://github.com/vitejs/vite/commit/c6c5d49d158fb60cb1c1719df73d18093294b12b)), closes [#12807](https://github.com/vitejs/vite/issues/12807)
* feat(css): support at import preprocessed styles (#8400) ([2bd6077](https://github.com/vitejs/vite/commit/2bd6077722318d9b116d657871fbe497c9484e7a)), closes [#8400](https://github.com/vitejs/vite/issues/8400)
* feat(html): support image set in inline style (#13473) ([2c0faba](https://github.com/vitejs/vite/commit/2c0fabae4939a79756f028153093744d3383de50)), closes [#13473](https://github.com/vitejs/vite/issues/13473)
* feat(importMetaGlob): support sub imports pattern (#12467) ([e355c9c](https://github.com/vitejs/vite/commit/e355c9ccc5734288bfcc980f45852d2c7a723eee)), closes [#12467](https://github.com/vitejs/vite/issues/12467)
* feat(optimizer): support glob includes (#12414) ([7792515](https://github.com/vitejs/vite/commit/779251599fe94fc002bd1dd308598dcffd922454)), closes [#12414](https://github.com/vitejs/vite/issues/12414)
* feat!: update esbuild to 0.18.2 (#13525) ([ab967c0](https://github.com/vitejs/vite/commit/ab967c097565f47003a4df32a57ae142857e890b)), closes [#13525](https://github.com/vitejs/vite/issues/13525)

### Bug Fixes

* fix: check document before detect script rel (#13559) ([be4b0c0](https://github.com/vitejs/vite/commit/be4b0c0bffb3c41d88fb2f2fdaeedd6f6fa70d23)), closes [#13559](https://github.com/vitejs/vite/issues/13559)
* fix(define): stringify object parse error in build mode (#13600) ([71516db](https://github.com/vitejs/vite/commit/71516db3438c57643df80da687be57cf641b1762)), closes [#13600](https://github.com/vitejs/vite/issues/13600)
* fix(deps): update all non-major dependencies (#13701) ([02c6bc3](https://github.com/vitejs/vite/commit/02c6bc38645ce18f9e1c8a71421fb8aad7081688)), closes [#13701](https://github.com/vitejs/vite/issues/13701)
* fix(esbuild): use `useDefineForClassFields: false` when no `compilerOptions.target` is declared (#13 ([7ef2472](https://github.com/vitejs/vite/commit/7ef2472872a16f6476c8ca03678e626e7a54c212)), closes [#13708](https://github.com/vitejs/vite/issues/13708)
* fix(pluginContainer): drop previous sourcesContent (#13722) ([9310b3a](https://github.com/vitejs/vite/commit/9310b3a52fb2a7d299a9cc6f43d88492d67e743a)), closes [#13722](https://github.com/vitejs/vite/issues/13722)
* fix: lightningCSS should load external URL in CSS file (#13692) ([8517645](https://github.com/vitejs/vite/commit/8517645b57cd19ec0845abd9e89d97fc0b2325af)), closes [#13692](https://github.com/vitejs/vite/issues/13692)
* fix: shortcut open browser when set host (#13677) ([6f1c55e](https://github.com/vitejs/vite/commit/6f1c55e7d694dd26f9eca30239faeb5a59c41486)), closes [#13677](https://github.com/vitejs/vite/issues/13677)
* fix(cli): convert the sourcemap option to boolean (fix #13638) (#13663) ([d444bfe](https://github.com/vitejs/vite/commit/d444bfe1bd86cddde0264ca2f04f0157924cc806)), closes [#13638](https://github.com/vitejs/vite/issues/13638) [#13663](https://github.com/vitejs/vite/issues/13663)
* fix(css): use esbuild legalComments config when minifying CSS (#13661) ([2d9008e](https://github.com/vitejs/vite/commit/2d9008e81d0d835e10437a959fac12529f7823e1)), closes [#13661](https://github.com/vitejs/vite/issues/13661)
* fix(sourcemap): preserve original sourcesContent (#13662) ([f6362b6](https://github.com/vitejs/vite/commit/f6362b6455baaed0ce7eeeed0ae656259037f886)), closes [#13662](https://github.com/vitejs/vite/issues/13662)
* fix(ssr): transform superclass identifier (#13635) ([c5b2c8f](https://github.com/vitejs/vite/commit/c5b2c8f4fdde9039993c00a8b30abe5e07a8b06a)), closes [#13635](https://github.com/vitejs/vite/issues/13635)
* fix: show error position (#13623) ([90271a6](https://github.com/vitejs/vite/commit/90271a6103257cef404db92db04e79615d006c6d)), closes [#13623](https://github.com/vitejs/vite/issues/13623)
* fix(hmr): only invalidate `lastHMRTimestamp` of importers if the invalidated module is not a HMR bou ([1143e0b](https://github.com/vitejs/vite/commit/1143e0b5a0690495c03a28a0264b37934961b522)), closes [#13024](https://github.com/vitejs/vite/issues/13024)
* fix(indexHtml): decode html URI (#13581) ([f8868af](https://github.com/vitejs/vite/commit/f8868afb5e6506f7d2995a13fb81acdf87f60bac)), closes [#13581](https://github.com/vitejs/vite/issues/13581)
* fix: avoid binding ClassExpression (#13572) ([1a0c806](https://github.com/vitejs/vite/commit/1a0c80692680a5f9621989a77a9c0a82bd398ee0)), closes [#13572](https://github.com/vitejs/vite/issues/13572)
* fix: the shortcut fails to open browser when set the host (#13579) ([e0a48c5](https://github.com/vitejs/vite/commit/e0a48c56a412bc843d5e72f413350438cd912943)), closes [#13579](https://github.com/vitejs/vite/issues/13579)
* fix(proxy): forward SSE close event (#13578) ([4afbccb](https://github.com/vitejs/vite/commit/4afbccbb02be7dd1ed03b6d4df568df844b9d652)), closes [#13578](https://github.com/vitejs/vite/issues/13578)
* fix: allow using vite as a proxy for another vite server (#13218) ([711dd80](https://github.com/vitejs/vite/commit/711dd807610b39538e9955970145d52e4ca1d8c0)), closes [#13218](https://github.com/vitejs/vite/issues/13218)
* fix: await requests to before server restart (#13262) ([0464398](https://github.com/vitejs/vite/commit/04643987f6c6a9bdfd1555f39afd6423790da027)), closes [#13262](https://github.com/vitejs/vite/issues/13262)
* fix: esm detection with `export const { A, B }` pattern (#13483) ([ea1bcc9](https://github.com/vitejs/vite/commit/ea1bcc970145c926877322b5eb28b546bce308a1)), closes [#13483](https://github.com/vitejs/vite/issues/13483)
* fix: keep track of ssr version of imported modules separately (#11973) ([8fe6952](https://github.com/vitejs/vite/commit/8fe69524d25d45290179175ba9b9956cbce87a91)), closes [#11973](https://github.com/vitejs/vite/issues/11973)
* fix: make optimize error available to meta-framework (#13495) ([b70e783](https://github.com/vitejs/vite/commit/b70e7831e8f60e4449cfbe902838cc9ca4a56847)), closes [#13495](https://github.com/vitejs/vite/issues/13495)
* fix: only show the listened IP when host is specified (#13412) ([20b0cae](https://github.com/vitejs/vite/commit/20b0caef6379aac9185c92e88e69e2f11d4d04e6)), closes [#13412](https://github.com/vitejs/vite/issues/13412)
* fix: race condition creation module in graph in transformRequest (#13085) ([43cbbcf](https://github.com/vitejs/vite/commit/43cbbcf21b46566ec22b3c54c6d78d715f036649)), closes [#13085](https://github.com/vitejs/vite/issues/13085)
* fix: remove deprecated config.server.base (#13482) ([dc597bd](https://github.com/vitejs/vite/commit/dc597bd913bad167e9f8398e4fb506131e96cadd)), closes [#13482](https://github.com/vitejs/vite/issues/13482)
* fix: remove extra path shorten when resolving from a dir (#13381) ([5503198](https://github.com/vitejs/vite/commit/5503198d6a45db8b56357dc5466556a0288d81cb)), closes [#13381](https://github.com/vitejs/vite/issues/13381)
* fix: show network URLs when `--host 0.0.0.0` (#13438) ([00ee8c1](https://github.com/vitejs/vite/commit/00ee8c1016f66b402b52027a1d15f9c32c2bb69c)), closes [#13438](https://github.com/vitejs/vite/issues/13438)
* fix: timestamp config dynamicImport (#13502) ([6a87c65](https://github.com/vitejs/vite/commit/6a87c65262388a918fa6fcdd55afb2d7352757d4)), closes [#13502](https://github.com/vitejs/vite/issues/13502)
* fix: unexpected config temporary file (#13269) ([ff3ce31](https://github.com/vitejs/vite/commit/ff3ce312a572ec126808afb97b5d3f0a6f9adcb1)), closes [#13269](https://github.com/vitejs/vite/issues/13269)
* fix: use consistent virtual module ID in module graph (#13073) ([aa1776f](https://github.com/vitejs/vite/commit/aa1776f2db687cdeef2ee27eacc85fd3ae71d4b1)), closes [#13073](https://github.com/vitejs/vite/issues/13073)
* fix(build): make output warning message clearer (#12924) ([54ab3c8](https://github.com/vitejs/vite/commit/54ab3c8f9676426941968549fc976ae867e53893)), closes [#12924](https://github.com/vitejs/vite/issues/12924)
* fix(debug): import performance from perf_hooks (#13464) ([d458ccd](https://github.com/vitejs/vite/commit/d458ccde416ea8bd7eaf0083282ded807d808ea4)), closes [#13464](https://github.com/vitejs/vite/issues/13464)
* fix(deps): update all non-major dependencies (#13059) ([123ef4c](https://github.com/vitejs/vite/commit/123ef4c47c611ebd99d8b41c89c547422aea9c1d)), closes [#13059](https://github.com/vitejs/vite/issues/13059)
* fix(deps): update all non-major dependencies (#13488) ([bd09248](https://github.com/vitejs/vite/commit/bd09248e50ae50ec57b9a72efe0a27aa397ec2e1)), closes [#13488](https://github.com/vitejs/vite/issues/13488)
* fix(deps): update sirv to 2.0.3 (#13057) ([d814d6c](https://github.com/vitejs/vite/commit/d814d6c56765696f766b32b5fce604acf715bf3c)), closes [#13057](https://github.com/vitejs/vite/issues/13057)
* fix(mergeConfig): don't accept callback config (#13135) ([998512b](https://github.com/vitejs/vite/commit/998512b66fcd810fd133c31e821c47757f86d7eb)), closes [#13135](https://github.com/vitejs/vite/issues/13135)
* fix(optimizer): include exports for css modules (#13519) ([1fd9919](https://github.com/vitejs/vite/commit/1fd9919c9a483717bbabb1ea11eec2eb6caa9284)), closes [#13519](https://github.com/vitejs/vite/issues/13519)
* fix(resolve): always use `module` condition (#13370) ([367920b](https://github.com/vitejs/vite/commit/367920b6c75fa4a99fa6eaa40dd97ac5038843d3)), closes [#13370](https://github.com/vitejs/vite/issues/13370)
* fix(ssr): fix crash when a pnpm/Yarn workspace depends on a CJS package (#9763) ([9e1086b](https://github.com/vitejs/vite/commit/9e1086b55b89f8264a08b82a572a731ad6921e27)), closes [#9763](https://github.com/vitejs/vite/issues/9763)


### Previous Changelogs


#### [4.4.0-beta.4](https://github.com/vitejs/vite/compare/v4.4.0-beta.3...v4.4.0-beta.4) (2023-07-03)

See [4.4.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v4.4.0-beta.4/packages/vite/CHANGELOG.md)


#### [4.4.0-beta.3](https://github.com/vitejs/vite/compare/v4.4.0-beta.2...v4.4.0-beta.3) (2023-06-25)

See [4.4.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v4.4.0-beta.3/packages/vite/CHANGELOG.md)


#### [4.4.0-beta.2](https://github.com/vitejs/vite/compare/v4.4.0-beta.1...v4.4.0-beta.2) (2023-06-22)

See [4.4.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.4.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.4.0-beta.1](https://github.com/vitejs/vite/compare/v4.4.0-beta.0...v4.4.0-beta.1) (2023-06-21)

See [4.4.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.4.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.4.0-beta.0](https://github.com/vitejs/vite/compare/v4.3.9...v4.4.0-beta.0) (2023-06-20)

See [4.4.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.4.0-beta.0/packages/vite/CHANGELOG.md)



## <small>4.3.9 (2023-05-26)</small>

* fix: fs.deny with leading double slash (#13348) ([813ddd6](https://github.com/vitejs/vite/commit/813ddd6155c3d54801e264ba832d8347f6f66b32)), closes [#13348](https://github.com/vitejs/vite/issues/13348)
* fix: optimizeDeps during build and external ids (#13274) ([e3db771](https://github.com/vitejs/vite/commit/e3db7712657232fbb9ea2499a2c6f277d2bb96a3)), closes [#13274](https://github.com/vitejs/vite/issues/13274)
* fix(css): return deps if have no postcss plugins (#13344) ([28923fb](https://github.com/vitejs/vite/commit/28923fb1d46b3adf8799ec9038e68d239ad0671d)), closes [#13344](https://github.com/vitejs/vite/issues/13344)
* fix(legacy): style insert order (#13266) ([e444375](https://github.com/vitejs/vite/commit/e444375d34db1e1902f06ab223e51d2d63cd10de)), closes [#13266](https://github.com/vitejs/vite/issues/13266)
* chore: revert prev release commit ([2a30a07](https://github.com/vitejs/vite/commit/2a30a07e33f25c6bf325bb62bc082e4ce22248fa))
* release: v4.3.9 ([5c9abf7](https://github.com/vitejs/vite/commit/5c9abf7a5eab12761683d793c61502407f28e481))
* docs: optimizeDeps.needsInterop (#13323) ([b34e79c](https://github.com/vitejs/vite/commit/b34e79c6161ea0ded6036c05ec8bb0251eeb5ba6)), closes [#13323](https://github.com/vitejs/vite/issues/13323)
* test: respect commonjs options in playgrounds (#13273) ([19e8c68](https://github.com/vitejs/vite/commit/19e8c68f37b2280c1709b8d3d6dd424064abaace)), closes [#13273](https://github.com/vitejs/vite/issues/13273)
* refactor: simplify SSR options' if statement (#13254) ([8013a66](https://github.com/vitejs/vite/commit/8013a6645c84280acb0b3dd8be1bb87d2640854e)), closes [#13254](https://github.com/vitejs/vite/issues/13254)
* perf(ssr): calculate stacktrace offset lazily (#13256) ([906c4c1](https://github.com/vitejs/vite/commit/906c4c15ef20ccd991c713bc12830f583ec20336)), closes [#13256](https://github.com/vitejs/vite/issues/13256)



## <small>4.3.8 (2023-05-18)</small>

* fix: avoid outdated module to crash in importAnalysis after restart (#13231) ([3609e79](https://github.com/vitejs/vite/commit/3609e79dc1416073dc4775bb2fcf6a7398f169b3)), closes [#13231](https://github.com/vitejs/vite/issues/13231)
* fix(ssr): skip updateCjsSsrExternals if legacy flag disabled (#13230) ([13fc345](https://github.com/vitejs/vite/commit/13fc345e8a848c06b3a991c4d2ca8222affc98a4)), closes [#13230](https://github.com/vitejs/vite/issues/13230)



## <small>4.3.7 (2023-05-16)</small>

* fix: revert only watch .env files in envDir (#12587) (#13217) ([0fd4616](https://github.com/vitejs/vite/commit/0fd46165b5b09c4ad6dcada5614ea6950cf5916d)), closes [#12587](https://github.com/vitejs/vite/issues/12587) [#13217](https://github.com/vitejs/vite/issues/13217)
* fix(assetImportMetaUrl): allow ternary operator in template literal urls (#13121) ([d5d9a31](https://github.com/vitejs/vite/commit/d5d9a3155cda835bd9e8b7c53a879e26e1c6497a)), closes [#13121](https://github.com/vitejs/vite/issues/13121)



## <small>4.3.6 (2023-05-15)</small>

* fix: avoid dev-server crash when ws proxy error (#12829) ([87e1f58](https://github.com/vitejs/vite/commit/87e1f5838263d53d8ccf856926ff0a627d763b4c)), closes [#12829](https://github.com/vitejs/vite/issues/12829)
* fix: call `tryFsResolve` for relative `new URL(foo, import.meta.url)` (#13142) ([eeb0617](https://github.com/vitejs/vite/commit/eeb0617bedee6352695b69ecf8a3dc4b0572c59e)), closes [#13142](https://github.com/vitejs/vite/issues/13142)
* fix: don't inject CSS sourcemap for direct requests (#13115) ([7d80a47](https://github.com/vitejs/vite/commit/7d80a47d6bf898e8e5c4eb9b192df9d7a01a08c9)), closes [#13115](https://github.com/vitejs/vite/issues/13115)
* fix: handle more yarn pnp load errors (#13160) ([adf61d9](https://github.com/vitejs/vite/commit/adf61d912296c4cda9f65dd0d5e62a3538f94b6e)), closes [#13160](https://github.com/vitejs/vite/issues/13160)
* fix(build): declare moduleSideEffects for vite:modulepreload-polyfill (#13099) ([d63129b](https://github.com/vitejs/vite/commit/d63129b5f028646596bd5c57d2832eaf441c77b7)), closes [#13099](https://github.com/vitejs/vite/issues/13099)
* fix(css): respect `esbuild.charset` when minify (#13190) ([4fd35ed](https://github.com/vitejs/vite/commit/4fd35edf5fb18e7d921a5a0bf7116c47b5374b3f)), closes [#13190](https://github.com/vitejs/vite/issues/13190)
* fix(server): intercept ping requests (#13117) ([d06cc42](https://github.com/vitejs/vite/commit/d06cc421031dcb6c54abb12039dc6689c5a46b73)), closes [#13117](https://github.com/vitejs/vite/issues/13117)
* fix(ssr): stacktrace uses abs path with or without sourcemap (#12902) ([88c855e](https://github.com/vitejs/vite/commit/88c855eadcff7b59e175610c0f8a0b1e04a3ad12)), closes [#12902](https://github.com/vitejs/vite/issues/12902)
* perf: skip windows absolute paths for node resolve (#13162) ([e640939](https://github.com/vitejs/vite/commit/e640939c3f72cde06898df4515f9e850983b3a6c)), closes [#13162](https://github.com/vitejs/vite/issues/13162)
* chore: remove useless dep (#13165) ([9a7ec98](https://github.com/vitejs/vite/commit/9a7ec986257c640001649b3925af79ee99bac86a)), closes [#13165](https://github.com/vitejs/vite/issues/13165)
* chore(reporter): reuse clearLine (#13156) ([535795a](https://github.com/vitejs/vite/commit/535795a8286e4a9525acd2340e1d1d1adfd70acf)), closes [#13156](https://github.com/vitejs/vite/issues/13156)



## <small>4.3.5 (2023-05-05)</small>

* fix: location is not defined error in cleanScssBugUrl (#13100) ([91d7b67](https://github.com/vitejs/vite/commit/91d7b678ce6a397d01cd1351ce29de2f50f9d775)), closes [#13100](https://github.com/vitejs/vite/issues/13100)
* fix: unwrapId and pass ssr flag when adding to moduleGraph in this.load (#13083) ([9041e19](https://github.com/vitejs/vite/commit/9041e19585dc2679d558ec51e77fd1ea1bacdb2b)), closes [#13083](https://github.com/vitejs/vite/issues/13083)
* fix(assetImportMetaUrl): reserve dynamic template literal query params (#13034) ([7089528](https://github.com/vitejs/vite/commit/7089528b7c740de7fafa715c01c368271afc8e6b)), closes [#13034](https://github.com/vitejs/vite/issues/13034)
* fix(debug): skip filter object args (#13098) ([d95a9af](https://github.com/vitejs/vite/commit/d95a9af5c1aa9babecd710ef2d341a7839b41daf)), closes [#13098](https://github.com/vitejs/vite/issues/13098)
* fix(scan): handle html script tag attributes that contain ">" (#13101) ([8a37de6](https://github.com/vitejs/vite/commit/8a37de604f18b5053be717e232e2b1353addf8d0)), closes [#13101](https://github.com/vitejs/vite/issues/13101)
* fix(ssr): ignore __esModule for ssrExportAll (#13084) ([8a8ea1d](https://github.com/vitejs/vite/commit/8a8ea1d3aed9db67da47e610d3c66b831815f898)), closes [#13084](https://github.com/vitejs/vite/issues/13084)



## <small>4.3.4 (2023-05-02)</small>

* fix(define): incorrect raw expression value type in build (#13003) ([8f4cf07](https://github.com/vitejs/vite/commit/8f4cf0752abd1bd51af6726f24ceeca47f6d5ba6)), closes [#13003](https://github.com/vitejs/vite/issues/13003)
* fix(importAnalysisBuild): support parsing '__VITE_PRELOAD__' (#13023) ([447df7c](https://github.com/vitejs/vite/commit/447df7cba987b30e3621076a74e2227f8232f64a)), closes [#13023](https://github.com/vitejs/vite/issues/13023)
* fix(server): should respect hmr port when middlewareMode=false (#13040) ([1ee0014](https://github.com/vitejs/vite/commit/1ee0014caa7ecf91ac147dca3801820020a4b8a0)), closes [#13040](https://github.com/vitejs/vite/issues/13040)
* fix(ssr): track for statements as block scope (#13021) ([2f8502f](https://github.com/vitejs/vite/commit/2f8502fd64071af669d5871ea3f0d5edb86f9690)), closes [#13021](https://github.com/vitejs/vite/issues/13021)
* chore: add changelog for vite 4.2.2 and 3.2.6 (#13055) ([0c9f1f4](https://github.com/vitejs/vite/commit/0c9f1f4a8a94623c4b46d1fa6d8c29908f379a68)), closes [#13055](https://github.com/vitejs/vite/issues/13055)



## <small>4.3.3 (2023-04-26)</small>

* fix: address file path mismatch when loading Vite config file on Windows (fix #12923) (#13005) ([84c4118](https://github.com/vitejs/vite/commit/84c4118d5f1e73fe964d680aa316bf0fd7d5ee20)), closes [#12923](https://github.com/vitejs/vite/issues/12923) [#13005](https://github.com/vitejs/vite/issues/13005)
* fix: undefined document in worker (#12988) ([08c1452](https://github.com/vitejs/vite/commit/08c1452a8459ae55c01c94f111232a1502341c0b)), closes [#12988](https://github.com/vitejs/vite/issues/12988)
* fix(resolve): deep import resolvedId error (#13010) ([30a41ff](https://github.com/vitejs/vite/commit/30a41ffbeb583311ec227e53c0cd2331d26993b0)), closes [#13010](https://github.com/vitejs/vite/issues/13010)
* feat: optimize deps option to turn off auto discovery (#13000) ([bd86375](https://github.com/vitejs/vite/commit/bd86375c1610f8a43599327675b26a4f124e013b)), closes [#13000](https://github.com/vitejs/vite/issues/13000)
* chore(deps): update all non-major dependencies (#12805) ([5731ac9](https://github.com/vitejs/vite/commit/5731ac9caaef629e892e20394f0cc73c565d9a87)), closes [#12805](https://github.com/vitejs/vite/issues/12805)



## <small>4.3.2 (2023-04-25)</small>

* fix: status optional in windows network drive regex (fix: #12948) (#12949) ([f781fc6](https://github.com/vitejs/vite/commit/f781fc64b7c2d9569c91c51915b2623b601e8df1)), closes [#12948](https://github.com/vitejs/vite/issues/12948) [#12949](https://github.com/vitejs/vite/issues/12949)
* fix: use realpathSync for node <16.18 on windows (#12971) ([965839c](https://github.com/vitejs/vite/commit/965839c70e3057d8d1ad8597bdcad1509574f0ed)), closes [#12971](https://github.com/vitejs/vite/issues/12971)
* fix(ssr): hoist statements after hashbang (#12985) ([07bd6d1](https://github.com/vitejs/vite/commit/07bd6d14e545d05c6a29cf341f117fcfe9536ba4)), closes [#12985](https://github.com/vitejs/vite/issues/12985)
* chore: build time message setting color (#12940) ([ada7cd5](https://github.com/vitejs/vite/commit/ada7cd587b3714706e2449e541a009b2faba419d)), closes [#12940](https://github.com/vitejs/vite/issues/12940)
* chore: remove extra ) in changelog (#12932) ([e7924d2](https://github.com/vitejs/vite/commit/e7924d22f70fdfdab32b4aab224cd66317f3c768)), closes [#12932](https://github.com/vitejs/vite/issues/12932)
* chore: upgrade rollup (#12965) ([bdb2f25](https://github.com/vitejs/vite/commit/bdb2f25b2ff2ed5be2308fbdeeac230ce2df9cac)), closes [#12965](https://github.com/vitejs/vite/issues/12965)
* refactor: resolveExports (#10917) ([ad21ec3](https://github.com/vitejs/vite/commit/ad21ec35de8b6745e30f6982a0e29a1cf97d55c8)), closes [#10917](https://github.com/vitejs/vite/issues/10917)



## <small>4.3.1 (2023-04-20)</small>

* fix: revert ensure module in graph before transforming (#12774) (#12929) ([9cc93a5](https://github.com/vitejs/vite/commit/9cc93a577581820b29fa929e27d49f52b805fd4f)), closes [#12774](https://github.com/vitejs/vite/issues/12774) [#12929](https://github.com/vitejs/vite/issues/12929)
* docs: 4.3 announcement and release notes (#12925) ([f29c582](https://github.com/vitejs/vite/commit/f29c582592e854835a4361763a004ac2f28a053a)), closes [#12925](https://github.com/vitejs/vite/issues/12925)
* chore: clean up 4.3 changelog ([55ec023](https://github.com/vitejs/vite/commit/55ec0236c4851d446e8c84d407ea0489eb025695))



## 4.3.0 (2023-04-20)

Vite 4.3 is out! Read the [announcement blog post here](https://vite.dev/blog/announcing-vite4-3)

[![Vite 4.3, It's Fast](https://vite.dev/og-image-announcing-vite4-3.png)](https://vite.dev/blog/announcing-vite4-3)

In this minor, we focused on improving the dev server performance. The resolve logic got streamlined, improving hot paths and implementing smarter caching for finding `package.json`, TS config files, and resolved URL in general.

You can read a detailed walkthrough of the performance work done in this blog post by one of Vite Contributors: [How we made Vite 4.3 faaaaster 🚀](https://sun0day.github.io/blog/vite/why-vite4_3-is-faster.html).

This sprint resulted in speed improvements across the board compared to Vite 4.2.

These are the performance improvements as measured by [sapphi-red/performance-compare](https://github.com/sapphi-red/performance-compare), which tests an app with 1000 React Components cold and warm dev server startup time as well as HMR times for a root and a leaf component:

| **Vite (babel)**   |  Vite 4.2 | Vite 4.3 | Improvement  |
| :----------------- | --------: | -------: | -----------: |
| **dev cold start** | 17249.0ms | 5132.4ms |      -70.2%  |
| **dev warm start** |  6027.8ms | 4536.1ms |      -24.7%  |
| **Root HMR**       |    46.8ms |   26.7ms |      -42.9%  |
| **Leaf HMR**       |    27.0ms |   12.9ms |      -52.2%  |

| **Vite (swc)**     |  Vite 4.2 | Vite 4.3 | Improvement  |
| :----------------- | --------: | -------: | -----------: |
| **dev cold start** | 13552.5ms | 3201.0ms |      -76.4%  |
| **dev warm start** |  4625.5ms | 2834.4ms |      -38.7%  |
| **Root HMR**       |    30.5ms |   24.0ms |      -21.3%  |
| **Leaf HMR**       |    16.9ms |   10.0ms |      -40.8%  |

You can read more information about the benchmark [here](https://gist.github.com/sapphi-red/25be97327ee64a3c1dce793444afdf6e)

### Features

* feat: expose `isFileServingAllowed` as public utility (#12894) ([93e095c](https://github.com/vitejs/vite/commit/93e095c34fb1452a4269a4fb473389d3f67e36c8)), closes [#12894](https://github.com/vitejs/vite/issues/12894)
* feat: reuse existing style elements in dev (#12678) ([3a41bd8](https://github.com/vitejs/vite/commit/3a41bd8dbd0d5fcaddde71a6f20dae7e6ce5ef16)), closes [#12678](https://github.com/vitejs/vite/issues/12678)
* feat: skip pinging the server when the tab is not shown (#12698) ([bedcd8f](https://github.com/vitejs/vite/commit/bedcd8ffacea794e66dcc817b124daccadb34241)), closes [#12698](https://github.com/vitejs/vite/issues/12698)
* feat(create-vite): use typescript 5.0 in templates (#12481) ([8582e2d](https://github.com/vitejs/vite/commit/8582e2dcfbfa3cd6bf72a305adcba40bbe8d0570)), closes [#12481](https://github.com/vitejs/vite/issues/12481)
* feat: use preview server parameter in preview server hook (#11647) ([4c142ea](https://github.com/vitejs/vite/commit/4c142eac27b13c1a53721f81813bee43be08a7d2)), closes [#11647](https://github.com/vitejs/vite/issues/11647)
* feat(reporter): show gzip info for all compressible files (fix #11288) (#12485) ([03502c8](https://github.com/vitejs/vite/commit/03502c8eb1457d63fffb1c4bc9e72d5e1f953cd2)), closes [#11288](https://github.com/vitejs/vite/issues/11288) [#12485](https://github.com/vitejs/vite/issues/12485)
* feat(server): allow to import `data:` uris (#12645) ([4886d9f](https://github.com/vitejs/vite/commit/4886d9f079fd309e84eec4328a4d473b7ad3946a)), closes [#12645](https://github.com/vitejs/vite/issues/12645)
* feat: add opus filetype to assets & mime types (#12526) ([63524ba](https://github.com/vitejs/vite/commit/63524bac878e8d3771d34ad7ad2e10cd16870ff4)), closes [#12526](https://github.com/vitejs/vite/issues/12526)

### Performance

* perf: parallelize await exportsData from depsInfo (#12869) ([ab3a530](https://github.com/vitejs/vite/commit/ab3a5309df877df234846def3c81af65b669ef97)), closes [#12869](https://github.com/vitejs/vite/issues/12869)
* perf: avoid side effects resolving in dev and in the optimizer/scanner (#12789) ([fb904f9](https://github.com/vitejs/vite/commit/fb904f97348119cc9d70bcc25c1ccd8eff4e0c90)), closes [#12789](https://github.com/vitejs/vite/issues/12789)
* perf: parallelize imports processing in import analysis plugin (#12754) ([037a6c7](https://github.com/vitejs/vite/commit/037a6c77da04aeec7442e11765619b0ea4d846f9)), closes [#12754](https://github.com/vitejs/vite/issues/12754)
* perf: unresolvedUrlToModule promise cache (#12725) ([80c526e](https://github.com/vitejs/vite/commit/80c526eb94593955ec328b9ababc72e2b585b13f)), closes [#12725](https://github.com/vitejs/vite/issues/12725)
* perf(resolve): avoid tryFsResolve for /@fs/ paths (#12450) ([3ef8aaa](https://github.com/vitejs/vite/commit/3ef8aaa7e5979dfe2fc3ec81391bd21f36c09097)), closes [#12450](https://github.com/vitejs/vite/issues/12450)
* perf(resolve): reduce vite client path checks (#12471) ([c49af23](https://github.com/vitejs/vite/commit/c49af2340b026f55b5855343c59272a9a733bd2f)), closes [#12471](https://github.com/vitejs/vite/issues/12471)
* perf: avoid new URL() in hot path (#12654) ([f4e2fdf](https://github.com/vitejs/vite/commit/f4e2fdf069a46378122d10111afbc669ae3a3874)), closes [#12654](https://github.com/vitejs/vite/issues/12654)
* perf: improve isFileReadable performance (#12397) ([acf3a14](https://github.com/vitejs/vite/commit/acf3a14ba357e330a6d207865edb9f9e078c7d56)), closes [#12397](https://github.com/vitejs/vite/issues/12397)
* perf: module graph url shortcuts (#12635) ([c268cfa](https://github.com/vitejs/vite/commit/c268cfaf0fdb0c82db22fcc67b790c00b2c248ac)), closes [#12635](https://github.com/vitejs/vite/issues/12635)
* perf: reduce runOptimizerIfIdleAfterMs time (#12614) ([d026a65](https://github.com/vitejs/vite/commit/d026a652353c9e08272447eacfffe0c11dc73f52)), closes [#12614](https://github.com/vitejs/vite/issues/12614)
* perf: shorcircuit resolve in ensure entry from url (#12655) ([82137d6](https://github.com/vitejs/vite/commit/82137d6872adb61ffc2f8ce47924dd50626b3b64)), closes [#12655](https://github.com/vitejs/vite/issues/12655)
* perf: skip es-module-lexer if have no dynamic imports (#12732) ([5d07d7c](https://github.com/vitejs/vite/commit/5d07d7c921f8cc6c9ca24926209066519b8b1f6b)), closes [#12732](https://github.com/vitejs/vite/issues/12732)
* perf: start preprocessing static imports before updating module graph (#12723) ([c90b46e](https://github.com/vitejs/vite/commit/c90b46e9f52a32b4d1d0577815a5a3cffda97827)), closes [#12723](https://github.com/vitejs/vite/issues/12723)
* perf: use package cache for one off resolve (#12744) ([77bf4ef](https://github.com/vitejs/vite/commit/77bf4efa3940801b77beb847f891e7831bb04810)), closes [#12744](https://github.com/vitejs/vite/issues/12744)
* perf(css): cache lazy import (#12721) ([fedb080](https://github.com/vitejs/vite/commit/fedb0803308f8d62ff88f300187f0379a4d49f91)), closes [#12721](https://github.com/vitejs/vite/issues/12721)
* perf(hmr): keep track of already traversed modules when propagating update (#12658) ([3b912fb](https://github.com/vitejs/vite/commit/3b912fbcc8a1b7b08b4f8aa2ba0b952a4d4c772b)), closes [#12658](https://github.com/vitejs/vite/issues/12658)
* perf(moduleGraph): resolve dep urls in parallel (#12619) ([4823fec](https://github.com/vitejs/vite/commit/4823fec1dc191c1b87a3ead6f5a2c72d5878810f)), closes [#12619](https://github.com/vitejs/vite/issues/12619)
* perf(resolve): skip for virtual files (#12638) ([9e13f5f](https://github.com/vitejs/vite/commit/9e13f5f55c662e455fa1914b1dd91e1e16a22558)), closes [#12638](https://github.com/vitejs/vite/issues/12638)
* perf: avoid fsp.unlink if we don't use the promise (#12589) ([19d1980](https://github.com/vitejs/vite/commit/19d19803c190b48284526903aab00b3b69311ac8)), closes [#12589](https://github.com/vitejs/vite/issues/12589)
* perf: back to temporal optimizer dirs (#12622) ([8da0422](https://github.com/vitejs/vite/commit/8da04227d6f818a8ad9efc0056101968037c2e36)), closes [#12622](https://github.com/vitejs/vite/issues/12622)
* perf: cache `depsCacheDirPrefix` value for `isOptimizedDepFile` (#12601) ([edbd262](https://github.com/vitejs/vite/commit/edbd262a0eac158fcc69ff2329e4507e5743fa65)), closes [#12601](https://github.com/vitejs/vite/issues/12601)
* perf: improve cleanUrl util (#12573) ([68d500e](https://github.com/vitejs/vite/commit/68d500e25e1105f54fdec45e4f4918a8a0da5358)), closes [#12573](https://github.com/vitejs/vite/issues/12573)
* perf: non-blocking write of optimized dep files (#12603) ([2f5f968](https://github.com/vitejs/vite/commit/2f5f9683d3d663020995dd4742792c2d6d68acef)), closes [#12603](https://github.com/vitejs/vite/issues/12603)
* perf: try using realpathSync.native in Windows (#12580) ([1cc99f8](https://github.com/vitejs/vite/commit/1cc99f83754bee4c3cedc7af4c80749efef3edd0)), closes [#12580](https://github.com/vitejs/vite/issues/12580)
* perf: use fsp in more cases (#12553) ([e9b92f5](https://github.com/vitejs/vite/commit/e9b92f5b0afd1e579ccbe81f1c4b26001a111939)), closes [#12553](https://github.com/vitejs/vite/issues/12553)
* perf(html): apply preTransformRequest for html scripts (#12599) ([420782c](https://github.com/vitejs/vite/commit/420782c76733ecc8314bccc2255976347add3d2e)), closes [#12599](https://github.com/vitejs/vite/issues/12599)
* perf(optimizer): bulk optimizer delay (#12609) ([c881971](https://github.com/vitejs/vite/commit/c881971422a196da163111214781ad27838c634f)), closes [#12609](https://github.com/vitejs/vite/issues/12609)
* perf(optimizer): start optimizer early (#12593) ([4f9b8b4](https://github.com/vitejs/vite/commit/4f9b8b4bc853450182ddfb49d5a4d80241053b86)), closes [#12593](https://github.com/vitejs/vite/issues/12593)
* perf(resolve): avoid isWorkerRequest and clean up .ts imported a .js (#12571) ([8ab1438](https://github.com/vitejs/vite/commit/8ab1438e7b0e5be29d256e2fc1466a23725af2c6)), closes [#12571](https://github.com/vitejs/vite/issues/12571)
* perf(resolve): findNearestMainPackageData instead of lookupFile (#12576) ([54b376f](https://github.com/vitejs/vite/commit/54b376fae0ac1fec350525116f61d0be3c6886d5)), closes [#12576](https://github.com/vitejs/vite/issues/12576)
* perf(server): only watch .env files in envDir (#12587) ([26d8e72](https://github.com/vitejs/vite/commit/26d8e720f0ac8076dced7c5efd4d3da397fefebe)), closes [#12587](https://github.com/vitejs/vite/issues/12587)
* perf: avoid execSync on openBrowser (#12510) ([a2af2f0](https://github.com/vitejs/vite/commit/a2af2f03b65b116989253dd11b16089a60cb6cbd)), closes [#12510](https://github.com/vitejs/vite/issues/12510)
* perf: extract regex and use Map in data-uri plugin (#12500) ([137e63d](https://github.com/vitejs/vite/commit/137e63d8ec469fabfb2e626e53c0939d32a95809)), closes [#12500](https://github.com/vitejs/vite/issues/12500)
* perf: extract vite:resolve internal functions (#12522) ([6ea4be2](https://github.com/vitejs/vite/commit/6ea4be2c6e20164dd85d3298a4c6a001bb0c3a41)), closes [#12522](https://github.com/vitejs/vite/issues/12522)
* perf: improve package cache usage (#12512) ([abc2b9c](https://github.com/vitejs/vite/commit/abc2b9c2ff16937860282bab7b67fd47e0c3bb3c)), closes [#12512](https://github.com/vitejs/vite/issues/12512)
* perf: more regex improvements (#12520) ([abf536f](https://github.com/vitejs/vite/commit/abf536f920c32db1b96f6b4cabb510281e5170f5)), closes [#12520](https://github.com/vitejs/vite/issues/12520)
* perf: regex to startsWith/slice in utils (#12532) ([debc6e2](https://github.com/vitejs/vite/commit/debc6e2eaafedbf737e79d03023a5f4b9f307cc5)), closes [#12532](https://github.com/vitejs/vite/issues/12532)
* perf: remove regex in ImportMetaURL plugins (#12502) ([1030049](https://github.com/vitejs/vite/commit/10300499011af9165f9e6b02c1841835dc0b4fbc)), closes [#12502](https://github.com/vitejs/vite/issues/12502)
* perf: replace endsWith with === (#12539) ([7eb52ec](https://github.com/vitejs/vite/commit/7eb52ec5141ad8b2276ef53d3cee953f8269cca5)), closes [#12539](https://github.com/vitejs/vite/issues/12539)
* perf: replace startsWith with === (#12531) ([9cce026](https://github.com/vitejs/vite/commit/9cce02684c128ad01355a9a18e3b7029a3925898)), closes [#12531](https://github.com/vitejs/vite/issues/12531)
* perf: reuse regex in plugins (#12518) ([da43936](https://github.com/vitejs/vite/commit/da4393671f7bc54e4957571641d1bded4a70fbd8)), closes [#12518](https://github.com/vitejs/vite/issues/12518)
* perf: use `safeRealpath` in `getRealpath` (#12551) ([cec2320](https://github.com/vitejs/vite/commit/cec2320cfb9bbcbf4aefb576e81f4e90306757ea)), closes [#12551](https://github.com/vitejs/vite/issues/12551)
* perf(css): improve postcss config resolve (#12484) ([58e99b6](https://github.com/vitejs/vite/commit/58e99b67784b999b357f85f12a1eacbb5007f2ee)), closes [#12484](https://github.com/vitejs/vite/issues/12484)
* perf(esbuild): make tsconfck non-blocking (#12548) ([e5cdff7](https://github.com/vitejs/vite/commit/e5cdff7db0835d1bed68b7322ae554c6cc4f429b)), closes [#12548](https://github.com/vitejs/vite/issues/12548)
* perf(esbuild): update tsconfck to consume faster find-all implementation (#12541) ([b6ea25a](https://github.com/vitejs/vite/commit/b6ea25ac28b280a702fe3b3b5a7b8a4f98817858)), closes [#12541](https://github.com/vitejs/vite/issues/12541)
* perf(resolve): fix browser mapping nearest package.json check (#12550) ([eac376e](https://github.com/vitejs/vite/commit/eac376e3d3a636840e8aa056e701b2c7f716792d)), closes [#12550](https://github.com/vitejs/vite/issues/12550)
* perf(resolve): improve package.json resolve speed (#12441) ([1fc8c65](https://github.com/vitejs/vite/commit/1fc8c652c46a27f6229c9125e3b0d1662d2a0e67)), closes [#12441](https://github.com/vitejs/vite/issues/12441)
* perf(resolve): refactor package.json handling for deep imports (#12461) ([596b661](https://github.com/vitejs/vite/commit/596b6617932e21e73650336e0e8a97d202222015)), closes [#12461](https://github.com/vitejs/vite/issues/12461)
* perf(resolve): refactor tryFsResolve and tryResolveFile (#12542) ([3f70f47](https://github.com/vitejs/vite/commit/3f70f4770b289c21e957aeadd03564c0a9a31242))
* perf(resolve): skip absolute paths in root as url checks (#12476) ([8d2931b](https://github.com/vitejs/vite/commit/8d2931ba6d32fab6ca2831e2b293469236b67503)), closes [#12476](https://github.com/vitejs/vite/issues/12476)
* perf(resolve): support # in path only for dependencies (#12469) ([6559fc7](https://github.com/vitejs/vite/commit/6559fc7be22a4e30be37136c0e565f13e937db55)), closes [#12469](https://github.com/vitejs/vite/issues/12469)

### Bug Fixes

* fix(build): do not repeatedly output warning message (#12910) ([251d0ab](https://github.com/vitejs/vite/commit/251d0ab84b533ae55171616119f371a503be54c1)), closes [#12910](https://github.com/vitejs/vite/issues/12910)
* fix: escape msg in render restricted error html (#12889) ([3aa2127](https://github.com/vitejs/vite/commit/3aa21270731821f6471efdfac7c26e971f7613be)), closes [#12889](https://github.com/vitejs/vite/issues/12889)
* fix: yarn pnp considerBuiltins (#12903) ([a0e10d5](https://github.com/vitejs/vite/commit/a0e10d5bc8b7ac6f27bd006a5cb65a56538fcede)), closes [#12903](https://github.com/vitejs/vite/issues/12903)
* fix: broken middleware name (#12871) ([32bef57](https://github.com/vitejs/vite/commit/32bef575efc7067fdb374131ff9cbbecf459584a)), closes [#12871](https://github.com/vitejs/vite/issues/12871)
* fix: cleanUpStaleCacheDirs once per process (#12847) ([2c58b6e](https://github.com/vitejs/vite/commit/2c58b6e5f13a731ff7ed0e3d3ec801427b82269f)), closes [#12847](https://github.com/vitejs/vite/issues/12847)
* fix(build): do not warn when URL in CSS is externalized (#12873) ([1510996](https://github.com/vitejs/vite/commit/151099628310d27c0b526b31ba74b8b258fb59b5)), closes [#12873](https://github.com/vitejs/vite/issues/12873)
* fix: build time deps optimization, and ensure single crawl end call (#12851) ([fa30879](https://github.com/vitejs/vite/commit/fa3087933d713929c0c0c55528cb65213e779f9f)), closes [#12851](https://github.com/vitejs/vite/issues/12851)
* fix: correct vite config temporary name (#12833) ([cdd9c23](https://github.com/vitejs/vite/commit/cdd9c2320650f34c46e02f3777239e595cf6543d)), closes [#12833](https://github.com/vitejs/vite/issues/12833)
* fix(importAnalysis): warning on ExportAllDeclaration (#12799) ([5136b9b](https://github.com/vitejs/vite/commit/5136b9b0c121d2c05bf0972bb371ffd4a2f1211f)), closes [#12799](https://github.com/vitejs/vite/issues/12799)
* fix(optimizer): start optimizer after buildStart (#12832) ([cfe75ee](https://github.com/vitejs/vite/commit/cfe75ee4565350b4a3af21b5fd9598f1fc7b2366)), closes [#12832](https://github.com/vitejs/vite/issues/12832)
* fix: handle try-catch for fs promise when resolve https config (#12808) ([0bba402](https://github.com/vitejs/vite/commit/0bba402cb4eac00e34229163c7b6b7ed175e507a)), closes [#12808](https://github.com/vitejs/vite/issues/12808)
* fix(build): correctly handle warning ignore list (#12831) ([8830532](https://github.com/vitejs/vite/commit/883053282ff1d21d1cfeb14357df238cae8d6468)), closes [#12831](https://github.com/vitejs/vite/issues/12831)
* fix(resolve): use different importer check for css imports (#12815) ([d037327](https://github.com/vitejs/vite/commit/d03732702e82ebdc96bb9d74469d1bbef4c10a0c)), closes [#12815](https://github.com/vitejs/vite/issues/12815)
* fix: ignore sideEffects for scripts imported from html (#12786) ([f09551f](https://github.com/vitejs/vite/commit/f09551f18d56771a5e539ac15cf41bcb413dfc31)), closes [#12786](https://github.com/vitejs/vite/issues/12786)
* fix: warn on build when bundling code that uses nodejs built in module (#12616) ([72050f9](https://github.com/vitejs/vite/commit/72050f913ff4fe216ac9cd3e12bb7acd36e2671f)), closes [#12616](https://github.com/vitejs/vite/issues/12616)
* fix(cli): pass mode to optimize command (#12776) ([da38ad8](https://github.com/vitejs/vite/commit/da38ad8ece6b1ab4560333532def2cccf29cd44a)), closes [#12776](https://github.com/vitejs/vite/issues/12776)
* fix(css): resolve at import from dependency basedir (#12796) ([46bdf7d](https://github.com/vitejs/vite/commit/46bdf7dbfaa6df8a0405c68df586752713c4ded6)), closes [#12796](https://github.com/vitejs/vite/issues/12796)
* fix(worker): asset in iife worker and relative base (#12697) ([ddefc06](https://github.com/vitejs/vite/commit/ddefc064ba23b02a82453cc8dc8c9a89266e64e3)), closes [#12697](https://github.com/vitejs/vite/issues/12697)
* fix(worker): return null for shouldTransformCachedModule (#12797) ([ea5f6fc](https://github.com/vitejs/vite/commit/ea5f6fcd06064bf80fc6b2e8b31bb507be242b73)), closes [#12797](https://github.com/vitejs/vite/issues/12797)
* fix: allow onwarn to override vite default warning handling (#12757) ([f736930](https://github.com/vitejs/vite/commit/f736930b8bceacbe1f1cb7d9dfc8a7f5c010cc47)), closes [#12757](https://github.com/vitejs/vite/issues/12757)
* fix: ensure module in graph before transforming (#12774) ([44ad321](https://github.com/vitejs/vite/commit/44ad3219550cc3cd58fd18c4f0ba937129707cdb)), closes [#12774](https://github.com/vitejs/vite/issues/12774)
* fix: update package cache watcher (#12772) ([a78588f](https://github.com/vitejs/vite/commit/a78588f5dd2c7f712262696ce5765ae8a4ace70d)), closes [#12772](https://github.com/vitejs/vite/issues/12772)
* fix: avoid clean up while committing deps folder (#12722) ([3f4d109](https://github.com/vitejs/vite/commit/3f4d109ea4ca03c6506b7561c0520e45d8eacf42)), closes [#12722](https://github.com/vitejs/vite/issues/12722)
* fix: ignore pnp resolve error (#12719) ([2d30ae5](https://github.com/vitejs/vite/commit/2d30ae5a008c755f9220dd9ef57ec6e39dec4dc5)), closes [#12719](https://github.com/vitejs/vite/issues/12719)
* fix: leave fully dynamic import.meta.url asset (fixes #10306) (#10549) ([56802b1](https://github.com/vitejs/vite/commit/56802b1a0b6e39cbc4cca683539631fc1132c9a6)), closes [#10306](https://github.com/vitejs/vite/issues/10306) [#10549](https://github.com/vitejs/vite/issues/10549)
* fix: output combined sourcemap in importAnalysisBuild plugin (#12642) ([d051639](https://github.com/vitejs/vite/commit/d0516398b4d4ac6bc72a44e530d057a0ea123edf)), closes [#12642](https://github.com/vitejs/vite/issues/12642)
* fix: take in relative assets path fixes from rollup (#12695) ([81e44dd](https://github.com/vitejs/vite/commit/81e44dda57e815c71ea3b2dcdd3dfbd05ef35e39)), closes [#12695](https://github.com/vitejs/vite/issues/12695)
* fix: throws error when plugin tries to resolve ID to external URL (#11731) ([49674b5](https://github.com/vitejs/vite/commit/49674b54fac4378faec8580b0a13e29e21d7900d)), closes [#11731](https://github.com/vitejs/vite/issues/11731)
* fix(css): css file emit synchronously (#12558) ([8e30025](https://github.com/vitejs/vite/commit/8e30025b76040a8b61cc2aa23aaa5f7054c5a9de)), closes [#12558](https://github.com/vitejs/vite/issues/12558)
* fix(import-analysis): escape quotes correctly (#12688) ([1638ebd](https://github.com/vitejs/vite/commit/1638ebd655f44020e95d7a4147191a935cc5facb)), closes [#12688](https://github.com/vitejs/vite/issues/12688)
* fix(optimizer): load the correct lock file (#12700) ([889eebe](https://github.com/vitejs/vite/commit/889eebe5002f898efa8985015637283377a7b262)), closes [#12700](https://github.com/vitejs/vite/issues/12700)
* fix(server): delay ws server listen when restart (#12734) ([abe9274](https://github.com/vitejs/vite/commit/abe9274973386591c966804e87388ff829f8f613)), closes [#12734](https://github.com/vitejs/vite/issues/12734)
* fix(ssr): load sourcemaps alongside modules (#11780) ([be95050](https://github.com/vitejs/vite/commit/be9505041bb07844af629344a1115240fb0a8e3c)), closes [#11780](https://github.com/vitejs/vite/issues/11780)
* fix(ssr): show ssr module loader error stack (#12651) ([050c0f9](https://github.com/vitejs/vite/commit/050c0f9661231737797290c1c1faa761d98e00f3)), closes [#12651](https://github.com/vitejs/vite/issues/12651)
* fix(worker): disable manifest plugins in worker build (#12661) ([20b8ef4](https://github.com/vitejs/vite/commit/20b8ef4931c65945001ec06fb5e25f50b8300fa5)), closes [#12661](https://github.com/vitejs/vite/issues/12661)
* fix(worker): worker import.meta.url should not depends on document in iife mode (#12629) ([65f5ed2](https://github.com/vitejs/vite/commit/65f5ed2e35a392524579a3ec9b94e040676825fc)), closes [#12629](https://github.com/vitejs/vite/issues/12629)
* fix: avoid temporal optimize deps dirs (#12582) ([ff92f2f](https://github.com/vitejs/vite/commit/ff92f2fbce92e6585ff69f5f0966a35d8a12e6c8)), closes [#12582](https://github.com/vitejs/vite/issues/12582)
* fix: await `buildStart` before server start (#12647) ([871d353](https://github.com/vitejs/vite/commit/871d3533f7b29cbe4f7f8bd188362e0c9bc75d41)), closes [#12647](https://github.com/vitejs/vite/issues/12647)
* fix: call `buildStart` only once when using next port (#12624) ([e10c6bd](https://github.com/vitejs/vite/commit/e10c6bdc757836781a9285ad2a6a3611bb9d6855)), closes [#12624](https://github.com/vitejs/vite/issues/12624)
* fix: sourcemapIgnoreList for optimizedDeps (#12633) ([c1d3fc9](https://github.com/vitejs/vite/commit/c1d3fc9b0daa6235ba0a9e103c39127fb05a2e99)), closes [#12633](https://github.com/vitejs/vite/issues/12633)
* fix: splitFileAndPostfix works as cleanUrl (#12572) ([276725f](https://github.com/vitejs/vite/commit/276725f9c3d166a23efc297cbedc3b59d8cdb5e8)), closes [#12572](https://github.com/vitejs/vite/issues/12572)
* fix: throw error on build optimizeDeps issue (#12560) ([02a46d7](https://github.com/vitejs/vite/commit/02a46d7ceab71ebf7ba723372ba37012b7f9ccaf)), closes [#12560](https://github.com/vitejs/vite/issues/12560)
* fix: use nearest pkg to resolved for moduleSideEffects (#12628) ([1dfecc8](https://github.com/vitejs/vite/commit/1dfecc8fa1b3e3b414c4e3bd02e175254cefb420)), closes [#12628](https://github.com/vitejs/vite/issues/12628)
* fix(css): use `charset: 'utf8'` by default for css (#12565) ([c20a064](https://github.com/vitejs/vite/commit/c20a064a9e49d4e6df985d8d8602935284632782)), closes [#12565](https://github.com/vitejs/vite/issues/12565)
* fix(html): dont pretransform public scripts (#12650) ([4f0af3f](https://github.com/vitejs/vite/commit/4f0af3f30a614684f1f1feb0d6b2c4e687902f80)), closes [#12650](https://github.com/vitejs/vite/issues/12650)
* fix: avoid crash because of no access permission (#12552) ([eea1682](https://github.com/vitejs/vite/commit/eea16824bd2f0322032a83ea0e82356a7f172ac8)), closes [#12552](https://github.com/vitejs/vite/issues/12552)
* fix: esbuild complains with extra fields (#12516) ([7be0ba5](https://github.com/vitejs/vite/commit/7be0ba5bd6a57d84b5efdc40db5e532299df1507)), closes [#12516](https://github.com/vitejs/vite/issues/12516)
* fix: escape replacements in clientInjections (#12486) ([3765067](https://github.com/vitejs/vite/commit/37650678d781c2678a32e0e7d59d078cc4a155e5)), closes [#12486](https://github.com/vitejs/vite/issues/12486)
* fix: open browser reuse logic (#12535) ([04d14af](https://github.com/vitejs/vite/commit/04d14af316ad05c403cb9adf0acccae789b898e8)), closes [#12535](https://github.com/vitejs/vite/issues/12535)
* fix: prevent error on not set location href (#12494) ([2fb8527](https://github.com/vitejs/vite/commit/2fb8527c3bca7e42408f49d7ee7364416cab4a7a)), closes [#12494](https://github.com/vitejs/vite/issues/12494)
* fix: simplify prettyUrl (#12488) ([ebe5aa5](https://github.com/vitejs/vite/commit/ebe5aa5bcff95dbefb12a507036ef4865000f0ec)), closes [#12488](https://github.com/vitejs/vite/issues/12488)
* fix(config): add random number to temp transpiled file (#12150) ([2b2ba61](https://github.com/vitejs/vite/commit/2b2ba61f96153cb9a3ac2960ed9298851007590f)), closes [#12150](https://github.com/vitejs/vite/issues/12150)
* fix(deps): update all non-major dependencies (#12389) ([3e60b77](https://github.com/vitejs/vite/commit/3e60b778b0ed178a83f674031f5edb123e6c123c)), closes [#12389](https://github.com/vitejs/vite/issues/12389)
* fix(html): public asset urls always being treated as paths (fix #11857) (#11870) ([46d1352](https://github.com/vitejs/vite/commit/46d1352baf8b79237100c45ac2281d087e1e48e3)), closes [#11857](https://github.com/vitejs/vite/issues/11857) [#11870](https://github.com/vitejs/vite/issues/11870)
* fix(ssr): hoist import statements to the top (#12274) ([33baff5](https://github.com/vitejs/vite/commit/33baff5e26b316460812d29c541034a576fa3994)), closes [#12274](https://github.com/vitejs/vite/issues/12274)
* fix(ssr): hoist re-exports with imports (#12530) ([45549e4](https://github.com/vitejs/vite/commit/45549e4dc8d9a3a23c42e3e13e92d35d8386710d)), closes [#12530](https://github.com/vitejs/vite/issues/12530)
* fix: should generate Hi-res sourcemap for dev (#12501) ([1502617](https://github.com/vitejs/vite/commit/1502617d19bce128a7bbd5e49c74bcf94629a899)), closes [#12501](https://github.com/vitejs/vite/issues/12501)


### Clean up

* refactor: simplify crawlEndFinder (#12868) ([31f8b51](https://github.com/vitejs/vite/commit/31f8b519d2c1bb509e57e6e03d1e5097071cc774)), closes [#12868](https://github.com/vitejs/vite/issues/12868)
* refactor: use simpler resolve for nested optimized deps (#12770) ([d202588](https://github.com/vitejs/vite/commit/d202588fdfe29df95007bb0012d9b6c9aa5bde75)), closes [#12770](https://github.com/vitejs/vite/issues/12770)
* refactor: `import.meta.url` condition from renderChunk hook of worker plugin (#12696) ([fdef8fd](https://github.com/vitejs/vite/commit/fdef8fdb0f9e95d442660102432fae3a8c485136)), closes [#12696](https://github.com/vitejs/vite/issues/12696)
* refactor: clean up preTransformRequest (#12672) ([561227c](https://github.com/vitejs/vite/commit/561227c63a6935e812ad59b532562f6c38d7563a)), closes [#12672](https://github.com/vitejs/vite/issues/12672)
* refactor: make debugger nullable (#12687) ([89e4977](https://github.com/vitejs/vite/commit/89e49773e688fc1fb7f2962f25b5c6749f425599)), closes [#12687](https://github.com/vitejs/vite/issues/12687)
* refactor: remove `ensureVolumeInPath` (#12690) ([a3150ee](https://github.com/vitejs/vite/commit/a3150ee1b67c96f8bf88a20c2a7c4d2befed7b97)), closes [#12690](https://github.com/vitejs/vite/issues/12690)
* refactor: remove unused exports data props (#12740) ([4538bfe](https://github.com/vitejs/vite/commit/4538bfe5bd5a574b13bd25a344d0d9e04453ec9f)), closes [#12740](https://github.com/vitejs/vite/issues/12740)
* refactor: use `resolvePackageData` in `requireResolveFromRootWithFallback` (#12712) ([1ea38e2](https://github.com/vitejs/vite/commit/1ea38e21c37cf8021940bd4554cc981ccfdcdf25)), closes [#12712](https://github.com/vitejs/vite/issues/12712)
* refactor(css): simplify cached import code (#12730) ([0646754](https://github.com/vitejs/vite/commit/0646754bea54efd584978d1a911038167ee45071)), closes [#12730](https://github.com/vitejs/vite/issues/12730)
* refactor: improve scanner logs (#12578) ([9925a72](https://github.com/vitejs/vite/commit/9925a72c0b593044aa8a251bb17e30a4eb13aadc)), closes [#12578](https://github.com/vitejs/vite/issues/12578)
* refactor: isInNodeModules util (#12588) ([fb3245a](https://github.com/vitejs/vite/commit/fb3245a36ef8bcd719519fb40f8ff4cb965a42da)), closes [#12588](https://github.com/vitejs/vite/issues/12588)
* refactor: remove `idToPkgMap` (#12564) ([a326ec8](https://github.com/vitejs/vite/commit/a326ec802a26f32d6016af3f7526b89c75de40ba)), closes [#12564](https://github.com/vitejs/vite/issues/12564)
* refactor: simplify lookupFile (#12585) ([4215e22](https://github.com/vitejs/vite/commit/4215e22696dfec4e030749a1ad001777bf4dc2bb)), closes [#12585](https://github.com/vitejs/vite/issues/12585)
* refactor: tryStatSync as util (#12575) ([92601db](https://github.com/vitejs/vite/commit/92601db41d3cde34cbe06cca20c6ee915e5d7e77)), closes [#12575](https://github.com/vitejs/vite/issues/12575)
* refactor: use findNearestPackageData in more places (#12577) ([35faae9](https://github.com/vitejs/vite/commit/35faae96b03163e216c4c6afaf3d29577b56def6)), closes [#12577](https://github.com/vitejs/vite/issues/12577)
* refactor: esbuild plugin config logic (#12493) ([45b5b0f](https://github.com/vitejs/vite/commit/45b5b0fad7e043256b13d19af6b3fd270a37f557)), closes [#12493](https://github.com/vitejs/vite/issues/12493)


### Previous Changelogs


#### [4.3.0-beta.8](https://github.com/vitejs/vite/compare/v4.3.0-beta.7...v4.3.0-beta.8) (2023-04-19)

See [4.3.0-beta.8 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.8/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.7](https://github.com/vitejs/vite/compare/v4.3.0-beta.6...v4.3.0-beta.7) (2023-04-17)

See [4.3.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.7/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.6](https://github.com/vitejs/vite/compare/v4.3.0-beta.5...v4.3.0-beta.6) (2023-04-14)

See [4.3.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.6/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.5](https://github.com/vitejs/vite/compare/v4.3.0-beta.4...v4.3.0-beta.5) (2023-04-11)

See [4.3.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.5/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.4](https://github.com/vitejs/vite/compare/v4.3.0-beta.3...v4.3.0-beta.4) (2023-04-09)

See [4.3.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.4/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.3](https://github.com/vitejs/vite/compare/v4.3.0-beta.2...v4.3.0-beta.3) (2023-04-07)

See [4.3.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.3/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.2](https://github.com/vitejs/vite/compare/v4.3.0-beta.1...v4.3.0-beta.2) (2023-04-05)

See [4.3.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.1](https://github.com/vitejs/vite/compare/v4.3.0-beta.0...v4.3.0-beta.1) (2023-03-29)

See [4.3.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.0](https://github.com/vitejs/vite/compare/v4.2.1...v4.3.0-beta.0) (2023-03-23)

See [4.3.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.0/packages/vite/CHANGELOG.md)


## <small>4.2.2 (2023-04-18)</small>

* fix: escape msg in render restricted error html, backport #12889 ([8758c5c](https://github.com/vitejs/vite/commit/8758c5c4263e0a728618874a6efa71b037e350cf)), closes [#12889](https://github.com/vitejs/vite/issues/12889)



## <small>4.2.1 (2023-03-20)</small>

* fix: add `virtual:` to virtual module source map ignore (#12444) ([c4aa28f](https://github.com/vitejs/vite/commit/c4aa28fbcc479b2f18879a3f09a37a5d5f3a6c13)), closes [#12444](https://github.com/vitejs/vite/issues/12444)
* fix(css): inject source content conditionally (#12449) ([3e665f6](https://github.com/vitejs/vite/commit/3e665f6cba8473acc9e13ed6a91614bd92856275)), closes [#12449](https://github.com/vitejs/vite/issues/12449)
* fix(worker): using data URLs for inline shared worker (#12014) ([79a5007](https://github.com/vitejs/vite/commit/79a500726f61b305fcc4b6a436f37c6dc803580c)), closes [#12014](https://github.com/vitejs/vite/issues/12014)
* chore: changelog edits for 4.2 (#12438) ([ce047e3](https://github.com/vitejs/vite/commit/ce047e3a009a631969d0d05da9d48596c29babcc)), closes [#12438](https://github.com/vitejs/vite/issues/12438)



## 4.2.0 (2023-03-16)

Vite 4.2 is out!

### Support env variables replacement in HTML files

Vite now supports [replacing env variables in HTML files](https://vite.dev/guide/env-and-mode.html#html-env-replacement). Any properties in `import.meta.env` can be used in HTML files with a special `%ENV_NAME%` syntax:

```html
<h1>Vite is running in %MODE%</h1>
<p>Using data from %VITE_API_URL%</p>
```

### Sourcemaps improvements

The Chrome Dev Tools team has been working to improve the DX of Vite and Vite-powered frameworks in the dev tools. Vite 4.2 brings an [improved experience](https://twitter.com/bmeurer/status/1631286267823439881) and tools for framework authors to [hide 3rd party code and build artifacts from the user](https://twitter.com/bmeurer/status/1631531492462526467) from console log traces using [`server.sourcemapIgnoreList`](https://vite.dev/config/server-options.html#server-sourcemapignorelist) and [`build.rollupOptions.output.sourcemapIgnoreList`](https://rollupjs.org/configuration-options/#output-sourcemapignorelist).

### ESM subpath imports

Vite 4.2 now supports [subpath imports](https://nodejs.org/api/packages.html#subpath-imports), thanks to [@lukeed05](https://twitter.com/lukeed05)'s [resolve.exports](https://github.com/lukeed/resolve.exports) library.

### TypeScript 5 support

Vite 4.2 also supports TypeScript 5's `tsconfig` `extends` [array format](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#supporting-multiple-configuration-files-in-extends), thanks to [tsconfck](https://github.com/dominikg/tsconfck).


### esbuild 0.17

esbuild [v0.17.0](https://github.com/evanw/esbuild/releases/tag/v0.17.0) improved the design of its incremental, watch, and serve APIs. Check out [#11908](https://github.com/vitejs/vite/pull/11908) for the rationale of why we didn't consider the backward-incompatible changes breaking for our use cases. The updated esbuild design now allows Vite to properly cancel in-fly builds and improve server restarts.


### Use Rollup types from the vite package

Expose Rollup types as a namespace. This is helpful to avoid type conflicts because of different versions of Rollup types in environments like [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) ([#12316](https://github.com/vitejs/vite/issues/12316)).

```ts
import type { Rollup } from 'vite'
```


### Português Docs Translation

The Vite documentation is now translated to Português at [pt.vite.dev](https://pt.vite.dev) thanks to [Nazaré Da Piedade](https://twitter.com/nazarepiedady) .


### Features

* feat: add status message for 504 caused by optimizer (#12435) ([5cdd3fa](https://github.com/vitejs/vite/commit/5cdd3fa97849442a98aa7aef63a0064220e4aef2)), closes [#12435](https://github.com/vitejs/vite/issues/12435)
* feat: update tsconfck to 2.1.0 to add support for typescript 5 config syntax (#12401) ([3f1c379](https://github.com/vitejs/vite/commit/3f1c379bceafc5b4e19dacb1589d57c38eaf8d30)), closes [#12401](https://github.com/vitejs/vite/issues/12401)
* feat: default esbuild jsxDev based on config.isProduction (#12386) ([f24c2b0](https://github.com/vitejs/vite/commit/f24c2b03d7f4f23d5b22f4ca9d2713f08e385c53)), closes [#12386](https://github.com/vitejs/vite/issues/12386)
* feat(css): add `build.cssMinify` (#12207) ([90431f2](https://github.com/vitejs/vite/commit/90431f27f4e525fa4f2fe35e2fe00164e213d0b0)), closes [#12207](https://github.com/vitejs/vite/issues/12207)
* feat(types): export Rollup namespace (#12316) ([6e49e52](https://github.com/vitejs/vite/commit/6e49e5284a5ee5bdae801d2fcbd594a49a7694b4)), closes [#12316](https://github.com/vitejs/vite/issues/12316)
* feat: add `sourcemapIgnoreList` configuration option (#12174) ([f875580](https://github.com/vitejs/vite/commit/f875580addde639591bab1fafd54f1bc2e225fba)), closes [#12174](https://github.com/vitejs/vite/issues/12174)
* feat: cancellable scan during optimization (#12225) ([1e1cd3b](https://github.com/vitejs/vite/commit/1e1cd3ba33aee628430c15c58fb43bf2739d5c2f)), closes [#12225](https://github.com/vitejs/vite/issues/12225)
* feat: don't override `build.target` if terser is 5.16.0+ (#12197) ([9885f6f](https://github.com/vitejs/vite/commit/9885f6f113667c1e161dee5f30af1e91aeefa62f)), closes [#12197](https://github.com/vitejs/vite/issues/12197)
* feat: support ESM subpath imports (#7770) ([cc92da9](https://github.com/vitejs/vite/commit/cc92da906da5b8656c42a5605d8c499b14e516d9)), closes [#7770](https://github.com/vitejs/vite/issues/7770)
* feat(css): add preprocessor option to define stylus vars & funcs (#7227) ([5968bec](https://github.com/vitejs/vite/commit/5968becf5970125b90b503a53208e2dff29b02bb)), closes [#7227](https://github.com/vitejs/vite/issues/7227)
* feat(css): support resolving stylesheets from exports map (#7817) ([108aadf](https://github.com/vitejs/vite/commit/108aadf72865a3b95c8f013eb7721769d035a16c)), closes [#7817](https://github.com/vitejs/vite/issues/7817)
* feat(html): support env replacement (#12202) ([4f2c49f](https://github.com/vitejs/vite/commit/4f2c49f8861838715388fc88117af86faff57340)), closes [#12202](https://github.com/vitejs/vite/issues/12202)
* refactor: customize ErrorOverlay (part 2) (#11830) ([4159e6f](https://github.com/vitejs/vite/commit/4159e6f271b06f2253f08974d7eea80e2e7f32b0)), closes [#11830](https://github.com/vitejs/vite/issues/11830)
* refactor: remove constructed sheet type style injection (#11818) ([1a6a0c2](https://github.com/vitejs/vite/commit/1a6a0c2c2c1ac9584d928ea61a65dfb5f5360740)), closes [#11818](https://github.com/vitejs/vite/issues/11818)
* refactor(importAnalysis): cache injected env string (#12154) ([2aad552](https://github.com/vitejs/vite/commit/2aad5522dcd30050ef049170825287dfa0d0aa42)), closes [#12154](https://github.com/vitejs/vite/issues/12154)
* feat: esbuild 0.17 (#11908) ([9d42f06](https://github.com/vitejs/vite/commit/9d42f06af7403599402dab797b51d68a07b5ff2e)), closes [#11908](https://github.com/vitejs/vite/issues/11908)
* feat: ignore list client injected sources (#12170) ([8a98aef](https://github.com/vitejs/vite/commit/8a98aef89c2d170e063aab34b24dc49c37dc9e46)), closes [#12170](https://github.com/vitejs/vite/issues/12170)
* feat: support rollup plugin `this.load` in plugin container context (#11469) ([abfa804](https://github.com/vitejs/vite/commit/abfa804acd1a527bd4ebab45f1241fb4adcd826c)), closes [#11469](https://github.com/vitejs/vite/issues/11469)
* feat(cli): allow to specify sourcemap mode via --sourcemap build's option (#11505) ([ee3b90a](https://github.com/vitejs/vite/commit/ee3b90a812e863fc92f485ce53a4e764a2c34708)), closes [#11505](https://github.com/vitejs/vite/issues/11505)
* feat(reporter): report built time (#12100) ([f2ad222](https://github.com/vitejs/vite/commit/f2ad222be876fcc12f00ed869b020f0c67c2a626)), closes [#12100](https://github.com/vitejs/vite/issues/12100)


### Bug Fixes

* fix: html env replacement plugin position (#12404) ([96f36a9](https://github.com/vitejs/vite/commit/96f36a9a5ed20abc17e47a559e3484f7639b8809)), closes [#12404](https://github.com/vitejs/vite/issues/12404)
* fix(optimizer): # symbol in deps id stripped by browser (#12415) ([e23f690](https://github.com/vitejs/vite/commit/e23f690dbf863cb197a28f0aad35234ae6dc7f6b)), closes [#12415](https://github.com/vitejs/vite/issues/12415)
* fix(resolve): rebase sub imports relative path (#12373) ([fe1d61a](https://github.com/vitejs/vite/commit/fe1d61a75ef8e9833f7dbead71b4eedd8e88813a)), closes [#12373](https://github.com/vitejs/vite/issues/12373)
* fix(server): should close server after create new server (#12379) ([d23605d](https://github.com/vitejs/vite/commit/d23605d01449706988be2eb77f2654238778fca8)), closes [#12379](https://github.com/vitejs/vite/issues/12379)
* fix(resolve): remove deep import syntax handling (#12381) ([42e0d6a](https://github.com/vitejs/vite/commit/42e0d6af67743841bd38ed504cb8cbaaafb6313f)), closes [#12381](https://github.com/vitejs/vite/issues/12381)
* fix: print urls when dns order change (#12261) ([e57cacf](https://github.com/vitejs/vite/commit/e57cacfb412c7cac9f5e793357df445990d7535f)), closes [#12261](https://github.com/vitejs/vite/issues/12261)
* fix: throw ssr import error directly (fix #12322) (#12324) ([21ffc6a](https://github.com/vitejs/vite/commit/21ffc6aa4f735906f2fb463c68810afc878212fb)), closes [#12322](https://github.com/vitejs/vite/issues/12322) [#12324](https://github.com/vitejs/vite/issues/12324)
* fix(config): watch config even outside of root (#12321) ([7e2fff7](https://github.com/vitejs/vite/commit/7e2fff774bb76e72794a76b66218d6eec397f870)), closes [#12321](https://github.com/vitejs/vite/issues/12321)
* fix(config): watch envDir even outside of root (#12349) ([131f3ee](https://github.com/vitejs/vite/commit/131f3ee6838a91faf48b81dfce779283a3e5acd5)), closes [#12349](https://github.com/vitejs/vite/issues/12349)
* fix(define): correctly replace SSR in dev (#12204) ([0f6de4d](https://github.com/vitejs/vite/commit/0f6de4dcff783ec21fada47651d564cd5e2631b2)), closes [#12204](https://github.com/vitejs/vite/issues/12204)
* fix(optimizer): suppress esbuild cancel error (#12358) ([86a24e4](https://github.com/vitejs/vite/commit/86a24e42dab93f456bb73316d5f34ce79f4e8683)), closes [#12358](https://github.com/vitejs/vite/issues/12358)
* fix(optimizer): transform css require to import directly (#12343) ([716286e](https://github.com/vitejs/vite/commit/716286ef21f4d59786f21341a52a81ee5db58aba)), closes [#12343](https://github.com/vitejs/vite/issues/12343)
* fix(reporter): build.assetsDir should not impact output when in lib mode (#12108) ([b12f457](https://github.com/vitejs/vite/commit/b12f4572b1c3173fef101c2f837160ce321f68e5)), closes [#12108](https://github.com/vitejs/vite/issues/12108)
* fix(types): avoid resolve.exports types for bundling (#12346) ([6b40f03](https://github.com/vitejs/vite/commit/6b40f03574cd71a17cbe564bc63adebb156ff06e)), closes [#12346](https://github.com/vitejs/vite/issues/12346)
* fix(worker): force rollup to build worker module under watch mode (#11919) ([d464679](https://github.com/vitejs/vite/commit/d464679bf7407376c56ddf5b6174e91e1a74a2b5)), closes [#11919](https://github.com/vitejs/vite/issues/11919)
* fix:  resolve browser mapping using bare imports (fix #11208) (#11219) ([22de84f](https://github.com/vitejs/vite/commit/22de84fb18a0d36cc14a806d5bec5801aa0f33b1)), closes [#11208](https://github.com/vitejs/vite/issues/11208) [#11219](https://github.com/vitejs/vite/issues/11219)
* fix: avoid null sourcePath in `server.sourcemapIgnoreList` (#12251) ([209c3bd](https://github.com/vitejs/vite/commit/209c3bd0b751c78b8c89234b77b2625a5cc7e7f9)), closes [#12251](https://github.com/vitejs/vite/issues/12251)
* fix: configure proxy before subscribing to error events (#12263) ([c35e100](https://github.com/vitejs/vite/commit/c35e1007198fbcd6ccfe557127621234703c4a89)), closes [#12263](https://github.com/vitejs/vite/issues/12263)
* fix: enforce absolute path for server.sourcemapIgnoreList (#12309) ([ab6ae07](https://github.com/vitejs/vite/commit/ab6ae073e4feabeb78cec8b56af527d42b79415e)), closes [#12309](https://github.com/vitejs/vite/issues/12309)
* fix: handle error without line and column in loc (#12312) ([ce18eba](https://github.com/vitejs/vite/commit/ce18eba39f8243a1652dcae4d157540815f105ab)), closes [#12312](https://github.com/vitejs/vite/issues/12312)
* fix: properly clean up optimization temp folder (#12237) ([fbbf8fe](https://github.com/vitejs/vite/commit/fbbf8fe13627b2a44dc201ab89649fe56eed0c7a)), closes [#12237](https://github.com/vitejs/vite/issues/12237)
* fix: unique dep optimizer temp folders (#12252) ([38ce81c](https://github.com/vitejs/vite/commit/38ce81ceb86d42c27ec39eefa8091f47f6f25967)), closes [#12252](https://github.com/vitejs/vite/issues/12252)
* fix(build-import-analysis): should not append ?used when css request has ?url or ?raw (#11910) ([e3f725f](https://github.com/vitejs/vite/commit/e3f725faa12d376eba61e1707ecfa2257d24d5a6)), closes [#11910](https://github.com/vitejs/vite/issues/11910)
* fix(optimizer): don not call context.rebuild after cancel (#12264) ([520d84e](https://github.com/vitejs/vite/commit/520d84e605669096d53a7f88341a220e92290f1d)), closes [#12264](https://github.com/vitejs/vite/issues/12264)
* fix(resolve): update `resolve.exports` to `2.0.1` to fix `*` resolution issue (#12314) ([523d6f7](https://github.com/vitejs/vite/commit/523d6f78b3f5be13ee76e81591130f9c2a98cac9)), closes [#12314](https://github.com/vitejs/vite/issues/12314)
* fix: use relative paths in `sources` for transformed source maps (#12079) ([bcbc582](https://github.com/vitejs/vite/commit/bcbc58201339a9ea5856327c2e697762d7b14449)), closes [#12079](https://github.com/vitejs/vite/issues/12079)
* fix(cli): after setting server.open, the default open is inconsistent… (#11974) ([33a38db](https://github.com/vitejs/vite/commit/33a38db867c84c888006dce561aa26b419a2eaec)), closes [#11974](https://github.com/vitejs/vite/issues/11974)
* fix(client-inject): replace globalThis.process.env.NODE_ENV (fix #12185) (#12194) ([2063648](https://github.com/vitejs/vite/commit/20636489ab67337dddc9421524424cefb62a1299)), closes [#12185](https://github.com/vitejs/vite/issues/12185) [#12194](https://github.com/vitejs/vite/issues/12194)
* fix(css): should not rebase http url for less (fix: #12155) (#12195) ([9cca30d](https://github.com/vitejs/vite/commit/9cca30d998a24e58a2e2871a5d95ba508d012dd4)), closes [#12155](https://github.com/vitejs/vite/issues/12155) [#12195](https://github.com/vitejs/vite/issues/12195)
* fix(deps): update all non-major dependencies (#12036) ([48150f2](https://github.com/vitejs/vite/commit/48150f2ea4d7ff8e3b67f15239ae05f5be317436)), closes [#12036](https://github.com/vitejs/vite/issues/12036)
* fix(import-analysis): improve error for jsx to not be preserve in tsconfig (#12018) ([91fac1c](https://github.com/vitejs/vite/commit/91fac1ca1c31dfdd7e0b33186ea23b5e79a1b4cf)), closes [#12018](https://github.com/vitejs/vite/issues/12018)
* fix(optimizer): log esbuild error when scanning deps (#11977) ([20e6060](https://github.com/vitejs/vite/commit/20e60607a824c85efe8dfc206e5f7098421e545f)), closes [#11977](https://github.com/vitejs/vite/issues/11977)
* fix(optimizer): log unoptimizable entries (#12138) ([2c93e0b](https://github.com/vitejs/vite/commit/2c93e0b185db6f879dc41eae1aec4e3e38a3f70d)), closes [#12138](https://github.com/vitejs/vite/issues/12138)
* fix(server): watch env files creating and deleting (fix #12127) (#12129) ([cc3724f](https://github.com/vitejs/vite/commit/cc3724fe4ad4af05683aed744b1173192595c427)), closes [#12127](https://github.com/vitejs/vite/issues/12127) [#12129](https://github.com/vitejs/vite/issues/12129)
* build: correct d.ts output dir in development (#12212) ([b90bc1f](https://github.com/vitejs/vite/commit/b90bc1f24286b8831e504f69902fd0557855739e)), closes [#12212](https://github.com/vitejs/vite/issues/12212)


### Previous Changelogs


#### [4.2.0-beta.2](https://github.com/vitejs/vite/compare/v4.2.0-beta.1...v4.2.0-beta.2) (2023-03-13)

See [4.2.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.2.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.2.0-beta.1](https://github.com/vitejs/vite/compare/v4.2.0-beta.0...v4.2.0-beta.1) (2023-03-07)

See [4.2.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.2.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.2.0-beta.0](https://github.com/vitejs/vite/compare/v4.1.4...v4.2.0-beta.0) (2023-02-27)

See [4.2.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.2.0-beta.0/packages/vite/CHANGELOG.md)



## <small>4.1.4 (2023-02-21)</small>

* fix(define): should not stringify vite internal env (#12120) ([73c3999](https://github.com/vitejs/vite/commit/73c39995af755f4660c0a50f8153aa57a6c1b37d)), closes [#12120](https://github.com/vitejs/vite/issues/12120)
* docs: update rollup docs links (#12130) ([439a73f](https://github.com/vitejs/vite/commit/439a73f3222987896f556b64628bdbcb5d9454c3)), closes [#12130](https://github.com/vitejs/vite/issues/12130)



## <small>4.1.3 (2023-02-20)</small>

* fix: catch and handle websocket error (#11991) (#12007) ([4b5cc9f](https://github.com/vitejs/vite/commit/4b5cc9f0b6d497ec9c7850afddb8000af27ad965)), closes [#11991](https://github.com/vitejs/vite/issues/11991) [#12007](https://github.com/vitejs/vite/issues/12007)
* fix: do not append version query param when scanning for dependencies (#11961) ([575bcf6](https://github.com/vitejs/vite/commit/575bcf61c58f2be8f68b88b60fb90475dce5bc4d)), closes [#11961](https://github.com/vitejs/vite/issues/11961)
* fix(css): handle pure css chunk heuristic with special queries (#12091) ([a873af5](https://github.com/vitejs/vite/commit/a873af5d3d0b59ee8c1f982ad6ff821b7119c8fb)), closes [#12091](https://github.com/vitejs/vite/issues/12091)
* fix(esbuild): umd helper insert into wrong position in lib mode (#11988) ([86bc243](https://github.com/vitejs/vite/commit/86bc243f7e309e255a073d26b438bacaa59e1948)), closes [#11988](https://github.com/vitejs/vite/issues/11988)
* fix(html): respect disable modulepreload (#12111) ([6c50119](https://github.com/vitejs/vite/commit/6c5011947e34c44586b70f6fdc1703abe2989b93)), closes [#12111](https://github.com/vitejs/vite/issues/12111)
* fix(html): rewrite assets url in `<noscript>` (#11764) ([1dba285](https://github.com/vitejs/vite/commit/1dba2855981418f0797d57e15f40a4b659de5d20)), closes [#11764](https://github.com/vitejs/vite/issues/11764)
* feat(preview): improve error when build output missing (#12096) ([a0702a1](https://github.com/vitejs/vite/commit/a0702a1e5e923112abda431770aea41146bdc451)), closes [#12096](https://github.com/vitejs/vite/issues/12096)
* feat(ssr): add importer path to error msg when invalid url import occur (#11606) ([70729c0](https://github.com/vitejs/vite/commit/70729c00a5e846643b163ea7c703332894c70af0)), closes [#11606](https://github.com/vitejs/vite/issues/11606)



## <small>4.1.2 (2023-02-17)</small>

* fix: correct access to `crossOrigin` attribute (#12023) ([6a0d356](https://github.com/vitejs/vite/commit/6a0d356e4ab064ef34cce33e38b130b877fdcb1d)), closes [#12023](https://github.com/vitejs/vite/issues/12023)
* fix: narrow defineConfig return type (#12021) ([18fa8f0](https://github.com/vitejs/vite/commit/18fa8f028bff5df67807b6373081fb02b005f5c5)), closes [#12021](https://github.com/vitejs/vite/issues/12021)
* fix(define): inconsistent env values in build mode (#12058) ([0a50c59](https://github.com/vitejs/vite/commit/0a50c59fbc23f43060fca063e0aeee1587fae41b)), closes [#12058](https://github.com/vitejs/vite/issues/12058)
* fix(env): compatible with env variables ended with unescaped $ (#12031) ([05b3df0](https://github.com/vitejs/vite/commit/05b3df0016c43759afe0905a19041ce957fe2460)), closes [#12031](https://github.com/vitejs/vite/issues/12031)
* fix(ssr): print file url in `ssrTransform` parse error (#12060) ([19f39f7](https://github.com/vitejs/vite/commit/19f39f7f65016520c4c6f9b92fbf269e9d8add7e)), closes [#12060](https://github.com/vitejs/vite/issues/12060)
* revert: narrow defineConfig return type (#12077) ([54d511e](https://github.com/vitejs/vite/commit/54d511e67be28c6d0032b963248659fce9a245fe)), closes [#12077](https://github.com/vitejs/vite/issues/12077)
* feat: support `import.meta.hot?.accept` (#12053) ([081c27f](https://github.com/vitejs/vite/commit/081c27f2dda698b112ca01693b928127208421fd)), closes [#12053](https://github.com/vitejs/vite/issues/12053)
* chore: add jsdoc default value (#11746) ([8c87af7](https://github.com/vitejs/vite/commit/8c87af7c03f5b989c8c86cf0c4efb0313c24af82)), closes [#11746](https://github.com/vitejs/vite/issues/11746)
* chore: fix typos (#12032) ([ee1a686](https://github.com/vitejs/vite/commit/ee1a686abf69db8a4026ed5462615766f222c29a)), closes [#12032](https://github.com/vitejs/vite/issues/12032)
* chore(deps): update dependency strip-literal to v1 (#12044) ([5bd6c0a](https://github.com/vitejs/vite/commit/5bd6c0afd22d0ec7b99c23b491b2f8ce629e6272)), closes [#12044](https://github.com/vitejs/vite/issues/12044)
* chore(pluginContainer): simplify error position judge condition (#12003) ([e3ef9f4](https://github.com/vitejs/vite/commit/e3ef9f48895cf17380e3a1766fee6c62dc8148c7)), closes [#12003](https://github.com/vitejs/vite/issues/12003)



## <small>4.1.1 (2023-02-02)</small>

* chore: 4.1.0 changelog cleanup (#11900) ([7747d32](https://github.com/vitejs/vite/commit/7747d32c6e2907acefaf27254d607c32b90580ad)), closes [#11900](https://github.com/vitejs/vite/issues/11900)
* fix: catch statSync error (#11907) ([f80b9a2](https://github.com/vitejs/vite/commit/f80b9a2acfd833daaf224d7bc7c3e1a86d3f8f20)), closes [#11907](https://github.com/vitejs/vite/issues/11907)



## 4.1.0 (2023-02-02)

Vite 4.1 updates to the latest versions of Rollup and esbuild. Check out the new [Rollup docs](https://rollupjs.org/), that are now powered by VitePress making the navigation between Vite and Rollup docs easier for users.

[Vite docs](https://vite.dev) got a theme update migrating to the latest version of VitePress.

As part of [Vite 4](https://vite.dev/blog/announcing-vite4.html), the Vue and React plugins have been extracted out of the monorepo. Although their release cycle will no longer follow Vite releases moving forward, Vite 4.1 is released in parallel with new versions of [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react%403.1.0) and [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc/releases/tag/v3.1.0). @vitejs/plugin-react 3.1.0 reworks the way HMR is handled fixing many edge cases and @vitejs/plugin-react-swc 3.1.0 adds support for SWC plugins.

There is also a new major for [@vitejs/plugin-legacy](https://github.com/vitejs/vite/blob/main/packages/plugin-legacy), see [changelog for v4.0.0](https://github.com/vitejs/vite/blob/main/packages/plugin-legacy/CHANGELOG.md#400-2023-02-02). This version contains breaking changes:
- Support browserslist and update default target ([#11318](https://github.com/vitejs/vite/pull/11318)). See [updated `targets` default](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy#targets).
- Bump modern target to support async generator ([#11896](https://github.com/vitejs/vite/pull/11896)). Learn more at [the browsers support docs](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy#browsers-that-supports-esm-but-does-not-support-widely-available-features).

### Features

* feat: add experimental option to skip SSR transform (#11411) ([e781ef3](https://github.com/vitejs/vite/commit/e781ef33455f40ad0f1e5dbf2e841e00879aeab9)), closes [#11411](https://github.com/vitejs/vite/issues/11411)
* feat: reproducible manifest (#11542) ([efc8979](https://github.com/vitejs/vite/commit/efc8979a2dc407278d27cf439be3462e8feeb977)), closes [#11542](https://github.com/vitejs/vite/issues/11542)
* feat: support BROWSER and BROWSER_ARGS in env file (#11513) ([8972868](https://github.com/vitejs/vite/commit/8972868ca2a49c837aa3f3be847e5268533b9569)), closes [#11513](https://github.com/vitejs/vite/issues/11513)
* feat(cli): clear console by pressing c (#11493) (#11494) ([1ae018f](https://github.com/vitejs/vite/commit/1ae018f1dba6756c644722092f78511e94797cdf)), closes [#11493](https://github.com/vitejs/vite/issues/11493) [#11494](https://github.com/vitejs/vite/issues/11494)
* perf(build): disable rollup cache for builds (#11454) ([580ba7a](https://github.com/vitejs/vite/commit/580ba7a65da6ac43df5fabed78a6175cd37af5c3)), closes [#11454](https://github.com/vitejs/vite/issues/11454)
* perf(resolve): improve file existence check (#11436) ([4a12b89](https://github.com/vitejs/vite/commit/4a12b896ee6e2d2363a526136f8e30be6e4b6fa8)), closes [#11436](https://github.com/vitejs/vite/issues/11436)


### Bug Fixes

* fix: await bundle closing (#11873) ([1e6768d](https://github.com/vitejs/vite/commit/1e6768d27807a794dff509e786c605935006521c)), closes [#11873](https://github.com/vitejs/vite/issues/11873)
* fix: make viteMetadata property of RenderedChunk optional (#11768) ([128f09e](https://github.com/vitejs/vite/commit/128f09eb0100e80f566e33ca8c55bcd0896d4e38)), closes [#11768](https://github.com/vitejs/vite/issues/11768)
* fix: replace import.meta.hot with undefined in the production (#11317) ([73afe6d](https://github.com/vitejs/vite/commit/73afe6d4db0dea6a1f1745e6742b5678ae63ec46)), closes [#11317](https://github.com/vitejs/vite/issues/11317)
* fix: update CJS interop error message (#11842) ([356ddfe](https://github.com/vitejs/vite/commit/356ddfe2e534800c1fd59fa502a2c4c8945f4f92)), closes [#11842](https://github.com/vitejs/vite/issues/11842)
* fix(client): serve client sources next to deployed scripts (#11865) ([63bd261](https://github.com/vitejs/vite/commit/63bd261e8a763b6e108c53b0e77907ec44eb4de5)), closes [#11865](https://github.com/vitejs/vite/issues/11865)
* fix(deps): update all non-major dependencies (#11846) ([5d55083](https://github.com/vitejs/vite/commit/5d5508311f9856de69babd72dc4de0e7c21c7ae8)), closes [#11846](https://github.com/vitejs/vite/issues/11846)
* fix(esbuild): avoid polluting global namespace while minify is false (#11882) ([c895379](https://github.com/vitejs/vite/commit/c895379862264ad40558341a5fc7cf9eb42578c4)), closes [#11882](https://github.com/vitejs/vite/issues/11882)
* fix: deep resolve side effects when glob does not contain / (#11807) ([f3a0c3b](https://github.com/vitejs/vite/commit/f3a0c3b72c3483808d5649efbcc8118927a9d0b4)), closes [#11807](https://github.com/vitejs/vite/issues/11807)
* fix: duplicated sourceMappingURL for worker bundles (fix #11601) (#11602) ([5444781](https://github.com/vitejs/vite/commit/544478172c66eca657efeeb33c1b536e5390d1e6)), closes [#11601](https://github.com/vitejs/vite/issues/11601) [#11602](https://github.com/vitejs/vite/issues/11602)
* fix: emit assets from SSR build (#11430) ([ffbdcdb](https://github.com/vitejs/vite/commit/ffbdcdb09afe1fa655601b446d724fa9a7b7f282)), closes [#11430](https://github.com/vitejs/vite/issues/11430)
* fix: revert "load sourcemaps alongside modules (#11576)" (#11775) ([697dd00](https://github.com/vitejs/vite/commit/697dd0085722eaa89697fd827ed90242c8040e0a)), closes [#11576](https://github.com/vitejs/vite/issues/11576) [#11775](https://github.com/vitejs/vite/issues/11775)
* fix: scope tracking for shadowing variables in blocks (#11806) (#11811) ([568bdab](https://github.com/vitejs/vite/commit/568bdabffe793ea8db03b35667f117a1207f4fbe)), closes [#11806](https://github.com/vitejs/vite/issues/11806) [#11811](https://github.com/vitejs/vite/issues/11811)
* fix(cli): exit 1 on ctrl+c (#11563) ([fb77411](https://github.com/vitejs/vite/commit/fb77411f3a52bdb3296b13d0b35d30bd92749174)), closes [#11563](https://github.com/vitejs/vite/issues/11563)
* fix(css): insert styles in the same position (#11763) ([d2f1381](https://github.com/vitejs/vite/commit/d2f13814eac43c82465a9c9c72c184cde3615001)), closes [#11763](https://github.com/vitejs/vite/issues/11763)
* fix(esbuild): check server before reload tsconfig (#11747) ([c56b954](https://github.com/vitejs/vite/commit/c56b95448b43f59d2b93394e1a5099bcc7879a16)), closes [#11747](https://github.com/vitejs/vite/issues/11747)
* fix(hmr): hmr websocket failure for custom middleware mode with server.hmr.server (#11487) ([00919bb](https://github.com/vitejs/vite/commit/00919bb95e51c9ecb3fbce5af21524e838d8da12)), closes [#11487](https://github.com/vitejs/vite/issues/11487)
* fix(ssr): load sourcemaps alongside modules (fix: #3288) (#11576) ([dc05e97](https://github.com/vitejs/vite/commit/dc05e97e6d3a37252d7553693ee3db38839edeb0)), closes [#3288](https://github.com/vitejs/vite/issues/3288) [#11576](https://github.com/vitejs/vite/issues/11576)
* refactor: upgrade resolve.exports (#11712) ([00a79ec](https://github.com/vitejs/vite/commit/00a79ec88472cbcc767c1187f919ce372215f573)), closes [#11712](https://github.com/vitejs/vite/issues/11712)
* fix: remove moment from force interop packages (#11502) ([b89ddd6](https://github.com/vitejs/vite/commit/b89ddd6ecd04244c71a73acfc9a2573cd0e04b13)), closes [#11502](https://github.com/vitejs/vite/issues/11502)
* fix(css): fix stale css when reloading with hmr disabled (#10270) (#11506) ([e5807c4](https://github.com/vitejs/vite/commit/e5807c4bc06be3718f4bd6aa68fb7c7d1aca2a22)), closes [#10270](https://github.com/vitejs/vite/issues/10270) [#11506](https://github.com/vitejs/vite/issues/11506)
* fix(hmr): base default protocol on client source location (#11497) ([167753d](https://github.com/vitejs/vite/commit/167753d3754507430600a1bc2b100ca321b17a86)), closes [#11497](https://github.com/vitejs/vite/issues/11497)
* fix(metadata): expose viteMetadata type (#11511) ([32dee3c](https://github.com/vitejs/vite/commit/32dee3c2635870f04fbacd577eb9bfe6f8d6e79d)), closes [#11511](https://github.com/vitejs/vite/issues/11511)
* fix(resolve): ensure exports has precedence over mainFields (cherry pick #11234) (#11595) ([691e432](https://github.com/vitejs/vite/commit/691e43225efd8b74d635bef0811eb2c26e78512b)), closes [#11234](https://github.com/vitejs/vite/issues/11234) [#11595](https://github.com/vitejs/vite/issues/11595)
* fix(resolve): use only root package.json as exports source (#11259) ([b9afa6e](https://github.com/vitejs/vite/commit/b9afa6e0867460226fe29bea30041e5751e9c1e2)), closes [#11259](https://github.com/vitejs/vite/issues/11259)
* refactor(build): close rollup bundle directly (#11460) ([a802828](https://github.com/vitejs/vite/commit/a802828f66282205c7f61718f2f399eea0173c4d)), closes [#11460](https://github.com/vitejs/vite/issues/11460)


### Previous Changelogs


#### [4.1.0-beta.2](https://github.com/vitejs/vite/compare/v4.1.0-beta.1...v4.1.0-beta.2) (2023-02-01)

See [4.1.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.1.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.1.0-beta.1](https://github.com/vitejs/vite/compare/v4.1.0-beta.0...v4.1.0-beta.1) (2023-01-26)

See [4.1.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.1.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.1.0-beta.0](https://github.com/vitejs/vite/compare/v4.0.3...v4.1.0-beta.0) (2023-01-09)

See [4.1.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.1.0-beta.0/packages/vite/CHANGELOG.md)



## <small>4.0.4 (2023-01-03)</small>

* fix: importmap should insert before module preload link (#11492) ([25c64d7](https://github.com/vitejs/vite/commit/25c64d7ec206fc39e5f0b6e691605fed1cf91fdc)), closes [#11492](https://github.com/vitejs/vite/issues/11492)
* fix: server.host with ipv6 missed [] (fix #11466) (#11509) ([2c38bae](https://github.com/vitejs/vite/commit/2c38bae9458794d42eebd7f7351f5633e2fe8247)), closes [#11466](https://github.com/vitejs/vite/issues/11466) [#11509](https://github.com/vitejs/vite/issues/11509)
* fix: stop considering parent URLs as public file (#11145) ([568a014](https://github.com/vitejs/vite/commit/568a0146b46f5cbaa52b3509f757b23364471197)), closes [#11145](https://github.com/vitejs/vite/issues/11145)
* fix(build): invalidate chunk hash when css changed (#11475) ([7a97a04](https://github.com/vitejs/vite/commit/7a97a04b2a39e2c50aff8fe4ef3ca2e82fca6184)), closes [#11475](https://github.com/vitejs/vite/issues/11475)
* fix(cli): ctrl+C no longer kills processes (#11434) (#11518) ([718fc1d](https://github.com/vitejs/vite/commit/718fc1d087745efe227cc20817756e0129b330f1)), closes [#11434](https://github.com/vitejs/vite/issues/11434) [#11518](https://github.com/vitejs/vite/issues/11518)
* fix(cli): revert ctrl+C no longer kills processes (#11434) (#11518) (#11562) ([3748acb](https://github.com/vitejs/vite/commit/3748acb3c4a691fad0ec2d23ace04b608ae971f7)), closes [#11434](https://github.com/vitejs/vite/issues/11434) [#11518](https://github.com/vitejs/vite/issues/11518) [#11562](https://github.com/vitejs/vite/issues/11562)
* fix(optimizer): check .vite/deps directory existence before removing (#11499) ([1b043f9](https://github.com/vitejs/vite/commit/1b043f9865c1012480478fc09cc6e35b03329031)), closes [#11499](https://github.com/vitejs/vite/issues/11499)
* fix(ssr): emit js sourcemaps for ssr builds (#11343) ([f12a1ab](https://github.com/vitejs/vite/commit/f12a1ab9fe6d45aa3652fef4eb777b1f72207dce)), closes [#11343](https://github.com/vitejs/vite/issues/11343)
* chore: update license (#11476) ([3d346c0](https://github.com/vitejs/vite/commit/3d346c032e070514482ca4f977a244805481d309)), closes [#11476](https://github.com/vitejs/vite/issues/11476)
* chore(deps): update dependency @rollup/plugin-json to v6 (#11553) ([3647d07](https://github.com/vitejs/vite/commit/3647d07f734c1ce49a8a5cffec81c8dc91992ec7)), closes [#11553](https://github.com/vitejs/vite/issues/11553)



## <small>4.0.3 (2022-12-21)</small>

* chore(deps): update dependency @rollup/plugin-commonjs to v24 (#11420) ([241db16](https://github.com/vitejs/vite/commit/241db167b36f5b07b9072b62d9abdaae47178f84)), closes [#11420](https://github.com/vitejs/vite/issues/11420)
* chore(typo): fix typo (#11445) ([ed80ea5](https://github.com/vitejs/vite/commit/ed80ea5d9ccfe1d83639e0fc7e9fc9d463a0013e)), closes [#11445](https://github.com/vitejs/vite/issues/11445)
* fix(ssr): ignore module exports condition (#11409) ([d3c9c0b](https://github.com/vitejs/vite/commit/d3c9c0b7c186c4415e8b347aebb5dd6942b0625a)), closes [#11409](https://github.com/vitejs/vite/issues/11409)
* feat: allow import.meta.hot define override (#8944) ([857d578](https://github.com/vitejs/vite/commit/857d578191a8033c0054e7e7ba5ea2a6e70e843a)), closes [#8944](https://github.com/vitejs/vite/issues/8944)



## <small>4.0.2 (2022-12-18)</small>

* fix: fix the error message in the `toOutputFilePathWithoutRuntime` function (#11367) ([8820f75](https://github.com/vitejs/vite/commit/8820f75cc38c5cd47806bd1c118c4ed7e8d8bee6)), closes [#11367](https://github.com/vitejs/vite/issues/11367)
* fix: make `vite optimize` prebundle for dev (#11387) ([b4ced0f](https://github.com/vitejs/vite/commit/b4ced0f90ec17bc3772f3297ef5cd2b61769a37a)), closes [#11387](https://github.com/vitejs/vite/issues/11387)
* fix: revert #11290 (#11412) ([6587d2f](https://github.com/vitejs/vite/commit/6587d2f2b17c87affa7079612ff1bd7d7be23cf8)), closes [#11290](https://github.com/vitejs/vite/issues/11290) [#11412](https://github.com/vitejs/vite/issues/11412)
* fix: server and preview open fails to add slash before relative path (#11394) ([57276b7](https://github.com/vitejs/vite/commit/57276b723749e647b81f0a67c8c7b69303f95cf7)), closes [#11394](https://github.com/vitejs/vite/issues/11394)
* fix: skip applescript when no Chromium browser found (fixes #11205) (#11406) ([274d1f3](https://github.com/vitejs/vite/commit/274d1f344ae68758da6ad029eef3c06c9f79228d)), closes [#11205](https://github.com/vitejs/vite/issues/11205) [#11406](https://github.com/vitejs/vite/issues/11406)
* fix(deps): update dependency ufo to v1 (#11372) ([4288300](https://github.com/vitejs/vite/commit/4288300e61716f233a24e84f303b4292c511be9e)), closes [#11372](https://github.com/vitejs/vite/issues/11372)
* chore: typecheck create-vite (#11295) ([af86e5b](https://github.com/vitejs/vite/commit/af86e5bcfe4b78f486f499cba09c3270fb151d54)), closes [#11295](https://github.com/vitejs/vite/issues/11295)
* chore(deps): update dependency convert-source-map to v2 (#10548) ([8dc6528](https://github.com/vitejs/vite/commit/8dc65288cd47b72fbf3fd7c804b1405591f66a34)), closes [#10548](https://github.com/vitejs/vite/issues/10548)
* chore(deps): update dependency mlly to v1 (#11370) ([9662d4d](https://github.com/vitejs/vite/commit/9662d4d902bffb891e1d626fd1e42493273f50c4)), closes [#11370](https://github.com/vitejs/vite/issues/11370)



## <small>4.0.1 (2022-12-12)</small>

* feat: show server url by pressing `u` (#11319) ([8c0bb7b](https://github.com/vitejs/vite/commit/8c0bb7b77ba4ff3680d8c6d8675f7d8d4a7b2b08)), closes [#11319](https://github.com/vitejs/vite/issues/11319)
* feat(html): clickable error position for html parse error (#11334) ([2e15f3d](https://github.com/vitejs/vite/commit/2e15f3d5988b142ea651853486324a0c095ff087)), closes [#11334](https://github.com/vitejs/vite/issues/11334)
* fix: ?inline warning for .css.js file (#11347) ([729fb1a](https://github.com/vitejs/vite/commit/729fb1a750f30e0244ce5aab76abdc9d89e3e9fd)), closes [#11347](https://github.com/vitejs/vite/issues/11347)
* fix: check if build exists so preview doesn't show 404s due to nonexistent build (#10564) ([0a1db8c](https://github.com/vitejs/vite/commit/0a1db8c14750b1dc8dc0f4a2576be80cec66154d)), closes [#10564](https://github.com/vitejs/vite/issues/10564)
* fix: derive `useDefineForClassFields` value from `tsconfig.compilerOptions.target` (fixes #10296) (# ([42976d8](https://github.com/vitejs/vite/commit/42976d85afff0506f56fb3faf7d729ad186bbec4)), closes [#10296](https://github.com/vitejs/vite/issues/10296) [#11301](https://github.com/vitejs/vite/issues/11301)
* fix: preview fallback (#11312) ([cfedf9c](https://github.com/vitejs/vite/commit/cfedf9c3ad32035939743b58561cba507659e98f)), closes [#11312](https://github.com/vitejs/vite/issues/11312)
* fix: respect base when using `/__open-in-editor` (#11337) ([8856c2e](https://github.com/vitejs/vite/commit/8856c2e42de86d27122a34c3e2dbed4d351b4e24)), closes [#11337](https://github.com/vitejs/vite/issues/11337)
* fix: wrongly resolve to optimized doppelganger (#11290) ([34fec41](https://github.com/vitejs/vite/commit/34fec4158bc289928467c6c0a854fc0f4527cf39)), closes [#11290](https://github.com/vitejs/vite/issues/11290)
* fix(env): test NODE_ENV override before expand (#11309) ([d0a9281](https://github.com/vitejs/vite/commit/d0a9281ea3eb257f65e49071739228dabde32982)), closes [#11309](https://github.com/vitejs/vite/issues/11309)
* fix(preview): Revert #10564 - throw Error on missing outDir (#11335) ([3aaa0ea](https://github.com/vitejs/vite/commit/3aaa0ea502d609b22258aa65de088eda108f19b9)), closes [#10564](https://github.com/vitejs/vite/issues/10564) [#11335](https://github.com/vitejs/vite/issues/11335) [#10564](https://github.com/vitejs/vite/issues/10564)
* docs: fix banner image in CHANGELOG.md (#11336) ([45b66f4](https://github.com/vitejs/vite/commit/45b66f4838487f8a392a6d0243d058ae702c3023)), closes [#11336](https://github.com/vitejs/vite/issues/11336)
* chore: enable `@typescript-eslint/ban-ts-comment` (#11326) ([e58a4f0](https://github.com/vitejs/vite/commit/e58a4f00e201e9c0d43ddda51ccac7b612d58650)), closes [#11326](https://github.com/vitejs/vite/issues/11326)
* chore: fix format (#11311) ([9c2b1c0](https://github.com/vitejs/vite/commit/9c2b1c01df69d7753c620d668f5866b5db6b8451)), closes [#11311](https://github.com/vitejs/vite/issues/11311)
* chore: update changelog release notes for 4.0 (#11285) ([83abd37](https://github.com/vitejs/vite/commit/83abd37f6b4d398a699db0edd43f5142a2d29230)), closes [#11285](https://github.com/vitejs/vite/issues/11285)
* chore(deps): update all non-major dependencies (#11321) ([dcc0004](https://github.com/vitejs/vite/commit/dcc0004ceb7a76e6d0cbae8b84a103a15f80049b)), closes [#11321](https://github.com/vitejs/vite/issues/11321)
* chore(esbuild): add test for configuration overrides (#11267) ([f897b64](https://github.com/vitejs/vite/commit/f897b64715b6979aa08d0d92b6a2cb5f30085484)), closes [#11267](https://github.com/vitejs/vite/issues/11267)



## 4.0.0 (2022-12-09)

![Vite 4 Announcement Cover Image](https://vite.dev/og-image-announcing-vite4.png)

Read the announcement blog post: [Announcing Vite 4](https://vite.dev/blog/announcing-vite4)

Quick links:

- [Docs](https://vite.dev)
- [Migration Guide](https://vite.dev/guide/migration)

Docs in other languages:

- [简体中文](https://cn.vite.dev/)
- [日本語](https://ja.vite.dev/)
- [Español](https://es.vite.dev/)

### Main Changes

This major is smaller in scope compared to Vite 3, with the main objective of upgrading to Rollup 3. We've worked with the ecosystem to ensure a smooth upgrade path for this new major.

#### Rollup 3

Vite is now using [Rollup 3](https://github.com/vitejs/vite/issues/9870), which allowed us to simplify Vite's internal asset handling and has many improvements. See the [Rollup 3 release notes here](https://github.com/rollup/rollup/releases).

#### Framework Plugins out of the Vite core monorepo

[`@vitejs/plugin-vue`](https://github.com/vitejs/vite-plugin-vue) and [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react) have been part of Vite core monorepo since the first versions of Vite. This helped us to get a close feedback loop when making changes as we were getting both Core and the plugins tested and released together. With [vite-ecosystem-ci](https://github.com/vitejs/vite-ecosystem-ci) we can get this feedback with these plugins developed on independent repositories, so from Vite 4, [they have been moved out of the Vite core monorepo](https://github.com/vitejs/vite/pull/11158). This is meaningful for Vite's framework-agnostic story, and will allow us to build independent teams to maintain each of the plugins. If you have bugs to report or features to request, please create issues on the new repositories moving forward: [`vitejs/vite-plugin-vue`](https://github.com/vitejs/vite-plugin-vue) and [`vitejs/vite-plugin-react`](https://github.com/vitejs/vite-plugin-react).

#### New React plugin using SWC during development

[SWC](https://swc.rs/) is now a mature replacement for [Babel](https://babeljs.io/), especially in the context of React projects. SWC's React Fast Refresh implementation is a lot faster than Babel, and for some projects, it is now a better alternative. From Vite 4, two plugins are available for React projects with different tradeoffs. We believe that both approaches are worth supporting at this point, and we'll continue to explore improvements to both plugins in the future.

##### @vitejs/plugin-react

[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) is a plugin that uses esbuild and Babel, achieving fast HMR with a small package footprint and the flexibility of being able to use the babel transform pipeline.

##### @vitejs/plugin-react-swc (new)

[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) is a new plugin that uses esbuild during build, but replaces Babel with SWC during development. For big projects that don't require non-standard React extensions, cold start and Hot Module Replacement (HMR) can be significantly faster.

#### Compatibility

The modern browser build now targets `safari14` by default for wider ES2020 compatibility (https://github.com/vitejs/vite/issues/9063). This means that modern builds can now use [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) and that the [nullish coallessing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) isn't transpiled anymore. If you need to support older browsers, you can add [`@vitejs/plugin-legacy`](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) as usual.

#### Importing CSS as a string

In Vite 3, importing the default export of a `.css` file could introduce a double loading of CSS.

```ts
import cssString from './global.css';
```

This double loading could occur since a `.css` file will be emitted and it's likely that the CSS string will also be used by the application code — for example, injected by the framework runtime. From Vite 4, the `.css` default export [has been deprecated](https://github.com/vitejs/vite/issues/11094). The `?inline` query suffix modifier needs to be used in this case, as that doesn't emit the imported `.css` styles.

```ts
import stuff from './global.css?inline'
```

#### Other features

* Support for patch-package when pre bundling dependencies ([#10286](https://github.com/vitejs/vite/issues/10286))
* Cleaner build logs output ([#10895](https://github.com/vitejs/vite/issues/10895)) and switch to `kB` to align with browser dev tools ([#10982](https://github.com/vitejs/vite/issues/10982))
* Improved error messages during SSR ([#11156](https://github.com/vitejs/vite/issues/11156))


### Features

* feat: add CLI keyboard shortcuts (#11228) ([87973f1](https://github.com/vitejs/vite/commit/87973f188e137fc9a182450c6e1ac0e992e25b8b)), closes [#11228](https://github.com/vitejs/vite/issues/11228)
* feat: export error message generator (#11155) ([493ba1e](https://github.com/vitejs/vite/commit/493ba1ec0268186f4b7abd73328694e031a30688)), closes [#11155](https://github.com/vitejs/vite/issues/11155)
* feat(node/plugins): esbuild options (#11049) ([735b98b](https://github.com/vitejs/vite/commit/735b98bcd092c89cafeb6af40e10855426b181db)), closes [#11049](https://github.com/vitejs/vite/issues/11049)
* feat: improve the error message of `expand` (#11141) ([825c793](https://github.com/vitejs/vite/commit/825c7939efc4bd7fad05cc767d76c65d152d680d)), closes [#11141](https://github.com/vitejs/vite/issues/11141)
* feat: update @types/node to v18 (#11195) ([4ec9f53](https://github.com/vitejs/vite/commit/4ec9f53d6fd5b896eeb242ef4bf48c8723318af4)), closes [#11195](https://github.com/vitejs/vite/issues/11195)
* feat(client)!: remove never implemented hot.decline (#11036) ([e257e3b](https://github.com/vitejs/vite/commit/e257e3b7fa48427aa30450d5a9b0e13151df5f12)), closes [#11036](https://github.com/vitejs/vite/issues/11036)
* feat!: support `safari14` by default for wider ES2020 compatibility (#9063) ([3cc65d7](https://github.com/vitejs/vite/commit/3cc65d701d11994cb5594b223e23f5d1e549305a)), closes [#9063](https://github.com/vitejs/vite/issues/9063)
* feat!: support multiline values in env files (#10826) ([606e60d](https://github.com/vitejs/vite/commit/606e60d591646dfd9d8bf123e1dbf91891c1854a)), closes [#10826](https://github.com/vitejs/vite/issues/10826)
* feat(ssr)!: remove dedupe and mode support for CJS (#11101) ([3090564](https://github.com/vitejs/vite/commit/3090564616f20cec865a469466e69295a50cdae6)), closes [#11101](https://github.com/vitejs/vite/issues/11101)
* feat: align object interface for `transformIndexHtml` hook (#9669) ([1db52bf](https://github.com/vitejs/vite/commit/1db52bfbe87219fd045b96921766336c2528f429)), closes [#9669](https://github.com/vitejs/vite/issues/9669)
* feat(build): cleaner logs output (#10895) ([7d24b5f](https://github.com/vitejs/vite/commit/7d24b5f56697f6ec6e6facbe8601d3f993b764c8)), closes [#10895](https://github.com/vitejs/vite/issues/10895)
* feat(css): deprecate css default export (#11094) ([01dee1b](https://github.com/vitejs/vite/commit/01dee1bc71b004c7b535f247550ba491211bd61e)), closes [#11094](https://github.com/vitejs/vite/issues/11094)
* feat(optimizer): support patch-package (#10286) ([4fb7ad0](https://github.com/vitejs/vite/commit/4fb7ad0e133311b55016698ece01fad9fb59ce11)), closes [#10286](https://github.com/vitejs/vite/issues/10286)
* feat(build): Use kB in build reporter (#10982) ([b57acfa](https://github.com/vitejs/vite/commit/b57acfa6112755f66dea7b920efe96f207eab71b)), closes [#10982](https://github.com/vitejs/vite/issues/10982)
* feat(css): upgrade postcss-modules (#10987) ([892916d](https://github.com/vitejs/vite/commit/892916d040a035edde1add93c192e0b0c5c9dd86)), closes [#10987](https://github.com/vitejs/vite/issues/10987)
* feat(hmr): invalidate message (#10946) ([0d73473](https://github.com/vitejs/vite/commit/0d734732dac890cf0c6c784510059f66005a64b0)), closes [#10946](https://github.com/vitejs/vite/issues/10946)
* feat(client): expose hot.prune API (#11016) ([f40c18d](https://github.com/vitejs/vite/commit/f40c18dfe083a5cc6e57b10a518f8d9df007c3ac)), closes [#11016](https://github.com/vitejs/vite/issues/11016)
* feat(hmr): deduplicate paths and join them with commas (#10891) ([967299a](https://github.com/vitejs/vite/commit/967299a1eccb267197c19b76fe1e970e9b6cbbba)), closes [#10891](https://github.com/vitejs/vite/issues/10891)
* feat: base without trailing slash (#10723) ([8f87282](https://github.com/vitejs/vite/commit/8f87282eaacd89d8c2c1c58f2db5c831f1468408)), closes [#10723](https://github.com/vitejs/vite/issues/10723)
* feat: handle static assets in case-sensitive manner (#10475) ([c1368c3](https://github.com/vitejs/vite/commit/c1368c34e5e1e472df36449c9ee5c72072aa64f5)), closes [#10475](https://github.com/vitejs/vite/issues/10475)
* feat(cli): build --profile (#10719) ([9c808cd](https://github.com/vitejs/vite/commit/9c808cdec89b807bff33eef37dfbb03557291ec1)), closes [#10719](https://github.com/vitejs/vite/issues/10719)
* feat(env): support dotenv-expand to contains process env (#10370) ([d5fe92c](https://github.com/vitejs/vite/commit/d5fe92cd2a0be2b8636e876a81a63921a808afb2)), closes [#10370](https://github.com/vitejs/vite/issues/10370)
* feat!: set esbuild default charset to utf8 (#10753) ([4caf4b6](https://github.com/vitejs/vite/commit/4caf4b69376608091c0a8f45ec0cc3f568313253)), closes [#10753](https://github.com/vitejs/vite/issues/10753)
* feat: rollup 3 (#9870) ([beb7166](https://github.com/vitejs/vite/commit/beb716695d5dd11fd9f3d7350c1c807dfa37a216)), closes [#9870](https://github.com/vitejs/vite/issues/9870)


### Bug Fixes

* fix: add `\0` to virtual files id (#11261) ([02cdfa9](https://github.com/vitejs/vite/commit/02cdfa9a2c15b448c9748551e48070d2a9409d09)), closes [#11261](https://github.com/vitejs/vite/issues/11261)
* fix: skip shortcuts on non-tty stdin (#11263) ([9602686](https://github.com/vitejs/vite/commit/9602686cc325b572bdcf158890c7558f25cec62d)), closes [#11263](https://github.com/vitejs/vite/issues/11263)
* fix(ssr): skip rewriting stack trace if it's already rewritten (fixes #11037) (#11070) ([feb8ce0](https://github.com/vitejs/vite/commit/feb8ce05bf2c07f9ea1c6facc75248d2c0e995b8)), closes [#11037](https://github.com/vitejs/vite/issues/11037) [#11070](https://github.com/vitejs/vite/issues/11070)
* refactor(optimizer): await depsOptimizer.scanProcessing (#11251) ([fa64c8e](https://github.com/vitejs/vite/commit/fa64c8e9cff72797afa148e998f3cdc6274e6743)), closes [#11251](https://github.com/vitejs/vite/issues/11251)
* fix: improve CLI shortcuts help display (#11247) ([bb235b2](https://github.com/vitejs/vite/commit/bb235b21a432dd503758add9148134e8acbd21ad)), closes [#11247](https://github.com/vitejs/vite/issues/11247)
* fix: less promises for scanning and await with allSettled (#11245) ([45b170e](https://github.com/vitejs/vite/commit/45b170ed88d3cdf59d3da6f82738d06c149fd3a7)), closes [#11245](https://github.com/vitejs/vite/issues/11245)
* fix(optimizer): escape entrypoints when running scanner (#11250) ([b61894e](https://github.com/vitejs/vite/commit/b61894e3d230657358fdce93c0d8208a3dc25371)), closes [#11250](https://github.com/vitejs/vite/issues/11250)
* fix: await scanner (#11242) ([52a6732](https://github.com/vitejs/vite/commit/52a6732482398db97517e62e1ba05fe350da6108)), closes [#11242](https://github.com/vitejs/vite/issues/11242)
* fix(css): fix css lang regex (#11237) ([a55d0b3](https://github.com/vitejs/vite/commit/a55d0b34400e3360c4100d05e422ae9cf10fa07b)), closes [#11237](https://github.com/vitejs/vite/issues/11237)
* fix: don't print urls on restart with default port (#11230) ([5aaecb6](https://github.com/vitejs/vite/commit/5aaecb66049e514d6a428491b2de1142e5ddf7c6)), closes [#11230](https://github.com/vitejs/vite/issues/11230)
* fix: serialize bundleWorkerEntry (#11218) ([306bed0](https://github.com/vitejs/vite/commit/306bed03a304fa0db8d59581943f7774d9b39311)), closes [#11218](https://github.com/vitejs/vite/issues/11218)
* fix(config): resolve dynamic import as esm (#11220) ([f8c1ed0](https://github.com/vitejs/vite/commit/f8c1ed0234f1db39881170aded78fdc5e4e8e2f6)), closes [#11220](https://github.com/vitejs/vite/issues/11220)
* fix(env): prevent env expand on process.env (#11213) ([d4a1e2b](https://github.com/vitejs/vite/commit/d4a1e2b65b67c54ce21b094ac8ae914fd3269031)), closes [#11213](https://github.com/vitejs/vite/issues/11213)
* fix: add type for function localsConvention value (#11152) ([c9274b4](https://github.com/vitejs/vite/commit/c9274b4184528f1cfb250f9928a4d5bdbb25bb10)), closes [#11152](https://github.com/vitejs/vite/issues/11152)
* fix: cacheDir should be ignored from watch (#10242) ([75dbca2](https://github.com/vitejs/vite/commit/75dbca2789b0aca0729f74b0e69ed5a9c08eb1df)), closes [#10242](https://github.com/vitejs/vite/issues/10242)
* fix: don't check .yarn/patches for computing dependencies hash (#11168) ([65bcccf](https://github.com/vitejs/vite/commit/65bcccfe9fa2f637962f6fc595375fbca3409adb)), closes [#11168](https://github.com/vitejs/vite/issues/11168)
* fix: formatError() outside rollup context (#11156) ([2aee2eb](https://github.com/vitejs/vite/commit/2aee2ebb5d01386f919d9dc2fee3a56d75277d15)), closes [#11156](https://github.com/vitejs/vite/issues/11156)
* fix: Revert "fix: missing js sourcemaps with rewritten imports broke debugging (#7767) (#9476)" (#11 ([fdc6f3a](https://github.com/vitejs/vite/commit/fdc6f3ac008b9f9c2fa99cc104a767fa51e4f95d)), closes [#7767](https://github.com/vitejs/vite/issues/7767) [#9476](https://github.com/vitejs/vite/issues/9476) [#11144](https://github.com/vitejs/vite/issues/11144)
* fix: Dev SSR dep optimization + respect optimizeDeps.include (#11123) ([515caa5](https://github.com/vitejs/vite/commit/515caa5b42aa1ef43b4b7c20791240ecc001175d)), closes [#11123](https://github.com/vitejs/vite/issues/11123)
* fix: export preprocessCSS in CJS (#11067) ([793255d](https://github.com/vitejs/vite/commit/793255d0ba60cd8638ddcd36743d2edd217f0ebe)), closes [#11067](https://github.com/vitejs/vite/issues/11067)
* fix: glob import parsing (#10949) (#11056) ([ac2cfd6](https://github.com/vitejs/vite/commit/ac2cfd6eac4ca7c7cbc4c760f2ff40f61a4ae50e)), closes [#10949](https://github.com/vitejs/vite/issues/10949) [#11056](https://github.com/vitejs/vite/issues/11056)
* fix: import.meta.env and process.env undefined variable replacement (fix #8663) (#10958) ([3e0cd3d](https://github.com/vitejs/vite/commit/3e0cd3d98e612de4bd21125d151dbb14f35a64f0)), closes [#8663](https://github.com/vitejs/vite/issues/8663) [#10958](https://github.com/vitejs/vite/issues/10958)
* fix: missing js sourcemaps with rewritten imports broke debugging (#7767) (#9476) ([3fa96f6](https://github.com/vitejs/vite/commit/3fa96f6a7dac361773c6050cc63db5644207b6ef)), closes [#7767](https://github.com/vitejs/vite/issues/7767) [#9476](https://github.com/vitejs/vite/issues/9476)
* fix: preserve default export from externalized packages (fixes #10258) (#10406) ([88b001b](https://github.com/vitejs/vite/commit/88b001bc08fbf68ac5699f31479197c08c0a57d5)), closes [#10258](https://github.com/vitejs/vite/issues/10258) [#10406](https://github.com/vitejs/vite/issues/10406)
* fix: reset global regex before match (#11132) ([db8df14](https://github.com/vitejs/vite/commit/db8df14d8934f11fa64e8b33e376f816b3b16f15)), closes [#11132](https://github.com/vitejs/vite/issues/11132)
* fix(css): handle environment with browser globals (#11079) ([e92d025](https://github.com/vitejs/vite/commit/e92d025cedabb477687d6a352ee8c9b7d529f623)), closes [#11079](https://github.com/vitejs/vite/issues/11079)
* fix(deps): update all non-major dependencies (#11091) ([073a4bf](https://github.com/vitejs/vite/commit/073a4bfe2642a4dda2183a9dfecac864524893e1)), closes [#11091](https://github.com/vitejs/vite/issues/11091)
* fix(esbuild): handle inline sourcemap option (#11120) ([4c85c0a](https://github.com/vitejs/vite/commit/4c85c0a4e1abdddd57887726eb8dda1efff934e9)), closes [#11120](https://github.com/vitejs/vite/issues/11120)
* fix(importGlob): don't warn when CSS default import is not used (#11121) ([97f8b4d](https://github.com/vitejs/vite/commit/97f8b4df3c9eb817ab2669e5c10b700802eec900)), closes [#11121](https://github.com/vitejs/vite/issues/11121)
* fix(importGlob): preserve line count for sourcemap (#11122) ([14980a1](https://github.com/vitejs/vite/commit/14980a14efd066ac164513498b37ad328e51de5c)), closes [#11122](https://github.com/vitejs/vite/issues/11122)
* fix(importGlob): warn on default import css (#11103) ([fc0d9e3](https://github.com/vitejs/vite/commit/fc0d9e35f7235a38ef37de3437d362f08dac0ca8)), closes [#11103](https://github.com/vitejs/vite/issues/11103)
* fix(plugin-vue): support scss/sass/less... hmr on custom template languages (fix #10677) (#10844) ([d413848](https://github.com/vitejs/vite/commit/d413848afcec0dcce998f2f33f341f0e620addfa)), closes [#10677](https://github.com/vitejs/vite/issues/10677) [#10844](https://github.com/vitejs/vite/issues/10844)
* fix(ssr): preserve require for external node (#11057) ([1ec0176](https://github.com/vitejs/vite/commit/1ec017670f0f756c86485739fb14ed2e57bf2193)), closes [#11057](https://github.com/vitejs/vite/issues/11057)
* fix(worker): disable build reporter plugin when bundling worker (#11058) ([7b72069](https://github.com/vitejs/vite/commit/7b7206951fb93ea7e2555c0bb152be8c85220f30)), closes [#11058](https://github.com/vitejs/vite/issues/11058)
* fix!: make `NODE_ENV` more predictable (#10996) ([8148af7](https://github.com/vitejs/vite/commit/8148af7b80894d1597333be40b3ef0ec053c7652)), closes [#10996](https://github.com/vitejs/vite/issues/10996)
* fix(config)!: support development build (#11045) ([8b3d656](https://github.com/vitejs/vite/commit/8b3d656b1deee8259e64b25b7b0521297b83e770)), closes [#11045](https://github.com/vitejs/vite/issues/11045)
* refactor: use function to eval worker and glob options (#10999) ([f4c1264](https://github.com/vitejs/vite/commit/f4c12642ff4a7dbb1f2fa431b998d09cf2d6b33c)), closes [#10999](https://github.com/vitejs/vite/issues/10999)
* refactor(client): simplify fetchUpdate code (#11004) ([f777b55](https://github.com/vitejs/vite/commit/f777b55a63d83eb13a54385b7de442649bc8e94a)), closes [#11004](https://github.com/vitejs/vite/issues/11004)
* fix(html): transform relative path with long base in /index.html (#10990) ([752740c](https://github.com/vitejs/vite/commit/752740c499d6144a80acf0c640746052f12c915e)), closes [#10990](https://github.com/vitejs/vite/issues/10990)
* fix(mpa): support mpa fallback (#10985) ([61165f0](https://github.com/vitejs/vite/commit/61165f0d8eed88f6f9f1474515bb10b1b9250b59)), closes [#10985](https://github.com/vitejs/vite/issues/10985)
* feat: align default chunk and asset file names with rollup (#10927) ([cc2adb3](https://github.com/vitejs/vite/commit/cc2adb39254d6de139bc3dfad976430c03250b27)), closes [#10927](https://github.com/vitejs/vite/issues/10927)
* fix: make `addWatchFile()` work (fix #7024) (#9723) ([34db08b](https://github.com/vitejs/vite/commit/34db08bb8aab61f63432122afdc9762a181b1fda)), closes [#7024](https://github.com/vitejs/vite/issues/7024) [#9723](https://github.com/vitejs/vite/issues/9723)
* fix(config): exclude config.assetsInclude empty array (#10941) ([18c71dc](https://github.com/vitejs/vite/commit/18c71dcd2556ca395bd67ca7c720c1a435268332)), closes [#10941](https://github.com/vitejs/vite/issues/10941)
* fix(ssr): skip optional peer dep resolve (#10593) ([0a69985](https://github.com/vitejs/vite/commit/0a699856b248116632c1ac18515c0a5c7cf3d1db)), closes [#10593](https://github.com/vitejs/vite/issues/10593)
* perf: regexp perf issues, refactor regexp stylistic issues (#10905) ([fc007df](https://github.com/vitejs/vite/commit/fc007dfba2e0392bd29f7e6e2663ca910ed18a6b)), closes [#10905](https://github.com/vitejs/vite/issues/10905)
* refactor: move CSS emitFile logic closer to rollup (#10909) ([92a206b](https://github.com/vitejs/vite/commit/92a206beacfdc7882cb5d8e14a4cdbb1cef82818)), closes [#10909](https://github.com/vitejs/vite/issues/10909)
* refactor: use rollup hashing when emitting assets (#10878) ([78c77be](https://github.com/vitejs/vite/commit/78c77beb5bf6112588581c0cbb47bc4d3bfed681)), closes [#10878](https://github.com/vitejs/vite/issues/10878)
* fix: don't throw on malformed URLs (#10901) ([feb9b10](https://github.com/vitejs/vite/commit/feb9b107960f8785b8e302b01ade29de8957d9cf)), closes [#10901](https://github.com/vitejs/vite/issues/10901)
* fix: gracefully handle forbidden filesystem access (#10793) ([92637a2](https://github.com/vitejs/vite/commit/92637a26a07e845249cb8e9a6b368cbecea0c0f6)), closes [#10793](https://github.com/vitejs/vite/issues/10793)
* fix(types): remove `null` from `CSSModulesOptions.localsConvention` (#10904) ([a9978dd](https://github.com/vitejs/vite/commit/a9978ddcb6382df96f1c3d3bcd00bf6105934de5)), closes [#10904](https://github.com/vitejs/vite/issues/10904)
* refactor(types)!: remove facade type files (#10903) ([a309058](https://github.com/vitejs/vite/commit/a3090586a7d621a7d1adc448a87d1b99ae7bbe14)), closes [#10903](https://github.com/vitejs/vite/issues/10903)
* fix: inconsistent handling of non-ASCII `base` in `resolveConfig` and dev server (#10247) ([16e4123](https://github.com/vitejs/vite/commit/16e41234d5de6e38759c7c1547cc971f133eb85b)), closes [#10247](https://github.com/vitejs/vite/issues/10247)
* fix: prevent cache on optional package resolve (#10812) ([c599a2e](https://github.com/vitejs/vite/commit/c599a2e6433343d6bdf3533a49517cd5b27633e2)), closes [#10812](https://github.com/vitejs/vite/issues/10812)
* fix: relocated logger to respect config. (#10787) ([52e64eb](https://github.com/vitejs/vite/commit/52e64eb43287d241f3fd547c332e16bd9e301e95)), closes [#10787](https://github.com/vitejs/vite/issues/10787)
* fix: throw missing name error only when 'umd' or 'iife' are used (#9886) ([b8aa825](https://github.com/vitejs/vite/commit/b8aa825e4d92c93f6f72ee292ed19573bee9025e)), closes [#9886](https://github.com/vitejs/vite/issues/9886)
* fix(deps): update all non-major dependencies (#10804) ([f686afa](https://github.com/vitejs/vite/commit/f686afa6d3bc0f501b936dcbc2c4552c865fa3f9)), closes [#10804](https://github.com/vitejs/vite/issues/10804)
* fix(ssr): improve missing file error (#10880) ([5451a34](https://github.com/vitejs/vite/commit/5451a34fe52df7b20fe69878d2caa34d82821ee0)), closes [#10880](https://github.com/vitejs/vite/issues/10880)


### Previous Changelogs


#### [4.0.0-beta.7](https://github.com/vitejs/vite/compare/v4.0.0-beta.6...v4.0.0-beta.7) (2022-12-08)

See [4.0.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.6](https://github.com/vitejs/vite/compare/v4.0.0-beta.5...v4.0.0-beta.6) (2022-12-08)

See [4.0.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.5](https://github.com/vitejs/vite/compare/v4.0.0-beta.4...v4.0.0-beta.5) (2022-12-08)

See [4.0.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.4](https://github.com/vitejs/vite/compare/v4.0.0-beta.3...v4.0.0-beta.4) (2022-12-07)

See [4.0.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.3](https://github.com/vitejs/vite/compare/v4.0.0-beta.2...v4.0.0-beta.3) (2022-12-07)

See [4.0.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.2](https://github.com/vitejs/vite/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2022-12-07)

See [4.0.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.1](https://github.com/vitejs/vite/compare/v4.0.0-beta.0...v4.0.0-beta.1) (2022-12-06)

See [4.0.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.0](https://github.com/vitejs/vite/compare/v4.0.0-alpha.6...v4.0.0-beta.0) (2022-12-05)

See [4.0.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.6](https://github.com/vitejs/vite/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-11-30)

See [4.0.0-alpha.6 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.6/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.5](https://github.com/vitejs/vite/compare/v4.0.0-alpha.5...v4.0.0-alpha.5) (2022-11-22)

See [4.0.0-alpha.5 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.5/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.4](https://github.com/vitejs/vite/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2022-11-17)

See [4.0.0-alpha.4 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.4/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.3](https://github.com/vitejs/vite/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2022-11-15)

See [4.0.0-alpha.3 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.3/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.2](https://github.com/vitejs/vite/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2022-11-13)

See [4.0.0-alpha.2 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.2/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.1](https://github.com/vitejs/vite/compare/v4.0.0-alpha.0...v4.0.0-alpha.1) (2022-11-12)

See [4.0.0-alpha.1 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.1/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.0](https://github.com/vitejs/vite/compare/v3.2.5...v4.0.0-alpha.0) (2022-11-07)

See [4.0.0-alpha.0 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.0/packages/vite/CHANGELOG.md)



## <small>3.2.6 (2023-04-18)</small>

 * fix: escape msg in render restricted error html, backport (#12889) (#12892) ([b48ac2a](https://github.com/vitejs/vite/commit/b48ac2a61891c3135639546708d65e5348c566fe)), closes [#12889](https://github.com/vitejs/vite/issues/12889) [#12892](https://github.com/vitejs/vite/issues/12892)



## <small>3.2.5 (2022-12-05)</small>

* chore: cherry pick more v4 bug fixes to v3 (#11189) ([eba9b42](https://github.com/vitejs/vite/commit/eba9b423ff92c01e52b5e73a69eeded3b608293d)), closes [#11189](https://github.com/vitejs/vite/issues/11189) [#10949](https://github.com/vitejs/vite/issues/10949) [#11056](https://github.com/vitejs/vite/issues/11056) [#8663](https://github.com/vitejs/vite/issues/8663) [#10958](https://github.com/vitejs/vite/issues/10958) [#11120](https://github.com/vitejs/vite/issues/11120) [#11122](https://github.com/vitejs/vite/issues/11122) [#11123](https://github.com/vitejs/vite/issues/11123) [#11132](https://github.com/vitejs/vite/issues/11132)
* chore: cherry pick v4 bug fix to v3 (#11110) ([c93a526](https://github.com/vitejs/vite/commit/c93a5269fb1dab4f9b72e1d6c40e406e5b6aeafd)), closes [#11110](https://github.com/vitejs/vite/issues/11110) [#10941](https://github.com/vitejs/vite/issues/10941) [#10987](https://github.com/vitejs/vite/issues/10987) [#10985](https://github.com/vitejs/vite/issues/10985) [#11067](https://github.com/vitejs/vite/issues/11067)
* fix: relocated logger to respect config. (#10787) (#10967) ([bc3b5a9](https://github.com/vitejs/vite/commit/bc3b5a94499e99885eca5161d97a2eb2666221e0)), closes [#10787](https://github.com/vitejs/vite/issues/10787) [#10967](https://github.com/vitejs/vite/issues/10967)



## <small>3.2.4 (2022-11-15)</small>

* fix: prevent cache on optional package resolve (v3) (#10812) (#10845) ([3ba45b9](https://github.com/vitejs/vite/commit/3ba45b9a19df434b2195e4d5574f80c7426a3ba1)), closes [#10812](https://github.com/vitejs/vite/issues/10812) [#10845](https://github.com/vitejs/vite/issues/10845)
* fix(ssr): skip optional peer dep resolve (v3) (#10593) (#10931) ([7f59dcf](https://github.com/vitejs/vite/commit/7f59dcfae84905f24282329aa10988548c9b91d8)), closes [#10593](https://github.com/vitejs/vite/issues/10593) [#10931](https://github.com/vitejs/vite/issues/10931) [#10593](https://github.com/vitejs/vite/issues/10593)



## <small>3.2.3 (2022-11-07)</small>

* refactor: change style.innerHTML to style.textContent (#10801) ([8ea71b4](https://github.com/vitejs/vite/commit/8ea71b44530af4a23d2c635e6e380d97a84c8919)), closes [#10801](https://github.com/vitejs/vite/issues/10801)
* fix: add `@types/node` as an optional peer dependency (#10757) ([57916a4](https://github.com/vitejs/vite/commit/57916a476924541dd7136065ceee37ae033ca78c)), closes [#10757](https://github.com/vitejs/vite/issues/10757)
* fix: transform import.meta.glob when scan JS/TS #10634 (#10635) ([c53ffec](https://github.com/vitejs/vite/commit/c53ffec3465d2d28d08d29ca61313469e03f5dd6)), closes [#10634](https://github.com/vitejs/vite/issues/10634) [#10635](https://github.com/vitejs/vite/issues/10635)
* fix(css): url() with variable in sass/less (fixes #3644, #7651) (#10741) ([fa2e47f](https://github.com/vitejs/vite/commit/fa2e47fe05eb6b2975d197f817bfcf7c27095f77)), closes [#3644](https://github.com/vitejs/vite/issues/3644) [#7651](https://github.com/vitejs/vite/issues/7651) [#10741](https://github.com/vitejs/vite/issues/10741)
* feat: add `vite:afterUpdate` event (#9810) ([1f57f84](https://github.com/vitejs/vite/commit/1f57f84321c0d30daf8315e63d5a8f30c16635d1)), closes [#9810](https://github.com/vitejs/vite/issues/9810)
* perf: improve `multilineCommentsRE` regex (fix #10689) (#10751) ([51ed059](https://github.com/vitejs/vite/commit/51ed05915ae1fcebacd5bcebca76559a2b8e4473)), closes [#10689](https://github.com/vitejs/vite/issues/10689) [#10751](https://github.com/vitejs/vite/issues/10751)
* perf: Use only one ps exec to find a Chromium browser opened on Mac OS (#10588) ([f199e90](https://github.com/vitejs/vite/commit/f199e90467eea7a18fc57e6cead64f828808d5c8)), closes [#10588](https://github.com/vitejs/vite/issues/10588)
* chore: fix dev build replacing undefined (#10740) ([1358a3c](https://github.com/vitejs/vite/commit/1358a3c75bfa1d6e72aa8d98dd0e1f70662c8056)), closes [#10740](https://github.com/vitejs/vite/issues/10740)
* chore: remove non used type definitions (#10738) ([ee8c7a6](https://github.com/vitejs/vite/commit/ee8c7a6cba88a3de37a801447b440bff928dadd1)), closes [#10738](https://github.com/vitejs/vite/issues/10738)
* chore(deps): update dependency @rollup/plugin-commonjs to v23 (#10611) ([cc4be70](https://github.com/vitejs/vite/commit/cc4be70b7f2dcc7bd780b61ae907e86d047c02b1)), closes [#10611](https://github.com/vitejs/vite/issues/10611)
* chore(deps): update dependency @rollup/plugin-dynamic-import-vars to v2 (#10726) ([326f782](https://github.com/vitejs/vite/commit/326f782fd8a1a916492b9519a3318224ec4af1ff)), closes [#10726](https://github.com/vitejs/vite/issues/10726)



## <small>3.2.2 (2022-10-31)</small>

* chore: remove src/client from package (#10703) ([816842e](https://github.com/vitejs/vite/commit/816842e80e8935a175ef89ffd74c8bd0a9424951)), closes [#10703](https://github.com/vitejs/vite/issues/10703)
* chore(deps): update all non-major dependencies (#10725) ([22cfad8](https://github.com/vitejs/vite/commit/22cfad87c824e717b6c616129f3b579be2e979b2)), closes [#10725](https://github.com/vitejs/vite/issues/10725)
* fix: remove loaded input sourcemap (fixes #8411) (#10705) ([eb50e3a](https://github.com/vitejs/vite/commit/eb50e3a06f038a37eb36771e2789d988c3090b2c)), closes [#8411](https://github.com/vitejs/vite/issues/8411) [#10705](https://github.com/vitejs/vite/issues/10705)
* fix: tsconfig `jsx` overrides esbuild options, reverts #10374 (#10714) ([aacf6a4](https://github.com/vitejs/vite/commit/aacf6a436c10cdba4aae58a74af1f98c8e96d914)), closes [#10374](https://github.com/vitejs/vite/issues/10374) [#10714](https://github.com/vitejs/vite/issues/10714)
* docs(changelog): fix broken url (#10692) ([f937ccc](https://github.com/vitejs/vite/commit/f937ccc2153b57a031bbe0d3a4a74a1fa161e528)), closes [#10692](https://github.com/vitejs/vite/issues/10692)



## <small>3.2.1 (2022-10-28)</small>

* fix: prioritize existing env over .env (fixes #10676) (#10684) ([e2ea6af](https://github.com/vitejs/vite/commit/e2ea6afd47057bac798abb2ae85cc0f529e9ab4d)), closes [#10676](https://github.com/vitejs/vite/issues/10676) [#10684](https://github.com/vitejs/vite/issues/10684)
* fix: remove picomatch type import (fixes #10656) (#10678) ([1128b4d](https://github.com/vitejs/vite/commit/1128b4dcc95bd02ab91f743b8a09265f44323cca)), closes [#10656](https://github.com/vitejs/vite/issues/10656) [#10678](https://github.com/vitejs/vite/issues/10678)
* fix(config): resolve externalized specifier with internal resolver (#10683) ([b15d21c](https://github.com/vitejs/vite/commit/b15d21ca65df8cd06a3139e461e49817dc763325))
* feat: Add support for imba in html scripts (#10679) ([b823fd6](https://github.com/vitejs/vite/commit/b823fd6ce35ccc9c6acd387bbd9bb3a891063c91)), closes [#10679](https://github.com/vitejs/vite/issues/10679)
* chore: join URL segments more safely (#10590) ([675bf07](https://github.com/vitejs/vite/commit/675bf07a093c2af5c928bdd1a8458dc235cc442d)), closes [#10590](https://github.com/vitejs/vite/issues/10590)
* chore: update changelog for 3.2 (#10646) ([f787a60](https://github.com/vitejs/vite/commit/f787a60f46afe856ab0e7b84a32a2d367c1e4fa8)), closes [#10646](https://github.com/vitejs/vite/issues/10646)



## 3.2.0 (2022-10-26)

### Main Changes

#### Multiple Entries for Library Mode

Library mode now supports multiple entries:
```js
  lib: {
    entry: {
        primary: 'src/index.ts',
        secondary: 'src/secondary.ts'
    },
    formats: ['es', 'cjs']
  }
  // => primary.es.js, primary.cjs.js, secondary.es.js, secondary.cjs.js
```
Check out the PR [#7047](https://github.com/vitejs/vite/issues/7047), and the [`build.lib` config docs](https://main.vite.dev/config/build-options.html#build-lib)

#### `build.modulePreload` options

Vite now allows filtering and modifying module preload dependencies for each entry and async chunk. [`experimental.renderBuiltUrl`](https://vite.dev/guide/build.html#advanced-base-options) will also get called for preload asset paths. And `build.modulePreload.resolveDependencies` will be called both for JS dynamic imports preload lists and also for HTML preload lists for chunks imported from entry HTML files. Refer to the PR for more context [#9938](https://github.com/vitejs/vite/issues/9938) and check out the [modulePreload config docs](https://vite.dev/config/build-options.html#build-modulepreload). Note: `build.modulePreloadPolyfill` is now deprecated, please migrate to `build.modulePreload.polyfill`.

#### Include Duplicate Assets in the Manifest

Laravel and other backends integrations will now get entries for every asset file, even if they have been de-duplicated. See [#9928](https://github.com/vitejs/vite/issues/9928) for more information.

#### Customizable ErrorOverlay

You can now customize the ErrorOverlay by using [css parts](https://developer.mozilla.org/en-US/docs/Web/CSS/::part). Check out the PR for more details: [#10234](https://github.com/vitejs/vite/issues/10234).

### Features

* feat(build): experimental copyPublicDir option (#10550) ([4f4a39f](https://github.com/vitejs/vite/commit/4f4a39f5a68bb7f3bf3acd6453e7b09e970395ef)), closes [#10550](https://github.com/vitejs/vite/issues/10550)
* feat(css): export preprocessCSS API (#10429) ([177b427](https://github.com/vitejs/vite/commit/177b427b1b0c72b06bddd860d14ff119cb22431f)), closes [#10429](https://github.com/vitejs/vite/issues/10429)
* feat(preview): support outDir option (#10418) ([15b90b3](https://github.com/vitejs/vite/commit/15b90b389030fa01e18292a272409f0309f089ac)), closes [#10418](https://github.com/vitejs/vite/issues/10418)
* feat: include line and column in error format (#10529) ([d806c4a](https://github.com/vitejs/vite/commit/d806c4a571c934909db2bd80cebdc347457a6793)), closes [#10529](https://github.com/vitejs/vite/issues/10529)
* feat: reuse opening tab in chromium browsers when start dev server (#10485) ([1a2e7a8](https://github.com/vitejs/vite/commit/1a2e7a8d360c6ac25754466143c5a3eb5291dcaa)), closes [#10485](https://github.com/vitejs/vite/issues/10485)
* feat: update esbuild compilation affecting fields (#10374) ([f542727](https://github.com/vitejs/vite/commit/f542727917650c18e450d9b69e8ec17b248a7117)), closes [#10374](https://github.com/vitejs/vite/issues/10374)
* feat(proxy): Include URL of request in proxy errors (#10508) ([27e2832](https://github.com/vitejs/vite/commit/27e28328235d2f5c6a44129a7635b697097ec50a)), closes [#10508](https://github.com/vitejs/vite/issues/10508)
* refactor: delete dependent pre built proxy modules (#10427) ([b3b388d](https://github.com/vitejs/vite/commit/b3b388d424ac7ca33fa5e6ae0c3aaf9cccb17ec0)), closes [#10427](https://github.com/vitejs/vite/issues/10427)
* feat(server): invalidate module with hmr (#10333) ([8328011](https://github.com/vitejs/vite/commit/832801153ef54859127cef95ae48fc75a4d31c76)), closes [#10333](https://github.com/vitejs/vite/issues/10333)
* feat: build.modulePreload options (#9938) ([e223f84](https://github.com/vitejs/vite/commit/e223f84af877d354e197ca0ce9103777ed247718)), closes [#9938](https://github.com/vitejs/vite/issues/9938)
* feat: customize ErrorOverlay (#10234) ([fe4dc8d](https://github.com/vitejs/vite/commit/fe4dc8d3fae2eb6344b9b48794d01ad25c46a321)), closes [#10234](https://github.com/vitejs/vite/issues/10234)
* feat: dynamic import support ?url and ?worker (#8261) ([0cb01ca](https://github.com/vitejs/vite/commit/0cb01ca578f4cc05117495709030bfd94a4e8ec7)), closes [#8261](https://github.com/vitejs/vite/issues/8261)
* feat: include duplicate assets in the manifest (#9928) ([42ecf37](https://github.com/vitejs/vite/commit/42ecf3759e20529f32433142eab02f84943d0bac)), closes [#9928](https://github.com/vitejs/vite/issues/9928)
* feat: support import.meta.hot.invalidate (#10244) ([fb8ab16](https://github.com/vitejs/vite/commit/fb8ab1641feb597f5ba51f8e6e043d2ce3980e08)), closes [#10244](https://github.com/vitejs/vite/issues/10244)
* feat: support postcss sugarss (#6705) ([8ede2f1](https://github.com/vitejs/vite/commit/8ede2f18f8a71350284241f2fbcb44f7ecf79e78)), closes [#6705](https://github.com/vitejs/vite/issues/6705)
* feat(assets): allow `new URL` to resolve package assets (#7837) ([bafccf5](https://github.com/vitejs/vite/commit/bafccf52aa567d744c156d599f957131633351a6)), closes [#7837](https://github.com/vitejs/vite/issues/7837)
* feat(client): add data-vite-dev-id attribute to style elements (#10080) ([ea09fde](https://github.com/vitejs/vite/commit/ea09fde047bbe01266cc046528db604bf1b75c30)), closes [#10080](https://github.com/vitejs/vite/issues/10080)
* feat(lib): allow multiple entries (#7047) ([65a0fad](https://github.com/vitejs/vite/commit/65a0fad209821b2f8cd6f1cbabe5fe72f27e9b17)), closes [#7047](https://github.com/vitejs/vite/issues/7047)
* feat(optimizer): Support bun lockfile format (#10288) ([931d69b](https://github.com/vitejs/vite/commit/931d69b4d3cfebe641b93867191a7d411593f554)), closes [#10288](https://github.com/vitejs/vite/issues/10288)
* refactor(types): bundle client types (#9966) ([da632bf](https://github.com/vitejs/vite/commit/da632bf36f561c0fc4031830721a7d4d86135efb)), closes [#9966](https://github.com/vitejs/vite/issues/9966)
* refactor(types): simplify type exports (#10243) ([291174d](https://github.com/vitejs/vite/commit/291174d89c5c6af8e4890324545d079954ab4bf7)), closes [#10243](https://github.com/vitejs/vite/issues/10243)
* perf: cache compiled glob for `server.fs.deny` (#10044) ([df560b0](https://github.com/vitejs/vite/commit/df560b02d488c2a22a1daee80839ba0dcbf9593e)), closes [#10044](https://github.com/vitejs/vite/issues/10044)

### Bug Fixes

* fix: add a warning if css urls not exist during build time (fix #9800) (#10331) ([9f268da](https://github.com/vitejs/vite/commit/9f268dad2e82c0f1276b1098c0a28f1cf245aa50)), closes [#9800](https://github.com/vitejs/vite/issues/9800) [#10331](https://github.com/vitejs/vite/issues/10331)
* fix: increase error overlay z-index (#10603) ([1157941](https://github.com/vitejs/vite/commit/11579415132fbeffcdbf0a0b130b52e167cb1793)), closes [#10603](https://github.com/vitejs/vite/issues/10603)
* fix: revert es-module-lexer version (#10614) ([cffe5c9](https://github.com/vitejs/vite/commit/cffe5c9edb2ef775dd46a4058a123e1f55a5d2ab)), closes [#10614](https://github.com/vitejs/vite/issues/10614)
* fix: when the file path is an absolute path, parsing causes parameter loss (#10449) ([df86990](https://github.com/vitejs/vite/commit/df869909ae1bb5d7cd0fdd7b705737e9b19e41d4)), closes [#10449](https://github.com/vitejs/vite/issues/10449)
* fix(config): resolve build options with fallback (#10645) ([f7021e3](https://github.com/vitejs/vite/commit/f7021e3ed00ce316e0d04e86fdc1a760c863979d)), closes [#10645](https://github.com/vitejs/vite/issues/10645)
* fix(deps): update all non-major dependencies (#10610) ([bb95467](https://github.com/vitejs/vite/commit/bb954672e3ee863e5cb37fa78167e5fc6df9ae4e)), closes [#10610](https://github.com/vitejs/vite/issues/10610)
* fix(hmr): cannot reload after missing import on server startup (#9534) (#10602) ([ee7c28a](https://github.com/vitejs/vite/commit/ee7c28a46a6563d54b828af42570c55f16b15d2c)), closes [#9534](https://github.com/vitejs/vite/issues/9534) [#10602](https://github.com/vitejs/vite/issues/10602)
* fix(css): strip BOM (fixes #10043) (#10577) ([e0463bd](https://github.com/vitejs/vite/commit/e0463bd64de548e215a31ddf0f2c4bb3ef044e1e)), closes [#10043](https://github.com/vitejs/vite/issues/10043) [#10577](https://github.com/vitejs/vite/issues/10577)
* fix(ssr): resolve with isRequire true (#10569) ([7b81210](https://github.com/vitejs/vite/commit/7b81210c50366f397bc823edfe8b90d371bb7618)), closes [#10569](https://github.com/vitejs/vite/issues/10569)
* fix: prefer exports when resolving (#10371) ([3259006](https://github.com/vitejs/vite/commit/325900601c4955d5a97459d4b80def1a724672f6)), closes [#10371](https://github.com/vitejs/vite/issues/10371)
* fix(config): partial deno support (#10446) ([c4489ea](https://github.com/vitejs/vite/commit/c4489ea193f4d2f703882cb03490980aa5174040)), closes [#10446](https://github.com/vitejs/vite/issues/10446)
* fix(config): skip resolve builtin modules (#10420) ([ecba3f8](https://github.com/vitejs/vite/commit/ecba3f8baca042d015c9285b6cb07993c67235a9)), closes [#10420](https://github.com/vitejs/vite/issues/10420)
* fix(ssr): handle parallel hookNodeResolve (#10401) ([1a961d9](https://github.com/vitejs/vite/commit/1a961d9bf737d56d3a6d130eb81c732e00c9f8fb)), closes [#10401](https://github.com/vitejs/vite/issues/10401)
* fix(cli): when the user enters the same command (#10474) ([2326f4a](https://github.com/vitejs/vite/commit/2326f4af28151906852f19b223a20547c8ad89af)), closes [#10474](https://github.com/vitejs/vite/issues/10474)
* fix(config): don't use module condition (`import.meta.resolve`) (fixes #10430) (#10528) ([64f19b9](https://github.com/vitejs/vite/commit/64f19b945da3d692127aaa6273eb78a07e28ee84)), closes [#10430](https://github.com/vitejs/vite/issues/10430) [#10528](https://github.com/vitejs/vite/issues/10528)
* fix(css): remove `?direct` in id for postcss process (#10514) ([67e7bf2](https://github.com/vitejs/vite/commit/67e7bf29cec3e76eb69aa19dcaffc4e3ccc598bd)), closes [#10514](https://github.com/vitejs/vite/issues/10514)
* fix(html): allow self closing on non-void elements (#10478) ([29292af](https://github.com/vitejs/vite/commit/29292af23fd7bc498056a7c048cac9b3bca3303d)), closes [#10478](https://github.com/vitejs/vite/issues/10478)
* fix(legacy): restore entry chunk CSS inlining, reverts #9761 (#10496) ([9cc808e](https://github.com/vitejs/vite/commit/9cc808e94b28e7d9c86b5dcd10f9ae068e5ca6d1)), closes [#9761](https://github.com/vitejs/vite/issues/9761) [#10496](https://github.com/vitejs/vite/issues/10496)
* chore: simplify filter plugin code (#10459) ([5d9b810](https://github.com/vitejs/vite/commit/5d9b81023cd280df0932753f6de2a4ba666caa3e)), closes [#10459](https://github.com/vitejs/vite/issues/10459)
* chore(deps): update all non-major dependencies (#10488) ([15aa827](https://github.com/vitejs/vite/commit/15aa827283d6cbf9f55c02d6d8a3fe43dbd792e4)), closes [#10488](https://github.com/vitejs/vite/issues/10488)
* chore: update magic-string (#10364) ([23c9259](https://github.com/vitejs/vite/commit/23c9259aa31424d96fdc87f61236fd3b84aed2c3)), closes [#10364](https://github.com/vitejs/vite/issues/10364)
* chore(deps): update all non-major dependencies (#10393) ([f519423](https://github.com/vitejs/vite/commit/f519423170fafeee9d58aeb2052cb3bc224f25f8)), closes [#10393](https://github.com/vitejs/vite/issues/10393)
* chore(deps): update dependency @rollup/plugin-alias to v4 (#10394) ([e2b4c8f](https://github.com/vitejs/vite/commit/e2b4c8f2eb6c49a6ac3a7dacf355f4f11fc732dd)), closes [#10394](https://github.com/vitejs/vite/issues/10394)
* feat(lib): cjs instead of umd as default format for multiple entries (#10315) ([07d3fbd](https://github.com/vitejs/vite/commit/07d3fbd21e6b63a12997d201a2deb5b2f2129882)), closes [#10315](https://github.com/vitejs/vite/issues/10315)
* fix: make client type work with `moduleResolution=node16` (#10375) ([8c4df1f](https://github.com/vitejs/vite/commit/8c4df1f4a6c2444bede34b2d9fab2ca1810caec3)), closes [#10375](https://github.com/vitejs/vite/issues/10375)
* fix(config): don't resolve by module field (#10347) ([cc1c829](https://github.com/vitejs/vite/commit/cc1c8298d431a438c0f1b7b036ab9f333ed5ff74)), closes [#10347](https://github.com/vitejs/vite/issues/10347)
* fix(html): handle attrs with prefix (fixes #10337) (#10381) ([7b4d6e8](https://github.com/vitejs/vite/commit/7b4d6e827aaf4da1b9785f82313745884ac6ce22)), closes [#10337](https://github.com/vitejs/vite/issues/10337) [#10381](https://github.com/vitejs/vite/issues/10381)
* fix(ssr): track var as function scope (#10388) ([87b48f9](https://github.com/vitejs/vite/commit/87b48f9103f467c3ad33b039ccf845aed9a281d7)), closes [#10388](https://github.com/vitejs/vite/issues/10388)
* fix: add module types (#10299) ([0b89dd2](https://github.com/vitejs/vite/commit/0b89dd2053ebc3eaa94897bb988f23cd336ae220)), closes [#10299](https://github.com/vitejs/vite/issues/10299)
* fix: css order problem in async chunk (#9949) ([6c7b834](https://github.com/vitejs/vite/commit/6c7b83434fff9a25c7f249b8f9f755d2b4e2bd6b)), closes [#9949](https://github.com/vitejs/vite/issues/9949)
* fix: don't duplicate styles with dynamic import (fix #9967) (#9970) ([65f97bd](https://github.com/vitejs/vite/commit/65f97bd8cf23c3845c7382cf622a68d60c542fc7)), closes [#9967](https://github.com/vitejs/vite/issues/9967) [#9970](https://github.com/vitejs/vite/issues/9970)
* fix: env variables override (#10113) ([d619460](https://github.com/vitejs/vite/commit/d619460b14c09982d588085ec4dafd673a3cad68)), closes [#10113](https://github.com/vitejs/vite/issues/10113)
* fix: isFromTsImporter flag in worker virtual model (#10273) ([78f74c9](https://github.com/vitejs/vite/commit/78f74c99d2edcdb26c692d5741790942902c5bea)), closes [#10273](https://github.com/vitejs/vite/issues/10273)
* fix: properly close optimizer on server restart (#10028) ([a32777f](https://github.com/vitejs/vite/commit/a32777f899b1670a867f7e1bfd627a72432a527e)), closes [#10028](https://github.com/vitejs/vite/issues/10028)
* fix: respect `mainFields` when resolving browser/module field (fixes #8659) (#10071) ([533d13c](https://github.com/vitejs/vite/commit/533d13c27a44b26890956c25944970d47e123bae)), closes [#8659](https://github.com/vitejs/vite/issues/8659) [#10071](https://github.com/vitejs/vite/issues/10071)
* fix: respect resolve.conditions, when resolving browser/require field (#9860) ([9a83eaf](https://github.com/vitejs/vite/commit/9a83eaffac3383f5ee68097807de532f0b5cb25c)), closes [#9860](https://github.com/vitejs/vite/issues/9860)
* fix: support process each out dir when there are two or more (#9748) ([ee3231c](https://github.com/vitejs/vite/commit/ee3231c90a5eaaefdba628c3c82bcad54060aeb6)), closes [#9748](https://github.com/vitejs/vite/issues/9748)
* fix(build): fix resolution algorithm when `build.ssr` is true (#9989) ([7229251](https://github.com/vitejs/vite/commit/72292510197063b0becb3fb6dc7b567c7f6755a8)), closes [#9989](https://github.com/vitejs/vite/issues/9989)
* fix(config): resolve implicit deps as absolute path (#10254) ([ec1f3ae](https://github.com/vitejs/vite/commit/ec1f3ae55fd5b01084a5ba191fd500648e5fb9c8)), closes [#10254](https://github.com/vitejs/vite/issues/10254)
* fix(css):  missing css in lib mode (#10185) ([e4c1c6d](https://github.com/vitejs/vite/commit/e4c1c6d506069e55eedfb81f8c607ffb3e74bda0)), closes [#10185](https://github.com/vitejs/vite/issues/10185)
* fix(deps): update all non-major dependencies (#10160) ([6233c83](https://github.com/vitejs/vite/commit/6233c830201085d869fbbd2a7e622a59272e0f43)), closes [#10160](https://github.com/vitejs/vite/issues/10160)
* fix(deps): update all non-major dependencies (#10316) ([a38b450](https://github.com/vitejs/vite/commit/a38b450441eea02a680b80ac0624126ba6abe3f7)), closes [#10316](https://github.com/vitejs/vite/issues/10316)
* fix(deps): update rollup to `^2.79.1` (#10298) ([2266d83](https://github.com/vitejs/vite/commit/2266d834c8ae4dadd380a3e6f94b041b8e1e8a74)), closes [#10298](https://github.com/vitejs/vite/issues/10298)
* fix(esbuild): transpile with esnext in dev (#10207) ([43b7b78](https://github.com/vitejs/vite/commit/43b7b78b1834a4c7128d8a5d987f66a4defcbd93)), closes [#10207](https://github.com/vitejs/vite/issues/10207)
* fix(hmr): handle virtual module update (#10324) ([7c4accb](https://github.com/vitejs/vite/commit/7c4accb8dec3204948d7b73e5386e789661f9198)), closes [#10324](https://github.com/vitejs/vite/issues/10324)
* fix(optimizer): browser field bare import (fix #7599) (#10314) ([cba13e8](https://github.com/vitejs/vite/commit/cba13e8b924fc2c318b4af5324e7c883014e5a8a)), closes [#7599](https://github.com/vitejs/vite/issues/7599) [#10314](https://github.com/vitejs/vite/issues/10314)
* fix(sass): reorder sass importers (#10101) ([a543731](https://github.com/vitejs/vite/commit/a5437319dab2840b190683c406c2ff8456333c73)), closes [#10101](https://github.com/vitejs/vite/issues/10101)
* fix(server): handle appType mpa html fallback (#10336) ([65dd88b](https://github.com/vitejs/vite/commit/65dd88b8e3fafcfdc141074a08f468559cfaaefb)), closes [#10336](https://github.com/vitejs/vite/issues/10336)
* fix(ssr): correctly track scope (#10300) ([a60529f](https://github.com/vitejs/vite/commit/a60529fd80006cfce82cb586810bd684c9385208)), closes [#10300](https://github.com/vitejs/vite/issues/10300)
* fix(worker): support comment in worker constructor option (#10226) ([66c9058](https://github.com/vitejs/vite/commit/66c90585e281e03754114a02bc96a5eddfa8192f)), closes [#10226](https://github.com/vitejs/vite/issues/10226)
* fix(worker): support trailing comma (#10211) ([0542e7c](https://github.com/vitejs/vite/commit/0542e7c7c08e91862f97e954be5bee36e076a6ce)), closes [#10211](https://github.com/vitejs/vite/issues/10211)


### Previous Changelogs


#### [3.2.0-beta.4](https://github.com/vitejs/vite/compare/v3.2.0-beta.3...v3.2.0-beta.4) (2022-10-24)

See [3.2.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v3.2.0-beta.4/packages/vite/CHANGELOG.md)


#### [3.2.0-beta.3](https://github.com/vitejs/vite/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2022-10-20)

See [3.2.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v3.2.0-beta.4/packages/vite/CHANGELOG.md)


#### [3.2.0-beta.2](https://github.com/vitejs/vite/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2022-10-14)

See [3.2.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v3.2.0-beta.4/packages/vite/CHANGELOG.md)


#### [3.2.0-beta.1](https://github.com/vitejs/vite/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2022-10-10)

See [3.2.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v3.2.0-beta.4/packages/vite/CHANGELOG.md)


#### [3.2.0-beta.0](https://github.com/vitejs/vite/compare/v3.1.3...v3.2.0-beta.0) (2022-10-05)

See [3.2.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v3.2.0-beta.4/packages/vite/CHANGELOG.md)



## <small>3.1.3 (2022-09-19)</small>

* fix: esbuildOutputFromId for symlinked root (#10154) ([fc5310f](https://github.com/vitejs/vite/commit/fc5310f3e3f500412aaf5e45a5871088a662d0e5)), closes [#10154](https://github.com/vitejs/vite/issues/10154)
* fix(hmr): dedupe virtual modules in module graph (#10144) ([71f08e7](https://github.com/vitejs/vite/commit/71f08e766ca2fd1eb7e1913f86b14796fc6df93f)), closes [#10144](https://github.com/vitejs/vite/issues/10144)
* fix(lib): respect `rollupOptions.input` in lib mode (#10116) ([c948e7d](https://github.com/vitejs/vite/commit/c948e7d7fc5ad62262b24f89694e2b95a573a16d)), closes [#10116](https://github.com/vitejs/vite/issues/10116)



## <small>3.1.2 (2022-09-17)</small>

* fix: use isOptimizable to ensure version query (#10141) ([23a51c6](https://github.com/vitejs/vite/commit/23a51c6184587124bf20d270c27deb3fbb56d9a3)), closes [#10141](https://github.com/vitejs/vite/issues/10141)



## <small>3.1.1 (2022-09-15)</small>

* fix: ensure version query for relative node_modules imports (#10016) ([1b822d0](https://github.com/vitejs/vite/commit/1b822d0598a6e13108da541e37d6e0ccb5c226f3)), closes [#10016](https://github.com/vitejs/vite/issues/10016)
* fix: no quote on attrs (#10117) ([f541239](https://github.com/vitejs/vite/commit/f5412397524db100d07c68dad19f13eabe365b9a)), closes [#10117](https://github.com/vitejs/vite/issues/10117)
* fix: prevent error overlay style being overridden (fixes #9969) (#9971) ([a7706d0](https://github.com/vitejs/vite/commit/a7706d0d980307a91c443c6bb57e048cade7dc75)), closes [#9969](https://github.com/vitejs/vite/issues/9969) [#9971](https://github.com/vitejs/vite/issues/9971)
* fix: proxy to secured websocket server (#10045) ([9de9bc4](https://github.com/vitejs/vite/commit/9de9bc477638ec46d2e80e6e66ec4f3eb6b439e9)), closes [#10045](https://github.com/vitejs/vite/issues/10045)
* fix: replace white with reset (#10104) ([5d56e42](https://github.com/vitejs/vite/commit/5d56e421625b408879672a1dd4e774bae3df674f)), closes [#10104](https://github.com/vitejs/vite/issues/10104)
* fix(deps): update all non-major dependencies (#10077) ([caf00c8](https://github.com/vitejs/vite/commit/caf00c8c7a5c81a92182116ffa344b34ce4c3b5e)), closes [#10077](https://github.com/vitejs/vite/issues/10077)
* fix(deps): update all non-major dependencies (#9985) ([855f2f0](https://github.com/vitejs/vite/commit/855f2f077eb8dc41b395bccecb6a5b836eb526a9)), closes [#9985](https://github.com/vitejs/vite/issues/9985)
* fix(preview): send configured headers (#9976) ([0d20eae](https://github.com/vitejs/vite/commit/0d20eae2236231aebdfe5cf8fc1794226873d779)), closes [#9976](https://github.com/vitejs/vite/issues/9976)
* chore: cleanup old changelogs (#10056) ([9e65a41](https://github.com/vitejs/vite/commit/9e65a41f15b9593cf5f1518d4ad4c4f84bd37c07)), closes [#10056](https://github.com/vitejs/vite/issues/10056)
* chore: update 3.1 changelog (#9994) ([44dbcbe](https://github.com/vitejs/vite/commit/44dbcbec8b1c0db0d42887ba5bf3de752e3baada)), closes [#9994](https://github.com/vitejs/vite/issues/9994)
* chore(deps): update @rollup/plugin-node-resolve to v14 (#10078) ([3390c87](https://github.com/vitejs/vite/commit/3390c874ea62669742774948fcfcb5725e35b164)), closes [#10078](https://github.com/vitejs/vite/issues/10078)
* refactor: config hook helper function (#9982) ([9c1be10](https://github.com/vitejs/vite/commit/9c1be108bfb1eac3dbbe432214349153d8b9ed5e)), closes [#9982](https://github.com/vitejs/vite/issues/9982)
* refactor: optimize `async` and `await` in code (#9854) ([31f5ff3](https://github.com/vitejs/vite/commit/31f5ff3ef9ee071afa8cc66870e13e9753c3ab93)), closes [#9854](https://github.com/vitejs/vite/issues/9854)



## 3.1.0 (2022-09-05)

### Main Changes

- Vite now uses [parse5](https://github.com/inikulin/parse5), which parses HTML in the same way as the latest browser versions. This migration gives us a more robust HTML story moving forward ([#9678](https://github.com/vitejs/vite/issues/9678)).
- Vite now supports using objects as hooks to change execution order ([#9634](https://github.com/vitejs/vite/issues/9634)). Check out the [RFC](https://github.com/vitejs/rfcs/discussions/12) and the implementation upstream at [rollup/rollup#4600](https://github.com/rollup/rollup/pull/4600) for details and rationale.
  ```js
    import { resolve } from 'node:path';
    import { readdir } from 'node:fs/promises';

    export default function getFilesOnDisk() {
      return {
        name: 'getFilesOnDisk',
        writeBundle: {
          // run this hook sequentially even if the hook is parallel
          sequential: true,
          // push this hook to the 'post' stage, after all normal hooks
          order: 'post',
          // hook implementation
          async handler({ dir }) {
            const topLevelFiles = await readdir(resolve(dir))
            console.log(topLevelFiles)
          }
        }
      }
    }
  ```
  Read the updated [Rollup Plugin docs](https://rollupjs.org/plugin-development/#build-hooks) for more information.

> **Note**
> After Vite 3.1, you are no longer going to see `[vite] hot updated` log messages in the browser console. These messages have been moved to the debug channel ([#8855](https://github.com/vitejs/vite/issues/8855)). Check your browser docs to [show debug logs](https://developer.chrome.com/docs/devtools/console/log/#level).

### Features

* feat(css): format error (#9909) ([632fedf](https://github.com/vitejs/vite/commit/632fedf87fbcb81b2400571886faf8a8b92376e4)), closes [#9909](https://github.com/vitejs/vite/issues/9909)
* perf: bundle create-vite (#9034) ([37ac91e](https://github.com/vitejs/vite/commit/37ac91e5f680aea56ce5ca15ce1291adc3cbe05e)), closes [#9034](https://github.com/vitejs/vite/issues/9034)
* feat: stabilize server.resolvedUrls (#9866) ([c3f6731](https://github.com/vitejs/vite/commit/c3f6731bafeadd310efa4325cb8dcc639636fe48)), closes [#9866](https://github.com/vitejs/vite/issues/9866)
* feat(client): use debug channel on hot updates (#8855) ([0452224](https://github.com/vitejs/vite/commit/0452224e2f725138be0a79ebe052e0e87ac0e725)), closes [#8855](https://github.com/vitejs/vite/issues/8855)
* feat: relax dep browser externals as warning (#9837) ([71cb374](https://github.com/vitejs/vite/commit/71cb3740364c6fff2ff7f39a9c44029a281b1b7c)), closes [#9837](https://github.com/vitejs/vite/issues/9837)
* feat: support object style hooks (#9634) ([757a92f](https://github.com/vitejs/vite/commit/757a92f1c7c4fa961ed963edd245df77382dfde6)), closes [#9634](https://github.com/vitejs/vite/issues/9634)
* refactor: migrate from vue/compiler-dom to parse5 (#9678) ([05b3ce6](https://github.com/vitejs/vite/commit/05b3ce6aa7e837ca5f0613929fe39da3d7524bd9)), closes [#9678](https://github.com/vitejs/vite/issues/9678)
* refactor: use `server.ssrTransform` (#9769) ([246a087](https://github.com/vitejs/vite/commit/246a087c45133f993aab58166579b68fdde1db13)), closes [#9769](https://github.com/vitejs/vite/issues/9769)
* perf: legacy avoid insert the entry module css (#9761) ([0765ab8](https://github.com/vitejs/vite/commit/0765ab812f410d5b925a742419ea2b1586b0da23)), closes [#9761](https://github.com/vitejs/vite/issues/9761)

### Bug Fixes

* fix(css): remove css-post plugin sourcemap (#9914) ([c9521e7](https://github.com/vitejs/vite/commit/c9521e7d03156178f9d10a453c3825c0e0a713e0)), closes [#9914](https://github.com/vitejs/vite/issues/9914)
* fix(hmr): duplicated modules because of query params mismatch (fixes #2255) (#9773) ([86bf776](https://github.com/vitejs/vite/commit/86bf776b1fea26f292163f911fe59ed201d73baf)), closes [#2255](https://github.com/vitejs/vite/issues/2255) [#9773](https://github.com/vitejs/vite/issues/9773)
* fix(ssr): enable `inlineDynamicImports` when input has length 1 (#9904) ([9ac5075](https://github.com/vitejs/vite/commit/9ac5075825212e5f4f3b262225ff4a3e46b8e8d1)), closes [#9904](https://github.com/vitejs/vite/issues/9904)
* fix(types): mark explicitImportRequired optional and experimental (#9962) ([7b618f0](https://github.com/vitejs/vite/commit/7b618f09a181956f4cc31774a453bdef76742943)), closes [#9962](https://github.com/vitejs/vite/issues/9962)
* fix: bump esbuild to 0.15.6 (#9934) ([091537c](https://github.com/vitejs/vite/commit/091537cea8c4eaf6b1cd29c7e058874cafbc7666)), closes [#9934](https://github.com/vitejs/vite/issues/9934)
* refactor(hmr): simplify fetchUpdate (#9881) ([8872aba](https://github.com/vitejs/vite/commit/8872aba381ff1e6358524420fa16d4c4e6f35e32)), closes [#9881](https://github.com/vitejs/vite/issues/9881)
* fix: ensure version query for direct node_modules imports (#9848) ([e7712ff](https://github.com/vitejs/vite/commit/e7712ffb68b24fc6eafb9359548cf92c15a156c1)), closes [#9848](https://github.com/vitejs/vite/issues/9848)
* fix: escape glob path (#9842) ([6be971e](https://github.com/vitejs/vite/commit/6be971eb395dfd82c09841f8426a43da20620801)), closes [#9842](https://github.com/vitejs/vite/issues/9842)
* fix(build): build project path error (#9793) ([cc8800a](https://github.com/vitejs/vite/commit/cc8800a8e7613961144a567f4024b71f218224f8)), closes [#9793](https://github.com/vitejs/vite/issues/9793)
* fix(types): explicitly set Vite hooks' `this` to `void` (#9885) ([2d2f2e5](https://github.com/vitejs/vite/commit/2d2f2e590eeeef502042a14ea9fe00627d92d256)), closes [#9885](https://github.com/vitejs/vite/issues/9885)
* fix: `completeSystemWrapPlugin` captures `function ()` (fixes #9807) (#9821) ([1ee0364](https://github.com/vitejs/vite/commit/1ee0364c769daf069dcef829b1957714b99a0ef6)), closes [#9807](https://github.com/vitejs/vite/issues/9807) [#9821](https://github.com/vitejs/vite/issues/9821)
* fix: `injectQuery` break relative path (#9760) ([61273b2](https://github.com/vitejs/vite/commit/61273b21147d2e8b825679fbc05daf2611eb0f3e)), closes [#9760](https://github.com/vitejs/vite/issues/9760)
* fix: close socket when client error handled (#9816) ([ba62be4](https://github.com/vitejs/vite/commit/ba62be40b4f46c98872fb10990b559fee88f4a29)), closes [#9816](https://github.com/vitejs/vite/issues/9816)
* fix: handle resolve optional peer deps (#9321) ([eec3886](https://github.com/vitejs/vite/commit/eec38860670a84b17d839500d812b27f61ebdf79)), closes [#9321](https://github.com/vitejs/vite/issues/9321)
* fix: module graph ensureEntryFromUrl based on id (#9759) ([01857af](https://github.com/vitejs/vite/commit/01857afbbdac40f950564a3be435a85282c3a159)), closes [#9759](https://github.com/vitejs/vite/issues/9759)
* fix: sanitize asset filenames (#9737) ([2f468bb](https://github.com/vitejs/vite/commit/2f468bb33c9f55efa703363fefa0aa99dbf63929)), closes [#9737](https://github.com/vitejs/vite/issues/9737)
* fix: Skip inlining Git LFS placeholders (fix #9714) (#9795) ([9c7e43d](https://github.com/vitejs/vite/commit/9c7e43d030f07f50f7cf5ef490e74c9425f5ce0f)), closes [#9714](https://github.com/vitejs/vite/issues/9714) [#9795](https://github.com/vitejs/vite/issues/9795)
* fix(html): move importmap before module scripts (#9392) ([b386fba](https://github.com/vitejs/vite/commit/b386fba49ee66a3dce362f2887176dd2a0738771)), closes [#9392](https://github.com/vitejs/vite/issues/9392)

### Previous Changelogs

#### [3.1.0-beta.2](https://github.com/vitejs/vite/compare/v3.1.0-beta.1...v3.1.0-beta.2) (2022-09-02)

See [3.1.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v3.1.0-beta.2/packages/vite/CHANGELOG.md)

#### [3.1.0-beta.1](https://github.com/vitejs/vite/compare/v3.1.0-beta.0...v3.1.0-beta.1) (2022-08-29)

See [3.1.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v3.1.0-beta.1/packages/vite/CHANGELOG.md)

#### [3.1.0-beta.0](https://github.com/vitejs/vite/compare/v3.0.0...v3.1.0-beta.0) (2022-08-25)

See [3.1.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v3.1.0-beta.0/packages/vite/CHANGELOG.md)



## <small>3.0.9 (2022-08-19)</small>

* feat(ssr): warn if cant analyze dynamic import (#9738) ([e0ecb80](https://github.com/vitejs/vite/commit/e0ecb809b1fff2686d37467fd4211750c294757a)), closes [#9738](https://github.com/vitejs/vite/issues/9738)
* fix: dynamic import path contain ../ and its own directory (#9350) ([c6870f3](https://github.com/vitejs/vite/commit/c6870f37161f479b4306826e1e4d8e42ed01d6a8)), closes [#9350](https://github.com/vitejs/vite/issues/9350)
* fix: legacy no resolve asset urls (#9507) ([1d6a1eb](https://github.com/vitejs/vite/commit/1d6a1eb3ad4cb8bc0979b586cca03b2f107ccdee)), closes [#9507](https://github.com/vitejs/vite/issues/9507)
* fix: print error file path when using `rollupOptions.output.dir` (fix #9100) (#9111) ([3bffd14](https://github.com/vitejs/vite/commit/3bffd14695b8d466a3c0ebb7196a73e4eb269299)), closes [#9100](https://github.com/vitejs/vite/issues/9100) [#9111](https://github.com/vitejs/vite/issues/9111)
* fix: skip undefined proxy entry (#9622) ([e396d67](https://github.com/vitejs/vite/commit/e396d6724b4b79c2a0791991e90da5a6407fe682)), closes [#9622](https://github.com/vitejs/vite/issues/9622)
* fix(hmr): duplicate link tags (#9697) ([9aa9515](https://github.com/vitejs/vite/commit/9aa95151615e89f1a82d7078aa36968b26a47d4f)), closes [#9697](https://github.com/vitejs/vite/issues/9697)
* fix(import-analysis): escape quotes (#9729) ([21515f1](https://github.com/vitejs/vite/commit/21515f167b2adf3a1574a13fd1f9e5dbae06c314)), closes [#9729](https://github.com/vitejs/vite/issues/9729)
* docs: fix typos in comments and documentation (#9711) ([0571232](https://github.com/vitejs/vite/commit/05712323b292492e9161a6ff7b20bfce43097dfb)), closes [#9711](https://github.com/vitejs/vite/issues/9711)
* docs: update import.meta.glob jsdocs (#9709) ([15ff3a2](https://github.com/vitejs/vite/commit/15ff3a243de82dba693948fbad3721f6995834b3)), closes [#9709](https://github.com/vitejs/vite/issues/9709)
* chore(deps): update all non-major dependencies (#9675) ([4e56e87](https://github.com/vitejs/vite/commit/4e56e87623501109198e019ebe809872528ab088)), closes [#9675](https://github.com/vitejs/vite/issues/9675)
* chore(deps): update dependency es-module-lexer to v1 (#9576) ([1d8613f](https://github.com/vitejs/vite/commit/1d8613fe9824b1fe336960f82f0c92bed79e21c6)), closes [#9576](https://github.com/vitejs/vite/issues/9576)
* perf: avoid `ssrTransform` object allocation (#9706) ([6e58d9d](https://github.com/vitejs/vite/commit/6e58d9dcc11e0de49bfee42cf9082a7d01dbbc86)), closes [#9706](https://github.com/vitejs/vite/issues/9706)



## <small>3.0.8 (2022-08-16)</small>

* fix: allow ping to http from https website (#9561) ([f4b4405](https://github.com/vitejs/vite/commit/f4b44054127e82c9ee4118fc157a157467ae3216)), closes [#9561](https://github.com/vitejs/vite/issues/9561)
* fix: use browser field if likely esm (fixes #9652) (#9653) ([85e387a](https://github.com/vitejs/vite/commit/85e387a1700276afc312e8e74ccab4ff461923c5)), closes [#9652](https://github.com/vitejs/vite/issues/9652) [#9653](https://github.com/vitejs/vite/issues/9653)
* fix(ssr-manifest): filter path undefined when dynamic import (#9655) ([1478a2f](https://github.com/vitejs/vite/commit/1478a2f347daac062c64799593e88fc01f1c0f7d)), closes [#9655](https://github.com/vitejs/vite/issues/9655)
* docs: update WSL2 watch limitation explanation (#8939) ([afbb87d](https://github.com/vitejs/vite/commit/afbb87d1f85fec29598592a1d3f7610c8ccc8fcc)), closes [#8939](https://github.com/vitejs/vite/issues/8939)



## <small>3.0.7 (2022-08-12)</small>

* chore: fix typo in error message (#9645) ([7121ee0](https://github.com/vitejs/vite/commit/7121ee0d1f46cdf554d2298f63f9f0ab7e394f08)), closes [#9645](https://github.com/vitejs/vite/issues/9645)
* fix(config): don't use file url for external files with cjs output (#9642) ([73ad707](https://github.com/vitejs/vite/commit/73ad70711729618388dec1349062ca452f6a6e0e)), closes [#9642](https://github.com/vitejs/vite/issues/9642)



## <small>3.0.6 (2022-08-11)</small>

* chore: narrow down rollup version (#9637) ([fcf4d98](https://github.com/vitejs/vite/commit/fcf4d98d6bc49b649a3d39d490aa51a216192b3e)), closes [#9637](https://github.com/vitejs/vite/issues/9637)
* feat: show warning on 431 response (#9324) ([e8b61bb](https://github.com/vitejs/vite/commit/e8b61bb3cac6c9c3ef3fa33e43440cc646473696)), closes [#9324](https://github.com/vitejs/vite/issues/9324)
* fix: avoid using `import.meta.url` for relative assets if output is not ESM (fixes #9297) (#9381) ([6d95225](https://github.com/vitejs/vite/commit/6d952252c7a3b92b2f82a7c78c230e0a152fd2a6)), closes [#9297](https://github.com/vitejs/vite/issues/9297) [#9381](https://github.com/vitejs/vite/issues/9381)
* fix: json HMR (fixes #9521) (#9610) ([e45d95f](https://github.com/vitejs/vite/commit/e45d95f864c76a00408b5f7d7e49a7503d78400f)), closes [#9521](https://github.com/vitejs/vite/issues/9521) [#9610](https://github.com/vitejs/vite/issues/9610)
* fix: legacy no emit worker (#9500) ([9d0b18b](https://github.com/vitejs/vite/commit/9d0b18b1cb157f28305fc841f6d98b55b68a7fda)), closes [#9500](https://github.com/vitejs/vite/issues/9500)
* fix: use browser field if it is not likely UMD or CJS (fixes #9445) (#9459) ([c868e64](https://github.com/vitejs/vite/commit/c868e6466410fd549f174c727d69633d59cb5680)), closes [#9445](https://github.com/vitejs/vite/issues/9445) [#9459](https://github.com/vitejs/vite/issues/9459)
* fix(optimizer): ignore EACCES errors while scanner (fixes #8916) (#9509) ([4e6a77f](https://github.com/vitejs/vite/commit/4e6a77f4ba4db05aa13f3f9ce44aa712d3830b4e)), closes [#8916](https://github.com/vitejs/vite/issues/8916) [#9509](https://github.com/vitejs/vite/issues/9509)
* fix(ssr): rename objectPattern dynamic key (fixes #9585) (#9609) ([ee7f78f](https://github.com/vitejs/vite/commit/ee7f78faa1ea06fc4d32acc87757006683f46c93)), closes [#9585](https://github.com/vitejs/vite/issues/9585) [#9609](https://github.com/vitejs/vite/issues/9609)



## <small>3.0.5 (2022-08-09)</small>

* fix: allow tree-shake glob eager css in js (#9547) ([2e309d6](https://github.com/vitejs/vite/commit/2e309d6dfe742356f434e628f09d9ef8f8c554ef)), closes [#9547](https://github.com/vitejs/vite/issues/9547)
* fix: ignore tsconfig target when bundling config (#9457) ([c5e7895](https://github.com/vitejs/vite/commit/c5e789512a78f903c11f3029186fc90b124e48b4)), closes [#9457](https://github.com/vitejs/vite/issues/9457)
* fix: log worker plugins in debug mode (#9553) ([c1fa219](https://github.com/vitejs/vite/commit/c1fa219f7da09d8fca0140c79e62dbce6d54b0e5)), closes [#9553](https://github.com/vitejs/vite/issues/9553)
* fix: tree-shake modulepreload polyfill (#9531) ([1f11a70](https://github.com/vitejs/vite/commit/1f11a70f29de0ca9a88234b4548b73df7e57bc9f)), closes [#9531](https://github.com/vitejs/vite/issues/9531)
* fix: update dep types (fixes #9475) (#9489) ([937cecc](https://github.com/vitejs/vite/commit/937cecc7d89194d8672ab62beb92827f45764c15)), closes [#9475](https://github.com/vitejs/vite/issues/9475) [#9489](https://github.com/vitejs/vite/issues/9489)
* fix(build): normalized output log (#9594) ([8bae103](https://github.com/vitejs/vite/commit/8bae103236cf2137b1127756141b0e2c1e9c7696)), closes [#9594](https://github.com/vitejs/vite/issues/9594)
* fix(config): try catch unlink after load (#9577) ([d35a1e2](https://github.com/vitejs/vite/commit/d35a1e2b828dfe2ef89bd235b3594b797d9ee7a1)), closes [#9577](https://github.com/vitejs/vite/issues/9577)
* fix(config): use file url for import path (fixes #9471) (#9473) ([22084a6](https://github.com/vitejs/vite/commit/22084a64264e84bcbb97eb9ccaa2d7672f0bee71)), closes [#9471](https://github.com/vitejs/vite/issues/9471) [#9473](https://github.com/vitejs/vite/issues/9473)
* fix(deps): update all non-major dependencies (#9575) ([8071325](https://github.com/vitejs/vite/commit/80713256d0dd5716e42086fb617e96e9e92c3675)), closes [#9575](https://github.com/vitejs/vite/issues/9575)
* fix(ssr): check root import extension for external (#9494) ([ff89df5](https://github.com/vitejs/vite/commit/ff89df5200de2d2a06474353b5b34e04249ad9d3)), closes [#9494](https://github.com/vitejs/vite/issues/9494)
* fix(ssr): use appendRight for import (#9554) ([dfec6ca](https://github.com/vitejs/vite/commit/dfec6ca71a44098337008f93c5bf5c2f678ed03e)), closes [#9554](https://github.com/vitejs/vite/issues/9554)
* refactor(resolve): remove commonjs plugin handling (#9460) ([2042b91](https://github.com/vitejs/vite/commit/2042b91d7c8125ce39e2f140bbf06032272ee072)), closes [#9460](https://github.com/vitejs/vite/issues/9460)
* chore: init imports var before use (#9569) ([905b8eb](https://github.com/vitejs/vite/commit/905b8ebbed1f7616d12018ce451920dc57342cef)), closes [#9569](https://github.com/vitejs/vite/issues/9569)
* chore: node prefix lint (#9514) ([9e9cd23](https://github.com/vitejs/vite/commit/9e9cd23763c96020cdf1807334368e038f61ad01)), closes [#9514](https://github.com/vitejs/vite/issues/9514)
* chore: tidy up eslint config (#9468) ([f4addcf](https://github.com/vitejs/vite/commit/f4addcfc24b1668b906411ff8f8fc394ce5c3643)), closes [#9468](https://github.com/vitejs/vite/issues/9468)
* chore(deps): update all non-major dependencies (#9478) ([c530d16](https://github.com/vitejs/vite/commit/c530d168309557c7a254128364f07f7b4f017e14)), closes [#9478](https://github.com/vitejs/vite/issues/9478)
* docs: fix incomplete comment (#9466) ([5169c51](https://github.com/vitejs/vite/commit/5169c511127ab0a2de89b71941459c70dbe09dd9)), closes [#9466](https://github.com/vitejs/vite/issues/9466)
* feat(ssr): debug failed node resolve (#9432) ([364aae1](https://github.com/vitejs/vite/commit/364aae13f0826169e8b1c5db41ac6b5bb2756958)), closes [#9432](https://github.com/vitejs/vite/issues/9432)



## <small>3.0.4 (2022-07-29)</small>

* fix: __VITE_PUBLIC_ASSET__hash__ in HTML (#9247) ([a2b24ee](https://github.com/vitejs/vite/commit/a2b24eea4a43a39bc4104335d21f2ec5353d6a13)), closes [#9247](https://github.com/vitejs/vite/issues/9247)
* fix: inline dynamic imports for ssr-webworker (fixes #9385) (#9401) ([cd69358](https://github.com/vitejs/vite/commit/cd69358177dd3d93bc19084ad0ee09f6b85c047c)), closes [#9385](https://github.com/vitejs/vite/issues/9385) [#9401](https://github.com/vitejs/vite/issues/9401)
* fix: normalise css paths in manifest on windows (fixes #9295) (#9353) ([13e6450](https://github.com/vitejs/vite/commit/13e64508abad52b0d774ed7a5f30d78cff86819c)), closes [#9295](https://github.com/vitejs/vite/issues/9295) [#9353](https://github.com/vitejs/vite/issues/9353)
* fix: support stylesheets with link tag and media/disable prop (#6751) ([e6c8965](https://github.com/vitejs/vite/commit/e6c896516bb90bc1db3a457ddb666a81fe6233a2)), closes [#6751](https://github.com/vitejs/vite/issues/6751)
* fix: url constructor import asset no as url (#9399) ([122c6e7](https://github.com/vitejs/vite/commit/122c6e75202eb295cabb8c9bcbcc5a6d3bf5ec40)), closes [#9399](https://github.com/vitejs/vite/issues/9399)
* fix(glob): server perf when globbing huge dirs (#9425) ([156a3a4](https://github.com/vitejs/vite/commit/156a3a43ebcf77425f20ee0d72bcb2e4b59365ed)), closes [#9425](https://github.com/vitejs/vite/issues/9425)
* fix(glob): support static template literals (#9352) ([183c6fb](https://github.com/vitejs/vite/commit/183c6fb62fc6f1f2a2d3e883a76aa60b3ed21ba0)), closes [#9352](https://github.com/vitejs/vite/issues/9352)
* fix(ssr): allow virtual paths on node modules (#9405) ([e60368f](https://github.com/vitejs/vite/commit/e60368f937f7b2b223811321e66c4aacad72fa6a)), closes [#9405](https://github.com/vitejs/vite/issues/9405)
* chore(deps): update all non-major dependencies (#9347) ([2fcb027](https://github.com/vitejs/vite/commit/2fcb0272442664c395322acfc7899ab6a32bd86c)), closes [#9347](https://github.com/vitejs/vite/issues/9347)



## <small>3.0.3 (2022-07-25)</small>

* fix: client type error (#9289) ([b82ddfb](https://github.com/vitejs/vite/commit/b82ddfb738a1427d6f5d9ef356ce4b0a7d572407)), closes [#9289](https://github.com/vitejs/vite/issues/9289)
* fix: don't modify config (#9262) ([bbc8318](https://github.com/vitejs/vite/commit/bbc8318b11ae9055596ae99bc3cd94fc9bf2017a)), closes [#9262](https://github.com/vitejs/vite/issues/9262)
* fix: entries in ssr.external (#9286) ([d420f01](https://github.com/vitejs/vite/commit/d420f01d48c2291e82410b4649f274f8d1493a27)), closes [#9286](https://github.com/vitejs/vite/issues/9286)
* fix: externalize explicitly configured linked packages (#9346) ([c33e365](https://github.com/vitejs/vite/commit/c33e36556005655ce70a23ae618f121a3d4f8ee2)), closes [#9346](https://github.com/vitejs/vite/issues/9346)
* fix: make `resolveConfig()` concurrent safe (#9224) ([dfaeb2b](https://github.com/vitejs/vite/commit/dfaeb2b7dc39822bf00fc97802b758b17129c37b)), closes [#9224](https://github.com/vitejs/vite/issues/9224)
* fix: scanner and optimizer should skip wasm (#9257) ([c616077](https://github.com/vitejs/vite/commit/c616077fb8d969714dcbec5ed5ff803759d6a2f6)), closes [#9257](https://github.com/vitejs/vite/issues/9257)
* fix: ssrLoadModule executes code in non-strict mode, fixes #9197 (#9199) ([5866cfb](https://github.com/vitejs/vite/commit/5866cfb2529ef5a5d5258b0fae0b37c3484d1762)), closes [#9197](https://github.com/vitejs/vite/issues/9197) [#9199](https://github.com/vitejs/vite/issues/9199)
* fix: support multiline dynamic imports (#9314) ([e66cf69](https://github.com/vitejs/vite/commit/e66cf69cc27b8a8900f14af746ed6925c8af8fdc)), closes [#9314](https://github.com/vitejs/vite/issues/9314)
* fix: support vite client in safari 13 (#9315) ([2415193](https://github.com/vitejs/vite/commit/2415193006fe1405ac927162d074b70b03ae629f)), closes [#9315](https://github.com/vitejs/vite/issues/9315)
* fix: worker relative base should use import.meta.url (#9204) ([0358b04](https://github.com/vitejs/vite/commit/0358b04d9f1322dbecfdfed05d56c6c2c02c8245)), closes [#9204](https://github.com/vitejs/vite/issues/9204)
* fix(glob): handle glob prop access (#9281) ([0580215](https://github.com/vitejs/vite/commit/0580215b7327be63f9c5e3251fe8c1c634f564ed)), closes [#9281](https://github.com/vitejs/vite/issues/9281)
* fix(scan): handle .ts import as .js alias (#9282) ([0b083ca](https://github.com/vitejs/vite/commit/0b083ca84a1b32f9f2c4d73444d30e0c80abe3b1)), closes [#9282](https://github.com/vitejs/vite/issues/9282)
* fix(ssr): no external symlink package (#9296) ([ea27701](https://github.com/vitejs/vite/commit/ea2770106efe759ad137246980cf4a591eb14780)), closes [#9296](https://github.com/vitejs/vite/issues/9296)
* chore: adjust comments/typos (#9325) ([ffb2ba3](https://github.com/vitejs/vite/commit/ffb2ba39a765177f561baf5f62f22969eaf91c4b)), closes [#9325](https://github.com/vitejs/vite/issues/9325)
* chore: fix code typos (#9033) ([ed02861](https://github.com/vitejs/vite/commit/ed0286186b24748ec7bfa336f83c382363a22f1d)), closes [#9033](https://github.com/vitejs/vite/issues/9033)
* docs: fix `@rollup/plugin-commonjs` name (#9313) ([c417364](https://github.com/vitejs/vite/commit/c41736436af6ef9b8d4e62b3d7733c1e844f7dc6)), closes [#9313](https://github.com/vitejs/vite/issues/9313)
* docs: fix server options link (#9242) ([29db3ea](https://github.com/vitejs/vite/commit/29db3ea4e6d6d5cb1d6891768789063a9bcdbd0f)), closes [#9242](https://github.com/vitejs/vite/issues/9242)
* docs: update browser baseline features (#9316) ([b82ee5d](https://github.com/vitejs/vite/commit/b82ee5d39b8c8de1d3f9a2b4531b58634582ef00)), closes [#9316](https://github.com/vitejs/vite/issues/9316)
* feat: supports cts and mts files (#9268) ([0602017](https://github.com/vitejs/vite/commit/0602017c38f75256353b2146b93f9752713cd235)), closes [#9268](https://github.com/vitejs/vite/issues/9268)
* feat: worker config call config hook (#9212) ([3e510ab](https://github.com/vitejs/vite/commit/3e510abcdb8248d2dd29a871ffd59ce2a9982845)), closes [#9212](https://github.com/vitejs/vite/issues/9212)
* feat(css): use esbuild.log* options when minifying (#9210) ([88baa53](https://github.com/vitejs/vite/commit/88baa53961148d1ffc1c76248fa7122feabf671e)), closes [#9210](https://github.com/vitejs/vite/issues/9210)



## <small>3.0.2 (2022-07-18)</small>

* fix: fs serve only edit pathname (fixes #9148) (#9173) ([28cffc9](https://github.com/vitejs/vite/commit/28cffc94d2cc7dc4932121d8ef835f97f6b0c25e)), closes [#9148](https://github.com/vitejs/vite/issues/9148) [#9173](https://github.com/vitejs/vite/issues/9173)
* fix: prevent null pathname error (#9188) ([d66ffd0](https://github.com/vitejs/vite/commit/d66ffd02801ab7a9f9ef2c2e17f0594d633f933a)), closes [#9188](https://github.com/vitejs/vite/issues/9188)
* fix: return 500 on proxy error only if possible (fixes #9172) (#9193) ([b2f6bdc](https://github.com/vitejs/vite/commit/b2f6bdcf3d2f2788070bfe5145e069a3937cc7dd)), closes [#9172](https://github.com/vitejs/vite/issues/9172) [#9193](https://github.com/vitejs/vite/issues/9193)
* fix(deps): update all non-major dependencies (#9176) ([31d3b70](https://github.com/vitejs/vite/commit/31d3b70672ea8759a8d7ff1993d64bb4f0e30fab)), closes [#9176](https://github.com/vitejs/vite/issues/9176)
* fix(dev): build.ssr is set during dev, fix #9134 (#9187) ([99b0e67](https://github.com/vitejs/vite/commit/99b0e67bfe1c06084c1c81695634527e42af78bc)), closes [#9134](https://github.com/vitejs/vite/issues/9134) [#9187](https://github.com/vitejs/vite/issues/9187)
* fix(ssr): strip NULL_BYTE_PLACEHOLDER before import (#9124) ([c5f2dc7](https://github.com/vitejs/vite/commit/c5f2dc7519d7bf1b5740c05d7137530e2a08699d)), closes [#9124](https://github.com/vitejs/vite/issues/9124)



## <small>3.0.1 (2022-07-18)</small>

* fix: avoid errors when loading the overlay code in workers (#9064) ([a52b45e](https://github.com/vitejs/vite/commit/a52b45ea3d1b0f37effa100a571a7bf267e7c2d6)), closes [#9064](https://github.com/vitejs/vite/issues/9064)
* fix: check server after tsconfig reload (#9106) ([d12d469](https://github.com/vitejs/vite/commit/d12d469dfb8d7466615b085aac0d461ff18a4465)), closes [#9106](https://github.com/vitejs/vite/issues/9106)
* fix: disable keepNames in `vite:esbuild` (fixes #9164) (#9166) ([e6f3b02](https://github.com/vitejs/vite/commit/e6f3b026bd1e281cfad6b19386195b6c2dc94165)), closes [#9164](https://github.com/vitejs/vite/issues/9164) [#9166](https://github.com/vitejs/vite/issues/9166)
* fix: externalize workspace relative import when bundle config (#9140) ([5a8a3ab](https://github.com/vitejs/vite/commit/5a8a3ab5af24ef924958df36d9a41a8c5c009b76)), closes [#9140](https://github.com/vitejs/vite/issues/9140)
* fix: mention that Node.js 13/15 support is dropped (fixes #9113) (#9116) ([2826303](https://github.com/vitejs/vite/commit/2826303bd253e20df2746f84f6a7c06cb5cf3d6b)), closes [#9113](https://github.com/vitejs/vite/issues/9113) [#9116](https://github.com/vitejs/vite/issues/9116)
* fix: resolve drive relative path (#9097) ([b393451](https://github.com/vitejs/vite/commit/b3934516431659b36ccfbfe1a87a3e73595982a6)), closes [#9097](https://github.com/vitejs/vite/issues/9097)
* fix: respect .mjs .cjs extension in all modes (#9141) ([5ea70b3](https://github.com/vitejs/vite/commit/5ea70b3c3cd5f208471338c5832a3eba1aafb01d)), closes [#9141](https://github.com/vitejs/vite/issues/9141)
* fix: return 500 on proxy error only if possible (fixes #9172) (#9175) ([d2f02a8](https://github.com/vitejs/vite/commit/d2f02a848bb2b4f8da0102f00988954d193de59d)), closes [#9172](https://github.com/vitejs/vite/issues/9172) [#9175](https://github.com/vitejs/vite/issues/9175)
* fix: server.proxy ws error causes crash (#9123) ([c2426d1](https://github.com/vitejs/vite/commit/c2426d15c0c000f56cdcbd0a57853407f3ec5911)), closes [#9123](https://github.com/vitejs/vite/issues/9123)
* fix: ssr.external/noExternal should apply to packageName (#9146) ([5844d8e](https://github.com/vitejs/vite/commit/5844d8e3480e7713acfa7655666bf0076dcb8879)), closes [#9146](https://github.com/vitejs/vite/issues/9146)
* fix: use correct require extension to load config (#9118) ([ebf682e](https://github.com/vitejs/vite/commit/ebf682ecea72b8c1a09320a2fafdb6bbf7464feb)), closes [#9118](https://github.com/vitejs/vite/issues/9118)
* fix(esbuild): always support dynamic import and import meta (#9105) ([57a7936](https://github.com/vitejs/vite/commit/57a79362b7a1c8c0229cbf61fbb1c3918c2c1da2)), closes [#9105](https://github.com/vitejs/vite/issues/9105)
* feat: allow declaring dirname (#9154) ([1e078ad](https://github.com/vitejs/vite/commit/1e078ad1902ae980741d6920fc3a72d182fcf179)), closes [#9154](https://github.com/vitejs/vite/issues/9154)
* refactor: always load config with esbuild bundled code (#9121) ([a2b3131](https://github.com/vitejs/vite/commit/a2b313126abdf2e0652502cbcd4b94353c37f91a)), closes [#9121](https://github.com/vitejs/vite/issues/9121)
* docs: update default for optimizeDeps.disabled (#9078) ([4fbf9a8](https://github.com/vitejs/vite/commit/4fbf9a8c55e6453aba0c6dc5d9b16956b33c2227)), closes [#9078](https://github.com/vitejs/vite/issues/9078)
* chore: 3.0 release notes and bump peer deps (#9072) ([427ba26](https://github.com/vitejs/vite/commit/427ba26fa720a11530d135b2ee39876fc9a778fb)), closes [#9072](https://github.com/vitejs/vite/issues/9072)



## 3.0.0 (2022-07-13)

### Main Changes

> **Vite 3 is out!**
> Read the [Vite 3 Announcement blog post](https://vite.dev/blog/announcing-vite3)

- New docs theme using [VitePress](https://vitepress.vuejs.org/) v1 alpha: https://vite.dev
- Vite CLI
  - The default dev server port is now 5173, with the preview server starting at 4173.
  - The default dev server host is now `localhost` instead of `127.0.0.1`.
- Compatibility
  - Vite no longer supports Node v12, which reached its EOL. Node 14.18+ is now required.
  - Vite is now published as ESM, with a CJS proxy to the ESM entry for compatibility.
  - The Modern Browser Baseline now targets browsers which support the [native ES Modules](https://caniuse.com/es6-module) and [native ESM dynamic import](https://caniuse.com/es6-module-dynamic-import) and [`import.meta`](https://caniuse.com/mdn-javascript_statements_import_meta).
  - JS file extensions in SSR and lib mode now use a valid extension (`js`, `mjs`, or `cjs`) for output JS entries and chunks based on their format and the package type.
- Architecture changes
  - Vite now avoids full reload during cold start when imports are injected by plugins in while crawling the initial statically imported modules ([#8869](https://github.com/vitejs/vite/issues/8869)).
  - Vite uses ESM for the SSR build by default, and previous [SSR externalization heuristics](https://vite.dev/guide/ssr.html#ssr-externals) are no longer needed.
- `import.meta.glob` has been improved, read about the new features in the [Glob Import Guide](https://vite.dev/guide/features.html#glob-import)
- The WebAssembly import API has been revised to avoid collisions with future standards. Read more in the [WebAssembly guide](https://vite.dev/guide/features.html#webassembly)
- Improved support for relative base.
- Experimental Features
  - [Build Advanced Base Options](https://vite.dev/guide/build.html#advanced-base-options)
  - [HMR Partial Accept](https://github.com/vitejs/vite/pull/7324)
  - Vite now allows the use of [esbuild to optimize dependencies during build time](https://vite.dev/guide/migration.html#using-esbuild-deps-optimization-at-build-time) avoiding the need of [`@rollup/plugin-commonjs`](https://github.com/rollup/plugins/tree/master/packages/commonjs), removing one of the difference id dependency handling between dev and prod.
- Bundle size reduction
  - Terser is now an optional dependency. If you use `build.minify: 'terser'`, you'll need to install it (`npm add -D terser`)
  - node-forge moved out of the monorepo to [@vitejs/plugin-basic-ssl](https://vite.dev/guide/migration.html#automatic-https-certificate-generation)
- Options that were [already deprecated in v2](https://vite.dev/guide/migration.html#config-options-changes) have been removed.

> **Note**
> Before updating, check out the [migration guide from v2](https://vite.dev/guide/migration)

### Features

* feat: expose server resolved urls (#8986) ([26bcdc3](https://github.com/vitejs/vite/commit/26bcdc3186807bb6f3817119cd7e64ae8308a057)), closes [#8986](https://github.com/vitejs/vite/issues/8986)
* feat: show ws connection error (#9007) ([da7c3ae](https://github.com/vitejs/vite/commit/da7c3aeac254a028deef2c7387bbf28447c7410a)), closes [#9007](https://github.com/vitejs/vite/issues/9007)
* docs: update api-javascript (#8999) ([05b17df](https://github.com/vitejs/vite/commit/05b17dfcdf0c6d792a7ec5d9cf9a11e17ac79b6c)), closes [#8999](https://github.com/vitejs/vite/issues/8999)
* refactor: opt-in optimizeDeps during build and SSR (#8965) ([f8c8cf2](https://github.com/vitejs/vite/commit/f8c8cf272345364e8a6181725335e95b957ba8c4)), closes [#8965](https://github.com/vitejs/vite/issues/8965)
* refactor!: move basic ssl setup to external plugin, fix #8532 (#8961) ([5c6cf5a](https://github.com/vitejs/vite/commit/5c6cf5a2a6577fb8e8ecc66a0411143af3fed042)), closes [#8532](https://github.com/vitejs/vite/issues/8532) [#8961](https://github.com/vitejs/vite/issues/8961)
* feat: avoid scanner during build and only optimize CJS in SSR (#8932) ([339d9e3](https://github.com/vitejs/vite/commit/339d9e394620c843c9c0c9c8afc4d77e27879620)), closes [#8932](https://github.com/vitejs/vite/issues/8932)
* feat: improved cold start using deps scanner (#8869) ([188f188](https://github.com/vitejs/vite/commit/188f1881eb9c280eaf34103253f1e6fea20bc274)), closes [#8869](https://github.com/vitejs/vite/issues/8869)
* feat: ssr.optimizeDeps (#8917) ([f280dd9](https://github.com/vitejs/vite/commit/f280dd99856af68a47635dda609c402333805209)), closes [#8917](https://github.com/vitejs/vite/issues/8917)
* feat: support import assertions (#8937) ([2390422](https://github.com/vitejs/vite/commit/2390422aaa5e6d1a34ddb7bcab8657e632922396)), closes [#8937](https://github.com/vitejs/vite/issues/8937)
* feat: accept AcceptedPlugin type for postcss plugin (#8830) ([6886078](https://github.com/vitejs/vite/commit/68860782bcac8d2b30f6d19f8112fe6131057e60)), closes [#8830](https://github.com/vitejs/vite/issues/8830)
* feat: ssrBuild flag in config env (#8863) ([b6d655a](https://github.com/vitejs/vite/commit/b6d655ac73631bfdcc41c4534652c864dcc00b76)), closes [#8863](https://github.com/vitejs/vite/issues/8863)
* feat: experimental.renderBuiltUrl (revised build base options) (#8762) ([895a7d6](https://github.com/vitejs/vite/commit/895a7d66bc93beaf18ebcbee23b00fda9ca4c33c)), closes [#8762](https://github.com/vitejs/vite/issues/8762)
* feat: respect esbuild minify config for css (#8811) ([d90409e](https://github.com/vitejs/vite/commit/d90409e2afa91c34d124a28b8c9cadc915815617)), closes [#8811](https://github.com/vitejs/vite/issues/8811)
* feat: use esbuild supported feature (#8665) ([2061d41](https://github.com/vitejs/vite/commit/2061d418c941640294b87887b8eaf4ec9e65165f)), closes [#8665](https://github.com/vitejs/vite/issues/8665)
* feat: respect esbuild minify config (#8754) ([8b77695](https://github.com/vitejs/vite/commit/8b77695870d16e030392fe2ef9826140e61c6e82)), closes [#8754](https://github.com/vitejs/vite/issues/8754)
* feat: update rollup commonjs plugin to v22  (#8743) ([d4dcdd1](https://github.com/vitejs/vite/commit/d4dcdd1ffaea79ecf8a9fc78cdbe311f0d801fb5)), closes [#8743](https://github.com/vitejs/vite/issues/8743)
* feat: enable tree-shaking for lib es (#8737) ([5dc0f72](https://github.com/vitejs/vite/commit/5dc0f72525c10b528bb5fdf44add67b10c74112c)), closes [#8737](https://github.com/vitejs/vite/issues/8737)
* feat: supports cts and mts config (#8729) ([c2b09db](https://github.com/vitejs/vite/commit/c2b09db1bf78c09df20d209a28568b0851ce5c31)), closes [#8729](https://github.com/vitejs/vite/issues/8729)
* feat: bump minimum node version to 14.18.0 (#8662) ([8a05432](https://github.com/vitejs/vite/commit/8a05432e6dcc0e11d78c7b029e7340fa47fceb92)), closes [#8662](https://github.com/vitejs/vite/issues/8662)
* feat: experimental.buildAdvancedBaseOptions (#8450) ([8ef7333](https://github.com/vitejs/vite/commit/8ef733368fd6618a252e44616f7577f593fd4fbc)), closes [#8450](https://github.com/vitejs/vite/issues/8450)
* feat: export esbuildVersion and rollupVersion (#8675) ([15ebe1e](https://github.com/vitejs/vite/commit/15ebe1e6df2e79bc22e123efedb46d87063ad3d6)), closes [#8675](https://github.com/vitejs/vite/issues/8675)
* feat: print resolved address for localhost (#8647) ([eb52d36](https://github.com/vitejs/vite/commit/eb52d36a2cbdf6182691ac3ec5cb6d28d1ac73ad)), closes [#8647](https://github.com/vitejs/vite/issues/8647)
* feat(hmr): experimental.hmrPartialAccept (#7324) ([83dab7e](https://github.com/vitejs/vite/commit/83dab7e049550a66f58814a0c5ebc87413a923fd)), closes [#7324](https://github.com/vitejs/vite/issues/7324)
* refactor: type client maps (#8626) ([cf87882](https://github.com/vitejs/vite/commit/cf87882130e991fa4f26782a462c503faf8e5f9f)), closes [#8626](https://github.com/vitejs/vite/issues/8626)
* feat: cleaner default dev output (#8638) ([dbd9688](https://github.com/vitejs/vite/commit/dbd96882d9c6f442f442cc9675257acc77675810)), closes [#8638](https://github.com/vitejs/vite/issues/8638)
* feat: legacy options to revert to v2 strategies (#8623) ([993b842](https://github.com/vitejs/vite/commit/993b842cff9f743cb969e749e7052a2cbb665919)), closes [#8623](https://github.com/vitejs/vite/issues/8623)
* feat: support async plugins (#8574) ([caa8a58](https://github.com/vitejs/vite/commit/caa8a58e5bd252973dd4a9da6bb1d375aa1700e9)), closes [#8574](https://github.com/vitejs/vite/issues/8574)
* feat: support cjs noExternal in SSR dev, fix #2579 (#8430) ([11d2191](https://github.com/vitejs/vite/commit/11d21911b9eb9796bf0096c36dfa92aa336e04a8)), closes [#2579](https://github.com/vitejs/vite/issues/2579) [#8430](https://github.com/vitejs/vite/issues/8430)
* feat(dev): added assets to manifest (#6649) ([cdf744d](https://github.com/vitejs/vite/commit/cdf744d8ffb44bc374212e8fd5b1f12123353220)), closes [#6649](https://github.com/vitejs/vite/issues/6649)
* feat!: appType (spa, mpa, custom), boolean middlewareMode (#8452) ([14db473](https://github.com/vitejs/vite/commit/14db47397b0a9f99923a326bbd23c2df7c5b6745)), closes [#8452](https://github.com/vitejs/vite/issues/8452)
* feat: 500 response if the node proxy request fails (#7398) ([73e1775](https://github.com/vitejs/vite/commit/73e17750022749515efd9413480ae02fb9244bb9)), closes [#7398](https://github.com/vitejs/vite/issues/7398)
* feat: expose createFilter util (#8562) ([c5c424a](https://github.com/vitejs/vite/commit/c5c424a93cf97e254dae46a35ad6de46ec350a16)), closes [#8562](https://github.com/vitejs/vite/issues/8562)
* feat: better config `__dirname` support (#8442) ([51e9195](https://github.com/vitejs/vite/commit/51e9195fe94657e7ab14a22a0e7de338ad0724fd)), closes [#8442](https://github.com/vitejs/vite/issues/8442)
* feat: expose `version` (#8456) ([e992594](https://github.com/vitejs/vite/commit/e9925948fd4e199625bbb25ee931bed1d50e9618)), closes [#8456](https://github.com/vitejs/vite/issues/8456)
* feat: handle named imports of builtin modules (#8338) ([e2e44ff](https://github.com/vitejs/vite/commit/e2e44ff32b7b2bcbcae793cdcda263d1ad495fc0)), closes [#8338](https://github.com/vitejs/vite/issues/8338)
* feat: preserve process env vars in lib build (#8090) ([908c9e4](https://github.com/vitejs/vite/commit/908c9e4cdd2cceb0f01495e38066ffe33c21ddb8)), closes [#8090](https://github.com/vitejs/vite/issues/8090)
* refactor!: make terser an optional dependency (#8049) ([164f528](https://github.com/vitejs/vite/commit/164f528838f3a146c82d68992d38316b9214f9b8)), closes [#8049](https://github.com/vitejs/vite/issues/8049)
* chore: resolve ssr options (#8455) ([d97e402](https://github.com/vitejs/vite/commit/d97e4022c4253c42e44483b9c88a7c2b76a713a8)), closes [#8455](https://github.com/vitejs/vite/issues/8455)
* perf: disable postcss sourcemap when unused (#8451) ([64fc61c](https://github.com/vitejs/vite/commit/64fc61cf76cc62b1cafc2c3dab738c22cb7f2d2b)), closes [#8451](https://github.com/vitejs/vite/issues/8451)
* feat: add ssr.format to force esm output for ssr (#6812) ([337b197](https://github.com/vitejs/vite/commit/337b1979c2f0190e9484733fb2c7fb99353474c2)), closes [#6812](https://github.com/vitejs/vite/issues/6812)
* feat: default esm SSR build, simplified externalization (#8348) ([f8c92d1](https://github.com/vitejs/vite/commit/f8c92d1f4c1bddb6c29cfd4753079157c4d96922)), closes [#8348](https://github.com/vitejs/vite/issues/8348)
* feat: derive proper js extension from package type (#8382) ([95cdd81](https://github.com/vitejs/vite/commit/95cdd81334fccec6af3659232fec62237c40dcca)), closes [#8382](https://github.com/vitejs/vite/issues/8382)
* feat: ssr build using optimized deps (#8403) ([6a5a5b5](https://github.com/vitejs/vite/commit/6a5a5b5273c83a9f1958a1a2f753fd74be1ad2b0)), closes [#8403](https://github.com/vitejs/vite/issues/8403)
* refactor: `ExportData.imports` to `ExportData.hasImports` (#8355) ([168de2d](https://github.com/vitejs/vite/commit/168de2d6f07ec49896fa46b5a4935c29d2800300)), closes [#8355](https://github.com/vitejs/vite/issues/8355)
* feat: scan free dev server (#8319) ([3f742b6](https://github.com/vitejs/vite/commit/3f742b6dcb8664f0bd1e304da8c1ea67d1f383a4)), closes [#8319](https://github.com/vitejs/vite/issues/8319)
* feat: non-blocking esbuild optimization at build time (#8280) ([909cf9c](https://github.com/vitejs/vite/commit/909cf9c01bcd2561a00fcc6df1006b65eec0d47e)), closes [#8280](https://github.com/vitejs/vite/issues/8280)
* feat: non-blocking needs interop (#7568) ([531cd7b](https://github.com/vitejs/vite/commit/531cd7bd0a6537cdabcd741dfb068e616af4dfbc)), closes [#7568](https://github.com/vitejs/vite/issues/7568)
* refactor(cli): improve output aesthetics (#6997) ([809ab47](https://github.com/vitejs/vite/commit/809ab479d31d00e461a692bab45e132c95117ece)), closes [#6997](https://github.com/vitejs/vite/issues/6997)
* dx: sourcemap combine debug utils (#8307) ([45dba50](https://github.com/vitejs/vite/commit/45dba509024fa12d26daf2dc59cf3a14fe896b54)), closes [#8307](https://github.com/vitejs/vite/issues/8307)
* feat: sourcemap for importAnalysis (#8258) ([a4e4d39](https://github.com/vitejs/vite/commit/a4e4d394589e832849ae8f28dd12a94166cbdbce)), closes [#8258](https://github.com/vitejs/vite/issues/8258)
* feat: spa option, `preview` and `dev` for MPA and SSR apps (#8217) ([d7cba46](https://github.com/vitejs/vite/commit/d7cba466febd5127e82573f69b1f7b866517a299)), closes [#8217](https://github.com/vitejs/vite/issues/8217)
* feat: vite connected logs changed to console.debug (#7733) ([9f00c41](https://github.com/vitejs/vite/commit/9f00c419bc36bee40e464d2282b33bb2e6574010)), closes [#7733](https://github.com/vitejs/vite/issues/7733)
* feat: worker support query url (#7914) ([95297dd](https://github.com/vitejs/vite/commit/95297dd1846318697f6b3b40752ba9fa43664d1a)), closes [#7914](https://github.com/vitejs/vite/issues/7914)
* feat(wasm): new wasm plugin (`.wasm?init`) (#8219) ([75c3bf6](https://github.com/vitejs/vite/commit/75c3bf65694bc89b395e03dabb81721871d24a9c)), closes [#8219](https://github.com/vitejs/vite/issues/8219)
* build!: bump targets (#8045) ([66efd69](https://github.com/vitejs/vite/commit/66efd69a399fd73284cc7a3bffc904e154291a14)), closes [#8045](https://github.com/vitejs/vite/issues/8045)
* feat!: migrate to ESM (#8178) ([76fdc27](https://github.com/vitejs/vite/commit/76fdc27437d37534cf157bf869a648e0d176b267)), closes [#8178](https://github.com/vitejs/vite/issues/8178)
* feat!: relative base (#7644) ([09648c2](https://github.com/vitejs/vite/commit/09648c220a67852c38da0ba742501a15837e16c2)), closes [#7644](https://github.com/vitejs/vite/issues/7644)
* feat(css): warn if url rewrite has no importer (#8183) ([0858450](https://github.com/vitejs/vite/commit/0858450b2a258b216ae9aa797cc02e9a0d4eb0af)), closes [#8183](https://github.com/vitejs/vite/issues/8183)
* feat: allow any JS identifier in define, not ASCII-only (#5972) ([95eb45b](https://github.com/vitejs/vite/commit/95eb45b15fa66b8e9707adfbed315d4a57d5c5ed)), closes [#5972](https://github.com/vitejs/vite/issues/5972)
* feat: enable `generatedCode: 'es2015'` for rollup build (#5018) ([46d5e67](https://github.com/vitejs/vite/commit/46d5e6731a86301989e1b12d983d82180f956595)), closes [#5018](https://github.com/vitejs/vite/issues/5018)
* feat: rework `dynamic-import-vars` (#7756) ([80d113b](https://github.com/vitejs/vite/commit/80d113b1d6df6c97ad2a3dcd27be8a7e27103141)), closes [#7756](https://github.com/vitejs/vite/issues/7756)
* feat: worker emit fileName with config (#7804) ([04c2edd](https://github.com/vitejs/vite/commit/04c2edd80f654a9e3c23e59d8b9060caa28e459e)), closes [#7804](https://github.com/vitejs/vite/issues/7804)
* feat(glob-import): support `{ import: '*' }` (#8071) ([0b78b2a](https://github.com/vitejs/vite/commit/0b78b2a40e5809bde51df8d4873f64226ee7fe3d)), closes [#8071](https://github.com/vitejs/vite/issues/8071)
* build!: remove node v12 support (#7833) ([eeac2d2](https://github.com/vitejs/vite/commit/eeac2d2e217ddbca79d5b1dfde9bb5097e821b6a)), closes [#7833](https://github.com/vitejs/vite/issues/7833)
* feat!: rework `import.meta.glob` (#7537) ([330e0a9](https://github.com/vitejs/vite/commit/330e0a90988509454e31067984bf0cdbe2465325)), closes [#7537](https://github.com/vitejs/vite/issues/7537)
* feat!: vite dev default port is now 5173 (#8148) ([1cc2e2d](https://github.com/vitejs/vite/commit/1cc2e2d2d5db55fd54f4e0cc8f3dbc1176706ea6)), closes [#8148](https://github.com/vitejs/vite/issues/8148)
* refactor: remove deprecated api for 3.0 (#5868) ([b5c3709](https://github.com/vitejs/vite/commit/b5c370941bb36bdb420433ca16cea9c2402b9810)), closes [#5868](https://github.com/vitejs/vite/issues/5868)
* chore: stabilize experimental api (#7707) ([b902932](https://github.com/vitejs/vite/commit/b9029320fdf3c2e1f4cf98a87a45a691557228ad)), closes [#7707](https://github.com/vitejs/vite/issues/7707)
* test: migrate to vitest (#8076) ([8148f67](https://github.com/vitejs/vite/commit/8148f67f4a78265ca666737b15709c3c7578e370)), closes [#8076](https://github.com/vitejs/vite/issues/8076)

### Bug Fixes

* fix: prevent production node_env in serve (#9066) ([7662998](https://github.com/vitejs/vite/commit/7662998d90f628d148fdffd5913e633fe0fb0978)), closes [#9066](https://github.com/vitejs/vite/issues/9066)
* fix: reload on restart with middleware mode (fixes #9038) (#9040) ([e372693](https://github.com/vitejs/vite/commit/e37269376d915c943bd9073081ad2ab3d1c0da1b)), closes [#9038](https://github.com/vitejs/vite/issues/9038) [#9040](https://github.com/vitejs/vite/issues/9040)
* fix: remove ws is already closed error (#9041) ([45b8b53](https://github.com/vitejs/vite/commit/45b8b532fa2a1a91c8557b779b7ea2d5f10b672c)), closes [#9041](https://github.com/vitejs/vite/issues/9041)
* fix(ssr): sourcemap content (fixes #8657) (#8997) ([aff4544](https://github.com/vitejs/vite/commit/aff4544d7ed85fd21e9c21abcb532dc72fe6540b)), closes [#8657](https://github.com/vitejs/vite/issues/8657) [#8997](https://github.com/vitejs/vite/issues/8997)
* fix: respect explicitly external/noExternal config (#8983) ([e369880](https://github.com/vitejs/vite/commit/e36988014ba1982768ab8a9544b0b5308e37383c)), closes [#8983](https://github.com/vitejs/vite/issues/8983)
* fix: cjs interop export names local clash, fix #8950 (#8953) ([2185f72](https://github.com/vitejs/vite/commit/2185f7236e91361304b197de8c9b84b66511be73)), closes [#8950](https://github.com/vitejs/vite/issues/8950) [#8953](https://github.com/vitejs/vite/issues/8953)
* fix: handle context resolve options (#8966) ([57c6c15](https://github.com/vitejs/vite/commit/57c6c158ca0546962d0644f9ea3ee1bddbbaaf2c)), closes [#8966](https://github.com/vitejs/vite/issues/8966)
* fix: re-encode url to prevent fs.allow bypass (fixes #8498) (#8979) ([b835699](https://github.com/vitejs/vite/commit/b8356991c0a7dae32fb70b613460f15027915aa7)), closes [#8498](https://github.com/vitejs/vite/issues/8498) [#8979](https://github.com/vitejs/vite/issues/8979)
* fix(scan): detect import .ts as .js (#8969) ([752af6c](https://github.com/vitejs/vite/commit/752af6ce18b2ed01ea8d233665ca31faf0e223d3)), closes [#8969](https://github.com/vitejs/vite/issues/8969)
* fix: ssrBuild is optional, avoid breaking VitePress (#8912) ([722f514](https://github.com/vitejs/vite/commit/722f5148ea494cdc15379d3a98dca0751131ca22)), closes [#8912](https://github.com/vitejs/vite/issues/8912)
* fix(css): always use css module content (#8936) ([6e0dd3a](https://github.com/vitejs/vite/commit/6e0dd3aa9d1b806dbe4abb07f18b191e225d7f41)), closes [#8936](https://github.com/vitejs/vite/issues/8936)
* fix: avoid optimizing non-optimizable external deps (#8860) ([cd8d63b](https://github.com/vitejs/vite/commit/cd8d63bcdef521f82d097ea3db6bdacbb848603c)), closes [#8860](https://github.com/vitejs/vite/issues/8860)
* fix: ensure define overrides import.meta in build (#8892) ([7d810a9](https://github.com/vitejs/vite/commit/7d810a9e157b232c44490bee8016a08bc9167c50)), closes [#8892](https://github.com/vitejs/vite/issues/8892)
* fix: ignore Playwright test results directory (#8778) ([314c09c](https://github.com/vitejs/vite/commit/314c09c16bc0747babfd5eef01801928104951d5)), closes [#8778](https://github.com/vitejs/vite/issues/8778)
* fix: node platform for ssr dev regression (#8840) ([7257fd8](https://github.com/vitejs/vite/commit/7257fd8b34d923192b54e9eb4f1774a9f7a68c57)), closes [#8840](https://github.com/vitejs/vite/issues/8840)
* fix: optimize deps on dev SSR, builtin imports in node (#8854) ([d49856c](https://github.com/vitejs/vite/commit/d49856c096084bd1af6c98e7fabd1441715943c2)), closes [#8854](https://github.com/vitejs/vite/issues/8854)
* fix: prevent crash when the pad amount is negative (#8747) ([3af6a1b](https://github.com/vitejs/vite/commit/3af6a1b401a574c78695dbf7fe39152bca1e304b)), closes [#8747](https://github.com/vitejs/vite/issues/8747)
* fix: reverts #8278 ([a0da2f0](https://github.com/vitejs/vite/commit/a0da2f0996ec669a240c02178367f0e976abb28c)), closes [#8278](https://github.com/vitejs/vite/issues/8278)
* fix: server.force deprecation and force on restart API (#8842) ([c94f564](https://github.com/vitejs/vite/commit/c94f564912d4aafe82ea7deabefc65fceb9184e8)), closes [#8842](https://github.com/vitejs/vite/issues/8842)
* fix(deps): update all non-major dependencies (#8802) ([a4a634d](https://github.com/vitejs/vite/commit/a4a634d6a08f8b54f052cfc2cc1b60c1bca6d48a)), closes [#8802](https://github.com/vitejs/vite/issues/8802)
* fix(hmr): set isSelfAccepting unless it is delayed (#8898) ([ae34565](https://github.com/vitejs/vite/commit/ae345654197168e61395b088969fae577483d12a)), closes [#8898](https://github.com/vitejs/vite/issues/8898)
* fix(worker): dont throw on `import.meta.url` in ssr (#8846) ([ef749ed](https://github.com/vitejs/vite/commit/ef749ed726562d65b5b5eabcadb851e0efb8a3c1)), closes [#8846](https://github.com/vitejs/vite/issues/8846)
* fix: deps optimizer should wait on entries (#8822) ([2db1b5b](https://github.com/vitejs/vite/commit/2db1b5beb2444498f3db523b551dabd68a130b53)), closes [#8822](https://github.com/vitejs/vite/issues/8822)
* fix: incorrectly resolving `knownJsSrcRE` files from root (fixes #4161) (#8808) ([e1e426e](https://github.com/vitejs/vite/commit/e1e426e45de51660a48e832775007e7731db07f7)), closes [#4161](https://github.com/vitejs/vite/issues/4161) [#8808](https://github.com/vitejs/vite/issues/8808)
* fix: /@fs/ dir traversal with escaped chars (fixes #8498) (#8804) ([6851009](https://github.com/vitejs/vite/commit/6851009e6725b17608113a5a63474280075cae1c)), closes [#8498](https://github.com/vitejs/vite/issues/8498) [#8804](https://github.com/vitejs/vite/issues/8804)
* fix: preserve extension of css assets in the manifest (#8768) ([9508549](https://github.com/vitejs/vite/commit/9508549f1ec19d9485f7ba7c1847972051ae15e9)), closes [#8768](https://github.com/vitejs/vite/issues/8768)
* fix: always remove temp config (#8782) ([2c2a86b](https://github.com/vitejs/vite/commit/2c2a86bf8d050906060a2bd7c15b44e43bb069a1)), closes [#8782](https://github.com/vitejs/vite/issues/8782)
* fix: ensure deps optimizer first run, fixes #8750 (#8775) ([3f689a4](https://github.com/vitejs/vite/commit/3f689a4491cf2d63ff1d98a57422c6b4aa8a0f03)), closes [#8750](https://github.com/vitejs/vite/issues/8750) [#8775](https://github.com/vitejs/vite/issues/8775)
* fix: remove buildTimeImportMetaUrl (#8785) ([cd32095](https://github.com/vitejs/vite/commit/cd320952286bc57acb814c5b8b13b1f73e217ebd)), closes [#8785](https://github.com/vitejs/vite/issues/8785)
* fix: skip inline html (#8789) ([4a6408b](https://github.com/vitejs/vite/commit/4a6408b6bb6486a61c410df74f968098a72ae0bd)), closes [#8789](https://github.com/vitejs/vite/issues/8789)
* fix(optimizer): only run require-import conversion if require'd (#8795) ([7ae0d3e](https://github.com/vitejs/vite/commit/7ae0d3e60e2b875d064a8c78766d381c0488fd8e)), closes [#8795](https://github.com/vitejs/vite/issues/8795)
* perf: avoid sourcemap chains during dev (#8796) ([1566f61](https://github.com/vitejs/vite/commit/1566f6141a75cdbd6f33b0cc999611314e5af8ec)), closes [#8796](https://github.com/vitejs/vite/issues/8796)
* perf(lib): improve helper inject regex (#8741) ([19fc7e5](https://github.com/vitejs/vite/commit/19fc7e5fc480b061c154b06a5a83a552b3fbd883)), closes [#8741](https://github.com/vitejs/vite/issues/8741)
* fix: avoid type mismatch with Rollup (fix #7843) (#8701) ([87e51f7](https://github.com/vitejs/vite/commit/87e51f7abe8a033acef52d896abb3c7b0c530976)), closes [#7843](https://github.com/vitejs/vite/issues/7843) [#8701](https://github.com/vitejs/vite/issues/8701)
* fix: optimizeDeps.entries transformRequest url (fix #8719) (#8748) ([9208c3b](https://github.com/vitejs/vite/commit/9208c3b31dbd42540e0df953732b0352f06e8791)), closes [#8719](https://github.com/vitejs/vite/issues/8719) [#8748](https://github.com/vitejs/vite/issues/8748)
* fix(hmr): __HMR_PORT__ should not be `'undefined'` (#8761) ([3271266](https://github.com/vitejs/vite/commit/32712668f6586734afa592384e325e9a8b528fe9)), closes [#8761](https://github.com/vitejs/vite/issues/8761)
* fix: respect `rollupOptions.external` for transitive dependencies (#8679) ([4f9097b](https://github.com/vitejs/vite/commit/4f9097be44cf9508d119a9f71ac27661f2349fb7)), closes [#8679](https://github.com/vitejs/vite/issues/8679)
* fix: use esbuild platform browser/node instead of neutral (#8714) ([a201cd4](https://github.com/vitejs/vite/commit/a201cd495f5965fde13ad549fbee06132f66fed4)), closes [#8714](https://github.com/vitejs/vite/issues/8714)
* fix: disable inlineDynamicImports for ssr.target = node (#8641) ([3b41a8e](https://github.com/vitejs/vite/commit/3b41a8eb1006ae636e2b01b8416327e001625df4)), closes [#8641](https://github.com/vitejs/vite/issues/8641)
* fix: infer hmr ws target by client location (#8650) ([4061ee0](https://github.com/vitejs/vite/commit/4061ee02bfdc7a3264136e838623da27b428e7aa)), closes [#8650](https://github.com/vitejs/vite/issues/8650)
* fix: non-relative base public paths in CSS files (#8682) ([d11d6ea](https://github.com/vitejs/vite/commit/d11d6eaeeaa0fc9da05ae7b9b6e7cce33567762d)), closes [#8682](https://github.com/vitejs/vite/issues/8682)
* fix: SSR with relative base (#8683) ([c1667bb](https://github.com/vitejs/vite/commit/c1667bb8db9c598dd49e0e2c2f246e7af97bbdc4)), closes [#8683](https://github.com/vitejs/vite/issues/8683)
* fix: filter of BOM tags in json plugin (#8628) ([e10530b](https://github.com/vitejs/vite/commit/e10530ba2c76374943b2e012800697cd30852fe6)), closes [#8628](https://github.com/vitejs/vite/issues/8628)
* fix: revert #5902, fix #8243 (#8654) ([1b820da](https://github.com/vitejs/vite/commit/1b820da124e9b0864df60a08e72240f5f4446ef1)), closes [#8243](https://github.com/vitejs/vite/issues/8243) [#8654](https://github.com/vitejs/vite/issues/8654)
* fix(optimizer): use simple browser external shim in prod (#8630) ([a32c4ba](https://github.com/vitejs/vite/commit/a32c4bad5fd937874dc721fbcfb96ba1d4de4122)), closes [#8630](https://github.com/vitejs/vite/issues/8630)
* fix(server): skip localhost verbatim dns lookup (#8642) ([7632247](https://github.com/vitejs/vite/commit/763224755647f0cda91282e119a2726118b383a2)), closes [#8642](https://github.com/vitejs/vite/issues/8642)
* fix(wasm): support inlined WASM in Node < v16 (fix #8620) (#8622) ([f586b14](https://github.com/vitejs/vite/commit/f586b14c20874c869f363f068e5e9fc0ff79d354)), closes [#8620](https://github.com/vitejs/vite/issues/8620) [#8622](https://github.com/vitejs/vite/issues/8622)
* fix: allow cache overlap in parallel builds (#8592) ([2dd0b49](https://github.com/vitejs/vite/commit/2dd0b49bb1c7fb479bb535f28bbefcd3e57fa23d)), closes [#8592](https://github.com/vitejs/vite/issues/8592)
* fix: avoid replacing defines and NODE_ENV in optimized deps (fix #8593) (#8606) ([739175b](https://github.com/vitejs/vite/commit/739175b2f65d7ce46ce3b79cfc1efd416651c2a5)), closes [#8593](https://github.com/vitejs/vite/issues/8593) [#8606](https://github.com/vitejs/vite/issues/8606)
* fix: sequential injection of tags in transformIndexHtml (#5851) (#6901) ([649c7f6](https://github.com/vitejs/vite/commit/649c7f60525ec4755f147312475cb473b80d7d5e)), closes [#5851](https://github.com/vitejs/vite/issues/5851) [#6901](https://github.com/vitejs/vite/issues/6901)
* fix(asset): respect assetFileNames if rollupOptions.output is an array (#8561) ([4e6c26f](https://github.com/vitejs/vite/commit/4e6c26f6c355ec3aac2a277961c3280f8eaa21b0)), closes [#8561](https://github.com/vitejs/vite/issues/8561)
* fix(css): escape pattern chars from base path in postcss dir-dependency messages (#7081) ([5151e74](https://github.com/vitejs/vite/commit/5151e7466bdb86066991b77df8db6ada066bb71f)), closes [#7081](https://github.com/vitejs/vite/issues/7081)
* fix(optimizer): browser mapping for yarn pnp (#6493) ([c1c7af3](https://github.com/vitejs/vite/commit/c1c7af3cb95acca117e1fea0f8441548c39a51ce)), closes [#6493](https://github.com/vitejs/vite/issues/6493)
* fix: add missed JPEG file extensions to `KNOWN_ASSET_TYPES` (#8565) ([2dfc015](https://github.com/vitejs/vite/commit/2dfc0152be6ed531fdebe7dc76314ac9f80b7b1d)), closes [#8565](https://github.com/vitejs/vite/issues/8565)
* fix: default export module transformation for vitest spy (#8567) ([d357e33](https://github.com/vitejs/vite/commit/d357e33846d08879f14f97bacc686475615d3725)), closes [#8567](https://github.com/vitejs/vite/issues/8567)
* fix: default host to `localhost` instead of `127.0.0.1` (#8543) ([49c0896](https://github.com/vitejs/vite/commit/49c089662916bb2c0ae2aae649c7c8b714509922)), closes [#8543](https://github.com/vitejs/vite/issues/8543)
* fix: dont handle sigterm in middleware mode (#8550) ([c6f43dd](https://github.com/vitejs/vite/commit/c6f43ddd161a3a527f4051785ea04459aef991d5)), closes [#8550](https://github.com/vitejs/vite/issues/8550)
* fix: mime missing extensions (#8568) ([acf3024](https://github.com/vitejs/vite/commit/acf3024779308b05626d254189a786c74363fb9b)), closes [#8568](https://github.com/vitejs/vite/issues/8568)
* fix: objurl for type module, and concurrent tests (#8541) ([26ecd5a](https://github.com/vitejs/vite/commit/26ecd5a7179cef6e132e73a77939ac14fd926b49)), closes [#8541](https://github.com/vitejs/vite/issues/8541)
* fix: outdated optimized dep removed from module graph (#8533) ([3f4d22d](https://github.com/vitejs/vite/commit/3f4d22d1f3361ec3013e15288d1a1f16c615a121)), closes [#8533](https://github.com/vitejs/vite/issues/8533)
* fix(config): only rewrite .js loader in `loadConfigFromBundledFile` (#8556) ([2548dd3](https://github.com/vitejs/vite/commit/2548dd367ff97fbe094a02128b08840a492ef24a)), closes [#8556](https://github.com/vitejs/vite/issues/8556)
* fix(deps): update all non-major dependencies (#8558) ([9a1fd4c](https://github.com/vitejs/vite/commit/9a1fd4ccf8986dd92b85563e7304b2591f782365)), closes [#8558](https://github.com/vitejs/vite/issues/8558)
* fix(ssr): dont replace rollup input (#7275) ([9a88afa](https://github.com/vitejs/vite/commit/9a88afa6077286c03e180e4f983b1d194d03b338)), closes [#7275](https://github.com/vitejs/vite/issues/7275)
* fix: deps optimizer idle logic for workers (fix #8479) (#8511) ([1e05548](https://github.com/vitejs/vite/commit/1e055489595476822f0183248f1029bd2d165785)), closes [#8479](https://github.com/vitejs/vite/issues/8479) [#8511](https://github.com/vitejs/vite/issues/8511)
* fix: not match \n when injecting esbuild helpers (#8414) ([5a57626](https://github.com/vitejs/vite/commit/5a57626fcb4bd86f05d01e2aaca486d22d04f51b)), closes [#8414](https://github.com/vitejs/vite/issues/8414)
* fix: respect optimize deps entries (#8489) ([fba82d0](https://github.com/vitejs/vite/commit/fba82d0ff66d2a13393b052dd95df9e180db663c)), closes [#8489](https://github.com/vitejs/vite/issues/8489)
* fix(optimizer): encode `_` and `.` in different way (#8508) ([9065b37](https://github.com/vitejs/vite/commit/9065b3758f00fe1fdeeddbfc6baae38122ceeadd)), closes [#8508](https://github.com/vitejs/vite/issues/8508)
* fix(optimizer): external require-import conversion (fixes #2492, #3409) (#8459) ([1061bbd](https://github.com/vitejs/vite/commit/1061bbdaf81c2808ed8a86946cf0e07a0d8e5b13)), closes [#2492](https://github.com/vitejs/vite/issues/2492) [#3409](https://github.com/vitejs/vite/issues/3409) [#8459](https://github.com/vitejs/vite/issues/8459)
* fix: make array `acornInjectPlugins` work (fixes #8410) (#8415) ([08d594b](https://github.com/vitejs/vite/commit/08d594b823d2c82b7eb5301e5564a1d6aad79d66)), closes [#8410](https://github.com/vitejs/vite/issues/8410) [#8415](https://github.com/vitejs/vite/issues/8415)
* fix: SSR deep imports externalization (fixes #8420) (#8421) ([89d6711](https://github.com/vitejs/vite/commit/89d6711cd97c66d63eb20e6aad72459a0324e7a7)), closes [#8420](https://github.com/vitejs/vite/issues/8420) [#8421](https://github.com/vitejs/vite/issues/8421)
* fix: `import.meta.accept()` -> `import.meta.hot.accept()` (#8361) ([c5185cf](https://github.com/vitejs/vite/commit/c5185cfc9ab27f0f79e394e87a04b39bcc154f95)), closes [#8361](https://github.com/vitejs/vite/issues/8361)
* fix: return type of `handleHMRUpdate` (#8367) ([79d5ce1](https://github.com/vitejs/vite/commit/79d5ce1b1e166033ac9a8e04ddb8b83aa92c0c29)), closes [#8367](https://github.com/vitejs/vite/issues/8367)
* fix: sourcemap source point to null (#8299) ([356b896](https://github.com/vitejs/vite/commit/356b8969981a452fec8554372c49a672c7a49192)), closes [#8299](https://github.com/vitejs/vite/issues/8299)
* fix: ssr-manifest no base (#8371) ([37eb5b3](https://github.com/vitejs/vite/commit/37eb5b3efd3ac4ae91daa7ad4df1ba87bcafbeff)), closes [#8371](https://github.com/vitejs/vite/issues/8371)
* fix(deps): update all non-major dependencies (#8391) ([842f995](https://github.com/vitejs/vite/commit/842f995ca69600c4c06c46d202fe713b80373418)), closes [#8391](https://github.com/vitejs/vite/issues/8391)
* fix: preserve annotations during build deps optimization (#8358) ([334cd9f](https://github.com/vitejs/vite/commit/334cd9f6db05b8f90c34bf621bf80f714f0353ce)), closes [#8358](https://github.com/vitejs/vite/issues/8358)
* fix: missing types for `es-module-lexer` (fixes #8349) (#8352) ([df2cc3d](https://github.com/vitejs/vite/commit/df2cc3d5079a55de061fca73eb98e7b6c0751db2)), closes [#8349](https://github.com/vitejs/vite/issues/8349) [#8352](https://github.com/vitejs/vite/issues/8352)
* fix(optimizer): transpile before calling `transformGlobImport` (#8343) ([1dbc7cc](https://github.com/vitejs/vite/commit/1dbc7ccac5191212548a59c02385595517b3e620)), closes [#8343](https://github.com/vitejs/vite/issues/8343)
* fix(deps): update all non-major dependencies (#8281) ([c68db4d](https://github.com/vitejs/vite/commit/c68db4d7ad2c1baee41f280b34ae89a85ba0373d)), closes [#8281](https://github.com/vitejs/vite/issues/8281)
* fix: expose client dist in `exports` (#8324) ([689adc0](https://github.com/vitejs/vite/commit/689adc029e765281bcdfa29bd7c800fd2ad54899)), closes [#8324](https://github.com/vitejs/vite/issues/8324)
* fix(cjs): build cjs for `loadEnv` (#8305) ([80dd2df](https://github.com/vitejs/vite/commit/80dd2dfd8049c39e516e19ad5cfdaa1c5f02e4a3)), closes [#8305](https://github.com/vitejs/vite/issues/8305)
* fix: correctly replace process.env.NODE_ENV (#8283) ([ec52baa](https://github.com/vitejs/vite/commit/ec52baa17ef2cf35d8133ddec2a7f6970be6c913)), closes [#8283](https://github.com/vitejs/vite/issues/8283)
* fix: dev sourcemap (#8269) ([505f75e](https://github.com/vitejs/vite/commit/505f75edbbf82bb7c6f2ff0c8eae56efbeadbd9a)), closes [#8269](https://github.com/vitejs/vite/issues/8269)
* fix: glob types (#8257) ([03b227e](https://github.com/vitejs/vite/commit/03b227e8a8598a7dc89d899afbb7dc446a2f336f)), closes [#8257](https://github.com/vitejs/vite/issues/8257)
* fix: srcset handling in html (#6419) ([a0ee4ff](https://github.com/vitejs/vite/commit/a0ee4ffeaba4120d0b79bdb7f589ed964e0a6f42)), closes [#6419](https://github.com/vitejs/vite/issues/6419)
* fix: support set NODE_ENV in scripts when custom mode option (#8218) ([adcf041](https://github.com/vitejs/vite/commit/adcf041715f4545e8c8c16a64572370b0eff7bb2)), closes [#8218](https://github.com/vitejs/vite/issues/8218)
* fix(hmr): catch thrown errors when connecting to hmr websocket (#7111) ([4bc9284](https://github.com/vitejs/vite/commit/4bc92843ffad2cc076813e74bde215ebc7443d87)), closes [#7111](https://github.com/vitejs/vite/issues/7111)
* fix(plugin-legacy): respect `entryFileNames` for polyfill chunks (#8247) ([baa9632](https://github.com/vitejs/vite/commit/baa9632a2c2befafdfde0f131f84f247fa8b6478)), closes [#8247](https://github.com/vitejs/vite/issues/8247)
* fix(plugin-react): broken optimized deps dir check (#8255) ([9e2a1ea](https://github.com/vitejs/vite/commit/9e2a1ea7a11a1f86e3b5a5f0a3eaf71a6a7a592e)), closes [#8255](https://github.com/vitejs/vite/issues/8255)
* fix!: do not fixStacktrace by default (#7995) ([23f8e08](https://github.com/vitejs/vite/commit/23f8e08fd56892700c42644ff00ce2830545b0bb)), closes [#7995](https://github.com/vitejs/vite/issues/7995)
* fix(glob): properly handles tailing comma (#8181) ([462be8e](https://github.com/vitejs/vite/commit/462be8e962d15f1e26a3a734670fa3bbf9535204)), closes [#8181](https://github.com/vitejs/vite/issues/8181)
* fix: add hash to lib chunk names (#7190) ([c81cedf](https://github.com/vitejs/vite/commit/c81cedfe6f5e9826ebf672b54c22848f0ebc7cf0)), closes [#7190](https://github.com/vitejs/vite/issues/7190)
* fix: allow css to be written for systemjs output (#5902) ([780b4f5](https://github.com/vitejs/vite/commit/780b4f5cdf02adb4ce42c283b60a4d4bb06b8440)), closes [#5902](https://github.com/vitejs/vite/issues/5902)
* fix: client full reload (#8018) ([2f478ed](https://github.com/vitejs/vite/commit/2f478ed6b6936767c4e74b5692fa67c4c7e07843)), closes [#8018](https://github.com/vitejs/vite/issues/8018)
* fix: handle optimize failure (#8006) ([ba95a2a](https://github.com/vitejs/vite/commit/ba95a2a03ceeb68fe674082677f656ce50fe94d0)), closes [#8006](https://github.com/vitejs/vite/issues/8006)
* fix: increase default HTTPS dev server session memory limit (#6207) ([f895f94](https://github.com/vitejs/vite/commit/f895f94b49fcab278d303ef9ecf7b6a28e7fc24a)), closes [#6207](https://github.com/vitejs/vite/issues/6207)
* fix: relative path html (#8122) ([d0deac0](https://github.com/vitejs/vite/commit/d0deac04f2fb38705206292d1f75e70c9bc3f4d2)), closes [#8122](https://github.com/vitejs/vite/issues/8122)
* fix: Remove ssrError when invalidating a module (#8124) ([a543220](https://github.com/vitejs/vite/commit/a543220773bb5ec88a09a2cb754022852c0eb1b1)), closes [#8124](https://github.com/vitejs/vite/issues/8124)
* fix: remove useless `/__vite_ping` handler (#8133) ([d607b2b](https://github.com/vitejs/vite/commit/d607b2ba830323ab1bd3d235abf83b17a6735d1f)), closes [#8133](https://github.com/vitejs/vite/issues/8133)
* fix: typo in #8121 (#8143) ([c32e3ac](https://github.com/vitejs/vite/commit/c32e3ac502fcbeb1b70edfec7bc5c657aa6ec096)), closes [#8121](https://github.com/vitejs/vite/issues/8121) [#8143](https://github.com/vitejs/vite/issues/8143)
* fix: use Vitest for unit testing, clean regex bug (#8040) ([63cd53d](https://github.com/vitejs/vite/commit/63cd53d2480e40db717aff78966240eb6482aba4)), closes [#8040](https://github.com/vitejs/vite/issues/8040)
* fix: Vite cannot load configuration files in the link directory (#4180) (#4181) ([a3fa1a3](https://github.com/vitejs/vite/commit/a3fa1a38e4597da8c967215b0301122e8c948d7b)), closes [#4180](https://github.com/vitejs/vite/issues/4180) [#4181](https://github.com/vitejs/vite/issues/4181)
* fix: vite client types (#7877) ([0e67fe8](https://github.com/vitejs/vite/commit/0e67fe8ae23d4e21db578d9a18a63861e1cdade0)), closes [#7877](https://github.com/vitejs/vite/issues/7877)
* fix: warn for unresolved css in html (#7911) ([2b58cb3](https://github.com/vitejs/vite/commit/2b58cb3faaa8f0da983888d0bd1f0f2a3a34de56)), closes [#7911](https://github.com/vitejs/vite/issues/7911)
* fix(build): use crossorigin for module preloaded ([85cab70](https://github.com/vitejs/vite/commit/85cab7054f5b7774fb796d86329226870fd23cdc))
* fix(client): wait on the socket host, not the ping host (#6819) ([ae56e47](https://github.com/vitejs/vite/commit/ae56e4778f4d5adc29341d93557aa02e40e70a89)), closes [#6819](https://github.com/vitejs/vite/issues/6819)
* fix(css): hoist external @import for non-split css (#8022) ([5280908](https://github.com/vitejs/vite/commit/5280908972219392a0d8daa2a33553868ca7072b)), closes [#8022](https://github.com/vitejs/vite/issues/8022)
* fix(css): preserve dynamic import css code (fix #5348) (#7746) ([12d0cc0](https://github.com/vitejs/vite/commit/12d0cc0e5860f63ea54c75e2b000d2692682b2d8)), closes [#5348](https://github.com/vitejs/vite/issues/5348) [#7746](https://github.com/vitejs/vite/issues/7746)
* fix(glob): wrap glob compile output in function invocation (#3682) ([bb603d3](https://github.com/vitejs/vite/commit/bb603d3d66506deb353e4d6346d5e8361fdb9e62)), closes [#3682](https://github.com/vitejs/vite/issues/3682)
* fix(lib): enable inlineDynamicImports for umd and iife (#8126) ([272a252](https://github.com/vitejs/vite/commit/272a2527a817c5c62101ebe7bfcfe663c59668da)), closes [#8126](https://github.com/vitejs/vite/issues/8126)
* fix(lib): use proper extension (#6827) ([34df307](https://github.com/vitejs/vite/commit/34df3075fce5bf71f4f69335bb6811731b1cadb0)), closes [#6827](https://github.com/vitejs/vite/issues/6827)
* fix(ssr): avoid transforming json file in ssrTransform (#6597) ([a709440](https://github.com/vitejs/vite/commit/a709440e26870580b8fd0da69f81d0d8ac5c788f)), closes [#6597](https://github.com/vitejs/vite/issues/6597)
* fix(lib)!: remove format prefixes for cjs and esm (#8107) ([ad8c3b1](https://github.com/vitejs/vite/commit/ad8c3b1c77bbdf523e4eba7b0f605ede76de1c56)), closes [#8107](https://github.com/vitejs/vite/issues/8107)


### Previous Changelogs


#### [3.0.0-beta.10](https://github.com/vitejs/vite/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2022-07-11)

See [3.0.0-beta.10 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.10/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.9](https://github.com/vitejs/vite/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2022-07-08)

See [3.0.0-beta.9 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.9/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.8](https://github.com/vitejs/vite/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2022-07-08)

See [3.0.0-beta.8 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.8/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.7](https://github.com/vitejs/vite/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2022-07-06)

See [3.0.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.7/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.6](https://github.com/vitejs/vite/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2022-07-04)

See [3.0.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.6/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.5](https://github.com/vitejs/vite/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2022-06-28)

See [3.0.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.5/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.4](https://github.com/vitejs/vite/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2022-06-27)

See [3.0.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.4/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.3](https://github.com/vitejs/vite/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2022-06-26)

See [3.0.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.3/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.2](https://github.com/vitejs/vite/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2022-06-24)

See [3.0.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.2/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.1](https://github.com/vitejs/vite/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2022-06-22)

See [3.0.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.1/packages/vite/CHANGELOG.md)


#### [3.0.0-beta.0](https://github.com/vitejs/vite/compare/v3.0.0-alpha.14...v3.0.0-beta.0) (2022-06-21)

See [3.0.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v3.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.14](https://github.com/vitejs/vite/compare/v3.0.0-alpha.13...v3.0.0-alpha.14) (2022-06-20)

See [3.0.0-alpha.14 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.14/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.13](https://github.com/vitejs/vite/compare/v3.0.0-alpha.12...v3.0.0-alpha.13) (2022-06-19)

See [3.0.0-alpha.13 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.13/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.12](https://github.com/vitejs/vite/compare/v3.0.0-alpha.11...v3.0.0-alpha.12) (2022-06-16)

See [3.0.0-alpha.12 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.12/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.11](https://github.com/vitejs/vite/compare/v3.0.0-alpha.10...v3.0.0-alpha.11) (2022-06-14)

See [3.0.0-alpha.11 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.11/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.10](https://github.com/vitejs/vite/compare/v3.0.0-alpha.9...v3.0.0-alpha.10) (2022-06-10)

See [3.0.0-alpha.10 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.10/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.9](https://github.com/vitejs/vite/compare/v3.0.0-alpha.8...v3.0.0-alpha.9) (2022-06-01)

See [3.0.0-alpha.9 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.9/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.8](https://github.com/vitejs/vite/compare/v3.0.0-alpha.7...v3.0.0-alpha.8) (2022-05-31)

See [3.0.0-alpha.8 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.8/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.7](https://github.com/vitejs/vite/compare/v3.0.0-alpha.6...v3.0.0-alpha.7) (2022-05-27)

See [3.0.0-alpha.7 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.7/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.6](https://github.com/vitejs/vite/compare/v3.0.0-alpha.5...v3.0.0-alpha.6) (2022-05-27)

See [3.0.0-alpha.6 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.6/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.5](https://github.com/vitejs/vite/compare/v3.0.0-alpha.4...v3.0.0-alpha.5) (2022-05-26)

See [3.0.0-alpha.5 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.5/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.4](https://github.com/vitejs/vite/compare/v3.0.0-alpha.3...v3.0.0-alpha.4) (2022-05-25)

See [3.0.0-alpha.4 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.4/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.3](https://github.com/vitejs/vite/compare/v3.0.0-alpha.2...v3.0.0-alpha.3) (2022-05-25)

See [3.0.0-alpha.3 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.3/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.2](https://github.com/vitejs/vite/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2022-05-23)

See [3.0.0-alpha.2 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.2/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.1](https://github.com/vitejs/vite/compare/v3.0.0-alpha.0...v3.0.0-alpha.1) (2022-05-18)

See [3.0.0-alpha.1 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.1/packages/vite/CHANGELOG.md)


#### [3.0.0-alpha.0](https://github.com/vitejs/vite/compare/v2.9.12...v3.0.0-alpha.0) (2022-05-13)

See [3.0.0-alpha.0 changelog](https://github.com/vitejs/vite/blob/v3.0.0-alpha.0/packages/vite/CHANGELOG.md)

## Previous Changelogs
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
