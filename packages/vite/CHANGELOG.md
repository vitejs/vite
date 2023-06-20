## 4.4.0-beta.0 (2023-06-20)

* feat: asset type add apng (#13294) ([a11b6f6](https://github.com/vitejs/vite/commit/a11b6f6)), closes [#13294](https://github.com/vitejs/vite/issues/13294)
* feat: emit event to handle chunk load errors (#12084) ([2eca54e](https://github.com/vitejs/vite/commit/2eca54e)), closes [#12084](https://github.com/vitejs/vite/issues/12084)
* feat: import public non-asset URL (#13422) ([3a98558](https://github.com/vitejs/vite/commit/3a98558)), closes [#13422](https://github.com/vitejs/vite/issues/13422)
* feat: support files for `fs.allow` (#12863) ([4a06e66](https://github.com/vitejs/vite/commit/4a06e66)), closes [#12863](https://github.com/vitejs/vite/issues/12863)
* feat(build): warn dynamic import module with a static import alongside (#12850) ([127c334](https://github.com/vitejs/vite/commit/127c334)), closes [#12850](https://github.com/vitejs/vite/issues/12850)
* feat(client): add debounce on page reload (#13545) ([d080b51](https://github.com/vitejs/vite/commit/d080b51)), closes [#13545](https://github.com/vitejs/vite/issues/13545)
* feat(client): add WebSocket connections events (#13334) ([eb75103](https://github.com/vitejs/vite/commit/eb75103)), closes [#13334](https://github.com/vitejs/vite/issues/13334)
* feat(config): friendly ESM file require error (#13283) ([b9a6ba0](https://github.com/vitejs/vite/commit/b9a6ba0)), closes [#13283](https://github.com/vitejs/vite/issues/13283)
* feat(css): add support for Lightning CSS (#12807) ([c6c5d49](https://github.com/vitejs/vite/commit/c6c5d49)), closes [#12807](https://github.com/vitejs/vite/issues/12807)
* feat(css): support at import preprocessed styles (#8400) ([2bd6077](https://github.com/vitejs/vite/commit/2bd6077)), closes [#8400](https://github.com/vitejs/vite/issues/8400)
* feat(html): support image set in inline style (#13473) ([2c0faba](https://github.com/vitejs/vite/commit/2c0faba)), closes [#13473](https://github.com/vitejs/vite/issues/13473)
* feat(importMetaGlob): support sub imports pattern (#12467) ([e355c9c](https://github.com/vitejs/vite/commit/e355c9c)), closes [#12467](https://github.com/vitejs/vite/issues/12467)
* feat(optimizer): support glob includes (#12414) ([7792515](https://github.com/vitejs/vite/commit/7792515)), closes [#12414](https://github.com/vitejs/vite/issues/12414)
* refactor: normalize fs/promises usage (#13441) ([f201805](https://github.com/vitejs/vite/commit/f201805)), closes [#13441](https://github.com/vitejs/vite/issues/13441)
* refactor: remove unnecessary async (#13546) ([7f241e9](https://github.com/vitejs/vite/commit/7f241e9)), closes [#13546](https://github.com/vitejs/vite/issues/13546)
* refactor(build): type rollup output (#13447) ([5ee6fd2](https://github.com/vitejs/vite/commit/5ee6fd2)), closes [#13447](https://github.com/vitejs/vite/issues/13447)
* refactor(config): replace `fs.promises`  with `fsp` (#13427) ([1e299cc](https://github.com/vitejs/vite/commit/1e299cc)), closes [#13427](https://github.com/vitejs/vite/issues/13427)
* chore(css): remove useless parameter (#13411) ([1197b24](https://github.com/vitejs/vite/commit/1197b24)), closes [#13411](https://github.com/vitejs/vite/issues/13411)
* chore(deps): update all non-major dependencies (#13553) ([3ea0534](https://github.com/vitejs/vite/commit/3ea0534)), closes [#13553](https://github.com/vitejs/vite/issues/13553)
* chore(deps): update dependency @rollup/plugin-commonjs to v25 (#13204) ([a3ff501](https://github.com/vitejs/vite/commit/a3ff501)), closes [#13204](https://github.com/vitejs/vite/issues/13204)
* feat!: update esbuild to 0.18.2 (#13525) ([ab967c0](https://github.com/vitejs/vite/commit/ab967c0)), closes [#13525](https://github.com/vitejs/vite/issues/13525)
* fix: allow using vite as a proxy for another vite server (#13218) ([711dd80](https://github.com/vitejs/vite/commit/711dd80)), closes [#13218](https://github.com/vitejs/vite/issues/13218)
* fix: await requests to before server restart (#13262) ([0464398](https://github.com/vitejs/vite/commit/0464398)), closes [#13262](https://github.com/vitejs/vite/issues/13262)
* fix: esm detection with `export const { A, B }` pattern (#13483) ([ea1bcc9](https://github.com/vitejs/vite/commit/ea1bcc9)), closes [#13483](https://github.com/vitejs/vite/issues/13483)
* fix: keep track of ssr version of imported modules separately (#11973) ([8fe6952](https://github.com/vitejs/vite/commit/8fe6952)), closes [#11973](https://github.com/vitejs/vite/issues/11973)
* fix: make optimize error available to meta-framework (#13495) ([b70e783](https://github.com/vitejs/vite/commit/b70e783)), closes [#13495](https://github.com/vitejs/vite/issues/13495)
* fix: only show the listened IP when host is specified (#13412) ([20b0cae](https://github.com/vitejs/vite/commit/20b0cae)), closes [#13412](https://github.com/vitejs/vite/issues/13412)
* fix: race condition creation module in graph in transformRequest (#13085) ([43cbbcf](https://github.com/vitejs/vite/commit/43cbbcf)), closes [#13085](https://github.com/vitejs/vite/issues/13085)
* fix: remove deprecated config.server.base (#13482) ([dc597bd](https://github.com/vitejs/vite/commit/dc597bd)), closes [#13482](https://github.com/vitejs/vite/issues/13482)
* fix: remove extra path shorten when resolving from a dir (#13381) ([5503198](https://github.com/vitejs/vite/commit/5503198)), closes [#13381](https://github.com/vitejs/vite/issues/13381)
* fix: show network URLs when `--host 0.0.0.0` (#13438) ([00ee8c1](https://github.com/vitejs/vite/commit/00ee8c1)), closes [#13438](https://github.com/vitejs/vite/issues/13438)
* fix: timestamp config dynamicImport (#13502) ([6a87c65](https://github.com/vitejs/vite/commit/6a87c65)), closes [#13502](https://github.com/vitejs/vite/issues/13502)
* fix: unexpected config temporary file (#13269) ([ff3ce31](https://github.com/vitejs/vite/commit/ff3ce31)), closes [#13269](https://github.com/vitejs/vite/issues/13269)
* fix: use consistent virtual module ID in module graph (#13073) ([aa1776f](https://github.com/vitejs/vite/commit/aa1776f)), closes [#13073](https://github.com/vitejs/vite/issues/13073)
* fix(build): make output warning message clearer (#12924) ([54ab3c8](https://github.com/vitejs/vite/commit/54ab3c8)), closes [#12924](https://github.com/vitejs/vite/issues/12924)
* fix(debug): import performance from perf_hooks (#13464) ([d458ccd](https://github.com/vitejs/vite/commit/d458ccd)), closes [#13464](https://github.com/vitejs/vite/issues/13464)
* fix(deps): update all non-major dependencies (#13059) ([123ef4c](https://github.com/vitejs/vite/commit/123ef4c)), closes [#13059](https://github.com/vitejs/vite/issues/13059)
* fix(deps): update all non-major dependencies (#13488) ([bd09248](https://github.com/vitejs/vite/commit/bd09248)), closes [#13488](https://github.com/vitejs/vite/issues/13488)
* fix(deps): update sirv to 2.0.3 (#13057) ([d814d6c](https://github.com/vitejs/vite/commit/d814d6c)), closes [#13057](https://github.com/vitejs/vite/issues/13057)
* fix(mergeConfig): don't accept callback config (#13135) ([998512b](https://github.com/vitejs/vite/commit/998512b)), closes [#13135](https://github.com/vitejs/vite/issues/13135)
* fix(optimizer): include exports for css modules (#13519) ([1fd9919](https://github.com/vitejs/vite/commit/1fd9919)), closes [#13519](https://github.com/vitejs/vite/issues/13519)
* fix(resolve): always use `module` condition (#13370) ([367920b](https://github.com/vitejs/vite/commit/367920b)), closes [#13370](https://github.com/vitejs/vite/issues/13370)
* fix(ssr): fix crash when a pnpm/Yarn workspace depends on a CJS package (#9763) ([9e1086b](https://github.com/vitejs/vite/commit/9e1086b)), closes [#9763](https://github.com/vitejs/vite/issues/9763)
* docs(chunkSplitting): add `manualChunks` object form syntax warning when it is used with the `splitV ([17511e0](https://github.com/vitejs/vite/commit/17511e0)), closes [#13431](https://github.com/vitejs/vite/issues/13431)



## <small>4.3.9 (2023-05-26)</small>

* release: v4.3.9 ([a460a2b](https://github.com/vitejs/vite/commit/a460a2b))
* release: v4.3.9 ([5c9abf7](https://github.com/vitejs/vite/commit/5c9abf7))
* fix: fs.deny with leading double slash (#13348) ([813ddd6](https://github.com/vitejs/vite/commit/813ddd6)), closes [#13348](https://github.com/vitejs/vite/issues/13348)
* fix: optimizeDeps during build and external ids (#13274) ([e3db771](https://github.com/vitejs/vite/commit/e3db771)), closes [#13274](https://github.com/vitejs/vite/issues/13274)
* fix(css): return deps if have no postcss plugins (#13344) ([28923fb](https://github.com/vitejs/vite/commit/28923fb)), closes [#13344](https://github.com/vitejs/vite/issues/13344)
* fix(legacy): style insert order (#13266) ([e444375](https://github.com/vitejs/vite/commit/e444375)), closes [#13266](https://github.com/vitejs/vite/issues/13266)
* chore: revert prev release commit ([2a30a07](https://github.com/vitejs/vite/commit/2a30a07))
* docs: optimizeDeps.needsInterop (#13323) ([b34e79c](https://github.com/vitejs/vite/commit/b34e79c)), closes [#13323](https://github.com/vitejs/vite/issues/13323)
* test: respect commonjs options in playgrounds (#13273) ([19e8c68](https://github.com/vitejs/vite/commit/19e8c68)), closes [#13273](https://github.com/vitejs/vite/issues/13273)
* refactor: simplify SSR options' if statement (#13254) ([8013a66](https://github.com/vitejs/vite/commit/8013a66)), closes [#13254](https://github.com/vitejs/vite/issues/13254)
* perf(ssr): calculate stacktrace offset lazily (#13256) ([906c4c1](https://github.com/vitejs/vite/commit/906c4c1)), closes [#13256](https://github.com/vitejs/vite/issues/13256)



## <small>4.3.8 (2023-05-18)</small>

* release: v4.3.8 ([3f3fff2](https://github.com/vitejs/vite/commit/3f3fff2))
* fix: avoid outdated module to crash in importAnalysis after restart (#13231) ([3609e79](https://github.com/vitejs/vite/commit/3609e79)), closes [#13231](https://github.com/vitejs/vite/issues/13231)
* fix(ssr): skip updateCjsSsrExternals if legacy flag disabled (#13230) ([13fc345](https://github.com/vitejs/vite/commit/13fc345)), closes [#13230](https://github.com/vitejs/vite/issues/13230)



## <small>4.3.7 (2023-05-16)</small>

* release: v4.3.7 ([d09bbd0](https://github.com/vitejs/vite/commit/d09bbd0))
* fix: revert only watch .env files in envDir (#12587) (#13217) ([0fd4616](https://github.com/vitejs/vite/commit/0fd4616)), closes [#12587](https://github.com/vitejs/vite/issues/12587) [#13217](https://github.com/vitejs/vite/issues/13217)
* fix(assetImportMetaUrl): allow ternary operator in template literal urls (#13121) ([d5d9a31](https://github.com/vitejs/vite/commit/d5d9a31)), closes [#13121](https://github.com/vitejs/vite/issues/13121)



## <small>4.3.6 (2023-05-15)</small>

* release: v4.3.6 ([9a42e31](https://github.com/vitejs/vite/commit/9a42e31))
* fix: avoid dev-server crash when ws proxy error (#12829) ([87e1f58](https://github.com/vitejs/vite/commit/87e1f58)), closes [#12829](https://github.com/vitejs/vite/issues/12829)
* fix: call `tryFsResolve` for relative `new URL(foo, import.meta.url)` (#13142) ([eeb0617](https://github.com/vitejs/vite/commit/eeb0617)), closes [#13142](https://github.com/vitejs/vite/issues/13142)
* fix: don't inject CSS sourcemap for direct requests (#13115) ([7d80a47](https://github.com/vitejs/vite/commit/7d80a47)), closes [#13115](https://github.com/vitejs/vite/issues/13115)
* fix: handle more yarn pnp load errors (#13160) ([adf61d9](https://github.com/vitejs/vite/commit/adf61d9)), closes [#13160](https://github.com/vitejs/vite/issues/13160)
* fix(build): declare moduleSideEffects for vite:modulepreload-polyfill (#13099) ([d63129b](https://github.com/vitejs/vite/commit/d63129b)), closes [#13099](https://github.com/vitejs/vite/issues/13099)
* fix(css): respect `esbuild.charset` when minify (#13190) ([4fd35ed](https://github.com/vitejs/vite/commit/4fd35ed)), closes [#13190](https://github.com/vitejs/vite/issues/13190)
* fix(server): intercept ping requests (#13117) ([d06cc42](https://github.com/vitejs/vite/commit/d06cc42)), closes [#13117](https://github.com/vitejs/vite/issues/13117)
* fix(ssr): stacktrace uses abs path with or without sourcemap (#12902) ([88c855e](https://github.com/vitejs/vite/commit/88c855e)), closes [#12902](https://github.com/vitejs/vite/issues/12902)
* perf: skip windows absolute paths for node resolve (#13162) ([e640939](https://github.com/vitejs/vite/commit/e640939)), closes [#13162](https://github.com/vitejs/vite/issues/13162)
* chore: remove useless dep (#13165) ([9a7ec98](https://github.com/vitejs/vite/commit/9a7ec98)), closes [#13165](https://github.com/vitejs/vite/issues/13165)
* chore(reporter): reuse clearLine (#13156) ([535795a](https://github.com/vitejs/vite/commit/535795a)), closes [#13156](https://github.com/vitejs/vite/issues/13156)



## <small>4.3.5 (2023-05-05)</small>

* release: v4.3.5 ([775505d](https://github.com/vitejs/vite/commit/775505d))
* fix: location is not defined error in cleanScssBugUrl (#13100) ([91d7b67](https://github.com/vitejs/vite/commit/91d7b67)), closes [#13100](https://github.com/vitejs/vite/issues/13100)
* fix: unwrapId and pass ssr flag when adding to moduleGraph in this.load (#13083) ([9041e19](https://github.com/vitejs/vite/commit/9041e19)), closes [#13083](https://github.com/vitejs/vite/issues/13083)
* fix(assetImportMetaUrl): reserve dynamic template literal query params (#13034) ([7089528](https://github.com/vitejs/vite/commit/7089528)), closes [#13034](https://github.com/vitejs/vite/issues/13034)
* fix(debug): skip filter object args (#13098) ([d95a9af](https://github.com/vitejs/vite/commit/d95a9af)), closes [#13098](https://github.com/vitejs/vite/issues/13098)
* fix(scan): handle html script tag attributes that contain ">" (#13101) ([8a37de6](https://github.com/vitejs/vite/commit/8a37de6)), closes [#13101](https://github.com/vitejs/vite/issues/13101)
* fix(ssr): ignore __esModule for ssrExportAll (#13084) ([8a8ea1d](https://github.com/vitejs/vite/commit/8a8ea1d)), closes [#13084](https://github.com/vitejs/vite/issues/13084)



## <small>4.3.4 (2023-05-02)</small>

* release: v4.3.4 ([5890aa9](https://github.com/vitejs/vite/commit/5890aa9))
* fix(define): incorrect raw expression value type in build (#13003) ([8f4cf07](https://github.com/vitejs/vite/commit/8f4cf07)), closes [#13003](https://github.com/vitejs/vite/issues/13003)
* fix(importAnalysisBuild): support parsing '__VITE_PRELOAD__' (#13023) ([447df7c](https://github.com/vitejs/vite/commit/447df7c)), closes [#13023](https://github.com/vitejs/vite/issues/13023)
* fix(server): should respect hmr port when middlewareMode=false (#13040) ([1ee0014](https://github.com/vitejs/vite/commit/1ee0014)), closes [#13040](https://github.com/vitejs/vite/issues/13040)
* fix(ssr): track for statements as block scope (#13021) ([2f8502f](https://github.com/vitejs/vite/commit/2f8502f)), closes [#13021](https://github.com/vitejs/vite/issues/13021)
* chore: add changelog for vite 4.2.2 and 3.2.6 (#13055) ([0c9f1f4](https://github.com/vitejs/vite/commit/0c9f1f4)), closes [#13055](https://github.com/vitejs/vite/issues/13055)



## <small>4.3.3 (2023-04-26)</small>

* release: v4.3.3 ([f749c3e](https://github.com/vitejs/vite/commit/f749c3e))
* fix: address file path mismatch when loading Vite config file on Windows (fix #12923) (#13005) ([84c4118](https://github.com/vitejs/vite/commit/84c4118)), closes [#12923](https://github.com/vitejs/vite/issues/12923) [#13005](https://github.com/vitejs/vite/issues/13005)
* fix: undefined document in worker (#12988) ([08c1452](https://github.com/vitejs/vite/commit/08c1452)), closes [#12988](https://github.com/vitejs/vite/issues/12988)
* fix(resolve): deep import resolvedId error (#13010) ([30a41ff](https://github.com/vitejs/vite/commit/30a41ff)), closes [#13010](https://github.com/vitejs/vite/issues/13010)
* feat: optimize deps option to turn off auto discovery (#13000) ([bd86375](https://github.com/vitejs/vite/commit/bd86375)), closes [#13000](https://github.com/vitejs/vite/issues/13000)
* chore(deps): update all non-major dependencies (#12805) ([5731ac9](https://github.com/vitejs/vite/commit/5731ac9)), closes [#12805](https://github.com/vitejs/vite/issues/12805)



## <small>4.3.2 (2023-04-25)</small>

* release: v4.3.2 ([1bc42cf](https://github.com/vitejs/vite/commit/1bc42cf))
* fix: status optional in windows network drive regex (fix: #12948) (#12949) ([f781fc6](https://github.com/vitejs/vite/commit/f781fc6)), closes [#12948](https://github.com/vitejs/vite/issues/12948) [#12949](https://github.com/vitejs/vite/issues/12949)
* fix: use realpathSync for node <16.18 on windows (#12971) ([965839c](https://github.com/vitejs/vite/commit/965839c)), closes [#12971](https://github.com/vitejs/vite/issues/12971)
* fix(ssr): hoist statements after hashbang (#12985) ([07bd6d1](https://github.com/vitejs/vite/commit/07bd6d1)), closes [#12985](https://github.com/vitejs/vite/issues/12985)
* chore: build time message setting color (#12940) ([ada7cd5](https://github.com/vitejs/vite/commit/ada7cd5)), closes [#12940](https://github.com/vitejs/vite/issues/12940)
* chore: remove extra ) in changelog (#12932) ([e7924d2](https://github.com/vitejs/vite/commit/e7924d2)), closes [#12932](https://github.com/vitejs/vite/issues/12932)
* chore: upgrade rollup (#12965) ([bdb2f25](https://github.com/vitejs/vite/commit/bdb2f25)), closes [#12965](https://github.com/vitejs/vite/issues/12965)
* refactor: resolveExports (#10917) ([ad21ec3](https://github.com/vitejs/vite/commit/ad21ec3)), closes [#10917](https://github.com/vitejs/vite/issues/10917)



## <small>4.3.1 (2023-04-20)</small>

* release: v4.3.1 ([2a8779c](https://github.com/vitejs/vite/commit/2a8779c))
* fix: revert ensure module in graph before transforming (#12774) (#12929) ([9cc93a5](https://github.com/vitejs/vite/commit/9cc93a5)), closes [#12774](https://github.com/vitejs/vite/issues/12774) [#12929](https://github.com/vitejs/vite/issues/12929)
* docs: 4.3 announcement and release notes (#12925) ([f29c582](https://github.com/vitejs/vite/commit/f29c582)), closes [#12925](https://github.com/vitejs/vite/issues/12925)
* chore: clean up 4.3 changelog ([55ec023](https://github.com/vitejs/vite/commit/55ec023))



## 4.3.0 (2023-04-20)

* release: v4.3.0 ([d6468a3](https://github.com/vitejs/vite/commit/d6468a3))
* fix(build): do not repeatedly output warning message (#12910) ([251d0ab](https://github.com/vitejs/vite/commit/251d0ab)), closes [#12910](https://github.com/vitejs/vite/issues/12910)



## 4.3.0-beta.8 (2023-04-19)

* release: v4.3.0-beta.8 ([3334660](https://github.com/vitejs/vite/commit/3334660))
* fix: escape msg in render restricted error html (#12889) ([3aa2127](https://github.com/vitejs/vite/commit/3aa2127)), closes [#12889](https://github.com/vitejs/vite/issues/12889)
* fix: yarn pnp considerBuiltins (#12903) ([a0e10d5](https://github.com/vitejs/vite/commit/a0e10d5)), closes [#12903](https://github.com/vitejs/vite/issues/12903)
* refactor(eslint): migrate to `eslint-plugin-n` (#12895) ([62ebe28](https://github.com/vitejs/vite/commit/62ebe28)), closes [#12895](https://github.com/vitejs/vite/issues/12895)
* feat: expose `isFileServingAllowed` as public utility (#12894) ([93e095c](https://github.com/vitejs/vite/commit/93e095c)), closes [#12894](https://github.com/vitejs/vite/issues/12894)



## 4.3.0-beta.7 (2023-04-17)

* release: v4.3.0-beta.7 ([f2bcad8](https://github.com/vitejs/vite/commit/f2bcad8))
* fix: broken middleware name (#12871) ([32bef57](https://github.com/vitejs/vite/commit/32bef57)), closes [#12871](https://github.com/vitejs/vite/issues/12871)
* fix: cleanUpStaleCacheDirs once per process (#12847) ([2c58b6e](https://github.com/vitejs/vite/commit/2c58b6e)), closes [#12847](https://github.com/vitejs/vite/issues/12847)
* fix(build): do not warn when URL in CSS is externalized (#12873) ([1510996](https://github.com/vitejs/vite/commit/1510996)), closes [#12873](https://github.com/vitejs/vite/issues/12873)
* refactor: simplify crawlEndFinder (#12868) ([31f8b51](https://github.com/vitejs/vite/commit/31f8b51)), closes [#12868](https://github.com/vitejs/vite/issues/12868)
* perf: parallelize await exportsData from depsInfo (#12869) ([ab3a530](https://github.com/vitejs/vite/commit/ab3a530)), closes [#12869](https://github.com/vitejs/vite/issues/12869)



## 4.3.0-beta.6 (2023-04-14)

* release: v4.3.0-beta.6 ([ca93d67](https://github.com/vitejs/vite/commit/ca93d67))
* fix: build time deps optimization, and ensure single crawl end call (#12851) ([fa30879](https://github.com/vitejs/vite/commit/fa30879)), closes [#12851](https://github.com/vitejs/vite/issues/12851)
* fix: correct vite config temporary name (#12833) ([cdd9c23](https://github.com/vitejs/vite/commit/cdd9c23)), closes [#12833](https://github.com/vitejs/vite/issues/12833)
* fix(importAnalysis): warning on ExportAllDeclaration (#12799) ([5136b9b](https://github.com/vitejs/vite/commit/5136b9b)), closes [#12799](https://github.com/vitejs/vite/issues/12799)
* fix(optimizer): start optimizer after buildStart (#12832) ([cfe75ee](https://github.com/vitejs/vite/commit/cfe75ee)), closes [#12832](https://github.com/vitejs/vite/issues/12832)



## 4.3.0-beta.5 (2023-04-11)

* release: v4.3.0-beta.5 ([e0061d1](https://github.com/vitejs/vite/commit/e0061d1))
* fix: handle try-catch for fs promise when resolve https config (#12808) ([0bba402](https://github.com/vitejs/vite/commit/0bba402)), closes [#12808](https://github.com/vitejs/vite/issues/12808)
* fix(build): correctly handle warning ignore list (#12831) ([8830532](https://github.com/vitejs/vite/commit/8830532)), closes [#12831](https://github.com/vitejs/vite/issues/12831)
* fix(resolve): use different importer check for css imports (#12815) ([d037327](https://github.com/vitejs/vite/commit/d037327)), closes [#12815](https://github.com/vitejs/vite/issues/12815)
* docs: fix pnpm link (#12803) ([ad358da](https://github.com/vitejs/vite/commit/ad358da)), closes [#12803](https://github.com/vitejs/vite/issues/12803)



## 4.3.0-beta.4 (2023-04-09)

* release: v4.3.0-beta.4 ([72a379f](https://github.com/vitejs/vite/commit/72a379f))
* fix: ignore sideEffects for scripts imported from html (#12786) ([f09551f](https://github.com/vitejs/vite/commit/f09551f)), closes [#12786](https://github.com/vitejs/vite/issues/12786)
* fix: warn on build when bundling code that uses nodejs built in module (#12616) ([72050f9](https://github.com/vitejs/vite/commit/72050f9)), closes [#12616](https://github.com/vitejs/vite/issues/12616)
* fix(cli): pass mode to optimize command (#12776) ([da38ad8](https://github.com/vitejs/vite/commit/da38ad8)), closes [#12776](https://github.com/vitejs/vite/issues/12776)
* fix(css): resolve at import from dependency basedir (#12796) ([46bdf7d](https://github.com/vitejs/vite/commit/46bdf7d)), closes [#12796](https://github.com/vitejs/vite/issues/12796)
* fix(worker): asset in iife worker and relative base (#12697) ([ddefc06](https://github.com/vitejs/vite/commit/ddefc06)), closes [#12697](https://github.com/vitejs/vite/issues/12697)
* fix(worker): return null for shouldTransformCachedModule (#12797) ([ea5f6fc](https://github.com/vitejs/vite/commit/ea5f6fc)), closes [#12797](https://github.com/vitejs/vite/issues/12797)
* perf: avoid side effects resolving in dev and in the optimizer/scanner (#12789) ([fb904f9](https://github.com/vitejs/vite/commit/fb904f9)), closes [#12789](https://github.com/vitejs/vite/issues/12789)



## 4.3.0-beta.3 (2023-04-07)

* release: v4.3.0-beta.3 ([063d93b](https://github.com/vitejs/vite/commit/063d93b))
* fix: allow onwarn to override vite default warning handling (#12757) ([f736930](https://github.com/vitejs/vite/commit/f736930)), closes [#12757](https://github.com/vitejs/vite/issues/12757)
* fix: ensure module in graph before transforming (#12774) ([44ad321](https://github.com/vitejs/vite/commit/44ad321)), closes [#12774](https://github.com/vitejs/vite/issues/12774)
* fix: update package cache watcher (#12772) ([a78588f](https://github.com/vitejs/vite/commit/a78588f)), closes [#12772](https://github.com/vitejs/vite/issues/12772)
* perf: parallelize imports processing in import analysis plugin (#12754) ([037a6c7](https://github.com/vitejs/vite/commit/037a6c7)), closes [#12754](https://github.com/vitejs/vite/issues/12754)
* perf: unresolvedUrlToModule promise cache (#12725) ([80c526e](https://github.com/vitejs/vite/commit/80c526e)), closes [#12725](https://github.com/vitejs/vite/issues/12725)
* perf(resolve): avoid tryFsResolve for /@fs/ paths (#12450) ([3ef8aaa](https://github.com/vitejs/vite/commit/3ef8aaa)), closes [#12450](https://github.com/vitejs/vite/issues/12450)
* perf(resolve): reduce vite client path checks (#12471) ([c49af23](https://github.com/vitejs/vite/commit/c49af23)), closes [#12471](https://github.com/vitejs/vite/issues/12471)
* refactor: use simpler resolve for nested optimized deps (#12770) ([d202588](https://github.com/vitejs/vite/commit/d202588)), closes [#12770](https://github.com/vitejs/vite/issues/12770)
* chore: improve debug log filtering (#12763) ([da1cb02](https://github.com/vitejs/vite/commit/da1cb02)), closes [#12763](https://github.com/vitejs/vite/issues/12763)



## 4.3.0-beta.2 (2023-04-05)

* release: v4.3.0-beta.2 ([a4341bc](https://github.com/vitejs/vite/commit/a4341bc))
* fix: avoid clean up while committing deps folder (#12722) ([3f4d109](https://github.com/vitejs/vite/commit/3f4d109)), closes [#12722](https://github.com/vitejs/vite/issues/12722)
* fix: ignore pnp resolve error (#12719) ([2d30ae5](https://github.com/vitejs/vite/commit/2d30ae5)), closes [#12719](https://github.com/vitejs/vite/issues/12719)
* fix: leave fully dynamic import.meta.url asset (fixes #10306) (#10549) ([56802b1](https://github.com/vitejs/vite/commit/56802b1)), closes [#10306](https://github.com/vitejs/vite/issues/10306) [#10549](https://github.com/vitejs/vite/issues/10549)
* fix: output combined sourcemap in importAnalysisBuild plugin (#12642) ([d051639](https://github.com/vitejs/vite/commit/d051639)), closes [#12642](https://github.com/vitejs/vite/issues/12642)
* fix: take in relative assets path fixes from rollup (#12695) ([81e44dd](https://github.com/vitejs/vite/commit/81e44dd)), closes [#12695](https://github.com/vitejs/vite/issues/12695)
* fix: throws error when plugin tries to resolve ID to external URL (#11731) ([49674b5](https://github.com/vitejs/vite/commit/49674b5)), closes [#11731](https://github.com/vitejs/vite/issues/11731)
* fix(css): css file emit synchronously (#12558) ([8e30025](https://github.com/vitejs/vite/commit/8e30025)), closes [#12558](https://github.com/vitejs/vite/issues/12558)
* fix(import-analysis): escape quotes correctly (#12688) ([1638ebd](https://github.com/vitejs/vite/commit/1638ebd)), closes [#12688](https://github.com/vitejs/vite/issues/12688)
* fix(optimizer): load the correct lock file (#12700) ([889eebe](https://github.com/vitejs/vite/commit/889eebe)), closes [#12700](https://github.com/vitejs/vite/issues/12700)
* fix(server): delay ws server listen when restart (#12734) ([abe9274](https://github.com/vitejs/vite/commit/abe9274)), closes [#12734](https://github.com/vitejs/vite/issues/12734)
* fix(ssr): load sourcemaps alongside modules (#11780) ([be95050](https://github.com/vitejs/vite/commit/be95050)), closes [#11780](https://github.com/vitejs/vite/issues/11780)
* fix(ssr): show ssr module loader error stack (#12651) ([050c0f9](https://github.com/vitejs/vite/commit/050c0f9)), closes [#12651](https://github.com/vitejs/vite/issues/12651)
* fix(worker): disable manifest plugins in worker build (#12661) ([20b8ef4](https://github.com/vitejs/vite/commit/20b8ef4)), closes [#12661](https://github.com/vitejs/vite/issues/12661)
* fix(worker): worker import.meta.url should not depends on document in iife mode (#12629) ([65f5ed2](https://github.com/vitejs/vite/commit/65f5ed2)), closes [#12629](https://github.com/vitejs/vite/issues/12629)
* refactor: `import.meta.url` condition from renderChunk hook of worker plugin (#12696) ([fdef8fd](https://github.com/vitejs/vite/commit/fdef8fd)), closes [#12696](https://github.com/vitejs/vite/issues/12696)
* refactor: clean up preTransformRequest (#12672) ([561227c](https://github.com/vitejs/vite/commit/561227c)), closes [#12672](https://github.com/vitejs/vite/issues/12672)
* refactor: make debugger nullable (#12687) ([89e4977](https://github.com/vitejs/vite/commit/89e4977)), closes [#12687](https://github.com/vitejs/vite/issues/12687)
* refactor: remove `ensureVolumeInPath` (#12690) ([a3150ee](https://github.com/vitejs/vite/commit/a3150ee)), closes [#12690](https://github.com/vitejs/vite/issues/12690)
* refactor: remove unused exports data props (#12740) ([4538bfe](https://github.com/vitejs/vite/commit/4538bfe)), closes [#12740](https://github.com/vitejs/vite/issues/12740)
* refactor: use `resolvePackageData` in `requireResolveFromRootWithFallback` (#12712) ([1ea38e2](https://github.com/vitejs/vite/commit/1ea38e2)), closes [#12712](https://github.com/vitejs/vite/issues/12712)
* refactor(css): simplify cached import code (#12730) ([0646754](https://github.com/vitejs/vite/commit/0646754)), closes [#12730](https://github.com/vitejs/vite/issues/12730)
* feat: reuse existing style elements in dev (#12678) ([3a41bd8](https://github.com/vitejs/vite/commit/3a41bd8)), closes [#12678](https://github.com/vitejs/vite/issues/12678)
* feat: skip pinging the server when the tab is not shown (#12698) ([bedcd8f](https://github.com/vitejs/vite/commit/bedcd8f)), closes [#12698](https://github.com/vitejs/vite/issues/12698)
* feat(create-vite): use typescript 5.0 in templates (#12481) ([8582e2d](https://github.com/vitejs/vite/commit/8582e2d)), closes [#12481](https://github.com/vitejs/vite/issues/12481)
* perf: avoid new URL() in hot path (#12654) ([f4e2fdf](https://github.com/vitejs/vite/commit/f4e2fdf)), closes [#12654](https://github.com/vitejs/vite/issues/12654)
* perf: improve isFileReadable performance (#12397) ([acf3a14](https://github.com/vitejs/vite/commit/acf3a14)), closes [#12397](https://github.com/vitejs/vite/issues/12397)
* perf: module graph url shortcuts (#12635) ([c268cfa](https://github.com/vitejs/vite/commit/c268cfa)), closes [#12635](https://github.com/vitejs/vite/issues/12635)
* perf: reduce runOptimizerIfIdleAfterMs time (#12614) ([d026a65](https://github.com/vitejs/vite/commit/d026a65)), closes [#12614](https://github.com/vitejs/vite/issues/12614)
* perf: shorcircuit resolve in ensure entry from url (#12655) ([82137d6](https://github.com/vitejs/vite/commit/82137d6)), closes [#12655](https://github.com/vitejs/vite/issues/12655)
* perf: skip es-module-lexer if have no dynamic imports (#12732) ([5d07d7c](https://github.com/vitejs/vite/commit/5d07d7c)), closes [#12732](https://github.com/vitejs/vite/issues/12732)
* perf: start preprocessing static imports before updating module graph (#12723) ([c90b46e](https://github.com/vitejs/vite/commit/c90b46e)), closes [#12723](https://github.com/vitejs/vite/issues/12723)
* perf: use package cache for one off resolve (#12744) ([77bf4ef](https://github.com/vitejs/vite/commit/77bf4ef)), closes [#12744](https://github.com/vitejs/vite/issues/12744)
* perf(css): cache lazy import (#12721) ([fedb080](https://github.com/vitejs/vite/commit/fedb080)), closes [#12721](https://github.com/vitejs/vite/issues/12721)
* perf(hmr): keep track of already traversed modules when propagating update (#12658) ([3b912fb](https://github.com/vitejs/vite/commit/3b912fb)), closes [#12658](https://github.com/vitejs/vite/issues/12658)
* perf(moduleGraph): resolve dep urls in parallel (#12619) ([4823fec](https://github.com/vitejs/vite/commit/4823fec)), closes [#12619](https://github.com/vitejs/vite/issues/12619)
* perf(resolve): skip for virtual files (#12638) ([9e13f5f](https://github.com/vitejs/vite/commit/9e13f5f)), closes [#12638](https://github.com/vitejs/vite/issues/12638)
* chore: fix resolve debug log timing (#12746) ([22f6ae6](https://github.com/vitejs/vite/commit/22f6ae6)), closes [#12746](https://github.com/vitejs/vite/issues/12746)
* chore: revert custom license resolve (#12709) ([621bb2f](https://github.com/vitejs/vite/commit/621bb2f)), closes [#12709](https://github.com/vitejs/vite/issues/12709)
* chore: set target in tsconfig.check.json (#12675) ([15177a1](https://github.com/vitejs/vite/commit/15177a1)), closes [#12675](https://github.com/vitejs/vite/issues/12675)
* chore(optimizer): remove redundant setTimeout call in scan process (#12718) ([0ce0e93](https://github.com/vitejs/vite/commit/0ce0e93)), closes [#12718](https://github.com/vitejs/vite/issues/12718)
* chore(optimizer): show full optimized deps list (#12686) ([8bef662](https://github.com/vitejs/vite/commit/8bef662)), closes [#12686](https://github.com/vitejs/vite/issues/12686)



## 4.3.0-beta.1 (2023-03-29)

* release: v4.3.0-beta.1 ([9697e64](https://github.com/vitejs/vite/commit/9697e64))
* feat: use preview server parameter in preview server hook (#11647) ([4c142ea](https://github.com/vitejs/vite/commit/4c142ea)), closes [#11647](https://github.com/vitejs/vite/issues/11647)
* feat(reporter): show gzip info for all compressible files (fix #11288) (#12485) ([03502c8](https://github.com/vitejs/vite/commit/03502c8)), closes [#11288](https://github.com/vitejs/vite/issues/11288) [#12485](https://github.com/vitejs/vite/issues/12485)
* feat(server): allow to import `data:` uris (#12645) ([4886d9f](https://github.com/vitejs/vite/commit/4886d9f)), closes [#12645](https://github.com/vitejs/vite/issues/12645)
* fix: avoid temporal optimize deps dirs (#12582) ([ff92f2f](https://github.com/vitejs/vite/commit/ff92f2f)), closes [#12582](https://github.com/vitejs/vite/issues/12582)
* fix: await `buildStart` before server start (#12647) ([871d353](https://github.com/vitejs/vite/commit/871d353)), closes [#12647](https://github.com/vitejs/vite/issues/12647)
* fix: call `buildStart` only once when using next port (#12624) ([e10c6bd](https://github.com/vitejs/vite/commit/e10c6bd)), closes [#12624](https://github.com/vitejs/vite/issues/12624)
* fix: sourcemapIgnoreList for optimizedDeps (#12633) ([c1d3fc9](https://github.com/vitejs/vite/commit/c1d3fc9)), closes [#12633](https://github.com/vitejs/vite/issues/12633)
* fix: splitFileAndPostfix works as cleanUrl (#12572) ([276725f](https://github.com/vitejs/vite/commit/276725f)), closes [#12572](https://github.com/vitejs/vite/issues/12572)
* fix: throw error on build optimizeDeps issue (#12560) ([02a46d7](https://github.com/vitejs/vite/commit/02a46d7)), closes [#12560](https://github.com/vitejs/vite/issues/12560)
* fix: use nearest pkg to resolved for moduleSideEffects (#12628) ([1dfecc8](https://github.com/vitejs/vite/commit/1dfecc8)), closes [#12628](https://github.com/vitejs/vite/issues/12628)
* fix(css): use `charset: 'utf8'` by default for css (#12565) ([c20a064](https://github.com/vitejs/vite/commit/c20a064)), closes [#12565](https://github.com/vitejs/vite/issues/12565)
* fix(html): dont pretransform public scripts (#12650) ([4f0af3f](https://github.com/vitejs/vite/commit/4f0af3f)), closes [#12650](https://github.com/vitejs/vite/issues/12650)
* perf: avoid fsp.unlink if we don't use the promise (#12589) ([19d1980](https://github.com/vitejs/vite/commit/19d1980)), closes [#12589](https://github.com/vitejs/vite/issues/12589)
* perf: back to temporal optimizer dirs (#12622) ([8da0422](https://github.com/vitejs/vite/commit/8da0422)), closes [#12622](https://github.com/vitejs/vite/issues/12622)
* perf: cache `depsCacheDirPrefix` value for `isOptimizedDepFile` (#12601) ([edbd262](https://github.com/vitejs/vite/commit/edbd262)), closes [#12601](https://github.com/vitejs/vite/issues/12601)
* perf: improve cleanUrl util (#12573) ([68d500e](https://github.com/vitejs/vite/commit/68d500e)), closes [#12573](https://github.com/vitejs/vite/issues/12573)
* perf: non-blocking write of optimized dep files (#12603) ([2f5f968](https://github.com/vitejs/vite/commit/2f5f968)), closes [#12603](https://github.com/vitejs/vite/issues/12603)
* perf: try using realpathSync.native in Windows (#12580) ([1cc99f8](https://github.com/vitejs/vite/commit/1cc99f8)), closes [#12580](https://github.com/vitejs/vite/issues/12580)
* perf: use fsp in more cases (#12553) ([e9b92f5](https://github.com/vitejs/vite/commit/e9b92f5)), closes [#12553](https://github.com/vitejs/vite/issues/12553)
* perf(html): apply preTransformRequest for html scripts (#12599) ([420782c](https://github.com/vitejs/vite/commit/420782c)), closes [#12599](https://github.com/vitejs/vite/issues/12599)
* perf(optimizer): bulk optimizer delay (#12609) ([c881971](https://github.com/vitejs/vite/commit/c881971)), closes [#12609](https://github.com/vitejs/vite/issues/12609)
* perf(optimizer): start optimizer early (#12593) ([4f9b8b4](https://github.com/vitejs/vite/commit/4f9b8b4)), closes [#12593](https://github.com/vitejs/vite/issues/12593)
* perf(resolve): avoid isWorkerRequest and clean up .ts imported a .js (#12571) ([8ab1438](https://github.com/vitejs/vite/commit/8ab1438)), closes [#12571](https://github.com/vitejs/vite/issues/12571)
* perf(resolve): findNearestMainPackageData instead of lookupFile (#12576) ([54b376f](https://github.com/vitejs/vite/commit/54b376f)), closes [#12576](https://github.com/vitejs/vite/issues/12576)
* perf(server): only watch .env files in envDir (#12587) ([26d8e72](https://github.com/vitejs/vite/commit/26d8e72)), closes [#12587](https://github.com/vitejs/vite/issues/12587)
* refactor: improve scanner logs (#12578) ([9925a72](https://github.com/vitejs/vite/commit/9925a72)), closes [#12578](https://github.com/vitejs/vite/issues/12578)
* refactor: isInNodeModules util (#12588) ([fb3245a](https://github.com/vitejs/vite/commit/fb3245a)), closes [#12588](https://github.com/vitejs/vite/issues/12588)
* refactor: remove `idToPkgMap` (#12564) ([a326ec8](https://github.com/vitejs/vite/commit/a326ec8)), closes [#12564](https://github.com/vitejs/vite/issues/12564)
* refactor: simplify lookupFile (#12585) ([4215e22](https://github.com/vitejs/vite/commit/4215e22)), closes [#12585](https://github.com/vitejs/vite/issues/12585)
* refactor: tryStatSync as util (#12575) ([92601db](https://github.com/vitejs/vite/commit/92601db)), closes [#12575](https://github.com/vitejs/vite/issues/12575)
* refactor: use findNearestPackageData in more places (#12577) ([35faae9](https://github.com/vitejs/vite/commit/35faae9)), closes [#12577](https://github.com/vitejs/vite/issues/12577)



## 4.3.0-beta.0 (2023-03-23)

* release: v4.3.0-beta.0 ([ba45f92](https://github.com/vitejs/vite/commit/ba45f92))
* perf: avoid execSync on openBrowser (#12510) ([a2af2f0](https://github.com/vitejs/vite/commit/a2af2f0)), closes [#12510](https://github.com/vitejs/vite/issues/12510)
* perf: extract regex and use Map in data-uri plugin (#12500) ([137e63d](https://github.com/vitejs/vite/commit/137e63d)), closes [#12500](https://github.com/vitejs/vite/issues/12500)
* perf: extract vite:resolve internal functions (#12522) ([6ea4be2](https://github.com/vitejs/vite/commit/6ea4be2)), closes [#12522](https://github.com/vitejs/vite/issues/12522)
* perf: improve package cache usage (#12512) ([abc2b9c](https://github.com/vitejs/vite/commit/abc2b9c)), closes [#12512](https://github.com/vitejs/vite/issues/12512)
* perf: more regex improvements (#12520) ([abf536f](https://github.com/vitejs/vite/commit/abf536f)), closes [#12520](https://github.com/vitejs/vite/issues/12520)
* perf: regex to startsWith/slice in utils (#12532) ([debc6e2](https://github.com/vitejs/vite/commit/debc6e2)), closes [#12532](https://github.com/vitejs/vite/issues/12532)
* perf: remove regex in ImportMetaURL plugins (#12502) ([1030049](https://github.com/vitejs/vite/commit/1030049)), closes [#12502](https://github.com/vitejs/vite/issues/12502)
* perf: replace endsWith with === (#12539) ([7eb52ec](https://github.com/vitejs/vite/commit/7eb52ec)), closes [#12539](https://github.com/vitejs/vite/issues/12539)
* perf: replace startsWith with === (#12531) ([9cce026](https://github.com/vitejs/vite/commit/9cce026)), closes [#12531](https://github.com/vitejs/vite/issues/12531)
* perf: reuse regex in plugins (#12518) ([da43936](https://github.com/vitejs/vite/commit/da43936)), closes [#12518](https://github.com/vitejs/vite/issues/12518)
* perf: use `safeRealpath` in `getRealpath` (#12551) ([cec2320](https://github.com/vitejs/vite/commit/cec2320)), closes [#12551](https://github.com/vitejs/vite/issues/12551)
* perf(css): improve postcss config resolve (#12484) ([58e99b6](https://github.com/vitejs/vite/commit/58e99b6)), closes [#12484](https://github.com/vitejs/vite/issues/12484)
* perf(esbuild): make tsconfck non-blocking (#12548) ([e5cdff7](https://github.com/vitejs/vite/commit/e5cdff7)), closes [#12548](https://github.com/vitejs/vite/issues/12548)
* perf(esbuild): update tsconfck to consume faster find-all implementation (#12541) ([b6ea25a](https://github.com/vitejs/vite/commit/b6ea25a)), closes [#12541](https://github.com/vitejs/vite/issues/12541)
* perf(resolve): fix browser mapping nearest package.json check (#12550) ([eac376e](https://github.com/vitejs/vite/commit/eac376e)), closes [#12550](https://github.com/vitejs/vite/issues/12550)
* perf(resolve): improve package.json resolve speed (#12441) ([1fc8c65](https://github.com/vitejs/vite/commit/1fc8c65)), closes [#12441](https://github.com/vitejs/vite/issues/12441)
* perf(resolve): refactor package.json handling for deep imports (#12461) ([596b661](https://github.com/vitejs/vite/commit/596b661)), closes [#12461](https://github.com/vitejs/vite/issues/12461)
* perf(resolve): refactor tryFsResolve and tryResolveFile (#12542) ([3f70f47](https://github.com/vitejs/vite/commit/3f70f47))
* perf(resolve): skip absolute paths in root as url checks (#12476) ([8d2931b](https://github.com/vitejs/vite/commit/8d2931b)), closes [#12476](https://github.com/vitejs/vite/issues/12476)
* perf(resolve): support # in path only for dependencies (#12469) ([6559fc7](https://github.com/vitejs/vite/commit/6559fc7)), closes [#12469](https://github.com/vitejs/vite/issues/12469)
* fix: avoid crash because of no access permission (#12552) ([eea1682](https://github.com/vitejs/vite/commit/eea1682)), closes [#12552](https://github.com/vitejs/vite/issues/12552)
* fix: esbuild complains with extra fields (#12516) ([7be0ba5](https://github.com/vitejs/vite/commit/7be0ba5)), closes [#12516](https://github.com/vitejs/vite/issues/12516)
* fix: escape replacements in clientInjections (#12486) ([3765067](https://github.com/vitejs/vite/commit/3765067)), closes [#12486](https://github.com/vitejs/vite/issues/12486)
* fix: open browser reuse logic (#12535) ([04d14af](https://github.com/vitejs/vite/commit/04d14af)), closes [#12535](https://github.com/vitejs/vite/issues/12535)
* fix: prevent error on not set location href (#12494) ([2fb8527](https://github.com/vitejs/vite/commit/2fb8527)), closes [#12494](https://github.com/vitejs/vite/issues/12494)
* fix: simplify prettyUrl (#12488) ([ebe5aa5](https://github.com/vitejs/vite/commit/ebe5aa5)), closes [#12488](https://github.com/vitejs/vite/issues/12488)
* fix(config): add random number to temp transpiled file (#12150) ([2b2ba61](https://github.com/vitejs/vite/commit/2b2ba61)), closes [#12150](https://github.com/vitejs/vite/issues/12150)
* fix(deps): update all non-major dependencies (#12389) ([3e60b77](https://github.com/vitejs/vite/commit/3e60b77)), closes [#12389](https://github.com/vitejs/vite/issues/12389)
* fix(html): public asset urls always being treated as paths (fix #11857) (#11870) ([46d1352](https://github.com/vitejs/vite/commit/46d1352)), closes [#11857](https://github.com/vitejs/vite/issues/11857) [#11870](https://github.com/vitejs/vite/issues/11870)
* fix(ssr): hoist import statements to the top (#12274) ([33baff5](https://github.com/vitejs/vite/commit/33baff5)), closes [#12274](https://github.com/vitejs/vite/issues/12274)
* fix(ssr): hoist re-exports with imports (#12530) ([45549e4](https://github.com/vitejs/vite/commit/45549e4)), closes [#12530](https://github.com/vitejs/vite/issues/12530)
* feat: add opus filetype to assets & mime types (#12526) ([63524ba](https://github.com/vitejs/vite/commit/63524ba)), closes [#12526](https://github.com/vitejs/vite/issues/12526)
* refactor: esbuild plugin config logic (#12493) ([45b5b0f](https://github.com/vitejs/vite/commit/45b5b0f)), closes [#12493](https://github.com/vitejs/vite/issues/12493)
* chore: better error hint for data URI mime type (#12496) ([0cb9171](https://github.com/vitejs/vite/commit/0cb9171)), closes [#12496](https://github.com/vitejs/vite/issues/12496)
* chore: remove unneded async in resolveId hook (#12499) ([e6337aa](https://github.com/vitejs/vite/commit/e6337aa)), closes [#12499](https://github.com/vitejs/vite/issues/12499)
* chore: upgrade rollup 3.20.0 (#12497) ([7288a24](https://github.com/vitejs/vite/commit/7288a24)), closes [#12497](https://github.com/vitejs/vite/issues/12497)
* build: should generate Hi-res sourcemap for dev (#12501) ([1502617](https://github.com/vitejs/vite/commit/1502617)), closes [#12501](https://github.com/vitejs/vite/issues/12501)



## <small>4.2.1 (2023-03-20)</small>

* release: v4.2.1 ([a53feb5](https://github.com/vitejs/vite/commit/a53feb5))
* fix: add `virtual:` to virtual module source map ignore (#12444) ([c4aa28f](https://github.com/vitejs/vite/commit/c4aa28f)), closes [#12444](https://github.com/vitejs/vite/issues/12444)
* fix(css): inject source content conditionally (#12449) ([3e665f6](https://github.com/vitejs/vite/commit/3e665f6)), closes [#12449](https://github.com/vitejs/vite/issues/12449)
* fix(worker): using data URLs for inline shared worker (#12014) ([79a5007](https://github.com/vitejs/vite/commit/79a5007)), closes [#12014](https://github.com/vitejs/vite/issues/12014)
* chore: changelog edits for 4.2 (#12438) ([ce047e3](https://github.com/vitejs/vite/commit/ce047e3)), closes [#12438](https://github.com/vitejs/vite/issues/12438)



## 4.2.0 (2023-03-16)

* release: v4.2.0 ([9dbb7f7](https://github.com/vitejs/vite/commit/9dbb7f7))
* feat: add status message for 504 caused by optimizer (#12435) ([5cdd3fa](https://github.com/vitejs/vite/commit/5cdd3fa)), closes [#12435](https://github.com/vitejs/vite/issues/12435)
* fix: html env replacement plugin position (#12404) ([96f36a9](https://github.com/vitejs/vite/commit/96f36a9)), closes [#12404](https://github.com/vitejs/vite/issues/12404)
* fix(optimizer): # symbol in deps id stripped by browser (#12415) ([e23f690](https://github.com/vitejs/vite/commit/e23f690)), closes [#12415](https://github.com/vitejs/vite/issues/12415)
* fix(resolve): rebase sub imports relative path (#12373) ([fe1d61a](https://github.com/vitejs/vite/commit/fe1d61a)), closes [#12373](https://github.com/vitejs/vite/issues/12373)
* fix(server): should close server after create new server (#12379) ([d23605d](https://github.com/vitejs/vite/commit/d23605d)), closes [#12379](https://github.com/vitejs/vite/issues/12379)
* docs: correct description for UserConfig.envDir when used with relative path (#12429) ([2b37cde](https://github.com/vitejs/vite/commit/2b37cde)), closes [#12429](https://github.com/vitejs/vite/issues/12429)
* refactor(resolve): remove deep import syntax handling (#12381) ([42e0d6a](https://github.com/vitejs/vite/commit/42e0d6a)), closes [#12381](https://github.com/vitejs/vite/issues/12381)



## 4.2.0-beta.2 (2023-03-13)

* release: v4.2.0-beta.2 ([d89de6c](https://github.com/vitejs/vite/commit/d89de6c))
* chore: fix test misc (#12392) ([a595b11](https://github.com/vitejs/vite/commit/a595b11)), closes [#12392](https://github.com/vitejs/vite/issues/12392)
* chore: remove build warn filter (#12391) ([0755cf2](https://github.com/vitejs/vite/commit/0755cf2)), closes [#12391](https://github.com/vitejs/vite/issues/12391)
* chore: update tsconfck to 2.1.0 to add support for typescript 5 config syntax (#12401) ([3f1c379](https://github.com/vitejs/vite/commit/3f1c379)), closes [#12401](https://github.com/vitejs/vite/issues/12401)
* chore(deps): update all non-major dependencies (#12299) ([b41336e](https://github.com/vitejs/vite/commit/b41336e)), closes [#12299](https://github.com/vitejs/vite/issues/12299)
* chore(utils): remove redundant type judgment (#12345) ([01a0056](https://github.com/vitejs/vite/commit/01a0056)), closes [#12345](https://github.com/vitejs/vite/issues/12345)
* feat: default esbuild jsxDev based on config.isProduction (#12386) ([f24c2b0](https://github.com/vitejs/vite/commit/f24c2b0)), closes [#12386](https://github.com/vitejs/vite/issues/12386)
* feat(css): add build.cssMinify (#12207) ([90431f2](https://github.com/vitejs/vite/commit/90431f2)), closes [#12207](https://github.com/vitejs/vite/issues/12207)
* feat(types): export Rollup namespace (#12316) ([6e49e52](https://github.com/vitejs/vite/commit/6e49e52)), closes [#12316](https://github.com/vitejs/vite/issues/12316)
* fix: print urls when dns order change (#12261) ([e57cacf](https://github.com/vitejs/vite/commit/e57cacf)), closes [#12261](https://github.com/vitejs/vite/issues/12261)
* fix: throw ssr import error directly (fix #12322) (#12324) ([21ffc6a](https://github.com/vitejs/vite/commit/21ffc6a)), closes [#12322](https://github.com/vitejs/vite/issues/12322) [#12324](https://github.com/vitejs/vite/issues/12324)
* fix(config): watch config even outside of root (#12321) ([7e2fff7](https://github.com/vitejs/vite/commit/7e2fff7)), closes [#12321](https://github.com/vitejs/vite/issues/12321)
* fix(config): watch envDir even outside of root (#12349) ([131f3ee](https://github.com/vitejs/vite/commit/131f3ee)), closes [#12349](https://github.com/vitejs/vite/issues/12349)
* fix(define): correctly replace SSR in dev (#12204) ([0f6de4d](https://github.com/vitejs/vite/commit/0f6de4d)), closes [#12204](https://github.com/vitejs/vite/issues/12204)
* fix(optimizer): suppress esbuild cancel error (#12358) ([86a24e4](https://github.com/vitejs/vite/commit/86a24e4)), closes [#12358](https://github.com/vitejs/vite/issues/12358)
* fix(optimizer): transform css require to import directly (#12343) ([716286e](https://github.com/vitejs/vite/commit/716286e)), closes [#12343](https://github.com/vitejs/vite/issues/12343)
* fix(reporter): build.assetsDir should not impact output when in lib mode (#12108) ([b12f457](https://github.com/vitejs/vite/commit/b12f457)), closes [#12108](https://github.com/vitejs/vite/issues/12108)
* fix(types): avoid resolve.exports types for bundling (#12346) ([6b40f03](https://github.com/vitejs/vite/commit/6b40f03)), closes [#12346](https://github.com/vitejs/vite/issues/12346)
* fix(worker): force rollup to build worker module under watch mode (#11919) ([d464679](https://github.com/vitejs/vite/commit/d464679)), closes [#11919](https://github.com/vitejs/vite/issues/11919)
* ci: should exit when build-types-check failed (#12378) ([821d6b8](https://github.com/vitejs/vite/commit/821d6b8)), closes [#12378](https://github.com/vitejs/vite/issues/12378)



## 4.2.0-beta.1 (2023-03-07)

* release: v4.2.0-beta.1 ([4cf6d46](https://github.com/vitejs/vite/commit/4cf6d46))
* feat: add `sourcemapIgnoreList` configuration option (#12174) ([f875580](https://github.com/vitejs/vite/commit/f875580)), closes [#12174](https://github.com/vitejs/vite/issues/12174)
* feat: cancellable scan during optimization (#12225) ([1e1cd3b](https://github.com/vitejs/vite/commit/1e1cd3b)), closes [#12225](https://github.com/vitejs/vite/issues/12225)
* feat: don't override `build.target` if terser is 5.16.0+ (#12197) ([9885f6f](https://github.com/vitejs/vite/commit/9885f6f)), closes [#12197](https://github.com/vitejs/vite/issues/12197)
* feat: support ESM subpath imports (#7770) ([cc92da9](https://github.com/vitejs/vite/commit/cc92da9)), closes [#7770](https://github.com/vitejs/vite/issues/7770)
* feat(css): add preprocessor option to define stylus vars & funcs (#7227) ([5968bec](https://github.com/vitejs/vite/commit/5968bec)), closes [#7227](https://github.com/vitejs/vite/issues/7227)
* feat(css): support resolving stylesheets from exports map (#7817) ([108aadf](https://github.com/vitejs/vite/commit/108aadf)), closes [#7817](https://github.com/vitejs/vite/issues/7817)
* feat(html): support env replacement (#12202) ([4f2c49f](https://github.com/vitejs/vite/commit/4f2c49f)), closes [#12202](https://github.com/vitejs/vite/issues/12202)
* fix:  resolve browser mapping using bare imports (fix #11208) (#11219) ([22de84f](https://github.com/vitejs/vite/commit/22de84f)), closes [#11208](https://github.com/vitejs/vite/issues/11208) [#11219](https://github.com/vitejs/vite/issues/11219)
* fix: avoid null sourcePath in `server.sourcemapIgnoreList` (#12251) ([209c3bd](https://github.com/vitejs/vite/commit/209c3bd)), closes [#12251](https://github.com/vitejs/vite/issues/12251)
* fix: configure proxy before subscribing to error events (#12263) ([c35e100](https://github.com/vitejs/vite/commit/c35e100)), closes [#12263](https://github.com/vitejs/vite/issues/12263)
* fix: enforce absolute path for server.sourcemapIgnoreList (#12309) ([ab6ae07](https://github.com/vitejs/vite/commit/ab6ae07)), closes [#12309](https://github.com/vitejs/vite/issues/12309)
* fix: handle error without line and column in loc (#12312) ([ce18eba](https://github.com/vitejs/vite/commit/ce18eba)), closes [#12312](https://github.com/vitejs/vite/issues/12312)
* fix: properly clean up optimization temp folder (#12237) ([fbbf8fe](https://github.com/vitejs/vite/commit/fbbf8fe)), closes [#12237](https://github.com/vitejs/vite/issues/12237)
* fix: unique dep optimizer temp folders (#12252) ([38ce81c](https://github.com/vitejs/vite/commit/38ce81c)), closes [#12252](https://github.com/vitejs/vite/issues/12252)
* fix(build-import-analysis): should not append ?used when css request has ?url or ?raw (#11910) ([e3f725f](https://github.com/vitejs/vite/commit/e3f725f)), closes [#11910](https://github.com/vitejs/vite/issues/11910)
* fix(optimizer): don not call context.rebuild after cancel (#12264) ([520d84e](https://github.com/vitejs/vite/commit/520d84e)), closes [#12264](https://github.com/vitejs/vite/issues/12264)
* fix(resolve): update `resolve.exports` to `2.0.1` to fix `*` resolution issue (#12314) ([523d6f7](https://github.com/vitejs/vite/commit/523d6f7)), closes [#12314](https://github.com/vitejs/vite/issues/12314)
* chore: upgrade to Rollup 3.18 (#12283) ([cde9191](https://github.com/vitejs/vite/commit/cde9191)), closes [#12283](https://github.com/vitejs/vite/issues/12283)
* chore(deps): update es-module-lexer (#12230) ([d617093](https://github.com/vitejs/vite/commit/d617093)), closes [#12230](https://github.com/vitejs/vite/issues/12230)



## 4.2.0-beta.0 (2023-02-27)

* release: v4.2.0-beta.0 ([bf9c49f](https://github.com/vitejs/vite/commit/bf9c49f))
* fix: use relative paths in `sources` for transformed source maps (#12079) ([bcbc582](https://github.com/vitejs/vite/commit/bcbc582)), closes [#12079](https://github.com/vitejs/vite/issues/12079)
* fix(cli): after setting server.open, the default open is inconsistent… (#11974) ([33a38db](https://github.com/vitejs/vite/commit/33a38db)), closes [#11974](https://github.com/vitejs/vite/issues/11974)
* fix(client-inject): replace globalThis.process.env.NODE_ENV (fix #12185) (#12194) ([2063648](https://github.com/vitejs/vite/commit/2063648)), closes [#12185](https://github.com/vitejs/vite/issues/12185) [#12194](https://github.com/vitejs/vite/issues/12194)
* fix(css): should not rebase http url for less (fix: #12155) (#12195) ([9cca30d](https://github.com/vitejs/vite/commit/9cca30d)), closes [#12155](https://github.com/vitejs/vite/issues/12155) [#12195](https://github.com/vitejs/vite/issues/12195)
* fix(deps): update all non-major dependencies (#12036) ([48150f2](https://github.com/vitejs/vite/commit/48150f2)), closes [#12036](https://github.com/vitejs/vite/issues/12036)
* fix(import-analysis): improve error for jsx to not be preserve in tsconfig (#12018) ([91fac1c](https://github.com/vitejs/vite/commit/91fac1c)), closes [#12018](https://github.com/vitejs/vite/issues/12018)
* fix(optimizer): log esbuild error when scanning deps (#11977) ([20e6060](https://github.com/vitejs/vite/commit/20e6060)), closes [#11977](https://github.com/vitejs/vite/issues/11977)
* fix(optimizer): log unoptimizable entries (#12138) ([2c93e0b](https://github.com/vitejs/vite/commit/2c93e0b)), closes [#12138](https://github.com/vitejs/vite/issues/12138)
* fix(server): watch env files creating and deleting (fix #12127) (#12129) ([cc3724f](https://github.com/vitejs/vite/commit/cc3724f)), closes [#12127](https://github.com/vitejs/vite/issues/12127) [#12129](https://github.com/vitejs/vite/issues/12129)
* build: correct d.ts output dir in development (#12212) ([b90bc1f](https://github.com/vitejs/vite/commit/b90bc1f)), closes [#12212](https://github.com/vitejs/vite/issues/12212)
* refactor: customize ErrorOverlay (part 2) (#11830) ([4159e6f](https://github.com/vitejs/vite/commit/4159e6f)), closes [#11830](https://github.com/vitejs/vite/issues/11830)
* refactor: remove constructed sheet type style injection (#11818) ([1a6a0c2](https://github.com/vitejs/vite/commit/1a6a0c2)), closes [#11818](https://github.com/vitejs/vite/issues/11818)
* refactor(importAnalysis): cache injected env string (#12154) ([2aad552](https://github.com/vitejs/vite/commit/2aad552)), closes [#12154](https://github.com/vitejs/vite/issues/12154)
* feat: esbuild 0.17 (#11908) ([9d42f06](https://github.com/vitejs/vite/commit/9d42f06)), closes [#11908](https://github.com/vitejs/vite/issues/11908)
* feat: ignore list client injected sources (#12170) ([8a98aef](https://github.com/vitejs/vite/commit/8a98aef)), closes [#12170](https://github.com/vitejs/vite/issues/12170)
* feat: support rollup plugin this.load in plugin container context (#11469) ([abfa804](https://github.com/vitejs/vite/commit/abfa804)), closes [#11469](https://github.com/vitejs/vite/issues/11469)
* feat(cli): allow to specify sourcemap mode via --sourcemap build's option (#11505) ([ee3b90a](https://github.com/vitejs/vite/commit/ee3b90a)), closes [#11505](https://github.com/vitejs/vite/issues/11505)
* feat(reporter): report built time (#12100) ([f2ad222](https://github.com/vitejs/vite/commit/f2ad222)), closes [#12100](https://github.com/vitejs/vite/issues/12100)
* chore(define): remove inconsistent comment with import.meta.env replacement in lib mode (#12152) ([2556f88](https://github.com/vitejs/vite/commit/2556f88)), closes [#12152](https://github.com/vitejs/vite/issues/12152)
* chore(deps): update rollup to 3.17.2 (#12110) ([e54ffbd](https://github.com/vitejs/vite/commit/e54ffbd)), closes [#12110](https://github.com/vitejs/vite/issues/12110)



## <small>4.1.4 (2023-02-21)</small>

* release: v4.1.4 ([b5a2485](https://github.com/vitejs/vite/commit/b5a2485))
* fix(define): should not stringify vite internal env (#12120) ([73c3999](https://github.com/vitejs/vite/commit/73c3999)), closes [#12120](https://github.com/vitejs/vite/issues/12120)
* docs: update rollup docs links (#12130) ([439a73f](https://github.com/vitejs/vite/commit/439a73f)), closes [#12130](https://github.com/vitejs/vite/issues/12130)



## <small>4.1.3 (2023-02-20)</small>

* release: v4.1.3 ([04e4df3](https://github.com/vitejs/vite/commit/04e4df3))
* fix: catch and handle websocket error (#11991) (#12007) ([4b5cc9f](https://github.com/vitejs/vite/commit/4b5cc9f)), closes [#11991](https://github.com/vitejs/vite/issues/11991) [#12007](https://github.com/vitejs/vite/issues/12007)
* fix: do not append version query param when scanning for dependencies (#11961) ([575bcf6](https://github.com/vitejs/vite/commit/575bcf6)), closes [#11961](https://github.com/vitejs/vite/issues/11961)
* fix(css): handle pure css chunk heuristic with special queries (#12091) ([a873af5](https://github.com/vitejs/vite/commit/a873af5)), closes [#12091](https://github.com/vitejs/vite/issues/12091)
* fix(esbuild): umd helper insert into wrong position in lib mode (#11988) ([86bc243](https://github.com/vitejs/vite/commit/86bc243)), closes [#11988](https://github.com/vitejs/vite/issues/11988)
* fix(html): respect disable modulepreload (#12111) ([6c50119](https://github.com/vitejs/vite/commit/6c50119)), closes [#12111](https://github.com/vitejs/vite/issues/12111)
* fix(html): rewrite assets url in `<noscript>` (#11764) ([1dba285](https://github.com/vitejs/vite/commit/1dba285)), closes [#11764](https://github.com/vitejs/vite/issues/11764)
* feat(preview): improve error when build output missing (#12096) ([a0702a1](https://github.com/vitejs/vite/commit/a0702a1)), closes [#12096](https://github.com/vitejs/vite/issues/12096)
* feat(ssr): add importer path to error msg when invalid url import occur (#11606) ([70729c0](https://github.com/vitejs/vite/commit/70729c0)), closes [#11606](https://github.com/vitejs/vite/issues/11606)



## <small>4.1.2 (2023-02-17)</small>

* release: v4.1.2 ([6eee75c](https://github.com/vitejs/vite/commit/6eee75c))
* fix: correct access to `crossOrigin` attribute (#12023) ([6a0d356](https://github.com/vitejs/vite/commit/6a0d356)), closes [#12023](https://github.com/vitejs/vite/issues/12023)
* fix: narrow defineConfig return type (#12021) ([18fa8f0](https://github.com/vitejs/vite/commit/18fa8f0)), closes [#12021](https://github.com/vitejs/vite/issues/12021)
* fix(define): inconsistent env values in build mode (#12058) ([0a50c59](https://github.com/vitejs/vite/commit/0a50c59)), closes [#12058](https://github.com/vitejs/vite/issues/12058)
* fix(env): compatible with env variables ended with unescaped $ (#12031) ([05b3df0](https://github.com/vitejs/vite/commit/05b3df0)), closes [#12031](https://github.com/vitejs/vite/issues/12031)
* fix(ssr): print file url in `ssrTransform` parse error (#12060) ([19f39f7](https://github.com/vitejs/vite/commit/19f39f7)), closes [#12060](https://github.com/vitejs/vite/issues/12060)
* revert: narrow defineConfig return type (#12077) ([54d511e](https://github.com/vitejs/vite/commit/54d511e)), closes [#12077](https://github.com/vitejs/vite/issues/12077)
* feat: support `import.meta.hot?.accept` (#12053) ([081c27f](https://github.com/vitejs/vite/commit/081c27f)), closes [#12053](https://github.com/vitejs/vite/issues/12053)
* chore: add jsdoc default value (#11746) ([8c87af7](https://github.com/vitejs/vite/commit/8c87af7)), closes [#11746](https://github.com/vitejs/vite/issues/11746)
* chore: fix typos (#12032) ([ee1a686](https://github.com/vitejs/vite/commit/ee1a686)), closes [#12032](https://github.com/vitejs/vite/issues/12032)
* chore(deps): update dependency strip-literal to v1 (#12044) ([5bd6c0a](https://github.com/vitejs/vite/commit/5bd6c0a)), closes [#12044](https://github.com/vitejs/vite/issues/12044)
* chore(pluginContainer): simplify error position judge condition (#12003) ([e3ef9f4](https://github.com/vitejs/vite/commit/e3ef9f4)), closes [#12003](https://github.com/vitejs/vite/issues/12003)



## <small>4.1.1 (2023-02-02)</small>

* release: v4.1.1 ([4db491b](https://github.com/vitejs/vite/commit/4db491b))
* chore: 4.1.0 changelog cleanup (#11900) ([7747d32](https://github.com/vitejs/vite/commit/7747d32)), closes [#11900](https://github.com/vitejs/vite/issues/11900)
* fix: catch statSync error (#11907) ([f80b9a2](https://github.com/vitejs/vite/commit/f80b9a2)), closes [#11907](https://github.com/vitejs/vite/issues/11907)



## 4.1.0 (2023-02-02)

* release: v4.1.0 ([c57c21c](https://github.com/vitejs/vite/commit/c57c21c))



## 4.1.0-beta.2 (2023-02-01)

* release: v4.1.0-beta.2 ([88dad65](https://github.com/vitejs/vite/commit/88dad65))
* fix: await bundle closing (#11873) ([1e6768d](https://github.com/vitejs/vite/commit/1e6768d)), closes [#11873](https://github.com/vitejs/vite/issues/11873)
* fix: make viteMetadata property of RenderedChunk optional (#11768) ([128f09e](https://github.com/vitejs/vite/commit/128f09e)), closes [#11768](https://github.com/vitejs/vite/issues/11768)
* fix: replace import.meta.hot with undefined in the production (#11317) ([73afe6d](https://github.com/vitejs/vite/commit/73afe6d)), closes [#11317](https://github.com/vitejs/vite/issues/11317)
* fix: update CJS interop error message (#11842) ([356ddfe](https://github.com/vitejs/vite/commit/356ddfe)), closes [#11842](https://github.com/vitejs/vite/issues/11842)
* fix(client): serve client sources next to deployed scripts (#11865) ([63bd261](https://github.com/vitejs/vite/commit/63bd261)), closes [#11865](https://github.com/vitejs/vite/issues/11865)
* fix(deps): update all non-major dependencies (#11846) ([5d55083](https://github.com/vitejs/vite/commit/5d55083)), closes [#11846](https://github.com/vitejs/vite/issues/11846)
* fix(esbuild): avoid polluting global namespace while minify is false (#11882) ([c895379](https://github.com/vitejs/vite/commit/c895379)), closes [#11882](https://github.com/vitejs/vite/issues/11882)
* docs: add troubleshooting for browser compat (#11877) ([cc00b52](https://github.com/vitejs/vite/commit/cc00b52)), closes [#11877](https://github.com/vitejs/vite/issues/11877)



## 4.1.0-beta.1 (2023-01-26)

* release: v4.1.0-beta.1 ([e674f85](https://github.com/vitejs/vite/commit/e674f85))
* fix: deep resolve side effects when glob does not contain / (#11807) ([f3a0c3b](https://github.com/vitejs/vite/commit/f3a0c3b)), closes [#11807](https://github.com/vitejs/vite/issues/11807)
* fix: duplicated sourceMappingURL for worker bundles (fix #11601) (#11602) ([5444781](https://github.com/vitejs/vite/commit/5444781)), closes [#11601](https://github.com/vitejs/vite/issues/11601) [#11602](https://github.com/vitejs/vite/issues/11602)
* fix: emit assets from SSR build (#11430) ([ffbdcdb](https://github.com/vitejs/vite/commit/ffbdcdb)), closes [#11430](https://github.com/vitejs/vite/issues/11430)
* fix: revert "load sourcemaps alongside modules (#11576)" (#11775) ([697dd00](https://github.com/vitejs/vite/commit/697dd00)), closes [#11576](https://github.com/vitejs/vite/issues/11576) [#11775](https://github.com/vitejs/vite/issues/11775)
* fix: scope tracking for shadowing variables in blocks (#11806) (#11811) ([568bdab](https://github.com/vitejs/vite/commit/568bdab)), closes [#11806](https://github.com/vitejs/vite/issues/11806) [#11811](https://github.com/vitejs/vite/issues/11811)
* fix(cli): exit 1 on ctrl+c (#11563) ([fb77411](https://github.com/vitejs/vite/commit/fb77411)), closes [#11563](https://github.com/vitejs/vite/issues/11563)
* fix(css): insert styles in the same position (#11763) ([d2f1381](https://github.com/vitejs/vite/commit/d2f1381)), closes [#11763](https://github.com/vitejs/vite/issues/11763)
* fix(esbuild): check server before reload tsconfig (#11747) ([c56b954](https://github.com/vitejs/vite/commit/c56b954)), closes [#11747](https://github.com/vitejs/vite/issues/11747)
* fix(hmr): hmr websocket failure for custom middleware mode with server.hmr.server (#11487) ([00919bb](https://github.com/vitejs/vite/commit/00919bb)), closes [#11487](https://github.com/vitejs/vite/issues/11487)
* fix(ssr): load sourcemaps alongside modules (fix: #3288) (#11576) ([dc05e97](https://github.com/vitejs/vite/commit/dc05e97)), closes [#3288](https://github.com/vitejs/vite/issues/3288) [#11576](https://github.com/vitejs/vite/issues/11576)
* docs: update rollup docs links (#11809) ([4bbebf3](https://github.com/vitejs/vite/commit/4bbebf3)), closes [#11809](https://github.com/vitejs/vite/issues/11809)
* chore: extract DEFAULT_DEV_PORT and DEFAULT_PREVIEW_PORT (#11669) ([c9f009d](https://github.com/vitejs/vite/commit/c9f009d)), closes [#11669](https://github.com/vitejs/vite/issues/11669)
* chore: fix type warning during building vite (#11673) ([305b76e](https://github.com/vitejs/vite/commit/305b76e)), closes [#11673](https://github.com/vitejs/vite/issues/11673)
* chore: remove unused `module` field in `package.json` (#11698) ([595b55f](https://github.com/vitejs/vite/commit/595b55f)), closes [#11698](https://github.com/vitejs/vite/issues/11698)
* chore: shrink genSourceMapUrl type (#11667) ([9fb406b](https://github.com/vitejs/vite/commit/9fb406b)), closes [#11667](https://github.com/vitejs/vite/issues/11667)
* chore: update packages' (vite, vite-legacy) keywords (#11402) ([a56bc34](https://github.com/vitejs/vite/commit/a56bc34)), closes [#11402](https://github.com/vitejs/vite/issues/11402)
* chore: update rollup (#11710) ([193d55c](https://github.com/vitejs/vite/commit/193d55c)), closes [#11710](https://github.com/vitejs/vite/issues/11710)
* chore: use jsdoc's default tag (#11725) ([a6df6b4](https://github.com/vitejs/vite/commit/a6df6b4)), closes [#11725](https://github.com/vitejs/vite/issues/11725)
* chore(deps): update all non-major dependencies (#11701) ([1d2ee63](https://github.com/vitejs/vite/commit/1d2ee63)), closes [#11701](https://github.com/vitejs/vite/issues/11701)
* chore(deps): update all non-major dependencies (#11787) ([271394f](https://github.com/vitejs/vite/commit/271394f)), closes [#11787](https://github.com/vitejs/vite/issues/11787)
* chore(deps): update dependency @rollup/plugin-typescript to v11 (#11702) ([f40d511](https://github.com/vitejs/vite/commit/f40d511)), closes [#11702](https://github.com/vitejs/vite/issues/11702)
* feat: add experimental option to skip SSR transform (#11411) ([e781ef3](https://github.com/vitejs/vite/commit/e781ef3)), closes [#11411](https://github.com/vitejs/vite/issues/11411)
* refactor: remove unnecessary if conditions (#11668) ([9c114c5](https://github.com/vitejs/vite/commit/9c114c5)), closes [#11668](https://github.com/vitejs/vite/issues/11668)
* refactor: upgrade resolve.exports (#11712) ([00a79ec](https://github.com/vitejs/vite/commit/00a79ec)), closes [#11712](https://github.com/vitejs/vite/issues/11712)



## 4.1.0-beta.0 (2023-01-09)

* release: v4.1.0-beta.0 ([d9323aa](https://github.com/vitejs/vite/commit/d9323aa))
* chore(deps): update all non-major dependencies (#11419) ([896475d](https://github.com/vitejs/vite/commit/896475d)), closes [#11419](https://github.com/vitejs/vite/issues/11419)
* fix: remove moment from force interop packages (#11502) ([b89ddd6](https://github.com/vitejs/vite/commit/b89ddd6)), closes [#11502](https://github.com/vitejs/vite/issues/11502)
* fix(css): fix stale css when reloading with hmr disabled (#10270) (#11506) ([e5807c4](https://github.com/vitejs/vite/commit/e5807c4)), closes [#10270](https://github.com/vitejs/vite/issues/10270) [#11506](https://github.com/vitejs/vite/issues/11506)
* fix(hmr): base default protocol on client source location (#11497) ([167753d](https://github.com/vitejs/vite/commit/167753d)), closes [#11497](https://github.com/vitejs/vite/issues/11497)
* fix(metadata): expose viteMetadata type (#11511) ([32dee3c](https://github.com/vitejs/vite/commit/32dee3c)), closes [#11511](https://github.com/vitejs/vite/issues/11511)
* fix(resolve): ensure exports has precedence over mainFields (cherry pick #11234) (#11595) ([691e432](https://github.com/vitejs/vite/commit/691e432)), closes [#11234](https://github.com/vitejs/vite/issues/11234) [#11595](https://github.com/vitejs/vite/issues/11595)
* fix(resolve): use only root package.json as exports source (#11259) ([b9afa6e](https://github.com/vitejs/vite/commit/b9afa6e)), closes [#11259](https://github.com/vitejs/vite/issues/11259)
* feat: reproducible manifest (#11542) ([efc8979](https://github.com/vitejs/vite/commit/efc8979)), closes [#11542](https://github.com/vitejs/vite/issues/11542)
* feat: support BROWSER and BROWSER_ARGS in env file (#11513) ([8972868](https://github.com/vitejs/vite/commit/8972868)), closes [#11513](https://github.com/vitejs/vite/issues/11513)
* feat(cli): clear console by pressing c (#11493) (#11494) ([1ae018f](https://github.com/vitejs/vite/commit/1ae018f)), closes [#11493](https://github.com/vitejs/vite/issues/11493) [#11494](https://github.com/vitejs/vite/issues/11494)
* perf(build): disable rollup cache for builds (#11454) ([580ba7a](https://github.com/vitejs/vite/commit/580ba7a)), closes [#11454](https://github.com/vitejs/vite/issues/11454)
* perf(resolve): improve file existence check (#11436) ([4a12b89](https://github.com/vitejs/vite/commit/4a12b89)), closes [#11436](https://github.com/vitejs/vite/issues/11436)
* refactor(build): close rollup bundle directly (#11460) ([a802828](https://github.com/vitejs/vite/commit/a802828)), closes [#11460](https://github.com/vitejs/vite/issues/11460)



## <small>4.0.4 (2023-01-03)</small>

* release: v4.0.4 ([4f7a48f](https://github.com/vitejs/vite/commit/4f7a48f))
* fix: importmap should insert before module preload link (#11492) ([25c64d7](https://github.com/vitejs/vite/commit/25c64d7)), closes [#11492](https://github.com/vitejs/vite/issues/11492)
* fix: server.host with ipv6 missed [] (fix #11466) (#11509) ([2c38bae](https://github.com/vitejs/vite/commit/2c38bae)), closes [#11466](https://github.com/vitejs/vite/issues/11466) [#11509](https://github.com/vitejs/vite/issues/11509)
* fix: stop considering parent URLs as public file (#11145) ([568a014](https://github.com/vitejs/vite/commit/568a014)), closes [#11145](https://github.com/vitejs/vite/issues/11145)
* fix(build): invalidate chunk hash when css changed (#11475) ([7a97a04](https://github.com/vitejs/vite/commit/7a97a04)), closes [#11475](https://github.com/vitejs/vite/issues/11475)
* fix(cli): ctrl+C no longer kills processes (#11434) (#11518) ([718fc1d](https://github.com/vitejs/vite/commit/718fc1d)), closes [#11434](https://github.com/vitejs/vite/issues/11434) [#11518](https://github.com/vitejs/vite/issues/11518)
* fix(cli): revert ctrl+C no longer kills processes (#11434) (#11518) (#11562) ([3748acb](https://github.com/vitejs/vite/commit/3748acb)), closes [#11434](https://github.com/vitejs/vite/issues/11434) [#11518](https://github.com/vitejs/vite/issues/11518) [#11562](https://github.com/vitejs/vite/issues/11562)
* fix(optimizer): check .vite/deps directory existence before removing (#11499) ([1b043f9](https://github.com/vitejs/vite/commit/1b043f9)), closes [#11499](https://github.com/vitejs/vite/issues/11499)
* fix(ssr): emit js sourcemaps for ssr builds (#11343) ([f12a1ab](https://github.com/vitejs/vite/commit/f12a1ab)), closes [#11343](https://github.com/vitejs/vite/issues/11343)
* chore: update license (#11476) ([3d346c0](https://github.com/vitejs/vite/commit/3d346c0)), closes [#11476](https://github.com/vitejs/vite/issues/11476)
* chore(deps): update dependency @rollup/plugin-json to v6 (#11553) ([3647d07](https://github.com/vitejs/vite/commit/3647d07)), closes [#11553](https://github.com/vitejs/vite/issues/11553)



## <small>4.0.3 (2022-12-21)</small>

* release: v4.0.3 ([b9511f1](https://github.com/vitejs/vite/commit/b9511f1))
* chore(deps): update dependency @rollup/plugin-commonjs to v24 (#11420) ([241db16](https://github.com/vitejs/vite/commit/241db16)), closes [#11420](https://github.com/vitejs/vite/issues/11420)
* chore(typo): fix typo (#11445) ([ed80ea5](https://github.com/vitejs/vite/commit/ed80ea5)), closes [#11445](https://github.com/vitejs/vite/issues/11445)
* fix(ssr): ignore module exports condition (#11409) ([d3c9c0b](https://github.com/vitejs/vite/commit/d3c9c0b)), closes [#11409](https://github.com/vitejs/vite/issues/11409)
* feat: allow import.meta.hot define override (#8944) ([857d578](https://github.com/vitejs/vite/commit/857d578)), closes [#8944](https://github.com/vitejs/vite/issues/8944)



## <small>4.0.2 (2022-12-18)</small>

* release: v4.0.2 ([8ec44a5](https://github.com/vitejs/vite/commit/8ec44a5))
* fix: fix the error message in the `toOutputFilePathWithoutRuntime` function (#11367) ([8820f75](https://github.com/vitejs/vite/commit/8820f75)), closes [#11367](https://github.com/vitejs/vite/issues/11367)
* fix: make `vite optimize` prebundle for dev (#11387) ([b4ced0f](https://github.com/vitejs/vite/commit/b4ced0f)), closes [#11387](https://github.com/vitejs/vite/issues/11387)
* fix: revert #11290 (#11412) ([6587d2f](https://github.com/vitejs/vite/commit/6587d2f)), closes [#11290](https://github.com/vitejs/vite/issues/11290) [#11412](https://github.com/vitejs/vite/issues/11412)
* fix: server and preview open fails to add slash before relative path (#11394) ([57276b7](https://github.com/vitejs/vite/commit/57276b7)), closes [#11394](https://github.com/vitejs/vite/issues/11394)
* fix: skip applescript when no Chromium browser found (fixes #11205) (#11406) ([274d1f3](https://github.com/vitejs/vite/commit/274d1f3)), closes [#11205](https://github.com/vitejs/vite/issues/11205) [#11406](https://github.com/vitejs/vite/issues/11406)
* fix(deps): update dependency ufo to v1 (#11372) ([4288300](https://github.com/vitejs/vite/commit/4288300)), closes [#11372](https://github.com/vitejs/vite/issues/11372)
* chore: typecheck create-vite (#11295) ([af86e5b](https://github.com/vitejs/vite/commit/af86e5b)), closes [#11295](https://github.com/vitejs/vite/issues/11295)
* chore(deps): update dependency convert-source-map to v2 (#10548) ([8dc6528](https://github.com/vitejs/vite/commit/8dc6528)), closes [#10548](https://github.com/vitejs/vite/issues/10548)
* chore(deps): update dependency mlly to v1 (#11370) ([9662d4d](https://github.com/vitejs/vite/commit/9662d4d)), closes [#11370](https://github.com/vitejs/vite/issues/11370)



## <small>4.0.1 (2022-12-12)</small>

* release: v4.0.1 ([060cd66](https://github.com/vitejs/vite/commit/060cd66))
* feat: show server url by pressing `u` (#11319) ([8c0bb7b](https://github.com/vitejs/vite/commit/8c0bb7b)), closes [#11319](https://github.com/vitejs/vite/issues/11319)
* feat(html): clickable error position for html parse error (#11334) ([2e15f3d](https://github.com/vitejs/vite/commit/2e15f3d)), closes [#11334](https://github.com/vitejs/vite/issues/11334)
* fix: ?inline warning for .css.js file (#11347) ([729fb1a](https://github.com/vitejs/vite/commit/729fb1a)), closes [#11347](https://github.com/vitejs/vite/issues/11347)
* fix: check if build exists so preview doesn't show 404s due to nonexistent build (#10564) ([0a1db8c](https://github.com/vitejs/vite/commit/0a1db8c)), closes [#10564](https://github.com/vitejs/vite/issues/10564)
* fix: derive `useDefineForClassFields` value from `tsconfig.compilerOptions.target` (fixes #10296) (# ([42976d8](https://github.com/vitejs/vite/commit/42976d8)), closes [#10296](https://github.com/vitejs/vite/issues/10296) [#11301](https://github.com/vitejs/vite/issues/11301)
* fix: preview fallback (#11312) ([cfedf9c](https://github.com/vitejs/vite/commit/cfedf9c)), closes [#11312](https://github.com/vitejs/vite/issues/11312)
* fix: respect base when using `/__open-in-editor` (#11337) ([8856c2e](https://github.com/vitejs/vite/commit/8856c2e)), closes [#11337](https://github.com/vitejs/vite/issues/11337)
* fix: wrongly resolve to optimized doppelganger (#11290) ([34fec41](https://github.com/vitejs/vite/commit/34fec41)), closes [#11290](https://github.com/vitejs/vite/issues/11290)
* fix(env): test NODE_ENV override before expand (#11309) ([d0a9281](https://github.com/vitejs/vite/commit/d0a9281)), closes [#11309](https://github.com/vitejs/vite/issues/11309)
* fix(preview): Revert #10564 - throw Error on missing outDir (#11335) ([3aaa0ea](https://github.com/vitejs/vite/commit/3aaa0ea)), closes [#10564](https://github.com/vitejs/vite/issues/10564) [#11335](https://github.com/vitejs/vite/issues/11335) [#10564](https://github.com/vitejs/vite/issues/10564)
* docs: fix banner image in CHANGELOG.md (#11336) ([45b66f4](https://github.com/vitejs/vite/commit/45b66f4)), closes [#11336](https://github.com/vitejs/vite/issues/11336)
* chore: enable `@typescript-eslint/ban-ts-comment` (#11326) ([e58a4f0](https://github.com/vitejs/vite/commit/e58a4f0)), closes [#11326](https://github.com/vitejs/vite/issues/11326)
* chore: fix format (#11311) ([9c2b1c0](https://github.com/vitejs/vite/commit/9c2b1c0)), closes [#11311](https://github.com/vitejs/vite/issues/11311)
* chore: update changelog release notes for 4.0 (#11285) ([83abd37](https://github.com/vitejs/vite/commit/83abd37)), closes [#11285](https://github.com/vitejs/vite/issues/11285)
* chore(deps): update all non-major dependencies (#11321) ([dcc0004](https://github.com/vitejs/vite/commit/dcc0004)), closes [#11321](https://github.com/vitejs/vite/issues/11321)
* chore(esbuild): add test for configuration overrides (#11267) ([f897b64](https://github.com/vitejs/vite/commit/f897b64)), closes [#11267](https://github.com/vitejs/vite/issues/11267)



## 4.0.0 (2022-12-09)

* release: v4.0.0 ([566d4c7](https://github.com/vitejs/vite/commit/566d4c7))
* chore: add `\0` to virtual files id (#11261) ([02cdfa9](https://github.com/vitejs/vite/commit/02cdfa9)), closes [#11261](https://github.com/vitejs/vite/issues/11261)
* chore(deps): esbuild 0.16.3 (#11271) ([495c0be](https://github.com/vitejs/vite/commit/495c0be)), closes [#11271](https://github.com/vitejs/vite/issues/11271)



## 4.0.0-beta.7 (2022-12-08)

* release: v4.0.0-beta.7 ([84d6ca2](https://github.com/vitejs/vite/commit/84d6ca2))
* fix(resolve): revert ensure exports has precedence over mainFields (#11234) (#11270) ([8d05daf](https://github.com/vitejs/vite/commit/8d05daf)), closes [#11234](https://github.com/vitejs/vite/issues/11234) [#11270](https://github.com/vitejs/vite/issues/11270)



## 4.0.0-beta.6 (2022-12-08)

* release: v4.0.0-beta.6 ([a9850be](https://github.com/vitejs/vite/commit/a9850be))
* chore: update esbuild to 0.16.2 (#11265) ([e1d8d46](https://github.com/vitejs/vite/commit/e1d8d46)), closes [#11265](https://github.com/vitejs/vite/issues/11265)
* chore(deps): rollup 3.7 (#11269) ([fe388df](https://github.com/vitejs/vite/commit/fe388df)), closes [#11269](https://github.com/vitejs/vite/issues/11269)
* fix: skip shortcuts on non-tty stdin (#11263) ([9602686](https://github.com/vitejs/vite/commit/9602686)), closes [#11263](https://github.com/vitejs/vite/issues/11263)
* fix(ssr): skip rewriting stack trace if it's already rewritten (fixes #11037) (#11070) ([feb8ce0](https://github.com/vitejs/vite/commit/feb8ce0)), closes [#11037](https://github.com/vitejs/vite/issues/11037) [#11070](https://github.com/vitejs/vite/issues/11070)



## 4.0.0-beta.5 (2022-12-08)

* release: v4.0.0-beta.5 ([5cb63d0](https://github.com/vitejs/vite/commit/5cb63d0))
* refactor(optimizer): await depsOptimizer.scanProcessing (#11251) ([fa64c8e](https://github.com/vitejs/vite/commit/fa64c8e)), closes [#11251](https://github.com/vitejs/vite/issues/11251)
* fix: improve CLI shortcuts help display (#11247) ([bb235b2](https://github.com/vitejs/vite/commit/bb235b2)), closes [#11247](https://github.com/vitejs/vite/issues/11247)
* fix: less promises for scanning and await with allSettled (#11245) ([45b170e](https://github.com/vitejs/vite/commit/45b170e)), closes [#11245](https://github.com/vitejs/vite/issues/11245)
* fix(optimizer): escape entrypoints when running scanner (#11250) ([b61894e](https://github.com/vitejs/vite/commit/b61894e)), closes [#11250](https://github.com/vitejs/vite/issues/11250)



## 4.0.0-beta.4 (2022-12-07)

* release: v4.0.0-beta.4 ([60df543](https://github.com/vitejs/vite/commit/60df543))
* feat: add CLI keyboard shortcuts (#11228) ([87973f1](https://github.com/vitejs/vite/commit/87973f1)), closes [#11228](https://github.com/vitejs/vite/issues/11228)



## 4.0.0-beta.3 (2022-12-07)

* release: v4.0.0-beta.3 ([556ea49](https://github.com/vitejs/vite/commit/556ea49))
* feat: export error message generator (#11155) ([493ba1e](https://github.com/vitejs/vite/commit/493ba1e)), closes [#11155](https://github.com/vitejs/vite/issues/11155)
* fix: await scanner (#11242) ([52a6732](https://github.com/vitejs/vite/commit/52a6732)), closes [#11242](https://github.com/vitejs/vite/issues/11242)
* fix(css): fix css lang regex (#11237) ([a55d0b3](https://github.com/vitejs/vite/commit/a55d0b3)), closes [#11237](https://github.com/vitejs/vite/issues/11237)
* fix(resolve): ensure exports has precedence over mainFields (#11234) ([d6eb4f2](https://github.com/vitejs/vite/commit/d6eb4f2)), closes [#11234](https://github.com/vitejs/vite/issues/11234)
* chore(deps)!: update esbuild to 0.16.1 (#11235) ([d90a262](https://github.com/vitejs/vite/commit/d90a262)), closes [#11235](https://github.com/vitejs/vite/issues/11235)



## 4.0.0-beta.2 (2022-12-07)

* release: v4.0.0-beta.2 ([20c7dd3](https://github.com/vitejs/vite/commit/20c7dd3))
* feat(node/plugins): esbuild options (#11049) ([735b98b](https://github.com/vitejs/vite/commit/735b98b)), closes [#11049](https://github.com/vitejs/vite/issues/11049)
* fix: don't print urls on restart with default port (#11230) ([5aaecb6](https://github.com/vitejs/vite/commit/5aaecb6)), closes [#11230](https://github.com/vitejs/vite/issues/11230)
* chore(deps): typescript 4.9 (#11229) ([6b4c4e2](https://github.com/vitejs/vite/commit/6b4c4e2)), closes [#11229](https://github.com/vitejs/vite/issues/11229)
* chore(deps): update esbuild to 0.15.18 (#11227) ([a08ca07](https://github.com/vitejs/vite/commit/a08ca07)), closes [#11227](https://github.com/vitejs/vite/issues/11227)



## 4.0.0-beta.1 (2022-12-06)

* release: v4.0.0-beta.1 ([c4b192c](https://github.com/vitejs/vite/commit/c4b192c))
* fix: serialize bundleWorkerEntry (#11218) ([306bed0](https://github.com/vitejs/vite/commit/306bed0)), closes [#11218](https://github.com/vitejs/vite/issues/11218)
* fix(config): resolve dynamic import as esm (#11220) ([f8c1ed0](https://github.com/vitejs/vite/commit/f8c1ed0)), closes [#11220](https://github.com/vitejs/vite/issues/11220)
* fix(env): prevent env expand on process.env (#11213) ([d4a1e2b](https://github.com/vitejs/vite/commit/d4a1e2b)), closes [#11213](https://github.com/vitejs/vite/issues/11213)
* docs: fix grammar in changelog (#11224) ([f1b891f](https://github.com/vitejs/vite/commit/f1b891f)), closes [#11224](https://github.com/vitejs/vite/issues/11224)
* chore: fix test run in dev (#11214) ([c747a3f](https://github.com/vitejs/vite/commit/c747a3f)), closes [#11214](https://github.com/vitejs/vite/issues/11214)
* chore: improve v4 beta release notes (#11215) ([f24679c](https://github.com/vitejs/vite/commit/f24679c)), closes [#11215](https://github.com/vitejs/vite/issues/11215)
* chore: unpin rollup (#11204) ([014e4aa](https://github.com/vitejs/vite/commit/014e4aa)), closes [#11204](https://github.com/vitejs/vite/issues/11204)
* chore: vite 4 beta changelog cleanup and release notes (#11200) ([cf6c175](https://github.com/vitejs/vite/commit/cf6c175)), closes [#11200](https://github.com/vitejs/vite/issues/11200)
* feat: improve the error message of `expand` (#11141) ([825c793](https://github.com/vitejs/vite/commit/825c793)), closes [#11141](https://github.com/vitejs/vite/issues/11141)



## 4.0.0-beta.0 (2022-12-05)

* release: v4.0.0-beta.0 ([848680c](https://github.com/vitejs/vite/commit/848680c))
* chore: enable prettier trailing commas (#11167) ([134ce68](https://github.com/vitejs/vite/commit/134ce68)), closes [#11167](https://github.com/vitejs/vite/issues/11167)
* chore: update @types/node to v18 (#11195) ([4ec9f53](https://github.com/vitejs/vite/commit/4ec9f53)), closes [#11195](https://github.com/vitejs/vite/issues/11195)
* chore(deps): update all non-major dependencies (#11182) ([8b83089](https://github.com/vitejs/vite/commit/8b83089)), closes [#11182](https://github.com/vitejs/vite/issues/11182)
* chore(deps): update to rollup 3.5 (#11165) ([859fe05](https://github.com/vitejs/vite/commit/859fe05)), closes [#11165](https://github.com/vitejs/vite/issues/11165)
* fix: add type for function localsConvention value (#11152) ([c9274b4](https://github.com/vitejs/vite/commit/c9274b4)), closes [#11152](https://github.com/vitejs/vite/issues/11152)
* fix: cacheDir should be ignored from watch (#10242) ([75dbca2](https://github.com/vitejs/vite/commit/75dbca2)), closes [#10242](https://github.com/vitejs/vite/issues/10242)
* fix: don't check .yarn/patches for computing dependencies hash (#11168) ([65bcccf](https://github.com/vitejs/vite/commit/65bcccf)), closes [#11168](https://github.com/vitejs/vite/issues/11168)
* fix: formatError() outside rollup context (#11156) ([2aee2eb](https://github.com/vitejs/vite/commit/2aee2eb)), closes [#11156](https://github.com/vitejs/vite/issues/11156)
* fix: Revert "fix: missing js sourcemaps with rewritten imports broke debugging (#7767) (#9476)" (#11 ([fdc6f3a](https://github.com/vitejs/vite/commit/fdc6f3a)), closes [#7767](https://github.com/vitejs/vite/issues/7767) [#9476](https://github.com/vitejs/vite/issues/9476) [#11144](https://github.com/vitejs/vite/issues/11144)
* chore(client)!: remove never implemented hot.decline (#11036) ([e257e3b](https://github.com/vitejs/vite/commit/e257e3b)), closes [#11036](https://github.com/vitejs/vite/issues/11036)



## 4.0.0-alpha.6 (2022-11-30)

* release: v4.0.0-alpha.6 ([5b66c2c](https://github.com/vitejs/vite/commit/5b66c2c))
* fix: Dev SSR dep optimization + respect optimizeDeps.include (#11123) ([515caa5](https://github.com/vitejs/vite/commit/515caa5)), closes [#11123](https://github.com/vitejs/vite/issues/11123)
* fix: export preprocessCSS in CJS (#11067) ([793255d](https://github.com/vitejs/vite/commit/793255d)), closes [#11067](https://github.com/vitejs/vite/issues/11067)
* fix: glob import parsing (#10949) (#11056) ([ac2cfd6](https://github.com/vitejs/vite/commit/ac2cfd6)), closes [#10949](https://github.com/vitejs/vite/issues/10949) [#11056](https://github.com/vitejs/vite/issues/11056)
* fix: import.meta.env and process.env undefined variable replacement (fix #8663) (#10958) ([3e0cd3d](https://github.com/vitejs/vite/commit/3e0cd3d)), closes [#8663](https://github.com/vitejs/vite/issues/8663) [#10958](https://github.com/vitejs/vite/issues/10958)
* fix: missing js sourcemaps with rewritten imports broke debugging (#7767) (#9476) ([3fa96f6](https://github.com/vitejs/vite/commit/3fa96f6)), closes [#7767](https://github.com/vitejs/vite/issues/7767) [#9476](https://github.com/vitejs/vite/issues/9476)
* fix: preserve default export from externalized packages (fixes #10258) (#10406) ([88b001b](https://github.com/vitejs/vite/commit/88b001b)), closes [#10258](https://github.com/vitejs/vite/issues/10258) [#10406](https://github.com/vitejs/vite/issues/10406)
* fix: reset global regex before match (#11132) ([db8df14](https://github.com/vitejs/vite/commit/db8df14)), closes [#11132](https://github.com/vitejs/vite/issues/11132)
* fix(css): handle environment with browser globals (#11079) ([e92d025](https://github.com/vitejs/vite/commit/e92d025)), closes [#11079](https://github.com/vitejs/vite/issues/11079)
* fix(deps): update all non-major dependencies (#11091) ([073a4bf](https://github.com/vitejs/vite/commit/073a4bf)), closes [#11091](https://github.com/vitejs/vite/issues/11091)
* fix(esbuild): handle inline sourcemap option (#11120) ([4c85c0a](https://github.com/vitejs/vite/commit/4c85c0a)), closes [#11120](https://github.com/vitejs/vite/issues/11120)
* fix(importGlob): don't warn when CSS default import is not used (#11121) ([97f8b4d](https://github.com/vitejs/vite/commit/97f8b4d)), closes [#11121](https://github.com/vitejs/vite/issues/11121)
* fix(importGlob): preserve line count for sourcemap (#11122) ([14980a1](https://github.com/vitejs/vite/commit/14980a1)), closes [#11122](https://github.com/vitejs/vite/issues/11122)
* fix(importGlob): warn on default import css (#11103) ([fc0d9e3](https://github.com/vitejs/vite/commit/fc0d9e3)), closes [#11103](https://github.com/vitejs/vite/issues/11103)
* fix(plugin-vue): support scss/sass/less... hmr on custom template languages (fix #10677) (#10844) ([d413848](https://github.com/vitejs/vite/commit/d413848)), closes [#10677](https://github.com/vitejs/vite/issues/10677) [#10844](https://github.com/vitejs/vite/issues/10844)
* fix(ssr): preserve require for external node (#11057) ([1ec0176](https://github.com/vitejs/vite/commit/1ec0176)), closes [#11057](https://github.com/vitejs/vite/issues/11057)
* fix(worker): disable build reporter plugin when bundling worker (#11058) ([7b72069](https://github.com/vitejs/vite/commit/7b72069)), closes [#11058](https://github.com/vitejs/vite/issues/11058)
* feat!: support `safari14` by default for wider ES2020 compatibility (#9063) ([3cc65d7](https://github.com/vitejs/vite/commit/3cc65d7)), closes [#9063](https://github.com/vitejs/vite/issues/9063)
* feat!: support multiline values in env files (#10826) ([606e60d](https://github.com/vitejs/vite/commit/606e60d)), closes [#10826](https://github.com/vitejs/vite/issues/10826)
* feat(ssr)!: remove dedupe and mode support for CJS (#11101) ([3090564](https://github.com/vitejs/vite/commit/3090564)), closes [#11101](https://github.com/vitejs/vite/issues/11101)
* fix!: make `NODE_ENV` more predictable (#10996) ([8148af7](https://github.com/vitejs/vite/commit/8148af7)), closes [#10996](https://github.com/vitejs/vite/issues/10996)
* fix(config)!: support development build (#11045) ([8b3d656](https://github.com/vitejs/vite/commit/8b3d656)), closes [#11045](https://github.com/vitejs/vite/issues/11045)
* feat: align object interface for `transformIndexHtml` hook (#9669) ([1db52bf](https://github.com/vitejs/vite/commit/1db52bf)), closes [#9669](https://github.com/vitejs/vite/issues/9669)
* feat(build): cleaner logs output (#10895) ([7d24b5f](https://github.com/vitejs/vite/commit/7d24b5f)), closes [#10895](https://github.com/vitejs/vite/issues/10895)
* feat(css): deprecate css default export (#11094) ([01dee1b](https://github.com/vitejs/vite/commit/01dee1b)), closes [#11094](https://github.com/vitejs/vite/issues/11094)
* feat(optimizer): support patch-package (#10286) ([4fb7ad0](https://github.com/vitejs/vite/commit/4fb7ad0)), closes [#10286](https://github.com/vitejs/vite/issues/10286)
* refactor: use function to eval worker and glob options (#10999) ([f4c1264](https://github.com/vitejs/vite/commit/f4c1264)), closes [#10999](https://github.com/vitejs/vite/issues/10999)
* refactor(client): simplify fetchUpdate code (#11004) ([f777b55](https://github.com/vitejs/vite/commit/f777b55)), closes [#11004](https://github.com/vitejs/vite/issues/11004)
* chore(client): expose hot.prune API (#11016) ([f40c18d](https://github.com/vitejs/vite/commit/f40c18d)), closes [#11016](https://github.com/vitejs/vite/issues/11016)
* chore(deps): update dependency @rollup/plugin-typescript to v10 (#11092) ([3fb27b8](https://github.com/vitejs/vite/commit/3fb27b8)), closes [#11092](https://github.com/vitejs/vite/issues/11092)
* chore(deps): update dependency @rollup/pluginutils to v5 (#11071) ([6c5ecee](https://github.com/vitejs/vite/commit/6c5ecee)), closes [#11071](https://github.com/vitejs/vite/issues/11071)



## 4.0.0-alpha.5 (2022-11-22)

* release: v4.0.0-alpha.5 ([95bc282](https://github.com/vitejs/vite/commit/95bc282))
* fix(html): transform relative path with long base in /index.html (#10990) ([752740c](https://github.com/vitejs/vite/commit/752740c)), closes [#10990](https://github.com/vitejs/vite/issues/10990)
* fix(mpa): support mpa fallback (#10985) ([61165f0](https://github.com/vitejs/vite/commit/61165f0)), closes [#10985](https://github.com/vitejs/vite/issues/10985)
* feat(build): Use kB in build reporter (#10982) ([b57acfa](https://github.com/vitejs/vite/commit/b57acfa)), closes [#10982](https://github.com/vitejs/vite/issues/10982)
* feat(css): upgrade postcss-modules (#10987) ([892916d](https://github.com/vitejs/vite/commit/892916d)), closes [#10987](https://github.com/vitejs/vite/issues/10987)
* feat(hmr): invalidate message (#10946) ([0d73473](https://github.com/vitejs/vite/commit/0d73473)), closes [#10946](https://github.com/vitejs/vite/issues/10946)
* chore: proxy bypass do nothing with object result (#10209) ([934a304](https://github.com/vitejs/vite/commit/934a304)), closes [#10209](https://github.com/vitejs/vite/issues/10209)
* chore(deps): update all non-major dependencies (#11006) ([96f2e98](https://github.com/vitejs/vite/commit/96f2e98)), closes [#11006](https://github.com/vitejs/vite/issues/11006)
* chore(deps): update dependency @rollup/plugin-typescript to v9 (#11007) ([0e271ff](https://github.com/vitejs/vite/commit/0e271ff)), closes [#11007](https://github.com/vitejs/vite/issues/11007)



## 4.0.0-alpha.4 (2022-11-17)

* release: v4.0.0-alpha.4 ([d9779c7](https://github.com/vitejs/vite/commit/d9779c7))
* feat: align default chunk and asset file names with rollup (#10927) ([cc2adb3](https://github.com/vitejs/vite/commit/cc2adb3)), closes [#10927](https://github.com/vitejs/vite/issues/10927)
* refactor: import version from rollup (#10964) ([9f54c6a](https://github.com/vitejs/vite/commit/9f54c6a)), closes [#10964](https://github.com/vitejs/vite/issues/10964)
* test: improve node/build.ts ut coverage (#10786) ([411cc3d](https://github.com/vitejs/vite/commit/411cc3d)), closes [#10786](https://github.com/vitejs/vite/issues/10786)
* chore: use isArray to check array (#10953) ([02c334a](https://github.com/vitejs/vite/commit/02c334a)), closes [#10953](https://github.com/vitejs/vite/issues/10953)
* fix: make `addWatchFile()` work (fix #7024) (#9723) ([34db08b](https://github.com/vitejs/vite/commit/34db08b)), closes [#7024](https://github.com/vitejs/vite/issues/7024) [#9723](https://github.com/vitejs/vite/issues/9723)
* fix(config): exclude config.assetsInclude empty array (#10941) ([18c71dc](https://github.com/vitejs/vite/commit/18c71dc)), closes [#10941](https://github.com/vitejs/vite/issues/10941)



## 4.0.0-alpha.3 (2022-11-15)

* release: v4.0.0-alpha.3 ([06f0756](https://github.com/vitejs/vite/commit/06f0756))
* fix(ssr): skip optional peer dep resolve (#10593) ([0a69985](https://github.com/vitejs/vite/commit/0a69985)), closes [#10593](https://github.com/vitejs/vite/issues/10593)
* chore(deps): update all non-major dependencies (#10910) ([f6ad607](https://github.com/vitejs/vite/commit/f6ad607)), closes [#10910](https://github.com/vitejs/vite/issues/10910)
* chore(deps): update dependency @rollup/plugin-node-resolve to v15 (#10911) ([65f1e4d](https://github.com/vitejs/vite/commit/65f1e4d)), closes [#10911](https://github.com/vitejs/vite/issues/10911)
* perf: regexp perf issues, refactor regexp stylistic issues (#10905) ([fc007df](https://github.com/vitejs/vite/commit/fc007df)), closes [#10905](https://github.com/vitejs/vite/issues/10905)
* refactor: move CSS emitFile logic closer to rollup (#10909) ([92a206b](https://github.com/vitejs/vite/commit/92a206b)), closes [#10909](https://github.com/vitejs/vite/issues/10909)



## 4.0.0-alpha.2 (2022-11-13)

* release: v4.0.0-alpha.2 ([6777d85](https://github.com/vitejs/vite/commit/6777d85))
* refactor: use rollup hashing when emitting assets (#10878) ([78c77be](https://github.com/vitejs/vite/commit/78c77be)), closes [#10878](https://github.com/vitejs/vite/issues/10878)
* fix: don't throw on malformed URLs (#10901) ([feb9b10](https://github.com/vitejs/vite/commit/feb9b10)), closes [#10901](https://github.com/vitejs/vite/issues/10901)
* fix: gracefully handle forbidden filesystem access (#10793) ([92637a2](https://github.com/vitejs/vite/commit/92637a2)), closes [#10793](https://github.com/vitejs/vite/issues/10793)
* fix(types): remove `null` from `CSSModulesOptions.localsConvention` (#10904) ([a9978dd](https://github.com/vitejs/vite/commit/a9978dd)), closes [#10904](https://github.com/vitejs/vite/issues/10904)
* refactor(types)!: remove facade type files (#10903) ([a309058](https://github.com/vitejs/vite/commit/a309058)), closes [#10903](https://github.com/vitejs/vite/issues/10903)
* chore: cleanup PluginContext Omit (#10902) ([361c3cd](https://github.com/vitejs/vite/commit/361c3cd)), closes [#10902](https://github.com/vitejs/vite/issues/10902)
* feat(hmr): deduplicate paths and join them with commas (#10891) ([967299a](https://github.com/vitejs/vite/commit/967299a)), closes [#10891](https://github.com/vitejs/vite/issues/10891)



## 4.0.0-alpha.1 (2022-11-12)

* release: v4.0.0-alpha.1 ([3b770a5](https://github.com/vitejs/vite/commit/3b770a5))
* feat: base without trailing slash (#10723) ([8f87282](https://github.com/vitejs/vite/commit/8f87282)), closes [#10723](https://github.com/vitejs/vite/issues/10723)
* feat: handle static assets in case-sensitive manner (#10475) ([c1368c3](https://github.com/vitejs/vite/commit/c1368c3)), closes [#10475](https://github.com/vitejs/vite/issues/10475)
* feat(cli): build --profile (#10719) ([9c808cd](https://github.com/vitejs/vite/commit/9c808cd)), closes [#10719](https://github.com/vitejs/vite/issues/10719)
* feat(env): support dotenv-expand to contains process env (#10370) ([d5fe92c](https://github.com/vitejs/vite/commit/d5fe92c)), closes [#10370](https://github.com/vitejs/vite/issues/10370)
* chore: remove parameters that are not used (#10747) ([df8e476](https://github.com/vitejs/vite/commit/df8e476)), closes [#10747](https://github.com/vitejs/vite/issues/10747)
* chore(deps): update dependency @rollup/plugin-json to v5 (#10805) ([c22f50c](https://github.com/vitejs/vite/commit/c22f50c)), closes [#10805](https://github.com/vitejs/vite/issues/10805)
* chore(deps): update to rollup 3.3 (#10890) ([2d17aa2](https://github.com/vitejs/vite/commit/2d17aa2)), closes [#10890](https://github.com/vitejs/vite/issues/10890)
* fix: inconsistent handling of non-ASCII `base` in `resolveConfig` and dev server (#10247) ([16e4123](https://github.com/vitejs/vite/commit/16e4123)), closes [#10247](https://github.com/vitejs/vite/issues/10247)
* fix: prevent cache on optional package resolve (#10812) ([c599a2e](https://github.com/vitejs/vite/commit/c599a2e)), closes [#10812](https://github.com/vitejs/vite/issues/10812)
* fix: relocated logger to respect config. (#10787) ([52e64eb](https://github.com/vitejs/vite/commit/52e64eb)), closes [#10787](https://github.com/vitejs/vite/issues/10787)
* fix: throw missing name error only when 'umd' or 'iife' are used (#9886) ([b8aa825](https://github.com/vitejs/vite/commit/b8aa825)), closes [#9886](https://github.com/vitejs/vite/issues/9886)
* fix(deps): update all non-major dependencies (#10804) ([f686afa](https://github.com/vitejs/vite/commit/f686afa)), closes [#10804](https://github.com/vitejs/vite/issues/10804)
* fix(ssr): improve missing file error (#10880) ([5451a34](https://github.com/vitejs/vite/commit/5451a34)), closes [#10880](https://github.com/vitejs/vite/issues/10880)
* feat!: set esbuild default charset to utf8 (#10753) ([4caf4b6](https://github.com/vitejs/vite/commit/4caf4b6)), closes [#10753](https://github.com/vitejs/vite/issues/10753)



## 4.0.0-alpha.0 (2022-11-07)

* release: v4.0.0-alpha.0 ([cd78f50](https://github.com/vitejs/vite/commit/cd78f50))
* feat: rollup 3 (#9870) ([beb7166](https://github.com/vitejs/vite/commit/beb7166)), closes [#9870](https://github.com/vitejs/vite/issues/9870)



## <small>3.2.3 (2022-11-07)</small>

* release: v3.2.3 ([ce4c8d4](https://github.com/vitejs/vite/commit/ce4c8d4))
* refactor: change style.innerHTML to style.textContent (#10801) ([8ea71b4](https://github.com/vitejs/vite/commit/8ea71b4)), closes [#10801](https://github.com/vitejs/vite/issues/10801)
* fix: add `@types/node` as an optional peer dependency (#10757) ([57916a4](https://github.com/vitejs/vite/commit/57916a4)), closes [#10757](https://github.com/vitejs/vite/issues/10757)
* fix: transform import.meta.glob when scan JS/TS #10634 (#10635) ([c53ffec](https://github.com/vitejs/vite/commit/c53ffec)), closes [#10634](https://github.com/vitejs/vite/issues/10634) [#10635](https://github.com/vitejs/vite/issues/10635)
* fix(css): url() with variable in sass/less (fixes #3644, #7651) (#10741) ([fa2e47f](https://github.com/vitejs/vite/commit/fa2e47f)), closes [#3644](https://github.com/vitejs/vite/issues/3644) [#7651](https://github.com/vitejs/vite/issues/7651) [#10741](https://github.com/vitejs/vite/issues/10741)
* feat: add `vite:afterUpdate` event (#9810) ([1f57f84](https://github.com/vitejs/vite/commit/1f57f84)), closes [#9810](https://github.com/vitejs/vite/issues/9810)
* perf: improve `multilineCommentsRE` regex (fix #10689) (#10751) ([51ed059](https://github.com/vitejs/vite/commit/51ed059)), closes [#10689](https://github.com/vitejs/vite/issues/10689) [#10751](https://github.com/vitejs/vite/issues/10751)
* perf: Use only one ps exec to find a Chromium browser opened on Mac OS (#10588) ([f199e90](https://github.com/vitejs/vite/commit/f199e90)), closes [#10588](https://github.com/vitejs/vite/issues/10588)
* chore: fix dev build replacing undefined (#10740) ([1358a3c](https://github.com/vitejs/vite/commit/1358a3c)), closes [#10740](https://github.com/vitejs/vite/issues/10740)
* chore: remove non used type definitions (#10738) ([ee8c7a6](https://github.com/vitejs/vite/commit/ee8c7a6)), closes [#10738](https://github.com/vitejs/vite/issues/10738)
* chore(deps): update dependency @rollup/plugin-commonjs to v23 (#10611) ([cc4be70](https://github.com/vitejs/vite/commit/cc4be70)), closes [#10611](https://github.com/vitejs/vite/issues/10611)
* chore(deps): update dependency @rollup/plugin-dynamic-import-vars to v2 (#10726) ([326f782](https://github.com/vitejs/vite/commit/326f782)), closes [#10726](https://github.com/vitejs/vite/issues/10726)



## <small>3.2.2 (2022-10-31)</small>

* release: v3.2.2 ([65d69b4](https://github.com/vitejs/vite/commit/65d69b4))
* chore: remove src/client from package (#10703) ([816842e](https://github.com/vitejs/vite/commit/816842e)), closes [#10703](https://github.com/vitejs/vite/issues/10703)
* chore(deps): update all non-major dependencies (#10725) ([22cfad8](https://github.com/vitejs/vite/commit/22cfad8)), closes [#10725](https://github.com/vitejs/vite/issues/10725)
* fix: remove loaded input sourcemap (fixes #8411) (#10705) ([eb50e3a](https://github.com/vitejs/vite/commit/eb50e3a)), closes [#8411](https://github.com/vitejs/vite/issues/8411) [#10705](https://github.com/vitejs/vite/issues/10705)
* fix: tsconfig `jsx` overrides esbuild options, reverts #10374 (#10714) ([aacf6a4](https://github.com/vitejs/vite/commit/aacf6a4)), closes [#10374](https://github.com/vitejs/vite/issues/10374) [#10714](https://github.com/vitejs/vite/issues/10714)
* docs(changelog): fix broken url (#10692) ([f937ccc](https://github.com/vitejs/vite/commit/f937ccc)), closes [#10692](https://github.com/vitejs/vite/issues/10692)



## <small>3.2.1 (2022-10-28)</small>

* release: v3.2.1 ([47a78db](https://github.com/vitejs/vite/commit/47a78db))
* fix: prioritize existing env over .env (fixes #10676) (#10684) ([e2ea6af](https://github.com/vitejs/vite/commit/e2ea6af)), closes [#10676](https://github.com/vitejs/vite/issues/10676) [#10684](https://github.com/vitejs/vite/issues/10684)
* fix: remove picomatch type import (fixes #10656) (#10678) ([1128b4d](https://github.com/vitejs/vite/commit/1128b4d)), closes [#10656](https://github.com/vitejs/vite/issues/10656) [#10678](https://github.com/vitejs/vite/issues/10678)
* fix(config): resolve externalized specifier with internal resolver (#10683) ([b15d21c](https://github.com/vitejs/vite/commit/b15d21c))
* feat: Add support for imba in html scripts (#10679) ([b823fd6](https://github.com/vitejs/vite/commit/b823fd6)), closes [#10679](https://github.com/vitejs/vite/issues/10679)
* chore: join URL segments more safely (#10590) ([675bf07](https://github.com/vitejs/vite/commit/675bf07)), closes [#10590](https://github.com/vitejs/vite/issues/10590)
* chore: update changelog for 3.2 (#10646) ([f787a60](https://github.com/vitejs/vite/commit/f787a60)), closes [#10646](https://github.com/vitejs/vite/issues/10646)



## 3.2.0 (2022-10-26)

* release: v3.2.0 ([4198e34](https://github.com/vitejs/vite/commit/4198e34))
* fix: add a warning if css urls not exist during build time (fix #9800) (#10331) ([9f268da](https://github.com/vitejs/vite/commit/9f268da)), closes [#9800](https://github.com/vitejs/vite/issues/9800) [#10331](https://github.com/vitejs/vite/issues/10331)
* fix: increase error overlay z-index (#10603) ([1157941](https://github.com/vitejs/vite/commit/1157941)), closes [#10603](https://github.com/vitejs/vite/issues/10603)
* fix: revert es-module-lexer version (#10614) ([cffe5c9](https://github.com/vitejs/vite/commit/cffe5c9)), closes [#10614](https://github.com/vitejs/vite/issues/10614)
* fix: when the file path is an absolute path, parsing causes parameter loss (#10449) ([df86990](https://github.com/vitejs/vite/commit/df86990)), closes [#10449](https://github.com/vitejs/vite/issues/10449)
* fix(config): resolve build options with fallback (#10645) ([f7021e3](https://github.com/vitejs/vite/commit/f7021e3)), closes [#10645](https://github.com/vitejs/vite/issues/10645)
* fix(deps): update all non-major dependencies (#10610) ([bb95467](https://github.com/vitejs/vite/commit/bb95467)), closes [#10610](https://github.com/vitejs/vite/issues/10610)
* fix(hmr): cannot reload after missing import on server startup (#9534) (#10602) ([ee7c28a](https://github.com/vitejs/vite/commit/ee7c28a)), closes [#9534](https://github.com/vitejs/vite/issues/9534) [#10602](https://github.com/vitejs/vite/issues/10602)
* feat(build): experimental copyPublicDir option (#10550) ([4f4a39f](https://github.com/vitejs/vite/commit/4f4a39f)), closes [#10550](https://github.com/vitejs/vite/issues/10550)
* feat(css): export preprocessCSS API (#10429) ([177b427](https://github.com/vitejs/vite/commit/177b427)), closes [#10429](https://github.com/vitejs/vite/issues/10429)
* feat(preview): support outDir option (#10418) ([15b90b3](https://github.com/vitejs/vite/commit/15b90b3)), closes [#10418](https://github.com/vitejs/vite/issues/10418)



## 3.2.0-beta.4 (2022-10-24)

* release: v3.2.0-beta.4 ([0163abc](https://github.com/vitejs/vite/commit/0163abc))
* chore: revert #10196 until Vite 4 (#10574) ([07c0336](https://github.com/vitejs/vite/commit/07c0336)), closes [#10196](https://github.com/vitejs/vite/issues/10196) [#10574](https://github.com/vitejs/vite/issues/10574)
* fix(css): strip BOM (fixes #10043) (#10577) ([e0463bd](https://github.com/vitejs/vite/commit/e0463bd)), closes [#10043](https://github.com/vitejs/vite/issues/10043) [#10577](https://github.com/vitejs/vite/issues/10577)
* fix(ssr): resolve with isRequire true (#10569) ([7b81210](https://github.com/vitejs/vite/commit/7b81210)), closes [#10569](https://github.com/vitejs/vite/issues/10569)



## 3.2.0-beta.3 (2022-10-20)

* release: v3.2.0-beta.3 ([f148c18](https://github.com/vitejs/vite/commit/f148c18))
* feat: include line and column in error format (#10529) ([d806c4a](https://github.com/vitejs/vite/commit/d806c4a)), closes [#10529](https://github.com/vitejs/vite/issues/10529)
* feat: reuse opening tab in chromium browsers when start dev server (#10485) ([1a2e7a8](https://github.com/vitejs/vite/commit/1a2e7a8)), closes [#10485](https://github.com/vitejs/vite/issues/10485)
* feat: update esbuild compilation affecting fields (#10374) ([f542727](https://github.com/vitejs/vite/commit/f542727)), closes [#10374](https://github.com/vitejs/vite/issues/10374)
* feat(proxy): Include URL of request in proxy errors (#10508) ([27e2832](https://github.com/vitejs/vite/commit/27e2832)), closes [#10508](https://github.com/vitejs/vite/issues/10508)
* fix: expose server as Http2SecureServer type (#10196) ([f328f61](https://github.com/vitejs/vite/commit/f328f61)), closes [#10196](https://github.com/vitejs/vite/issues/10196)
* fix(cli): when the user enters the same command (#10474) ([2326f4a](https://github.com/vitejs/vite/commit/2326f4a)), closes [#10474](https://github.com/vitejs/vite/issues/10474)
* fix(config): don't use module condition (`import.meta.resolve`) (fixes #10430) (#10528) ([64f19b9](https://github.com/vitejs/vite/commit/64f19b9)), closes [#10430](https://github.com/vitejs/vite/issues/10430) [#10528](https://github.com/vitejs/vite/issues/10528)
* fix(css): remove `?direct` in id for postcss process (#10514) ([67e7bf2](https://github.com/vitejs/vite/commit/67e7bf2)), closes [#10514](https://github.com/vitejs/vite/issues/10514)
* fix(html): allow self closing on non-void elements (#10478) ([29292af](https://github.com/vitejs/vite/commit/29292af)), closes [#10478](https://github.com/vitejs/vite/issues/10478)
* fix(legacy): restore entry chunk CSS inlining, reverts #9761 (#10496) ([9cc808e](https://github.com/vitejs/vite/commit/9cc808e)), closes [#9761](https://github.com/vitejs/vite/issues/9761) [#10496](https://github.com/vitejs/vite/issues/10496)
* chore: simplify filter plugin code (#10459) ([5d9b810](https://github.com/vitejs/vite/commit/5d9b810)), closes [#10459](https://github.com/vitejs/vite/issues/10459)
* chore(deps): update all non-major dependencies (#10488) ([15aa827](https://github.com/vitejs/vite/commit/15aa827)), closes [#10488](https://github.com/vitejs/vite/issues/10488)



## 3.2.0-beta.2 (2022-10-14)

* release: v3.2.0-beta.2 ([0cfd26c](https://github.com/vitejs/vite/commit/0cfd26c))
* refactor: delete dependent pre built proxy modules (#10427) ([b3b388d](https://github.com/vitejs/vite/commit/b3b388d)), closes [#10427](https://github.com/vitejs/vite/issues/10427)
* feat(server): invalidate module with hmr (#10333) ([8328011](https://github.com/vitejs/vite/commit/8328011)), closes [#10333](https://github.com/vitejs/vite/issues/10333)
* fix: prefer exports when resolving (#10371) ([3259006](https://github.com/vitejs/vite/commit/3259006)), closes [#10371](https://github.com/vitejs/vite/issues/10371)
* fix(config): partial deno support (#10446) ([c4489ea](https://github.com/vitejs/vite/commit/c4489ea)), closes [#10446](https://github.com/vitejs/vite/issues/10446)
* fix(config): skip resolve builtin modules (#10420) ([ecba3f8](https://github.com/vitejs/vite/commit/ecba3f8)), closes [#10420](https://github.com/vitejs/vite/issues/10420)
* fix(ssr): handle parallel hookNodeResolve (#10401) ([1a961d9](https://github.com/vitejs/vite/commit/1a961d9)), closes [#10401](https://github.com/vitejs/vite/issues/10401)



## 3.2.0-beta.1 (2022-10-10)

* release: v3.2.0-beta.1 ([8eb0b0a](https://github.com/vitejs/vite/commit/8eb0b0a))
* chore: update magic-string (#10364) ([23c9259](https://github.com/vitejs/vite/commit/23c9259)), closes [#10364](https://github.com/vitejs/vite/issues/10364)
* chore(deps): update all non-major dependencies (#10393) ([f519423](https://github.com/vitejs/vite/commit/f519423)), closes [#10393](https://github.com/vitejs/vite/issues/10393)
* chore(deps): update dependency @rollup/plugin-alias to v4 (#10394) ([e2b4c8f](https://github.com/vitejs/vite/commit/e2b4c8f)), closes [#10394](https://github.com/vitejs/vite/issues/10394)
* feat(lib): cjs instead of umd as default format for multiple entries (#10315) ([07d3fbd](https://github.com/vitejs/vite/commit/07d3fbd)), closes [#10315](https://github.com/vitejs/vite/issues/10315)
* fix: make client type work with `moduleResolution=node16` (#10375) ([8c4df1f](https://github.com/vitejs/vite/commit/8c4df1f)), closes [#10375](https://github.com/vitejs/vite/issues/10375)
* fix(config): don't resolve by module field (#10347) ([cc1c829](https://github.com/vitejs/vite/commit/cc1c829)), closes [#10347](https://github.com/vitejs/vite/issues/10347)
* fix(html): handle attrs with prefix (fixes #10337) (#10381) ([7b4d6e8](https://github.com/vitejs/vite/commit/7b4d6e8)), closes [#10337](https://github.com/vitejs/vite/issues/10337) [#10381](https://github.com/vitejs/vite/issues/10381)
* fix(ssr): track var as function scope (#10388) ([87b48f9](https://github.com/vitejs/vite/commit/87b48f9)), closes [#10388](https://github.com/vitejs/vite/issues/10388)



## 3.2.0-beta.0 (2022-10-05)

* release: v3.2.0-beta.0 ([599eb81](https://github.com/vitejs/vite/commit/599eb81))
* fix: add module types (#10299) ([0b89dd2](https://github.com/vitejs/vite/commit/0b89dd2)), closes [#10299](https://github.com/vitejs/vite/issues/10299)
* fix: css order problem in async chunk (#9949) ([6c7b834](https://github.com/vitejs/vite/commit/6c7b834)), closes [#9949](https://github.com/vitejs/vite/issues/9949)
* fix: don't duplicate styles with dynamic import (fix #9967) (#9970) ([65f97bd](https://github.com/vitejs/vite/commit/65f97bd)), closes [#9967](https://github.com/vitejs/vite/issues/9967) [#9970](https://github.com/vitejs/vite/issues/9970)
* fix: env variables override (#10113) ([d619460](https://github.com/vitejs/vite/commit/d619460)), closes [#10113](https://github.com/vitejs/vite/issues/10113)
* fix: isFromTsImporter flag in worker virtual model (#10273) ([78f74c9](https://github.com/vitejs/vite/commit/78f74c9)), closes [#10273](https://github.com/vitejs/vite/issues/10273)
* fix: properly close optimizer on server restart (#10028) ([a32777f](https://github.com/vitejs/vite/commit/a32777f)), closes [#10028](https://github.com/vitejs/vite/issues/10028)
* fix: respect `mainFields` when resolving browser/module field (fixes #8659) (#10071) ([533d13c](https://github.com/vitejs/vite/commit/533d13c)), closes [#8659](https://github.com/vitejs/vite/issues/8659) [#10071](https://github.com/vitejs/vite/issues/10071)
* fix: respect resolve.conditions, when resolving browser/require field (#9860) ([9a83eaf](https://github.com/vitejs/vite/commit/9a83eaf)), closes [#9860](https://github.com/vitejs/vite/issues/9860)
* fix: support process each out dir when there are two or more (#9748) ([ee3231c](https://github.com/vitejs/vite/commit/ee3231c)), closes [#9748](https://github.com/vitejs/vite/issues/9748)
* fix(build): fix resolution algorithm when `build.ssr` is true (#9989) ([7229251](https://github.com/vitejs/vite/commit/7229251)), closes [#9989](https://github.com/vitejs/vite/issues/9989)
* fix(config): resolve implicit deps as absolute path (#10254) ([ec1f3ae](https://github.com/vitejs/vite/commit/ec1f3ae)), closes [#10254](https://github.com/vitejs/vite/issues/10254)
* fix(css):  missing css in lib mode (#10185) ([e4c1c6d](https://github.com/vitejs/vite/commit/e4c1c6d)), closes [#10185](https://github.com/vitejs/vite/issues/10185)
* fix(deps): update all non-major dependencies (#10160) ([6233c83](https://github.com/vitejs/vite/commit/6233c83)), closes [#10160](https://github.com/vitejs/vite/issues/10160)
* fix(deps): update all non-major dependencies (#10316) ([a38b450](https://github.com/vitejs/vite/commit/a38b450)), closes [#10316](https://github.com/vitejs/vite/issues/10316)
* fix(deps): update rollup to `^2.79.1` (#10298) ([2266d83](https://github.com/vitejs/vite/commit/2266d83)), closes [#10298](https://github.com/vitejs/vite/issues/10298)
* fix(esbuild): transpile with esnext in dev (#10207) ([43b7b78](https://github.com/vitejs/vite/commit/43b7b78)), closes [#10207](https://github.com/vitejs/vite/issues/10207)
* fix(hmr): handle virtual module update (#10324) ([7c4accb](https://github.com/vitejs/vite/commit/7c4accb)), closes [#10324](https://github.com/vitejs/vite/issues/10324)
* fix(optimizer): browser field bare import (fix #7599) (#10314) ([cba13e8](https://github.com/vitejs/vite/commit/cba13e8)), closes [#7599](https://github.com/vitejs/vite/issues/7599) [#10314](https://github.com/vitejs/vite/issues/10314)
* fix(sass): reorder sass importers (#10101) ([a543731](https://github.com/vitejs/vite/commit/a543731)), closes [#10101](https://github.com/vitejs/vite/issues/10101)
* fix(server): handle appType mpa html fallback (#10336) ([65dd88b](https://github.com/vitejs/vite/commit/65dd88b)), closes [#10336](https://github.com/vitejs/vite/issues/10336)
* fix(ssr): correctly track scope (#10300) ([a60529f](https://github.com/vitejs/vite/commit/a60529f)), closes [#10300](https://github.com/vitejs/vite/issues/10300)
* fix(worker): support comment in worker constructor option (#10226) ([66c9058](https://github.com/vitejs/vite/commit/66c9058)), closes [#10226](https://github.com/vitejs/vite/issues/10226)
* fix(worker): support trailing comma (#10211) ([0542e7c](https://github.com/vitejs/vite/commit/0542e7c)), closes [#10211](https://github.com/vitejs/vite/issues/10211)
* feat: build.modulePreload options (#9938) ([e223f84](https://github.com/vitejs/vite/commit/e223f84)), closes [#9938](https://github.com/vitejs/vite/issues/9938)
* feat: customize ErrorOverlay (#10234) ([fe4dc8d](https://github.com/vitejs/vite/commit/fe4dc8d)), closes [#10234](https://github.com/vitejs/vite/issues/10234)
* feat: dynamic import support ?url and ?worker (#8261) ([0cb01ca](https://github.com/vitejs/vite/commit/0cb01ca)), closes [#8261](https://github.com/vitejs/vite/issues/8261)
* feat: include duplicate assets in the manifest (#9928) ([42ecf37](https://github.com/vitejs/vite/commit/42ecf37)), closes [#9928](https://github.com/vitejs/vite/issues/9928)
* feat: support import.meta.hot.invalidate (#10244) ([fb8ab16](https://github.com/vitejs/vite/commit/fb8ab16)), closes [#10244](https://github.com/vitejs/vite/issues/10244)
* feat: support postcss sugarss (#6705) ([8ede2f1](https://github.com/vitejs/vite/commit/8ede2f1)), closes [#6705](https://github.com/vitejs/vite/issues/6705)
* feat(assets): allow `new URL` to resolve package assets (#7837) ([bafccf5](https://github.com/vitejs/vite/commit/bafccf5)), closes [#7837](https://github.com/vitejs/vite/issues/7837)
* feat(client): add data-vite-dev-id attribute to style elements (#10080) ([ea09fde](https://github.com/vitejs/vite/commit/ea09fde)), closes [#10080](https://github.com/vitejs/vite/issues/10080)
* feat(lib): allow multiple entries (#7047) ([65a0fad](https://github.com/vitejs/vite/commit/65a0fad)), closes [#7047](https://github.com/vitejs/vite/issues/7047)
* feat(optimizer): Support bun lockfile format (#10288) ([931d69b](https://github.com/vitejs/vite/commit/931d69b)), closes [#10288](https://github.com/vitejs/vite/issues/10288)
* refactor(types): bundle client types (#9966) ([da632bf](https://github.com/vitejs/vite/commit/da632bf)), closes [#9966](https://github.com/vitejs/vite/issues/9966)
* refactor(types): simplify type exports (#10243) ([291174d](https://github.com/vitejs/vite/commit/291174d)), closes [#10243](https://github.com/vitejs/vite/issues/10243)
* chore: remove cacheDir param (#10188) ([6eb374a](https://github.com/vitejs/vite/commit/6eb374a)), closes [#10188](https://github.com/vitejs/vite/issues/10188)
* chore: update type init (#10251) ([ed40a65](https://github.com/vitejs/vite/commit/ed40a65)), closes [#10251](https://github.com/vitejs/vite/issues/10251)
* docs: fix invalid jsdoc comments (#10241) ([9acb839](https://github.com/vitejs/vite/commit/9acb839)), closes [#10241](https://github.com/vitejs/vite/issues/10241)
* perf: cache compiled glob for `server.fs.deny` (#10044) ([df560b0](https://github.com/vitejs/vite/commit/df560b0)), closes [#10044](https://github.com/vitejs/vite/issues/10044)



## <small>3.1.3 (2022-09-19)</small>

* release: v3.1.3 ([dfa22ca](https://github.com/vitejs/vite/commit/dfa22ca))
* fix: esbuildOutputFromId for symlinked root (#10154) ([fc5310f](https://github.com/vitejs/vite/commit/fc5310f)), closes [#10154](https://github.com/vitejs/vite/issues/10154)
* fix(hmr): dedupe virtual modules in module graph (#10144) ([71f08e7](https://github.com/vitejs/vite/commit/71f08e7)), closes [#10144](https://github.com/vitejs/vite/issues/10144)
* fix(lib): respect `rollupOptions.input` in lib mode (#10116) ([c948e7d](https://github.com/vitejs/vite/commit/c948e7d)), closes [#10116](https://github.com/vitejs/vite/issues/10116)



## <small>3.1.2 (2022-09-17)</small>

* release: v3.1.2 ([cda361c](https://github.com/vitejs/vite/commit/cda361c))
* fix: use isOptimizable to ensure version query (#10141) ([23a51c6](https://github.com/vitejs/vite/commit/23a51c6)), closes [#10141](https://github.com/vitejs/vite/issues/10141)



## <small>3.1.1 (2022-09-15)</small>

* release: v3.1.1 ([d324181](https://github.com/vitejs/vite/commit/d324181))
* fix: ensure version query for relative node_modules imports (#10016) ([1b822d0](https://github.com/vitejs/vite/commit/1b822d0)), closes [#10016](https://github.com/vitejs/vite/issues/10016)
* fix: no quote on attrs (#10117) ([f541239](https://github.com/vitejs/vite/commit/f541239)), closes [#10117](https://github.com/vitejs/vite/issues/10117)
* fix: prevent error overlay style being overridden (fixes #9969) (#9971) ([a7706d0](https://github.com/vitejs/vite/commit/a7706d0)), closes [#9969](https://github.com/vitejs/vite/issues/9969) [#9971](https://github.com/vitejs/vite/issues/9971)
* fix: proxy to secured websocket server (#10045) ([9de9bc4](https://github.com/vitejs/vite/commit/9de9bc4)), closes [#10045](https://github.com/vitejs/vite/issues/10045)
* fix: replace white with reset (#10104) ([5d56e42](https://github.com/vitejs/vite/commit/5d56e42)), closes [#10104](https://github.com/vitejs/vite/issues/10104)
* fix(deps): update all non-major dependencies (#10077) ([caf00c8](https://github.com/vitejs/vite/commit/caf00c8)), closes [#10077](https://github.com/vitejs/vite/issues/10077)
* fix(deps): update all non-major dependencies (#9985) ([855f2f0](https://github.com/vitejs/vite/commit/855f2f0)), closes [#9985](https://github.com/vitejs/vite/issues/9985)
* fix(preview): send configured headers (#9976) ([0d20eae](https://github.com/vitejs/vite/commit/0d20eae)), closes [#9976](https://github.com/vitejs/vite/issues/9976)
* chore: cleanup old changelogs (#10056) ([9e65a41](https://github.com/vitejs/vite/commit/9e65a41)), closes [#10056](https://github.com/vitejs/vite/issues/10056)
* chore: update 3.1 changelog (#9994) ([44dbcbe](https://github.com/vitejs/vite/commit/44dbcbe)), closes [#9994](https://github.com/vitejs/vite/issues/9994)
* chore(deps): update @rollup/plugin-node-resolve to v14 (#10078) ([3390c87](https://github.com/vitejs/vite/commit/3390c87)), closes [#10078](https://github.com/vitejs/vite/issues/10078)
* refactor: config hook helper function (#9982) ([9c1be10](https://github.com/vitejs/vite/commit/9c1be10)), closes [#9982](https://github.com/vitejs/vite/issues/9982)
* refactor: optimize `async` and `await` in code (#9854) ([31f5ff3](https://github.com/vitejs/vite/commit/31f5ff3)), closes [#9854](https://github.com/vitejs/vite/issues/9854)



## 3.1.0 (2022-09-05)

* release: v3.1.0 ([b1ad82d](https://github.com/vitejs/vite/commit/b1ad82d))



## 3.1.0-beta.2 (2022-09-02)

* release: v3.1.0-beta.2 ([4158b98](https://github.com/vitejs/vite/commit/4158b98))
* fix(css): remove css-post plugin sourcemap (#9914) ([c9521e7](https://github.com/vitejs/vite/commit/c9521e7)), closes [#9914](https://github.com/vitejs/vite/issues/9914)
* fix(hmr): duplicated modules because of query params mismatch (fixes #2255) (#9773) ([86bf776](https://github.com/vitejs/vite/commit/86bf776)), closes [#2255](https://github.com/vitejs/vite/issues/2255) [#9773](https://github.com/vitejs/vite/issues/9773)
* fix(ssr): enable `inlineDynamicImports` when input has length 1 (#9904) ([9ac5075](https://github.com/vitejs/vite/commit/9ac5075)), closes [#9904](https://github.com/vitejs/vite/issues/9904)
* fix(types): mark explicitImportRequired optional and experimental (#9962) ([7b618f0](https://github.com/vitejs/vite/commit/7b618f0)), closes [#9962](https://github.com/vitejs/vite/issues/9962)
* chore!: bump esbuild to 0.15.6 (#9934) ([091537c](https://github.com/vitejs/vite/commit/091537c)), closes [#9934](https://github.com/vitejs/vite/issues/9934)
* chore(deps): update dependency postcss-import to v15 (#9929) ([8f315a2](https://github.com/vitejs/vite/commit/8f315a2)), closes [#9929](https://github.com/vitejs/vite/issues/9929)
* feat(css): format error (#9909) ([632fedf](https://github.com/vitejs/vite/commit/632fedf)), closes [#9909](https://github.com/vitejs/vite/issues/9909)
* perf: bundle create-vite (#9034) ([37ac91e](https://github.com/vitejs/vite/commit/37ac91e)), closes [#9034](https://github.com/vitejs/vite/issues/9034)



## 3.1.0-beta.1 (2022-08-29)

* release: v3.1.0-beta.1 ([3b10a25](https://github.com/vitejs/vite/commit/3b10a25))
* docs: fix typo (#9855) ([583f185](https://github.com/vitejs/vite/commit/583f185)), closes [#9855](https://github.com/vitejs/vite/issues/9855)
* refactor(hmr): simplify fetchUpdate (#9881) ([8872aba](https://github.com/vitejs/vite/commit/8872aba)), closes [#9881](https://github.com/vitejs/vite/issues/9881)
* fix: ensure version query for direct node_modules imports (#9848) ([e7712ff](https://github.com/vitejs/vite/commit/e7712ff)), closes [#9848](https://github.com/vitejs/vite/issues/9848)
* fix: escape glob path (#9842) ([6be971e](https://github.com/vitejs/vite/commit/6be971e)), closes [#9842](https://github.com/vitejs/vite/issues/9842)
* fix(build): build project path error (#9793) ([cc8800a](https://github.com/vitejs/vite/commit/cc8800a)), closes [#9793](https://github.com/vitejs/vite/issues/9793)
* fix(deps): update all non-major dependencies (#9888) ([e35a58b](https://github.com/vitejs/vite/commit/e35a58b)), closes [#9888](https://github.com/vitejs/vite/issues/9888)
* fix(types): explicitly set Vite hooks' `this` to `void` (#9885) ([2d2f2e5](https://github.com/vitejs/vite/commit/2d2f2e5)), closes [#9885](https://github.com/vitejs/vite/issues/9885)
* feat: stabilize server.resolvedUrls (#9866) ([c3f6731](https://github.com/vitejs/vite/commit/c3f6731)), closes [#9866](https://github.com/vitejs/vite/issues/9866)
* feat(client): use debug channel on hot updates (#8855) ([0452224](https://github.com/vitejs/vite/commit/0452224)), closes [#8855](https://github.com/vitejs/vite/issues/8855)



## 3.1.0-beta.0 (2022-08-25)

* release: v3.1.0-beta.0 ([5df788d](https://github.com/vitejs/vite/commit/5df788d))
* feat: relax dep browser externals as warning (#9837) ([71cb374](https://github.com/vitejs/vite/commit/71cb374)), closes [#9837](https://github.com/vitejs/vite/issues/9837)
* feat: support object style hooks (#9634) ([757a92f](https://github.com/vitejs/vite/commit/757a92f)), closes [#9634](https://github.com/vitejs/vite/issues/9634)
* fix: `completeSystemWrapPlugin` captures `function ()` (fixes #9807) (#9821) ([1ee0364](https://github.com/vitejs/vite/commit/1ee0364)), closes [#9807](https://github.com/vitejs/vite/issues/9807) [#9821](https://github.com/vitejs/vite/issues/9821)
* fix: `injectQuery` break relative path (#9760) ([61273b2](https://github.com/vitejs/vite/commit/61273b2)), closes [#9760](https://github.com/vitejs/vite/issues/9760)
* fix: close socket when client error handled (#9816) ([ba62be4](https://github.com/vitejs/vite/commit/ba62be4)), closes [#9816](https://github.com/vitejs/vite/issues/9816)
* fix: handle resolve optional peer deps (#9321) ([eec3886](https://github.com/vitejs/vite/commit/eec3886)), closes [#9321](https://github.com/vitejs/vite/issues/9321)
* fix: module graph ensureEntryFromUrl based on id (#9759) ([01857af](https://github.com/vitejs/vite/commit/01857af)), closes [#9759](https://github.com/vitejs/vite/issues/9759)
* fix: sanitize asset filenames (#9737) ([2f468bb](https://github.com/vitejs/vite/commit/2f468bb)), closes [#9737](https://github.com/vitejs/vite/issues/9737)
* fix: Skip inlining Git LFS placeholders (fix #9714) (#9795) ([9c7e43d](https://github.com/vitejs/vite/commit/9c7e43d)), closes [#9714](https://github.com/vitejs/vite/issues/9714) [#9795](https://github.com/vitejs/vite/issues/9795)
* fix(html): move importmap before module scripts (#9392) ([b386fba](https://github.com/vitejs/vite/commit/b386fba)), closes [#9392](https://github.com/vitejs/vite/issues/9392)
* refactor: migrate from vue/compiler-dom to parse5 (#9678) ([05b3ce6](https://github.com/vitejs/vite/commit/05b3ce6)), closes [#9678](https://github.com/vitejs/vite/issues/9678)
* refactor: use `server.ssrTransform` (#9769) ([246a087](https://github.com/vitejs/vite/commit/246a087)), closes [#9769](https://github.com/vitejs/vite/issues/9769)
* chore: output tsconfck debug log (#9768) ([9206ad7](https://github.com/vitejs/vite/commit/9206ad7)), closes [#9768](https://github.com/vitejs/vite/issues/9768)
* chore: remove custom vitepress config (#9785) ([b2c0ee0](https://github.com/vitejs/vite/commit/b2c0ee0)), closes [#9785](https://github.com/vitejs/vite/issues/9785)
* chore(deps): update all non-major dependencies (#9778) ([aceaefc](https://github.com/vitejs/vite/commit/aceaefc)), closes [#9778](https://github.com/vitejs/vite/issues/9778)
* chore(deps): update dependency postcss-modules to v5 (#9779) ([aca6ac2](https://github.com/vitejs/vite/commit/aca6ac2)), closes [#9779](https://github.com/vitejs/vite/issues/9779)
* perf: legacy avoid insert the entry module css (#9761) ([0765ab8](https://github.com/vitejs/vite/commit/0765ab8)), closes [#9761](https://github.com/vitejs/vite/issues/9761)



## <small>3.0.9 (2022-08-19)</small>

* release: v3.0.9 ([518bc6c](https://github.com/vitejs/vite/commit/518bc6c))
* feat(ssr): warn if cant analyze dynamic import (#9738) ([e0ecb80](https://github.com/vitejs/vite/commit/e0ecb80)), closes [#9738](https://github.com/vitejs/vite/issues/9738)
* fix: dynamic import path contain ../ and its own directory (#9350) ([c6870f3](https://github.com/vitejs/vite/commit/c6870f3)), closes [#9350](https://github.com/vitejs/vite/issues/9350)
* fix: legacy no resolve asset urls (#9507) ([1d6a1eb](https://github.com/vitejs/vite/commit/1d6a1eb)), closes [#9507](https://github.com/vitejs/vite/issues/9507)
* fix: print error file path when using `rollupOptions.output.dir` (fix #9100) (#9111) ([3bffd14](https://github.com/vitejs/vite/commit/3bffd14)), closes [#9100](https://github.com/vitejs/vite/issues/9100) [#9111](https://github.com/vitejs/vite/issues/9111)
* fix: skip undefined proxy entry (#9622) ([e396d67](https://github.com/vitejs/vite/commit/e396d67)), closes [#9622](https://github.com/vitejs/vite/issues/9622)
* fix(hmr): duplicate link tags (#9697) ([9aa9515](https://github.com/vitejs/vite/commit/9aa9515)), closes [#9697](https://github.com/vitejs/vite/issues/9697)
* fix(import-analysis): escape quotes (#9729) ([21515f1](https://github.com/vitejs/vite/commit/21515f1)), closes [#9729](https://github.com/vitejs/vite/issues/9729)
* docs: fix typos in comments and documentation (#9711) ([0571232](https://github.com/vitejs/vite/commit/0571232)), closes [#9711](https://github.com/vitejs/vite/issues/9711)
* docs: update import.meta.glob jsdocs (#9709) ([15ff3a2](https://github.com/vitejs/vite/commit/15ff3a2)), closes [#9709](https://github.com/vitejs/vite/issues/9709)
* chore(deps): update all non-major dependencies (#9675) ([4e56e87](https://github.com/vitejs/vite/commit/4e56e87)), closes [#9675](https://github.com/vitejs/vite/issues/9675)
* chore(deps): update dependency es-module-lexer to v1 (#9576) ([1d8613f](https://github.com/vitejs/vite/commit/1d8613f)), closes [#9576](https://github.com/vitejs/vite/issues/9576)
* perf: avoid `ssrTransform` object allocation (#9706) ([6e58d9d](https://github.com/vitejs/vite/commit/6e58d9d)), closes [#9706](https://github.com/vitejs/vite/issues/9706)



## <small>3.0.8 (2022-08-16)</small>

* release: v3.0.8 ([dfdbc59](https://github.com/vitejs/vite/commit/dfdbc59))
* fix: allow ping to http from https website (#9561) ([f4b4405](https://github.com/vitejs/vite/commit/f4b4405)), closes [#9561](https://github.com/vitejs/vite/issues/9561)
* fix: use browser field if likely esm (fixes #9652) (#9653) ([85e387a](https://github.com/vitejs/vite/commit/85e387a)), closes [#9652](https://github.com/vitejs/vite/issues/9652) [#9653](https://github.com/vitejs/vite/issues/9653)
* fix(ssr-manifest): filter path undefined when dynamic import (#9655) ([1478a2f](https://github.com/vitejs/vite/commit/1478a2f)), closes [#9655](https://github.com/vitejs/vite/issues/9655)
* docs: update WSL2 watch limitation explanation (#8939) ([afbb87d](https://github.com/vitejs/vite/commit/afbb87d)), closes [#8939](https://github.com/vitejs/vite/issues/8939)



## <small>3.0.7 (2022-08-12)</small>

* release: v3.0.7 ([e384e31](https://github.com/vitejs/vite/commit/e384e31))
* chore: fix typo in error message (#9645) ([7121ee0](https://github.com/vitejs/vite/commit/7121ee0)), closes [#9645](https://github.com/vitejs/vite/issues/9645)
* fix(config): don't use file url for external files with cjs output (#9642) ([73ad707](https://github.com/vitejs/vite/commit/73ad707)), closes [#9642](https://github.com/vitejs/vite/issues/9642)



## <small>3.0.6 (2022-08-11)</small>

* release: v3.0.6 ([3455c17](https://github.com/vitejs/vite/commit/3455c17))
* chore: narrow down rollup version (#9637) ([fcf4d98](https://github.com/vitejs/vite/commit/fcf4d98)), closes [#9637](https://github.com/vitejs/vite/issues/9637)
* feat: show warning on 431 response (#9324) ([e8b61bb](https://github.com/vitejs/vite/commit/e8b61bb)), closes [#9324](https://github.com/vitejs/vite/issues/9324)
* fix: avoid using `import.meta.url` for relative assets if output is not ESM (fixes #9297) (#9381) ([6d95225](https://github.com/vitejs/vite/commit/6d95225)), closes [#9297](https://github.com/vitejs/vite/issues/9297) [#9381](https://github.com/vitejs/vite/issues/9381)
* fix: json HMR (fixes #9521) (#9610) ([e45d95f](https://github.com/vitejs/vite/commit/e45d95f)), closes [#9521](https://github.com/vitejs/vite/issues/9521) [#9610](https://github.com/vitejs/vite/issues/9610)
* fix: legacy no emit worker (#9500) ([9d0b18b](https://github.com/vitejs/vite/commit/9d0b18b)), closes [#9500](https://github.com/vitejs/vite/issues/9500)
* fix: use browser field if it is not likely UMD or CJS (fixes #9445) (#9459) ([c868e64](https://github.com/vitejs/vite/commit/c868e64)), closes [#9445](https://github.com/vitejs/vite/issues/9445) [#9459](https://github.com/vitejs/vite/issues/9459)
* fix(optimizer): ignore EACCES errors while scanner (fixes #8916) (#9509) ([4e6a77f](https://github.com/vitejs/vite/commit/4e6a77f)), closes [#8916](https://github.com/vitejs/vite/issues/8916) [#9509](https://github.com/vitejs/vite/issues/9509)
* fix(ssr): rename objectPattern dynamic key (fixes #9585) (#9609) ([ee7f78f](https://github.com/vitejs/vite/commit/ee7f78f)), closes [#9585](https://github.com/vitejs/vite/issues/9585) [#9609](https://github.com/vitejs/vite/issues/9609)



## <small>3.0.5 (2022-08-09)</small>

* release: v3.0.5 ([10757b8](https://github.com/vitejs/vite/commit/10757b8))
* fix: allow tree-shake glob eager css in js (#9547) ([2e309d6](https://github.com/vitejs/vite/commit/2e309d6)), closes [#9547](https://github.com/vitejs/vite/issues/9547)
* fix: ignore tsconfig target when bundling config (#9457) ([c5e7895](https://github.com/vitejs/vite/commit/c5e7895)), closes [#9457](https://github.com/vitejs/vite/issues/9457)
* fix: log worker plugins in debug mode (#9553) ([c1fa219](https://github.com/vitejs/vite/commit/c1fa219)), closes [#9553](https://github.com/vitejs/vite/issues/9553)
* fix: tree-shake modulepreload polyfill (#9531) ([1f11a70](https://github.com/vitejs/vite/commit/1f11a70)), closes [#9531](https://github.com/vitejs/vite/issues/9531)
* fix: update dep types (fixes #9475) (#9489) ([937cecc](https://github.com/vitejs/vite/commit/937cecc)), closes [#9475](https://github.com/vitejs/vite/issues/9475) [#9489](https://github.com/vitejs/vite/issues/9489)
* fix(build): normalized output log (#9594) ([8bae103](https://github.com/vitejs/vite/commit/8bae103)), closes [#9594](https://github.com/vitejs/vite/issues/9594)
* fix(config): try catch unlink after load (#9577) ([d35a1e2](https://github.com/vitejs/vite/commit/d35a1e2)), closes [#9577](https://github.com/vitejs/vite/issues/9577)
* fix(config): use file url for import path (fixes #9471) (#9473) ([22084a6](https://github.com/vitejs/vite/commit/22084a6)), closes [#9471](https://github.com/vitejs/vite/issues/9471) [#9473](https://github.com/vitejs/vite/issues/9473)
* fix(deps): update all non-major dependencies (#9575) ([8071325](https://github.com/vitejs/vite/commit/8071325)), closes [#9575](https://github.com/vitejs/vite/issues/9575)
* fix(ssr): check root import extension for external (#9494) ([ff89df5](https://github.com/vitejs/vite/commit/ff89df5)), closes [#9494](https://github.com/vitejs/vite/issues/9494)
* fix(ssr): use appendRight for import (#9554) ([dfec6ca](https://github.com/vitejs/vite/commit/dfec6ca)), closes [#9554](https://github.com/vitejs/vite/issues/9554)
* refactor(resolve): remove commonjs plugin handling (#9460) ([2042b91](https://github.com/vitejs/vite/commit/2042b91)), closes [#9460](https://github.com/vitejs/vite/issues/9460)
* chore: init imports var before use (#9569) ([905b8eb](https://github.com/vitejs/vite/commit/905b8eb)), closes [#9569](https://github.com/vitejs/vite/issues/9569)
* chore: node prefix lint (#9514) ([9e9cd23](https://github.com/vitejs/vite/commit/9e9cd23)), closes [#9514](https://github.com/vitejs/vite/issues/9514)
* chore: tidy up eslint config (#9468) ([f4addcf](https://github.com/vitejs/vite/commit/f4addcf)), closes [#9468](https://github.com/vitejs/vite/issues/9468)
* chore(deps): update all non-major dependencies (#9478) ([c530d16](https://github.com/vitejs/vite/commit/c530d16)), closes [#9478](https://github.com/vitejs/vite/issues/9478)
* docs: fix incomplete comment (#9466) ([5169c51](https://github.com/vitejs/vite/commit/5169c51)), closes [#9466](https://github.com/vitejs/vite/issues/9466)
* feat(ssr): debug failed node resolve (#9432) ([364aae1](https://github.com/vitejs/vite/commit/364aae1)), closes [#9432](https://github.com/vitejs/vite/issues/9432)



## <small>3.0.4 (2022-07-29)</small>

* release: v3.0.4 ([1c1cf43](https://github.com/vitejs/vite/commit/1c1cf43))
* fix: __VITE_PUBLIC_ASSET__hash__ in HTML (#9247) ([a2b24ee](https://github.com/vitejs/vite/commit/a2b24ee)), closes [#9247](https://github.com/vitejs/vite/issues/9247)
* fix: inline dynamic imports for ssr-webworker (fixes #9385) (#9401) ([cd69358](https://github.com/vitejs/vite/commit/cd69358)), closes [#9385](https://github.com/vitejs/vite/issues/9385) [#9401](https://github.com/vitejs/vite/issues/9401)
* fix: normalise css paths in manifest on windows (fixes #9295) (#9353) ([13e6450](https://github.com/vitejs/vite/commit/13e6450)), closes [#9295](https://github.com/vitejs/vite/issues/9295) [#9353](https://github.com/vitejs/vite/issues/9353)
* fix: support stylesheets with link tag and media/disable prop (#6751) ([e6c8965](https://github.com/vitejs/vite/commit/e6c8965)), closes [#6751](https://github.com/vitejs/vite/issues/6751)
* fix: url constructor import asset no as url (#9399) ([122c6e7](https://github.com/vitejs/vite/commit/122c6e7)), closes [#9399](https://github.com/vitejs/vite/issues/9399)
* fix(glob): server perf when globbing huge dirs (#9425) ([156a3a4](https://github.com/vitejs/vite/commit/156a3a4)), closes [#9425](https://github.com/vitejs/vite/issues/9425)
* fix(glob): support static template literals (#9352) ([183c6fb](https://github.com/vitejs/vite/commit/183c6fb)), closes [#9352](https://github.com/vitejs/vite/issues/9352)
* fix(ssr): allow virtual paths on node modules (#9405) ([e60368f](https://github.com/vitejs/vite/commit/e60368f)), closes [#9405](https://github.com/vitejs/vite/issues/9405)
* chore(deps): update all non-major dependencies (#9347) ([2fcb027](https://github.com/vitejs/vite/commit/2fcb027)), closes [#9347](https://github.com/vitejs/vite/issues/9347)



## <small>3.0.3 (2022-07-25)</small>

* release: v3.0.3 ([4215d46](https://github.com/vitejs/vite/commit/4215d46))
* fix: client type error (#9289) ([b82ddfb](https://github.com/vitejs/vite/commit/b82ddfb)), closes [#9289](https://github.com/vitejs/vite/issues/9289)
* fix: don't modify config (#9262) ([bbc8318](https://github.com/vitejs/vite/commit/bbc8318)), closes [#9262](https://github.com/vitejs/vite/issues/9262)
* fix: entries in ssr.external (#9286) ([d420f01](https://github.com/vitejs/vite/commit/d420f01)), closes [#9286](https://github.com/vitejs/vite/issues/9286)
* fix: externalize explicitly configured linked packages (#9346) ([c33e365](https://github.com/vitejs/vite/commit/c33e365)), closes [#9346](https://github.com/vitejs/vite/issues/9346)
* fix: make `resolveConfig()` concurrent safe (#9224) ([dfaeb2b](https://github.com/vitejs/vite/commit/dfaeb2b)), closes [#9224](https://github.com/vitejs/vite/issues/9224)
* fix: scanner and optimizer should skip wasm (#9257) ([c616077](https://github.com/vitejs/vite/commit/c616077)), closes [#9257](https://github.com/vitejs/vite/issues/9257)
* fix: ssrLoadModule executes code in non-strict mode, fixes #9197 (#9199) ([5866cfb](https://github.com/vitejs/vite/commit/5866cfb)), closes [#9197](https://github.com/vitejs/vite/issues/9197) [#9199](https://github.com/vitejs/vite/issues/9199)
* fix: support multiline dynamic imports (#9314) ([e66cf69](https://github.com/vitejs/vite/commit/e66cf69)), closes [#9314](https://github.com/vitejs/vite/issues/9314)
* fix: support vite client in safari 13 (#9315) ([2415193](https://github.com/vitejs/vite/commit/2415193)), closes [#9315](https://github.com/vitejs/vite/issues/9315)
* fix: worker relative base should use import.meta.url (#9204) ([0358b04](https://github.com/vitejs/vite/commit/0358b04)), closes [#9204](https://github.com/vitejs/vite/issues/9204)
* fix(glob): handle glob prop access (#9281) ([0580215](https://github.com/vitejs/vite/commit/0580215)), closes [#9281](https://github.com/vitejs/vite/issues/9281)
* fix(scan): handle .ts import as .js alias (#9282) ([0b083ca](https://github.com/vitejs/vite/commit/0b083ca)), closes [#9282](https://github.com/vitejs/vite/issues/9282)
* fix(ssr): no external symlink package (#9296) ([ea27701](https://github.com/vitejs/vite/commit/ea27701)), closes [#9296](https://github.com/vitejs/vite/issues/9296)
* chore: adjust comments/typos (#9325) ([ffb2ba3](https://github.com/vitejs/vite/commit/ffb2ba3)), closes [#9325](https://github.com/vitejs/vite/issues/9325)
* chore: fix code typos (#9033) ([ed02861](https://github.com/vitejs/vite/commit/ed02861)), closes [#9033](https://github.com/vitejs/vite/issues/9033)
* docs: fix `@rollup/plugin-commonjs` name (#9313) ([c417364](https://github.com/vitejs/vite/commit/c417364)), closes [#9313](https://github.com/vitejs/vite/issues/9313)
* docs: fix server options link (#9242) ([29db3ea](https://github.com/vitejs/vite/commit/29db3ea)), closes [#9242](https://github.com/vitejs/vite/issues/9242)
* docs: update browser baseline features (#9316) ([b82ee5d](https://github.com/vitejs/vite/commit/b82ee5d)), closes [#9316](https://github.com/vitejs/vite/issues/9316)
* feat: supports cts and mts files (#9268) ([0602017](https://github.com/vitejs/vite/commit/0602017)), closes [#9268](https://github.com/vitejs/vite/issues/9268)
* feat: worker config call config hook (#9212) ([3e510ab](https://github.com/vitejs/vite/commit/3e510ab)), closes [#9212](https://github.com/vitejs/vite/issues/9212)
* feat(css): use esbuild.log* options when minifying (#9210) ([88baa53](https://github.com/vitejs/vite/commit/88baa53)), closes [#9210](https://github.com/vitejs/vite/issues/9210)



## <small>3.0.2 (2022-07-18)</small>

* release: v3.0.2 ([af6088f](https://github.com/vitejs/vite/commit/af6088f))
* fix: fs serve only edit pathname (fixes #9148) (#9173) ([28cffc9](https://github.com/vitejs/vite/commit/28cffc9)), closes [#9148](https://github.com/vitejs/vite/issues/9148) [#9173](https://github.com/vitejs/vite/issues/9173)
* fix: prevent null pathname error (#9188) ([d66ffd0](https://github.com/vitejs/vite/commit/d66ffd0)), closes [#9188](https://github.com/vitejs/vite/issues/9188)
* fix: return 500 on proxy error only if possible (fixes #9172) (#9193) ([b2f6bdc](https://github.com/vitejs/vite/commit/b2f6bdc)), closes [#9172](https://github.com/vitejs/vite/issues/9172) [#9193](https://github.com/vitejs/vite/issues/9193)
* fix(deps): update all non-major dependencies (#9176) ([31d3b70](https://github.com/vitejs/vite/commit/31d3b70)), closes [#9176](https://github.com/vitejs/vite/issues/9176)
* fix(dev): build.ssr is set during dev, fix #9134 (#9187) ([99b0e67](https://github.com/vitejs/vite/commit/99b0e67)), closes [#9134](https://github.com/vitejs/vite/issues/9134) [#9187](https://github.com/vitejs/vite/issues/9187)
* fix(ssr): strip NULL_BYTE_PLACEHOLDER before import (#9124) ([c5f2dc7](https://github.com/vitejs/vite/commit/c5f2dc7)), closes [#9124](https://github.com/vitejs/vite/issues/9124)



## <small>3.0.1 (2022-07-18)</small>

* release: v3.0.1 ([8db00d8](https://github.com/vitejs/vite/commit/8db00d8))
* fix: avoid errors when loading the overlay code in workers (#9064) ([a52b45e](https://github.com/vitejs/vite/commit/a52b45e)), closes [#9064](https://github.com/vitejs/vite/issues/9064)
* fix: check server after tsconfig reload (#9106) ([d12d469](https://github.com/vitejs/vite/commit/d12d469)), closes [#9106](https://github.com/vitejs/vite/issues/9106)
* fix: disable keepNames in `vite:esbuild` (fixes #9164) (#9166) ([e6f3b02](https://github.com/vitejs/vite/commit/e6f3b02)), closes [#9164](https://github.com/vitejs/vite/issues/9164) [#9166](https://github.com/vitejs/vite/issues/9166)
* fix: externalize workspace relative import when bundle config (#9140) ([5a8a3ab](https://github.com/vitejs/vite/commit/5a8a3ab)), closes [#9140](https://github.com/vitejs/vite/issues/9140)
* fix: mention that Node.js 13/15 support is dropped (fixes #9113) (#9116) ([2826303](https://github.com/vitejs/vite/commit/2826303)), closes [#9113](https://github.com/vitejs/vite/issues/9113) [#9116](https://github.com/vitejs/vite/issues/9116)
* fix: resolve drive relative path (#9097) ([b393451](https://github.com/vitejs/vite/commit/b393451)), closes [#9097](https://github.com/vitejs/vite/issues/9097)
* fix: respect .mjs .cjs extension in all modes (#9141) ([5ea70b3](https://github.com/vitejs/vite/commit/5ea70b3)), closes [#9141](https://github.com/vitejs/vite/issues/9141)
* fix: return 500 on proxy error only if possible (fixes #9172) (#9175) ([d2f02a8](https://github.com/vitejs/vite/commit/d2f02a8)), closes [#9172](https://github.com/vitejs/vite/issues/9172) [#9175](https://github.com/vitejs/vite/issues/9175)
* fix: server.proxy ws error causes crash (#9123) ([c2426d1](https://github.com/vitejs/vite/commit/c2426d1)), closes [#9123](https://github.com/vitejs/vite/issues/9123)
* fix: ssr.external/noExternal should apply to packageName (#9146) ([5844d8e](https://github.com/vitejs/vite/commit/5844d8e)), closes [#9146](https://github.com/vitejs/vite/issues/9146)
* fix: use correct require extension to load config (#9118) ([ebf682e](https://github.com/vitejs/vite/commit/ebf682e)), closes [#9118](https://github.com/vitejs/vite/issues/9118)
* fix(esbuild): always support dynamic import and import meta (#9105) ([57a7936](https://github.com/vitejs/vite/commit/57a7936)), closes [#9105](https://github.com/vitejs/vite/issues/9105)
* feat: allow declaring dirname (#9154) ([1e078ad](https://github.com/vitejs/vite/commit/1e078ad)), closes [#9154](https://github.com/vitejs/vite/issues/9154)
* refactor: always load config with esbuild bundled code (#9121) ([a2b3131](https://github.com/vitejs/vite/commit/a2b3131)), closes [#9121](https://github.com/vitejs/vite/issues/9121)
* docs: update default for optimizeDeps.disabled (#9078) ([4fbf9a8](https://github.com/vitejs/vite/commit/4fbf9a8)), closes [#9078](https://github.com/vitejs/vite/issues/9078)
* chore: 3.0 release notes and bump peer deps (#9072) ([427ba26](https://github.com/vitejs/vite/commit/427ba26)), closes [#9072](https://github.com/vitejs/vite/issues/9072)



## 3.0.0 (2022-07-13)

* release: v3.0.0 ([b8c625c](https://github.com/vitejs/vite/commit/b8c625c))
* fix: prevent production node_env in serve (#9066) ([7662998](https://github.com/vitejs/vite/commit/7662998)), closes [#9066](https://github.com/vitejs/vite/issues/9066)
* fix: reload on restart with middleware mode (fixes #9038) (#9040) ([e372693](https://github.com/vitejs/vite/commit/e372693)), closes [#9038](https://github.com/vitejs/vite/issues/9038) [#9040](https://github.com/vitejs/vite/issues/9040)
* fix: remove ws is already closed error (#9041) ([45b8b53](https://github.com/vitejs/vite/commit/45b8b53)), closes [#9041](https://github.com/vitejs/vite/issues/9041)
* chore: include 2.9.13-2.9.14 changelog in main (#9053) ([f020066](https://github.com/vitejs/vite/commit/f020066)), closes [#9053](https://github.com/vitejs/vite/issues/9053)



## 3.0.0-beta.10 (2022-07-11)

* release: v3.0.0-beta.10 ([e685de3](https://github.com/vitejs/vite/commit/e685de3))
* feat: expose server resolved urls (#8986) ([26bcdc3](https://github.com/vitejs/vite/commit/26bcdc3)), closes [#8986](https://github.com/vitejs/vite/issues/8986)
* feat: show ws connection error (#9007) ([da7c3ae](https://github.com/vitejs/vite/commit/da7c3ae)), closes [#9007](https://github.com/vitejs/vite/issues/9007)
* chore: fix test optimizeDeps at build time flag (#9004) ([9363872](https://github.com/vitejs/vite/commit/9363872)), closes [#9004](https://github.com/vitejs/vite/issues/9004)
* chore: ignore ts warning (#9015) ([e2a6bf4](https://github.com/vitejs/vite/commit/e2a6bf4)), closes [#9015](https://github.com/vitejs/vite/issues/9015)
* chore: scanner after server listen (#9020) ([53799e1](https://github.com/vitejs/vite/commit/53799e1)), closes [#9020](https://github.com/vitejs/vite/issues/9020)
* chore: v3.0.0-beta.9 release notes (#8996) ([2a9bc6d](https://github.com/vitejs/vite/commit/2a9bc6d)), closes [#8996](https://github.com/vitejs/vite/issues/8996)
* chore(deps): update all non-major dependencies (#9022) ([6342140](https://github.com/vitejs/vite/commit/6342140)), closes [#9022](https://github.com/vitejs/vite/issues/9022)
* fix(ssr): sourcemap content (fixes #8657) (#8997) ([aff4544](https://github.com/vitejs/vite/commit/aff4544)), closes [#8657](https://github.com/vitejs/vite/issues/8657) [#8997](https://github.com/vitejs/vite/issues/8997)
* docs: update api-javascript (#8999) ([05b17df](https://github.com/vitejs/vite/commit/05b17df)), closes [#8999](https://github.com/vitejs/vite/issues/8999)



## 3.0.0-beta.9 (2022-07-08)

* release: v3.0.0-beta.9 ([5a7d04d](https://github.com/vitejs/vite/commit/5a7d04d))
* fix: respect explicitily external/noExternal config (#8983) ([e369880](https://github.com/vitejs/vite/commit/e369880)), closes [#8983](https://github.com/vitejs/vite/issues/8983)



## 3.0.0-beta.8 (2022-07-08)

* release: v3.0.0-beta.8 ([33d6177](https://github.com/vitejs/vite/commit/33d6177))
* refactor: opt-in optimizeDeps during build and SSR (#8965) ([f8c8cf2](https://github.com/vitejs/vite/commit/f8c8cf2)), closes [#8965](https://github.com/vitejs/vite/issues/8965)
* fix: cjs interop export names local clash, fix #8950 (#8953) ([2185f72](https://github.com/vitejs/vite/commit/2185f72)), closes [#8950](https://github.com/vitejs/vite/issues/8950) [#8953](https://github.com/vitejs/vite/issues/8953)
* fix: handle context resolve options (#8966) ([57c6c15](https://github.com/vitejs/vite/commit/57c6c15)), closes [#8966](https://github.com/vitejs/vite/issues/8966)
* fix: re-encode url to prevent fs.allow bypass (fixes #8498) (#8979) ([b835699](https://github.com/vitejs/vite/commit/b835699)), closes [#8498](https://github.com/vitejs/vite/issues/8498) [#8979](https://github.com/vitejs/vite/issues/8979)
* fix(scan): detect import .ts as .js (#8969) ([752af6c](https://github.com/vitejs/vite/commit/752af6c)), closes [#8969](https://github.com/vitejs/vite/issues/8969)
* refactor!: move basic ssl setup to external plugin, fix #8532 (#8961) ([5c6cf5a](https://github.com/vitejs/vite/commit/5c6cf5a)), closes [#8532](https://github.com/vitejs/vite/issues/8532) [#8961](https://github.com/vitejs/vite/issues/8961)



## 3.0.0-beta.7 (2022-07-06)

* release: v3.0.0-beta.7 ([0d2c257](https://github.com/vitejs/vite/commit/0d2c257))
* fix: ssrBuild is optional, avoid breaking VitePress (#8912) ([722f514](https://github.com/vitejs/vite/commit/722f514)), closes [#8912](https://github.com/vitejs/vite/issues/8912)
* fix(css): always use css module content (#8936) ([6e0dd3a](https://github.com/vitejs/vite/commit/6e0dd3a)), closes [#8936](https://github.com/vitejs/vite/issues/8936)
* feat: avoid scanner during build and only optimize CJS in SSR (#8932) ([339d9e3](https://github.com/vitejs/vite/commit/339d9e3)), closes [#8932](https://github.com/vitejs/vite/issues/8932)
* feat: improved cold start using deps scanner (#8869) ([188f188](https://github.com/vitejs/vite/commit/188f188)), closes [#8869](https://github.com/vitejs/vite/issues/8869)
* feat: ssr.optimizeDeps (#8917) ([f280dd9](https://github.com/vitejs/vite/commit/f280dd9)), closes [#8917](https://github.com/vitejs/vite/issues/8917)
* feat: support import assertions (#8937) ([2390422](https://github.com/vitejs/vite/commit/2390422)), closes [#8937](https://github.com/vitejs/vite/issues/8937)



## 3.0.0-beta.6 (2022-07-04)

* release: v3.0.0-beta.6 ([d412860](https://github.com/vitejs/vite/commit/d412860))
* chore: add package.json to export map (#8838) ([cbefc63](https://github.com/vitejs/vite/commit/cbefc63)), closes [#8838](https://github.com/vitejs/vite/issues/8838)
* chore: update deprecation warnings for improved migration DX (#8866) ([4eb2348](https://github.com/vitejs/vite/commit/4eb2348)), closes [#8866](https://github.com/vitejs/vite/issues/8866)
* chore: use tsconfig for client build (#8815) ([10936cd](https://github.com/vitejs/vite/commit/10936cd)), closes [#8815](https://github.com/vitejs/vite/issues/8815)
* chore(deps): update all non-major dependencies (#8905) ([4a24c17](https://github.com/vitejs/vite/commit/4a24c17)), closes [#8905](https://github.com/vitejs/vite/issues/8905)
* chore(deps): update dependency connect-history-api-fallback to v2 (#8906) ([129c7c6](https://github.com/vitejs/vite/commit/129c7c6)), closes [#8906](https://github.com/vitejs/vite/issues/8906)
* refactor: remove ?used inject in glob plugin (#8900) ([f9b5c14](https://github.com/vitejs/vite/commit/f9b5c14)), closes [#8900](https://github.com/vitejs/vite/issues/8900)
* fix: avoid optimizing non-optimizable external deps (#8860) ([cd8d63b](https://github.com/vitejs/vite/commit/cd8d63b)), closes [#8860](https://github.com/vitejs/vite/issues/8860)
* fix: ensure define overrides import.meta in build (#8892) ([7d810a9](https://github.com/vitejs/vite/commit/7d810a9)), closes [#8892](https://github.com/vitejs/vite/issues/8892)
* fix: ignore Playwright test results directory (#8778) ([314c09c](https://github.com/vitejs/vite/commit/314c09c)), closes [#8778](https://github.com/vitejs/vite/issues/8778)
* fix: node platform for ssr dev regression (#8840) ([7257fd8](https://github.com/vitejs/vite/commit/7257fd8)), closes [#8840](https://github.com/vitejs/vite/issues/8840)
* fix: optimize deps on dev SSR, builtin imports in node (#8854) ([d49856c](https://github.com/vitejs/vite/commit/d49856c)), closes [#8854](https://github.com/vitejs/vite/issues/8854)
* fix: prevent crash when the pad amount is negative (#8747) ([3af6a1b](https://github.com/vitejs/vite/commit/3af6a1b)), closes [#8747](https://github.com/vitejs/vite/issues/8747)
* fix: reverts #8278 ([a0da2f0](https://github.com/vitejs/vite/commit/a0da2f0)), closes [#8278](https://github.com/vitejs/vite/issues/8278)
* fix: server.force deprecation and force on restart API (#8842) ([c94f564](https://github.com/vitejs/vite/commit/c94f564)), closes [#8842](https://github.com/vitejs/vite/issues/8842)
* fix(deps): update all non-major dependencies (#8802) ([a4a634d](https://github.com/vitejs/vite/commit/a4a634d)), closes [#8802](https://github.com/vitejs/vite/issues/8802)
* fix(hmr): set isSelfAccepting unless it is delayed (#8898) ([ae34565](https://github.com/vitejs/vite/commit/ae34565)), closes [#8898](https://github.com/vitejs/vite/issues/8898)
* fix(worker): dont throw on `import.meta.url` in ssr (#8846) ([ef749ed](https://github.com/vitejs/vite/commit/ef749ed)), closes [#8846](https://github.com/vitejs/vite/issues/8846)
* feat: accept AcceptedPlugin type for postcss plugin (#8830) ([6886078](https://github.com/vitejs/vite/commit/6886078)), closes [#8830](https://github.com/vitejs/vite/issues/8830)
* feat: ssrBuild flag in config env (#8863) ([b6d655a](https://github.com/vitejs/vite/commit/b6d655a)), closes [#8863](https://github.com/vitejs/vite/issues/8863)



## 3.0.0-beta.5 (2022-06-28)

* release: v3.0.0-beta.5 ([e5a39cc](https://github.com/vitejs/vite/commit/e5a39cc))
* fix: deps optimizer should wait on entries (#8822) ([2db1b5b](https://github.com/vitejs/vite/commit/2db1b5b)), closes [#8822](https://github.com/vitejs/vite/issues/8822)
* fix: incorrectly resolving `knownJsSrcRE` files from root (fixes #4161) (#8808) ([e1e426e](https://github.com/vitejs/vite/commit/e1e426e)), closes [#4161](https://github.com/vitejs/vite/issues/4161) [#8808](https://github.com/vitejs/vite/issues/8808)
* feat: experimental.renderBuiltUrl (revised build base options) (#8762) ([895a7d6](https://github.com/vitejs/vite/commit/895a7d6)), closes [#8762](https://github.com/vitejs/vite/issues/8762)
* feat: respect esbuild minify config for css (#8811) ([d90409e](https://github.com/vitejs/vite/commit/d90409e)), closes [#8811](https://github.com/vitejs/vite/issues/8811)
* feat: use esbuild supported feature (#8665) ([2061d41](https://github.com/vitejs/vite/commit/2061d41)), closes [#8665](https://github.com/vitejs/vite/issues/8665)



## 3.0.0-beta.4 (2022-06-27)

* release: v3.0.0-beta.4 ([d5c5099](https://github.com/vitejs/vite/commit/d5c5099))
* fix: /@fs/ dir traversal with escaped chars (fixes #8498) (#8804) ([6851009](https://github.com/vitejs/vite/commit/6851009)), closes [#8498](https://github.com/vitejs/vite/issues/8498) [#8804](https://github.com/vitejs/vite/issues/8804)
* fix: preserve extension of css assets in the manifest (#8768) ([9508549](https://github.com/vitejs/vite/commit/9508549)), closes [#8768](https://github.com/vitejs/vite/issues/8768)



## 3.0.0-beta.3 (2022-06-26)

* release: v3.0.0-beta.3 ([de8fdd8](https://github.com/vitejs/vite/commit/de8fdd8))
* fix: always remove temp config (#8782) ([2c2a86b](https://github.com/vitejs/vite/commit/2c2a86b)), closes [#8782](https://github.com/vitejs/vite/issues/8782)
* fix: ensure deps optimizer first run, fixes #8750 (#8775) ([3f689a4](https://github.com/vitejs/vite/commit/3f689a4)), closes [#8750](https://github.com/vitejs/vite/issues/8750) [#8775](https://github.com/vitejs/vite/issues/8775)
* fix: remove buildTimeImportMetaUrl (#8785) ([cd32095](https://github.com/vitejs/vite/commit/cd32095)), closes [#8785](https://github.com/vitejs/vite/issues/8785)
* fix: skip inline html (#8789) ([4a6408b](https://github.com/vitejs/vite/commit/4a6408b)), closes [#8789](https://github.com/vitejs/vite/issues/8789)
* fix(optimizer): only run require-import conversion if require'd (#8795) ([7ae0d3e](https://github.com/vitejs/vite/commit/7ae0d3e)), closes [#8795](https://github.com/vitejs/vite/issues/8795)
* perf: avoid sourcemap chains during dev (#8796) ([1566f61](https://github.com/vitejs/vite/commit/1566f61)), closes [#8796](https://github.com/vitejs/vite/issues/8796)
* chore: use `tsx` directly instead of indirect `esno` (#8773) ([f018f13](https://github.com/vitejs/vite/commit/f018f13)), closes [#8773](https://github.com/vitejs/vite/issues/8773)
* feat: respect esbuild minify config (#8754) ([8b77695](https://github.com/vitejs/vite/commit/8b77695)), closes [#8754](https://github.com/vitejs/vite/issues/8754)
* chore!: update rollup commonjs plugin to v22  (#8743) ([d4dcdd1](https://github.com/vitejs/vite/commit/d4dcdd1)), closes [#8743](https://github.com/vitejs/vite/issues/8743)



## 3.0.0-beta.2 (2022-06-24)

* release: v3.0.0-beta.2 ([eac0494](https://github.com/vitejs/vite/commit/eac0494))
* feat: enable tree-shaking for lib es (#8737) ([5dc0f72](https://github.com/vitejs/vite/commit/5dc0f72)), closes [#8737](https://github.com/vitejs/vite/issues/8737)
* feat: supports cts and mts config (#8729) ([c2b09db](https://github.com/vitejs/vite/commit/c2b09db)), closes [#8729](https://github.com/vitejs/vite/issues/8729)
* fix: avoid type mismatch with Rollup (fix #7843) (#8701) ([87e51f7](https://github.com/vitejs/vite/commit/87e51f7)), closes [#7843](https://github.com/vitejs/vite/issues/7843) [#8701](https://github.com/vitejs/vite/issues/8701)
* fix: optimizeDeps.entries transformRequest url (fix #8719) (#8748) ([9208c3b](https://github.com/vitejs/vite/commit/9208c3b)), closes [#8719](https://github.com/vitejs/vite/issues/8719) [#8748](https://github.com/vitejs/vite/issues/8748)
* fix(hmr): __HMR_PORT__ should not be `'undefined'` (#8761) ([3271266](https://github.com/vitejs/vite/commit/3271266)), closes [#8761](https://github.com/vitejs/vite/issues/8761)
* perf(lib): improve helper inject regex (#8741) ([19fc7e5](https://github.com/vitejs/vite/commit/19fc7e5)), closes [#8741](https://github.com/vitejs/vite/issues/8741)
* refactor: remove unnecessary condition (#8742) ([2ae269e](https://github.com/vitejs/vite/commit/2ae269e)), closes [#8742](https://github.com/vitejs/vite/issues/8742)
* docs: fix alpha changelog links (#8736) ([31348b5](https://github.com/vitejs/vite/commit/31348b5)), closes [#8736](https://github.com/vitejs/vite/issues/8736)
* chore: v3 beta release notes (#8718) ([7e899d0](https://github.com/vitejs/vite/commit/7e899d0)), closes [#8718](https://github.com/vitejs/vite/issues/8718)



## 3.0.0-beta.1 (2022-06-22)

* release: v3.0.0-beta.1 ([c8aab50](https://github.com/vitejs/vite/commit/c8aab50))
* fix: respect `rollupOptions.external` for transitive dependencies (#8679) ([4f9097b](https://github.com/vitejs/vite/commit/4f9097b)), closes [#8679](https://github.com/vitejs/vite/issues/8679)
* fix: use esbuild platform browser/node instead of neutral (#8714) ([a201cd4](https://github.com/vitejs/vite/commit/a201cd4)), closes [#8714](https://github.com/vitejs/vite/issues/8714)
* chore: collapse alpha version in v3 beta changelog (#8697) ([83286dd](https://github.com/vitejs/vite/commit/83286dd)), closes [#8697](https://github.com/vitejs/vite/issues/8697)



## 3.0.0-beta.0 (2022-06-21)

* release: v3.0.0-beta.0 ([1550ff8](https://github.com/vitejs/vite/commit/1550ff8))



## 3.0.0-alpha.14 (2022-06-20)

* release: v3.0.0-alpha.14 ([4d2fc6c](https://github.com/vitejs/vite/commit/4d2fc6c))
* fix: disable inlineDynamicImports for ssr.target = node (#8641) ([3b41a8e](https://github.com/vitejs/vite/commit/3b41a8e)), closes [#8641](https://github.com/vitejs/vite/issues/8641)
* fix: infer hmr ws target by client location (#8650) ([4061ee0](https://github.com/vitejs/vite/commit/4061ee0)), closes [#8650](https://github.com/vitejs/vite/issues/8650)
* fix: non-relative base public paths in CSS files (#8682) ([d11d6ea](https://github.com/vitejs/vite/commit/d11d6ea)), closes [#8682](https://github.com/vitejs/vite/issues/8682)
* fix: SSR with relative base (#8683) ([c1667bb](https://github.com/vitejs/vite/commit/c1667bb)), closes [#8683](https://github.com/vitejs/vite/issues/8683)
* feat: bump minimum node version to 14.18.0 (#8662) ([8a05432](https://github.com/vitejs/vite/commit/8a05432)), closes [#8662](https://github.com/vitejs/vite/issues/8662)
* feat: experimental.buildAdvancedBaseOptions (#8450) ([8ef7333](https://github.com/vitejs/vite/commit/8ef7333)), closes [#8450](https://github.com/vitejs/vite/issues/8450)
* feat: export esbuildVersion and rollupVersion (#8675) ([15ebe1e](https://github.com/vitejs/vite/commit/15ebe1e)), closes [#8675](https://github.com/vitejs/vite/issues/8675)
* feat: print resolved address for localhost (#8647) ([eb52d36](https://github.com/vitejs/vite/commit/eb52d36)), closes [#8647](https://github.com/vitejs/vite/issues/8647)
* feat(hmr): experimental.hmrPartialAccept (#7324) ([83dab7e](https://github.com/vitejs/vite/commit/83dab7e)), closes [#7324](https://github.com/vitejs/vite/issues/7324)
* chore: use node prefix (#8309) ([60721ac](https://github.com/vitejs/vite/commit/60721ac)), closes [#8309](https://github.com/vitejs/vite/issues/8309)
* chore(deps): update all non-major dependencies (#8669) ([628863d](https://github.com/vitejs/vite/commit/628863d)), closes [#8669](https://github.com/vitejs/vite/issues/8669)
* refactor: type client maps (#8626) ([cf87882](https://github.com/vitejs/vite/commit/cf87882)), closes [#8626](https://github.com/vitejs/vite/issues/8626)



## 3.0.0-alpha.13 (2022-06-19)

* release: v3.0.0-alpha.13 ([a96e129](https://github.com/vitejs/vite/commit/a96e129))
* feat: cleaner default dev output (#8638) ([dbd9688](https://github.com/vitejs/vite/commit/dbd9688)), closes [#8638](https://github.com/vitejs/vite/issues/8638)
* feat: legacy options to revert to v2 strategies (#8623) ([993b842](https://github.com/vitejs/vite/commit/993b842)), closes [#8623](https://github.com/vitejs/vite/issues/8623)
* feat: support async plugins (#8574) ([caa8a58](https://github.com/vitejs/vite/commit/caa8a58)), closes [#8574](https://github.com/vitejs/vite/issues/8574)
* feat: support cjs noExternal in SSR dev, fix #2579 (#8430) ([11d2191](https://github.com/vitejs/vite/commit/11d2191)), closes [#2579](https://github.com/vitejs/vite/issues/2579) [#8430](https://github.com/vitejs/vite/issues/8430)
* feat(dev): added assets to manifest (#6649) ([cdf744d](https://github.com/vitejs/vite/commit/cdf744d)), closes [#6649](https://github.com/vitejs/vite/issues/6649)
* fix: filter of BOM tags in json plugin (#8628) ([e10530b](https://github.com/vitejs/vite/commit/e10530b)), closes [#8628](https://github.com/vitejs/vite/issues/8628)
* fix: revert #5902, fix #8243 (#8654) ([1b820da](https://github.com/vitejs/vite/commit/1b820da)), closes [#8243](https://github.com/vitejs/vite/issues/8243) [#8654](https://github.com/vitejs/vite/issues/8654)
* fix(optimizer): use simple browser external shim in prod (#8630) ([a32c4ba](https://github.com/vitejs/vite/commit/a32c4ba)), closes [#8630](https://github.com/vitejs/vite/issues/8630)
* fix(server): skip localhost verbatim dns lookup (#8642) ([7632247](https://github.com/vitejs/vite/commit/7632247)), closes [#8642](https://github.com/vitejs/vite/issues/8642)
* fix(wasm): support inlined WASM in Node < v16 (fix #8620) (#8622) ([f586b14](https://github.com/vitejs/vite/commit/f586b14)), closes [#8620](https://github.com/vitejs/vite/issues/8620) [#8622](https://github.com/vitejs/vite/issues/8622)
* docs: improve wildcard host note (#8634) ([9a1c1ae](https://github.com/vitejs/vite/commit/9a1c1ae)), closes [#8634](https://github.com/vitejs/vite/issues/8634)
* feat!: appType (spa, mpa, custom), boolean middlewareMode (#8452) ([14db473](https://github.com/vitejs/vite/commit/14db473)), closes [#8452](https://github.com/vitejs/vite/issues/8452)
* refactor: rename `force` to `optimizeDeps.force` (#8418) ([f520a54](https://github.com/vitejs/vite/commit/f520a54)), closes [#8418](https://github.com/vitejs/vite/issues/8418)



## 3.0.0-alpha.12 (2022-06-16)

* release: v3.0.0-alpha.12 ([d402ad3](https://github.com/vitejs/vite/commit/d402ad3))
* chore: correct typo in console message (#8618) ([13d05bd](https://github.com/vitejs/vite/commit/13d05bd)), closes [#8618](https://github.com/vitejs/vite/issues/8618)
* chore: enable eslint and prettier cache (#8585) ([d7beaeb](https://github.com/vitejs/vite/commit/d7beaeb)), closes [#8585](https://github.com/vitejs/vite/issues/8585)
* chore: tweak server start output (#8582) ([3439132](https://github.com/vitejs/vite/commit/3439132)), closes [#8582](https://github.com/vitejs/vite/issues/8582)
* fix: allow cache overlap in parallel builds (#8592) ([2dd0b49](https://github.com/vitejs/vite/commit/2dd0b49)), closes [#8592](https://github.com/vitejs/vite/issues/8592)
* fix: avoid replacing defines and NODE_ENV in optimized deps (fix #8593) (#8606) ([739175b](https://github.com/vitejs/vite/commit/739175b)), closes [#8593](https://github.com/vitejs/vite/issues/8593) [#8606](https://github.com/vitejs/vite/issues/8606)
* fix: sequential injection of tags in transformIndexHtml (#5851) (#6901) ([649c7f6](https://github.com/vitejs/vite/commit/649c7f6)), closes [#5851](https://github.com/vitejs/vite/issues/5851) [#6901](https://github.com/vitejs/vite/issues/6901)
* fix(asset): respect assetFileNames if rollupOptions.output is an array (#8561) ([4e6c26f](https://github.com/vitejs/vite/commit/4e6c26f)), closes [#8561](https://github.com/vitejs/vite/issues/8561)
* fix(css): escape pattern chars from base path in postcss dir-dependency messages (#7081) ([5151e74](https://github.com/vitejs/vite/commit/5151e74)), closes [#7081](https://github.com/vitejs/vite/issues/7081)
* fix(optimizer): browser mapping for yarn pnp (#6493) ([c1c7af3](https://github.com/vitejs/vite/commit/c1c7af3)), closes [#6493](https://github.com/vitejs/vite/issues/6493)
* feat: 500 response if the node proxy request fails (#7398) ([73e1775](https://github.com/vitejs/vite/commit/73e1775)), closes [#7398](https://github.com/vitejs/vite/issues/7398)
* docs: worker related notes (#8554) ([c0c5e1a](https://github.com/vitejs/vite/commit/c0c5e1a)), closes [#8554](https://github.com/vitejs/vite/issues/8554)



## 3.0.0-alpha.11 (2022-06-14)

* release: v3.0.0-alpha.11 ([98ccc0b](https://github.com/vitejs/vite/commit/98ccc0b))
* fix: add missed JPEG file extensions to `KNOWN_ASSET_TYPES` (#8565) ([2dfc015](https://github.com/vitejs/vite/commit/2dfc015)), closes [#8565](https://github.com/vitejs/vite/issues/8565)
* fix: default export module transformation for vitest spy (#8567) ([d357e33](https://github.com/vitejs/vite/commit/d357e33)), closes [#8567](https://github.com/vitejs/vite/issues/8567)
* fix: default host to `localhost` instead of `127.0.0.1` (#8543) ([49c0896](https://github.com/vitejs/vite/commit/49c0896)), closes [#8543](https://github.com/vitejs/vite/issues/8543)
* fix: dont handle sigterm in middleware mode (#8550) ([c6f43dd](https://github.com/vitejs/vite/commit/c6f43dd)), closes [#8550](https://github.com/vitejs/vite/issues/8550)
* fix: mime missing extensions (#8568) ([acf3024](https://github.com/vitejs/vite/commit/acf3024)), closes [#8568](https://github.com/vitejs/vite/issues/8568)
* fix: objurl for type module, and concurrent tests (#8541) ([26ecd5a](https://github.com/vitejs/vite/commit/26ecd5a)), closes [#8541](https://github.com/vitejs/vite/issues/8541)
* fix: outdated optimized dep removed from module graph (#8533) ([3f4d22d](https://github.com/vitejs/vite/commit/3f4d22d)), closes [#8533](https://github.com/vitejs/vite/issues/8533)
* fix(config): only rewrite .js loader in `loadConfigFromBundledFile` (#8556) ([2548dd3](https://github.com/vitejs/vite/commit/2548dd3)), closes [#8556](https://github.com/vitejs/vite/issues/8556)
* fix(deps): update all non-major dependencies (#8558) ([9a1fd4c](https://github.com/vitejs/vite/commit/9a1fd4c)), closes [#8558](https://github.com/vitejs/vite/issues/8558)
* fix(ssr): dont replace rollup input (#7275) ([9a88afa](https://github.com/vitejs/vite/commit/9a88afa)), closes [#7275](https://github.com/vitejs/vite/issues/7275)
* chore: include 2.9.10-2.9.12 changelog in main (#8535) ([87f58ad](https://github.com/vitejs/vite/commit/87f58ad)), closes [#8535](https://github.com/vitejs/vite/issues/8535)
* chore: refactor interop named imports (#8544) ([63b523a](https://github.com/vitejs/vite/commit/63b523a)), closes [#8544](https://github.com/vitejs/vite/issues/8544)
* chore: remove rollup `namespaceToStringTag` (#8569) ([b85802a](https://github.com/vitejs/vite/commit/b85802a)), closes [#8569](https://github.com/vitejs/vite/issues/8569)
* chore: remove unused timestamp option (#8545) ([d641860](https://github.com/vitejs/vite/commit/d641860)), closes [#8545](https://github.com/vitejs/vite/issues/8545)
* chore: update major deps (#8572) ([0e20949](https://github.com/vitejs/vite/commit/0e20949)), closes [#8572](https://github.com/vitejs/vite/issues/8572)
* feat: expose createFilter util (#8562) ([c5c424a](https://github.com/vitejs/vite/commit/c5c424a)), closes [#8562](https://github.com/vitejs/vite/issues/8562)



## 3.0.0-alpha.10 (2022-06-10)

* release: v3.0.0-alpha.10 ([121a482](https://github.com/vitejs/vite/commit/121a482))
* fix: deps optimizer idle logic for workers (fix #8479) (#8511) ([1e05548](https://github.com/vitejs/vite/commit/1e05548)), closes [#8479](https://github.com/vitejs/vite/issues/8479) [#8511](https://github.com/vitejs/vite/issues/8511)
* fix: not match \n when injecting esbuild helpers (#8414) ([5a57626](https://github.com/vitejs/vite/commit/5a57626)), closes [#8414](https://github.com/vitejs/vite/issues/8414)
* fix: remove empty chunk css imports when using esnext (#8345) ([b3d9652](https://github.com/vitejs/vite/commit/b3d9652)), closes [#8345](https://github.com/vitejs/vite/issues/8345)
* fix: respect optimize deps entries (#8489) ([fba82d0](https://github.com/vitejs/vite/commit/fba82d0)), closes [#8489](https://github.com/vitejs/vite/issues/8489)
* fix: respect server.headers in static middlewares (#8481) ([408e5a7](https://github.com/vitejs/vite/commit/408e5a7)), closes [#8481](https://github.com/vitejs/vite/issues/8481)
* fix(dev): avoid FOUC when swapping out link tag (fix #7973) (#8495) ([0e5c009](https://github.com/vitejs/vite/commit/0e5c009)), closes [#7973](https://github.com/vitejs/vite/issues/7973) [#8495](https://github.com/vitejs/vite/issues/8495)
* fix(optimizer): encode `_` and `.` in different way (#8508) ([9065b37](https://github.com/vitejs/vite/commit/9065b37)), closes [#8508](https://github.com/vitejs/vite/issues/8508)
* fix(optimizer): external require-import conversion (fixes #2492, #3409) (#8459) ([1061bbd](https://github.com/vitejs/vite/commit/1061bbd)), closes [#2492](https://github.com/vitejs/vite/issues/2492) [#3409](https://github.com/vitejs/vite/issues/3409) [#8459](https://github.com/vitejs/vite/issues/8459)
* feat: better config `__dirname` support (#8442) ([51e9195](https://github.com/vitejs/vite/commit/51e9195)), closes [#8442](https://github.com/vitejs/vite/issues/8442)
* feat: expose `version` (#8456) ([e992594](https://github.com/vitejs/vite/commit/e992594)), closes [#8456](https://github.com/vitejs/vite/issues/8456)
* feat: handle named imports of builtin modules (#8338) ([e2e44ff](https://github.com/vitejs/vite/commit/e2e44ff)), closes [#8338](https://github.com/vitejs/vite/issues/8338)
* feat: preserve process env vars in lib build (#8090) ([908c9e4](https://github.com/vitejs/vite/commit/908c9e4)), closes [#8090](https://github.com/vitejs/vite/issues/8090)
* refactor!: make terser an optional dependency (#8049) ([164f528](https://github.com/vitejs/vite/commit/164f528)), closes [#8049](https://github.com/vitejs/vite/issues/8049)
* chore: generate vite sourcemap when not production (#8453) ([129b499](https://github.com/vitejs/vite/commit/129b499)), closes [#8453](https://github.com/vitejs/vite/issues/8453)
* chore: resolve ssr options (#8455) ([d97e402](https://github.com/vitejs/vite/commit/d97e402)), closes [#8455](https://github.com/vitejs/vite/issues/8455)
* chore(deps): update all non-major dependencies (#8474) ([6d0ede7](https://github.com/vitejs/vite/commit/6d0ede7)), closes [#8474](https://github.com/vitejs/vite/issues/8474)
* perf: disable postcss sourcemap when unused (#8451) ([64fc61c](https://github.com/vitejs/vite/commit/64fc61c)), closes [#8451](https://github.com/vitejs/vite/issues/8451)



## 3.0.0-alpha.9 (2022-06-01)

* release: v3.0.0-alpha.9 ([8a68fbd](https://github.com/vitejs/vite/commit/8a68fbd))
* fix: make array `acornInjectPlugins` work (fixes #8410) (#8415) ([08d594b](https://github.com/vitejs/vite/commit/08d594b)), closes [#8410](https://github.com/vitejs/vite/issues/8410) [#8415](https://github.com/vitejs/vite/issues/8415)
* fix: SSR deep imports externalization (fixes #8420) (#8421) ([89d6711](https://github.com/vitejs/vite/commit/89d6711)), closes [#8420](https://github.com/vitejs/vite/issues/8420) [#8421](https://github.com/vitejs/vite/issues/8421)
* chore: reapply #5930 (#8423) ([ab23e6e](https://github.com/vitejs/vite/commit/ab23e6e)), closes [#5930](https://github.com/vitejs/vite/issues/5930) [#8423](https://github.com/vitejs/vite/issues/8423)



## 3.0.0-alpha.8 (2022-05-31)

* release: v3.0.0-alpha.8 ([9af61b5](https://github.com/vitejs/vite/commit/9af61b5))
* feat: add ssr.format to force esm output for ssr (#6812) ([337b197](https://github.com/vitejs/vite/commit/337b197)), closes [#6812](https://github.com/vitejs/vite/issues/6812)
* feat: default esm SSR build, simplified externalization (#8348) ([f8c92d1](https://github.com/vitejs/vite/commit/f8c92d1)), closes [#8348](https://github.com/vitejs/vite/issues/8348)
* feat: derive proper js extension from package type (#8382) ([95cdd81](https://github.com/vitejs/vite/commit/95cdd81)), closes [#8382](https://github.com/vitejs/vite/issues/8382)
* feat: ssr build using optimized deps (#8403) ([6a5a5b5](https://github.com/vitejs/vite/commit/6a5a5b5)), closes [#8403](https://github.com/vitejs/vite/issues/8403)
* fix: `import.meta.accept()` -> `import.meta.hot.accept()` (#8361) ([c5185cf](https://github.com/vitejs/vite/commit/c5185cf)), closes [#8361](https://github.com/vitejs/vite/issues/8361)
* fix: return type of `handleHMRUpdate` (#8367) ([79d5ce1](https://github.com/vitejs/vite/commit/79d5ce1)), closes [#8367](https://github.com/vitejs/vite/issues/8367)
* fix: sourcemap source point to null (#8299) ([356b896](https://github.com/vitejs/vite/commit/356b896)), closes [#8299](https://github.com/vitejs/vite/issues/8299)
* fix: ssr-manifest no base (#8371) ([37eb5b3](https://github.com/vitejs/vite/commit/37eb5b3)), closes [#8371](https://github.com/vitejs/vite/issues/8371)
* fix(deps): update all non-major dependencies (#8391) ([842f995](https://github.com/vitejs/vite/commit/842f995)), closes [#8391](https://github.com/vitejs/vite/issues/8391)
* chore: enable `@typescript-eslint/explicit-module-boundary-types` (#8372) ([104caf9](https://github.com/vitejs/vite/commit/104caf9)), closes [#8372](https://github.com/vitejs/vite/issues/8372)
* chore: enable reportUnusedDisableDirectives (#8384) ([9a99bc4](https://github.com/vitejs/vite/commit/9a99bc4)), closes [#8384](https://github.com/vitejs/vite/issues/8384)
* chore: improve jsdoc of library options (#8381) ([44dc27d](https://github.com/vitejs/vite/commit/44dc27d)), closes [#8381](https://github.com/vitejs/vite/issues/8381)
* chore: improve public assets warning message (#6738) ([f6bd317](https://github.com/vitejs/vite/commit/f6bd317)), closes [#6738](https://github.com/vitejs/vite/issues/6738)
* chore: update comments (#8394) ([3d14372](https://github.com/vitejs/vite/commit/3d14372)), closes [#8394](https://github.com/vitejs/vite/issues/8394)



## 3.0.0-alpha.7 (2022-05-27)

* release: v3.0.0-alpha.7 ([eddb6fb](https://github.com/vitejs/vite/commit/eddb6fb))
* fix: preserve annotations during build deps optimization (#8358) ([334cd9f](https://github.com/vitejs/vite/commit/334cd9f)), closes [#8358](https://github.com/vitejs/vite/issues/8358)
* refactor: `ExportData.imports` to `ExportData.hasImports` (#8355) ([168de2d](https://github.com/vitejs/vite/commit/168de2d)), closes [#8355](https://github.com/vitejs/vite/issues/8355)



## 3.0.0-alpha.6 (2022-05-27)

* release: v3.0.0-alpha.6 ([a9ccedd](https://github.com/vitejs/vite/commit/a9ccedd))
* fix: missing types for `es-module-lexer` (fixes #8349) (#8352) ([df2cc3d](https://github.com/vitejs/vite/commit/df2cc3d)), closes [#8349](https://github.com/vitejs/vite/issues/8349) [#8352](https://github.com/vitejs/vite/issues/8352)
* fix(optimizer): transpile before calling `transformGlobImport` (#8343) ([1dbc7cc](https://github.com/vitejs/vite/commit/1dbc7cc)), closes [#8343](https://github.com/vitejs/vite/issues/8343)
* feat: scan free dev server (#8319) ([3f742b6](https://github.com/vitejs/vite/commit/3f742b6)), closes [#8319](https://github.com/vitejs/vite/issues/8319)
* chore: remove unused dts from dist (#8346) ([de9f556](https://github.com/vitejs/vite/commit/de9f556)), closes [#8346](https://github.com/vitejs/vite/issues/8346)



## 3.0.0-alpha.5 (2022-05-26)

* release: v3.0.0-alpha.5 ([2d73f98](https://github.com/vitejs/vite/commit/2d73f98))
* feat: non-blocking esbuild optimization at build time (#8280) ([909cf9c](https://github.com/vitejs/vite/commit/909cf9c)), closes [#8280](https://github.com/vitejs/vite/issues/8280)
* fix(deps): update all non-major dependencies (#8281) ([c68db4d](https://github.com/vitejs/vite/commit/c68db4d)), closes [#8281](https://github.com/vitejs/vite/issues/8281)



## 3.0.0-alpha.4 (2022-05-25)

* release: v3.0.0-alpha.4 ([7c950ca](https://github.com/vitejs/vite/commit/7c950ca))
* feat: non-blocking needs interop (#7568) ([531cd7b](https://github.com/vitejs/vite/commit/531cd7b)), closes [#7568](https://github.com/vitejs/vite/issues/7568)
* fix: expose client dist in `exports` (#8324) ([689adc0](https://github.com/vitejs/vite/commit/689adc0)), closes [#8324](https://github.com/vitejs/vite/issues/8324)



## 3.0.0-alpha.3 (2022-05-25)

* release: v3.0.0-alpha.3 ([90fe2fa](https://github.com/vitejs/vite/commit/90fe2fa))
* fix(cjs): build cjs for `loadEnv` (#8305) ([80dd2df](https://github.com/vitejs/vite/commit/80dd2df)), closes [#8305](https://github.com/vitejs/vite/issues/8305)
* refactor(cli): improve output aesthetics (#6997) ([809ab47](https://github.com/vitejs/vite/commit/809ab47)), closes [#6997](https://github.com/vitejs/vite/issues/6997)
* dx: sourcemap combine debug utils (#8307) ([45dba50](https://github.com/vitejs/vite/commit/45dba50)), closes [#8307](https://github.com/vitejs/vite/issues/8307)
* chore: cleanup now that we've dropped Node 12 (#8239) ([29659a0](https://github.com/vitejs/vite/commit/29659a0)), closes [#8239](https://github.com/vitejs/vite/issues/8239)
* chore: use `esno` to replace `ts-node` (#8162) ([c18a5f3](https://github.com/vitejs/vite/commit/c18a5f3)), closes [#8162](https://github.com/vitejs/vite/issues/8162)



## 3.0.0-alpha.2 (2022-05-23)

* release: v3.0.0-alpha.2 ([c1e0132](https://github.com/vitejs/vite/commit/c1e0132))
* fix: correctly replace process.env.NODE_ENV (#8283) ([ec52baa](https://github.com/vitejs/vite/commit/ec52baa)), closes [#8283](https://github.com/vitejs/vite/issues/8283)
* fix: dev sourcemap (#8269) ([505f75e](https://github.com/vitejs/vite/commit/505f75e)), closes [#8269](https://github.com/vitejs/vite/issues/8269)
* fix: EPERM error on Windows when processing dependencies (#8235) ([67743a3](https://github.com/vitejs/vite/commit/67743a3)), closes [#8235](https://github.com/vitejs/vite/issues/8235)
* fix: glob types (#8257) ([03b227e](https://github.com/vitejs/vite/commit/03b227e)), closes [#8257](https://github.com/vitejs/vite/issues/8257)
* fix: srcset handling in html (#6419) ([a0ee4ff](https://github.com/vitejs/vite/commit/a0ee4ff)), closes [#6419](https://github.com/vitejs/vite/issues/6419)
* fix: support set NODE_ENV in scripts when custom mode option (#8218) ([adcf041](https://github.com/vitejs/vite/commit/adcf041)), closes [#8218](https://github.com/vitejs/vite/issues/8218)
* fix(css): remove `?used` hack (fixes #6421, #8245) (#8278) ([0b25cc1](https://github.com/vitejs/vite/commit/0b25cc1)), closes [#6421](https://github.com/vitejs/vite/issues/6421) [#8245](https://github.com/vitejs/vite/issues/8245) [#8278](https://github.com/vitejs/vite/issues/8278)
* fix(hmr): catch thrown errors when connecting to hmr websocket (#7111) ([4bc9284](https://github.com/vitejs/vite/commit/4bc9284)), closes [#7111](https://github.com/vitejs/vite/issues/7111)
* fix(plugin-legacy): respect `entryFileNames` for polyfill chunks (#8247) ([baa9632](https://github.com/vitejs/vite/commit/baa9632)), closes [#8247](https://github.com/vitejs/vite/issues/8247)
* fix(plugin-react): broken optimized deps dir check (#8255) ([9e2a1ea](https://github.com/vitejs/vite/commit/9e2a1ea)), closes [#8255](https://github.com/vitejs/vite/issues/8255)
* chore: include 2.9.9 changelog in main (#8250) ([48f03e0](https://github.com/vitejs/vite/commit/48f03e0)), closes [#8250](https://github.com/vitejs/vite/issues/8250)
* chore: remove unneeded worker context param (#8268) ([30a7acc](https://github.com/vitejs/vite/commit/30a7acc)), closes [#8268](https://github.com/vitejs/vite/issues/8268)
* chore: show ws port conflict error (#8209) ([c86329b](https://github.com/vitejs/vite/commit/c86329b)), closes [#8209](https://github.com/vitejs/vite/issues/8209)
* chore: use 'new URL' instead of 'url.parse' (#8254) ([d98c8a7](https://github.com/vitejs/vite/commit/d98c8a7)), closes [#8254](https://github.com/vitejs/vite/issues/8254)
* chore: use typescript for rollup configPlugin (#8290) ([fa538cf](https://github.com/vitejs/vite/commit/fa538cf)), closes [#8290](https://github.com/vitejs/vite/issues/8290)
* feat: sourcemap for importAnalysis (#8258) ([a4e4d39](https://github.com/vitejs/vite/commit/a4e4d39)), closes [#8258](https://github.com/vitejs/vite/issues/8258)
* feat: spa option, `preview` and `dev` for MPA and SSR apps (#8217) ([d7cba46](https://github.com/vitejs/vite/commit/d7cba46)), closes [#8217](https://github.com/vitejs/vite/issues/8217)
* feat: vite connected logs changed to console.debug (#7733) ([9f00c41](https://github.com/vitejs/vite/commit/9f00c41)), closes [#7733](https://github.com/vitejs/vite/issues/7733)
* feat: worker support query url (#7914) ([95297dd](https://github.com/vitejs/vite/commit/95297dd)), closes [#7914](https://github.com/vitejs/vite/issues/7914)
* feat(wasm): new wasm plugin (`.wasm?init`) (#8219) ([75c3bf6](https://github.com/vitejs/vite/commit/75c3bf6)), closes [#8219](https://github.com/vitejs/vite/issues/8219)
* build!: bump targets (#8045) ([66efd69](https://github.com/vitejs/vite/commit/66efd69)), closes [#8045](https://github.com/vitejs/vite/issues/8045)
* feat!: migrate to ESM (#8178) ([76fdc27](https://github.com/vitejs/vite/commit/76fdc27)), closes [#8178](https://github.com/vitejs/vite/issues/8178)
* fix!: do not fixStacktrace by default (#7995) ([23f8e08](https://github.com/vitejs/vite/commit/23f8e08)), closes [#7995](https://github.com/vitejs/vite/issues/7995)



## 3.0.0-alpha.1 (2022-05-18)

* release: v3.0.0-alpha.1 ([9df59ed](https://github.com/vitejs/vite/commit/9df59ed))
* feat!: relative base (#7644) ([09648c2](https://github.com/vitejs/vite/commit/09648c2)), closes [#7644](https://github.com/vitejs/vite/issues/7644)
* chore: enable `import/no-duplicates` eslint rule (#8199) ([11243de](https://github.com/vitejs/vite/commit/11243de)), closes [#8199](https://github.com/vitejs/vite/issues/8199)
* feat(css): warn if url rewrite has no importer (#8183) ([0858450](https://github.com/vitejs/vite/commit/0858450)), closes [#8183](https://github.com/vitejs/vite/issues/8183)
* fix(glob): properly handles tailing comma (#8181) ([462be8e](https://github.com/vitejs/vite/commit/462be8e)), closes [#8181](https://github.com/vitejs/vite/issues/8181)



## 3.0.0-alpha.0 (2022-05-13)

* release: v3.0.0-alpha.0 ([1780a8a](https://github.com/vitejs/vite/commit/1780a8a))
* feat: allow any JS identifier in define, not ASCII-only (#5972) ([95eb45b](https://github.com/vitejs/vite/commit/95eb45b)), closes [#5972](https://github.com/vitejs/vite/issues/5972)
* feat: enable `generatedCode: 'es2015'` for rollup build (#5018) ([46d5e67](https://github.com/vitejs/vite/commit/46d5e67)), closes [#5018](https://github.com/vitejs/vite/issues/5018)
* feat: new hook `configurePreviewServer` (#7658) ([20ea999](https://github.com/vitejs/vite/commit/20ea999)), closes [#7658](https://github.com/vitejs/vite/issues/7658)
* feat: rework `dynamic-import-vars` (#7756) ([80d113b](https://github.com/vitejs/vite/commit/80d113b)), closes [#7756](https://github.com/vitejs/vite/issues/7756)
* feat: treat Astro file scripts as TS (#8151) ([559c952](https://github.com/vitejs/vite/commit/559c952)), closes [#8151](https://github.com/vitejs/vite/issues/8151)
* feat: worker emit fileName with config (#7804) ([04c2edd](https://github.com/vitejs/vite/commit/04c2edd)), closes [#7804](https://github.com/vitejs/vite/issues/7804)
* feat(glob-import): support `{ import: '*' }` (#8071) ([0b78b2a](https://github.com/vitejs/vite/commit/0b78b2a)), closes [#8071](https://github.com/vitejs/vite/issues/8071)
* fix: add direct query to html-proxy css (fixes #8091) (#8094) ([54a941a](https://github.com/vitejs/vite/commit/54a941a)), closes [#8091](https://github.com/vitejs/vite/issues/8091) [#8094](https://github.com/vitejs/vite/issues/8094)
* fix: add hash to lib chunk names (#7190) ([c81cedf](https://github.com/vitejs/vite/commit/c81cedf)), closes [#7190](https://github.com/vitejs/vite/issues/7190)
* fix: allow css to be written for systemjs output (#5902) ([780b4f5](https://github.com/vitejs/vite/commit/780b4f5)), closes [#5902](https://github.com/vitejs/vite/issues/5902)
* fix: client full reload (#8018) ([2f478ed](https://github.com/vitejs/vite/commit/2f478ed)), closes [#8018](https://github.com/vitejs/vite/issues/8018)
* fix: graceful rename in windows (#8036) ([fe704f1](https://github.com/vitejs/vite/commit/fe704f1)), closes [#8036](https://github.com/vitejs/vite/issues/8036)
* fix: handle optimize failure (#8006) ([ba95a2a](https://github.com/vitejs/vite/commit/ba95a2a)), closes [#8006](https://github.com/vitejs/vite/issues/8006)
* fix: image-set with base64 images (fix #8028) (#8035) ([e10c0c1](https://github.com/vitejs/vite/commit/e10c0c1)), closes [#8028](https://github.com/vitejs/vite/issues/8028) [#8035](https://github.com/vitejs/vite/issues/8035)
* fix: increase default HTTPS dev server session memory limit (#6207) ([f895f94](https://github.com/vitejs/vite/commit/f895f94)), closes [#6207](https://github.com/vitejs/vite/issues/6207)
* fix: invalidate ssrError when HMR update occurs (#8052) ([c7356e0](https://github.com/vitejs/vite/commit/c7356e0)), closes [#8052](https://github.com/vitejs/vite/issues/8052)
* fix: relative path html (#8122) ([d0deac0](https://github.com/vitejs/vite/commit/d0deac0)), closes [#8122](https://github.com/vitejs/vite/issues/8122)
* fix: Remove ssrError when invalidating a module (#8124) ([a543220](https://github.com/vitejs/vite/commit/a543220)), closes [#8124](https://github.com/vitejs/vite/issues/8124)
* fix: remove useless `/__vite_ping` handler (#8133) ([d607b2b](https://github.com/vitejs/vite/commit/d607b2b)), closes [#8133](https://github.com/vitejs/vite/issues/8133)
* fix: typo in #8121 (#8143) ([c32e3ac](https://github.com/vitejs/vite/commit/c32e3ac)), closes [#8121](https://github.com/vitejs/vite/issues/8121) [#8143](https://github.com/vitejs/vite/issues/8143)
* fix: use `strip-literal` to strip string lterals (#8054) ([1ffc010](https://github.com/vitejs/vite/commit/1ffc010)), closes [#8054](https://github.com/vitejs/vite/issues/8054)
* fix: use Vitest for unit testing, clean regex bug (#8040) ([63cd53d](https://github.com/vitejs/vite/commit/63cd53d)), closes [#8040](https://github.com/vitejs/vite/issues/8040)
* fix: Vite cannot load configuration files in the link directory (#4180) (#4181) ([a3fa1a3](https://github.com/vitejs/vite/commit/a3fa1a3)), closes [#4180](https://github.com/vitejs/vite/issues/4180) [#4181](https://github.com/vitejs/vite/issues/4181)
* fix: vite client types (#7877) ([0e67fe8](https://github.com/vitejs/vite/commit/0e67fe8)), closes [#7877](https://github.com/vitejs/vite/issues/7877)
* fix: warn for unresolved css in html (#7911) ([2b58cb3](https://github.com/vitejs/vite/commit/2b58cb3)), closes [#7911](https://github.com/vitejs/vite/issues/7911)
* fix(build): use crossorigin for module preloaded ([85cab70](https://github.com/vitejs/vite/commit/85cab70))
* fix(client): wait on the socket host, not the ping host (#6819) ([ae56e47](https://github.com/vitejs/vite/commit/ae56e47)), closes [#6819](https://github.com/vitejs/vite/issues/6819)
* fix(css): hoist external @import for non-split css (#8022) ([5280908](https://github.com/vitejs/vite/commit/5280908)), closes [#8022](https://github.com/vitejs/vite/issues/8022)
* fix(css): preserve dynamic import css code (fix #5348) (#7746) ([12d0cc0](https://github.com/vitejs/vite/commit/12d0cc0)), closes [#5348](https://github.com/vitejs/vite/issues/5348) [#7746](https://github.com/vitejs/vite/issues/7746)
* fix(glob): wrap glob compile output in function invocation (#3682) ([bb603d3](https://github.com/vitejs/vite/commit/bb603d3)), closes [#3682](https://github.com/vitejs/vite/issues/3682)
* fix(lib): enable inlineDynamicImports for umd and iife (#8126) ([272a252](https://github.com/vitejs/vite/commit/272a252)), closes [#8126](https://github.com/vitejs/vite/issues/8126)
* fix(lib): use proper extension (#6827) ([34df307](https://github.com/vitejs/vite/commit/34df307)), closes [#6827](https://github.com/vitejs/vite/issues/6827)
* fix(ssr): avoid transforming json file in ssrTransform (#6597) ([a709440](https://github.com/vitejs/vite/commit/a709440)), closes [#6597](https://github.com/vitejs/vite/issues/6597)
* chore: add note about assets to importAnalysis.ts (#6278) ([05e71d5](https://github.com/vitejs/vite/commit/05e71d5)), closes [#6278](https://github.com/vitejs/vite/issues/6278)
* chore: bump minors and rebuild lock (#8074) ([aeb5b74](https://github.com/vitejs/vite/commit/aeb5b74)), closes [#8074](https://github.com/vitejs/vite/issues/8074)
* chore: fix repeated error message (#8153) ([63ec05a](https://github.com/vitejs/vite/commit/63ec05a)), closes [#8153](https://github.com/vitejs/vite/issues/8153)
* chore: move playground to root (#8072) ([875fc11](https://github.com/vitejs/vite/commit/875fc11)), closes [#8072](https://github.com/vitejs/vite/issues/8072)
* chore: reduce the usage of require (#8121) ([67ff257](https://github.com/vitejs/vite/commit/67ff257)), closes [#8121](https://github.com/vitejs/vite/issues/8121)
* chore: remove noop watch close (#6294) ([5484c8c](https://github.com/vitejs/vite/commit/5484c8c)), closes [#6294](https://github.com/vitejs/vite/issues/6294)
* chore: revert vitejs/vite#8152 (#8161) ([85b8b55](https://github.com/vitejs/vite/commit/85b8b55)), closes [vitejs/vite#8152](https://github.com/vitejs/vite/issues/8152) [#8161](https://github.com/vitejs/vite/issues/8161)
* chore: stabilize experimental api (#7707) ([b902932](https://github.com/vitejs/vite/commit/b902932)), closes [#7707](https://github.com/vitejs/vite/issues/7707)
* chore: upgrade to pnpm v7 (#8041) ([50f8f3b](https://github.com/vitejs/vite/commit/50f8f3b)), closes [#8041](https://github.com/vitejs/vite/issues/8041)
* chore: use `unbuild` to bundle plugins (#8139) ([638b168](https://github.com/vitejs/vite/commit/638b168)), closes [#8139](https://github.com/vitejs/vite/issues/8139)
* chore: use isScannable in optimizer scan (#7641) ([f18eedf](https://github.com/vitejs/vite/commit/f18eedf)), closes [#7641](https://github.com/vitejs/vite/issues/7641)
* chore: using Unicode instead of unicode in doc and tests (#6852) ([c2bf62b](https://github.com/vitejs/vite/commit/c2bf62b)), closes [#6852](https://github.com/vitejs/vite/issues/6852)
* chore(deps): update tsconfck to 2.0.0 built for node14+ (#8144) ([0513d13](https://github.com/vitejs/vite/commit/0513d13)), closes [#8144](https://github.com/vitejs/vite/issues/8144)
* chore(deps): use `esno` to replace `ts-node` (#8152) ([2363bd3](https://github.com/vitejs/vite/commit/2363bd3)), closes [#8152](https://github.com/vitejs/vite/issues/8152)
* chore(lint): sort for imports (#8113) ([43a58dd](https://github.com/vitejs/vite/commit/43a58dd)), closes [#8113](https://github.com/vitejs/vite/issues/8113)
* build!: remove node v12 support (#7833) ([eeac2d2](https://github.com/vitejs/vite/commit/eeac2d2)), closes [#7833](https://github.com/vitejs/vite/issues/7833)
* feat!: rework `import.meta.glob` (#7537) ([330e0a9](https://github.com/vitejs/vite/commit/330e0a9)), closes [#7537](https://github.com/vitejs/vite/issues/7537)
* feat!: vite dev default port is now 5173 (#8148) ([1cc2e2d](https://github.com/vitejs/vite/commit/1cc2e2d)), closes [#8148](https://github.com/vitejs/vite/issues/8148)
* fix(lib)!: remove format prefixes for cjs and esm (#8107) ([ad8c3b1](https://github.com/vitejs/vite/commit/ad8c3b1)), closes [#8107](https://github.com/vitejs/vite/issues/8107)
* refactor: remove deprecated api for 3.0 (#5868) ([b5c3709](https://github.com/vitejs/vite/commit/b5c3709)), closes [#5868](https://github.com/vitejs/vite/issues/5868)
* refactor: use `import.meta.glob` over `globEager` in tests (#8066) ([1878f46](https://github.com/vitejs/vite/commit/1878f46)), closes [#8066](https://github.com/vitejs/vite/issues/8066)
* refactor: use node hash (#7975) ([5ce7c74](https://github.com/vitejs/vite/commit/5ce7c74)), closes [#7975](https://github.com/vitejs/vite/issues/7975)
* perf(lib): reduce backtrack when injecting esbuild helpers (#8110) ([b993c5f](https://github.com/vitejs/vite/commit/b993c5f)), closes [#8110](https://github.com/vitejs/vite/issues/8110)
* test: migrate to vitest (#8076) ([8148f67](https://github.com/vitejs/vite/commit/8148f67)), closes [#8076](https://github.com/vitejs/vite/issues/8076)



## <small>2.9.8 (2022-05-04)</small>

* release: v2.9.8 ([77865b4](https://github.com/vitejs/vite/commit/77865b4))
* fix: inline js and css paths for virtual html (#7993) ([d49e3fb](https://github.com/vitejs/vite/commit/d49e3fb)), closes [#7993](https://github.com/vitejs/vite/issues/7993)
* fix: only handle merge ssr.noExternal (#8003) ([642d65b](https://github.com/vitejs/vite/commit/642d65b)), closes [#8003](https://github.com/vitejs/vite/issues/8003)
* fix: optimized processing folder renaming in win (fix #7939) (#8019) ([e5fe1c6](https://github.com/vitejs/vite/commit/e5fe1c6)), closes [#7939](https://github.com/vitejs/vite/issues/7939) [#8019](https://github.com/vitejs/vite/issues/8019)
* fix(css): do not clean id when passing to postcss (fix #7822) (#7827) ([72f17f8](https://github.com/vitejs/vite/commit/72f17f8)), closes [#7822](https://github.com/vitejs/vite/issues/7822) [#7827](https://github.com/vitejs/vite/issues/7827)
* fix(css): var in image-set (#7921) ([e96b908](https://github.com/vitejs/vite/commit/e96b908)), closes [#7921](https://github.com/vitejs/vite/issues/7921)
* fix(ssr): allow ssrTransform to parse hashbang (#8005) ([6420ba0](https://github.com/vitejs/vite/commit/6420ba0)), closes [#8005](https://github.com/vitejs/vite/issues/8005)
* feat: import ts with .js in vue (#7998) ([9974094](https://github.com/vitejs/vite/commit/9974094)), closes [#7998](https://github.com/vitejs/vite/issues/7998)
* chore: remove maybeVirtualHtmlSet (#8010) ([e85164e](https://github.com/vitejs/vite/commit/e85164e)), closes [#8010](https://github.com/vitejs/vite/issues/8010)



## <small>2.9.7 (2022-05-02)</small>

* release: v2.9.7 ([dde774f](https://github.com/vitejs/vite/commit/dde774f))
* chore: update license ([d58c030](https://github.com/vitejs/vite/commit/d58c030))
* chore(css): catch postcss config error (fix #2793) (#7934) ([7f535ac](https://github.com/vitejs/vite/commit/7f535ac)), closes [#2793](https://github.com/vitejs/vite/issues/2793) [#7934](https://github.com/vitejs/vite/issues/7934)
* chore(deps): update all non-major dependencies (#7949) ([b877d30](https://github.com/vitejs/vite/commit/b877d30)), closes [#7949](https://github.com/vitejs/vite/issues/7949)
* fix: inject esbuild helpers in IIFE and UMD wrappers (#7948) ([f7d2d71](https://github.com/vitejs/vite/commit/f7d2d71)), closes [#7948](https://github.com/vitejs/vite/issues/7948)
* fix: inline css hash (#7974) ([f6ae60d](https://github.com/vitejs/vite/commit/f6ae60d)), closes [#7974](https://github.com/vitejs/vite/issues/7974)
* fix: inline style hmr, transform style code inplace (#7869) ([a30a548](https://github.com/vitejs/vite/commit/a30a548)), closes [#7869](https://github.com/vitejs/vite/issues/7869)
* fix: use NODE_ENV in optimizer (#7673) ([50672e4](https://github.com/vitejs/vite/commit/50672e4)), closes [#7673](https://github.com/vitejs/vite/issues/7673)
* fix(css): clean comments before hoist at rules (#7924) ([e48827f](https://github.com/vitejs/vite/commit/e48827f)), closes [#7924](https://github.com/vitejs/vite/issues/7924)
* fix(css): dynamic import css in package fetches removed js (fixes #7955, #6823) (#7969) ([025eebf](https://github.com/vitejs/vite/commit/025eebf)), closes [#7955](https://github.com/vitejs/vite/issues/7955) [#6823](https://github.com/vitejs/vite/issues/6823) [#7969](https://github.com/vitejs/vite/issues/7969)
* fix(css): inline css module when ssr, minify issue (fix #5471) (#7807) ([cf8a48a](https://github.com/vitejs/vite/commit/cf8a48a)), closes [#5471](https://github.com/vitejs/vite/issues/5471) [#7807](https://github.com/vitejs/vite/issues/7807)
* fix(css): sourcemap crash with postcss (#7982) ([7f9f8f1](https://github.com/vitejs/vite/commit/7f9f8f1)), closes [#7982](https://github.com/vitejs/vite/issues/7982)
* fix(css): support postcss.config.ts (#7935) ([274c10e](https://github.com/vitejs/vite/commit/274c10e)), closes [#7935](https://github.com/vitejs/vite/issues/7935)
* fix(ssr): failed ssrLoadModule call throws same error (#7177) ([891e7fc](https://github.com/vitejs/vite/commit/891e7fc)), closes [#7177](https://github.com/vitejs/vite/issues/7177)
* fix(worker): import.meta.* (#7706) ([b092697](https://github.com/vitejs/vite/commit/b092697)), closes [#7706](https://github.com/vitejs/vite/issues/7706)
* docs: `server.origin` config trailing slash (fix #6622) (#7865) ([5c1ee5a](https://github.com/vitejs/vite/commit/5c1ee5a)), closes [#6622](https://github.com/vitejs/vite/issues/6622) [#7865](https://github.com/vitejs/vite/issues/7865)



## <small>2.9.6 (2022-04-26)</small>

* release: v2.9.6 ([ef903d6](https://github.com/vitejs/vite/commit/ef903d6))
* fix: `apply` condition skipped for nested plugins (#7741) ([1f2ca53](https://github.com/vitejs/vite/commit/1f2ca53)), closes [#7741](https://github.com/vitejs/vite/issues/7741)
* fix: clean string regexp (#7871) ([ecc78bc](https://github.com/vitejs/vite/commit/ecc78bc)), closes [#7871](https://github.com/vitejs/vite/issues/7871)
* fix: escape character in string regexp match (#7834) ([1d468c8](https://github.com/vitejs/vite/commit/1d468c8)), closes [#7834](https://github.com/vitejs/vite/issues/7834)
* fix: HMR propagation of HTML changes (fix #7870) (#7895) ([1f7855c](https://github.com/vitejs/vite/commit/1f7855c)), closes [#7870](https://github.com/vitejs/vite/issues/7870) [#7895](https://github.com/vitejs/vite/issues/7895)
* fix: modulepreload polyfill only during build (fix #4786) (#7816) ([709776f](https://github.com/vitejs/vite/commit/709776f)), closes [#4786](https://github.com/vitejs/vite/issues/4786) [#7816](https://github.com/vitejs/vite/issues/7816)
* fix: new SharedWorker syntax (#7800) ([474d5c2](https://github.com/vitejs/vite/commit/474d5c2)), closes [#7800](https://github.com/vitejs/vite/issues/7800)
* fix: node v18 support (#7812) ([fc89057](https://github.com/vitejs/vite/commit/fc89057)), closes [#7812](https://github.com/vitejs/vite/issues/7812)
* fix: preview jsdoc params (#7903) ([e474381](https://github.com/vitejs/vite/commit/e474381)), closes [#7903](https://github.com/vitejs/vite/issues/7903)
* fix: replace import.meta.url correctly (#7792) ([12d1194](https://github.com/vitejs/vite/commit/12d1194)), closes [#7792](https://github.com/vitejs/vite/issues/7792)
* fix: set `isSelfAccepting` to `false` for any asset not processed by importAnalysis (#7898) ([0d2089c](https://github.com/vitejs/vite/commit/0d2089c)), closes [#7898](https://github.com/vitejs/vite/issues/7898)
* fix: spelling mistakes (#7883) ([54728e3](https://github.com/vitejs/vite/commit/54728e3)), closes [#7883](https://github.com/vitejs/vite/issues/7883)
* fix: ssr.noExternal with boolean values (#7813) ([0b2d307](https://github.com/vitejs/vite/commit/0b2d307)), closes [#7813](https://github.com/vitejs/vite/issues/7813)
* fix: style use string instead of js import (#7786) ([ba43c29](https://github.com/vitejs/vite/commit/ba43c29)), closes [#7786](https://github.com/vitejs/vite/issues/7786)
* fix: update sourcemap in importAnalysisBuild (#7825) ([d7540c8](https://github.com/vitejs/vite/commit/d7540c8)), closes [#7825](https://github.com/vitejs/vite/issues/7825)
* fix(ssr): rewrite dynamic class method name (fix #7751) (#7757) ([b89974a](https://github.com/vitejs/vite/commit/b89974a)), closes [#7751](https://github.com/vitejs/vite/issues/7751) [#7757](https://github.com/vitejs/vite/issues/7757)
* chore: code structure (#7790) ([5f7fe00](https://github.com/vitejs/vite/commit/5f7fe00)), closes [#7790](https://github.com/vitejs/vite/issues/7790)
* chore: fix worker sourcemap output style (#7805) ([17f3be7](https://github.com/vitejs/vite/commit/17f3be7)), closes [#7805](https://github.com/vitejs/vite/issues/7805)
* chore(deps): update all non-major dependencies (#7780) ([eba9d05](https://github.com/vitejs/vite/commit/eba9d05)), closes [#7780](https://github.com/vitejs/vite/issues/7780)
* chore(deps): update all non-major dependencies (#7847) ([e29d1d9](https://github.com/vitejs/vite/commit/e29d1d9)), closes [#7847](https://github.com/vitejs/vite/issues/7847)
* feat: enable optimizeDeps.esbuildOptions.loader (#6840) ([af8ca60](https://github.com/vitejs/vite/commit/af8ca60)), closes [#6840](https://github.com/vitejs/vite/issues/6840)



## <small>2.9.5 (2022-04-14)</small>

* release: v2.9.5 ([5d96dca](https://github.com/vitejs/vite/commit/5d96dca))
* fix: revert #7582, fix #7721 and #7736 (#7737) ([fa86d69](https://github.com/vitejs/vite/commit/fa86d69)), closes [#7721](https://github.com/vitejs/vite/issues/7721) [#7736](https://github.com/vitejs/vite/issues/7736) [#7737](https://github.com/vitejs/vite/issues/7737)
* chore: format css minify esbuild error (#7731) ([c445075](https://github.com/vitejs/vite/commit/c445075)), closes [#7731](https://github.com/vitejs/vite/issues/7731)



## <small>2.9.4 (2022-04-13)</small>

* release: v2.9.4 ([6c27f14](https://github.com/vitejs/vite/commit/6c27f14))
* fix: handle url imports with semicolon (fix #7717) (#7718) ([a5c2a78](https://github.com/vitejs/vite/commit/a5c2a78)), closes [#7717](https://github.com/vitejs/vite/issues/7717) [#7718](https://github.com/vitejs/vite/issues/7718)



## <small>2.9.3 (2022-04-13)</small>

* release: v2.9.3 ([cb5c3f9](https://github.com/vitejs/vite/commit/cb5c3f9))
* fix: revert #7665 (#7716) ([26862c4](https://github.com/vitejs/vite/commit/26862c4)), closes [#7665](https://github.com/vitejs/vite/issues/7665) [#7716](https://github.com/vitejs/vite/issues/7716)



## <small>2.9.2 (2022-04-13)</small>

* release: v2.9.2 ([f699afb](https://github.com/vitejs/vite/commit/f699afb))
* fix: `$ vite preview` 404 handling (#7665) ([66b6dc5](https://github.com/vitejs/vite/commit/66b6dc5)), closes [#7665](https://github.com/vitejs/vite/issues/7665)
* fix: build should also respect esbuild=false config (#7602) ([2dc0e80](https://github.com/vitejs/vite/commit/2dc0e80)), closes [#7602](https://github.com/vitejs/vite/issues/7602)
* fix: default value of assetsDir option (#7703) ([83d32d9](https://github.com/vitejs/vite/commit/83d32d9)), closes [#7703](https://github.com/vitejs/vite/issues/7703)
* fix: detect env hmr (#7595) ([212d454](https://github.com/vitejs/vite/commit/212d454)), closes [#7595](https://github.com/vitejs/vite/issues/7595)
* fix: EACCES permission denied due to resolve new paths default (#7612) ([1dd019f](https://github.com/vitejs/vite/commit/1dd019f)), closes [#7612](https://github.com/vitejs/vite/issues/7612)
* fix: fix HMR propagation when imports not analyzed (#7561) ([57e7914](https://github.com/vitejs/vite/commit/57e7914)), closes [#7561](https://github.com/vitejs/vite/issues/7561)
* fix: nested comments and strings, new regexp utils (#7650) ([93900f0](https://github.com/vitejs/vite/commit/93900f0)), closes [#7650](https://github.com/vitejs/vite/issues/7650)
* fix: revert optimizeDeps false, keep optimizedDeps.disabled (#7715) ([ba9a1ff](https://github.com/vitejs/vite/commit/ba9a1ff)), closes [#7715](https://github.com/vitejs/vite/issues/7715)
* fix: update watch mode (#7132) ([9ed1672](https://github.com/vitejs/vite/commit/9ed1672)), closes [#7132](https://github.com/vitejs/vite/issues/7132)
* fix: update ws types (#7605) ([b620587](https://github.com/vitejs/vite/commit/b620587)), closes [#7605](https://github.com/vitejs/vite/issues/7605)
* fix: use correct proxy config in preview (#7604) ([cf59005](https://github.com/vitejs/vite/commit/cf59005)), closes [#7604](https://github.com/vitejs/vite/issues/7604)
* fix(css): hoist charset (#7678) ([29e622c](https://github.com/vitejs/vite/commit/29e622c)), closes [#7678](https://github.com/vitejs/vite/issues/7678)
* fix(css): include inline css module in bundle (#7591) ([45b9273](https://github.com/vitejs/vite/commit/45b9273)), closes [#7591](https://github.com/vitejs/vite/issues/7591)
* fix(deps): update all non-major dependencies (#7668) ([485263c](https://github.com/vitejs/vite/commit/485263c)), closes [#7668](https://github.com/vitejs/vite/issues/7668)
* fix(less): handles rewriting relative paths passed Less's `data-uri` function. (#7400) ([08e39b7](https://github.com/vitejs/vite/commit/08e39b7)), closes [#7400](https://github.com/vitejs/vite/issues/7400)
* fix(resolver): skip known ESM entries when resolving a `require` call  (#7582) ([5d6ea8e](https://github.com/vitejs/vite/commit/5d6ea8e)), closes [#7582](https://github.com/vitejs/vite/issues/7582)
* fix(ssr): properly transform export default with expressions (#7705) ([d6830e3](https://github.com/vitejs/vite/commit/d6830e3)), closes [#7705](https://github.com/vitejs/vite/issues/7705)
* feat: clean string module lex string template (#7667) ([dfce283](https://github.com/vitejs/vite/commit/dfce283)), closes [#7667](https://github.com/vitejs/vite/issues/7667)
* feat: explicit the word boundary (#6876) ([7ddbf96](https://github.com/vitejs/vite/commit/7ddbf96)), closes [#6876](https://github.com/vitejs/vite/issues/6876)
* feat: optimizeDeps.disabled (#7646) ([48e038c](https://github.com/vitejs/vite/commit/48e038c)), closes [#7646](https://github.com/vitejs/vite/issues/7646)
* chore: fix term cases (#7553) ([c296130](https://github.com/vitejs/vite/commit/c296130)), closes [#7553](https://github.com/vitejs/vite/issues/7553)
* chore: revert removed line in #7698 ([7e6a2c8](https://github.com/vitejs/vite/commit/7e6a2c8)), closes [#7698](https://github.com/vitejs/vite/issues/7698)
* chore: type unknown env as any (#7702) ([23fdef1](https://github.com/vitejs/vite/commit/23fdef1)), closes [#7702](https://github.com/vitejs/vite/issues/7702)
* chore(deps): update all non-major dependencies (#7603) ([fc51a15](https://github.com/vitejs/vite/commit/fc51a15)), closes [#7603](https://github.com/vitejs/vite/issues/7603)
* perf(css): hoist at rules with regex (#7691) ([8858180](https://github.com/vitejs/vite/commit/8858180)), closes [#7691](https://github.com/vitejs/vite/issues/7691)
* refactor: esbuild handles `target` and `useDefineForClassFields` (#7698) ([0c928aa](https://github.com/vitejs/vite/commit/0c928aa)), closes [#7698](https://github.com/vitejs/vite/issues/7698)
* docs: update release notes (#7563) ([a74bd7b](https://github.com/vitejs/vite/commit/a74bd7b)), closes [#7563](https://github.com/vitejs/vite/issues/7563)



## <small>2.9.1 (2022-03-31)</small>

* release: v2.9.1 ([a3b9f4c](https://github.com/vitejs/vite/commit/a3b9f4c))
* fix: allow port 0 to be provided to server (#7530) ([173e4c9](https://github.com/vitejs/vite/commit/173e4c9)), closes [#7530](https://github.com/vitejs/vite/issues/7530)
* fix: brotli let for reassignment (#7544) ([d0253d7](https://github.com/vitejs/vite/commit/d0253d7)), closes [#7544](https://github.com/vitejs/vite/issues/7544)
* fix: dynamic import warning with @vite-ignore (#7533) ([29c1ec0](https://github.com/vitejs/vite/commit/29c1ec0)), closes [#7533](https://github.com/vitejs/vite/issues/7533)
* fix: remove unneeded skipping optimization log (#7531) ([41fa2f5](https://github.com/vitejs/vite/commit/41fa2f5)), closes [#7531](https://github.com/vitejs/vite/issues/7531)
* docs(changelog): fix raw glob imports syntax (#7540) ([87fbe13](https://github.com/vitejs/vite/commit/87fbe13)), closes [#7540](https://github.com/vitejs/vite/issues/7540)
* chore: 2.9 release notes (#7525) ([4324f48](https://github.com/vitejs/vite/commit/4324f48)), closes [#7525](https://github.com/vitejs/vite/issues/7525)



## 2.9.0 (2022-03-30)

* release: v2.9.0 ([997e735](https://github.com/vitejs/vite/commit/997e735))
* fix: revert #7463 and #6624 (#7522) ([8efc6a6](https://github.com/vitejs/vite/commit/8efc6a6)), closes [#7463](https://github.com/vitejs/vite/issues/7463) [#6624](https://github.com/vitejs/vite/issues/6624) [#7522](https://github.com/vitejs/vite/issues/7522)
* chore: typo (#7520) ([4fda42f](https://github.com/vitejs/vite/commit/4fda42f)), closes [#7520](https://github.com/vitejs/vite/issues/7520)



## 2.9.0-beta.11 (2022-03-29)

* release: v2.9.0-beta.11 ([a0f82bd](https://github.com/vitejs/vite/commit/a0f82bd))
* feat(worker): Add sourcemap support for worker bundles (#5417) ([465b6b9](https://github.com/vitejs/vite/commit/465b6b9)), closes [#5417](https://github.com/vitejs/vite/issues/5417)
* fix: build path error on Windows (#7383) ([e3c7c7a](https://github.com/vitejs/vite/commit/e3c7c7a)), closes [#7383](https://github.com/vitejs/vite/issues/7383)
* fix: import url worker two times (#7468) ([f05a813](https://github.com/vitejs/vite/commit/f05a813)), closes [#7468](https://github.com/vitejs/vite/issues/7468)
* fix: import with query with exports/browser field (#7098) ([9ce6732](https://github.com/vitejs/vite/commit/9ce6732)), closes [#7098](https://github.com/vitejs/vite/issues/7098)
* fix: infer client port from page location (#7463) ([93ae8e5](https://github.com/vitejs/vite/commit/93ae8e5)), closes [#7463](https://github.com/vitejs/vite/issues/7463)
* fix: make @fs URLs work with special characters (#7510) ([2b7dad1](https://github.com/vitejs/vite/commit/2b7dad1)), closes [#7510](https://github.com/vitejs/vite/issues/7510)
* fix: tailwind css sourcemap warning (#7480) ([90df0bb](https://github.com/vitejs/vite/commit/90df0bb)), closes [#7480](https://github.com/vitejs/vite/issues/7480)
* fix: worker match only run in js (#7500) ([9481c7d](https://github.com/vitejs/vite/commit/9481c7d)), closes [#7500](https://github.com/vitejs/vite/issues/7500)



## 2.9.0-beta.10 (2022-03-28)

* release: v2.9.0-beta.10 ([4ffd82d](https://github.com/vitejs/vite/commit/4ffd82d))
* fix: Correctly process urls when they are rewritten to contain space (#7452) ([9ee2cf6](https://github.com/vitejs/vite/commit/9ee2cf6)), closes [#7452](https://github.com/vitejs/vite/issues/7452)
* fix: custom event payload type (#7498) ([28b0660](https://github.com/vitejs/vite/commit/28b0660)), closes [#7498](https://github.com/vitejs/vite/issues/7498)
* fix: handle relative path glob raw import, fix #7307 (#7371) ([7f8dc58](https://github.com/vitejs/vite/commit/7f8dc58)), closes [#7307](https://github.com/vitejs/vite/issues/7307) [#7371](https://github.com/vitejs/vite/issues/7371)
* fix: import.meta.url in worker (#7464) ([8ac4b12](https://github.com/vitejs/vite/commit/8ac4b12)), closes [#7464](https://github.com/vitejs/vite/issues/7464)
* fix: optimizeDeps.entries default ignore paths (#7469) ([4c95e99](https://github.com/vitejs/vite/commit/4c95e99)), closes [#7469](https://github.com/vitejs/vite/issues/7469)
* chore(deps): update all non-major dependencies (#7490) ([42c15f6](https://github.com/vitejs/vite/commit/42c15f6)), closes [#7490](https://github.com/vitejs/vite/issues/7490)
* feat(type): support typing for custom events (#7476) ([50a8765](https://github.com/vitejs/vite/commit/50a8765)), closes [#7476](https://github.com/vitejs/vite/issues/7476)
* refactor(types): share hot context type (#7475) ([64ddff0](https://github.com/vitejs/vite/commit/64ddff0)), closes [#7475](https://github.com/vitejs/vite/issues/7475)



## 2.9.0-beta.9 (2022-03-26)

* release: v2.9.0-beta.9 ([dd33d9c](https://github.com/vitejs/vite/commit/dd33d9c))
* feat: support importing css with ?raw (#5796) ([fedb106](https://github.com/vitejs/vite/commit/fedb106)), closes [#5796](https://github.com/vitejs/vite/issues/5796)
* feat(css): css.devSourcemap option (#7471) ([57f14cb](https://github.com/vitejs/vite/commit/57f14cb)), closes [#7471](https://github.com/vitejs/vite/issues/7471)
* feat(dev): expose APIs for client-server communication (#7437) ([e29ea8e](https://github.com/vitejs/vite/commit/e29ea8e)), closes [#7437](https://github.com/vitejs/vite/issues/7437)
* fix: errors in worker handling (#7236) ([77dc1a1](https://github.com/vitejs/vite/commit/77dc1a1)), closes [#7236](https://github.com/vitejs/vite/issues/7236)



## 2.9.0-beta.8 (2022-03-24)

* release: v2.9.0-beta.8 ([d649dab](https://github.com/vitejs/vite/commit/d649dab))
* fix: consider undefined port when checking port (#7318) ([c7fc7c3](https://github.com/vitejs/vite/commit/c7fc7c3)), closes [#7318](https://github.com/vitejs/vite/issues/7318)
* fix: inline style css sourcemap (#7434) ([47668b5](https://github.com/vitejs/vite/commit/47668b5)), closes [#7434](https://github.com/vitejs/vite/issues/7434)
* fix: sourcemap missing source files warning with cached vue (#7442) ([a2ce20d](https://github.com/vitejs/vite/commit/a2ce20d)), closes [#7442](https://github.com/vitejs/vite/issues/7442)
* fix: update tsconfck to 1.2.1 (#7424) ([a90b03b](https://github.com/vitejs/vite/commit/a90b03b)), closes [#7424](https://github.com/vitejs/vite/issues/7424)
* fix: virtual html sourcemap warning (#7440) ([476786b](https://github.com/vitejs/vite/commit/476786b)), closes [#7440](https://github.com/vitejs/vite/issues/7440)
* fix(less): empty less file error (#7412) ([0535c70](https://github.com/vitejs/vite/commit/0535c70)), closes [#7412](https://github.com/vitejs/vite/issues/7412)
* fix(resolve): skip `module` field when the importer is a `require` call (#7438) ([fe4c1ed](https://github.com/vitejs/vite/commit/fe4c1ed)), closes [#7438](https://github.com/vitejs/vite/issues/7438)
* feat: hide optimized deps found during scan phase logs (#7419) ([f4934e8](https://github.com/vitejs/vite/commit/f4934e8)), closes [#7419](https://github.com/vitejs/vite/issues/7419)



## 2.9.0-beta.7 (2022-03-23)

* release: v2.9.0-beta.7 ([4538e59](https://github.com/vitejs/vite/commit/4538e59))
* feat: non-blocking scanning of dependencies (#7379) ([676f545](https://github.com/vitejs/vite/commit/676f545)), closes [#7379](https://github.com/vitejs/vite/issues/7379)



## 2.9.0-beta.6 (2022-03-22)

* release: v2.9.0-beta.6 ([c650f0f](https://github.com/vitejs/vite/commit/c650f0f))



## 2.9.0-beta.5 (2022-03-22)

* release: v2.9.0-beta.5 ([d9e39f2](https://github.com/vitejs/vite/commit/d9e39f2))
* fix: avoid mangling code from incorrect magic-string usage (#7397) ([68d76c9](https://github.com/vitejs/vite/commit/68d76c9)), closes [#7397](https://github.com/vitejs/vite/issues/7397)
* fix(config): server restart on config dependencies changed on windows (#7366) ([c43467a](https://github.com/vitejs/vite/commit/c43467a)), closes [#7366](https://github.com/vitejs/vite/issues/7366)
* fix(deps): update all non-major dependencies (#7392) ([b63fc3b](https://github.com/vitejs/vite/commit/b63fc3b)), closes [#7392](https://github.com/vitejs/vite/issues/7392)
* feat: css sourcemap support during dev (#7173) ([38a655f](https://github.com/vitejs/vite/commit/38a655f)), closes [#7173](https://github.com/vitejs/vite/issues/7173)



## 2.9.0-beta.4 (2022-03-19)

* release: v2.9.0-beta.4 ([9a7b133](https://github.com/vitejs/vite/commit/9a7b133))
* fix: add version to optimized chunks, fix #7323 (#7350) ([1be1db6](https://github.com/vitejs/vite/commit/1be1db6)), closes [#7323](https://github.com/vitejs/vite/issues/7323) [#7350](https://github.com/vitejs/vite/issues/7350)
* fix: browser cache of newly discovered deps (#7378) ([392a0de](https://github.com/vitejs/vite/commit/392a0de)), closes [#7378](https://github.com/vitejs/vite/issues/7378)
* fix: do not warn (about not being able to bundle non module scripts) when src is an external url (#7 ([0646fe8](https://github.com/vitejs/vite/commit/0646fe8)), closes [#7380](https://github.com/vitejs/vite/issues/7380)
* fix: overwrite deps info browserHash only on commit (#7359) ([1e9615d](https://github.com/vitejs/vite/commit/1e9615d)), closes [#7359](https://github.com/vitejs/vite/issues/7359)
* chore: fix typo in comment (#7370) ([e682863](https://github.com/vitejs/vite/commit/e682863)), closes [#7370](https://github.com/vitejs/vite/issues/7370)
* chore: update es-module-lexer (#7357) ([fde0f3c](https://github.com/vitejs/vite/commit/fde0f3c)), closes [#7357](https://github.com/vitejs/vite/issues/7357)
* chore(deps): update all non-major dependencies (#6905) ([839665c](https://github.com/vitejs/vite/commit/839665c)), closes [#6905](https://github.com/vitejs/vite/issues/6905)



## 2.9.0-beta.3 (2022-03-16)

* release: v2.9.0-beta.3 ([560fc4d](https://github.com/vitejs/vite/commit/560fc4d))
* fix: delayed full page reload (#7347) ([fa0820a](https://github.com/vitejs/vite/commit/fa0820a)), closes [#7347](https://github.com/vitejs/vite/issues/7347)
* fix: early discovery of missing deps, fix #7333 (#7346) ([7d2f37c](https://github.com/vitejs/vite/commit/7d2f37c)), closes [#7333](https://github.com/vitejs/vite/issues/7333) [#7346](https://github.com/vitejs/vite/issues/7346)
* fix: unhandled exception on eager transformRequest (#7345) ([c3260a4](https://github.com/vitejs/vite/commit/c3260a4)), closes [#7345](https://github.com/vitejs/vite/issues/7345)
* fix: update to esbuild 0.14.27, fix #6994 (#7320) ([65aaeee](https://github.com/vitejs/vite/commit/65aaeee)), closes [#6994](https://github.com/vitejs/vite/issues/6994) [#7320](https://github.com/vitejs/vite/issues/7320)
* chore: comment typo (#7344) ([61df324](https://github.com/vitejs/vite/commit/61df324)), closes [#7344](https://github.com/vitejs/vite/issues/7344)



## 2.9.0-beta.2 (2022-03-14)

* release: v2.9.0-beta.2 ([0b66901](https://github.com/vitejs/vite/commit/0b66901))
* fix: `ssrExternal` should not skip nested dependencies (#7154) ([f8f934a](https://github.com/vitejs/vite/commit/f8f934a)), closes [#7154](https://github.com/vitejs/vite/issues/7154)
* fix: dep with dynamic import wrong error log (#7313) ([769f535](https://github.com/vitejs/vite/commit/769f535)), closes [#7313](https://github.com/vitejs/vite/issues/7313)



## 2.9.0-beta.1 (2022-03-14)

* release: v2.9.0-beta.1 ([a8dda1b](https://github.com/vitejs/vite/commit/a8dda1b))
* fix: avoid caching transform result of invalidated module (#7254) ([2d7ba72](https://github.com/vitejs/vite/commit/2d7ba72)), closes [#7254](https://github.com/vitejs/vite/issues/7254)
* fix: dont replace define in json (#7294) ([fc5c937](https://github.com/vitejs/vite/commit/fc5c937)), closes [#7294](https://github.com/vitejs/vite/issues/7294)
* fix: main browserHash after stable optimization rerun (#7284) ([98eefa8](https://github.com/vitejs/vite/commit/98eefa8)), closes [#7284](https://github.com/vitejs/vite/issues/7284)
* fix: needs es interop check for newly discovered deps (#7243) ([ba3047d](https://github.com/vitejs/vite/commit/ba3047d)), closes [#7243](https://github.com/vitejs/vite/issues/7243)
* fix: pending requests after module invalidation (#7283) ([a1044d7](https://github.com/vitejs/vite/commit/a1044d7)), closes [#7283](https://github.com/vitejs/vite/issues/7283)
* fix: use browserHash for imports from node_modules (#7278) ([161f8ea](https://github.com/vitejs/vite/commit/161f8ea)), closes [#7278](https://github.com/vitejs/vite/issues/7278)
* fix: use hmr port if specified (#7282) ([3ee04c0](https://github.com/vitejs/vite/commit/3ee04c0)), closes [#7282](https://github.com/vitejs/vite/issues/7282)
* fix: use relative paths in _metadata.json (#7299) ([8b945f5](https://github.com/vitejs/vite/commit/8b945f5)), closes [#7299](https://github.com/vitejs/vite/issues/7299)
* fix(asset): allow non-existent url (#7306) ([6bc45a2](https://github.com/vitejs/vite/commit/6bc45a2)), closes [#7306](https://github.com/vitejs/vite/issues/7306)
* fix(hmr): hmr style tag no support in html (#7262) ([fae120a](https://github.com/vitejs/vite/commit/fae120a)), closes [#7262](https://github.com/vitejs/vite/issues/7262)
* chore: clarify writableEnded guard comment (#7256) ([dddda1e](https://github.com/vitejs/vite/commit/dddda1e)), closes [#7256](https://github.com/vitejs/vite/issues/7256)
* chore: new line for non-existent url (#7308) ([522faf8](https://github.com/vitejs/vite/commit/522faf8)), closes [#7308](https://github.com/vitejs/vite/issues/7308)
* chore: remove unused code (#7303) ([467512b](https://github.com/vitejs/vite/commit/467512b)), closes [#7303](https://github.com/vitejs/vite/issues/7303)
* feat: expose ssrRewriteStacktrace (#7091) ([d4ae45d](https://github.com/vitejs/vite/commit/d4ae45d)), closes [#7091](https://github.com/vitejs/vite/issues/7091)



## 2.9.0-beta.0 (2022-03-09)

* release: v2.9.0-beta.0 ([2351d79](https://github.com/vitejs/vite/commit/2351d79))
* fix: `import.meta.url` should not throw (#7219) ([5de3a98](https://github.com/vitejs/vite/commit/5de3a98)), closes [#7219](https://github.com/vitejs/vite/issues/7219)
* fix: allow `localhost` as a valid hostname (#7092) ([4194cce](https://github.com/vitejs/vite/commit/4194cce)), closes [#7092](https://github.com/vitejs/vite/issues/7092)
* fix: build optimize deps metada location (#7214) ([dc46adf](https://github.com/vitejs/vite/commit/dc46adf)), closes [#7214](https://github.com/vitejs/vite/issues/7214)
* fix: define plugin not ignore file names (#6340) ([7215a03](https://github.com/vitejs/vite/commit/7215a03)), closes [#6340](https://github.com/vitejs/vite/issues/6340)
* fix: deprecate `{ assert: { type: raw }}` in favor of `{ as: raw }` (fix #7017) (#7215) ([87ecce5](https://github.com/vitejs/vite/commit/87ecce5)), closes [#7017](https://github.com/vitejs/vite/issues/7017) [#7215](https://github.com/vitejs/vite/issues/7215)
* fix: execute classic worker in dev mode (#7099) ([3c0a609](https://github.com/vitejs/vite/commit/3c0a609)), closes [#7099](https://github.com/vitejs/vite/issues/7099)
* fix: handle files with multiple comments (#7202) ([3f5b645](https://github.com/vitejs/vite/commit/3f5b645)), closes [#7202](https://github.com/vitejs/vite/issues/7202)
* fix: honor the host param when creating a websocket server (#5617) ([882c8a8](https://github.com/vitejs/vite/commit/882c8a8)), closes [#5617](https://github.com/vitejs/vite/issues/5617)
* fix: import css in less/scss (fix 3293) (#7147) ([9b51a3a](https://github.com/vitejs/vite/commit/9b51a3a)), closes [#7147](https://github.com/vitejs/vite/issues/7147)
* fix: optimizeDeps.include missing in known imports fallback (#7218) ([6c08c86](https://github.com/vitejs/vite/commit/6c08c86)), closes [#7218](https://github.com/vitejs/vite/issues/7218)
* fix: prevent loading env outside of root (#6995) ([e0a4d81](https://github.com/vitejs/vite/commit/e0a4d81)), closes [#6995](https://github.com/vitejs/vite/issues/6995)
* fix: reoptimize deps on esbuild options change (#6855) ([4517c2b](https://github.com/vitejs/vite/commit/4517c2b)), closes [#6855](https://github.com/vitejs/vite/issues/6855)
* fix: replacing compression with modern version (#6557) ([5648d09](https://github.com/vitejs/vite/commit/5648d09)), closes [#6557](https://github.com/vitejs/vite/issues/6557)
* fix: restart optimize (#7004) ([47fbe29](https://github.com/vitejs/vite/commit/47fbe29)), closes [#7004](https://github.com/vitejs/vite/issues/7004)
* fix: reusing variable names in html module scripts (fix #6851) (#6818) ([c46b56d](https://github.com/vitejs/vite/commit/c46b56d)), closes [#6851](https://github.com/vitejs/vite/issues/6851) [#6818](https://github.com/vitejs/vite/issues/6818)
* fix: revert #6340, definePlugin tests, warning box (#7174) ([6cb0647](https://github.com/vitejs/vite/commit/6cb0647)), closes [#6340](https://github.com/vitejs/vite/issues/6340) [#7174](https://github.com/vitejs/vite/issues/7174)
* fix: update postcss-load-config to load PostCSS plugins based on their config file path (#6856) ([f02f961](https://github.com/vitejs/vite/commit/f02f961)), closes [#6856](https://github.com/vitejs/vite/issues/6856)
* fix(hmr): client pinging behind a proxy on websocket disconnect (fix #4501) (#5466) ([96573db](https://github.com/vitejs/vite/commit/96573db)), closes [#4501](https://github.com/vitejs/vite/issues/4501) [#5466](https://github.com/vitejs/vite/issues/5466)
* fix(html): build mode ignore html define transform (#6663) ([79dd003](https://github.com/vitejs/vite/commit/79dd003)), closes [#6663](https://github.com/vitejs/vite/issues/6663)
* fix(json): load json module error (#6352) ([c8a7ea8](https://github.com/vitejs/vite/commit/c8a7ea8)), closes [#6352](https://github.com/vitejs/vite/issues/6352)
* fix(optimizer): add missing keys to hash (#7189) ([b0c0efe](https://github.com/vitejs/vite/commit/b0c0efe)), closes [#7189](https://github.com/vitejs/vite/issues/7189)
* fix(resolve): try .tsx extension for .js import from typescript module (#7005) ([72b8cb6](https://github.com/vitejs/vite/commit/72b8cb6)), closes [#7005](https://github.com/vitejs/vite/issues/7005)
* fix(server): base middleware redirect with search and hash (#6574) ([a516e85](https://github.com/vitejs/vite/commit/a516e85)), closes [#6574](https://github.com/vitejs/vite/issues/6574)
* fix(server): ensure consistency for url to file mapping in importAnalysis and static middleware (#65 ([b214115](https://github.com/vitejs/vite/commit/b214115)), closes [#6518](https://github.com/vitejs/vite/issues/6518)
* fix(ssr): bypass missing resolve error in SSR (#7164) ([a4927c5](https://github.com/vitejs/vite/commit/a4927c5)), closes [#7164](https://github.com/vitejs/vite/issues/7164)
* chore: replace SourceMapConsumer with trace-mapping (#6746) ([ed4d191](https://github.com/vitejs/vite/commit/ed4d191)), closes [#6746](https://github.com/vitejs/vite/issues/6746)
* feat: add `importedCss` and `importedAssets` to RenderedChunk type (#6629) ([8d0fc90](https://github.com/vitejs/vite/commit/8d0fc90)), closes [#6629](https://github.com/vitejs/vite/issues/6629)
* feat: non-blocking pre bundling of dependencies (#6758) ([24bb3e4](https://github.com/vitejs/vite/commit/24bb3e4)), closes [#6758](https://github.com/vitejs/vite/issues/6758)
* feat: optimize custom extensions (#6801) ([c11af23](https://github.com/vitejs/vite/commit/c11af23)), closes [#6801](https://github.com/vitejs/vite/issues/6801)
* feat: show all prebundle deps when debug (#6726) ([e626055](https://github.com/vitejs/vite/commit/e626055)), closes [#6726](https://github.com/vitejs/vite/issues/6726)
* feat(config): hmr add disable port config (#6624) ([ce07a0a](https://github.com/vitejs/vite/commit/ce07a0a)), closes [#6624](https://github.com/vitejs/vite/issues/6624)
* feat(glob): import.meta.glob support alias path (#6526) ([86882ad](https://github.com/vitejs/vite/commit/86882ad)), closes [#6526](https://github.com/vitejs/vite/issues/6526)
* feat(perf): tsconfck perf improvement (#7055) ([993ea39](https://github.com/vitejs/vite/commit/993ea39)), closes [#7055](https://github.com/vitejs/vite/issues/7055)
* feat(worker): bundle worker emit asset file (#6599) ([0ade335](https://github.com/vitejs/vite/commit/0ade335)), closes [#6599](https://github.com/vitejs/vite/issues/6599)
* refactor: avoid splitting vendor chunk by default (#6534) ([849e845](https://github.com/vitejs/vite/commit/849e845)), closes [#6534](https://github.com/vitejs/vite/issues/6534)



## <small>2.8.6 (2022-03-01)</small>

* release: v2.8.6 ([110212e](https://github.com/vitejs/vite/commit/110212e))
* fix: revert #7052, hmr style tag no support in html (#7136) ([5c116ec](https://github.com/vitejs/vite/commit/5c116ec)), closes [#7052](https://github.com/vitejs/vite/issues/7052) [#7136](https://github.com/vitejs/vite/issues/7136)
* fix: throw Error when can't preload CSS (#7108) ([d9f8edb](https://github.com/vitejs/vite/commit/d9f8edb)), closes [#7108](https://github.com/vitejs/vite/issues/7108)



## <small>2.8.5 (2022-02-28)</small>

* release: v2.8.5 ([22a0381](https://github.com/vitejs/vite/commit/22a0381))
* fix: ?html-proxy with trailing = added by some servers (#7093) ([5818ac9](https://github.com/vitejs/vite/commit/5818ac9)), closes [#7093](https://github.com/vitejs/vite/issues/7093)
* fix: allow optional trailing comma in asset `import.meta.url` (#6983) ([2debb9f](https://github.com/vitejs/vite/commit/2debb9f)), closes [#6983](https://github.com/vitejs/vite/issues/6983)
* fix: cannot reassign process.env.NODE_ENV in ssr (#6989) ([983feb2](https://github.com/vitejs/vite/commit/983feb2)), closes [#6989](https://github.com/vitejs/vite/issues/6989)
* fix: don't override user config (#7034) ([8fd8f6e](https://github.com/vitejs/vite/commit/8fd8f6e)), closes [#7034](https://github.com/vitejs/vite/issues/7034)
* fix: fileToBuiltUrl got undefined when file type is `.ico` (#7106) ([7a1a552](https://github.com/vitejs/vite/commit/7a1a552)), closes [#7106](https://github.com/vitejs/vite/issues/7106)
* fix: image -> image/x-icon (#7120) ([065ceca](https://github.com/vitejs/vite/commit/065ceca)), closes [#7120](https://github.com/vitejs/vite/issues/7120)
* fix: import with query with exports field (#7073) ([88ded7f](https://github.com/vitejs/vite/commit/88ded7f)), closes [#7073](https://github.com/vitejs/vite/issues/7073)
* fix: prebundle dep with colon (#7006) ([2136f2b](https://github.com/vitejs/vite/commit/2136f2b)), closes [#7006](https://github.com/vitejs/vite/issues/7006)
* fix: recycle serve to avoid preventing Node self-exit (#6895) ([d6b2c53](https://github.com/vitejs/vite/commit/d6b2c53)), closes [#6895](https://github.com/vitejs/vite/issues/6895)
* fix: resolve @import of the proxied <style> (#7031) ([c7aad02](https://github.com/vitejs/vite/commit/c7aad02)), closes [#7031](https://github.com/vitejs/vite/issues/7031)
* fix: typo (#7064) ([f38654f](https://github.com/vitejs/vite/commit/f38654f)), closes [#7064](https://github.com/vitejs/vite/issues/7064)
* fix(config): Warn about terserOptions in more cases (#7101) ([79428ad](https://github.com/vitejs/vite/commit/79428ad)), closes [#7101](https://github.com/vitejs/vite/issues/7101)
* fix(glob): css imports injecting a ?used query to export the css string (#6949) ([0b3f4ef](https://github.com/vitejs/vite/commit/0b3f4ef)), closes [#6949](https://github.com/vitejs/vite/issues/6949)
* fix(hmr): hmr style tag no support in html (#7052) ([a9dfce3](https://github.com/vitejs/vite/commit/a9dfce3)), closes [#7052](https://github.com/vitejs/vite/issues/7052)
* fix(ssrTransform): use appendLeft instead of appendRight (#6407) ([3012541](https://github.com/vitejs/vite/commit/3012541)), closes [#6407](https://github.com/vitejs/vite/issues/6407)
* feat: add fixStacktrace option to ssrLoadModule (#7048) ([c703a33](https://github.com/vitejs/vite/commit/c703a33)), closes [#7048](https://github.com/vitejs/vite/issues/7048)
* feat(cli): add command descriptions (#6991) ([ffda8f0](https://github.com/vitejs/vite/commit/ffda8f0)), closes [#6991](https://github.com/vitejs/vite/issues/6991)
* chore(types): use more reasonable ts checking annotation comment (#7063) ([745ae2f](https://github.com/vitejs/vite/commit/745ae2f)), closes [#7063](https://github.com/vitejs/vite/issues/7063)



## <small>2.8.4 (2022-02-18)</small>

* release: v2.8.4 ([b146007](https://github.com/vitejs/vite/commit/b146007))
* fix: don't replace NODE_ENV in vite:client-inject (#6935) ([2b70003](https://github.com/vitejs/vite/commit/2b70003)), closes [#6935](https://github.com/vitejs/vite/issues/6935)
* fix: normalize postcss dependency messages (#6959) ([3f3f473](https://github.com/vitejs/vite/commit/3f3f473)), closes [#6959](https://github.com/vitejs/vite/issues/6959)
* fix: revert #6935, bypass replacing process.env.NODE_ENV in ssr (#6970) ([b8218b0](https://github.com/vitejs/vite/commit/b8218b0)), closes [#6935](https://github.com/vitejs/vite/issues/6935) [#6970](https://github.com/vitejs/vite/issues/6970)
* docs: add backticks (#6945) ([e234956](https://github.com/vitejs/vite/commit/e234956)), closes [#6945](https://github.com/vitejs/vite/issues/6945)



## <small>2.8.3 (2022-02-15)</small>

* release: v2.8.3 ([ac9652b](https://github.com/vitejs/vite/commit/ac9652b))
* fix: revert update dotenv-expand #6703, fix #6858 (#6934) ([a9a1ae2](https://github.com/vitejs/vite/commit/a9a1ae2)), closes [#6858](https://github.com/vitejs/vite/issues/6858) [#6934](https://github.com/vitejs/vite/issues/6934)
* chore: prefer using nullish-coalescing over or logic operator (#6790) ([0e58e72](https://github.com/vitejs/vite/commit/0e58e72)), closes [#6790](https://github.com/vitejs/vite/issues/6790)



## <small>2.8.2 (2022-02-14)</small>

* release: v2.8.2 ([e8c840a](https://github.com/vitejs/vite/commit/e8c840a))
* feat: custom manifest file name (#6667) ([e385346](https://github.com/vitejs/vite/commit/e385346)), closes [#6667](https://github.com/vitejs/vite/issues/6667)
* feat: make `import.meta.glob` and `import.meta.globEager` generic (#5073) ([78e84c8](https://github.com/vitejs/vite/commit/78e84c8)), closes [#5073](https://github.com/vitejs/vite/issues/5073)
* perf: improve isFileReadable performance (#6868) ([62cbe68](https://github.com/vitejs/vite/commit/62cbe68)), closes [#6868](https://github.com/vitejs/vite/issues/6868)
* perf: lazy import preview function (#6898) ([2eabcb9](https://github.com/vitejs/vite/commit/2eabcb9)), closes [#6898](https://github.com/vitejs/vite/issues/6898)
* workflow: separate version bumping and publishing on release (#6879) ([fe8ef39](https://github.com/vitejs/vite/commit/fe8ef39)), closes [#6879](https://github.com/vitejs/vite/issues/6879)



## <small>2.8.1 (2022-02-11)</small>

* release: v2.8.1 ([b984397](https://github.com/vitejs/vite/commit/b984397))
* chore: build signatures (#6841) ([0941620](https://github.com/vitejs/vite/commit/0941620)), closes [#6841](https://github.com/vitejs/vite/issues/6841)
* chore: correct 2.8 beta changelog link ([3949d21](https://github.com/vitejs/vite/commit/3949d21))
* chore: correct changelog size note ([12ff293](https://github.com/vitejs/vite/commit/12ff293))
* chore: rework v2.8.0 changelog and add release notes (#6825) ([8e92aa7](https://github.com/vitejs/vite/commit/8e92aa7)), closes [#6825](https://github.com/vitejs/vite/issues/6825)
* chore(deps): update dependency @ampproject/remapping to v2 (#6690) ([7a2ddb4](https://github.com/vitejs/vite/commit/7a2ddb4)), closes [#6690](https://github.com/vitejs/vite/issues/6690)
* chore(types): remove unnecessary type assertion (#6784) ([a3a9941](https://github.com/vitejs/vite/commit/a3a9941)), closes [#6784](https://github.com/vitejs/vite/issues/6784)
* fix(deps): update all non-major dependencies (#6782) ([e38be3e](https://github.com/vitejs/vite/commit/e38be3e)), closes [#6782](https://github.com/vitejs/vite/issues/6782)
* fix(scan): escape for virtual modules (#6863) ([de20c73](https://github.com/vitejs/vite/commit/de20c73)), closes [#6863](https://github.com/vitejs/vite/issues/6863)
* docs: change worker config to object instead of array (#6844) ([2c02ce7](https://github.com/vitejs/vite/commit/2c02ce7)), closes [#6844](https://github.com/vitejs/vite/issues/6844)



## 2.8.0 (2022-02-09)

* release: v2.8.0 ([d4886ea](https://github.com/vitejs/vite/commit/d4886ea))



## 2.8.0-beta.7 (2022-02-08)

* release: v2.8.0-beta.7 ([b79fec9](https://github.com/vitejs/vite/commit/b79fec9))
* fix: revert #6233, strip query when resolving entry (fix #6797) ([a012644](https://github.com/vitejs/vite/commit/a012644)), closes [#6797](https://github.com/vitejs/vite/issues/6797)



## 2.8.0-beta.6 (2022-02-07)

* release: v2.8.0-beta.6 ([651e0ba](https://github.com/vitejs/vite/commit/651e0ba))
* chore: explain why `new CSSStyleSheet` feature detection is disabled (#6774) ([5306234](https://github.com/vitejs/vite/commit/5306234)), closes [#6774](https://github.com/vitejs/vite/issues/6774)
* chore: prefer using weakmap over writing field on nodes (#6788) ([4a883a4](https://github.com/vitejs/vite/commit/4a883a4)), closes [#6788](https://github.com/vitejs/vite/issues/6788)
* fix(ssr): skip vite resolve for windows absolute path (#6764) ([489a7f1](https://github.com/vitejs/vite/commit/489a7f1)), closes [#6764](https://github.com/vitejs/vite/issues/6764)



## 2.8.0-beta.5 (2022-02-02)

* release: v2.8.0-beta.5 ([6409747](https://github.com/vitejs/vite/commit/6409747))
* fix: revert #5342, only run build-html plugin on bundler inputs (#6715) ([59f8a63](https://github.com/vitejs/vite/commit/59f8a63)), closes [#5342](https://github.com/vitejs/vite/issues/5342) [#6715](https://github.com/vitejs/vite/issues/6715)
* chore(deps): update all non-major dependencies (#6357) ([a272c07](https://github.com/vitejs/vite/commit/a272c07)), closes [#6357](https://github.com/vitejs/vite/issues/6357)
* chore(deps): update chokidar (#6701) ([dc2d1f8](https://github.com/vitejs/vite/commit/dc2d1f8)), closes [#6701](https://github.com/vitejs/vite/issues/6701)
* chore(deps): update dotenv-expand (#6703) ([0b819e2](https://github.com/vitejs/vite/commit/0b819e2)), closes [#6703](https://github.com/vitejs/vite/issues/6703)
* chore(deps): update esbuild to 0.14.14 in vite package (#6702) ([eb4d4cd](https://github.com/vitejs/vite/commit/eb4d4cd)), closes [#6702](https://github.com/vitejs/vite/issues/6702)



## 2.8.0-beta.4 (2022-01-31)

* release: v2.8.0-beta.4 ([29405c3](https://github.com/vitejs/vite/commit/29405c3))
* fix: debug `dotenv` when specifically scoped (#6682) ([c2f0021](https://github.com/vitejs/vite/commit/c2f0021)), closes [#6682](https://github.com/vitejs/vite/issues/6682)
* fix: revert #5601 #6025, don't resolve rollupOptions.input (#6680) ([2a9da2e](https://github.com/vitejs/vite/commit/2a9da2e)), closes [#6680](https://github.com/vitejs/vite/issues/6680)
* fix: update SSR externals only when SSR is enabled (fix #6478) (#6492) ([28d1e7e](https://github.com/vitejs/vite/commit/28d1e7e)), closes [#6478](https://github.com/vitejs/vite/issues/6478) [#6492](https://github.com/vitejs/vite/issues/6492)
* fix(build): NODE_ENV override by .env (#6303) ([7329b24](https://github.com/vitejs/vite/commit/7329b24)), closes [#6303](https://github.com/vitejs/vite/issues/6303)
* fix(dev): prevent stripping query params from CSS in HMR (#6589) ([3ab96c6](https://github.com/vitejs/vite/commit/3ab96c6)), closes [#6589](https://github.com/vitejs/vite/issues/6589)
* fix(legacy): fix conflict with the modern build on css emitting (#6584) ([f48255e](https://github.com/vitejs/vite/commit/f48255e)), closes [#6584](https://github.com/vitejs/vite/issues/6584) [#3296](https://github.com/vitejs/vite/issues/3296) [#3317](https://github.com/vitejs/vite/issues/3317) [/github.com/vitejs/vite/commit/6bce1081991501f3779bff1a81e5dd1e63e5d38e#diff-2cfbd4f4d8c32727cd8e1a561cffbde0b384a3ce0789340440e144f9d64c10f6R262-R263](https://github.com//github.com/vitejs/vite/commit/6bce1081991501f3779bff1a81e5dd1e63e5d38e/issues/diff-2cfbd4f4d8c32727cd8e1a561cffbde0b384a3ce0789340440e144f9d64c10f6R262-R263)
* chore: next replace core (#6664) ([8338e26](https://github.com/vitejs/vite/commit/8338e26)), closes [#6664](https://github.com/vitejs/vite/issues/6664)
* chore: replace source-map with source-map-js (#6556) ([7b95f4d](https://github.com/vitejs/vite/commit/7b95f4d)), closes [#6556](https://github.com/vitejs/vite/issues/6556)
* chore(deps): update dependency dotenv to v14 (#6605) ([1733955](https://github.com/vitejs/vite/commit/1733955)), closes [#6605](https://github.com/vitejs/vite/issues/6605)
* feat: add lerna workspace support to `searchForWorkspaceRoot` (#6270) ([0e164f8](https://github.com/vitejs/vite/commit/0e164f8)), closes [#6270](https://github.com/vitejs/vite/issues/6270)



## 2.8.0-beta.3 (2022-01-18)

* release: v2.8.0-beta.3 ([75ccdf1](https://github.com/vitejs/vite/commit/75ccdf1))
* chore: inline selfsigned license (#6530) ([d303264](https://github.com/vitejs/vite/commit/d303264)), closes [#6530](https://github.com/vitejs/vite/issues/6530)
* chore(deps): update postcss config loader (#6532) ([5d97de1](https://github.com/vitejs/vite/commit/5d97de1)), closes [#6532](https://github.com/vitejs/vite/issues/6532)
* refactor: bundle json5 (#6527) ([4e83e44](https://github.com/vitejs/vite/commit/4e83e44)), closes [#6527](https://github.com/vitejs/vite/issues/6527)
* refactor: enforce a cache directory (#6415) ([fb7ba53](https://github.com/vitejs/vite/commit/fb7ba53)), closes [#6415](https://github.com/vitejs/vite/issues/6415)
* fix: avoid referencing importGlob from importMeta.d.ts (#6531) ([962d285](https://github.com/vitejs/vite/commit/962d285)), closes [#6531](https://github.com/vitejs/vite/issues/6531)
* fix: improve alias merging (#6497) ([e57d8c6](https://github.com/vitejs/vite/commit/e57d8c6)), closes [#6497](https://github.com/vitejs/vite/issues/6497)
* fix: merge debug params instead of overwrite (#6504) (#6505) ([1ac7fb1](https://github.com/vitejs/vite/commit/1ac7fb1)), closes [#6504](https://github.com/vitejs/vite/issues/6504) [#6505](https://github.com/vitejs/vite/issues/6505)
* fix: update preview port to 4173 (#6330) ([870e1c0](https://github.com/vitejs/vite/commit/870e1c0)), closes [#6330](https://github.com/vitejs/vite/issues/6330)
* fix(config): merge array correctly (#6499) ([b2d972e](https://github.com/vitejs/vite/commit/b2d972e)), closes [#6499](https://github.com/vitejs/vite/issues/6499)
* fix(ssr): avoid using `tryNodeResolve` on absolute paths (#6488) ([f346d89](https://github.com/vitejs/vite/commit/f346d89)), closes [#6488](https://github.com/vitejs/vite/issues/6488)
* fix(ssr): fix resolution for nested ssr externals (#6080) (#6470) ([4a764f5](https://github.com/vitejs/vite/commit/4a764f5)), closes [#6080](https://github.com/vitejs/vite/issues/6080) [#6470](https://github.com/vitejs/vite/issues/6470)
* fix(ssr): should correctly transfrom identifier in ssr (#6548) ([15cd975](https://github.com/vitejs/vite/commit/15cd975)), closes [#6548](https://github.com/vitejs/vite/issues/6548)
* feat: add .txt file format to assets (#6265) ([e87ae41](https://github.com/vitejs/vite/commit/e87ae41)), closes [#6265](https://github.com/vitejs/vite/issues/6265)
* feat(html): html simple script tag support import-expression (#6525) ([3546d4f](https://github.com/vitejs/vite/commit/3546d4f)), closes [#6525](https://github.com/vitejs/vite/issues/6525)



## 2.8.0-beta.2 (2022-01-13)

* release: v2.8.0-beta.2 ([6ecf9b0](https://github.com/vitejs/vite/commit/6ecf9b0))
* fix: improve array config merging (#6344) ([028cbeb](https://github.com/vitejs/vite/commit/028cbeb)), closes [#6344](https://github.com/vitejs/vite/issues/6344)
* fix: only run build-html plugin on bundler inputs (fix #4067) (#5342) ([7541a8d](https://github.com/vitejs/vite/commit/7541a8d)), closes [#4067](https://github.com/vitejs/vite/issues/4067) [#5342](https://github.com/vitejs/vite/issues/5342)
* fix: use cacheDir for resolveHttpsConfig (#6416) ([647168b](https://github.com/vitejs/vite/commit/647168b)), closes [#6416](https://github.com/vitejs/vite/issues/6416)
* fix(ssr): handle nameless descture in function args (#6489) ([debc08d](https://github.com/vitejs/vite/commit/debc08d)), closes [#6489](https://github.com/vitejs/vite/issues/6489)
* fix(types): add missing options parameter to importMeta (#6433) ([ccf7d79](https://github.com/vitejs/vite/commit/ccf7d79)), closes [#6433](https://github.com/vitejs/vite/issues/6433)
* fix(types): dynamic import in import.meta (#6456) ([5d7b4c3](https://github.com/vitejs/vite/commit/5d7b4c3)), closes [#6456](https://github.com/vitejs/vite/issues/6456) [#6433](https://github.com/vitejs/vite/issues/6433)
* build: avoid emitting unused dts files in production build ([cbc633a](https://github.com/vitejs/vite/commit/cbc633a))
* build: remove production source map for dist/node ([1c1f82f](https://github.com/vitejs/vite/commit/1c1f82f))
* feat: add customResolver option to resolve.alias (#5876) ([6408a3a](https://github.com/vitejs/vite/commit/6408a3a)), closes [#5876](https://github.com/vitejs/vite/issues/5876)
* feat: allow globs in node_modules when pattern is explicit (#6056) ([669d7e0](https://github.com/vitejs/vite/commit/669d7e0)), closes [#6056](https://github.com/vitejs/vite/issues/6056)
* chore(deps): update dependency node-forge to v1 (#6425) ([4f820e5](https://github.com/vitejs/vite/commit/4f820e5)), closes [#6425](https://github.com/vitejs/vite/issues/6425)



## 2.8.0-beta.1 (2022-01-06)

* release: v2.8.0-beta.1 ([bd4c3a5](https://github.com/vitejs/vite/commit/bd4c3a5))
* feat: new Worker can bundle URL('path', import.meta.url) script (fix #5979) (#6356) ([a345614](https://github.com/vitejs/vite/commit/a345614)), closes [#5979](https://github.com/vitejs/vite/issues/5979) [#6356](https://github.com/vitejs/vite/issues/6356)



## 2.8.0-beta.0 (2022-01-05)

* release: v2.8.0-beta.0 ([1f03211](https://github.com/vitejs/vite/commit/1f03211))
* feat: catch postcss error messages (#6293) ([4d75b2e](https://github.com/vitejs/vite/commit/4d75b2e)), closes [#6293](https://github.com/vitejs/vite/issues/6293)
* feat: import.meta.glob support ?raw (#5545) ([5279de6](https://github.com/vitejs/vite/commit/5279de6)), closes [#5545](https://github.com/vitejs/vite/issues/5545)
* feat: option to disable pre-transform (#6309) ([2c14525](https://github.com/vitejs/vite/commit/2c14525)), closes [#6309](https://github.com/vitejs/vite/issues/6309)
* feat: support .cjs config file (#5602) ([cddd986](https://github.com/vitejs/vite/commit/cddd986)), closes [#5602](https://github.com/vitejs/vite/issues/5602)
* feat(define): prevent assignment (#5515) ([6d4ee18](https://github.com/vitejs/vite/commit/6d4ee18)), closes [#5515](https://github.com/vitejs/vite/issues/5515)
* feat(server): support headers configurable (#5580) ([db36e81](https://github.com/vitejs/vite/commit/db36e81)), closes [#5580](https://github.com/vitejs/vite/issues/5580)
* feat(server): trace `error.loc` back to original source (#5467) ([65cd44d](https://github.com/vitejs/vite/commit/65cd44d)), closes [#5467](https://github.com/vitejs/vite/issues/5467)
* feat(ssr): support preload dynamic css file in html head (#5705) ([07fca95](https://github.com/vitejs/vite/commit/07fca95)), closes [#5705](https://github.com/vitejs/vite/issues/5705)
* feat(vite): pass mode to preview command (#6392) ([1ff1103](https://github.com/vitejs/vite/commit/1ff1103)), closes [#6392](https://github.com/vitejs/vite/issues/6392)
* feat(worker): support worker format, plugins and rollupOptions (fix #6191) (#6351) ([133fcea](https://github.com/vitejs/vite/commit/133fcea)), closes [#6191](https://github.com/vitejs/vite/issues/6191) [#6351](https://github.com/vitejs/vite/issues/6351)
* fix: check if e.stack exists in the first place (#6362) ([f144aa9](https://github.com/vitejs/vite/commit/f144aa9)), closes [#6362](https://github.com/vitejs/vite/issues/6362)
* fix: correct ssr flag in resolve calls (fix #6213) (#6216) ([6dd7d1a](https://github.com/vitejs/vite/commit/6dd7d1a)), closes [#6213](https://github.com/vitejs/vite/issues/6213) [#6216](https://github.com/vitejs/vite/issues/6216)
* fix: don't force terser on non-legacy (fix #6266) (#6272) ([1da104e](https://github.com/vitejs/vite/commit/1da104e)), closes [#6266](https://github.com/vitejs/vite/issues/6266) [#6272](https://github.com/vitejs/vite/issues/6272)
* fix: prevent dev server crashing on malformed URI (fix #6300) (#6308) ([a49d723](https://github.com/vitejs/vite/commit/a49d723)), closes [#6300](https://github.com/vitejs/vite/issues/6300) [#6308](https://github.com/vitejs/vite/issues/6308)
* fix: replace chalk with picocolors (#6277) ([5a111ce](https://github.com/vitejs/vite/commit/5a111ce)), closes [#6277](https://github.com/vitejs/vite/issues/6277)
* fix: replace execa with cross-spawn (#6299) ([f68ed8b](https://github.com/vitejs/vite/commit/f68ed8b)), closes [#6299](https://github.com/vitejs/vite/issues/6299)
* fix: strip NULL_BYTE_PLACEHOLDER before transform (#6390) ([5964949](https://github.com/vitejs/vite/commit/5964949)), closes [#6390](https://github.com/vitejs/vite/issues/6390)
* fix: strip query when resolving entry (#6233) ([000ba2e](https://github.com/vitejs/vite/commit/000ba2e)), closes [#6233](https://github.com/vitejs/vite/issues/6233)
* fix: this._implicitHeader is not a function (#6313) ([c5ba2f2](https://github.com/vitejs/vite/commit/c5ba2f2)), closes [#6313](https://github.com/vitejs/vite/issues/6313)
* fix: upgrade postcss-modules (#6248) ([ac3f434](https://github.com/vitejs/vite/commit/ac3f434)), closes [#6248](https://github.com/vitejs/vite/issues/6248)
* fix: use `hires: true` for SSR require hook source map (#6310) ([0ebeb98](https://github.com/vitejs/vite/commit/0ebeb98)), closes [#6310](https://github.com/vitejs/vite/issues/6310)
* fix(build): fix chokidar.ignore override (#6317) ([aa47549](https://github.com/vitejs/vite/commit/aa47549)), closes [#6317](https://github.com/vitejs/vite/issues/6317)
* fix(build): fix watch crash with inline module (#6373) ([49d2f6d](https://github.com/vitejs/vite/commit/49d2f6d)), closes [#6373](https://github.com/vitejs/vite/issues/6373)
* fix(css): no emit assets in html style tag (fix #5968) (#6321) ([dc9fce1](https://github.com/vitejs/vite/commit/dc9fce1)), closes [#5968](https://github.com/vitejs/vite/issues/5968) [#6321](https://github.com/vitejs/vite/issues/6321)
* fix(ssr): move `vite:ssr-require-hook` after user plugins (#6306) ([d856c4b](https://github.com/vitejs/vite/commit/d856c4b)), closes [#6306](https://github.com/vitejs/vite/issues/6306)
* build: fix `declarationDir` for development builds (#6385) ([26512de](https://github.com/vitejs/vite/commit/26512de)), closes [#6385](https://github.com/vitejs/vite/issues/6385)
* chore: replace mime with mrmime (#6312) ([8bdb184](https://github.com/vitejs/vite/commit/8bdb184)), closes [#6312](https://github.com/vitejs/vite/issues/6312)
* chore: use forge partially to generate certificates (#6325) ([dd8869b](https://github.com/vitejs/vite/commit/dd8869b)), closes [#6325](https://github.com/vitejs/vite/issues/6325)
* chore(deps): update all non-major dependencies (#6185) ([b45f4ad](https://github.com/vitejs/vite/commit/b45f4ad)), closes [#6185](https://github.com/vitejs/vite/issues/6185)
* chore(deps): update dependency sirv to v2 (#6358) ([9a58aae](https://github.com/vitejs/vite/commit/9a58aae)), closes [#6358](https://github.com/vitejs/vite/issues/6358)
* chore(deps): update to esbuild fixed at 0.14.3 (#5861) ([44bb4da](https://github.com/vitejs/vite/commit/44bb4da)), closes [#5861](https://github.com/vitejs/vite/issues/5861)
* docs: fix preTransformRequests typo (#6319) ([a8a0d84](https://github.com/vitejs/vite/commit/a8a0d84)), closes [#6319](https://github.com/vitejs/vite/issues/6319)



## <small>2.7.9 (2021-12-28)</small>

* release: v2.7.9 ([7e3e84e](https://github.com/vitejs/vite/commit/7e3e84e))
*  fix: revert #6251 (#6290) ([83ad7bf](https://github.com/vitejs/vite/commit/83ad7bf)), closes [#6251](https://github.com/vitejs/vite/issues/6251) [#6290](https://github.com/vitejs/vite/issues/6290)
* test: fix test typo (#6285) ([1cbf0e1](https://github.com/vitejs/vite/commit/1cbf0e1)), closes [#6285](https://github.com/vitejs/vite/issues/6285)



## <small>2.7.8 (2021-12-28)</small>

* release: v2.7.8 ([d13ced5](https://github.com/vitejs/vite/commit/d13ced5))
* fix: seperate source and dep for dymamic import after build (#6251) ([49da986](https://github.com/vitejs/vite/commit/49da986)), closes [#6251](https://github.com/vitejs/vite/issues/6251)
* fix: upgrade to launch-editor with picocolors (#6209) ([394539c](https://github.com/vitejs/vite/commit/394539c)), closes [#6209](https://github.com/vitejs/vite/issues/6209)
* fix(html): show error overlay when parsing invalid file (#6184) ([1f945f6](https://github.com/vitejs/vite/commit/1f945f6)), closes [#6184](https://github.com/vitejs/vite/issues/6184)
* fix(ssr): capture scope declaration correctly (#6281) ([60ce7f9](https://github.com/vitejs/vite/commit/60ce7f9)), closes [#6281](https://github.com/vitejs/vite/issues/6281)
* chore: remove acorn plugins (#6275) ([eb08ec5](https://github.com/vitejs/vite/commit/eb08ec5)), closes [#6275](https://github.com/vitejs/vite/issues/6275)



## <small>2.7.7 (2021-12-26)</small>

* release: v2.7.7 ([1d722c5](https://github.com/vitejs/vite/commit/1d722c5))
* fix(ssr): nested destucture (#6249) ([485e298](https://github.com/vitejs/vite/commit/485e298)), closes [#6249](https://github.com/vitejs/vite/issues/6249)
* fix(ssr): transform class props (#6261) ([2e3fe59](https://github.com/vitejs/vite/commit/2e3fe59)), closes [#6261](https://github.com/vitejs/vite/issues/6261)



## <small>2.7.6 (2021-12-22)</small>

* release: v2.7.6 ([a96bdd9](https://github.com/vitejs/vite/commit/a96bdd9))
* fix: remove virtual module prefix while generating manifest (#6225) ([d51259b](https://github.com/vitejs/vite/commit/d51259b)), closes [#6225](https://github.com/vitejs/vite/issues/6225)



## <small>2.7.5 (2021-12-21)</small>

* release: v2.7.5 ([20586f0](https://github.com/vitejs/vite/commit/20586f0))
* fix: hmr full-reload encodeURI path (#6212) ([46b862a](https://github.com/vitejs/vite/commit/46b862a)), closes [#6212](https://github.com/vitejs/vite/issues/6212)
* fix: remove top-level imports in importMeta.d.ts, fixes augmentation (#6214) ([6b8d94d](https://github.com/vitejs/vite/commit/6b8d94d)), closes [#6214](https://github.com/vitejs/vite/issues/6214) [#6194](https://github.com/vitejs/vite/issues/6194) [#6211](https://github.com/vitejs/vite/issues/6211) [#6206](https://github.com/vitejs/vite/issues/6206) [#6205](https://github.com/vitejs/vite/issues/6205)
* fix(asset): import assets from encodeURI(#6195) (#6199) ([4114f84](https://github.com/vitejs/vite/commit/4114f84)), closes [#6195](https://github.com/vitejs/vite/issues/6195) [#6199](https://github.com/vitejs/vite/issues/6199)
* fix(ssr): handle object destructure alias, close #6222 (#6224) ([1d97ec3](https://github.com/vitejs/vite/commit/1d97ec3)), closes [#6222](https://github.com/vitejs/vite/issues/6222) [#6224](https://github.com/vitejs/vite/issues/6224)
* docs: fix typo in changelog (#6201) ([0946796](https://github.com/vitejs/vite/commit/0946796)), closes [#6201](https://github.com/vitejs/vite/issues/6201)



## <small>2.7.4 (2021-12-20)</small>

* release: v2.7.4 ([b04f5a9](https://github.com/vitejs/vite/commit/b04f5a9))
* fix: duplicate variable declaration caused by css modules (#5873) ([8e16a78](https://github.com/vitejs/vite/commit/8e16a78)), closes [#5873](https://github.com/vitejs/vite/issues/5873)
* fix: improve error message for HTML compilation error (fix #5769) (#5777) ([79d1397](https://github.com/vitejs/vite/commit/79d1397)), closes [#5769](https://github.com/vitejs/vite/issues/5769) [#5777](https://github.com/vitejs/vite/issues/5777)
* fix(ssr): ssrTransfrom function argument destructure (#6171) ([2762a0e](https://github.com/vitejs/vite/commit/2762a0e)), closes [#6171](https://github.com/vitejs/vite/issues/6171)
* chore: convert scripts to TS (#6160) ([15b6f1b](https://github.com/vitejs/vite/commit/15b6f1b)), closes [#6160](https://github.com/vitejs/vite/issues/6160)
* chore: delete extra blank line (#6152) ([39c252e](https://github.com/vitejs/vite/commit/39c252e)), closes [#6152](https://github.com/vitejs/vite/issues/6152)
* chore: prefer type imports (#5835) ([7186857](https://github.com/vitejs/vite/commit/7186857)), closes [#5835](https://github.com/vitejs/vite/issues/5835)
* chore(deps): update all non-major dependencies (#5879) ([aab303f](https://github.com/vitejs/vite/commit/aab303f)), closes [#5879](https://github.com/vitejs/vite/issues/5879)
* refactor: rename `mergeConfig` parameters (#6144) ([5f39c28](https://github.com/vitejs/vite/commit/5f39c28)), closes [#6144](https://github.com/vitejs/vite/issues/6144)



## <small>2.7.3 (2021-12-16)</small>

* release: v2.7.3 ([a08b4c5](https://github.com/vitejs/vite/commit/a08b4c5))
* fix: do not overwrite rollupOptions.input in dev (#6025) ([6cdf13a](https://github.com/vitejs/vite/commit/6cdf13a)), closes [#6025](https://github.com/vitejs/vite/issues/6025)
* fix: Improve post-build asset update check (#6113) ([611fa03](https://github.com/vitejs/vite/commit/611fa03)), closes [#6113](https://github.com/vitejs/vite/issues/6113)
* fix: improve warning message for malformed packages (#6086) ([717cb08](https://github.com/vitejs/vite/commit/717cb08)), closes [#6086](https://github.com/vitejs/vite/issues/6086)
* fix: pending reload never timeout (#6120) ([e002f4f](https://github.com/vitejs/vite/commit/e002f4f)), closes [#6120](https://github.com/vitejs/vite/issues/6120)
* fix: respect new port when change the config file (#6075) ([3ceffcc](https://github.com/vitejs/vite/commit/3ceffcc)), closes [#6075](https://github.com/vitejs/vite/issues/6075)
* fix: terminate WebSocket connections before closing WebSocket server (#6115) ([b9871bb](https://github.com/vitejs/vite/commit/b9871bb)), closes [#6115](https://github.com/vitejs/vite/issues/6115)
* fix(ssr): robust regexp to check cjs content (#6053) ([0373441](https://github.com/vitejs/vite/commit/0373441)), closes [#6053](https://github.com/vitejs/vite/issues/6053)
* refactor: simplify filter callback (#6119) ([dd79858](https://github.com/vitejs/vite/commit/dd79858)), closes [#6119](https://github.com/vitejs/vite/issues/6119)



## <small>2.7.2 (2021-12-13)</small>

* release: v2.7.2 ([3e71100](https://github.com/vitejs/vite/commit/3e71100))
* fix: ws types (#6083) ([1ded1a8](https://github.com/vitejs/vite/commit/1ded1a8)), closes [#6083](https://github.com/vitejs/vite/issues/6083)
* fix(html): empty script (#6057) ([1487223](https://github.com/vitejs/vite/commit/1487223)), closes [#6057](https://github.com/vitejs/vite/issues/6057)
* fix(lexGlobPattern): edge case of glob import (#6022) ([d4c5cff](https://github.com/vitejs/vite/commit/d4c5cff)), closes [#6022](https://github.com/vitejs/vite/issues/6022)
* chore: use node tsconfig in all src/node builds (#6019) ([8161d4a](https://github.com/vitejs/vite/commit/8161d4a)), closes [#6019](https://github.com/vitejs/vite/issues/6019)



## <small>2.7.1 (2021-12-07)</small>

* release: v2.7.1 ([b625a2c](https://github.com/vitejs/vite/commit/b625a2c))
* fix(ssr): `ssrTransform` handling for empty ArrayPattern (#5988) ([79aa687](https://github.com/vitejs/vite/commit/79aa687)), closes [#5988](https://github.com/vitejs/vite/issues/5988)
* chore: update changelog for 2.7 (#5985) ([1102789](https://github.com/vitejs/vite/commit/1102789)), closes [#5985](https://github.com/vitejs/vite/issues/5985)



## 2.7.0 (2021-12-07)

* release: v2.7.0 ([075128a](https://github.com/vitejs/vite/commit/075128a))
* feat: expose `ssrTransform` to server (#5983) ([8184feb](https://github.com/vitejs/vite/commit/8184feb)), closes [#5983](https://github.com/vitejs/vite/issues/5983)



## 2.7.0-beta.11 (2021-12-06)

* release: v2.7.0-beta.11 ([49f28e2](https://github.com/vitejs/vite/commit/49f28e2))
* fix(ssr): allow primitive default exports and forwarded exports (#5973) ([a47b663](https://github.com/vitejs/vite/commit/a47b663)), closes [#5973](https://github.com/vitejs/vite/issues/5973)



## 2.7.0-beta.10 (2021-12-02)

* release: v2.7.0-beta.10 ([aaa26a3](https://github.com/vitejs/vite/commit/aaa26a3))
* fix: invalidate inlined proxy scripts on change (#5891) ([5b8c58b](https://github.com/vitejs/vite/commit/5b8c58b)), closes [#5891](https://github.com/vitejs/vite/issues/5891)
* fix: read the correct package.json in ssrExternal (#5927) ([7edabb4](https://github.com/vitejs/vite/commit/7edabb4)), closes [#5927](https://github.com/vitejs/vite/issues/5927) [#5890](https://github.com/vitejs/vite/issues/5890)
* fix: SSR import in dev can't resolve default import (fix #5706) (#5923) ([21d79d7](https://github.com/vitejs/vite/commit/21d79d7)), closes [#5706](https://github.com/vitejs/vite/issues/5706) [#5923](https://github.com/vitejs/vite/issues/5923)
* fix(resolve): dont overwrite `isRequire` from `baseOptions` (#5872) ([2b91e5a](https://github.com/vitejs/vite/commit/2b91e5a)), closes [#5872](https://github.com/vitejs/vite/issues/5872)
* fix(scan): handle local scripts with lang=ts (#5850) ([7ed8702](https://github.com/vitejs/vite/commit/7ed8702)), closes [#5850](https://github.com/vitejs/vite/issues/5850)
* fix(ssr): skip dedupe require if noExternal true (#5928) ([f6aa7fe](https://github.com/vitejs/vite/commit/f6aa7fe)), closes [#5928](https://github.com/vitejs/vite/issues/5928)
* chore: deprecate `rollupOptions.output.output` to avoid subtle errors (#5930) ([e3a1aa5](https://github.com/vitejs/vite/commit/e3a1aa5)), closes [#5930](https://github.com/vitejs/vite/issues/5930) [/github.com/vitejs/vite/issues/5812#issuecomment-984345618](https://github.com//github.com/vitejs/vite/issues/5812/issues/issuecomment-984345618)
* chore: deprecated substr (#5917) ([08a1ec7](https://github.com/vitejs/vite/commit/08a1ec7)), closes [#5917](https://github.com/vitejs/vite/issues/5917)
* chore: format & check with prettier (#5869) ([c344865](https://github.com/vitejs/vite/commit/c344865)), closes [#5869](https://github.com/vitejs/vite/issues/5869)
* chore: use cjs extension with scripts (#5877) ([775baba](https://github.com/vitejs/vite/commit/775baba)), closes [#5877](https://github.com/vitejs/vite/issues/5877)



## 2.7.0-beta.9 (2021-11-27)

* release: v2.7.0-beta.9 ([7bf9f65](https://github.com/vitejs/vite/commit/7bf9f65))
* fix: `isBuiltin` using patched native `builtinModules` (#5827) ([4a05a6e](https://github.com/vitejs/vite/commit/4a05a6e)), closes [#5827](https://github.com/vitejs/vite/issues/5827)
* fix: always bundle config file, fix config hmr (#5779) ([19d2b6a](https://github.com/vitejs/vite/commit/19d2b6a)), closes [#5779](https://github.com/vitejs/vite/issues/5779)
* fix: build pluginContext types error (#5846) ([c278439](https://github.com/vitejs/vite/commit/c278439)), closes [#5846](https://github.com/vitejs/vite/issues/5846)
* fix: circular dependency hmr causes refresh crash (#4589) ([00d8c9b](https://github.com/vitejs/vite/commit/00d8c9b)), closes [#4589](https://github.com/vitejs/vite/issues/4589)
* fix: replace asset references in CSS returned to JS (#5729) ([880026e](https://github.com/vitejs/vite/commit/880026e)), closes [#5729](https://github.com/vitejs/vite/issues/5729)
* fix: resolve addons using nodeResolve() (#5809) ([d288772](https://github.com/vitejs/vite/commit/d288772))
* fix: throw full error causing preprocessor to not load (#5816) ([f6fcd21](https://github.com/vitejs/vite/commit/f6fcd21)), closes [#5816](https://github.com/vitejs/vite/issues/5816)
* fix: unicode path html entry point (#5821) (#5823) ([2048195](https://github.com/vitejs/vite/commit/2048195)), closes [#5821](https://github.com/vitejs/vite/issues/5821) [#5823](https://github.com/vitejs/vite/issues/5823)
* fix: unminified build breaks __vitePreload (#5785) ([757a74a](https://github.com/vitejs/vite/commit/757a74a)), closes [#5785](https://github.com/vitejs/vite/issues/5785)
* feat: lint for missing type="module" attribute (#5837) (#5838) ([494e358](https://github.com/vitejs/vite/commit/494e358)), closes [#5837](https://github.com/vitejs/vite/issues/5837) [#5838](https://github.com/vitejs/vite/issues/5838)
* chore: delete useless condition (#5772) ([5588eb9](https://github.com/vitejs/vite/commit/5588eb9)), closes [#5772](https://github.com/vitejs/vite/issues/5772)
* chore: fix typo (#5768) ([d383112](https://github.com/vitejs/vite/commit/d383112)), closes [#5768](https://github.com/vitejs/vite/issues/5768)
* chore: improve local variable url is redundant (#5769) ([4a6cf35](https://github.com/vitejs/vite/commit/4a6cf35)), closes [#5769](https://github.com/vitejs/vite/issues/5769)
* chore: optimize esm flag (#5778) ([a32b105](https://github.com/vitejs/vite/commit/a32b105)), closes [#5778](https://github.com/vitejs/vite/issues/5778)
* chore(deps): update all non-major dependencies (#5783) ([eee9406](https://github.com/vitejs/vite/commit/eee9406)), closes [#5783](https://github.com/vitejs/vite/issues/5783)



## 2.7.0-beta.8 (2021-11-19)

* release: v2.7.0-beta.8 ([37b85a0](https://github.com/vitejs/vite/commit/37b85a0))
* fix: move package.json cache into ResolvedConfig (#5388) ([650b56e](https://github.com/vitejs/vite/commit/650b56e)), closes [#5388](https://github.com/vitejs/vite/issues/5388)
* fix: scoped variable with array destructuring & nested arguments (#5730) ([b86a2f3](https://github.com/vitejs/vite/commit/b86a2f3)), closes [#5730](https://github.com/vitejs/vite/issues/5730)
* fix(hmr): prevent SSR from setting `isSelfAccepting` to false (#5377) ([37e5617](https://github.com/vitejs/vite/commit/37e5617)), closes [#5377](https://github.com/vitejs/vite/issues/5377)
* fix(transformCjsImport): make dev and build get the same result (#5745) ([9d3e4e6](https://github.com/vitejs/vite/commit/9d3e4e6)), closes [#5745](https://github.com/vitejs/vite/issues/5745)
* chore: correct config transpile comment (#5735) ([4ffc9a5](https://github.com/vitejs/vite/commit/4ffc9a5)), closes [#5735](https://github.com/vitejs/vite/issues/5735)
* chore: fix typo (#5697) ([1e079f4](https://github.com/vitejs/vite/commit/1e079f4)), closes [#5697](https://github.com/vitejs/vite/issues/5697)
* refactor: remove unused const (#5748) ([67a465f](https://github.com/vitejs/vite/commit/67a465f)), closes [#5748](https://github.com/vitejs/vite/issues/5748)
* refactor: simplify array handling (#5734) ([2cacc6b](https://github.com/vitejs/vite/commit/2cacc6b)), closes [#5734](https://github.com/vitejs/vite/issues/5734)
* feat(dev): expose restart function on ViteDevServer (#5723) ([1425a16](https://github.com/vitejs/vite/commit/1425a16)), closes [#5723](https://github.com/vitejs/vite/issues/5723)
* docs: virtual modules internal convention (#5553) ([04016df](https://github.com/vitejs/vite/commit/04016df)), closes [#5553](https://github.com/vitejs/vite/issues/5553)



## 2.7.0-beta.7 (2021-11-17)

* release: v2.7.0-beta.7 ([0ed7bc3](https://github.com/vitejs/vite/commit/0ed7bc3))
* fix(build): keep IIFE name after minifying (fix #5490) (#5715) ([1544211](https://github.com/vitejs/vite/commit/1544211)), closes [#5490](https://github.com/vitejs/vite/issues/5490) [#5715](https://github.com/vitejs/vite/issues/5715)
* fix(scan): correctly resolve virtual modules (#5711) ([01f9b16](https://github.com/vitejs/vite/commit/01f9b16)), closes [#5711](https://github.com/vitejs/vite/issues/5711)
* fix(ssr): skip dedupe require in esm (#5714) ([9666446](https://github.com/vitejs/vite/commit/9666446)), closes [#5714](https://github.com/vitejs/vite/issues/5714)
* chore: format and fix typo (#5718) ([5987a77](https://github.com/vitejs/vite/commit/5987a77)), closes [#5718](https://github.com/vitejs/vite/issues/5718)



## 2.7.0-beta.6 (2021-11-16)

* release: v2.7.0-beta.6 ([9faefad](https://github.com/vitejs/vite/commit/9faefad))
* chore: cleanup #5601 (#5672) ([3ba3e2c](https://github.com/vitejs/vite/commit/3ba3e2c)), closes [#5601](https://github.com/vitejs/vite/issues/5601) [#5672](https://github.com/vitejs/vite/issues/5672)
* chore: remove outdated documentation (#5700) ([162c9a0](https://github.com/vitejs/vite/commit/162c9a0)), closes [#5700](https://github.com/vitejs/vite/issues/5700)
* chore(deps): update all non-major dependencies (#5679) ([09f4d57](https://github.com/vitejs/vite/commit/09f4d57)), closes [#5679](https://github.com/vitejs/vite/issues/5679)
* fix(dev): Fix infinite recursion on query imports (#5671) (#5674) ([bce4e56](https://github.com/vitejs/vite/commit/bce4e56)), closes [#5671](https://github.com/vitejs/vite/issues/5671) [#5674](https://github.com/vitejs/vite/issues/5674)
* fix(ssr): avoid resolving ESM for CJS dependencies (#5693) ([b937ea4](https://github.com/vitejs/vite/commit/b937ea4)), closes [#5693](https://github.com/vitejs/vite/issues/5693)



## 2.7.0-beta.5 (2021-11-13)

* release: v2.7.0-beta.5 ([96b9fbb](https://github.com/vitejs/vite/commit/96b9fbb))
* fix: correctly resolve virtual modules during import scan (#5659) ([40d503c](https://github.com/vitejs/vite/commit/40d503c)), closes [#5659](https://github.com/vitejs/vite/issues/5659)
* fix: tolerate undefined parent in `hookNodeResolve` callback (#5664) ([d788682](https://github.com/vitejs/vite/commit/d788682)), closes [#5664](https://github.com/vitejs/vite/issues/5664)
* fix(resolve): check nested directories for package.json (#5665) ([022db52](https://github.com/vitejs/vite/commit/022db52)), closes [#5665](https://github.com/vitejs/vite/issues/5665)
* fix(ssr): prefer CJS but still allow ESM entries (#5662) ([72d8925](https://github.com/vitejs/vite/commit/72d8925)), closes [#5662](https://github.com/vitejs/vite/issues/5662)
* chore: remove useless cli option (#5653) ([68e8e35](https://github.com/vitejs/vite/commit/68e8e35)), closes [#5653](https://github.com/vitejs/vite/issues/5653)



## 2.7.0-beta.4 (2021-11-12)

* release: v2.7.0-beta.4 ([6c0701d](https://github.com/vitejs/vite/commit/6c0701d))
* fix: check exactly in proxyESM (#5512) ([a17da55](https://github.com/vitejs/vite/commit/a17da55)), closes [#5512](https://github.com/vitejs/vite/issues/5512)
* fix: handle local and module scripts separately (#5464) ([0713446](https://github.com/vitejs/vite/commit/0713446)), closes [#5464](https://github.com/vitejs/vite/issues/5464)
* fix: use micromatch for consistent glob matching (#5610) ([9d50df8](https://github.com/vitejs/vite/commit/9d50df8)), closes [#5610](https://github.com/vitejs/vite/issues/5610)
* fix: vitepress/theme in ssrExternals (#5651) ([1f91cdb](https://github.com/vitejs/vite/commit/1f91cdb)), closes [#5651](https://github.com/vitejs/vite/issues/5651)
* fix(build): resolve `rollupOptions.input` paths (#5601) ([5b6b016](https://github.com/vitejs/vite/commit/5b6b016)), closes [#5601](https://github.com/vitejs/vite/issues/5601)
* fix(logger): no sameCount if clearScreen is false (#5648) ([afd6b6d](https://github.com/vitejs/vite/commit/afd6b6d)), closes [#5648](https://github.com/vitejs/vite/issues/5648)
* fix(server): watch correct env files (#5520) ([03b77bd](https://github.com/vitejs/vite/commit/03b77bd)), closes [#5520](https://github.com/vitejs/vite/issues/5520)
* fix(sourcemap): tolerate virtual modules in `sources` array (#5587) ([cfd2c5e](https://github.com/vitejs/vite/commit/cfd2c5e)), closes [#5587](https://github.com/vitejs/vite/issues/5587)
* fix(ssr): use `tryNodeResolve` instead of `resolveFrom` (#3951) ([87c0050](https://github.com/vitejs/vite/commit/87c0050)), closes [#3951](https://github.com/vitejs/vite/issues/3951)
* feat: support `moduleInfo.meta` in dev server (#5465) ([f6d08c7](https://github.com/vitejs/vite/commit/f6d08c7)), closes [#5465](https://github.com/vitejs/vite/issues/5465)
* chore(deps): update all non-major dependencies (#5245) ([0a3e514](https://github.com/vitejs/vite/commit/0a3e514)), closes [#5245](https://github.com/vitejs/vite/issues/5245)



## 2.7.0-beta.3 (2021-11-08)

* release: v2.7.0-beta.3 ([906cc51](https://github.com/vitejs/vite/commit/906cc51))
* refactor: simplify `resolveSSRExternal` (#5544) ([f663348](https://github.com/vitejs/vite/commit/f663348)), closes [#5544](https://github.com/vitejs/vite/issues/5544)



## 2.7.0-beta.2 (2021-11-08)

* release: v2.7.0-beta.2 ([935f6d7](https://github.com/vitejs/vite/commit/935f6d7))
* fix: replace server.origin in css plugin (fix #5408) (#5571) ([bd8b66d](https://github.com/vitejs/vite/commit/bd8b66d)), closes [#5408](https://github.com/vitejs/vite/issues/5408) [#5571](https://github.com/vitejs/vite/issues/5571)
* fix: Windows path error on script proxying (#5556) ([f8dc1ee](https://github.com/vitejs/vite/commit/f8dc1ee)), closes [#5556](https://github.com/vitejs/vite/issues/5556)
* fix(commonjs): expose ignoreTryCatch config option (#5555) ([d383c2a](https://github.com/vitejs/vite/commit/d383c2a)), closes [#5555](https://github.com/vitejs/vite/issues/5555)
* fix(esbuild): respect esbuild config on build (#5538) ([ff05fe9](https://github.com/vitejs/vite/commit/ff05fe9)), closes [#5538](https://github.com/vitejs/vite/issues/5538)
* fix(hmr): revert early break from handleHotUpdate loop (#5536) ([4abade6](https://github.com/vitejs/vite/commit/4abade6)), closes [#5536](https://github.com/vitejs/vite/issues/5536)
* fix(server): use `options` argument in caching of `transformRequest` calls (#5391) ([27b7f90](https://github.com/vitejs/vite/commit/27b7f90)), closes [#5391](https://github.com/vitejs/vite/issues/5391)
* chore: changelog for 2.7-beta-0 (#5500) ([9f1f221](https://github.com/vitejs/vite/commit/9f1f221)), closes [#5500](https://github.com/vitejs/vite/issues/5500)
* chore(deps): massive major deps update (#5574) ([211f183](https://github.com/vitejs/vite/commit/211f183)), closes [#5574](https://github.com/vitejs/vite/issues/5574)
* chore(deps): remove unneeded type dep (#5541) ([9986ccb](https://github.com/vitejs/vite/commit/9986ccb)), closes [#5541](https://github.com/vitejs/vite/issues/5541)
* chore(deps): update dependency ws to v8 (#5540) ([2efc1e5](https://github.com/vitejs/vite/commit/2efc1e5)), closes [#5540](https://github.com/vitejs/vite/issues/5540)
* chore(deps): update non critical deps (#5569) ([09e2a5f](https://github.com/vitejs/vite/commit/09e2a5f)), closes [#5569](https://github.com/vitejs/vite/issues/5569)
* feat: importing ts files using their corresponding js extesions (#5510) ([7977e92](https://github.com/vitejs/vite/commit/7977e92)), closes [#5510](https://github.com/vitejs/vite/issues/5510)
* feat: preview config (#5514) ([ff755eb](https://github.com/vitejs/vite/commit/ff755eb)), closes [#5514](https://github.com/vitejs/vite/issues/5514)



## 2.7.0-beta.1 (2021-11-01)

* release: v2.7.0-beta.1 ([532f683](https://github.com/vitejs/vite/commit/532f683))
* chore: format (#5459) ([484aad5](https://github.com/vitejs/vite/commit/484aad5)), closes [#5459](https://github.com/vitejs/vite/issues/5459)
* chore(deps): update jest (#5480) ([c2de09b](https://github.com/vitejs/vite/commit/c2de09b)), closes [#5480](https://github.com/vitejs/vite/issues/5480)
* chore(deps): update vite dependencies (#5468) ([6bef595](https://github.com/vitejs/vite/commit/6bef595)), closes [#5468](https://github.com/vitejs/vite/issues/5468)
* fix: Vite module graph race condition (#5470) ([70fd32c](https://github.com/vitejs/vite/commit/70fd32c)), closes [#5470](https://github.com/vitejs/vite/issues/5470)
* fix(ssr): dont transform process.env. in ssr (#5404) ([1140981](https://github.com/vitejs/vite/commit/1140981)), closes [#5404](https://github.com/vitejs/vite/issues/5404)



## 2.7.0-beta.0 (2021-10-28)

* release: v2.7.0-beta.0 ([7b6af0f](https://github.com/vitejs/vite/commit/7b6af0f))
* fix: add `import` support to `ssrModuleLoader` (#5197) ([baba1f9](https://github.com/vitejs/vite/commit/baba1f9)), closes [#5197](https://github.com/vitejs/vite/issues/5197)
* fix: consider # as a valid dir symbol (fix #4701) (#4703) ([52689c8](https://github.com/vitejs/vite/commit/52689c8)), closes [#4701](https://github.com/vitejs/vite/issues/4701) [#4703](https://github.com/vitejs/vite/issues/4703)
* fix: do not overwrite pendingReload promise (fix #5448) (#5452) ([cc9c2da](https://github.com/vitejs/vite/commit/cc9c2da)), closes [#5448](https://github.com/vitejs/vite/issues/5448) [#5452](https://github.com/vitejs/vite/issues/5452)
* fix: exclude dependency of optimized dependency (fix: 5410) (#5411) ([ebd4027](https://github.com/vitejs/vite/commit/ebd4027)), closes [#5411](https://github.com/vitejs/vite/issues/5411)
* fix: missing tags inject fallback (#5339) ([3c44ac8](https://github.com/vitejs/vite/commit/3c44ac8)), closes [#5339](https://github.com/vitejs/vite/issues/5339)
* feat!: server fs strict by default (#5341) ([2136771](https://github.com/vitejs/vite/commit/2136771)), closes [#5341](https://github.com/vitejs/vite/issues/5341)
* refactor!: align preview api (#5407) ([4edb336](https://github.com/vitejs/vite/commit/4edb336)), closes [#5407](https://github.com/vitejs/vite/issues/5407)
* refactor!: plugin container API options (#5294) ([5143f1a](https://github.com/vitejs/vite/commit/5143f1a)), closes [#5294](https://github.com/vitejs/vite/issues/5294)
* refactor!: plugin hooks ssr param to object (#5253) ([d5e51f4](https://github.com/vitejs/vite/commit/d5e51f4)), closes [#5253](https://github.com/vitejs/vite/issues/5253)
* feat: `server.fs.deny` support (#5378) ([1a15460](https://github.com/vitejs/vite/commit/1a15460)), closes [#5378](https://github.com/vitejs/vite/issues/5378)
* refactor: normalize scripts and commands naming (#5207) ([22873a7](https://github.com/vitejs/vite/commit/22873a7)), closes [#5207](https://github.com/vitejs/vite/issues/5207)



## <small>2.6.13 (2021-10-27)</small>

* release: v2.6.13 ([504d700](https://github.com/vitejs/vite/commit/504d700))
* fix(css): ?inline cannot self-accept (#5433) ([d283d9b](https://github.com/vitejs/vite/commit/d283d9b)), closes [#5433](https://github.com/vitejs/vite/issues/5433)



## <small>2.6.12 (2021-10-26)</small>

* release: v2.6.12 ([77bd4c9](https://github.com/vitejs/vite/commit/77bd4c9))
* fix: allowed files logic (fix #5416) (#5420) ([414bc45](https://github.com/vitejs/vite/commit/414bc45)), closes [#5416](https://github.com/vitejs/vite/issues/5416) [#5420](https://github.com/vitejs/vite/issues/5420)



## <small>2.6.11 (2021-10-25)</small>

* release: v2.6.11 ([841044f](https://github.com/vitejs/vite/commit/841044f))
* fix: consider deep imports in isBuiltIn (#5248) ([269a1b6](https://github.com/vitejs/vite/commit/269a1b6)), closes [#5248](https://github.com/vitejs/vite/issues/5248)
* fix: ensure server.host is passed in preview-mode (fix #5387) (#5389) ([61b4b39](https://github.com/vitejs/vite/commit/61b4b39)), closes [#5387](https://github.com/vitejs/vite/issues/5387) [#5389](https://github.com/vitejs/vite/issues/5389)
* fix: load-fallback catch (#5412) ([e73281c](https://github.com/vitejs/vite/commit/e73281c)), closes [#5412](https://github.com/vitejs/vite/issues/5412)
* fix: restrict static middleware fs access (#5361) ([1f4723b](https://github.com/vitejs/vite/commit/1f4723b)), closes [#5361](https://github.com/vitejs/vite/issues/5361)
* fix(build): let top-level `this` refer to `globalThis` (#5312) ([7e25429](https://github.com/vitejs/vite/commit/7e25429)), closes [#5312](https://github.com/vitejs/vite/issues/5312)
* fix(client): fix typo in overlay config hint (#5343) ([96591bf](https://github.com/vitejs/vite/commit/96591bf)), closes [#5343](https://github.com/vitejs/vite/issues/5343)
* fix(ssr): ssrTransfrom with function declaration in scope, fix #4306 (#5376) ([5306632](https://github.com/vitejs/vite/commit/5306632)), closes [#4306](https://github.com/vitejs/vite/issues/4306) [#5376](https://github.com/vitejs/vite/issues/5376)
* perf: minify css only when needed (#5178) ([7970239](https://github.com/vitejs/vite/commit/7970239)), closes [#5178](https://github.com/vitejs/vite/issues/5178)



## <small>2.6.10 (2021-10-18)</small>

* release: v2.6.10 ([d1c85d1](https://github.com/vitejs/vite/commit/d1c85d1))
* fix: bundle ws types (#5340) ([bc4a96c](https://github.com/vitejs/vite/commit/bc4a96c)), closes [#5340](https://github.com/vitejs/vite/issues/5340)



## <small>2.6.9 (2021-10-18)</small>

* release: v2.6.9 ([c50eec9](https://github.com/vitejs/vite/commit/c50eec9))
* chore: clear dist before build (#5331) ([939e384](https://github.com/vitejs/vite/commit/939e384)), closes [#5331](https://github.com/vitejs/vite/issues/5331)



## <small>2.6.8 (2021-10-18)</small>

* release: v2.6.8 ([3a6bcd3](https://github.com/vitejs/vite/commit/3a6bcd3))
* fix: avoid scan failures in .svelte and .astro files (#5193) ([386ca79](https://github.com/vitejs/vite/commit/386ca79)), closes [#5193](https://github.com/vitejs/vite/issues/5193)
* fix: improve HTML script proxying (#5279) ([1d6e7bb](https://github.com/vitejs/vite/commit/1d6e7bb)), closes [#5279](https://github.com/vitejs/vite/issues/5279)
* fix: regEx for <head> tag, fix #5285 (#5311) ([3ac08cc](https://github.com/vitejs/vite/commit/3ac08cc)), closes [#5285](https://github.com/vitejs/vite/issues/5285) [#5311](https://github.com/vitejs/vite/issues/5311)
* fix(deps): bump postcss-load-config to 3.1.0 (#5277) ([b7e8a5c](https://github.com/vitejs/vite/commit/b7e8a5c)), closes [#5277](https://github.com/vitejs/vite/issues/5277)
* fix(html): tags prepend doctype regex (#5315) ([256b2bb](https://github.com/vitejs/vite/commit/256b2bb)), closes [#5315](https://github.com/vitejs/vite/issues/5315)
* fix(ssr): make import.meta.url be the filesystem URL (#5268) ([7674cf2](https://github.com/vitejs/vite/commit/7674cf2)), closes [#5268](https://github.com/vitejs/vite/issues/5268)
* feat(ws): expose `on` / `off` for `server.ws` (#5273) ([6f696be](https://github.com/vitejs/vite/commit/6f696be)), closes [#5273](https://github.com/vitejs/vite/issues/5273)



## <small>2.6.7 (2021-10-11)</small>

* release: v2.6.7 ([04b163c](https://github.com/vitejs/vite/commit/04b163c))
* chore: unresolved deps for client build ([9e3bb65](https://github.com/vitejs/vite/commit/9e3bb65))



## <small>2.6.6 (2021-10-11)</small>

* release: v2.6.6 ([1837141](https://github.com/vitejs/vite/commit/1837141))
* feat: add `build.cssTarget` option (#5132) ([b17444f](https://github.com/vitejs/vite/commit/b17444f)), closes [#5132](https://github.com/vitejs/vite/issues/5132) [#4746](https://github.com/vitejs/vite/issues/4746) [#5070](https://github.com/vitejs/vite/issues/5070) [#4930](https://github.com/vitejs/vite/issues/4930)
* fix: avoid unnecessary  pre-bundling warning ([b586098](https://github.com/vitejs/vite/commit/b586098))
* fix(server): skipped for ended response (#5230) ([7255fd5](https://github.com/vitejs/vite/commit/7255fd5)), closes [#5230](https://github.com/vitejs/vite/issues/5230)
* chore: revise typo (#5233) ([a3f2238](https://github.com/vitejs/vite/commit/a3f2238)), closes [#5233](https://github.com/vitejs/vite/issues/5233)



## <small>2.6.5 (2021-10-07)</small>

* release: v2.6.5 ([8a32cb6](https://github.com/vitejs/vite/commit/8a32cb6))
* feat(internal): expose printHttpServerUrls ([f94a720](https://github.com/vitejs/vite/commit/f94a720))
* feat(server): expose server.printUrls() ([96a9ee4](https://github.com/vitejs/vite/commit/96a9ee4))



## <small>2.6.4 (2021-10-07)</small>

* release: v2.6.4 ([26300f9](https://github.com/vitejs/vite/commit/26300f9))
* fix: better error message for parse failures (#5192) ([8fe8df3](https://github.com/vitejs/vite/commit/8fe8df3)), closes [#5192](https://github.com/vitejs/vite/issues/5192)
* fix: use Function instead of eval to dynamically import config files (#5213) ([10694dd](https://github.com/vitejs/vite/commit/10694dd)), closes [#5213](https://github.com/vitejs/vite/issues/5213)



## <small>2.6.3 (2021-10-05)</small>

* release: v2.6.3 ([a639f77](https://github.com/vitejs/vite/commit/a639f77))
* fix: upgrade to @rollup/plugin-commonjs 21.x (#5173) ([c5bfc5e](https://github.com/vitejs/vite/commit/c5bfc5e)), closes [#5173](https://github.com/vitejs/vite/issues/5173)
* fix(dev): read property of undefined (#5177) ([70e882f](https://github.com/vitejs/vite/commit/70e882f)), closes [#5177](https://github.com/vitejs/vite/issues/5177)
* fix(type): update ExportsData type ([b582581](https://github.com/vitejs/vite/commit/b582581))
* chore: improve html plugin name (#5158) ([e8a1d19](https://github.com/vitejs/vite/commit/e8a1d19)), closes [#5158](https://github.com/vitejs/vite/issues/5158)
* chore(deps): update all non-major dependencies ([61dd3ed](https://github.com/vitejs/vite/commit/61dd3ed))



## <small>2.6.2 (2021-09-30)</small>

* release: v2.6.2 ([2b7e836](https://github.com/vitejs/vite/commit/2b7e836))
* fix: properly handle postfix for getRealPath (#5149) ([7d257c3](https://github.com/vitejs/vite/commit/7d257c3)), closes [#5149](https://github.com/vitejs/vite/issues/5149)
* fix(cli): log correct hostname (#5156) ([6f977a5](https://github.com/vitejs/vite/commit/6f977a5)), closes [#5156](https://github.com/vitejs/vite/issues/5156)



## <small>2.6.1 (2021-09-29)</small>

* release: v2.6.1 ([f609a4d](https://github.com/vitejs/vite/commit/f609a4d))
* fix(cli): reorder dev server message (#5141) ([5fb3e0f](https://github.com/vitejs/vite/commit/5fb3e0f)), closes [#5141](https://github.com/vitejs/vite/issues/5141)



## 2.6.0 (2021-09-29)

* release: v2.6.0 ([978575a](https://github.com/vitejs/vite/commit/978575a))
* docs: fix typo in comment (#5123) ([96a2d15](https://github.com/vitejs/vite/commit/96a2d15)), closes [#5123](https://github.com/vitejs/vite/issues/5123)



## 2.6.0-beta.4 (2021-09-28)

* release: v2.6.0-beta.4 ([ffb30b2](https://github.com/vitejs/vite/commit/ffb30b2))
* chore: prettier format (#5121) ([16fc894](https://github.com/vitejs/vite/commit/16fc894)), closes [#5121](https://github.com/vitejs/vite/issues/5121)
* chore: update tips and docs (#5116) ([789130b](https://github.com/vitejs/vite/commit/789130b)), closes [#5116](https://github.com/vitejs/vite/issues/5116)
* chore(deps): update all non-major dependencies (#5100) ([b2ae627](https://github.com/vitejs/vite/commit/b2ae627)), closes [#5100](https://github.com/vitejs/vite/issues/5100)
* chore(deps): upgrade typescript to 4.4 (#4932) ([936b398](https://github.com/vitejs/vite/commit/936b398)), closes [#4932](https://github.com/vitejs/vite/issues/4932)
* fix: don't overwrite default options unless given new value (#5111) ([4d72b40](https://github.com/vitejs/vite/commit/4d72b40)), closes [#5111](https://github.com/vitejs/vite/issues/5111)
* fix: use global location for import.meta.url rewrite (fix #5087) (#5113) ([0b54853](https://github.com/vitejs/vite/commit/0b54853)), closes [#5087](https://github.com/vitejs/vite/issues/5087) [#5113](https://github.com/vitejs/vite/issues/5113)



## 2.6.0-beta.3 (2021-09-27)

* release: v2.6.0-beta.3 ([eff92a5](https://github.com/vitejs/vite/commit/eff92a5))
* fix: Allow custom asset URL origin in development (#5104) ([e4ef6dd](https://github.com/vitejs/vite/commit/e4ef6dd)), closes [#5104](https://github.com/vitejs/vite/issues/5104)
* fix: avoid module preload polyfill for zero js html (#4999) ([ac55755](https://github.com/vitejs/vite/commit/ac55755)), closes [#4999](https://github.com/vitejs/vite/issues/4999)
* fix: injected tags indentation (#5000) ([4b84c0d](https://github.com/vitejs/vite/commit/4b84c0d)), closes [#5000](https://github.com/vitejs/vite/issues/5000)
* fix: normalize away `base` in imported URLs (#5065) ([9164da0](https://github.com/vitejs/vite/commit/9164da0)), closes [#5065](https://github.com/vitejs/vite/issues/5065)
* fix: server.address before listen, chdir in test, basic cli test (#5059) ([fb37a63](https://github.com/vitejs/vite/commit/fb37a63)), closes [#5059](https://github.com/vitejs/vite/issues/5059)
* fix: should load `--config foo.mjs` as an ES module (#5091) ([5d2c50a](https://github.com/vitejs/vite/commit/5d2c50a)), closes [#5091](https://github.com/vitejs/vite/issues/5091)
* fix: use the same `target` for optimized dependencies and source files (#5095) ([8456a6f](https://github.com/vitejs/vite/commit/8456a6f)), closes [#5095](https://github.com/vitejs/vite/issues/5095) [#4897](https://github.com/vitejs/vite/issues/4897)
* fix(lib-mode): do not minify lib mode es output ([06d86e4](https://github.com/vitejs/vite/commit/06d86e4)), closes [/github.com/vuejs/vue-next/issues/2860#issuecomment-926882793](https://github.com//github.com/vuejs/vue-next/issues/2860/issues/issuecomment-926882793)
* fix(types): missing return type on `logError` (#5067) ([3c9f1a1](https://github.com/vitejs/vite/commit/3c9f1a1)), closes [#5067](https://github.com/vitejs/vite/issues/5067)
* refactor: change location of server start log messages (#5016) ([4872003](https://github.com/vitejs/vite/commit/4872003)), closes [#5016](https://github.com/vitejs/vite/issues/5016)
* workflow: switch to pnpm (#5060) ([3e1cce0](https://github.com/vitejs/vite/commit/3e1cce0)), closes [#5060](https://github.com/vitejs/vite/issues/5060)
* feat: expose `preview` method (#5014) ([9885656](https://github.com/vitejs/vite/commit/9885656)), closes [#5014](https://github.com/vitejs/vite/issues/5014)
* feat: expose `searchForWorkspaceRoot` util (#4958) ([d0f7bf1](https://github.com/vitejs/vite/commit/d0f7bf1)), closes [#4958](https://github.com/vitejs/vite/issues/4958)
* feat: server.open supports absolute path (#5068) ([2d6f682](https://github.com/vitejs/vite/commit/2d6f682)), closes [#5068](https://github.com/vitejs/vite/issues/5068)



## 2.6.0-beta.2 (2021-09-23)

* release: v2.6.0-beta.2 ([a35e56a](https://github.com/vitejs/vite/commit/a35e56a))
* fix: performance is not defined (#5048) ([20b20e4](https://github.com/vitejs/vite/commit/20b20e4)), closes [#5048](https://github.com/vitejs/vite/issues/5048)



## 2.6.0-beta.1 (2021-09-23)

* release: v2.6.0-beta.1 ([83881aa](https://github.com/vitejs/vite/commit/83881aa))
* feat: default build.minify to esbuild (#5041) ([e4892be](https://github.com/vitejs/vite/commit/e4892be)), closes [#5041](https://github.com/vitejs/vite/issues/5041)
* feat: pre transform direct imports before requests hit the server (#5037) ([57b9a37](https://github.com/vitejs/vite/commit/57b9a37)), closes [#5037](https://github.com/vitejs/vite/issues/5037)
* feat: support .astro files (#5038) ([79ff0ec](https://github.com/vitejs/vite/commit/79ff0ec)), closes [#5038](https://github.com/vitejs/vite/issues/5038)
* fix: bump js parser ecmaVersion option to 'latest', fix #5013 (#5021) ([3541ebc](https://github.com/vitejs/vite/commit/3541ebc)), closes [#5013](https://github.com/vitejs/vite/issues/5013) [#5021](https://github.com/vitejs/vite/issues/5021)
* fix: dedupe import analysis public name (#5032) ([545b1f1](https://github.com/vitejs/vite/commit/545b1f1)), closes [#5032](https://github.com/vitejs/vite/issues/5032)
* fix: exclude ?commonjs-external when building in JSON plugin (#4867) ([fe25567](https://github.com/vitejs/vite/commit/fe25567)), closes [#4867](https://github.com/vitejs/vite/issues/4867)
* fix: exclude missing dependencies from optimization during SSR (#5017) ([2204afa](https://github.com/vitejs/vite/commit/2204afa)), closes [#5017](https://github.com/vitejs/vite/issues/5017)
* fix: move peerDeps from #2042 to the right package.json ([3161d75](https://github.com/vitejs/vite/commit/3161d75)), closes [#2042](https://github.com/vitejs/vite/issues/2042)
* fix: sourcemaps windows drive letter inconsistency, fix 4964 (#4985) ([723cd63](https://github.com/vitejs/vite/commit/723cd63)), closes [#4985](https://github.com/vitejs/vite/issues/4985)
* fix: use lax range for peer deps ([35bd963](https://github.com/vitejs/vite/commit/35bd963))
* fix(ssr): handle default arguments properly in `ssrTransform` (#5040) ([6a60080](https://github.com/vitejs/vite/commit/6a60080)), closes [#5040](https://github.com/vitejs/vite/issues/5040)
* chore: fix typo (#5033) ([2c58616](https://github.com/vitejs/vite/commit/2c58616)), closes [#5033](https://github.com/vitejs/vite/issues/5033)
* chore(deps): bump rollup version (#5045) ([b19fb33](https://github.com/vitejs/vite/commit/b19fb33)), closes [#5045](https://github.com/vitejs/vite/issues/5045)
* chore(deps): update all non-major dependencies (#4992) ([5274c2e](https://github.com/vitejs/vite/commit/5274c2e)), closes [#4992](https://github.com/vitejs/vite/issues/4992)
* refactor: update import analysis plugin debugger ([2fb2561](https://github.com/vitejs/vite/commit/2fb2561))
* refactor: use performance timing for debug logs ([3ba2d7e](https://github.com/vitejs/vite/commit/3ba2d7e))
* build: avoid generating sourcemap for terser ([c932207](https://github.com/vitejs/vite/commit/c932207))
* build: fix npm package files inclusion ([12e0550](https://github.com/vitejs/vite/commit/12e0550)), closes [#3652](https://github.com/vitejs/vite/issues/3652)



## 2.6.0-beta.0 (2021-09-20)

* release: v2.6.0-beta.0 ([5240033](https://github.com/vitejs/vite/commit/5240033))
* perf: report compressed size using gzip instead of brotli due to drastic ([deb84c0](https://github.com/vitejs/vite/commit/deb84c0))
* fix: avoid wrong warning of explicit public paths (#4927) ([9e06b81](https://github.com/vitejs/vite/commit/9e06b81)), closes [#4927](https://github.com/vitejs/vite/issues/4927)
* fix: do not include css string in bundle if not needed ([3e3c203](https://github.com/vitejs/vite/commit/3e3c203))
* fix: docs for ssr manifest plugin and dedupe name (#4974) ([1bd6d56](https://github.com/vitejs/vite/commit/1bd6d56)), closes [#4974](https://github.com/vitejs/vite/issues/4974)
* fix: force overlay LTR (#4943) ([f8d8b73](https://github.com/vitejs/vite/commit/f8d8b73)), closes [#4943](https://github.com/vitejs/vite/issues/4943)
* fix: handle sourcemap: false in transformWithEsbuild ([864d41d](https://github.com/vitejs/vite/commit/864d41d))
* fix: normalize internal plugin names (#4976) ([37f0b2f](https://github.com/vitejs/vite/commit/37f0b2f)), closes [#4976](https://github.com/vitejs/vite/issues/4976)
* fix: update *.wasm type (fix #4835) (#4881) ([5e1b8d4](https://github.com/vitejs/vite/commit/5e1b8d4)), closes [#4835](https://github.com/vitejs/vite/issues/4835) [#4881](https://github.com/vitejs/vite/issues/4881)
* fix: use pkgId to get relative path (#4957) (#4961) ([b9e837a](https://github.com/vitejs/vite/commit/b9e837a)), closes [#4957](https://github.com/vitejs/vite/issues/4957) [#4961](https://github.com/vitejs/vite/issues/4961)
* fix: websocket proxies not the same as http (#4893) ([9260848](https://github.com/vitejs/vite/commit/9260848)), closes [#4893](https://github.com/vitejs/vite/issues/4893)
* fix(css): revert return sourcemap in vite:css transform (#4880) (#4951) ([72cb33e](https://github.com/vitejs/vite/commit/72cb33e)), closes [#4880](https://github.com/vitejs/vite/issues/4880) [#4951](https://github.com/vitejs/vite/issues/4951)
* fix(deps): update all non-major dependencies (#4545) ([a44fd5d](https://github.com/vitejs/vite/commit/a44fd5d)), closes [#4545](https://github.com/vitejs/vite/issues/4545)
* fix(ssr): add normalizePath to require.resolve, fix #2393 (#4980) ([417208c](https://github.com/vitejs/vite/commit/417208c)), closes [#2393](https://github.com/vitejs/vite/issues/2393) [#4980](https://github.com/vitejs/vite/issues/4980)
* chore: format (#4931) ([e59997f](https://github.com/vitejs/vite/commit/e59997f)), closes [#4931](https://github.com/vitejs/vite/issues/4931)
* chore: remove no longer needed type shim ([5acc277](https://github.com/vitejs/vite/commit/5acc277))
* refactor: tsconfck for esbuild compilerOptions tsconfig files (#4889) ([9560af8](https://github.com/vitejs/vite/commit/9560af8)), closes [#4889](https://github.com/vitejs/vite/issues/4889)
* feat: add resolve.preserveSymlinks option (#4708) ([b61b044](https://github.com/vitejs/vite/commit/b61b044)), closes [#4708](https://github.com/vitejs/vite/issues/4708)
* feat: async script module support, close #3163 (#4864) ([3984569](https://github.com/vitejs/vite/commit/3984569)), closes [#3163](https://github.com/vitejs/vite/issues/3163) [#4864](https://github.com/vitejs/vite/issues/4864)
* feat: export transformWithEsbuild (#4882) ([c8c0f74](https://github.com/vitejs/vite/commit/c8c0f74)), closes [#4882](https://github.com/vitejs/vite/issues/4882)
* feat(html): Inline entry chunk when possible (#4555) ([e687d98](https://github.com/vitejs/vite/commit/e687d98)), closes [#4555](https://github.com/vitejs/vite/issues/4555)
* docs: clarify assetsInclude (#4955) ([05fae60](https://github.com/vitejs/vite/commit/05fae60)), closes [#4955](https://github.com/vitejs/vite/issues/4955)



## <small>2.5.7 (2021-09-13)</small>

* release: v2.5.7 ([a93e03a](https://github.com/vitejs/vite/commit/a93e03a))
* feat: allow `apply` condition to be a function (#4857) ([f19282f](https://github.com/vitejs/vite/commit/f19282f)), closes [#4857](https://github.com/vitejs/vite/issues/4857)
* feat(ssr): exports `dynamicDeps` for ssrTransform, close #4898 (#4909) ([9e51a76](https://github.com/vitejs/vite/commit/9e51a76)), closes [#4898](https://github.com/vitejs/vite/issues/4898) [#4909](https://github.com/vitejs/vite/issues/4909)
* fix: compute getPkgName only when used (#4729) ([ce29273](https://github.com/vitejs/vite/commit/ce29273)), closes [#4729](https://github.com/vitejs/vite/issues/4729)
* fix: the base is duplicated in `importAnalysisBuild.ts` (#4740) ([7e929ae](https://github.com/vitejs/vite/commit/7e929ae)), closes [#4740](https://github.com/vitejs/vite/issues/4740)
* fix(css): return sourcemap in vite:css transform (#4880) ([015290a](https://github.com/vitejs/vite/commit/015290a)), closes [#4880](https://github.com/vitejs/vite/issues/4880)
* fix(esbuildDepPlugin): externalize built-in module during SSR (#4904) ([5cc4587](https://github.com/vitejs/vite/commit/5cc4587)), closes [#4904](https://github.com/vitejs/vite/issues/4904)
* chore: delete unused plugin hook 'watchChange' (#4617) ([e623b4a](https://github.com/vitejs/vite/commit/e623b4a)), closes [#4617](https://github.com/vitejs/vite/issues/4617)
* chore: give history middleware a name (#4908) ([bfbafee](https://github.com/vitejs/vite/commit/bfbafee)), closes [#4908](https://github.com/vitejs/vite/issues/4908)



## <small>2.5.6 (2021-09-08)</small>

* release: v2.5.6 ([5c5811e](https://github.com/vitejs/vite/commit/5c5811e))
* fix: use debugger for package resolution warnings (#4873) ([38de2c9](https://github.com/vitejs/vite/commit/38de2c9)), closes [#4873](https://github.com/vitejs/vite/issues/4873)
* fix(importAnalysis): properly inherit dependency version query for self imports ([c7c39b1](https://github.com/vitejs/vite/commit/c7c39b1))



## <small>2.5.5 (2021-09-08)</small>

* release: v2.5.5 ([702d503](https://github.com/vitejs/vite/commit/702d503))
* fix(hmr): should break on first matched plugin that performs custom hmr handling ([b3b8c61](https://github.com/vitejs/vite/commit/b3b8c61))
* chore: use shorthand syntax (#4872) ([fbd143a](https://github.com/vitejs/vite/commit/fbd143a)), closes [#4872](https://github.com/vitejs/vite/issues/4872)



## <small>2.5.4 (2021-09-07)</small>

* release: v2.5.4 ([4227962](https://github.com/vitejs/vite/commit/4227962))
* fix: check for Blob before creating worker URL, close #4462 (#4674) ([311026f](https://github.com/vitejs/vite/commit/311026f)), closes [#4462](https://github.com/vitejs/vite/issues/4462) [#4674](https://github.com/vitejs/vite/issues/4674)
* fix: handle error in numberToPos and formatError (#4782) ([c87763c](https://github.com/vitejs/vite/commit/c87763c)), closes [#4782](https://github.com/vitejs/vite/issues/4782)
* fix: sometimes THIS_IS_UNDEFINED warnings were still shown (#4844) ([8d956f6](https://github.com/vitejs/vite/commit/8d956f6)), closes [#4844](https://github.com/vitejs/vite/issues/4844)
* fix(css): loadPreprocessor tolerate `require.resolve.paths` not exists (#4853) ([c588b8f](https://github.com/vitejs/vite/commit/c588b8f)), closes [#4853](https://github.com/vitejs/vite/issues/4853)
* fix(overlay): handle missing customElements (#4856) ([e5b472d](https://github.com/vitejs/vite/commit/e5b472d)), closes [#4856](https://github.com/vitejs/vite/issues/4856)
* chore: surface package resolution failures (#4822) ([53271d3](https://github.com/vitejs/vite/commit/53271d3)), closes [#4822](https://github.com/vitejs/vite/issues/4822)



## <small>2.5.3 (2021-09-01)</small>

* release: v2.5.3 ([632b0ea](https://github.com/vitejs/vite/commit/632b0ea))
* fix: apply SSR externalization heuristic to devDependencies (#4699) ([0f1d6be](https://github.com/vitejs/vite/commit/0f1d6be)), closes [#4699](https://github.com/vitejs/vite/issues/4699)
* fix(resolve): normalize optimized resolved path (#4813) ([fa6475f](https://github.com/vitejs/vite/commit/fa6475f)), closes [#4813](https://github.com/vitejs/vite/issues/4813)



## <small>2.5.2 (2021-08-31)</small>

* release: v2.5.2 ([7c19e92](https://github.com/vitejs/vite/commit/7c19e92))
* chore: fix type constraint after type upgrade ([b4b9c59](https://github.com/vitejs/vite/commit/b4b9c59))
* chore: stabilize sorting of licenses (#4739) ([89960f8](https://github.com/vitejs/vite/commit/89960f8)), closes [#4739](https://github.com/vitejs/vite/issues/4739)
* feat: add `.pdf` to list of known asset types (#4752) ([d891641](https://github.com/vitejs/vite/commit/d891641)), closes [#4752](https://github.com/vitejs/vite/issues/4752)
* feat: allow custom vite env prefix (#4676) ([dfdb9cc](https://github.com/vitejs/vite/commit/dfdb9cc)), closes [#4676](https://github.com/vitejs/vite/issues/4676)
* feat: allow use of clientPort without middlewareMode (#4332) ([da0abc5](https://github.com/vitejs/vite/commit/da0abc5)), closes [#4332](https://github.com/vitejs/vite/issues/4332)
* feat(optimizer): nested optimization (#4634) ([f61ec46](https://github.com/vitejs/vite/commit/f61ec46)), closes [#4634](https://github.com/vitejs/vite/issues/4634)
* fix: decode url for middleware (#4728) ([824d042](https://github.com/vitejs/vite/commit/824d042)), closes [#4728](https://github.com/vitejs/vite/issues/4728)
* fix: don't transform new URL(url, import.meta.url) in comments (#4732) ([bf0b631](https://github.com/vitejs/vite/commit/bf0b631)), closes [#4732](https://github.com/vitejs/vite/issues/4732)
* fix: prevent pre-bundling @vite/client and @vite/env (#4716) ([e8c1906](https://github.com/vitejs/vite/commit/e8c1906)), closes [#4716](https://github.com/vitejs/vite/issues/4716)
* fix: special handling for ssr.noExternal in mergeConfig (#4766) ([689a2c8](https://github.com/vitejs/vite/commit/689a2c8)), closes [#4766](https://github.com/vitejs/vite/issues/4766)
* fix: unexpected file request with custom publicDir, fix #4629 (#4631) ([7be6c0c](https://github.com/vitejs/vite/commit/7be6c0c)), closes [#4629](https://github.com/vitejs/vite/issues/4629) [#4631](https://github.com/vitejs/vite/issues/4631)
* fix(ssr): resolve .cjs file extensions (#4772) ([96712ad](https://github.com/vitejs/vite/commit/96712ad)), closes [#4772](https://github.com/vitejs/vite/issues/4772)



## <small>2.5.1 (2021-08-24)</small>

* release: v2.5.1 ([4e092a7](https://github.com/vitejs/vite/commit/4e092a7))
* fix: __DEFINES__ is not defined is env (#4694) ([ff50c22](https://github.com/vitejs/vite/commit/ff50c22)), closes [#4694](https://github.com/vitejs/vite/issues/4694)
* fix: `Matcher` for chokidar WatchOptions#ignored (#4616) ([89e7a41](https://github.com/vitejs/vite/commit/89e7a41)), closes [#4616](https://github.com/vitejs/vite/issues/4616)
* fix: CSS dependencies are tracked incorrectly when base is set (#4592) ([633c03a](https://github.com/vitejs/vite/commit/633c03a)), closes [#4592](https://github.com/vitejs/vite/issues/4592)
* fix: enable failing dependencies to be optimised by pre-processing them with esbuild (#4275) ([ea98a1a](https://github.com/vitejs/vite/commit/ea98a1a)), closes [#4275](https://github.com/vitejs/vite/issues/4275)
* fix: surface exception when failing to resolve package entry (#4426) ([f75e508](https://github.com/vitejs/vite/commit/f75e508)), closes [#4426](https://github.com/vitejs/vite/issues/4426)
* fix(css): dynamic import css abnormal after build (#3333) ([b572f57](https://github.com/vitejs/vite/commit/b572f57)), closes [#3333](https://github.com/vitejs/vite/issues/3333)
* fix(css): minify css will transform rgba to #rrggbbaa (#4658) ([632a50a](https://github.com/vitejs/vite/commit/632a50a)), closes [#4658](https://github.com/vitejs/vite/issues/4658)
* fix(scan): do not match 'export default' in comments (#4602) ([8b85f5f](https://github.com/vitejs/vite/commit/8b85f5f)), closes [#4602](https://github.com/vitejs/vite/issues/4602)
* fix(vite): unexptected overwriting for default export fix(#4553) (#4596) ([c7929ad](https://github.com/vitejs/vite/commit/c7929ad)), closes [#4553](https://github.com/vitejs/vite/issues/4553) [#4596](https://github.com/vitejs/vite/issues/4596) [#4553](https://github.com/vitejs/vite/issues/4553)
* refactor: delete unused try catch (#4638) ([ad71494](https://github.com/vitejs/vite/commit/ad71494)), closes [#4638](https://github.com/vitejs/vite/issues/4638)
* refactor: remove unused placeholder in client.ts (#4675) ([8048f90](https://github.com/vitejs/vite/commit/8048f90)), closes [#4675](https://github.com/vitejs/vite/issues/4675)
* chore: update code comment link to contributor's guide (#4659) ([69f88eb](https://github.com/vitejs/vite/commit/69f88eb)), closes [#4659](https://github.com/vitejs/vite/issues/4659)
* chore: upgrade sirv (#4600) ([dbfd931](https://github.com/vitejs/vite/commit/dbfd931)), closes [#4600](https://github.com/vitejs/vite/issues/4600)
* feat: Add `ssr.noExternal = true` option (#4490) ([963387a](https://github.com/vitejs/vite/commit/963387a)), closes [#4490](https://github.com/vitejs/vite/issues/4490)
* feat: make redirect easier when visit a non-based page (#4618) ([b97afa7](https://github.com/vitejs/vite/commit/b97afa7)), closes [#4618](https://github.com/vitejs/vite/issues/4618)



## 2.5.0 (2021-08-16)

* release: v2.5.0 ([35ff504](https://github.com/vitejs/vite/commit/35ff504))



## 2.5.0-beta.3 (2021-08-14)

* release: v2.5.0-beta.3 ([eef51cb](https://github.com/vitejs/vite/commit/eef51cb))
* fix: add ?inline css query typings (#4570) ([c8a17a2](https://github.com/vitejs/vite/commit/c8a17a2)), closes [#4570](https://github.com/vitejs/vite/issues/4570)
* fix: skip optimizer run on non-JS script tags (#4565) ([270bd3a](https://github.com/vitejs/vite/commit/270bd3a)), closes [#4565](https://github.com/vitejs/vite/issues/4565)
* fix: support dangling comma and throw on circular dependency in tsconfig (#4590) ([f318416](https://github.com/vitejs/vite/commit/f318416)), closes [#4590](https://github.com/vitejs/vite/issues/4590)



## 2.5.0-beta.2 (2021-08-09)

* release: v2.5.0-beta.2 ([98ba8b9](https://github.com/vitejs/vite/commit/98ba8b9))
* feat: add asset name (#3028) (#3050) ([a055938](https://github.com/vitejs/vite/commit/a055938)), closes [#3028](https://github.com/vitejs/vite/issues/3028) [#3050](https://github.com/vitejs/vite/issues/3050)
* feat: import `.webmanifest` assets as URL (#4515) ([8c5ac3f](https://github.com/vitejs/vite/commit/8c5ac3f)), closes [#4515](https://github.com/vitejs/vite/issues/4515)
* feat: log a warning if dependency pre-bundling cannot be run (#4546) ([120f3b9](https://github.com/vitejs/vite/commit/120f3b9)), closes [#4546](https://github.com/vitejs/vite/issues/4546)
* fix: add missing assets to `packages/vite/client.d.ts` (#4516) ([420d82d](https://github.com/vitejs/vite/commit/420d82d)), closes [#4516](https://github.com/vitejs/vite/issues/4516)
* fix: avoid crash when a file imported in SCSS does not exist (#4505) ([a03e944](https://github.com/vitejs/vite/commit/a03e944)), closes [#4505](https://github.com/vitejs/vite/issues/4505)
* fix(client): vite-error-overlay customElement is registered twice (#4475) ([28a9612](https://github.com/vitejs/vite/commit/28a9612)), closes [#4475](https://github.com/vitejs/vite/issues/4475)
* chore: KiB instead of kb unit (#4493) ([66060ea](https://github.com/vitejs/vite/commit/66060ea)), closes [#4493](https://github.com/vitejs/vite/issues/4493)
* chore: remove unused parameter (#4521) ([2b65a07](https://github.com/vitejs/vite/commit/2b65a07)), closes [#4521](https://github.com/vitejs/vite/issues/4521)



## 2.5.0-beta.1 (2021-08-04)

* release: v2.5.0-beta.1 ([8178628](https://github.com/vitejs/vite/commit/8178628))
* feat: add `logger.hasErrorLogged(error)` method (#3957) ([fb406ce](https://github.com/vitejs/vite/commit/fb406ce)), closes [#3957](https://github.com/vitejs/vite/issues/3957)
* fix: change the preview default mode from `development` to `production` (#4483) ([77933ba](https://github.com/vitejs/vite/commit/77933ba)), closes [#4483](https://github.com/vitejs/vite/issues/4483)
* fix: close vite dev server before creating new one (#4374) ([9e4572e](https://github.com/vitejs/vite/commit/9e4572e)), closes [#4374](https://github.com/vitejs/vite/issues/4374)
* fix: register files added by addWatchFile() as current module's dependency ([db4ba56](https://github.com/vitejs/vite/commit/db4ba56)), closes [#3216](https://github.com/vitejs/vite/issues/3216)
* chore: apply lint ([e793a91](https://github.com/vitejs/vite/commit/e793a91))
* chore: remove unnecessary async ([c8e42d7](https://github.com/vitejs/vite/commit/c8e42d7))
* refactor: isCSSRequest for all css (#4484) ([7ad8ba2](https://github.com/vitejs/vite/commit/7ad8ba2)), closes [#4484](https://github.com/vitejs/vite/issues/4484)



## 2.5.0-beta.0 (2021-08-03)

* release: plugin-legacy@1.5.1 ([365e3ad](https://github.com/vitejs/vite/commit/365e3ad))
* release: v2.5.0-beta.0 ([0c8656e](https://github.com/vitejs/vite/commit/0c8656e))
* fix: @vite/client http request is 404 not found (#4187) ([21ecdac](https://github.com/vitejs/vite/commit/21ecdac)), closes [#4187](https://github.com/vitejs/vite/issues/4187)
* fix: config port timing, fix #4094 (#4104) ([6b98fdd](https://github.com/vitejs/vite/commit/6b98fdd)), closes [#4094](https://github.com/vitejs/vite/issues/4094) [#4104](https://github.com/vitejs/vite/issues/4104)
* fix: import sass file even if not listed in package.json (#3627) ([a5b2b4f](https://github.com/vitejs/vite/commit/a5b2b4f)), closes [#3627](https://github.com/vitejs/vite/issues/3627)
* fix: mixed match result of importMetaUrl (#4482) ([86f673a](https://github.com/vitejs/vite/commit/86f673a)), closes [#4482](https://github.com/vitejs/vite/issues/4482)
* fix: overwrite configEnv.mode if the user explicitly set mode option (fix #4441) (#4437) ([7d340a6](https://github.com/vitejs/vite/commit/7d340a6)), closes [#4441](https://github.com/vitejs/vite/issues/4441) [#4437](https://github.com/vitejs/vite/issues/4437)
* fix: preserve base in HMR for CSS referenced in link tags (#4407) ([a06b26b](https://github.com/vitejs/vite/commit/a06b26b)), closes [#4407](https://github.com/vitejs/vite/issues/4407)
* fix: the return value of resolve by adding a namespace when processing a '@' in filter (#3534) ([d4e979f](https://github.com/vitejs/vite/commit/d4e979f)), closes [#3534](https://github.com/vitejs/vite/issues/3534)
* fix: update dependency @rollup/plugin-commonjs to v20, fix #2623 (#4469) ([f9e5d63](https://github.com/vitejs/vite/commit/f9e5d63)), closes [#2623](https://github.com/vitejs/vite/issues/2623) [#4469](https://github.com/vitejs/vite/issues/4469)
* fix(build): fix define plugin spread operations (#4397) ([bd7c148](https://github.com/vitejs/vite/commit/bd7c148)), closes [#4397](https://github.com/vitejs/vite/issues/4397)
* fix(build): respect rollup output.assetFileNames, fix #2944 (#4352) ([cbd0458](https://github.com/vitejs/vite/commit/cbd0458)), closes [#2944](https://github.com/vitejs/vite/issues/2944) [#4352](https://github.com/vitejs/vite/issues/4352)
* fix(deps): update all non-major dependencies (#4468) ([cd54a22](https://github.com/vitejs/vite/commit/cd54a22)), closes [#4468](https://github.com/vitejs/vite/issues/4468)
* fix(html): cover more cases in bodyPrependInjectRE (#4474) ([40c51e1](https://github.com/vitejs/vite/commit/40c51e1)), closes [#4474](https://github.com/vitejs/vite/issues/4474)
* fix(scan): improve import regex and allow multiline comments (#4088) ([76dbef6](https://github.com/vitejs/vite/commit/76dbef6)), closes [#4088](https://github.com/vitejs/vite/issues/4088)
* fix(server): keep port when modifying the config file (#4460) ([056b17e](https://github.com/vitejs/vite/commit/056b17e)), closes [#4460](https://github.com/vitejs/vite/issues/4460)
* deps: update esbuild to 12.17 (#4480) ([5b85f0f](https://github.com/vitejs/vite/commit/5b85f0f)), closes [#4480](https://github.com/vitejs/vite/issues/4480)
* feat: implement custom logger (#2521) ([59841f0](https://github.com/vitejs/vite/commit/59841f0)), closes [#2521](https://github.com/vitejs/vite/issues/2521)
* feat: minify css with esbuild, deprecate build.cleanCssOptions (#4371) ([4454688](https://github.com/vitejs/vite/commit/4454688)), closes [#4371](https://github.com/vitejs/vite/issues/4371)
* feat: modulepreload polyfill (#4058) ([cb75dbd](https://github.com/vitejs/vite/commit/cb75dbd)), closes [#4058](https://github.com/vitejs/vite/issues/4058)
* feat: respect tsconfig options that affects compilation results (#4279) ([2986f6e](https://github.com/vitejs/vite/commit/2986f6e)), closes [#4279](https://github.com/vitejs/vite/issues/4279)
* feat(css): support css module compose/from path resolution (#4378) ([690b35e](https://github.com/vitejs/vite/commit/690b35e)), closes [#4378](https://github.com/vitejs/vite/issues/4378)
* feat(ssr): tolerate circular imports (#3950) ([69f91a1](https://github.com/vitejs/vite/commit/69f91a1)), closes [#3950](https://github.com/vitejs/vite/issues/3950)
* docs: document debug logging (#4457) ([1e711c0](https://github.com/vitejs/vite/commit/1e711c0)), closes [#4457](https://github.com/vitejs/vite/issues/4457)
* refactor: cli mode options to common, reorder GlobalCLIOptions (#4431) ([304cc6b](https://github.com/vitejs/vite/commit/304cc6b)), closes [#4431](https://github.com/vitejs/vite/issues/4431)
* refactor: deprecate polyfillDynamicImport (#4373) ([318cb43](https://github.com/vitejs/vite/commit/318cb43)), closes [#4373](https://github.com/vitejs/vite/issues/4373)
* types: prefer auto inference (#4434) ([1134fd0](https://github.com/vitejs/vite/commit/1134fd0)), closes [#4434](https://github.com/vitejs/vite/issues/4434)
* build: emit .d.ts files during `yarn dev` (#4413) ([ecbc869](https://github.com/vitejs/vite/commit/ecbc869)), closes [#4413](https://github.com/vitejs/vite/issues/4413)
* chore: update vite v2.4.4 changelog (#4404) ([df3d937](https://github.com/vitejs/vite/commit/df3d937)), closes [#4404](https://github.com/vitejs/vite/issues/4404)



## <small>2.4.4 (2021-07-27)</small>

* release: v2.4.4 ([8aa47ed](https://github.com/vitejs/vite/commit/8aa47ed))
* fix: --https get ignored in preview (#4318) ([a870584](https://github.com/vitejs/vite/commit/a870584)), closes [#4318](https://github.com/vitejs/vite/issues/4318)
* fix: don't interact with res if refresh has happened (#4370) ([c90b7d9](https://github.com/vitejs/vite/commit/c90b7d9)), closes [#4370](https://github.com/vitejs/vite/issues/4370)
* fix: fix pre-bundling executes multiple times (#3640) ([41a00df](https://github.com/vitejs/vite/commit/41a00df)), closes [#3640](https://github.com/vitejs/vite/issues/3640)
* fix: ignore ENOENT in `injectSourcesContent` (#2904) ([0693d03](https://github.com/vitejs/vite/commit/0693d03)), closes [#2904](https://github.com/vitejs/vite/issues/2904)
* fix: provide build load fallback for arbitrary request with queries ([f097aa1](https://github.com/vitejs/vite/commit/f097aa1))
* fix(css): cachedPostcssConfig reused for multiple builds (#3906) ([3a97644](https://github.com/vitejs/vite/commit/3a97644)), closes [#3906](https://github.com/vitejs/vite/issues/3906)
* fix(deps): update all non-major dependencies (#4387) ([2f900ba](https://github.com/vitejs/vite/commit/2f900ba)), closes [#4387](https://github.com/vitejs/vite/issues/4387)
* Handle imports from dot directories (#3739) ([f4f0100](https://github.com/vitejs/vite/commit/f4f0100)), closes [#3739](https://github.com/vitejs/vite/issues/3739)
* feat: support ?inline css query to avoid css insertion ([e1de8a8](https://github.com/vitejs/vite/commit/e1de8a8))
* chore: remove usage of querystring (#4342) ([828a8e5](https://github.com/vitejs/vite/commit/828a8e5)), closes [#4342](https://github.com/vitejs/vite/issues/4342)
* chore(types): remove unnecessary type assertions (#4356) ([a1f6ac9](https://github.com/vitejs/vite/commit/a1f6ac9)), closes [#4356](https://github.com/vitejs/vite/issues/4356)
* refactor: use utils.isObject insteads of typeof (#4330) ([514e124](https://github.com/vitejs/vite/commit/514e124)), closes [#4330](https://github.com/vitejs/vite/issues/4330)



## <small>2.4.3 (2021-07-20)</small>

* release: v2.4.3 ([dabc42a](https://github.com/vitejs/vite/commit/dabc42a))
* fix: call createFileOnlyEntry() only for CSS deps, fix #4150 (#4267) ([89e3160](https://github.com/vitejs/vite/commit/89e3160)), closes [#4150](https://github.com/vitejs/vite/issues/4150) [#4267](https://github.com/vitejs/vite/issues/4267)
* fix: correctly ignore optional deps when bundling vite deps (#4223) ([b5ab77d](https://github.com/vitejs/vite/commit/b5ab77d)), closes [#4223](https://github.com/vitejs/vite/issues/4223) [#3977](https://github.com/vitejs/vite/issues/3977) [#3850](https://github.com/vitejs/vite/issues/3850)
* fix: do not end process in middleware mode, fix #4196 (#4232) ([1c994f8](https://github.com/vitejs/vite/commit/1c994f8)), closes [#4196](https://github.com/vitejs/vite/issues/4196) [#4232](https://github.com/vitejs/vite/issues/4232)
* fix: improve indent of built html file (#4227) ([0316f14](https://github.com/vitejs/vite/commit/0316f14)), closes [#4227](https://github.com/vitejs/vite/issues/4227)
* fix: nested dependencies from sub node_modules, fix #3254 (#4091) ([b465d3e](https://github.com/vitejs/vite/commit/b465d3e)), closes [#3254](https://github.com/vitejs/vite/issues/3254) [#4091](https://github.com/vitejs/vite/issues/4091)
* fix(dev): only rewrite SSR stacktrace when possible (#4248) ([887c247](https://github.com/vitejs/vite/commit/887c247)), closes [#4248](https://github.com/vitejs/vite/issues/4248)
* fix(util): copyDir may cause an infinite loop (#4310) ([da64197](https://github.com/vitejs/vite/commit/da64197)), closes [#4310](https://github.com/vitejs/vite/issues/4310)
* chore: no implicit any for local vars (#4314) ([016b5d1](https://github.com/vitejs/vite/commit/016b5d1)), closes [#4314](https://github.com/vitejs/vite/issues/4314)
* chore: simplify relative path import (#4323) ([244b15b](https://github.com/vitejs/vite/commit/244b15b)), closes [#4323](https://github.com/vitejs/vite/issues/4323)
* chore: use eslint rule eqeqeq (#4234) ([732d60c](https://github.com/vitejs/vite/commit/732d60c)), closes [#4234](https://github.com/vitejs/vite/issues/4234)
* chore(deps): update all non-major dependencies (#4309) ([02e45a0](https://github.com/vitejs/vite/commit/02e45a0)), closes [#4309](https://github.com/vitejs/vite/issues/4309)
* feat: `vite preview` port is used automatically `+1` (#4219) ([179a057](https://github.com/vitejs/vite/commit/179a057)), closes [#4219](https://github.com/vitejs/vite/issues/4219)
* feat: enable usage of function as library fileName, close #3585 (#3625) ([772b2f7](https://github.com/vitejs/vite/commit/772b2f7)), closes [#3585](https://github.com/vitejs/vite/issues/3585) [#3625](https://github.com/vitejs/vite/issues/3625)
* feat: extract `config.base` in `importAnalysisBuild.ts` (#4096) ([ab59598](https://github.com/vitejs/vite/commit/ab59598)), closes [#4096](https://github.com/vitejs/vite/issues/4096)
* feat: library mode does not include preload (#4097) ([decc7d8](https://github.com/vitejs/vite/commit/decc7d8)), closes [#4097](https://github.com/vitejs/vite/issues/4097)



## <small>2.4.2 (2021-07-12)</small>

* release: v2.4.2 ([9821bea](https://github.com/vitejs/vite/commit/9821bea))
* chore(deps): update all non-major dependencies (#4213) ([0f45c21](https://github.com/vitejs/vite/commit/0f45c21)), closes [#4213](https://github.com/vitejs/vite/issues/4213)
* build: use `rollup -w` for dev bundling (#4183) ([25d86eb](https://github.com/vitejs/vite/commit/25d86eb)), closes [#4183](https://github.com/vitejs/vite/issues/4183)
* fix: __VITE_PRELOAD__ replacement error (#4163) ([d377aae](https://github.com/vitejs/vite/commit/d377aae)), closes [#4163](https://github.com/vitejs/vite/issues/4163) [#3051](https://github.com/vitejs/vite/issues/3051)
* fix: shutdown process after closing server (#4082) ([eac779c](https://github.com/vitejs/vite/commit/eac779c)), closes [#4082](https://github.com/vitejs/vite/issues/4082)
* fix(build): resolve license files correctly (#4149) ([bf32b41](https://github.com/vitejs/vite/commit/bf32b41)), closes [#4149](https://github.com/vitejs/vite/issues/4149)
* fix(utils): add dot-all flag to match all characters, fix #3761 (#3780) ([b9cdfbe](https://github.com/vitejs/vite/commit/b9cdfbe)), closes [#3761](https://github.com/vitejs/vite/issues/3761) [#3780](https://github.com/vitejs/vite/issues/3780)
* feat: cache certificate (#3642) ([5dd670f](https://github.com/vitejs/vite/commit/5dd670f)), closes [#3642](https://github.com/vitejs/vite/issues/3642)



## <small>2.4.1 (2021-07-06)</small>

* release: v2.4.1 ([c115e19](https://github.com/vitejs/vite/commit/c115e19))
* chore: regenerate license file (#4143) ([34a8137](https://github.com/vitejs/vite/commit/34a8137)), closes [#4143](https://github.com/vitejs/vite/issues/4143)
* chore: remove unused cache (#4129) ([8530151](https://github.com/vitejs/vite/commit/8530151)), closes [#4129](https://github.com/vitejs/vite/issues/4129)
* chore(deps): update all non-major dependencies (#4117) ([e30ce56](https://github.com/vitejs/vite/commit/e30ce56)), closes [#4117](https://github.com/vitejs/vite/issues/4117)
* chore(deps): update dependency open to v8 (#4137) ([4227f35](https://github.com/vitejs/vite/commit/4227f35)), closes [#4137](https://github.com/vitejs/vite/issues/4137)
* fix: specify full filepath to importMeta.d.ts, fix #4125 (#4138) ([3bc1d78](https://github.com/vitejs/vite/commit/3bc1d78)), closes [#4125](https://github.com/vitejs/vite/issues/4125) [#4138](https://github.com/vitejs/vite/issues/4138)
* fix(hmr): html registered as a PostCSS dependency, fix #3716 (#4127) ([09c6c94](https://github.com/vitejs/vite/commit/09c6c94)), closes [#3716](https://github.com/vitejs/vite/issues/3716) [#4127](https://github.com/vitejs/vite/issues/4127)



## 2.4.0 (2021-07-05)

* release: v2.4.0 ([dc61819](https://github.com/vitejs/vite/commit/dc61819))



## 2.4.0-beta.3 (2021-07-02)

* release: v2.4.0-beta.3 ([e44343a](https://github.com/vitejs/vite/commit/e44343a))
* fix: add `type: "module"` hint to cache directory (#4063) ([58a29b2](https://github.com/vitejs/vite/commit/58a29b2)), closes [#4063](https://github.com/vitejs/vite/issues/4063)
* fix: allow preprocessor to be installed outside of the root directory (#3988) ([a0a80f8](https://github.com/vitejs/vite/commit/a0a80f8)), closes [#3988](https://github.com/vitejs/vite/issues/3988)
* fix: Avoid importing in source that __vitePreload has declared (close #4016) (#4041) ([bd34203](https://github.com/vitejs/vite/commit/bd34203)), closes [#4016](https://github.com/vitejs/vite/issues/4016) [#4041](https://github.com/vitejs/vite/issues/4041)
* fix: ensure that esbuild uses the same working directory as Vite (#4001) ([19abafe](https://github.com/vitejs/vite/commit/19abafe)), closes [#4001](https://github.com/vitejs/vite/issues/4001)
* fix: fix esbuild break when importRe matches multiline import (#4054) ([eb2e41b](https://github.com/vitejs/vite/commit/eb2e41b)), closes [#4054](https://github.com/vitejs/vite/issues/4054)
* fix: skip redirect and error fallback on middleware mode (#4057) ([d156a9f](https://github.com/vitejs/vite/commit/d156a9f)), closes [#4057](https://github.com/vitejs/vite/issues/4057)
* fix: the current main branch code build the vite project error (#4059) ([4adc970](https://github.com/vitejs/vite/commit/4adc970)), closes [#4059](https://github.com/vitejs/vite/issues/4059)
* fix: use `.mjs` extension for injected client modules (#4061) ([cca92c4](https://github.com/vitejs/vite/commit/cca92c4)), closes [#4061](https://github.com/vitejs/vite/issues/4061)
* fix: use path type import, fix #4028 (#4031) ([e092e89](https://github.com/vitejs/vite/commit/e092e89)), closes [#4028](https://github.com/vitejs/vite/issues/4028) [#4031](https://github.com/vitejs/vite/issues/4031)
* fix(ssr): Transform named default exports without altering scope (#4053) ([5211aaf](https://github.com/vitejs/vite/commit/5211aaf)), closes [#4053](https://github.com/vitejs/vite/issues/4053)



## 2.4.0-beta.2 (2021-06-29)

* release: v2.4.0-beta.2 ([f981fb5](https://github.com/vitejs/vite/commit/f981fb5))
* fix: revert resolve nested dependencies #3753 (#4019) ([b6f4293](https://github.com/vitejs/vite/commit/b6f4293)), closes [#3753](https://github.com/vitejs/vite/issues/3753) [#4019](https://github.com/vitejs/vite/issues/4019) [#4005](https://github.com/vitejs/vite/issues/4005)
* fix(commonjs): `ignoreDynamicRequires` should default to `false` (#4015) ([c08069c](https://github.com/vitejs/vite/commit/c08069c)), closes [#4015](https://github.com/vitejs/vite/issues/4015) [/github.com/vitejs/vite/pull/3353#issuecomment-851520683](https://github.com//github.com/vitejs/vite/pull/3353/issues/issuecomment-851520683) [#3426](https://github.com/vitejs/vite/issues/3426) [#3997](https://github.com/vitejs/vite/issues/3997)
* fix(css): skip comma when matching css url (#4004) ([7d0bc26](https://github.com/vitejs/vite/commit/7d0bc26)), closes [#4004](https://github.com/vitejs/vite/issues/4004)



## 2.4.0-beta.1 (2021-06-29)

* release: v2.4.0-beta.1 ([264bc43](https://github.com/vitejs/vite/commit/264bc43))
* feat: allow passing options to rollupjs dynamic import vars plugin (#3047) ([5507b4c](https://github.com/vitejs/vite/commit/5507b4c)), closes [#3047](https://github.com/vitejs/vite/issues/3047)
* chore: remove unused import ([da044db](https://github.com/vitejs/vite/commit/da044db))
* chore: update changelog ([f3643d8](https://github.com/vitejs/vite/commit/f3643d8))
* chore(deps): update all non-major dependencies (#3986) ([ed35c5c](https://github.com/vitejs/vite/commit/ed35c5c)), closes [#3986](https://github.com/vitejs/vite/issues/3986)
* chore(deps): update dependency dotenv to v10 (#3987) ([b3a2139](https://github.com/vitejs/vite/commit/b3a2139)), closes [#3987](https://github.com/vitejs/vite/issues/3987)
* chore(deps): update dependency estree-walker to v3 (#3991) ([334ba1d](https://github.com/vitejs/vite/commit/334ba1d)), closes [#3991](https://github.com/vitejs/vite/issues/3991)
* chore(deps): update dependency postcss-import to v14 (#3994) ([37eab20](https://github.com/vitejs/vite/commit/37eab20)), closes [#3994](https://github.com/vitejs/vite/issues/3994)
* fix(hmr): entry mod's importers contains css mod invalidate hmr (#3929) ([d97b33a](https://github.com/vitejs/vite/commit/d97b33a)), closes [#3929](https://github.com/vitejs/vite/issues/3929)
* fix(types): correct import of types (#4003) ([4954636](https://github.com/vitejs/vite/commit/4954636)), closes [#4003](https://github.com/vitejs/vite/issues/4003)



## 2.4.0-beta.0 (2021-06-27)

* release: v2.4.0-beta.0 ([17c62b8](https://github.com/vitejs/vite/commit/17c62b8))
* fix: do not end server process in CI (#3659) ([5999444](https://github.com/vitejs/vite/commit/5999444)), closes [#3659](https://github.com/vitejs/vite/issues/3659)
* fix: missing styles with build watch (#3742) (#3887) ([c9a6efe](https://github.com/vitejs/vite/commit/c9a6efe)), closes [#3742](https://github.com/vitejs/vite/issues/3742) [#3887](https://github.com/vitejs/vite/issues/3887)
* fix: multiple css url separation (fix #3922) (#3926) ([2d01e62](https://github.com/vitejs/vite/commit/2d01e62)), closes [#3922](https://github.com/vitejs/vite/issues/3922) [#3926](https://github.com/vitejs/vite/issues/3926)
* fix: only downgrade target to es2019 when actually using terser ([bd8723e](https://github.com/vitejs/vite/commit/bd8723e))
* fix: resolve nested dependencies (#3254) (#3753) ([8467f64](https://github.com/vitejs/vite/commit/8467f64)), closes [#3254](https://github.com/vitejs/vite/issues/3254) [#3753](https://github.com/vitejs/vite/issues/3753) [#3254](https://github.com/vitejs/vite/issues/3254)
* fix(build): bundle non-inlined workers with rollup (#2494) ([18a2208](https://github.com/vitejs/vite/commit/18a2208)), closes [#2494](https://github.com/vitejs/vite/issues/2494)
* fix(css): file or contents missing error in build watch (#3742) (#3747) ([26b1b99](https://github.com/vitejs/vite/commit/26b1b99)), closes [#3742](https://github.com/vitejs/vite/issues/3742) [#3747](https://github.com/vitejs/vite/issues/3747)
* fix(deps): update all non-major dependencies (#3878) ([a66a805](https://github.com/vitejs/vite/commit/a66a805)), closes [#3878](https://github.com/vitejs/vite/issues/3878)
* fix(scan): 'for await' support in script setup for dev server (#3889) ([dd46cd1](https://github.com/vitejs/vite/commit/dd46cd1)), closes [#3889](https://github.com/vitejs/vite/issues/3889)
* fix(scan): avoid breaking html comment regex inside script of scanned html-like files ([bb095db](https://github.com/vitejs/vite/commit/bb095db))
* fix(ssr): fix binding overwrite at nested function, fix #3856 (#3869) ([85f51c1](https://github.com/vitejs/vite/commit/85f51c1)), closes [#3856](https://github.com/vitejs/vite/issues/3856) [#3869](https://github.com/vitejs/vite/issues/3869)
* fix(ssr): normalize manifest filenames (#3706) ([aa8ca3f](https://github.com/vitejs/vite/commit/aa8ca3f)), closes [#3706](https://github.com/vitejs/vite/issues/3706) [#3303](https://github.com/vitejs/vite/issues/3303)
* fix(ssr): not flatten export * as (fix #3934) (#3954) ([7381d27](https://github.com/vitejs/vite/commit/7381d27)), closes [#3934](https://github.com/vitejs/vite/issues/3934) [#3954](https://github.com/vitejs/vite/issues/3954)
* fix(ssr): not importing browser exports, fix #3772 (#3933) ([f623ba3](https://github.com/vitejs/vite/commit/f623ba3)), closes [#3772](https://github.com/vitejs/vite/issues/3772) [#3933](https://github.com/vitejs/vite/issues/3933)
* refactor: deprecated `server.fs.root` in favor of `server.fs.allow` (#3968) ([1491460](https://github.com/vitejs/vite/commit/1491460)), closes [#3968](https://github.com/vitejs/vite/issues/3968)
* refactor: remove useless capture group ([1222727](https://github.com/vitejs/vite/commit/1222727))
* chore: remove unused `open-in-editor` dep (#3901) ([87b3a6e](https://github.com/vitejs/vite/commit/87b3a6e)), closes [#3901](https://github.com/vitejs/vite/issues/3901)
* chore: update deps LICENSE ([acb9a50](https://github.com/vitejs/vite/commit/acb9a50))
* chore(changelog): remove broken link [skip ci] (#3870) ([627e26c](https://github.com/vitejs/vite/commit/627e26c)), closes [#3870](https://github.com/vitejs/vite/issues/3870)
* chore(deps): update dependency clean-css to v5 (#3879) ([6ec1d2d](https://github.com/vitejs/vite/commit/6ec1d2d)), closes [#3879](https://github.com/vitejs/vite/issues/3879)
* refactor!: rename `server.fsServe` to `server.fs` (#3965) ([5551dff](https://github.com/vitejs/vite/commit/5551dff)), closes [#3965](https://github.com/vitejs/vite/issues/3965)
* build: fix build after upgrade ([480ee13](https://github.com/vitejs/vite/commit/480ee13))
* feat: add client events to import.meta.hot.on (#3638) ([de1ddd4](https://github.com/vitejs/vite/commit/de1ddd4)), closes [#3638](https://github.com/vitejs/vite/issues/3638)
* feat: fs-serve import graph awareness (#3784) ([c45a02f](https://github.com/vitejs/vite/commit/c45a02f)), closes [#3784](https://github.com/vitejs/vite/issues/3784)
* feat: generate inline sourcemaps for bundled vite.config.js files (#3949) ([cff2fcd](https://github.com/vitejs/vite/commit/cff2fcd)), closes [#3949](https://github.com/vitejs/vite/issues/3949)
* feat: support for regex for ssr.noExternal (#3819) ([330c94c](https://github.com/vitejs/vite/commit/330c94c)), closes [#3819](https://github.com/vitejs/vite/issues/3819)
* feat: support new URL(url, import.meta.url) usage ([4cbb40d](https://github.com/vitejs/vite/commit/4cbb40d))



## <small>2.3.8 (2021-06-19)</small>

* release: v2.3.8 ([6e3653f](https://github.com/vitejs/vite/commit/6e3653f))
* fix: ?import with trailing = added by some servers (#3805) ([460d1cd](https://github.com/vitejs/vite/commit/460d1cd)), closes [#3805](https://github.com/vitejs/vite/issues/3805)
* fix: don't replace `process.env` if `process` not global variable (#3703) ([5aeadb7](https://github.com/vitejs/vite/commit/5aeadb7)), closes [#3703](https://github.com/vitejs/vite/issues/3703)
* fix: upgrade esbuild for esm compatibility (#3718) ([dbb5eab](https://github.com/vitejs/vite/commit/dbb5eab)), closes [#3718](https://github.com/vitejs/vite/issues/3718) [/github.com/evanw/esbuild/blob/master/CHANGELOG.md#0127](https://github.com//github.com/evanw/esbuild/blob/master/CHANGELOG.md/issues/0127) [#3399](https://github.com/vitejs/vite/issues/3399) [#3413](https://github.com/vitejs/vite/issues/3413)
* fix(css): filter out function name suffixes with url (#3752) ([9aa255a](https://github.com/vitejs/vite/commit/9aa255a)), closes [#3752](https://github.com/vitejs/vite/issues/3752)
* fix(deps): update all non-major dependencies (#3791) ([74d409e](https://github.com/vitejs/vite/commit/74d409e)), closes [#3791](https://github.com/vitejs/vite/issues/3791)
* fix(hmr): always invalidate all affected modules ([e048114](https://github.com/vitejs/vite/commit/e048114))
* fix(hmr): avoid css propagation infinite loop ([7362e6e](https://github.com/vitejs/vite/commit/7362e6e))
* fix(hmr): avoid duplicated modules for css dependency ([385ced9](https://github.com/vitejs/vite/commit/385ced9))
* fix(hmr/css): check CSS importers for hmr boundaries - fix Tailwind 2.2 compat ([6eaec3a](https://github.com/vitejs/vite/commit/6eaec3a))
* fix(hmr/css): fix infinite recursion on hmr (#3865) ([0d5726f](https://github.com/vitejs/vite/commit/0d5726f)), closes [#3865](https://github.com/vitejs/vite/issues/3865)
* chore: adjust file module matching for windows ([41b193c](https://github.com/vitejs/vite/commit/41b193c))
* chore: typo (#3720) ([18c84cb](https://github.com/vitejs/vite/commit/18c84cb)), closes [#3720](https://github.com/vitejs/vite/issues/3720)
* chore: typo (#3836) ([3bff06e](https://github.com/vitejs/vite/commit/3bff06e)), closes [#3836](https://github.com/vitejs/vite/issues/3836)
* chore: update deps (#3807) ([b146e94](https://github.com/vitejs/vite/commit/b146e94)), closes [#3807](https://github.com/vitejs/vite/issues/3807)
* chore: use `prompts` and remove `enquirer` (#3812) ([3d5c697](https://github.com/vitejs/vite/commit/3d5c697)), closes [#3812](https://github.com/vitejs/vite/issues/3812)
* chore(deps): update dependency @rollup/plugin-node-resolve to v13 (#3792) ([076c5a4](https://github.com/vitejs/vite/commit/076c5a4)), closes [#3792](https://github.com/vitejs/vite/issues/3792)
* chore(deps): update dependency acorn-class-fields to v1 (#3794) ([2b2b962](https://github.com/vitejs/vite/commit/2b2b962)), closes [#3794](https://github.com/vitejs/vite/issues/3794)
* chore(deps): update dependency acorn-static-class-features to v1 (#3795) ([ce459e3](https://github.com/vitejs/vite/commit/ce459e3)), closes [#3795](https://github.com/vitejs/vite/issues/3795)
* feat: allow 'hidden' sourcemap to remove //# sourceMappingURL from generated maps (#3684) ([19e479b](https://github.com/vitejs/vite/commit/19e479b)), closes [#3684](https://github.com/vitejs/vite/issues/3684)
* refactor: clean Windows recognition (#3724) ([0b6c7f2](https://github.com/vitejs/vite/commit/0b6c7f2)), closes [#3724](https://github.com/vitejs/vite/issues/3724)



## <small>2.3.7 (2021-06-08)</small>

* release: v2.3.7 ([94562d7](https://github.com/vitejs/vite/commit/94562d7))
* feat(css): support postcss dir-dependency message type (#3707) ([665d438](https://github.com/vitejs/vite/commit/665d438)), closes [#3707](https://github.com/vitejs/vite/issues/3707)
* chore: `files` instead of `.npmignore` for better readability (#3694) ([f525a36](https://github.com/vitejs/vite/commit/f525a36)), closes [#3694](https://github.com/vitejs/vite/issues/3694) [/github.com/vitejs/vite/pull/3656#issuecomment-855526900](https://github.com//github.com/vitejs/vite/pull/3656/issues/issuecomment-855526900)
* chore(deps): update typescript to v4.3 (#3557) ([f66dce4](https://github.com/vitejs/vite/commit/f66dce4)), closes [#3557](https://github.com/vitejs/vite/issues/3557)
* fix: Include src files in vite npm bundle (for sourcemaps) (#3656) ([294d8b4](https://github.com/vitejs/vite/commit/294d8b4)), closes [#3656](https://github.com/vitejs/vite/issues/3656)
* fix: show error message above the stack when HMR overlay is disabled (#3677) ([6b4c355](https://github.com/vitejs/vite/commit/6b4c355)), closes [#3677](https://github.com/vitejs/vite/issues/3677)
* fix: tolerant fs error in formatError (#3665) ([5146cc5](https://github.com/vitejs/vite/commit/5146cc5)), closes [#3665](https://github.com/vitejs/vite/issues/3665)
* fix: update `sirv` to decode url in preview (#3680) ([0430127](https://github.com/vitejs/vite/commit/0430127)), closes [#3680](https://github.com/vitejs/vite/issues/3680)



## <small>2.3.6 (2021-06-02)</small>

* release: v2.3.6 ([dfab3ed](https://github.com/vitejs/vite/commit/dfab3ed))
* fix: revert avoid css leaking into emitted javascript (#3402) (#3630) ([91eb2a6](https://github.com/vitejs/vite/commit/91eb2a6)), closes [#3402](https://github.com/vitejs/vite/issues/3402) [#3630](https://github.com/vitejs/vite/issues/3630)
* fix(types): add '*?.sharedworker' typing (#3618) ([690ff99](https://github.com/vitejs/vite/commit/690ff99)), closes [#3618](https://github.com/vitejs/vite/issues/3618)
* chore(cli): change logLevel help option to v2 options (#3619) ([8b4075d](https://github.com/vitejs/vite/commit/8b4075d)), closes [#3619](https://github.com/vitejs/vite/issues/3619)



## <small>2.3.5 (2021-06-01)</small>

* release: v2.3.5 ([22f012b](https://github.com/vitejs/vite/commit/22f012b))
* feat: added clientPort to HmrOptions (#3578) ([7db69a3](https://github.com/vitejs/vite/commit/7db69a3)), closes [#3578](https://github.com/vitejs/vite/issues/3578)
* feat(config): add `envDir` option (#3407) ([472ba5d](https://github.com/vitejs/vite/commit/472ba5d)), closes [#3407](https://github.com/vitejs/vite/issues/3407)
* feat(plugins/worker): support SharedWorker (resolve #2093) (#2505) ([d78191c](https://github.com/vitejs/vite/commit/d78191c)), closes [#2093](https://github.com/vitejs/vite/issues/2093) [#2505](https://github.com/vitejs/vite/issues/2505)
* feat(ssr): include non-CSS assets in the manifest (#3556) ([adc7170](https://github.com/vitejs/vite/commit/adc7170)), closes [#3556](https://github.com/vitejs/vite/issues/3556)
* docs(hmr): document hmr.server option (fix #3587) (#3590) ([a30724c](https://github.com/vitejs/vite/commit/a30724c)), closes [#3587](https://github.com/vitejs/vite/issues/3587) [#3590](https://github.com/vitejs/vite/issues/3590)
* fix: cannot recognize JS url correctly(#3568) (#3572) ([ab08652](https://github.com/vitejs/vite/commit/ab08652)), closes [#3568](https://github.com/vitejs/vite/issues/3568) [#3572](https://github.com/vitejs/vite/issues/3572)
* fix: update esbuild to 0.12 (#3570) ([421c530](https://github.com/vitejs/vite/commit/421c530)), closes [#3570](https://github.com/vitejs/vite/issues/3570)
* fix(tests): fix tests run fail in the Chinese directory (#3586) ([3cab2c2](https://github.com/vitejs/vite/commit/3cab2c2)), closes [#3586](https://github.com/vitejs/vite/issues/3586)



## <small>2.3.4 (2021-05-25)</small>

* release: v2.3.4 ([9d940e2](https://github.com/vitejs/vite/commit/9d940e2))
* fix: allow passing an array as sass / scss importer (#3529) ([e344cdd](https://github.com/vitejs/vite/commit/e344cdd)), closes [#3529](https://github.com/vitejs/vite/issues/3529)
* fix: avoid css leaking into emitted javascript (#3402) ([65d333d](https://github.com/vitejs/vite/commit/65d333d)), closes [#3402](https://github.com/vitejs/vite/issues/3402)
* fix: clean manifest plugin state at build start (#3530) ([c9da635](https://github.com/vitejs/vite/commit/c9da635)), closes [#3530](https://github.com/vitejs/vite/issues/3530)
* fix: data-uri plugin cache reset at buildStart (#3537) ([9d97b6d](https://github.com/vitejs/vite/commit/9d97b6d)), closes [#3537](https://github.com/vitejs/vite/issues/3537)
* fix: do not cache module while the file contains import.meta.glob (#3005) ([e7b8f41](https://github.com/vitejs/vite/commit/e7b8f41)), closes [#3005](https://github.com/vitejs/vite/issues/3005)
* fix: ensure new assets cache at build start, fix #3271 (#3512) ([9484c0f](https://github.com/vitejs/vite/commit/9484c0f)), closes [#3271](https://github.com/vitejs/vite/issues/3271) [#3512](https://github.com/vitejs/vite/issues/3512)
* fix: ensure new CSS modules cache at build start (#3516) ([07ad2b4](https://github.com/vitejs/vite/commit/07ad2b4)), closes [#3516](https://github.com/vitejs/vite/issues/3516)
* fix: handle HMR for files with more than one glob import (#3497) ([05bd96e](https://github.com/vitejs/vite/commit/05bd96e)), closes [#3497](https://github.com/vitejs/vite/issues/3497)
* fix: inline webworker safari support (#3468) ([2671546](https://github.com/vitejs/vite/commit/2671546)), closes [#3468](https://github.com/vitejs/vite/issues/3468)
* fix: invalidate import globs upon new/removed files (fix #3499) (#3500) ([b31604e](https://github.com/vitejs/vite/commit/b31604e)), closes [#3499](https://github.com/vitejs/vite/issues/3499) [#3500](https://github.com/vitejs/vite/issues/3500)
* fix: track deps for css @import in build watch mode, fix #3387 (#3478) ([13bda33](https://github.com/vitejs/vite/commit/13bda33)), closes [#3387](https://github.com/vitejs/vite/issues/3387) [#3478](https://github.com/vitejs/vite/issues/3478)
* fix(preview): #3487 preview should serve latest content by default (#3488) ([9a4183d](https://github.com/vitejs/vite/commit/9a4183d)), closes [#3487](https://github.com/vitejs/vite/issues/3487) [#3488](https://github.com/vitejs/vite/issues/3488)
* fix(preview): allow to disable HTTPS (#3514) ([cf1632e](https://github.com/vitejs/vite/commit/cf1632e)), closes [#3514](https://github.com/vitejs/vite/issues/3514)
* fix(preview): support custom hostname (#3506) ([5979d0e](https://github.com/vitejs/vite/commit/5979d0e)), closes [#3506](https://github.com/vitejs/vite/issues/3506)
* fix(types): add .module.pcss typings, fix #3518 (#3519) ([3475351](https://github.com/vitejs/vite/commit/3475351)), closes [#3518](https://github.com/vitejs/vite/issues/3518) [#3519](https://github.com/vitejs/vite/issues/3519)
* chore: fixing sort in rollup config (#3528) ([496e26e](https://github.com/vitejs/vite/commit/496e26e)), closes [#3528](https://github.com/vitejs/vite/issues/3528)
* feat: support serving `index.html` in middleware mode (#2871) ([b1598ce](https://github.com/vitejs/vite/commit/b1598ce)), closes [#2871](https://github.com/vitejs/vite/issues/2871)



## <small>2.3.3 (2021-05-17)</small>

* release: v2.3.3 ([8c9cf45](https://github.com/vitejs/vite/commit/8c9cf45))
* fix: ignore ids that start with \0 in plugin asset, fix #3424 (#3436) ([f6cfe30](https://github.com/vitejs/vite/commit/f6cfe30)), closes [#3424](https://github.com/vitejs/vite/issues/3424) [#3436](https://github.com/vitejs/vite/issues/3436)
* fix: restore dynamic-import-polyfill (#3434) ([4112c5d](https://github.com/vitejs/vite/commit/4112c5d)), closes [#3434](https://github.com/vitejs/vite/issues/3434)
* fix: sass importer can't be undefined (fix: #3390) (#3395) ([30ff5a2](https://github.com/vitejs/vite/commit/30ff5a2)), closes [#3390](https://github.com/vitejs/vite/issues/3390) [#3395](https://github.com/vitejs/vite/issues/3395)
* fix: skip fs fallback for out of root urls, fix #3364 (#3431) ([19dae99](https://github.com/vitejs/vite/commit/19dae99)), closes [#3364](https://github.com/vitejs/vite/issues/3364) [#3431](https://github.com/vitejs/vite/issues/3431)
* fix: warn about dynamic import polyfill only during build (#3446) ([5fe0550](https://github.com/vitejs/vite/commit/5fe0550)), closes [#3446](https://github.com/vitejs/vite/issues/3446)
* chore(deps): upgrade esbuild@0.11.23 (#3447) ([cedc28d](https://github.com/vitejs/vite/commit/cedc28d)), closes [#3447](https://github.com/vitejs/vite/issues/3447)



## <small>2.3.2 (2021-05-12)</small>

* release: v2.3.2 ([67a6441](https://github.com/vitejs/vite/commit/67a6441))
* fix(css): fix sass importer error (#3368) ([3f04abf](https://github.com/vitejs/vite/commit/3f04abf)), closes [#3368](https://github.com/vitejs/vite/issues/3368)
* fix(server): hostname defaults to localhost, fix #3355 (#3383) ([8b5a6a8](https://github.com/vitejs/vite/commit/8b5a6a8)), closes [#3355](https://github.com/vitejs/vite/issues/3355) [#3383](https://github.com/vitejs/vite/issues/3383)
* chore: change prettier version to exact (#3386) ([d36e10e](https://github.com/vitejs/vite/commit/d36e10e)), closes [#3386](https://github.com/vitejs/vite/issues/3386)
* deps: bump esbuild to 0.11.20, fix #3247 (#3385) ([aee0928](https://github.com/vitejs/vite/commit/aee0928)), closes [#3247](https://github.com/vitejs/vite/issues/3247) [#3385](https://github.com/vitejs/vite/issues/3385)
* docs: update changelog ([df46c0d](https://github.com/vitejs/vite/commit/df46c0d))



## <small>2.3.1 (2021-05-12)</small>

* release: v2.3.1 ([1af3994](https://github.com/vitejs/vite/commit/1af3994))
* fix: bump @rollup/plugin-commonjs to v19, fix #3312 (#3353) ([c6ef6d0](https://github.com/vitejs/vite/commit/c6ef6d0)), closes [#3312](https://github.com/vitejs/vite/issues/3312) [#3353](https://github.com/vitejs/vite/issues/3353)
* fix: disable fsServe restrictions by default (#3377) ([5433a65](https://github.com/vitejs/vite/commit/5433a65)), closes [#3377](https://github.com/vitejs/vite/issues/3377)
* fix: normalize url in `ensureServingAccess` (#3350) ([deb465b](https://github.com/vitejs/vite/commit/deb465b)), closes [#3350](https://github.com/vitejs/vite/issues/3350)
* fix: use the closest package.json as root when workspace not found fo… (#3374) ([42b35ac](https://github.com/vitejs/vite/commit/42b35ac)), closes [#3374](https://github.com/vitejs/vite/issues/3374)
* docs: fix broken link in error message (#3345) ([bdc1ea3](https://github.com/vitejs/vite/commit/bdc1ea3)), closes [#3345](https://github.com/vitejs/vite/issues/3345) [#3344](https://github.com/vitejs/vite/issues/3344)
* docs: update vite 2.3.0 changelog ([b10d90e](https://github.com/vitejs/vite/commit/b10d90e))
* chore(deps): bump postcss from 8.2.8 to 8.2.10 (#3343) ([139a9ee](https://github.com/vitejs/vite/commit/139a9ee)), closes [#3343](https://github.com/vitejs/vite/issues/3343)



## 2.3.0 (2021-05-11)

* release: v2.3.0 ([a7d86ee](https://github.com/vitejs/vite/commit/a7d86ee))
* fix: only provide npm package names to resolveSSRExternal (#2717) ([6dde32a](https://github.com/vitejs/vite/commit/6dde32a)), closes [#2717](https://github.com/vitejs/vite/issues/2717)
* fix: prevent serving unrestricted files (fix #2820) (#2850) ([792a6e1](https://github.com/vitejs/vite/commit/792a6e1)), closes [#2820](https://github.com/vitejs/vite/issues/2820) [#2850](https://github.com/vitejs/vite/issues/2850)
* fix: type error by #3151 (#3292) ([fd4146b](https://github.com/vitejs/vite/commit/fd4146b)), closes [#3151](https://github.com/vitejs/vite/issues/3151) [#3292](https://github.com/vitejs/vite/issues/3292)
* fix: upgrade to esbuild@0.11.19 (#3282) ([b0dd69d](https://github.com/vitejs/vite/commit/b0dd69d)), closes [#3282](https://github.com/vitejs/vite/issues/3282)
* fix: warning for vite/dynamic-import-polyfill (#3328) ([8b80512](https://github.com/vitejs/vite/commit/8b80512)), closes [#3328](https://github.com/vitejs/vite/issues/3328)
* fix(ci): fix ci lint step (#2988) ([4e8ffd8](https://github.com/vitejs/vite/commit/4e8ffd8)), closes [#2988](https://github.com/vitejs/vite/issues/2988)
* fix(dev): rewrite importee path at html files at spa fallback (#3239) ([13d41d8](https://github.com/vitejs/vite/commit/13d41d8)), closes [#3239](https://github.com/vitejs/vite/issues/3239)
* fix(hmr): respect server https options when running as middleware (#1992) ([24178b0](https://github.com/vitejs/vite/commit/24178b0)), closes [#1992](https://github.com/vitejs/vite/issues/1992)
* fix(resolve): normalize node_modules and bare imports, fix #2503 (#2848) ([0c97412](https://github.com/vitejs/vite/commit/0c97412)), closes [#2503](https://github.com/vitejs/vite/issues/2503) [#2848](https://github.com/vitejs/vite/issues/2848)
* fix(serve): prevent serving unrestricted files (#3321) ([7231b5a](https://github.com/vitejs/vite/commit/7231b5a)), closes [#3321](https://github.com/vitejs/vite/issues/3321)
* fix(server): Listen only to 127.0.0.1 by default (#2977) ([1e604d5](https://github.com/vitejs/vite/commit/1e604d5)), closes [#2977](https://github.com/vitejs/vite/issues/2977)
* fix(ssr): resolve dynamic import vars modules (#3177) ([b1e7395](https://github.com/vitejs/vite/commit/b1e7395)), closes [#3177](https://github.com/vitejs/vite/issues/3177)
* refactor: rewrite after #2977 (#3269) ([d2b3ba1](https://github.com/vitejs/vite/commit/d2b3ba1)), closes [#2977](https://github.com/vitejs/vite/issues/2977) [#3269](https://github.com/vitejs/vite/issues/3269)
* refactor: vite middlewares as named functions (#3251) ([fd91332](https://github.com/vitejs/vite/commit/fd91332)), closes [#3251](https://github.com/vitejs/vite/issues/3251)
* feat: add optimizeDeps.esbuildOptions (#2991) ([77a882a](https://github.com/vitejs/vite/commit/77a882a)), closes [#2991](https://github.com/vitejs/vite/issues/2991)
* feat: set publicDir to false to disable copied static assets to build dist dir (#3152) ([f4ab90a](https://github.com/vitejs/vite/commit/f4ab90a)), closes [#3152](https://github.com/vitejs/vite/issues/3152)
* feat: webworker ssr target (#3151) ([1c59ef1](https://github.com/vitejs/vite/commit/1c59ef1)), closes [#3151](https://github.com/vitejs/vite/issues/3151)
* refactor!: esbuild 0.11 upgrade, remove dynamic-import-polyfill (#2976) ([05fd1e2](https://github.com/vitejs/vite/commit/05fd1e2)), closes [#2976](https://github.com/vitejs/vite/issues/2976)
* chore: minor style fix (#3257) ([2421deb](https://github.com/vitejs/vite/commit/2421deb)), closes [#3257](https://github.com/vitejs/vite/issues/3257)



## <small>2.2.4 (2021-05-03)</small>

* release: v2.2.4 ([38727c7](https://github.com/vitejs/vite/commit/38727c7))
* refactor: dedupe deprecation warning code (#3232) ([f399298](https://github.com/vitejs/vite/commit/f399298)), closes [#3232](https://github.com/vitejs/vite/issues/3232)
* refactor(scan): don’t write to disk during dep scan (#3231) ([e641d8e](https://github.com/vitejs/vite/commit/e641d8e)), closes [#3231](https://github.com/vitejs/vite/issues/3231)
* fix: call `buildStart` hook in middleware mode (#3080) ([c374a54](https://github.com/vitejs/vite/commit/c374a54)), closes [#3080](https://github.com/vitejs/vite/issues/3080)
* fix: dependencies are analyzed multiple times (#3154) ([28a67ad](https://github.com/vitejs/vite/commit/28a67ad)), closes [#3154](https://github.com/vitejs/vite/issues/3154)
* fix(dev): strip utf-8 bom (#3162) (#3171) ([19a2869](https://github.com/vitejs/vite/commit/19a2869)), closes [#3162](https://github.com/vitejs/vite/issues/3162) [#3171](https://github.com/vitejs/vite/issues/3171)
* fix(emptyOutDir): never remove .git (#3043) ([82dc588](https://github.com/vitejs/vite/commit/82dc588)), closes [#3043](https://github.com/vitejs/vite/issues/3043)
* fix(scan): improve script regular matching (fixes #2942) (#2961) ([1e785d1](https://github.com/vitejs/vite/commit/1e785d1)), closes [#2942](https://github.com/vitejs/vite/issues/2942) [#2961](https://github.com/vitejs/vite/issues/2961)
* feat: Allow overwrite `TerserOptions.safari10` from `UserConfig` (#3113) ([7cd8d78](https://github.com/vitejs/vite/commit/7cd8d78)), closes [#3113](https://github.com/vitejs/vite/issues/3113)



## <small>2.2.3 (2021-04-25)</small>

* release: v2.2.3 ([6d932a1](https://github.com/vitejs/vite/commit/6d932a1))
* fix: add .svelte to list of known js src files (#3128) ([0f09eaf](https://github.com/vitejs/vite/commit/0f09eaf)), closes [#3128](https://github.com/vitejs/vite/issues/3128)
* fix: await bundle close in worker plugin (#2997) ([0e7125a](https://github.com/vitejs/vite/commit/0e7125a)), closes [#2997](https://github.com/vitejs/vite/issues/2997)
* fix: dymamic import polyfill path when base is a URL (#3132) ([02ba4ba](https://github.com/vitejs/vite/commit/02ba4ba)), closes [#3132](https://github.com/vitejs/vite/issues/3132)
* fix: handle null/empty sources in source maps (#3074) ([3e9f128](https://github.com/vitejs/vite/commit/3e9f128)), closes [#3074](https://github.com/vitejs/vite/issues/3074)
* fix: revert #2541, fix #3084 #3101 (#3144) ([f4e7918](https://github.com/vitejs/vite/commit/f4e7918)), closes [#3084](https://github.com/vitejs/vite/issues/3084) [#3101](https://github.com/vitejs/vite/issues/3101) [#3144](https://github.com/vitejs/vite/issues/3144)
* fix: support postcss .pcss extension (#3130) ([6d602a0](https://github.com/vitejs/vite/commit/6d602a0)), closes [#3130](https://github.com/vitejs/vite/issues/3130)
* fix(build): vendor chunk strategy uses static imports, fix #2672 (#2934) ([949b818](https://github.com/vitejs/vite/commit/949b818)), closes [#2672](https://github.com/vitejs/vite/issues/2672) [#2934](https://github.com/vitejs/vite/issues/2934)
* chore: use recommended lint (#3072) ([0423608](https://github.com/vitejs/vite/commit/0423608)), closes [#3072](https://github.com/vitejs/vite/issues/3072)



## <small>2.2.2 (2021-04-24)</small>

* release: v2.2.2 ([5251bad](https://github.com/vitejs/vite/commit/5251bad))
* fix(ssr): skip resolving browser field for SSR build, fix #3036 (#3039) ([61ea320](https://github.com/vitejs/vite/commit/61ea320)), closes [#3036](https://github.com/vitejs/vite/issues/3036) [#3039](https://github.com/vitejs/vite/issues/3039)
* feat: add marko file extensions (#3073) ([d34fd88](https://github.com/vitejs/vite/commit/d34fd88)), closes [#3073](https://github.com/vitejs/vite/issues/3073)



## <small>2.2.1 (2021-04-19)</small>

* release: v2.2.1 ([1557df9](https://github.com/vitejs/vite/commit/1557df9))
* fix(optimizer): depScan resolve with flatIdDeps (#3053) ([cb441ef](https://github.com/vitejs/vite/commit/cb441ef)), closes [#3053](https://github.com/vitejs/vite/issues/3053)



## 2.2.0 (2021-04-19)

* release: v2.2.0 ([d5a3733](https://github.com/vitejs/vite/commit/d5a3733))
* feat: add async support for vite config file (#2758) ([aee8b37](https://github.com/vitejs/vite/commit/aee8b37)), closes [#2758](https://github.com/vitejs/vite/issues/2758)
* feat: add inlineConfig.envFile option (#2475) ([81b80c6](https://github.com/vitejs/vite/commit/81b80c6)), closes [#2475](https://github.com/vitejs/vite/issues/2475)
* feat: export manifest types (#2901) ([ffcb7ce](https://github.com/vitejs/vite/commit/ffcb7ce)), closes [#2901](https://github.com/vitejs/vite/issues/2901)
* feat: parameter settings when packaging the library (#2750) ([f17e19a](https://github.com/vitejs/vite/commit/f17e19a)), closes [#2750](https://github.com/vitejs/vite/issues/2750)
* feat: support cacheDir (#2899) ([57980d2](https://github.com/vitejs/vite/commit/57980d2)), closes [#2899](https://github.com/vitejs/vite/issues/2899)
* feat: support globbing from dependencies (#2519) ([7121553](https://github.com/vitejs/vite/commit/7121553)), closes [#2519](https://github.com/vitejs/vite/issues/2519) [#2390](https://github.com/vitejs/vite/issues/2390)
* feat: watch the dependencies of config file (#3031) ([bb419cb](https://github.com/vitejs/vite/commit/bb419cb)), closes [#3031](https://github.com/vitejs/vite/issues/3031)
* feat(cli): build watch mode, fix #1434 (#1449) ([0dc6e37](https://github.com/vitejs/vite/commit/0dc6e37)), closes [#1434](https://github.com/vitejs/vite/issues/1434) [#1449](https://github.com/vitejs/vite/issues/1449)
* feat(createLogger): allow custom prefix for logger (#2019) ([344d77e](https://github.com/vitejs/vite/commit/344d77e)), closes [#2019](https://github.com/vitejs/vite/issues/2019)
* feat(plugin-api): support async configResolved hooks (fixes #2949) (#2951) ([8b38168](https://github.com/vitejs/vite/commit/8b38168)), closes [#2949](https://github.com/vitejs/vite/issues/2949) [#2951](https://github.com/vitejs/vite/issues/2951)
* feat(plugin): plugin config hook supports return promise (#2800) ([5dfd0e8](https://github.com/vitejs/vite/commit/5dfd0e8)), closes [#2800](https://github.com/vitejs/vite/issues/2800)
* fix: A static and dynamically imported module is loaded twice (#2935) ([266fb55](https://github.com/vitejs/vite/commit/266fb55)), closes [#2935](https://github.com/vitejs/vite/issues/2935)
* fix: avoid endless loop in resolveSSRExternal (fix #2635) (#2636) ([59871ef](https://github.com/vitejs/vite/commit/59871ef)), closes [#2635](https://github.com/vitejs/vite/issues/2635) [#2636](https://github.com/vitejs/vite/issues/2636)
* fix: chunks are analysed multiple times (#2541) ([1451b78](https://github.com/vitejs/vite/commit/1451b78)), closes [#2541](https://github.com/vitejs/vite/issues/2541)
* fix: don't resolve import using browser during SSR (fix #2995) (#2996) ([fd1c9ba](https://github.com/vitejs/vite/commit/fd1c9ba)), closes [#2995](https://github.com/vitejs/vite/issues/2995) [#2996](https://github.com/vitejs/vite/issues/2996)
* fix: filter out empty srcset, fix #2863 (#2888) ([0d4f803](https://github.com/vitejs/vite/commit/0d4f803)), closes [#2863](https://github.com/vitejs/vite/issues/2863) [#2888](https://github.com/vitejs/vite/issues/2888)
* fix: require.resolve to correct sub node_modules (#3003) ([da11d43](https://github.com/vitejs/vite/commit/da11d43)), closes [#3003](https://github.com/vitejs/vite/issues/3003)
* fix: serve .js, .jsx, .ts, .tsx as application/javascript, fix #2642 (#2769) ([b08e973](https://github.com/vitejs/vite/commit/b08e973)), closes [#2642](https://github.com/vitejs/vite/issues/2642) [#2769](https://github.com/vitejs/vite/issues/2769)
* fix(build): avoid import duplicate chunks, fix #2906 (#2940) ([8b02abf](https://github.com/vitejs/vite/commit/8b02abf)), closes [#2906](https://github.com/vitejs/vite/issues/2906) [#2940](https://github.com/vitejs/vite/issues/2940)
* fix(build): properly handle alias key in config merge (#2847) ([41261c7](https://github.com/vitejs/vite/commit/41261c7)), closes [#2847](https://github.com/vitejs/vite/issues/2847)
* fix(build): support `cssCodeSplit` for cjs format, fix #2575 (#2621) ([2a89c57](https://github.com/vitejs/vite/commit/2a89c57)), closes [#2575](https://github.com/vitejs/vite/issues/2575) [#2621](https://github.com/vitejs/vite/issues/2621)
* fix(css): properly pass options to stylus compiler, fix #2587 (#2860) ([8dbebee](https://github.com/vitejs/vite/commit/8dbebee)), closes [#2587](https://github.com/vitejs/vite/issues/2587) [#2860](https://github.com/vitejs/vite/issues/2860)
* fix(define): ensure the normal use of NODE_ENV, fix #2759 (#2764) ([fa85749](https://github.com/vitejs/vite/commit/fa85749)), closes [#2759](https://github.com/vitejs/vite/issues/2759) [#2764](https://github.com/vitejs/vite/issues/2764)
* fix(optimizer): ensure consistency with replace define (#2929) ([ddb7a91](https://github.com/vitejs/vite/commit/ddb7a91)), closes [#2929](https://github.com/vitejs/vite/issues/2929) [#2893](https://github.com/vitejs/vite/issues/2893)
* fix(scan): avoid crawling type only import (#2810) ([daf7838](https://github.com/vitejs/vite/commit/daf7838)), closes [#2810](https://github.com/vitejs/vite/issues/2810)
* fix(ssr): fix ssrTransform catch clause error (fix #2667) (#2966) ([c9e0bcf](https://github.com/vitejs/vite/commit/c9e0bcf)), closes [#2667](https://github.com/vitejs/vite/issues/2667) [#2966](https://github.com/vitejs/vite/issues/2966)
* fix(types): clean-css types (#2971) ([9be7449](https://github.com/vitejs/vite/commit/9be7449)), closes [#2971](https://github.com/vitejs/vite/issues/2971)
* chore: @typescript-eslint/explicit-module-boundary-types (#2735) ([c61b3e4](https://github.com/vitejs/vite/commit/c61b3e4)), closes [#2735](https://github.com/vitejs/vite/issues/2735)
* chore: format with prettier (#2768) ([5bf0509](https://github.com/vitejs/vite/commit/5bf0509)), closes [#2768](https://github.com/vitejs/vite/issues/2768)
* chore: prefer-const (#2733) ([11de3c2](https://github.com/vitejs/vite/commit/11de3c2)), closes [#2733](https://github.com/vitejs/vite/issues/2733)
* chore: use more explicit lint disable (#3021) ([70b04a5](https://github.com/vitejs/vite/commit/70b04a5)), closes [#3021](https://github.com/vitejs/vite/issues/3021)
* refactor(worker): use existing isBuild flag (#2853) ([a0f00ee](https://github.com/vitejs/vite/commit/a0f00ee)), closes [#2853](https://github.com/vitejs/vite/issues/2853)
* build: add source map to vite (#2843) ([de4e08d](https://github.com/vitejs/vite/commit/de4e08d)), closes [#2843](https://github.com/vitejs/vite/issues/2843)



## <small>2.1.5 (2021-03-31)</small>

* release: v2.1.5 ([b4bbc67](https://github.com/vitejs/vite/commit/b4bbc67))
* fix: do not inject ?import query to external urls ([be3a4f5](https://github.com/vitejs/vite/commit/be3a4f5))
* fix: replace __dirname and __filename in config file, fix #2728 (#2780) ([eb57ac6](https://github.com/vitejs/vite/commit/eb57ac6)), closes [#2728](https://github.com/vitejs/vite/issues/2728) [#2780](https://github.com/vitejs/vite/issues/2780)
* refactor: reduce dependency pending request timeout ([1280828](https://github.com/vitejs/vite/commit/1280828))



## <small>2.1.4 (2021-03-30)</small>

* release: v2.1.4 ([5681916](https://github.com/vitejs/vite/commit/5681916))
* fix: fix types errors (#2726) ([9716582](https://github.com/vitejs/vite/commit/9716582)), closes [#2726](https://github.com/vitejs/vite/issues/2726)
* fix: invalidate module cache on unlinked (#2629), fix #2630 ([57f2a69](https://github.com/vitejs/vite/commit/57f2a69)), closes [#2630](https://github.com/vitejs/vite/issues/2630)
* fix: reload only once on socket reconnect (#2340) ([d73c1fa](https://github.com/vitejs/vite/commit/d73c1fa)), closes [#2340](https://github.com/vitejs/vite/issues/2340)
* fix(client): don't inject queries for data URLs (#2703), fix #2658 ([86753d6](https://github.com/vitejs/vite/commit/86753d6)), closes [#2658](https://github.com/vitejs/vite/issues/2658)
* fix(resolve): fix resolver not following node resolve algorithm (#2718), fix #2695 ([669c591](https://github.com/vitejs/vite/commit/669c591)), closes [#2718](https://github.com/vitejs/vite/issues/2718) [#2695](https://github.com/vitejs/vite/issues/2695)
* fix(resolve): improve browser filed substitutions (#2701), fix #2598 ([cc213c6](https://github.com/vitejs/vite/commit/cc213c6)), closes [#2598](https://github.com/vitejs/vite/issues/2598)
* fix(scan): properly crawl imports in lang=ts blocks in vue/svelte files ([8f527fd](https://github.com/vitejs/vite/commit/8f527fd))
* feat(dev): support keepNames option for optimizeDependencies config (#2742) ([130bf5a](https://github.com/vitejs/vite/commit/130bf5a)), closes [#2742](https://github.com/vitejs/vite/issues/2742)
* dx: Include SSR in predefined env types (#2690) ([38466d1](https://github.com/vitejs/vite/commit/38466d1)), closes [#2690](https://github.com/vitejs/vite/issues/2690)
* chore: Add `repository.directory` to `packages/**/package.json` (#2687) ([0ecff94](https://github.com/vitejs/vite/commit/0ecff94)), closes [#2687](https://github.com/vitejs/vite/issues/2687)
* chore: fix some typos (#2715) ([fa30f76](https://github.com/vitejs/vite/commit/fa30f76)), closes [#2715](https://github.com/vitejs/vite/issues/2715)
* chore: no-case-declarations (#2730) ([2358dfc](https://github.com/vitejs/vite/commit/2358dfc)), closes [#2730](https://github.com/vitejs/vite/issues/2730)
* chore: no-extra-boolean-cast (#2732) ([352cd39](https://github.com/vitejs/vite/commit/352cd39)), closes [#2732](https://github.com/vitejs/vite/issues/2732)
* chore: no-irregular-whitespace (#2731) ([2094539](https://github.com/vitejs/vite/commit/2094539)), closes [#2731](https://github.com/vitejs/vite/issues/2731)
* refactor: preprocess type (#2227) ([d011a00](https://github.com/vitejs/vite/commit/d011a00)), closes [#2227](https://github.com/vitejs/vite/issues/2227)



## <small>2.1.3 (2021-03-25)</small>

* release: v2.1.3 ([fcc9ddb](https://github.com/vitejs/vite/commit/fcc9ddb))
* fix: add a timeout to the res.sep when discovering dependencies, fix #2525 (#2548) ([31d10cb](https://github.com/vitejs/vite/commit/31d10cb)), closes [#2525](https://github.com/vitejs/vite/issues/2525) [#2548](https://github.com/vitejs/vite/issues/2548)
* fix: handle paths with special characters in injectQuery (fix #2585) (#2614) ([ed321ba](https://github.com/vitejs/vite/commit/ed321ba)), closes [#2585](https://github.com/vitejs/vite/issues/2585) [#2614](https://github.com/vitejs/vite/issues/2614)
* fix: json should be bundled (#2573) ([2eb7682](https://github.com/vitejs/vite/commit/2eb7682)), closes [#2573](https://github.com/vitejs/vite/issues/2573) [#2543](https://github.com/vitejs/vite/issues/2543)
* fix(css): alias for background url in sass/less link error (fix #2316) (#2323) ([9499d26](https://github.com/vitejs/vite/commit/9499d26)), closes [#2316](https://github.com/vitejs/vite/issues/2316) [#2323](https://github.com/vitejs/vite/issues/2323)
* fix(dev): remove process listeners on server close (#2619) ([74b360b](https://github.com/vitejs/vite/commit/74b360b)), closes [#2619](https://github.com/vitejs/vite/issues/2619)
* feat: let `plugins` array contain falsy values (#1649) ([be76a30](https://github.com/vitejs/vite/commit/be76a30)), closes [#1649](https://github.com/vitejs/vite/issues/1649)



## <small>2.1.2 (2021-03-17)</small>

* release: v2.1.2 ([bc35fe9](https://github.com/vitejs/vite/commit/bc35fe9))
* fix: update esbuild target to allow destructuring (#2566) ([da49782](https://github.com/vitejs/vite/commit/da49782)), closes [#2566](https://github.com/vitejs/vite/issues/2566)
* fix(manifest): do not fail when using rollupOtions.external (#2532) ([e44cc11](https://github.com/vitejs/vite/commit/e44cc11)), closes [#2532](https://github.com/vitejs/vite/issues/2532)
* chore: fix typo (#2549) ([8cd76bf](https://github.com/vitejs/vite/commit/8cd76bf)), closes [#2549](https://github.com/vitejs/vite/issues/2549)



## <small>2.1.1 (2021-03-16)</small>

* release: v2.1.1 ([fa38f3a](https://github.com/vitejs/vite/commit/fa38f3a))
* fix: decode path before reading sourcemap source content ([73b80d5](https://github.com/vitejs/vite/commit/73b80d5)), closes [#2524](https://github.com/vitejs/vite/issues/2524)
* fix: enable latest syntax when parsing for ssr ([407ce3b](https://github.com/vitejs/vite/commit/407ce3b)), closes [#2526](https://github.com/vitejs/vite/issues/2526)
* fix(scan): handle await replacement edge case ([cbfc3e9](https://github.com/vitejs/vite/commit/cbfc3e9)), closes [#2528](https://github.com/vitejs/vite/issues/2528)



## 2.1.0 (2021-03-15)

* release: v2.1.0 ([e3d74b4](https://github.com/vitejs/vite/commit/e3d74b4))
* fix: correctly handle explicit ts config file (#2515) ([e8f3c78](https://github.com/vitejs/vite/commit/e8f3c78)), closes [#2515](https://github.com/vitejs/vite/issues/2515)
* fix: fix early logger definiton in resolveConfig (#2425) ([96ea9f4](https://github.com/vitejs/vite/commit/96ea9f4))
* fix: Improve how @fs urls are printed (#2362) ([5d4e82d](https://github.com/vitejs/vite/commit/5d4e82d)), closes [#2362](https://github.com/vitejs/vite/issues/2362)
* fix: Improve injectQuery path handling (#2435) ([a5412f8](https://github.com/vitejs/vite/commit/a5412f8)), closes [#2435](https://github.com/vitejs/vite/issues/2435) [#2422](https://github.com/vitejs/vite/issues/2422)
* fix: keep process running when fail to load config in restarting server (#2510) ([b18af15](https://github.com/vitejs/vite/commit/b18af15)), closes [#2510](https://github.com/vitejs/vite/issues/2510) [#2496](https://github.com/vitejs/vite/issues/2496)
* fix: make import resolution failures easier to track down (#2450) ([f6ac860](https://github.com/vitejs/vite/commit/f6ac860)), closes [#2450](https://github.com/vitejs/vite/issues/2450)
* fix: respect cors and proxy options in preview command ([f7d85ae](https://github.com/vitejs/vite/commit/f7d85ae)), closes [#2279](https://github.com/vitejs/vite/issues/2279)
* fix: url linked to wmr rollup-plugin-container.js found 404 (#2368) ([209232c](https://github.com/vitejs/vite/commit/209232c)), closes [#2368](https://github.com/vitejs/vite/issues/2368)
* fix(build): respect rollupOtions.external  at generate manifest(#2353) ([b05a567](https://github.com/vitejs/vite/commit/b05a567)), closes [#2353](https://github.com/vitejs/vite/issues/2353)
* fix(hmr): never invalidate an accepting importer (#2457) ([63bd250](https://github.com/vitejs/vite/commit/63bd250)), closes [#2457](https://github.com/vitejs/vite/issues/2457)
* fix(json): support importing json with ?url and ?raw queries ([fd0a0d9](https://github.com/vitejs/vite/commit/fd0a0d9)), closes [#2455](https://github.com/vitejs/vite/issues/2455)
* fix(ssr): fix mistakenly overwriting destructure variables as import bindings (#2417) ([24c866f](https://github.com/vitejs/vite/commit/24c866f)), closes [#2417](https://github.com/vitejs/vite/issues/2417) [#2409](https://github.com/vitejs/vite/issues/2409)
* fix(ssr): handle empty sourcemaps (fix #2391) (#2441) ([103dec9](https://github.com/vitejs/vite/commit/103dec9)), closes [#2391](https://github.com/vitejs/vite/issues/2391) [#2441](https://github.com/vitejs/vite/issues/2441) [#2391](https://github.com/vitejs/vite/issues/2391)
* feat: allow custom websocket server (#2338) ([9243cc9](https://github.com/vitejs/vite/commit/9243cc9)), closes [#2338](https://github.com/vitejs/vite/issues/2338)
* feat: bundle vite config file with esbuild instead of rollup (#2517) ([e034ee2](https://github.com/vitejs/vite/commit/e034ee2)), closes [#2517](https://github.com/vitejs/vite/issues/2517)
* feat(dev): support keepNames for dependencies (#2376) ([b5cd8c8](https://github.com/vitejs/vite/commit/b5cd8c8)), closes [#2376](https://github.com/vitejs/vite/issues/2376)
* refactor: upgrade to esbuild 0.9.x (#2506) ([d3142cf](https://github.com/vitejs/vite/commit/d3142cf)), closes [#2506](https://github.com/vitejs/vite/issues/2506)
* chore: typo (#2420) ([f4998c0](https://github.com/vitejs/vite/commit/f4998c0)), closes [#2420](https://github.com/vitejs/vite/issues/2420)



## <small>2.0.5 (2021-03-02)</small>

* release: v2.0.5 ([412b56f](https://github.com/vitejs/vite/commit/412b56f))
* fix: await bundle close (#2313) ([c988574](https://github.com/vitejs/vite/commit/c988574)), closes [#2313](https://github.com/vitejs/vite/issues/2313)
* fix: serving static files from root (#2309) ([4f942be](https://github.com/vitejs/vite/commit/4f942be)), closes [#2309](https://github.com/vitejs/vite/issues/2309)
* fix(scan): handle race condition for tempDir removal (#2299) ([67e56e4](https://github.com/vitejs/vite/commit/67e56e4)), closes [#2299](https://github.com/vitejs/vite/issues/2299)
* docs: update default value of css modules `localsConvention` (#2334) ([e4f78ef](https://github.com/vitejs/vite/commit/e4f78ef)), closes [#2334](https://github.com/vitejs/vite/issues/2334)



## <small>2.0.4 (2021-02-26)</small>

* release: v2.0.4 ([4396057](https://github.com/vitejs/vite/commit/4396057))
* chore: fix snapshot ([d49eb1b](https://github.com/vitejs/vite/commit/d49eb1b))
* fix: add source and sourcesContent to transformed SSR modules (#2285) ([72be67b](https://github.com/vitejs/vite/commit/72be67b)), closes [#2285](https://github.com/vitejs/vite/issues/2285) [#2284](https://github.com/vitejs/vite/issues/2284)
* fix: decode url before serving static files (#2201) ([1342108](https://github.com/vitejs/vite/commit/1342108)), closes [#2201](https://github.com/vitejs/vite/issues/2201) [#2195](https://github.com/vitejs/vite/issues/2195)
* fix: determine anonymous function wrapper offset at runtime (#2266) ([a2ee885](https://github.com/vitejs/vite/commit/a2ee885)), closes [#2266](https://github.com/vitejs/vite/issues/2266) [#2265](https://github.com/vitejs/vite/issues/2265)
* fix(build): css tags injection priority (#2272) ([55ad23e](https://github.com/vitejs/vite/commit/55ad23e)), closes [#2272](https://github.com/vitejs/vite/issues/2272)
* fix(css): ignore css commonjs-proxy modules (#2160) ([de33d32](https://github.com/vitejs/vite/commit/de33d32)), closes [#2160](https://github.com/vitejs/vite/issues/2160)
* fix(optimizer): detect re-exports in dep entries ([a3abf99](https://github.com/vitejs/vite/commit/a3abf99)), closes [#2219](https://github.com/vitejs/vite/issues/2219)
* fix(optimizer): fix deps aliased to cdns that are imported by optimized deps ([06d3244](https://github.com/vitejs/vite/commit/06d3244)), closes [#2268](https://github.com/vitejs/vite/issues/2268)
* fix(sourcemap): avoid cjs import interop line offset messing up sourcemap ([4ce972d](https://github.com/vitejs/vite/commit/4ce972d)), closes [#2280](https://github.com/vitejs/vite/issues/2280)
* fix(sourcemap): inject `sourcesContent` for .map requests (#2283) ([8d50b18](https://github.com/vitejs/vite/commit/8d50b18)), closes [#2283](https://github.com/vitejs/vite/issues/2283)
* fix(ssr): allow ssr module export overwrites (#2228) ([6fae0b7](https://github.com/vitejs/vite/commit/6fae0b7)), closes [#2228](https://github.com/vitejs/vite/issues/2228)
* fix(ssr): handle imported binding being used as super class ([167a9c3](https://github.com/vitejs/vite/commit/167a9c3)), closes [#2221](https://github.com/vitejs/vite/issues/2221)
* fix(ssr): handle ssrLoadModule failures in post pending (#2253) ([ea323cc](https://github.com/vitejs/vite/commit/ea323cc)), closes [#2253](https://github.com/vitejs/vite/issues/2253) [#2252](https://github.com/vitejs/vite/issues/2252)
* fix(ssr): ssr transform method definition (#2223) ([8e0c0fa](https://github.com/vitejs/vite/commit/8e0c0fa)), closes [#2223](https://github.com/vitejs/vite/issues/2223)
* refactor: use esbuild resolve kind info for cjs dep resolving ([e9f4c29](https://github.com/vitejs/vite/commit/e9f4c29))



## <small>2.0.3 (2021-02-24)</small>

* release: v2.0.3 ([5690990](https://github.com/vitejs/vite/commit/5690990))
* fix: do not prepend base to double slash urls during dev (#2143) ([7a1b5c6](https://github.com/vitejs/vite/commit/7a1b5c6)), closes [#2143](https://github.com/vitejs/vite/issues/2143)
* fix: handle escape sequences in import specifiers (#2162) ([bbda31e](https://github.com/vitejs/vite/commit/bbda31e)), closes [#2162](https://github.com/vitejs/vite/issues/2162) [#2083](https://github.com/vitejs/vite/issues/2083)
* fix: should transform the img tag's srcset arrtibute and css' image-set property (#2188) ([0f17a74](https://github.com/vitejs/vite/commit/0f17a74)), closes [#2188](https://github.com/vitejs/vite/issues/2188) [#2177](https://github.com/vitejs/vite/issues/2177)
* fix: treat the watcher path as literal name (#2211) ([58bed16](https://github.com/vitejs/vite/commit/58bed16)), closes [#2211](https://github.com/vitejs/vite/issues/2211) [#2179](https://github.com/vitejs/vite/issues/2179)
* fix: use proper esbuild loader for .cjs and .mjs files (#2215) ([a0d922e](https://github.com/vitejs/vite/commit/a0d922e)), closes [#2215](https://github.com/vitejs/vite/issues/2215)
* fix(optimizer): let esbuild resolve transitive deps ([0138ef3](https://github.com/vitejs/vite/commit/0138ef3)), closes [#2199](https://github.com/vitejs/vite/issues/2199)
* fix(resolve): compat for babel 7.13 helper resolution ([39820b9](https://github.com/vitejs/vite/commit/39820b9))
* fix(scan): avoid replacing await in import specifiers ([94e5b9a](https://github.com/vitejs/vite/commit/94e5b9a)), closes [#2210](https://github.com/vitejs/vite/issues/2210)
* fix(ssr): fix ssr external check for mjs entries ([5095e04](https://github.com/vitejs/vite/commit/5095e04)), closes [#2161](https://github.com/vitejs/vite/issues/2161)



## <small>2.0.2 (2021-02-22)</small>

* release: v2.0.2 ([52f7370](https://github.com/vitejs/vite/commit/52f7370))
* fix: stricter html fallback check in transformRequest ([d0eac2f](https://github.com/vitejs/vite/commit/d0eac2f)), closes [#2051](https://github.com/vitejs/vite/issues/2051)
* fix: typo (#2149) ([2b19e3c](https://github.com/vitejs/vite/commit/2b19e3c)), closes [#2149](https://github.com/vitejs/vite/issues/2149)
* fix(build): do not handle asset url when its url is "#" (#2097) ([0092a35](https://github.com/vitejs/vite/commit/0092a35)), closes [#2097](https://github.com/vitejs/vite/issues/2097) [#2096](https://github.com/vitejs/vite/issues/2096)
* fix(cli): fix short flags being ignored (#2131) ([cbb3eff](https://github.com/vitejs/vite/commit/cbb3eff)), closes [#2131](https://github.com/vitejs/vite/issues/2131)
* fix(optimizer): do not optimize deps w/ jsx entrypoints ([1857652](https://github.com/vitejs/vite/commit/1857652)), closes [#2107](https://github.com/vitejs/vite/issues/2107)
* fix(optimizer): externalize jsx/tsx files in dependencies ([37a103f](https://github.com/vitejs/vite/commit/37a103f))
* fix(optimizer): fix .styl externalization ([87cfd9e](https://github.com/vitejs/vite/commit/87cfd9e)), closes [#2168](https://github.com/vitejs/vite/issues/2168)
* fix(resolve): fix browser mapping fallback ([de58967](https://github.com/vitejs/vite/commit/de58967)), closes [#2115](https://github.com/vitejs/vite/issues/2115)
* fix(scan): set namespace when resolving to html (#2174) ([3be4fac](https://github.com/vitejs/vite/commit/3be4fac)), closes [#2174](https://github.com/vitejs/vite/issues/2174) [#2163](https://github.com/vitejs/vite/issues/2163)
* fix(ssr): avoid duplicate ssr module instantiation on shared imports ([a763ffd](https://github.com/vitejs/vite/commit/a763ffd)), closes [#2060](https://github.com/vitejs/vite/issues/2060)
* fix(ssr): fix ssr export * from ([8ed67cf](https://github.com/vitejs/vite/commit/8ed67cf)), closes [#2158](https://github.com/vitejs/vite/issues/2158)
* fix(ssr): reject ssrLoadModule promises if evaluation fails (#2079) ([e303c4e](https://github.com/vitejs/vite/commit/e303c4e)), closes [#2079](https://github.com/vitejs/vite/issues/2079) [#2078](https://github.com/vitejs/vite/issues/2078)
* chore: avoid generating preload code in ssr build for import globs ([8e8b538](https://github.com/vitejs/vite/commit/8e8b538))
* chore: remove old version of dynamic import vars plugin ([84d17fc](https://github.com/vitejs/vite/commit/84d17fc))
* chore: remove TODO (#2119) ([c323732](https://github.com/vitejs/vite/commit/c323732)), closes [#2119](https://github.com/vitejs/vite/issues/2119)
* chore: upgrade dep open to 7.4.2 (#2175) ([e368cf7](https://github.com/vitejs/vite/commit/e368cf7)), closes [#2175](https://github.com/vitejs/vite/issues/2175)
* refactor: avoid eval when getting global context for assigning env ([97bf2f0](https://github.com/vitejs/vite/commit/97bf2f0)), closes [#2166](https://github.com/vitejs/vite/issues/2166)
* refactor: log version in cli messages ([8733a83](https://github.com/vitejs/vite/commit/8733a83))
* improve: use constant `FS_PREFIX` with possible (#2176) ([1ed1df3](https://github.com/vitejs/vite/commit/1ed1df3)), closes [#2176](https://github.com/vitejs/vite/issues/2176)
* deps: bump esbuild (native apple silicon support!) ([cb83b95](https://github.com/vitejs/vite/commit/cb83b95))



## <small>2.0.1 (2021-02-17)</small>

* release: v2.0.1 ([28032de](https://github.com/vitejs/vite/commit/28032de))
* fix: allow custom process.env.VAR defines (#2055) ([7def49a](https://github.com/vitejs/vite/commit/7def49a)), closes [#2055](https://github.com/vitejs/vite/issues/2055)
* fix: do not error on failed load for SPA html requests ([44a30d5](https://github.com/vitejs/vite/commit/44a30d5)), closes [#2051](https://github.com/vitejs/vite/issues/2051)
* fix: more inclusive config syntax error hanlding for Node 12.x ([27785f7](https://github.com/vitejs/vite/commit/27785f7)), closes [#2050](https://github.com/vitejs/vite/issues/2050)
* refactor: use access instead of exists check when resolving files ([3deba82](https://github.com/vitejs/vite/commit/3deba82))



## 2.0.0 (2021-02-16)

* release: v2.0.0 ([0deadcd](https://github.com/vitejs/vite/commit/0deadcd))
* fix: always transform applicable requests (#2041) ([4fd61ab](https://github.com/vitejs/vite/commit/4fd61ab)), closes [#2041](https://github.com/vitejs/vite/issues/2041)
* fix(css/assets): respect alias in css url() paths ([ad50060](https://github.com/vitejs/vite/commit/ad50060)), closes [#2043](https://github.com/vitejs/vite/issues/2043)
* fix(resolve): handle hash fragment in fs resolve ([34064c8](https://github.com/vitejs/vite/commit/34064c8))
* fix(scan): fix top level await handling in script setup ([24ed098](https://github.com/vitejs/vite/commit/24ed098)), closes [#2044](https://github.com/vitejs/vite/issues/2044)
* fix(scan): ignore virtual entries during scan ([6dc2d56](https://github.com/vitejs/vite/commit/6dc2d56)), closes [#2047](https://github.com/vitejs/vite/issues/2047)



## 2.0.0-beta.70 (2021-02-15)

* release: v2.0.0-beta.70 ([56b1648](https://github.com/vitejs/vite/commit/56b1648))
* feat: allow `getJSON` option on `css.modules` (#2025) ([e324e36](https://github.com/vitejs/vite/commit/e324e36)), closes [#2025](https://github.com/vitejs/vite/issues/2025)
* feat(css): allow async additionalData function for css pre-processors ([20f609d](https://github.com/vitejs/vite/commit/20f609d)), closes [#2002](https://github.com/vitejs/vite/issues/2002)
* chore: fix file name (#2040) ([9925d86](https://github.com/vitejs/vite/commit/9925d86)), closes [#2040](https://github.com/vitejs/vite/issues/2040)
* refactor: make define option perform direct replacement instead ([059070e](https://github.com/vitejs/vite/commit/059070e))
* refactor(ssr): remove unused isolated option ([1c06a78](https://github.com/vitejs/vite/commit/1c06a78))
* fix: reject preload promise if link fails to load (#2027) ([f74d65d](https://github.com/vitejs/vite/commit/f74d65d)), closes [#2027](https://github.com/vitejs/vite/issues/2027) [#2009](https://github.com/vitejs/vite/issues/2009)
* fix: respect host option when listening ([f05ae32](https://github.com/vitejs/vite/commit/f05ae32)), closes [#2032](https://github.com/vitejs/vite/issues/2032)
* fix(css): resolve pre-processors from project root ([ddfcbce](https://github.com/vitejs/vite/commit/ddfcbce)), closes [#2030](https://github.com/vitejs/vite/issues/2030)
* fix(ssr): ignore base when normalizing urls for ssr ([26d409b](https://github.com/vitejs/vite/commit/26d409b)), closes [#1995](https://github.com/vitejs/vite/issues/1995)


### BREAKING CHANGE

* `define` option no longer calls `JSON.stringify` on
string values. This means string define values will be now treated as
raw expressions. To define a string constant, explicit quotes are now
required.


## 2.0.0-beta.69 (2021-02-11)

* release: v2.0.0-beta.69 ([354ac04](https://github.com/vitejs/vite/commit/354ac04))
* fix: fix out of root static file serving on windows ([4d34a73](https://github.com/vitejs/vite/commit/4d34a73)), closes [#1982](https://github.com/vitejs/vite/issues/1982)
* fix: prevent crash on malformed URI (#1977) ([f1b0bc9](https://github.com/vitejs/vite/commit/f1b0bc9)), closes [#1977](https://github.com/vitejs/vite/issues/1977)
* fix: Remove negative count in stdout with 0 rows (#1983) ([09b13ed](https://github.com/vitejs/vite/commit/09b13ed)), closes [#1983](https://github.com/vitejs/vite/issues/1983) [#1981](https://github.com/vitejs/vite/issues/1981)
* fix: user define on import.meta.env should apply during dev ([603d57e](https://github.com/vitejs/vite/commit/603d57e))
* fix(ssr): handle virtual modules during ssr ([108be94](https://github.com/vitejs/vite/commit/108be94)), closes [#1980](https://github.com/vitejs/vite/issues/1980)
* feat: pass config env to plugin config hook ([19f3503](https://github.com/vitejs/vite/commit/19f3503))



## 2.0.0-beta.68 (2021-02-11)

* release: v2.0.0-beta.68 ([ea46c75](https://github.com/vitejs/vite/commit/ea46c75))
* fix: fix path normalization for windows paths w/ non ascii chars ([03b323d](https://github.com/vitejs/vite/commit/03b323d)), closes [#1384](https://github.com/vitejs/vite/issues/1384)
* fix(css/assets): properly replace multiple css asset urls on the same line ([1d805a6](https://github.com/vitejs/vite/commit/1d805a6)), closes [#1975](https://github.com/vitejs/vite/issues/1975)
* fix(scan): handle lang=jsx in sfcs ([2f9549c](https://github.com/vitejs/vite/commit/2f9549c)), closes [#1972](https://github.com/vitejs/vite/issues/1972)
* perf: ignore node_modules when globbing import.meta.glob ([8b3d0ea](https://github.com/vitejs/vite/commit/8b3d0ea)), closes [#1974](https://github.com/vitejs/vite/issues/1974)
* feat: support --open for `vite preview` command (#1968) ([446b815](https://github.com/vitejs/vite/commit/446b815)), closes [#1968](https://github.com/vitejs/vite/issues/1968)
* feat(resolve): expose full resolve options via config ([0318c64](https://github.com/vitejs/vite/commit/0318c64)), closes [#1951](https://github.com/vitejs/vite/issues/1951)
* chore: fix type exports ([df0e957](https://github.com/vitejs/vite/commit/df0e957))



## 2.0.0-beta.67 (2021-02-09)

* release: v2.0.0-beta.67 ([ddc6d51](https://github.com/vitejs/vite/commit/ddc6d51))
* fix: do not open browser when restarting server (#1952) ([9af1517](https://github.com/vitejs/vite/commit/9af1517)), closes [#1952](https://github.com/vitejs/vite/issues/1952)
* fix(html): avoid duplicate preload link injection ([6e71596](https://github.com/vitejs/vite/commit/6e71596)), closes [#1957](https://github.com/vitejs/vite/issues/1957)
* fix(ssr): fix ssr node require for virtual modules ([fa2d7d6](https://github.com/vitejs/vite/commit/fa2d7d6))
* refactor: more explicit index exports ([49f6224](https://github.com/vitejs/vite/commit/49f6224))



## 2.0.0-beta.66 (2021-02-08)

* release: v2.0.0-beta.66 ([c7fef51](https://github.com/vitejs/vite/commit/c7fef51))
* fix: brotli skipped is printed when build.brotliSize is false (#1912) ([db3c324](https://github.com/vitejs/vite/commit/db3c324)), closes [#1912](https://github.com/vitejs/vite/issues/1912)
* fix: use dedicated endpoint for hmr reconnect ping ([b433607](https://github.com/vitejs/vite/commit/b433607)), closes [#1904](https://github.com/vitejs/vite/issues/1904)
* fix(import-analysis): fix literal dynamic id false positive ([6a6508e](https://github.com/vitejs/vite/commit/6a6508e)), closes [#1902](https://github.com/vitejs/vite/issues/1902)
* fix(resolve): avoid race condition in resolve skip check ([85f1e7b](https://github.com/vitejs/vite/commit/85f1e7b)), closes [#1937](https://github.com/vitejs/vite/issues/1937)
* fix(resolve): pass down resolve skip via context ([9066f27](https://github.com/vitejs/vite/commit/9066f27)), closes [#1937](https://github.com/vitejs/vite/issues/1937)
* fix(scan): only scan supported entry file types ([a93e61d](https://github.com/vitejs/vite/commit/a93e61d))
* fix(ssr): ssr external should take scannd imports into account ([92934d4](https://github.com/vitejs/vite/commit/92934d4)), closes [#1916](https://github.com/vitejs/vite/issues/1916)
* chore: ignore postcss load config type issue ([f11bf11](https://github.com/vitejs/vite/commit/f11bf11))
* chore: typo [skip ci] ([9273106](https://github.com/vitejs/vite/commit/9273106))
* chore: Update fsevents, chokidar, rollup (#1901) ([9726386](https://github.com/vitejs/vite/commit/9726386)), closes [#1901](https://github.com/vitejs/vite/issues/1901)
* dx(cli): adjust whitespace in console (#1920) ([dbbecdb](https://github.com/vitejs/vite/commit/dbbecdb)), closes [#1920](https://github.com/vitejs/vite/issues/1920)



## 2.0.0-beta.65 (2021-02-05)

* release: v2.0.0-beta.65 ([f43b420](https://github.com/vitejs/vite/commit/f43b420))
* feat: support absolute glob patterns ([159cc79](https://github.com/vitejs/vite/commit/159cc79)), closes [#1875](https://github.com/vitejs/vite/issues/1875)
* feat: support resolving style/sass entries in css @import ([f90a85c](https://github.com/vitejs/vite/commit/f90a85c)), closes [#1874](https://github.com/vitejs/vite/issues/1874)
* feat(cli): make --ssr flag value optional ([3c7b652](https://github.com/vitejs/vite/commit/3c7b652)), closes [#1877](https://github.com/vitejs/vite/issues/1877)
* feat(proxy): support conditional options for proxy request (#1888) ([e81a118](https://github.com/vitejs/vite/commit/e81a118)), closes [#1888](https://github.com/vitejs/vite/issues/1888)
* refactor: only ignore error if is ENOENT ([9c819b9](https://github.com/vitejs/vite/commit/9c819b9))
* refactor(css): use default CSS modules localsConvention settings ([fee7393](https://github.com/vitejs/vite/commit/fee7393))
* fix: better dependency non-js type file handling ([1fdc710](https://github.com/vitejs/vite/commit/1fdc710))
* fix: do not include vite in ssr externals ([578c591](https://github.com/vitejs/vite/commit/578c591)), closes [#1865](https://github.com/vitejs/vite/issues/1865)
* fix(build): ignore html asset urls that do not exist on disk ([02653f0](https://github.com/vitejs/vite/commit/02653f0)), closes [#1885](https://github.com/vitejs/vite/issues/1885)
* fix(dev): check wasClean in onclose event (#1872) ([5d3107a](https://github.com/vitejs/vite/commit/5d3107a)), closes [#1872](https://github.com/vitejs/vite/issues/1872)
* fix(resolve): prioritize file over dir with same name for resolve ([c741872](https://github.com/vitejs/vite/commit/c741872)), closes [#1871](https://github.com/vitejs/vite/issues/1871)
* fix(ssr): respect user defines for ssr ([3fad3ba](https://github.com/vitejs/vite/commit/3fad3ba))
* perf: improve resolve cache ([6a793d3](https://github.com/vitejs/vite/commit/6a793d3))


### BREAKING CHANGE

* CSS modules now defaults to export class names as-is.
To get camelCase exports like before, explictly set
`css.modules.localsConvention` via config.


## 2.0.0-beta.64 (2021-02-03)

* release: v2.0.0-beta.64 ([88f30d6](https://github.com/vitejs/vite/commit/88f30d6))
* fix(ssr): do not resolve to optimized deps during ssr ([d021506](https://github.com/vitejs/vite/commit/d021506)), closes [#1860](https://github.com/vitejs/vite/issues/1860)
* fix(ssr): fix externalized cjs deps that exports compiled esmodule ([8ec2d6f](https://github.com/vitejs/vite/commit/8ec2d6f))



## 2.0.0-beta.63 (2021-02-03)

* release: v2.0.0-beta.63 ([879922d](https://github.com/vitejs/vite/commit/879922d))
* test: remove stdin.resume() call ([b0e12c2](https://github.com/vitejs/vite/commit/b0e12c2))
* fix: consistently use mode for NODE_ENV in deps ([cd13ef0](https://github.com/vitejs/vite/commit/cd13ef0))
* fix: do not shim process with actual object ([8ad7ecd](https://github.com/vitejs/vite/commit/8ad7ecd))
* fix: make ssr external behavior consistent between dev/build ([e089eff](https://github.com/vitejs/vite/commit/e089eff))
* fix: only close if http server has listened ([94a8042](https://github.com/vitejs/vite/commit/94a8042)), closes [#1855](https://github.com/vitejs/vite/issues/1855)
* fix: respect config.build.brotliSize in reporter ([1d5437d](https://github.com/vitejs/vite/commit/1d5437d))
* fix(css): hoist external @import in concatenated css ([000ee62](https://github.com/vitejs/vite/commit/000ee62)), closes [#1845](https://github.com/vitejs/vite/issues/1845)
* fix(css): respect sass partial import convention ([cb7b6be](https://github.com/vitejs/vite/commit/cb7b6be))
* fix(scan): handle import glob in jsx/tsx files ([24695fe](https://github.com/vitejs/vite/commit/24695fe))
* fix(ssr): improve ssr external heuristics ([928fc33](https://github.com/vitejs/vite/commit/928fc33)), closes [#1854](https://github.com/vitejs/vite/issues/1854)
* fix(vite): close server and exit if stdin ends (#1857) ([b065ede](https://github.com/vitejs/vite/commit/b065ede)), closes [#1857](https://github.com/vitejs/vite/issues/1857)
* chore: do not clearline if not logging ([71f1c63](https://github.com/vitejs/vite/commit/71f1c63))
* chore: fix less type ([3f6d129](https://github.com/vitejs/vite/commit/3f6d129))
* chore: log indent fix ([0275f1f](https://github.com/vitejs/vite/commit/0275f1f))
* feat(ssr): graduate ssr method types ([0fe2634](https://github.com/vitejs/vite/commit/0fe2634))



## 2.0.0-beta.62 (2021-02-02)

* release: v2.0.0-beta.62 ([0e600e1](https://github.com/vitejs/vite/commit/0e600e1))
* fix: properly cascade asset hash change ([f8e4eeb](https://github.com/vitejs/vite/commit/f8e4eeb))
* fix(optimizer): fix cjs interop check on entries with identical ending ([338d17a](https://github.com/vitejs/vite/commit/338d17a)), closes [#1847](https://github.com/vitejs/vite/issues/1847)
* fix(scan): handle tsx lang in SFCs during dep scan (#1837) ([be9bc3f](https://github.com/vitejs/vite/commit/be9bc3f)), closes [#1837](https://github.com/vitejs/vite/issues/1837)
* feat: better build output + options for brotli / chunk size warning ([da1b06f](https://github.com/vitejs/vite/commit/da1b06f))
* feat(dev): inject env for webworker (#1846) ([5735692](https://github.com/vitejs/vite/commit/5735692)), closes [#1846](https://github.com/vitejs/vite/issues/1846) [#1838](https://github.com/vitejs/vite/issues/1838)
* chore: do not warn on remote @import when minifying css ([8fa57a3](https://github.com/vitejs/vite/commit/8fa57a3)), closes [#1845](https://github.com/vitejs/vite/issues/1845)



## 2.0.0-beta.61 (2021-02-01)

* release: v2.0.0-beta.61 ([29353e8](https://github.com/vitejs/vite/commit/29353e8))
* fix: yarn pnp resolveDir ([9c6edef](https://github.com/vitejs/vite/commit/9c6edef))
* fix(less): fix less @import url rebasing ([41783fa](https://github.com/vitejs/vite/commit/41783fa)), closes [#1834](https://github.com/vitejs/vite/issues/1834)
* fix(manifest): include assets referenced via CSS in manifest entries ([34894a2](https://github.com/vitejs/vite/commit/34894a2)), closes [#1827](https://github.com/vitejs/vite/issues/1827)
* fix(optimizer): fix cjs export interop for webpacked output ([4b6ebc3](https://github.com/vitejs/vite/commit/4b6ebc3)), closes [#1830](https://github.com/vitejs/vite/issues/1830)
* fix(ssr): do not inject hmr timestamp when transforming for ssr (#1825) ([8ace645](https://github.com/vitejs/vite/commit/8ace645)), closes [#1825](https://github.com/vitejs/vite/issues/1825)
* refactor: reuse fileToDevUrl logic in css plugin ([2144ce9](https://github.com/vitejs/vite/commit/2144ce9))



## 2.0.0-beta.60 (2021-01-31)

* release: v2.0.0-beta.60 ([29bec9c](https://github.com/vitejs/vite/commit/29bec9c))
* fix(hmr): do not update on file unlink when there are no affected modules (#1818) ([59fe913](https://github.com/vitejs/vite/commit/59fe913)), closes [#1818](https://github.com/vitejs/vite/issues/1818)
* fix(optimizer): entry resolving for yarn pnp ([febff7b](https://github.com/vitejs/vite/commit/febff7b)), closes [#1813](https://github.com/vitejs/vite/issues/1813)
* fix(optimizer): fix cjs interop for packages that cannot be ([3b85296](https://github.com/vitejs/vite/commit/3b85296)), closes [#1821](https://github.com/vitejs/vite/issues/1821)
* fix(scan): skip non-absolute resolved paths during scan ([f635971](https://github.com/vitejs/vite/commit/f635971))
* feat: support ?url special query ([0006e89](https://github.com/vitejs/vite/commit/0006e89))
* refactor: remove unsupported plugin context methods ([dce82bf](https://github.com/vitejs/vite/commit/dce82bf))



## 2.0.0-beta.59 (2021-01-30)

* release: v2.0.0-beta.59 ([9deb6d7](https://github.com/vitejs/vite/commit/9deb6d7))
* chore: fix windows path ([b45b08d](https://github.com/vitejs/vite/commit/b45b08d))
* chore: remove stale condition ([2309e74](https://github.com/vitejs/vite/commit/2309e74))
* fix(optimizer): exclude should apply to deep imports ([3c22f84](https://github.com/vitejs/vite/commit/3c22f84))
* fix(optimizer): separate dep entry proxy modules from actual modules ([8e1d3d8](https://github.com/vitejs/vite/commit/8e1d3d8))
* refactor: move container initialization out of scan plugin ([6a72190](https://github.com/vitejs/vite/commit/6a72190))



## 2.0.0-beta.58 (2021-01-29)

* release: v2.0.0-beta.58 ([a2ba25b](https://github.com/vitejs/vite/commit/a2ba25b))
* fix: do not generate import specifier if not needed ([e438802](https://github.com/vitejs/vite/commit/e438802))
* fix(optimizer): handle rollup plugin virtual ids ([a748896](https://github.com/vitejs/vite/commit/a748896)), closes [#1804](https://github.com/vitejs/vite/issues/1804)
* feat: add ViteDevServer.transformIndexHtml method for ssr ([dbe1f4a](https://github.com/vitejs/vite/commit/dbe1f4a)), closes [#1745](https://github.com/vitejs/vite/issues/1745)
* feat: support configuring publicDir via config ([470ceb8](https://github.com/vitejs/vite/commit/470ceb8)), closes [#1799](https://github.com/vitejs/vite/issues/1799)



## 2.0.0-beta.57 (2021-01-29)

* release: v2.0.0-beta.57 ([f4719e4](https://github.com/vitejs/vite/commit/f4719e4))
* fix: still account for plugins in optimizer hash ([82dce90](https://github.com/vitejs/vite/commit/82dce90))
* fix(optimizer): check qualified deps length after accounting for include ([6a03813](https://github.com/vitejs/vite/commit/6a03813))
* fix(optimizer): exclude ?worker and ?raw from runtime dep discovery ([d216da0](https://github.com/vitejs/vite/commit/d216da0))
* fix(optimizer): fix entry cross imports ([a9ca3da](https://github.com/vitejs/vite/commit/a9ca3da)), closes [#1801](https://github.com/vitejs/vite/issues/1801)
* fix(optimizer): properly externalize unknown types ([c3b81a8](https://github.com/vitejs/vite/commit/c3b81a8)), closes [#1793](https://github.com/vitejs/vite/issues/1793)
* fix(optimizer): respect ids that resolve to external urls during scan ([328b6b9](https://github.com/vitejs/vite/commit/328b6b9)), closes [#1798](https://github.com/vitejs/vite/issues/1798)
* chore: improve pre-bundle message ([462f2bc](https://github.com/vitejs/vite/commit/462f2bc))



## 2.0.0-beta.56 (2021-01-29)

* release: v2.0.0-beta.56 ([0e8f4cb](https://github.com/vitejs/vite/commit/0e8f4cb))
* perf: use esbuild service mode during pre-bundling ([b24b07c](https://github.com/vitejs/vite/commit/b24b07c))
* fix(optimizer): handle alias to optimized entries ([81eb7a0](https://github.com/vitejs/vite/commit/81eb7a0)), closes [#1780](https://github.com/vitejs/vite/issues/1780)



## 2.0.0-beta.55 (2021-01-28)

* release: v2.0.0-beta.55 ([e7dd4f8](https://github.com/vitejs/vite/commit/e7dd4f8))
* fix(optimizer): use js loader for resolved mjs files in esbuild ([0f2c2ce](https://github.com/vitejs/vite/commit/0f2c2ce))



## 2.0.0-beta.54 (2021-01-28)

* release: v2.0.0-beta.54 ([f31e11d](https://github.com/vitejs/vite/commit/f31e11d))
* fix(optimizer): map entries to their file paths when passed as importer ([32ba8fb](https://github.com/vitejs/vite/commit/32ba8fb))
* chore: only call Date.now when debugging ([06ed207](https://github.com/vitejs/vite/commit/06ed207))



## 2.0.0-beta.53 (2021-01-28)

* release: v2.0.0-beta.53 ([55bf2e0](https://github.com/vitejs/vite/commit/55bf2e0))
* refactor: generate more controlled esbuild dep file structure ([04f9dc6](https://github.com/vitejs/vite/commit/04f9dc6))
* fix: dependency scan with esbuild when using non-HTML entrypoints (#1772) ([ca862a2](https://github.com/vitejs/vite/commit/ca862a2)), closes [#1772](https://github.com/vitejs/vite/issues/1772) [#1763](https://github.com/vitejs/vite/issues/1763)
* fix: fix pure css chunk removal ([d69d49d](https://github.com/vitejs/vite/commit/d69d49d))
* fix: hold missing dep requests while re-bundling ([8e28803](https://github.com/vitejs/vite/commit/8e28803))
* fix: more stable request hold ([be0e698](https://github.com/vitejs/vite/commit/be0e698))
* fix(css): pure css chunk removal + manifest entry with multiple css files ([cadf38c](https://github.com/vitejs/vite/commit/cadf38c)), closes [#1776](https://github.com/vitejs/vite/issues/1776)
* fix(optimizer): add separate hash for invalidating optimized deps ([216ae8e](https://github.com/vitejs/vite/commit/216ae8e))
* fix(optimizer): externalize json ([c3e52f2](https://github.com/vitejs/vite/commit/c3e52f2))
* fix(optimizer): invalidate all modules on deps rebundle ([02053a2](https://github.com/vitejs/vite/commit/02053a2))
* fix(optimizer): use all inputs for optimized entry matching ([9ecf52b](https://github.com/vitejs/vite/commit/9ecf52b)), closes [#1769](https://github.com/vitejs/vite/issues/1769)
* fix(optimizer): use vite resolver for yarn 2 fallback ([475aae4](https://github.com/vitejs/vite/commit/475aae4)), closes [#1778](https://github.com/vitejs/vite/issues/1778)
* chore: move externalize warning to debug ([f54839a](https://github.com/vitejs/vite/commit/f54839a))
* Revert "chore: remove unused logic" ([6b154f0](https://github.com/vitejs/vite/commit/6b154f0))


### BREAKING CHANGE

* the "css" property of build manifest entries is now an
array because it is possible for an entry to link to multiple generated
css files.


## 2.0.0-beta.52 (2021-01-28)

* release: v2.0.0-beta.52 ([7e726a6](https://github.com/vitejs/vite/commit/7e726a6))
* fix: always normalize fs prefix slashes ([99e4edd](https://github.com/vitejs/vite/commit/99e4edd))
* fix(optimizer): fix ?raw import and import with queries in pre-bundling ([2f1efa3](https://github.com/vitejs/vite/commit/2f1efa3)), closes [#1759](https://github.com/vitejs/vite/issues/1759)
* fix(optimizer): fix optimizer updates on new dep discovery ([b2110af](https://github.com/vitejs/vite/commit/b2110af)), closes [#1755](https://github.com/vitejs/vite/issues/1755)
* chore: remove unused logic ([6fe72f0](https://github.com/vitejs/vite/commit/6fe72f0))



## 2.0.0-beta.51 (2021-01-27)

* release: v2.0.0-beta.51 ([327fa71](https://github.com/vitejs/vite/commit/327fa71))
* fix: allow ssr css preloads in preload-helper (#1734) ([1dfda16](https://github.com/vitejs/vite/commit/1dfda16)), closes [#1734](https://github.com/vitejs/vite/issues/1734)
* fix: avoid removing double slash in fileToUrl ([f6db155](https://github.com/vitejs/vite/commit/f6db155))
* fix: css @import alias for windows ([71fcfdf](https://github.com/vitejs/vite/commit/71fcfdf))
* fix: don't override resolver options (#1740) ([73196e5](https://github.com/vitejs/vite/commit/73196e5)), closes [#1740](https://github.com/vitejs/vite/issues/1740)
* fix: handle vite client path with dollar signs (#1732) ([20bacf7](https://github.com/vitejs/vite/commit/20bacf7)), closes [#1732](https://github.com/vitejs/vite/issues/1732) [#1423](https://github.com/vitejs/vite/issues/1423)
* fix: resolve css @import relative imports without leading dot ([78eb32c](https://github.com/vitejs/vite/commit/78eb32c)), closes [#1737](https://github.com/vitejs/vite/issues/1737)
* fix: scan on windows ([5f7698b](https://github.com/vitejs/vite/commit/5f7698b))
* fix(build): ensure lib mode file name is correctly inferred for scoped packages (#1754) ([c2e8806](https://github.com/vitejs/vite/commit/c2e8806)), closes [#1754](https://github.com/vitejs/vite/issues/1754)
* fix(hmr): fix hmr for @fs urls ([b5987c1](https://github.com/vitejs/vite/commit/b5987c1)), closes [#1749](https://github.com/vitejs/vite/issues/1749)
* fix(optimizer): attempt resolve node builtin first before externalizing ([74b55b8](https://github.com/vitejs/vite/commit/74b55b8)), closes [#1746](https://github.com/vitejs/vite/issues/1746)
* fix(optimizer): do not perform treeshaking for pre-bundling ([6b619c4](https://github.com/vitejs/vite/commit/6b619c4))
* fix(optimizer): entry matching for .mjs entries ([ebe71c4](https://github.com/vitejs/vite/commit/ebe71c4)), closes [#1739](https://github.com/vitejs/vite/issues/1739)
* chore: add icon on server start ([52a3d68](https://github.com/vitejs/vite/commit/52a3d68))
* chore: avoid string.matchAll for compat ([7c9ad4d](https://github.com/vitejs/vite/commit/7c9ad4d))
* chore: comments ([a5a6843](https://github.com/vitejs/vite/commit/a5a6843))
* chore: only log errors when pre-bundling ([2f41d3f](https://github.com/vitejs/vite/commit/2f41d3f))
* feat: auto re-run dep optimization on discovery of new imports ([470b4e4](https://github.com/vitejs/vite/commit/470b4e4))
* feat: dep optimizer entry option ([64ba807](https://github.com/vitejs/vite/commit/64ba807))
* feat: import resolving + url rebasing for less ([f266bb7](https://github.com/vitejs/vite/commit/f266bb7))
* feat: new manifest format ([51bc1ec](https://github.com/vitejs/vite/commit/51bc1ec))
* feat: proper css resolving + sass import url rebase ([477f174](https://github.com/vitejs/vite/commit/477f174))
* feat: use esbuild to scan imports ([d0f8b12](https://github.com/vitejs/vite/commit/d0f8b12))
* feat(css): support alias in css @imports ([82d87d9](https://github.com/vitejs/vite/commit/82d87d9)), closes [#650](https://github.com/vitejs/vite/issues/650)
* wip: dep scanning handling glob import ([5fe9001](https://github.com/vitejs/vite/commit/5fe9001))
* wip: externalize excluded deps ([e74ddf2](https://github.com/vitejs/vite/commit/e74ddf2))
* wip: handle absolute paths in html ([c91dbe8](https://github.com/vitejs/vite/commit/c91dbe8))
* wip: no longer need pkg deps in optimizer hash ([929cba3](https://github.com/vitejs/vite/commit/929cba3))
* wip: windows paths ([d42f2bf](https://github.com/vitejs/vite/commit/d42f2bf))
* refactor: adjust optimizeDeps options ([fd5e7c0](https://github.com/vitejs/vite/commit/fd5e7c0))
* refactor: expose file directly in chunk to css map ([0aa5849](https://github.com/vitejs/vite/commit/0aa5849))
* refactor: improve failed dep resolve error handling ([33be9a8](https://github.com/vitejs/vite/commit/33be9a8))


### BREAKING CHANGE

* `optimizeDeps` options have been adjusted.
    - Dependencies are now automatically scanned from source code. There
      is no longer the need to specify deep imports.
    - `optimizeDeps.include` and `optimizeDeps.exclude` now expect type `string[]`.
    - `optimizeDpes.link` and `optimizeDeps.auto` are removed.
* the build manifest format has changed. See
https://vitejs.dev/guide/backend-integration.html for more details.


## 2.0.0-beta.50 (2021-01-26)

* release: v2.0.0-beta.50 ([d8689b8](https://github.com/vitejs/vite/commit/d8689b8))
* fix: json plugin error report line regex (#1719) ([35e1f52](https://github.com/vitejs/vite/commit/35e1f52)), closes [#1719](https://github.com/vitejs/vite/issues/1719)
* fix: properly handle base + path in hmr config ([1e67d66](https://github.com/vitejs/vite/commit/1e67d66))
* fix(optimizer): externalize cross-package imported css ([0599908](https://github.com/vitejs/vite/commit/0599908)), closes [#1722](https://github.com/vitejs/vite/issues/1722)
* fix(optimizer): fix entry analysis fs read on case-sensitive systems ([1a9b321](https://github.com/vitejs/vite/commit/1a9b321)), closes [#1720](https://github.com/vitejs/vite/issues/1720)
* fix(optimizer): fix entry matching edge case ([c5fe45f](https://github.com/vitejs/vite/commit/c5fe45f)), closes [#1661](https://github.com/vitejs/vite/issues/1661)
* fix(optimizer): handle special case where esm entry gets converted to cjs by esbuild ([32413ce](https://github.com/vitejs/vite/commit/32413ce)), closes [#1724](https://github.com/vitejs/vite/issues/1724)
* fix(optimizer): pnp compat to match relative paths (#1714) ([8fb74f5](https://github.com/vitejs/vite/commit/8fb74f5)), closes [#1714](https://github.com/vitejs/vite/issues/1714)
* fix(sourcemap): empty source map chain on nullified sourcemap ([52c9416](https://github.com/vitejs/vite/commit/52c9416)), closes [#1726](https://github.com/vitejs/vite/issues/1726)
* feat: allow speicfying ssr entry directly via build.ssr option ([45d8bf4](https://github.com/vitejs/vite/commit/45d8bf4))



## 2.0.0-beta.49 (2021-01-25)

* release: v2.0.0-beta.49 ([36857fc](https://github.com/vitejs/vite/commit/36857fc))
* fix: do not move css modules to vendor chunk ([3d55e83](https://github.com/vitejs/vite/commit/3d55e83)), closes [#1703](https://github.com/vitejs/vite/issues/1703)
* fix: fix hmr.path option normalization ([cbeb9ba](https://github.com/vitejs/vite/commit/cbeb9ba)), closes [#1705](https://github.com/vitejs/vite/issues/1705)
* fix(config): fix native esm config loading on windows ([33d3cca](https://github.com/vitejs/vite/commit/33d3cca))
* fix(optimizer): entry matching on windows ([e6120d5](https://github.com/vitejs/vite/commit/e6120d5))
* fix(optimizer): fix output to entry matching logic ([6c96883](https://github.com/vitejs/vite/commit/6c96883)), closes [#1704](https://github.com/vitejs/vite/issues/1704)
* fix(ssr): generate same asset url links for ssr build ([68960f7](https://github.com/vitejs/vite/commit/68960f7)), closes [#1711](https://github.com/vitejs/vite/issues/1711)
* fix(watcher): ensure only add normalized file paths ([a19c456](https://github.com/vitejs/vite/commit/a19c456))
* fix(watcher): watch fs specific root paths ([64d2c17](https://github.com/vitejs/vite/commit/64d2c17))



## 2.0.0-beta.48 (2021-01-25)

* release: v2.0.0-beta.48 ([1ddbc57](https://github.com/vitejs/vite/commit/1ddbc57))
* fix: externalize known css types during dep-prebundling ([02a0324](https://github.com/vitejs/vite/commit/02a0324)), closes [#1695](https://github.com/vitejs/vite/issues/1695)
* fix: fallback to static middleware on unfound source maps ([2096309](https://github.com/vitejs/vite/commit/2096309))
* fix: preload marker incorrect replacement ([7f83deb](https://github.com/vitejs/vite/commit/7f83deb))
* fix: remove preload markers in all cases ([6cd2d35](https://github.com/vitejs/vite/commit/6cd2d35)), closes [#1694](https://github.com/vitejs/vite/issues/1694)
* fix: resolve library entry ([3240db1](https://github.com/vitejs/vite/commit/3240db1))
* feat: resolved ids rollup compat for win32 (#1693) ([e2137b7](https://github.com/vitejs/vite/commit/e2137b7)), closes [#1693](https://github.com/vitejs/vite/issues/1693) [#1522](https://github.com/vitejs/vite/issues/1522)



## 2.0.0-beta.47 (2021-01-24)

* release: v2.0.0-beta.47 ([6164794](https://github.com/vitejs/vite/commit/6164794))
* fix: do not apply json plugin to commonjs proxy ([a92f430](https://github.com/vitejs/vite/commit/a92f430)), closes [#1679](https://github.com/vitejs/vite/issues/1679)
* fix: esbuild optimizer yarn 2 pnp compat ([028c3bb](https://github.com/vitejs/vite/commit/028c3bb)), closes [#1688](https://github.com/vitejs/vite/issues/1688)
* fix: fix incorrect preload placeholder regex ([5ca43ef](https://github.com/vitejs/vite/commit/5ca43ef)), closes [#1686](https://github.com/vitejs/vite/issues/1686)
* fix: fix server.watch option ignore overwriting defaults (#1680) ([33cffa3](https://github.com/vitejs/vite/commit/33cffa3)), closes [#1680](https://github.com/vitejs/vite/issues/1680)
* perf(build): improve performance of default vendor chunk splitting (#1690) ([0bed9c4](https://github.com/vitejs/vite/commit/0bed9c4)), closes [#1690](https://github.com/vitejs/vite/issues/1690)



## 2.0.0-beta.46 (2021-01-24)

* release: v2.0.0-beta.46 ([d884424](https://github.com/vitejs/vite/commit/d884424))
* fix(css): fix extract concurrency issue when disabling cssCodeSplit ([4ac7e7e](https://github.com/vitejs/vite/commit/4ac7e7e))



## 2.0.0-beta.45 (2021-01-24)

* release: v2.0.0-beta.45 ([bda8e3b](https://github.com/vitejs/vite/commit/bda8e3b))
* feat: default vendor chunk splitting ([f6b58a0](https://github.com/vitejs/vite/commit/f6b58a0))
* feat: disable prompts and clearScreen on CI ([63dd1a2](https://github.com/vitejs/vite/commit/63dd1a2)), closes [#1673](https://github.com/vitejs/vite/issues/1673)
* feat: source map for optimized deps ([972b13e](https://github.com/vitejs/vite/commit/972b13e))
* feat: support stringifying json ([98c321b](https://github.com/vitejs/vite/commit/98c321b)), closes [#1672](https://github.com/vitejs/vite/issues/1672)
* feat: vite preview command for previewing build output ([a198990](https://github.com/vitejs/vite/commit/a198990)), closes [#1627](https://github.com/vitejs/vite/issues/1627)
* fix: import analysis dynamic import check ([d4909b9](https://github.com/vitejs/vite/commit/d4909b9))
* fix: revert trailing slash handling + improve dev base usage ([01e9ac0](https://github.com/vitejs/vite/commit/01e9ac0)), closes [#1664](https://github.com/vitejs/vite/issues/1664)
* fix: support empty, relative and external base values ([00bc446](https://github.com/vitejs/vite/commit/00bc446)), closes [#1669](https://github.com/vitejs/vite/issues/1669)
* fix(hmr): fix nested hmr accept calls with base ([2950c3c](https://github.com/vitejs/vite/commit/2950c3c))
* fix(hmr): preserve host when updating link CSS ([60f9782](https://github.com/vitejs/vite/commit/60f9782)), closes [#1665](https://github.com/vitejs/vite/issues/1665)
* fix(html): ensure quote in rebased asset urls in html ([7306610](https://github.com/vitejs/vite/commit/7306610)), closes [#1668](https://github.com/vitejs/vite/issues/1668)
* fix(import-anaysis): markPos out-of-range  for overwrite (#1671) ([226e984](https://github.com/vitejs/vite/commit/226e984)), closes [#1671](https://github.com/vitejs/vite/issues/1671)
* fix(optimizer): repsect alias in pre-bundling ([2824d06](https://github.com/vitejs/vite/commit/2824d06)), closes [#1674](https://github.com/vitejs/vite/issues/1674)
* fix(resolve): handle paths starting with slash in entry fields ([13da32e](https://github.com/vitejs/vite/commit/13da32e)), closes [#1676](https://github.com/vitejs/vite/issues/1676)
* refactor: source map tweaks ([f2ca1bf](https://github.com/vitejs/vite/commit/f2ca1bf)), closes [#1677](https://github.com/vitejs/vite/issues/1677)
* chore: export type ([46bb853](https://github.com/vitejs/vite/commit/46bb853))
* chore: fix type ([629d60b](https://github.com/vitejs/vite/commit/629d60b))



## 2.0.0-beta.44 (2021-01-23)

* release: v2.0.0-beta.44 ([d85c088](https://github.com/vitejs/vite/commit/d85c088))
* chore: improve unwanted dep detection ([85b4e17](https://github.com/vitejs/vite/commit/85b4e17))
* fix: esbuild dep resolving on windows ([62e4d72](https://github.com/vitejs/vite/commit/62e4d72))



## 2.0.0-beta.43 (2021-01-23)

* release: v2.0.0-beta.43 ([ac18c3e](https://github.com/vitejs/vite/commit/ac18c3e))
* fix(optimizer): force vite resolver for esbuild pre-bundle ([4c4d629](https://github.com/vitejs/vite/commit/4c4d629))



## 2.0.0-beta.42 (2021-01-23)

* release: v2.0.0-beta.42 ([7b85755](https://github.com/vitejs/vite/commit/7b85755))
* fix(optimizer): ensure esbuild use vite-resolved entries ([bdb9b3c](https://github.com/vitejs/vite/commit/bdb9b3c))



## 2.0.0-beta.41 (2021-01-23)

* release: v2.0.0-beta.41 ([69d8d01](https://github.com/vitejs/vite/commit/69d8d01))
* fix: lower .mjs resolve priority ([b15e90e](https://github.com/vitejs/vite/commit/b15e90e)), closes [#1660](https://github.com/vitejs/vite/issues/1660)



## 2.0.0-beta.40 (2021-01-23)

* release: v2.0.0-beta.40 ([2f7ecaf](https://github.com/vitejs/vite/commit/2f7ecaf))
* fix(optimizer): compiled esmdoule interop ([6826624](https://github.com/vitejs/vite/commit/6826624)), closes [#1659](https://github.com/vitejs/vite/issues/1659)



## 2.0.0-beta.39 (2021-01-23)

* release: v2.0.0-beta.39 ([523198e](https://github.com/vitejs/vite/commit/523198e))
* fix: file dir resolve should prioritize package.json ([ce2d49a](https://github.com/vitejs/vite/commit/ce2d49a))
* fix: hmr port fallback in middlewareMode ([36a9456](https://github.com/vitejs/vite/commit/36a9456))
* fix(optimizer): fix es interop heuristics for entry with only export * from ([ef1a7e3](https://github.com/vitejs/vite/commit/ef1a7e3))
* fix(ssr): avoid resolving externals to mjs ([3955fe3](https://github.com/vitejs/vite/commit/3955fe3))
* fix(ssr): do not inject ?import query for ssr transforms ([7d26119](https://github.com/vitejs/vite/commit/7d26119)), closes [#1655](https://github.com/vitejs/vite/issues/1655)
* fix(ssr): remove import query in ssrLoadModule ([80473c1](https://github.com/vitejs/vite/commit/80473c1))
* refactor: server restart handling in middleware mode ([98f60e5](https://github.com/vitejs/vite/commit/98f60e5))
* chore: do not error on failed load ([c30f6d7](https://github.com/vitejs/vite/commit/c30f6d7))



## 2.0.0-beta.38 (2021-01-23)

* release: v2.0.0-beta.38 ([3dd193d](https://github.com/vitejs/vite/commit/3dd193d))
* chore: fix esbuild entries ([01c047e](https://github.com/vitejs/vite/commit/01c047e))
* chore: improve deep import message ([4fe51be](https://github.com/vitejs/vite/commit/4fe51be))
* chore: more warn ([de01271](https://github.com/vitejs/vite/commit/de01271))
* chore: remove rollup options from optimizer hash ([2261fc3](https://github.com/vitejs/vite/commit/2261fc3))
* fix: exclude spa-fallback middleware in middlewareMode (#1645) ([843c879](https://github.com/vitejs/vite/commit/843c879)), closes [#1645](https://github.com/vitejs/vite/issues/1645)
* fix(dev): remove comment for sourcemap reference at debug (#1658) ([16248c0](https://github.com/vitejs/vite/commit/16248c0)), closes [#1658](https://github.com/vitejs/vite/issues/1658)
* fix(optimizer): improve exports analysis ([406cbea](https://github.com/vitejs/vite/commit/406cbea))
* fix(ssr): fix ssr transform edge cases ([f22ddbd](https://github.com/vitejs/vite/commit/f22ddbd)), closes [#1646](https://github.com/vitejs/vite/issues/1646)
* refactor: remove optimizeDeps.plugins ([38524f6](https://github.com/vitejs/vite/commit/38524f6))
* refactor: use split esbuild pre-bundling ([626cf15](https://github.com/vitejs/vite/commit/626cf15))
* feat: esbuild based dep pre-bundling ([6e7f652](https://github.com/vitejs/vite/commit/6e7f652))
* feat: support `base` option during dev, deprecate `build.base` (#1556) ([809d4bd](https://github.com/vitejs/vite/commit/809d4bd)), closes [#1556](https://github.com/vitejs/vite/issues/1556)


### BREAKING CHANGE

* `optimizeDeps.plugins` has been removed. The dep
optimizer is now using `esbuild`, and all non-js files are automatically
externalized to be processed by Vite's transform pipeline when imported.


## 2.0.0-beta.37 (2021-01-22)

* release: v2.0.0-beta.36 ([30f06d9](https://github.com/vitejs/vite/commit/30f06d9))
* release: v2.0.0-beta.37 ([76c4bad](https://github.com/vitejs/vite/commit/76c4bad))
* fix: always reload when html is edited in middleware mode ([85c89be](https://github.com/vitejs/vite/commit/85c89be))
* fix: handle esm config syntax error in Node 12 ([20cf718](https://github.com/vitejs/vite/commit/20cf718)), closes [#1635](https://github.com/vitejs/vite/issues/1635)
* fix: normalize paths for cjs optimized deps on windows (#1631) ([b462e33](https://github.com/vitejs/vite/commit/b462e33)), closes [#1631](https://github.com/vitejs/vite/issues/1631)
* fix: still resolve jsnext fields ([4e0cd73](https://github.com/vitejs/vite/commit/4e0cd73))
* fix(css): fix url rewriting in @imported css ([52ae44f](https://github.com/vitejs/vite/commit/52ae44f)), closes [#1629](https://github.com/vitejs/vite/issues/1629)
* fix(manifest): avoid chunks with same name overwriting one another ([cf81aa3](https://github.com/vitejs/vite/commit/cf81aa3)), closes [#1632](https://github.com/vitejs/vite/issues/1632)
* fix(ssr): do not inject inlined css in ssr build ([5d77665](https://github.com/vitejs/vite/commit/5d77665)), closes [#1643](https://github.com/vitejs/vite/issues/1643)
* refactor: improve bare import regex ([2a17967](https://github.com/vitejs/vite/commit/2a17967))
* types: fix export, use public trimmed dts ([57c0343](https://github.com/vitejs/vite/commit/57c0343))
* feat: allow inline postcss config ([6bd2140](https://github.com/vitejs/vite/commit/6bd2140)), closes [#1061](https://github.com/vitejs/vite/issues/1061)
* feat: hmr for glob import ([edd2fd9](https://github.com/vitejs/vite/commit/edd2fd9))



## 2.0.0-beta.35 (2021-01-20)

* release: v2.0.0-beta.35 ([6d06ec0](https://github.com/vitejs/vite/commit/6d06ec0))
* fix: allow direct inspection of static file via browser ([a3c334f](https://github.com/vitejs/vite/commit/a3c334f)), closes [#1612](https://github.com/vitejs/vite/issues/1612)
* fix: also resolve for module condition ([3a3029e](https://github.com/vitejs/vite/commit/3a3029e)), closes [#1583](https://github.com/vitejs/vite/issues/1583)
* fix: do not apply jsxInject on ts files ([a72a59c](https://github.com/vitejs/vite/commit/a72a59c))
* fix: inline async css for legacy builds ([940d483](https://github.com/vitejs/vite/commit/940d483))
* fix: manually test global regex codeframeRE index (#1608) ([20d6c0f](https://github.com/vitejs/vite/commit/20d6c0f)), closes [#1608](https://github.com/vitejs/vite/issues/1608)
* fix: properly format css pre-processor errors from @imported files ([ec18bde](https://github.com/vitejs/vite/commit/ec18bde)), closes [#1600](https://github.com/vitejs/vite/issues/1600) [#1601](https://github.com/vitejs/vite/issues/1601)
* fix(asset): use stricter asset url marker and regex ([e6c8478](https://github.com/vitejs/vite/commit/e6c8478)), closes [#1602](https://github.com/vitejs/vite/issues/1602)
* fix(plugin-dynamic-import): include assetDir in dynamic import polyfill module path (#1610) ([47ff0f4](https://github.com/vitejs/vite/commit/47ff0f4)), closes [#1610](https://github.com/vitejs/vite/issues/1610)
* fix(resolve): get pkg  from importer for relative id (#1599) ([c821f09](https://github.com/vitejs/vite/commit/c821f09)), closes [#1599](https://github.com/vitejs/vite/issues/1599)
* chore: fix path import ([1c62706](https://github.com/vitejs/vite/commit/1c62706))
* feat: detect and warn against imports to transitively optimized deps ([3841e70](https://github.com/vitejs/vite/commit/3841e70)), closes [#1543](https://github.com/vitejs/vite/issues/1543)
* feat(manifest): include dynamic entries and dynamic imports (#1609) ([9ed4908](https://github.com/vitejs/vite/commit/9ed4908)), closes [#1609](https://github.com/vitejs/vite/issues/1609)
* refactor: improve dep optimization heuristics ([16393a1](https://github.com/vitejs/vite/commit/16393a1))



## 2.0.0-beta.34 (2021-01-20)

* release: v2.0.0-beta.34 ([77329b7](https://github.com/vitejs/vite/commit/77329b7))
* fix: default changeOrigin to true in proxy option shorthand ([b008bd5](https://github.com/vitejs/vite/commit/b008bd5)), closes [#1577](https://github.com/vitejs/vite/issues/1577)
* fix: emit css only once when there are multiple outputs ([6bce108](https://github.com/vitejs/vite/commit/6bce108)), closes [#1590](https://github.com/vitejs/vite/issues/1590)
* fix: handle legacy chunks in manifest ([123b6f6](https://github.com/vitejs/vite/commit/123b6f6)), closes [#1551](https://github.com/vitejs/vite/issues/1551)
* fix: use safe dynamic import rewrite ([5cb02ce](https://github.com/vitejs/vite/commit/5cb02ce)), closes [#1563](https://github.com/vitejs/vite/issues/1563)
* fix(hmr): fix hmr invalidation on circular deps ([ca8442c](https://github.com/vitejs/vite/commit/ca8442c)), closes [#1477](https://github.com/vitejs/vite/issues/1477)
* fix(optimizer): handle commonjs require css (#1568) ([3d09b50](https://github.com/vitejs/vite/commit/3d09b50)), closes [#1568](https://github.com/vitejs/vite/issues/1568) [#1566](https://github.com/vitejs/vite/issues/1566)
* fix(resolve): node resolve from virtual modules ([c6d5ed8](https://github.com/vitejs/vite/commit/c6d5ed8))



## 2.0.0-beta.33 (2021-01-19)

* release: v2.0.0-beta.33 ([acf8d3d](https://github.com/vitejs/vite/commit/acf8d3d))
* fix: fix ssr module invalidation infinite loop ([30885d1](https://github.com/vitejs/vite/commit/30885d1)), closes [#1591](https://github.com/vitejs/vite/issues/1591)



## 2.0.0-beta.32 (2021-01-19)

* release: v2.0.0-beta.32 ([56fb4ca](https://github.com/vitejs/vite/commit/56fb4ca))
* chore: fix build type ([16f7cf8](https://github.com/vitejs/vite/commit/16f7cf8))
* chore: mark ssr related options/methods alpha ([4d8eca9](https://github.com/vitejs/vite/commit/4d8eca9))
* chore: todo ([1c99135](https://github.com/vitejs/vite/commit/1c99135))
* chore: update license ([f634d41](https://github.com/vitejs/vite/commit/f634d41))
* fix: avoid preloading owner chunk ([61969d7](https://github.com/vitejs/vite/commit/61969d7))
* fix: ssr transform check valid inMap ([bf4b3e9](https://github.com/vitejs/vite/commit/bf4b3e9))
* fix: support resolving .json ext to be consistent with Node ([a1d1dde](https://github.com/vitejs/vite/commit/a1d1dde))
* wip: automatic ssr externals inference ([b813b00](https://github.com/vitejs/vite/commit/b813b00))
* wip: basic SSR support ([7a15ada](https://github.com/vitejs/vite/commit/7a15ada))
* wip: css ssr compat ([27a4f35](https://github.com/vitejs/vite/commit/27a4f35))
* wip: do not emit assets in ssr build ([ffaf50d](https://github.com/vitejs/vite/commit/ffaf50d))
* wip: dynamic import + esmodule interop ([1c34e46](https://github.com/vitejs/vite/commit/1c34e46))
* wip: handle circular deps in ssr invalidation ([613c6bb](https://github.com/vitejs/vite/commit/613c6bb))
* wip: improve ssr transform ([d50b910](https://github.com/vitejs/vite/commit/d50b910))
* wip: only enable inlineDynamicImports for single inputs ([7a9259b](https://github.com/vitejs/vite/commit/7a9259b))
* wip: save ([10c1e15](https://github.com/vitejs/vite/commit/10c1e15))
* wip: save ([54f7889](https://github.com/vitejs/vite/commit/54f7889))
* wip: ssr allow import.meta.hot access for conditional guard ([0e6a10a](https://github.com/vitejs/vite/commit/0e6a10a))
* wip: ssr build ([7a45427](https://github.com/vitejs/vite/commit/7a45427))
* wip: ssr circular deps ([bb631bc](https://github.com/vitejs/vite/commit/bb631bc))
* wip: ssr flag for resolveId + node builtin handling for ssr ([0a07386](https://github.com/vitejs/vite/commit/0a07386))
* wip: ssr global and context ([c650e5e](https://github.com/vitejs/vite/commit/c650e5e))
* wip: ssr playground ([07f211a](https://github.com/vitejs/vite/commit/07f211a))
* wip: tweak ssr build ([c6115e9](https://github.com/vitejs/vite/commit/c6115e9))
* wip: warn access to browser externalized code during dev ([2818ff0](https://github.com/vitejs/vite/commit/2818ff0))
* refactor: backward compat for server.app ([b204bcb](https://github.com/vitejs/vite/commit/b204bcb))
* refactor: more explicit ssr external control via options ([4218756](https://github.com/vitejs/vite/commit/4218756))
* refactor: move ssr code into dedicated dir ([e9b0d28](https://github.com/vitejs/vite/commit/e9b0d28))
* refactor: rename ViteDevServer.app -> ViteDevServer.middlewares ([394390a](https://github.com/vitejs/vite/commit/394390a))
* feat: import.meta.env.SSR ([fe7396d](https://github.com/vitejs/vite/commit/fe7396d))
* feat: ssr manifest for preload inference ([107e79e](https://github.com/vitejs/vite/commit/107e79e))
* feat: ssr sourcemap + stacktrace fix ([6cb04fa](https://github.com/vitejs/vite/commit/6cb04fa))
* feat(ssr): isolated mode ([e954ed2](https://github.com/vitejs/vite/commit/e954ed2))
* workflow: fix dev source map ([1673fb6](https://github.com/vitejs/vite/commit/1673fb6))


### BREAKING CHANGE

* `ViteDevServer.app` is now `ViteDevServer.middlewares`.
In addition, Vite no longer serves `index.html` in middleware mode. The
server using Vite as middleware is responsible for serving HTML with
`/@vite/client` injected.


## 2.0.0-beta.31 (2021-01-18)

* release: v2.0.0-beta.31 ([6c4977b](https://github.com/vitejs/vite/commit/6c4977b))
* fix: workaround for ts config + native esm w/ imports ([4a7d2eb](https://github.com/vitejs/vite/commit/4a7d2eb)), closes [#1560](https://github.com/vitejs/vite/issues/1560)
* fix(resolve): also respect browser mapping of dependencies ([12b706d](https://github.com/vitejs/vite/commit/12b706d)), closes [#1547](https://github.com/vitejs/vite/issues/1547)



## 2.0.0-beta.30 (2021-01-15)

* release: v2.0.0-beta.30 ([74b6e3a](https://github.com/vitejs/vite/commit/74b6e3a))
* fix(config): delete cache correctly when restarting server (#1541) ([bd3b1bf](https://github.com/vitejs/vite/commit/bd3b1bf)), closes [#1541](https://github.com/vitejs/vite/issues/1541)
* fix(config): load native esm ts config string with base64 encoding ([55b05db](https://github.com/vitejs/vite/commit/55b05db)), closes [#1548](https://github.com/vitejs/vite/issues/1548)
* docs: typo (#1540) ([2ce1efa](https://github.com/vitejs/vite/commit/2ce1efa)), closes [#1540](https://github.com/vitejs/vite/issues/1540)



## 2.0.0-beta.29 (2021-01-14)

* release: v2.0.0-beta.29 ([bdec0f8](https://github.com/vitejs/vite/commit/bdec0f8))
* fix: fix graceful shutdown on sigint ([fe7238c](https://github.com/vitejs/vite/commit/fe7238c))
* fix: warn failed source map load instead of erroring ([7a1261b](https://github.com/vitejs/vite/commit/7a1261b))
* fix(optimizer): fix empty exclude filter ([4579c38](https://github.com/vitejs/vite/commit/4579c38))
* refactor: do not intercept sigint ([a04db16](https://github.com/vitejs/vite/commit/a04db16))



## 2.0.0-beta.28 (2021-01-14)

* release: v2.0.0-beta.28 ([8401c89](https://github.com/vitejs/vite/commit/8401c89))
* feat: add clearScreen option ([c5c3298](https://github.com/vitejs/vite/commit/c5c3298))
* feat: close server on sigint/sigterm ([4338d7d](https://github.com/vitejs/vite/commit/4338d7d)), closes [#1525](https://github.com/vitejs/vite/issues/1525)
* feat: support specifying URL path via server.open option (#1514) ([25e9c44](https://github.com/vitejs/vite/commit/25e9c44)), closes [#1514](https://github.com/vitejs/vite/issues/1514)
* feat: support using vite as a middleware ([960b420](https://github.com/vitejs/vite/commit/960b420))
* fix: alias should work for optimized deps ([54dab71](https://github.com/vitejs/vite/commit/54dab71))
* fix: serve out of root static file on windows (#1537) ([506bf2d](https://github.com/vitejs/vite/commit/506bf2d)), closes [#1537](https://github.com/vitejs/vite/issues/1537)
* fix(dev): correct responce for html qurey (#1526) ([49d294d](https://github.com/vitejs/vite/commit/49d294d)), closes [#1526](https://github.com/vitejs/vite/issues/1526) [#1524](https://github.com/vitejs/vite/issues/1524)
* fix(optimizer): should respect rollup external during pre-bundling ([db97317](https://github.com/vitejs/vite/commit/db97317)), closes [#1528](https://github.com/vitejs/vite/issues/1528)
* refactor: clearer logic for middlewareMode + fix typo (#1529) ([0861bf0](https://github.com/vitejs/vite/commit/0861bf0)), closes [#1529](https://github.com/vitejs/vite/issues/1529)
* refactor: do not 404 in middleware mode ([2bee4be](https://github.com/vitejs/vite/commit/2bee4be))
* chore: typo (#1519) [skip ci] ([cd920ba](https://github.com/vitejs/vite/commit/cd920ba)), closes [#1519](https://github.com/vitejs/vite/issues/1519)



## 2.0.0-beta.27 (2021-01-13)

* release: v2.0.0-beta.27 ([15a9772](https://github.com/vitejs/vite/commit/15a9772))
* feat: warn unintended dependency during pre-bundling ([ae6cc27](https://github.com/vitejs/vite/commit/ae6cc27))
* feat(vite): support RegExp strings as server.proxy keys (#1510) ([f39a2aa](https://github.com/vitejs/vite/commit/f39a2aa)), closes [#1510](https://github.com/vitejs/vite/issues/1510)
* refactor: auto move deps to devDeps ([97b84c0](https://github.com/vitejs/vite/commit/97b84c0))
* fix: transform import.meta.url in config files ([98e57de](https://github.com/vitejs/vite/commit/98e57de)), closes [#1511](https://github.com/vitejs/vite/issues/1511)
* chore: exit with non-zero code when cancelling dep optimization ([4857c01](https://github.com/vitejs/vite/commit/4857c01))



## 2.0.0-beta.26 (2021-01-13)

* release: v2.0.0-beta.26 ([4ed3e6d](https://github.com/vitejs/vite/commit/4ed3e6d))
* fix: properly externalize resolved external urls ([6cda88d](https://github.com/vitejs/vite/commit/6cda88d))



## 2.0.0-beta.25 (2021-01-12)

* release: v2.0.0-beta.25 ([fe3ac2c](https://github.com/vitejs/vite/commit/fe3ac2c))
* feat: support aliasing to external url ([abf7844](https://github.com/vitejs/vite/commit/abf7844))
* refactor: more explicit naming ([0f4e70e](https://github.com/vitejs/vite/commit/0f4e70e))
* fix: Revert "feat: allow browser new window view source (#1496)" ([64fde38](https://github.com/vitejs/vite/commit/64fde38)), closes [#1496](https://github.com/vitejs/vite/issues/1496) [#1507](https://github.com/vitejs/vite/issues/1507)



## 2.0.0-beta.24 (2021-01-12)

* release: v2.0.0-beta.24 ([1ff9fe3](https://github.com/vitejs/vite/commit/1ff9fe3))
* feat: allow browser new window view source (#1496) ([1629c54](https://github.com/vitejs/vite/commit/1629c54)), closes [#1496](https://github.com/vitejs/vite/issues/1496)
* feat: require explicit option to empty outDir when it is out of root ([730d2f0](https://github.com/vitejs/vite/commit/730d2f0)), closes [#1501](https://github.com/vitejs/vite/issues/1501)
* fix: always replace preload marker with value ([2d6f524](https://github.com/vitejs/vite/commit/2d6f524))
* fix: more consistent outDir formatting ([50bff79](https://github.com/vitejs/vite/commit/50bff79)), closes [#1497](https://github.com/vitejs/vite/issues/1497)
* fix: show target build mode in logs (#1498) ([ae2e14b](https://github.com/vitejs/vite/commit/ae2e14b)), closes [#1498](https://github.com/vitejs/vite/issues/1498)
* fix: support import.meta.url in ts esm config file ([cf5f3ab](https://github.com/vitejs/vite/commit/cf5f3ab)), closes [#1499](https://github.com/vitejs/vite/issues/1499)
* fix(hmr): watch file changes even when HMR is disabled (#1504) ([cc5fa6e](https://github.com/vitejs/vite/commit/cc5fa6e)), closes [#1504](https://github.com/vitejs/vite/issues/1504)
* refactor: use consistent cli options style ([a09a030](https://github.com/vitejs/vite/commit/a09a030))



## 2.0.0-beta.23 (2021-01-12)

* release: v2.0.0-beta.23 ([9c4ef58](https://github.com/vitejs/vite/commit/9c4ef58))
* fix: fix ts config loading on windows ([ec370d2](https://github.com/vitejs/vite/commit/ec370d2)), closes [#1493](https://github.com/vitejs/vite/issues/1493)



## 2.0.0-beta.22 (2021-01-11)

* release: v2.0.0-beta.22 ([0bb6ddb](https://github.com/vitejs/vite/commit/0bb6ddb))
* fix: handle http proxy error ([4ca20f2](https://github.com/vitejs/vite/commit/4ca20f2)), closes [#1485](https://github.com/vitejs/vite/issues/1485)
* fix: optimizer hash should take inline mode into account ([0aed0e8](https://github.com/vitejs/vite/commit/0aed0e8)), closes [#1490](https://github.com/vitejs/vite/issues/1490)
* fix: support resolved Ids that start with null bytes ([7074414](https://github.com/vitejs/vite/commit/7074414)), closes [#1471](https://github.com/vitejs/vite/issues/1471)
* fix(config): support native esm config on windows + support TS config in native esm projects ([803f6da](https://github.com/vitejs/vite/commit/803f6da)), closes [#1487](https://github.com/vitejs/vite/issues/1487)
* feat(resolve): support subpath patterns + production/development conditinals in exports field ([62cbd53](https://github.com/vitejs/vite/commit/62cbd53))
* feat(server): add strict-port option (#1453) ([0501084](https://github.com/vitejs/vite/commit/0501084)), closes [#1453](https://github.com/vitejs/vite/issues/1453)



## 2.0.0-beta.21 (2021-01-11)

* release: v2.0.0-beta.21 ([b49ce69](https://github.com/vitejs/vite/commit/b49ce69))
* refactor: improve public file import warning ([4a9307c](https://github.com/vitejs/vite/commit/4a9307c))
* fix: properly remove dynamic import args for full dynamic imports ([d9c3fdb](https://github.com/vitejs/vite/commit/d9c3fdb))



## 2.0.0-beta.20 (2021-01-11)

* release: v2.0.0-beta.20 ([7923ce5](https://github.com/vitejs/vite/commit/7923ce5))
* types: fix exports ([9299e90](https://github.com/vitejs/vite/commit/9299e90))
* fix(optimizer): exclude should not be resolve (#1469) ([f8c34ee](https://github.com/vitejs/vite/commit/f8c34ee)), closes [#1469](https://github.com/vitejs/vite/issues/1469)
* fix(resolve): heuristics for browser vs. module field ([1865e6e](https://github.com/vitejs/vite/commit/1865e6e)), closes [#1467](https://github.com/vitejs/vite/issues/1467)
* feat: allow passing options to rollup commonjs plugin via build.commonjsOptions ([6ed8e28](https://github.com/vitejs/vite/commit/6ed8e28)), closes [#1460](https://github.com/vitejs/vite/issues/1460)
* feat: async chunk loading optimizations ([e6f7fba](https://github.com/vitejs/vite/commit/e6f7fba))
* refactor: avoid preloading already present css ([a8f304e](https://github.com/vitejs/vite/commit/a8f304e))
* refactor: completely remove dynamic import polyfill and optimization code from legacy chunks ([6309093](https://github.com/vitejs/vite/commit/6309093))
* refactor: improve build output ([2da0f2f](https://github.com/vitejs/vite/commit/2da0f2f))
* refactor: only inject preload deps when there are actually deps ([e524ef0](https://github.com/vitejs/vite/commit/e524ef0))



## 2.0.0-beta.19 (2021-01-10)

* release: v2.0.0-beta.19 ([cb3cf76](https://github.com/vitejs/vite/commit/cb3cf76))
* fix: transform json in deep import (#1459) ([cf8342b](https://github.com/vitejs/vite/commit/cf8342b)), closes [#1459](https://github.com/vitejs/vite/issues/1459) [#1458](https://github.com/vitejs/vite/issues/1458)



## 2.0.0-beta.18 (2021-01-10)

* release: v2.0.0-beta.18 ([d3acb84](https://github.com/vitejs/vite/commit/d3acb84))
* chore: deprecation message ([8497f52](https://github.com/vitejs/vite/commit/8497f52))
* chore: typos (#1463) [skip ci] ([91dbb01](https://github.com/vitejs/vite/commit/91dbb01)), closes [#1463](https://github.com/vitejs/vite/issues/1463)
* fix: fix dynamic import with parent relative paths ([bbfe06c](https://github.com/vitejs/vite/commit/bbfe06c)), closes [#1461](https://github.com/vitejs/vite/issues/1461)
* fix(optimizer): properly externalize css/asset imports in optimized deps ([5d180db](https://github.com/vitejs/vite/commit/5d180db)), closes [#1443](https://github.com/vitejs/vite/issues/1443)
* feat(optimizer): support specifying plugins for the optimizer ([1ea0168](https://github.com/vitejs/vite/commit/1ea0168))
* refactor: fix js request check & deep import error on assets ([60b9e10](https://github.com/vitejs/vite/commit/60b9e10))
* refactor(optimizer): adjust node built-in handling ([8b8d506](https://github.com/vitejs/vite/commit/8b8d506))



## 2.0.0-beta.17 (2021-01-10)

* release: v2.0.0-beta.17 ([1e13c0a](https://github.com/vitejs/vite/commit/1e13c0a))
* refactor: support glob import under `import.meta.glob` ([23d0f2b](https://github.com/vitejs/vite/commit/23d0f2b))


### BREAKING CHANGE

* Glob import syntax has changed. The feature is now
exposed under `import.meta.glob` (lazy, exposes dynamic import functions)
and `import.meta.globEager` (eager, exposes already imported modules).


## 2.0.0-beta.16 (2021-01-09)

* release: v2.0.0-beta.16 ([86a727b](https://github.com/vitejs/vite/commit/86a727b))
* feat: allow tag injection after body open (body-prepend) (#1435) ([432487e](https://github.com/vitejs/vite/commit/432487e)), closes [#1435](https://github.com/vitejs/vite/issues/1435)
* fix: inject css link when cssCodeSplit is disabled ([51a02ff](https://github.com/vitejs/vite/commit/51a02ff)), closes [#1141](https://github.com/vitejs/vite/issues/1141)
* fix: set NODE_ENV for build ([d7ceabe](https://github.com/vitejs/vite/commit/d7ceabe)), closes [#1445](https://github.com/vitejs/vite/issues/1445) [#1452](https://github.com/vitejs/vite/issues/1452)
* chore: update code style (#1451) ([6d279d3](https://github.com/vitejs/vite/commit/6d279d3)), closes [#1451](https://github.com/vitejs/vite/issues/1451)



## 2.0.0-beta.15 (2021-01-09)

* release: v2.0.0-beta.15 ([122136a](https://github.com/vitejs/vite/commit/122136a))
* fix(hmr): ensure all modules are fetched as import ([98bc767](https://github.com/vitejs/vite/commit/98bc767))



## 2.0.0-beta.14 (2021-01-09)

* release: v2.0.0-beta.14 ([5bafd04](https://github.com/vitejs/vite/commit/5bafd04))
* feat: support ../ paths in glob import ([7f399e1](https://github.com/vitejs/vite/commit/7f399e1))



## 2.0.0-beta.13 (2021-01-09)

* release: v2.0.0-beta.13 ([7b2abcf](https://github.com/vitejs/vite/commit/7b2abcf))
* feat: allow user define to overwrite default process.env. defines ([351ad4e](https://github.com/vitejs/vite/commit/351ad4e))
* feat: build support for data uri import ([4fd0b86](https://github.com/vitejs/vite/commit/4fd0b86))
* feat: support import "glob:./*" ([8d8e2cc](https://github.com/vitejs/vite/commit/8d8e2cc))
* refactor: improve rollup plugin warning handling ([cf33233](https://github.com/vitejs/vite/commit/cf33233))
* refactor: rename importAnalysis file ([f282939](https://github.com/vitejs/vite/commit/f282939))
* fix: always rebase path against root ([d704b7c](https://github.com/vitejs/vite/commit/d704b7c)), closes [#1413](https://github.com/vitejs/vite/issues/1413)
* fix: handle potential imports that has no correspodning chunks ([d47e10c](https://github.com/vitejs/vite/commit/d47e10c))
* fix: raw fetch requests should not be transformed ([0356c3c](https://github.com/vitejs/vite/commit/0356c3c)), closes [#1433](https://github.com/vitejs/vite/issues/1433)
* fix: skip cjs rewrite for export * declarations ([cca015b](https://github.com/vitejs/vite/commit/cca015b)), closes [#1439](https://github.com/vitejs/vite/issues/1439)
* fix(cli): fix help for --root (#1429) ([7a55c5b](https://github.com/vitejs/vite/commit/7a55c5b)), closes [#1429](https://github.com/vitejs/vite/issues/1429)
* fix(dev): decode url before `sirv` resolve (#1432) ([7cc3cf1](https://github.com/vitejs/vite/commit/7cc3cf1)), closes [#1432](https://github.com/vitejs/vite/issues/1432) [#1426](https://github.com/vitejs/vite/issues/1426)
* chore: comments ([ca16538](https://github.com/vitejs/vite/commit/ca16538))
* chore: comments ([c48520d](https://github.com/vitejs/vite/commit/c48520d))
* chore: include resolved id in load fail error message ([5d00cee](https://github.com/vitejs/vite/commit/5d00cee))
* chore: readme for the vite package [skip ci] ([b7a0222](https://github.com/vitejs/vite/commit/b7a0222))



## 2.0.0-beta.12 (2021-01-07)

* release: v2.0.0-beta.12 ([37f5f2a](https://github.com/vitejs/vite/commit/37f5f2a))
* fix(plugin-legacy): avoid esbuild transform on legacy chunks ([7734105](https://github.com/vitejs/vite/commit/7734105))



## 2.0.0-beta.11 (2021-01-07)

* release: v2.0.0-beta.11 ([9a6e24c](https://github.com/vitejs/vite/commit/9a6e24c))
* fix: avoid excessive quote in css public urls ([1437129](https://github.com/vitejs/vite/commit/1437129)), closes [#1399](https://github.com/vitejs/vite/issues/1399)
* fix: do not rewrite dynamic import if format is not native es ([eb35bd5](https://github.com/vitejs/vite/commit/eb35bd5))
* fix: esbuild transform should filter id with and wihtout query ([4cda5be](https://github.com/vitejs/vite/commit/4cda5be))
* fix: fix cache invalidation for non-optimized deps with cross imports ([11c407a](https://github.com/vitejs/vite/commit/11c407a)), closes [#1401](https://github.com/vitejs/vite/issues/1401)
* fix: html transform should not render boolean attr with false value ([a59ffef](https://github.com/vitejs/vite/commit/a59ffef))
* fix: preserve html comments during dev ([b295400](https://github.com/vitejs/vite/commit/b295400)), closes [#1420](https://github.com/vitejs/vite/issues/1420)
* fix: remove vue from optimize ignore list ([9eab790](https://github.com/vitejs/vite/commit/9eab790)), closes [#1408](https://github.com/vitejs/vite/issues/1408)
* fix: support serving extension-less files in /public ([a7bca9c](https://github.com/vitejs/vite/commit/a7bca9c)), closes [#1364](https://github.com/vitejs/vite/issues/1364)
* fix(build): inline quotes css url to base64 (#1412) ([9b5b352](https://github.com/vitejs/vite/commit/9b5b352)), closes [#1412](https://github.com/vitejs/vite/issues/1412) [#1409](https://github.com/vitejs/vite/issues/1409) [#1413](https://github.com/vitejs/vite/issues/1413)
* fix(resolve): respect exports env key order ([b58c860](https://github.com/vitejs/vite/commit/b58c860)), closes [#1418](https://github.com/vitejs/vite/issues/1418)
* refactor: ensure normalized ids during dev ([da3dfdf](https://github.com/vitejs/vite/commit/da3dfdf)), closes [#1378](https://github.com/vitejs/vite/issues/1378)
* refactor: pass `configFile` via inline config instead of extra arg in most ([24b3b5a](https://github.com/vitejs/vite/commit/24b3b5a))
* refactor: simplfy code ([79b0e85](https://github.com/vitejs/vite/commit/79b0e85))
* refactor: use `isDataUrl` instead of `startsWith("data:")` (#1400) ([28fe201](https://github.com/vitejs/vite/commit/28fe201)), closes [#1400](https://github.com/vitejs/vite/issues/1400)
* feat: also expose correspodning chunk in build html transform ([b2f4836](https://github.com/vitejs/vite/commit/b2f4836))
* feat: expose loadConfigFromFile API (#1403) ([9582171](https://github.com/vitejs/vite/commit/9582171)), closes [#1403](https://github.com/vitejs/vite/issues/1403)
* feat: support specifying mode in user config ([396bbf8](https://github.com/vitejs/vite/commit/396bbf8)), closes [#1380](https://github.com/vitejs/vite/issues/1380)
* feat(plugin-legacy): @vitejs/plugin-legacy ([8c34870](https://github.com/vitejs/vite/commit/8c34870))
* feat(proxy): add rewrite support for ws (#1407) ([fa3bc34](https://github.com/vitejs/vite/commit/fa3bc34)), closes [#1407](https://github.com/vitejs/vite/issues/1407)
* chore: changelog typo (#1406) [skip ci] ([eeacdf9](https://github.com/vitejs/vite/commit/eeacdf9)), closes [#1406](https://github.com/vitejs/vite/issues/1406)


### BREAKING CHANGE

* the following JavaScript APIs now expect `configFile`
as a property of the config object passed in instead of an argument:

    - `createServer`
    - `build`
    - `resolveConfig`


## 2.0.0-beta.10 (2021-01-06)

* release: v2.0.0-beta.10 ([8c09e3b](https://github.com/vitejs/vite/commit/8c09e3b))
* fix: avoid replacing process.env member expression ([c8f4bb9](https://github.com/vitejs/vite/commit/c8f4bb9)), closes [#930](https://github.com/vitejs/vite/issues/930)
* fix(alias): normalize alias behavior when there is ending slash ([c4739a3](https://github.com/vitejs/vite/commit/c4739a3)), closes [#1363](https://github.com/vitejs/vite/issues/1363)
* fix(build): Pass `allowNodeBuiltins` to rollup instead of empty array (Fixes #1392) (#1393) ([f209ad9](https://github.com/vitejs/vite/commit/f209ad9)), closes [#1392](https://github.com/vitejs/vite/issues/1392) [#1393](https://github.com/vitejs/vite/issues/1393)
* chore: fix type ([53fe84f](https://github.com/vitejs/vite/commit/53fe84f))



## 2.0.0-beta.9 (2021-01-06)

* release: v2.0.0-beta.9 ([f9c1acc](https://github.com/vitejs/vite/commit/f9c1acc))
* fix: properly handle browser: false resolving ([da09320](https://github.com/vitejs/vite/commit/da09320)), closes [#1386](https://github.com/vitejs/vite/issues/1386)
* fix: properly handle ts worker source ([eea1224](https://github.com/vitejs/vite/commit/eea1224)), closes [#1385](https://github.com/vitejs/vite/issues/1385)
* feat(env): also expose VITE_ variables from actual env ([956cd2c](https://github.com/vitejs/vite/commit/956cd2c))



## 2.0.0-beta.8 (2021-01-05)

* release: v2.0.0-beta.8 ([149bf8c](https://github.com/vitejs/vite/commit/149bf8c))
* feat: allow boolean attr values in html transform tag descriptors (#1381) ([0fad96e](https://github.com/vitejs/vite/commit/0fad96e)), closes [#1381](https://github.com/vitejs/vite/issues/1381)
* feat(build): default build target to 'modules' with dynamic import polyfill ([756e90f](https://github.com/vitejs/vite/commit/756e90f))
* fix(resolve): handle exports field w/ mapped directory ([724aa8a](https://github.com/vitejs/vite/commit/724aa8a))



## 2.0.0-beta.7 (2021-01-05)

* release: v2.0.0-beta.7 ([7e10e3a](https://github.com/vitejs/vite/commit/7e10e3a))
* refactor: update client type usage ([245303c](https://github.com/vitejs/vite/commit/245303c))


### BREAKING CHANGE

* client types are now exposed under `vite/client.d.ts`.
It can now be included via the following `tsconfig.json`:

    ```ts
    {
      "compilerOptions": {
        "types": ["vite/client"]
      }
    }
    ```


## 2.0.0-beta.6 (2021-01-05)

* release: v2.0.0-beta.6 ([9f4004d](https://github.com/vitejs/vite/commit/9f4004d))
* refactor: bail server start on dep-optimization error ([742926f](https://github.com/vitejs/vite/commit/742926f))
* refactor: remove the need for specifying `trnasformInclude` ([99522d0](https://github.com/vitejs/vite/commit/99522d0))
* fix: support aliases in html references ([68eac64](https://github.com/vitejs/vite/commit/68eac64)), closes [#1363](https://github.com/vitejs/vite/issues/1363)
* fix(css): ensure options for .styl ([b3237ff](https://github.com/vitejs/vite/commit/b3237ff)), closes [#1351](https://github.com/vitejs/vite/issues/1351)
* fix(error-handling): avoid serilaizing unnecessary error properties when seinding to client ([61aec65](https://github.com/vitejs/vite/commit/61aec65)), closes [#1373](https://github.com/vitejs/vite/issues/1373)
* fix(optimizer): optimizer should not be affected by config rollup options ([ba08310](https://github.com/vitejs/vite/commit/ba08310)), closes [#1372](https://github.com/vitejs/vite/issues/1372)
* fix(optimizer): resolve linked dep from relative root (#1375) ([034bbcd](https://github.com/vitejs/vite/commit/034bbcd)), closes [#1375](https://github.com/vitejs/vite/issues/1375)
* feat: exclude vue from optimization ([1046fe0](https://github.com/vitejs/vite/commit/1046fe0))
* feat: improve import analysis fail warning ([2b39fce](https://github.com/vitejs/vite/commit/2b39fce)), closes [#1368](https://github.com/vitejs/vite/issues/1368)


### BREAKING CHANGE

* `trnasformInclude` option has been removed and is no
longer necessary. This allows full dynamic imports to custom file types
to automatically qualify for the transform pipeline.

    - All requests that accept `*/*` AND is not declared an asset type
    will now qualify for the transform pipeline.

    - To exclude an asset type from being transformed when requested
    directly, declare it as asset via `config.assetsInclude`.


## 2.0.0-beta.5 (2021-01-05)

* release: v2.0.0-beta.5 ([df27ba2](https://github.com/vitejs/vite/commit/df27ba2))
* fix: do not bundle resolve for yarn 2 compat ([3524e96](https://github.com/vitejs/vite/commit/3524e96)), closes [#1353](https://github.com/vitejs/vite/issues/1353)
* fix: do not error on unresolved commonjs externals ([60a4708](https://github.com/vitejs/vite/commit/60a4708)), closes [#1339](https://github.com/vitejs/vite/issues/1339)
* fix: only allow built-ins as externals if building for ssr ([804c9a3](https://github.com/vitejs/vite/commit/804c9a3))
* fix: only append dep version query for known types ([42cd8b2](https://github.com/vitejs/vite/commit/42cd8b2))
* fix: run mutiple output builds sequantially ([ab80522](https://github.com/vitejs/vite/commit/ab80522))
* fix(css): fix css comment removal ([7b9dee0](https://github.com/vitejs/vite/commit/7b9dee0)), closes [#1359](https://github.com/vitejs/vite/issues/1359)
* fix(css): inline css in all non-entry split chunks ([e90ff76](https://github.com/vitejs/vite/commit/e90ff76)), closes [#1356](https://github.com/vitejs/vite/issues/1356)
* feat: default clean-css level to 1 + expose options ([ef100d0](https://github.com/vitejs/vite/commit/ef100d0)), closes [#936](https://github.com/vitejs/vite/issues/936)
* feat: support plugin.apply ([d914b54](https://github.com/vitejs/vite/commit/d914b54))
* feat(types): separate client type shims from main types ([0cddbbc](https://github.com/vitejs/vite/commit/0cddbbc))



## 2.0.0-beta.4 (2021-01-04)

* release: v2.0.0-beta.4 ([908277c](https://github.com/vitejs/vite/commit/908277c))
* fix: @fs paths resolving for win32 (#1317) ([0a94c88](https://github.com/vitejs/vite/commit/0a94c88)), closes [#1317](https://github.com/vitejs/vite/issues/1317)
* fix: do not error on css deep imports ([25adf1e](https://github.com/vitejs/vite/commit/25adf1e))
* fix: ensure consistent module entry urls by removing import query ([2b82e84](https://github.com/vitejs/vite/commit/2b82e84)), closes [#1321](https://github.com/vitejs/vite/issues/1321)
* fix: load source map from sourceMappingURL comment (#1327) ([1f89b0e](https://github.com/vitejs/vite/commit/1f89b0e)), closes [#1327](https://github.com/vitejs/vite/issues/1327)
* fix: sourcemap path mangled by browser (#1326) ([1da12ba](https://github.com/vitejs/vite/commit/1da12ba)), closes [#1326](https://github.com/vitejs/vite/issues/1326) [#1323](https://github.com/vitejs/vite/issues/1323)
* fix: stop service in build esbuild plugin as well ([1a90b4e](https://github.com/vitejs/vite/commit/1a90b4e))
* fix(build): rollup import resolving message (#1336) [skip ci] ([87d55f4](https://github.com/vitejs/vite/commit/87d55f4)), closes [#1336](https://github.com/vitejs/vite/issues/1336)
* fix(dev): display localetime correctly (#1310) ([06663a7](https://github.com/vitejs/vite/commit/06663a7)), closes [#1310](https://github.com/vitejs/vite/issues/1310)
* fix(resolve): always prioritize browser field ([409988f](https://github.com/vitejs/vite/commit/409988f))
* chore: fix comment (#1314) ([95dd9d1](https://github.com/vitejs/vite/commit/95dd9d1)), closes [#1314](https://github.com/vitejs/vite/issues/1314)
* chore: fix exported types ([a3d18c0](https://github.com/vitejs/vite/commit/a3d18c0))
* feat: esbuild.(include|exclude|jsxInject) ([b5b1496](https://github.com/vitejs/vite/commit/b5b1496))
* feat: export normalizePath helper (#1313) ([37d1a5d](https://github.com/vitejs/vite/commit/37d1a5d)), closes [#1313](https://github.com/vitejs/vite/issues/1313)
* feat(wasm): use `instantiateStreaming` when available (#1330) ([2286f62](https://github.com/vitejs/vite/commit/2286f62)), closes [#1330](https://github.com/vitejs/vite/issues/1330) [#1143](https://github.com/vitejs/vite/issues/1143)



## 2.0.0-beta.3 (2021-01-03)

* release: v2.0.0-beta.3 ([20ccf3d](https://github.com/vitejs/vite/commit/20ccf3d))
* fix: decode incoming URL ([f52db58](https://github.com/vitejs/vite/commit/f52db58)), closes [#1308](https://github.com/vitejs/vite/issues/1308)
* fix: keep `this` defined in `configureServer` hook (#1304) ([b665b92](https://github.com/vitejs/vite/commit/b665b92)), closes [#1304](https://github.com/vitejs/vite/issues/1304)
* fix(build): fix import-fresh shim ([b57d74c](https://github.com/vitejs/vite/commit/b57d74c)), closes [#1306](https://github.com/vitejs/vite/issues/1306)
* fix(resolve): prioritize module + avoid mutating path when ([6ce6d5c](https://github.com/vitejs/vite/commit/6ce6d5c)), closes [#1299](https://github.com/vitejs/vite/issues/1299)
* feat: dedupe option ([7858e62](https://github.com/vitejs/vite/commit/7858e62)), closes [#1302](https://github.com/vitejs/vite/issues/1302)
* feat: export `resolvePackageData` and `resolvePackageEntry` helpers (#1307) ([38b9613](https://github.com/vitejs/vite/commit/38b9613)), closes [#1307](https://github.com/vitejs/vite/issues/1307)
* feat: expose `loadEnv` in public api (#1300) ([9d0a8e7](https://github.com/vitejs/vite/commit/9d0a8e7)), closes [#1300](https://github.com/vitejs/vite/issues/1300)



## 2.0.0-beta.2 (2021-01-02)

* release: v2.0.0-beta.2 ([522d57b](https://github.com/vitejs/vite/commit/522d57b))
* fix: do not attempt to transform html requests ([a7a5c5b](https://github.com/vitejs/vite/commit/a7a5c5b))
* fix: dynamic load postcss plugin (#1292) ([00c7370](https://github.com/vitejs/vite/commit/00c7370)), closes [#1292](https://github.com/vitejs/vite/issues/1292) [#1287](https://github.com/vitejs/vite/issues/1287)
* fix: fix spa fallback on paths ending with slash ([60fe476](https://github.com/vitejs/vite/commit/60fe476))
* fix: fix transform result check for empty result ([2adfa8b](https://github.com/vitejs/vite/commit/2adfa8b)), closes [#1278](https://github.com/vitejs/vite/issues/1278)
* fix(resolve): prioritize browser field ([dfef3de](https://github.com/vitejs/vite/commit/dfef3de)), closes [#1154](https://github.com/vitejs/vite/issues/1154)
* fix(resolve): resolve inline package ([e27fe30](https://github.com/vitejs/vite/commit/e27fe30)), closes [#1291](https://github.com/vitejs/vite/issues/1291)
* Revert "types: worker types" (#1295) ([806ef96](https://github.com/vitejs/vite/commit/806ef96)), closes [#1295](https://github.com/vitejs/vite/issues/1295)
* refactor(hmr): pass context object to `handleHotUpdate` plugin hook ([b314771](https://github.com/vitejs/vite/commit/b314771))
* build: fix local linked dev ([078ff85](https://github.com/vitejs/vite/commit/078ff85))
* build: use linked types for local linked usage ([fbd9bcc](https://github.com/vitejs/vite/commit/fbd9bcc)), closes [#1276](https://github.com/vitejs/vite/issues/1276)
* chore: fix acceptedPath typo ([81e8077](https://github.com/vitejs/vite/commit/81e8077))


### BREAKING CHANGE

* `handleHotUpdate` plugin hook now receives a single
`HmrContext` argument instead of multiple args.


## 2.0.0-beta.1 (2021-01-02)

* release: v2.0.0-beta.1 ([1f7f0a6](https://github.com/vitejs/vite/commit/1f7f0a6))
* chore: fix missing dep ([7d8a03d](https://github.com/vitejs/vite/commit/7d8a03d))
* chore: update branch links [ci skip] ([d416072](https://github.com/vitejs/vite/commit/d416072))
* chore: update comments ([78cbf89](https://github.com/vitejs/vite/commit/78cbf89))
* workflow: adjust release setup ([ab3f2eb](https://github.com/vitejs/vite/commit/ab3f2eb))
* docs: adjust plugin comments ([ac650c4](https://github.com/vitejs/vite/commit/ac650c4))
* docs: docs ([26452d9](https://github.com/vitejs/vite/commit/26452d9))
* types: worker types ([7cc4bb7](https://github.com/vitejs/vite/commit/7cc4bb7))
* feat: also call buildEnd on container close ([94a8def](https://github.com/vitejs/vite/commit/94a8def))
* feat: provide default typing for supported file types ([a9c7eac](https://github.com/vitejs/vite/commit/a9c7eac))
* feat: support resolveId returning arbitrary value ([b782af4](https://github.com/vitejs/vite/commit/b782af4))
* fix: --open and --filter arguments (#1259) ([0c0bc4a](https://github.com/vitejs/vite/commit/0c0bc4a)), closes [#1259](https://github.com/vitejs/vite/issues/1259)
* fix: handle hmr errors ([ff2b3ce](https://github.com/vitejs/vite/commit/ff2b3ce))
* fix: overlay z-index ([6b3278e](https://github.com/vitejs/vite/commit/6b3278e))
* fix(css): respect minify option for chunk css ([6a287a1](https://github.com/vitejs/vite/commit/6a287a1))
* refactor: adjust css direct link vs import differentiation ([15ccf24](https://github.com/vitejs/vite/commit/15ccf24))



## 2.0.0-alpha.5 (2020-12-30)

* release: v2.0.0-alpha.5 ([aa0ad3b](https://github.com/vitejs/vite/commit/aa0ad3b))
* fix(css): properly prevent css from being tree-shaken ([7f08835](https://github.com/vitejs/vite/commit/7f08835))



## 2.0.0-alpha.4 (2020-12-30)

* release: v2.0.0-alpha.4 ([4864669](https://github.com/vitejs/vite/commit/4864669))
* build: terser shim ([9b432f0](https://github.com/vitejs/vite/commit/9b432f0))
* fix: disable cssCodeSplit by default in lib mode ([e64509a](https://github.com/vitejs/vite/commit/e64509a))
* fix: fix terser worker thread when vite is linked ([a28419b](https://github.com/vitejs/vite/commit/a28419b))
* fix: inline assets in lib mode ([c976d10](https://github.com/vitejs/vite/commit/c976d10))
* fix(css): fix cssCodeSplit: false ([9a02203](https://github.com/vitejs/vite/commit/9a02203))



## 2.0.0-alpha.3 (2020-12-30)

* release: v2.0.0-alpha.3 ([099f176](https://github.com/vitejs/vite/commit/099f176))
* types: expose LogOptions ([3efa499](https://github.com/vitejs/vite/commit/3efa499))
* refactor: improve missing import error + logging ([ca02b9b](https://github.com/vitejs/vite/commit/ca02b9b))
* refactor: improve vue compiler error reporting ([206b7b7](https://github.com/vitejs/vite/commit/206b7b7))



## 2.0.0-alpha.2 (2020-12-29)

* release: v2.0.0-alpha.2 ([47bc2ad](https://github.com/vitejs/vite/commit/47bc2ad))
* build: fix import meta augmentation ([d62cf3d](https://github.com/vitejs/vite/commit/d62cf3d))
* chore: changelog [ci skip] ([d237987](https://github.com/vitejs/vite/commit/d237987))



## 2.0.0-alpha.1 (2020-12-29)

* release: v2.0.0-alpha.1 ([c87c779](https://github.com/vitejs/vite/commit/c87c779))
* wip: --open flag ([d32f8e0](https://github.com/vitejs/vite/commit/d32f8e0))
* wip: asset resolution and tests ([ffa03ad](https://github.com/vitejs/vite/commit/ffa03ad))
* wip: avoid walking import graph for client ([c59d763](https://github.com/vitejs/vite/commit/c59d763))
* wip: build setup ([1c12e26](https://github.com/vitejs/vite/commit/1c12e26))
* wip: bundle ([e44d77d](https://github.com/vitejs/vite/commit/e44d77d))
* wip: call closeBundle hooks on server close ([9a81070](https://github.com/vitejs/vite/commit/9a81070))
* wip: config ([1a0c554](https://github.com/vitejs/vite/commit/1a0c554))
* wip: config loading + proxy ([3797ce9](https://github.com/vitejs/vite/commit/3797ce9))
* wip: css ([adbf878](https://github.com/vitejs/vite/commit/adbf878))
* wip: css @import hmr ([b5479b8](https://github.com/vitejs/vite/commit/b5479b8))
* wip: css asset url rewrite ([ff0b6b0](https://github.com/vitejs/vite/commit/ff0b6b0))
* wip: css hmr ([9b04a22](https://github.com/vitejs/vite/commit/9b04a22))
* wip: debug filter ([1d8c02b](https://github.com/vitejs/vite/commit/1d8c02b))
* wip: dep optimizer ([ac099bf](https://github.com/vitejs/vite/commit/ac099bf))
* wip: differentiate asset imports from non-imports ([bd7c846](https://github.com/vitejs/vite/commit/bd7c846))
* wip: dispose no longer imported modules ([e6958ae](https://github.com/vitejs/vite/commit/e6958ae))
* wip: ensure correct build ([943487c](https://github.com/vitejs/vite/commit/943487c))
* wip: error handling ([bea7796](https://github.com/vitejs/vite/commit/bea7796))
* wip: error overlay ([23016ca](https://github.com/vitejs/vite/commit/23016ca))
* wip: error overlay ([bbaf948](https://github.com/vitejs/vite/commit/bbaf948))
* wip: fix build ([001a564](https://github.com/vitejs/vite/commit/001a564))
* wip: fix css hmr ([1773dcc](https://github.com/vitejs/vite/commit/1773dcc))
* wip: full hmr propagation handling ([0974dbe](https://github.com/vitejs/vite/commit/0974dbe))
* wip: hmr ([75deecb](https://github.com/vitejs/vite/commit/75deecb))
* wip: hmr acceptance check ([22944ec](https://github.com/vitejs/vite/commit/22944ec))
* wip: hmr for html ([898a7cc](https://github.com/vitejs/vite/commit/898a7cc))
* wip: hmr propagation ([833f7e1](https://github.com/vitejs/vite/commit/833f7e1))
* wip: html fallback ([3cf3647](https://github.com/vitejs/vite/commit/3cf3647))
* wip: html inline module script conversion ([9f20d5a](https://github.com/vitejs/vite/commit/9f20d5a))
* wip: html transform ([9ce2ab4](https://github.com/vitejs/vite/commit/9ce2ab4))
* wip: improve debug output ([5f01082](https://github.com/vitejs/vite/commit/5f01082))
* wip: improve source map ([33f58ac](https://github.com/vitejs/vite/commit/33f58ac))
* wip: improve url normalization ([9053aa3](https://github.com/vitejs/vite/commit/9053aa3))
* wip: inject hmr client ([c76a984](https://github.com/vitejs/vite/commit/c76a984))
* wip: link files in error overlay ([f2c0d09](https://github.com/vitejs/vite/commit/f2c0d09))
* wip: log level support ([8030608](https://github.com/vitejs/vite/commit/8030608))
* wip: minify esbuild option ([4e03b92](https://github.com/vitejs/vite/commit/4e03b92))
* wip: mode resolution + build env replacement ([4a955bc](https://github.com/vitejs/vite/commit/4a955bc))
* wip: more debug tweaks ([b69cbf0](https://github.com/vitejs/vite/commit/b69cbf0))
* wip: more precise hmr callback triggering ([b958f2c](https://github.com/vitejs/vite/commit/b958f2c))
* wip: more vitepress tweaks ([176d301](https://github.com/vitejs/vite/commit/176d301))
* wip: move rewerite to plugin ([9e81c2b](https://github.com/vitejs/vite/commit/9e81c2b))
* wip: notify failed imports ([c7806ac](https://github.com/vitejs/vite/commit/c7806ac))
* wip: only apply strong cache in files actually in node_modules ([8ef17a2](https://github.com/vitejs/vite/commit/8ef17a2))
* wip: optimize resolve ([0023cd6](https://github.com/vitejs/vite/commit/0023cd6))
* wip: optimize resolve perf ([bd088dc](https://github.com/vitejs/vite/commit/bd088dc))
* wip: optimize types ([d7dd433](https://github.com/vitejs/vite/commit/d7dd433))
* wip: optimize vue relative asset reference + handle out of root assets ([596d71d](https://github.com/vitejs/vite/commit/596d71d))
* wip: optimizer ([e2ff046](https://github.com/vitejs/vite/commit/e2ff046))
* wip: polish logs ([d53584a](https://github.com/vitejs/vite/commit/d53584a))
* wip: port rollup-plugin-vue to vite plugin ([7883fb2](https://github.com/vitejs/vite/commit/7883fb2))
* wip: profile ([e312645](https://github.com/vitejs/vite/commit/e312645))
* wip: react refresh ([0115522](https://github.com/vitejs/vite/commit/0115522))
* wip: refactor into module graph ([3ac6f4c](https://github.com/vitejs/vite/commit/3ac6f4c))
* wip: remove debugger, define vue flags in plugin ([d94345b](https://github.com/vitejs/vite/commit/d94345b))
* wip: remove overlay scrollbar ([02d2f38](https://github.com/vitejs/vite/commit/02d2f38))
* wip: reorg playground ([37f4a0a](https://github.com/vitejs/vite/commit/37f4a0a))
* wip: rewrite ([1b72b7c](https://github.com/vitejs/vite/commit/1b72b7c))
* wip: rollup-plugin-vue works ([68dc494](https://github.com/vitejs/vite/commit/68dc494))
* wip: setup basic testing, refactor server api ([81d9508](https://github.com/vitejs/vite/commit/81d9508))
* wip: setup server ([4b3cabb](https://github.com/vitejs/vite/commit/4b3cabb))
* wip: source map! ([556162f](https://github.com/vitejs/vite/commit/556162f))
* wip: test build ([d23cdc4](https://github.com/vitejs/vite/commit/d23cdc4))
* wip: trasnform ([fbf7ab4](https://github.com/vitejs/vite/commit/fbf7ab4))
* wip: tweaks for vitepress ([c7a3f9f](https://github.com/vitejs/vite/commit/c7a3f9f))
* wip: use ?import for all non js types ([9447c66](https://github.com/vitejs/vite/commit/9447c66))
* wip: vue hmr ([4f58dfb](https://github.com/vitejs/vite/commit/4f58dfb))
* wip: vue sfc style handling ([20a87c4](https://github.com/vitejs/vite/commit/20a87c4))
* refactor: cli ([3ca1000](https://github.com/vitejs/vite/commit/3ca1000))
* refactor: configResovled plugin hook ([28bd292](https://github.com/vitejs/vite/commit/28bd292))
* refactor: include build plugins in resolved config ([985b565](https://github.com/vitejs/vite/commit/985b565))
* refactor: logger ([8625c0f](https://github.com/vitejs/vite/commit/8625c0f))
* refactor: move build into single file ([b57fb14](https://github.com/vitejs/vite/commit/b57fb14))
* refactor: move plugin definition into its own file ([04f1007](https://github.com/vitejs/vite/commit/04f1007))
* refactor: re-organize into monorepo ([cb9f750](https://github.com/vitejs/vite/commit/cb9f750))
* refactor: rename ServerContext to ViteDevServer + expose transformRequest ([c55efd1](https://github.com/vitejs/vite/commit/c55efd1))
* refactor: static ([1f0fefb](https://github.com/vitejs/vite/commit/1f0fefb))
* refactor: strongly cache optimized deps ([bd098ca](https://github.com/vitejs/vite/commit/bd098ca))
* refactor: use faster custom node resolve ([e9df34c](https://github.com/vitejs/vite/commit/e9df34c))
* refactor: use query to mark css imports ([4f7de31](https://github.com/vitejs/vite/commit/4f7de31))
* refactor: useServer ([2af1783](https://github.com/vitejs/vite/commit/2af1783))
* build: build for plugin-vue ([0c8f651](https://github.com/vitejs/vite/commit/0c8f651))
* build: bundle cjs version of compiler-dom ([da9a94c](https://github.com/vitejs/vite/commit/da9a94c))
* build: bundle terser with worker ([494f50a](https://github.com/vitejs/vite/commit/494f50a))
* build: fix big.js in bundle ([f5b3846](https://github.com/vitejs/vite/commit/f5b3846))
* build: fix build ([d3b7fb4](https://github.com/vitejs/vite/commit/d3b7fb4))
* build: fix build on windows ([6b83329](https://github.com/vitejs/vite/commit/6b83329))
* build: generate license for bundled deps ([aa36be1](https://github.com/vitejs/vite/commit/aa36be1))
* build: improve dep shimming ([7d93ebd](https://github.com/vitejs/vite/commit/7d93ebd))
* build: improve type organization ([ae2338d](https://github.com/vitejs/vite/commit/ae2338d))
* build: move mime to dev deps ([85e7207](https://github.com/vitejs/vite/commit/85e7207))
* build: respect package sideEffects flags ([00c57fc](https://github.com/vitejs/vite/commit/00c57fc))
* build: tweak script ([d899d61](https://github.com/vitejs/vite/commit/d899d61))
* chore: also skip data url in import analysis ([fa34558](https://github.com/vitejs/vite/commit/fa34558))
* chore: bump esbuild ([41cd9db](https://github.com/vitejs/vite/commit/41cd9db))
* chore: check dir exists first before emptyDir ([d2a582e](https://github.com/vitejs/vite/commit/d2a582e))
* chore: fix tsdoc ([d7b3949](https://github.com/vitejs/vite/commit/d7b3949))
* chore: fix type ([31e361c](https://github.com/vitejs/vite/commit/31e361c))
* chore: ignore known urls from transform ([7405cbf](https://github.com/vitejs/vite/commit/7405cbf))
* chore: log hmr updates ([842206e](https://github.com/vitejs/vite/commit/842206e))
* chore: reduce resolve debug verbosity ([3718257](https://github.com/vitejs/vite/commit/3718257))
* chore: remove configureBuild hook ([5fa1924](https://github.com/vitejs/vite/commit/5fa1924))
* chore: remove debugger ([18deaa0](https://github.com/vitejs/vite/commit/18deaa0))
* chore: remove stale file ([9bf5959](https://github.com/vitejs/vite/commit/9bf5959))
* chore: remove stale files ([f1fb95c](https://github.com/vitejs/vite/commit/f1fb95c))
* chore: update readme, fix type exports ([cb5abc1](https://github.com/vitejs/vite/commit/cb5abc1))
* chore: warn formats and array output options ([bb77bb3](https://github.com/vitejs/vite/commit/bb77bb3))
* feat: allow browsers to cache node_modules ([64cd625](https://github.com/vitejs/vite/commit/64cd625))
* feat: auto restart server on config/.env change ([e8d3277](https://github.com/vitejs/vite/commit/e8d3277))
* feat: basic build ([3517827](https://github.com/vitejs/vite/commit/3517827))
* feat: dynamic import w/ variables ([7cbbca4](https://github.com/vitejs/vite/commit/7cbbca4))
* feat: lib mode ([edfc4ef](https://github.com/vitejs/vite/commit/edfc4ef))
* feat: manifest ([ab26e25](https://github.com/vitejs/vite/commit/ab26e25))
* feat: multi html build ([e5a4cd2](https://github.com/vitejs/vite/commit/e5a4cd2))
* feat: support native esm config files ([6687720](https://github.com/vitejs/vite/commit/6687720))
* feat: wasm ([e23e21f](https://github.com/vitejs/vite/commit/e23e21f))
* feat: web worker ([a9fe3e7](https://github.com/vitejs/vite/commit/a9fe3e7))
* fix: always normalize paths on windows ([490484b](https://github.com/vitejs/vite/commit/490484b))
* fix: fix check for out of root files when outside dir ([4bfd823](https://github.com/vitejs/vite/commit/4bfd823))
* fix: fix client resolve ([577ba6e](https://github.com/vitejs/vite/commit/577ba6e))
* fix: fix custom hmr event ([09d2cdd](https://github.com/vitejs/vite/commit/09d2cdd))
* fix: ignore external imports ([0f61b23](https://github.com/vitejs/vite/commit/0f61b23))
* fix: no need to ensure ext ([a1dda24](https://github.com/vitejs/vite/commit/a1dda24))
* fix: normalize all paths for windows ([44001b6](https://github.com/vitejs/vite/commit/44001b6))
* fix: normalize path when creating css dep module entries ([a173b62](https://github.com/vitejs/vite/commit/a173b62))
* fix: properly handle multiple inline module scripts in html ([89558a6](https://github.com/vitejs/vite/commit/89558a6))
* fix: respect minify false ([1fc6b64](https://github.com/vitejs/vite/commit/1fc6b64))
* test: better organize playground & tests ([b4814aa](https://github.com/vitejs/vite/commit/b4814aa))
* test: css + assets tests ([4188ac6](https://github.com/vitejs/vite/commit/4188ac6))
* test: hmr tests ([a0d48fc](https://github.com/vitejs/vite/commit/a0d48fc))
* test: more test setup ([eedd435](https://github.com/vitejs/vite/commit/eedd435))
* test: more through tests for css options and postcss config ([85b0cee](https://github.com/vitejs/vite/commit/85b0cee))
* test: more vue tests + test build base config ([5363525](https://github.com/vitejs/vite/commit/5363525))
* test: optimize test env by resuing browser instance across tests ([51c719a](https://github.com/vitejs/vite/commit/51c719a))
* test: svg fragment asset references ([3ee283e](https://github.com/vitejs/vite/commit/3ee283e))
* test: test deps optimization ([765c05e](https://github.com/vitejs/vite/commit/765c05e))
* test: test env ([014c538](https://github.com/vitejs/vite/commit/014c538))
* test: test for define ([d76557e](https://github.com/vitejs/vite/commit/d76557e))
* test: test resolve ([a74eb44](https://github.com/vitejs/vite/commit/a74eb44))
* test: test resolving monorepo dep ([54f5565](https://github.com/vitejs/vite/commit/54f5565))
* test: vue src imports ([42d2558](https://github.com/vitejs/vite/commit/42d2558))
* perf: skip import analysis when url is import.meta ([8debb22](https://github.com/vitejs/vite/commit/8debb22))
* docs: document plugin ([6be55ba](https://github.com/vitejs/vite/commit/6be55ba))
* deps: move fsevents to optional ([067027e](https://github.com/vitejs/vite/commit/067027e))
* wip ([c6bb3e4](https://github.com/vitejs/vite/commit/c6bb3e4))



## <small>4.3.9 (2023-05-26)</small>

* fix: fs.deny with leading double slash (#13348) ([813ddd6](https://github.com/vitejs/vite/commit/813ddd6)), closes [#13348](https://github.com/vitejs/vite/issues/13348)
* fix: optimizeDeps during build and external ids (#13274) ([e3db771](https://github.com/vitejs/vite/commit/e3db771)), closes [#13274](https://github.com/vitejs/vite/issues/13274)
* fix(css): return deps if have no postcss plugins (#13344) ([28923fb](https://github.com/vitejs/vite/commit/28923fb)), closes [#13344](https://github.com/vitejs/vite/issues/13344)
* fix(legacy): style insert order (#13266) ([e444375](https://github.com/vitejs/vite/commit/e444375)), closes [#13266](https://github.com/vitejs/vite/issues/13266)
* chore: revert prev release commit ([2a30a07](https://github.com/vitejs/vite/commit/2a30a07))
* release: v4.3.9 ([5c9abf7](https://github.com/vitejs/vite/commit/5c9abf7))
* docs: optimizeDeps.needsInterop (#13323) ([b34e79c](https://github.com/vitejs/vite/commit/b34e79c)), closes [#13323](https://github.com/vitejs/vite/issues/13323)
* test: respect commonjs options in playgrounds (#13273) ([19e8c68](https://github.com/vitejs/vite/commit/19e8c68)), closes [#13273](https://github.com/vitejs/vite/issues/13273)
* refactor: simplify SSR options' if statement (#13254) ([8013a66](https://github.com/vitejs/vite/commit/8013a66)), closes [#13254](https://github.com/vitejs/vite/issues/13254)
* perf(ssr): calculate stacktrace offset lazily (#13256) ([906c4c1](https://github.com/vitejs/vite/commit/906c4c1)), closes [#13256](https://github.com/vitejs/vite/issues/13256)



## <small>4.3.8 (2023-05-18)</small>

* fix: avoid outdated module to crash in importAnalysis after restart (#13231) ([3609e79](https://github.com/vitejs/vite/commit/3609e79)), closes [#13231](https://github.com/vitejs/vite/issues/13231)
* fix(ssr): skip updateCjsSsrExternals if legacy flag disabled (#13230) ([13fc345](https://github.com/vitejs/vite/commit/13fc345)), closes [#13230](https://github.com/vitejs/vite/issues/13230)



## <small>4.3.7 (2023-05-16)</small>

* fix: revert only watch .env files in envDir (#12587) (#13217) ([0fd4616](https://github.com/vitejs/vite/commit/0fd4616)), closes [#12587](https://github.com/vitejs/vite/issues/12587) [#13217](https://github.com/vitejs/vite/issues/13217)
* fix(assetImportMetaUrl): allow ternary operator in template literal urls (#13121) ([d5d9a31](https://github.com/vitejs/vite/commit/d5d9a31)), closes [#13121](https://github.com/vitejs/vite/issues/13121)



## <small>4.3.6 (2023-05-15)</small>

* fix: avoid dev-server crash when ws proxy error (#12829) ([87e1f58](https://github.com/vitejs/vite/commit/87e1f58)), closes [#12829](https://github.com/vitejs/vite/issues/12829)
* fix: call `tryFsResolve` for relative `new URL(foo, import.meta.url)` (#13142) ([eeb0617](https://github.com/vitejs/vite/commit/eeb0617)), closes [#13142](https://github.com/vitejs/vite/issues/13142)
* fix: don't inject CSS sourcemap for direct requests (#13115) ([7d80a47](https://github.com/vitejs/vite/commit/7d80a47)), closes [#13115](https://github.com/vitejs/vite/issues/13115)
* fix: handle more yarn pnp load errors (#13160) ([adf61d9](https://github.com/vitejs/vite/commit/adf61d9)), closes [#13160](https://github.com/vitejs/vite/issues/13160)
* fix(build): declare moduleSideEffects for vite:modulepreload-polyfill (#13099) ([d63129b](https://github.com/vitejs/vite/commit/d63129b)), closes [#13099](https://github.com/vitejs/vite/issues/13099)
* fix(css): respect `esbuild.charset` when minify (#13190) ([4fd35ed](https://github.com/vitejs/vite/commit/4fd35ed)), closes [#13190](https://github.com/vitejs/vite/issues/13190)
* fix(server): intercept ping requests (#13117) ([d06cc42](https://github.com/vitejs/vite/commit/d06cc42)), closes [#13117](https://github.com/vitejs/vite/issues/13117)
* fix(ssr): stacktrace uses abs path with or without sourcemap (#12902) ([88c855e](https://github.com/vitejs/vite/commit/88c855e)), closes [#12902](https://github.com/vitejs/vite/issues/12902)
* perf: skip windows absolute paths for node resolve (#13162) ([e640939](https://github.com/vitejs/vite/commit/e640939)), closes [#13162](https://github.com/vitejs/vite/issues/13162)
* chore: remove useless dep (#13165) ([9a7ec98](https://github.com/vitejs/vite/commit/9a7ec98)), closes [#13165](https://github.com/vitejs/vite/issues/13165)
* chore(reporter): reuse clearLine (#13156) ([535795a](https://github.com/vitejs/vite/commit/535795a)), closes [#13156](https://github.com/vitejs/vite/issues/13156)



## <small>4.3.5 (2023-05-05)</small>

* fix: location is not defined error in cleanScssBugUrl (#13100) ([91d7b67](https://github.com/vitejs/vite/commit/91d7b67)), closes [#13100](https://github.com/vitejs/vite/issues/13100)
* fix: unwrapId and pass ssr flag when adding to moduleGraph in this.load (#13083) ([9041e19](https://github.com/vitejs/vite/commit/9041e19)), closes [#13083](https://github.com/vitejs/vite/issues/13083)
* fix(assetImportMetaUrl): reserve dynamic template literal query params (#13034) ([7089528](https://github.com/vitejs/vite/commit/7089528)), closes [#13034](https://github.com/vitejs/vite/issues/13034)
* fix(debug): skip filter object args (#13098) ([d95a9af](https://github.com/vitejs/vite/commit/d95a9af)), closes [#13098](https://github.com/vitejs/vite/issues/13098)
* fix(scan): handle html script tag attributes that contain ">" (#13101) ([8a37de6](https://github.com/vitejs/vite/commit/8a37de6)), closes [#13101](https://github.com/vitejs/vite/issues/13101)
* fix(ssr): ignore __esModule for ssrExportAll (#13084) ([8a8ea1d](https://github.com/vitejs/vite/commit/8a8ea1d)), closes [#13084](https://github.com/vitejs/vite/issues/13084)



## <small>4.3.4 (2023-05-02)</small>

* fix(define): incorrect raw expression value type in build (#13003) ([8f4cf07](https://github.com/vitejs/vite/commit/8f4cf07)), closes [#13003](https://github.com/vitejs/vite/issues/13003)
* fix(importAnalysisBuild): support parsing '__VITE_PRELOAD__' (#13023) ([447df7c](https://github.com/vitejs/vite/commit/447df7c)), closes [#13023](https://github.com/vitejs/vite/issues/13023)
* fix(server): should respect hmr port when middlewareMode=false (#13040) ([1ee0014](https://github.com/vitejs/vite/commit/1ee0014)), closes [#13040](https://github.com/vitejs/vite/issues/13040)
* fix(ssr): track for statements as block scope (#13021) ([2f8502f](https://github.com/vitejs/vite/commit/2f8502f)), closes [#13021](https://github.com/vitejs/vite/issues/13021)
* chore: add changelog for vite 4.2.2 and 3.2.6 (#13055) ([0c9f1f4](https://github.com/vitejs/vite/commit/0c9f1f4)), closes [#13055](https://github.com/vitejs/vite/issues/13055)



## <small>4.3.3 (2023-04-26)</small>

* fix: address file path mismatch when loading Vite config file on Windows (fix #12923) (#13005) ([84c4118](https://github.com/vitejs/vite/commit/84c4118)), closes [#12923](https://github.com/vitejs/vite/issues/12923) [#13005](https://github.com/vitejs/vite/issues/13005)
* fix: undefined document in worker (#12988) ([08c1452](https://github.com/vitejs/vite/commit/08c1452)), closes [#12988](https://github.com/vitejs/vite/issues/12988)
* fix(resolve): deep import resolvedId error (#13010) ([30a41ff](https://github.com/vitejs/vite/commit/30a41ff)), closes [#13010](https://github.com/vitejs/vite/issues/13010)
* feat: optimize deps option to turn off auto discovery (#13000) ([bd86375](https://github.com/vitejs/vite/commit/bd86375)), closes [#13000](https://github.com/vitejs/vite/issues/13000)
* chore(deps): update all non-major dependencies (#12805) ([5731ac9](https://github.com/vitejs/vite/commit/5731ac9)), closes [#12805](https://github.com/vitejs/vite/issues/12805)



## <small>4.3.2 (2023-04-25)</small>

* fix: status optional in windows network drive regex (fix: #12948) (#12949) ([f781fc6](https://github.com/vitejs/vite/commit/f781fc6)), closes [#12948](https://github.com/vitejs/vite/issues/12948) [#12949](https://github.com/vitejs/vite/issues/12949)
* fix: use realpathSync for node <16.18 on windows (#12971) ([965839c](https://github.com/vitejs/vite/commit/965839c)), closes [#12971](https://github.com/vitejs/vite/issues/12971)
* fix(ssr): hoist statements after hashbang (#12985) ([07bd6d1](https://github.com/vitejs/vite/commit/07bd6d1)), closes [#12985](https://github.com/vitejs/vite/issues/12985)
* chore: build time message setting color (#12940) ([ada7cd5](https://github.com/vitejs/vite/commit/ada7cd5)), closes [#12940](https://github.com/vitejs/vite/issues/12940)
* chore: remove extra ) in changelog (#12932) ([e7924d2](https://github.com/vitejs/vite/commit/e7924d2)), closes [#12932](https://github.com/vitejs/vite/issues/12932)
* chore: upgrade rollup (#12965) ([bdb2f25](https://github.com/vitejs/vite/commit/bdb2f25)), closes [#12965](https://github.com/vitejs/vite/issues/12965)
* refactor: resolveExports (#10917) ([ad21ec3](https://github.com/vitejs/vite/commit/ad21ec3)), closes [#10917](https://github.com/vitejs/vite/issues/10917)



## <small>4.3.1 (2023-04-20)</small>

* fix: revert ensure module in graph before transforming (#12774) (#12929) ([9cc93a5](https://github.com/vitejs/vite/commit/9cc93a5)), closes [#12774](https://github.com/vitejs/vite/issues/12774) [#12929](https://github.com/vitejs/vite/issues/12929)
* docs: 4.3 announcement and release notes (#12925) ([f29c582](https://github.com/vitejs/vite/commit/f29c582)), closes [#12925](https://github.com/vitejs/vite/issues/12925)
* chore: clean up 4.3 changelog ([55ec023](https://github.com/vitejs/vite/commit/55ec023))



## 4.3.0 (2023-04-20)

Vite 4.3 is out! Read the [announcement blog post here](https://vitejs.dev/blog/announcing-vite4-3)

[![Vite 4.3, It's Fast](https://vitejs.dev/og-image-announcing-vite4-3.png)](https://vitejs.dev/blog/announcing-vite4-3)

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

* feat: expose `isFileServingAllowed` as public utility (#12894) ([93e095c](https://github.com/vitejs/vite/commit/93e095c)), closes [#12894](https://github.com/vitejs/vite/issues/12894)
* feat: reuse existing style elements in dev (#12678) ([3a41bd8](https://github.com/vitejs/vite/commit/3a41bd8)), closes [#12678](https://github.com/vitejs/vite/issues/12678)
* feat: skip pinging the server when the tab is not shown (#12698) ([bedcd8f](https://github.com/vitejs/vite/commit/bedcd8f)), closes [#12698](https://github.com/vitejs/vite/issues/12698)
* feat(create-vite): use typescript 5.0 in templates (#12481) ([8582e2d](https://github.com/vitejs/vite/commit/8582e2d)), closes [#12481](https://github.com/vitejs/vite/issues/12481)
* feat: use preview server parameter in preview server hook (#11647) ([4c142ea](https://github.com/vitejs/vite/commit/4c142ea)), closes [#11647](https://github.com/vitejs/vite/issues/11647)
* feat(reporter): show gzip info for all compressible files (fix #11288) (#12485) ([03502c8](https://github.com/vitejs/vite/commit/03502c8)), closes [#11288](https://github.com/vitejs/vite/issues/11288) [#12485](https://github.com/vitejs/vite/issues/12485)
* feat(server): allow to import `data:` uris (#12645) ([4886d9f](https://github.com/vitejs/vite/commit/4886d9f)), closes [#12645](https://github.com/vitejs/vite/issues/12645)
* feat: add opus filetype to assets & mime types (#12526) ([63524ba](https://github.com/vitejs/vite/commit/63524ba)), closes [#12526](https://github.com/vitejs/vite/issues/12526)

### Performance

* perf: parallelize await exportsData from depsInfo (#12869) ([ab3a530](https://github.com/vitejs/vite/commit/ab3a530)), closes [#12869](https://github.com/vitejs/vite/issues/12869)
* perf: avoid side effects resolving in dev and in the optimizer/scanner (#12789) ([fb904f9](https://github.com/vitejs/vite/commit/fb904f9)), closes [#12789](https://github.com/vitejs/vite/issues/12789)
* perf: parallelize imports processing in import analysis plugin (#12754) ([037a6c7](https://github.com/vitejs/vite/commit/037a6c7)), closes [#12754](https://github.com/vitejs/vite/issues/12754)
* perf: unresolvedUrlToModule promise cache (#12725) ([80c526e](https://github.com/vitejs/vite/commit/80c526e)), closes [#12725](https://github.com/vitejs/vite/issues/12725)
* perf(resolve): avoid tryFsResolve for /@fs/ paths (#12450) ([3ef8aaa](https://github.com/vitejs/vite/commit/3ef8aaa)), closes [#12450](https://github.com/vitejs/vite/issues/12450)
* perf(resolve): reduce vite client path checks (#12471) ([c49af23](https://github.com/vitejs/vite/commit/c49af23)), closes [#12471](https://github.com/vitejs/vite/issues/12471)
* perf: avoid new URL() in hot path (#12654) ([f4e2fdf](https://github.com/vitejs/vite/commit/f4e2fdf)), closes [#12654](https://github.com/vitejs/vite/issues/12654)
* perf: improve isFileReadable performance (#12397) ([acf3a14](https://github.com/vitejs/vite/commit/acf3a14)), closes [#12397](https://github.com/vitejs/vite/issues/12397)
* perf: module graph url shortcuts (#12635) ([c268cfa](https://github.com/vitejs/vite/commit/c268cfa)), closes [#12635](https://github.com/vitejs/vite/issues/12635)
* perf: reduce runOptimizerIfIdleAfterMs time (#12614) ([d026a65](https://github.com/vitejs/vite/commit/d026a65)), closes [#12614](https://github.com/vitejs/vite/issues/12614)
* perf: shorcircuit resolve in ensure entry from url (#12655) ([82137d6](https://github.com/vitejs/vite/commit/82137d6)), closes [#12655](https://github.com/vitejs/vite/issues/12655)
* perf: skip es-module-lexer if have no dynamic imports (#12732) ([5d07d7c](https://github.com/vitejs/vite/commit/5d07d7c)), closes [#12732](https://github.com/vitejs/vite/issues/12732)
* perf: start preprocessing static imports before updating module graph (#12723) ([c90b46e](https://github.com/vitejs/vite/commit/c90b46e)), closes [#12723](https://github.com/vitejs/vite/issues/12723)
* perf: use package cache for one off resolve (#12744) ([77bf4ef](https://github.com/vitejs/vite/commit/77bf4ef)), closes [#12744](https://github.com/vitejs/vite/issues/12744)
* perf(css): cache lazy import (#12721) ([fedb080](https://github.com/vitejs/vite/commit/fedb080)), closes [#12721](https://github.com/vitejs/vite/issues/12721)
* perf(hmr): keep track of already traversed modules when propagating update (#12658) ([3b912fb](https://github.com/vitejs/vite/commit/3b912fb)), closes [#12658](https://github.com/vitejs/vite/issues/12658)
* perf(moduleGraph): resolve dep urls in parallel (#12619) ([4823fec](https://github.com/vitejs/vite/commit/4823fec)), closes [#12619](https://github.com/vitejs/vite/issues/12619)
* perf(resolve): skip for virtual files (#12638) ([9e13f5f](https://github.com/vitejs/vite/commit/9e13f5f)), closes [#12638](https://github.com/vitejs/vite/issues/12638)
* perf: avoid fsp.unlink if we don't use the promise (#12589) ([19d1980](https://github.com/vitejs/vite/commit/19d1980)), closes [#12589](https://github.com/vitejs/vite/issues/12589)
* perf: back to temporal optimizer dirs (#12622) ([8da0422](https://github.com/vitejs/vite/commit/8da0422)), closes [#12622](https://github.com/vitejs/vite/issues/12622)
* perf: cache `depsCacheDirPrefix` value for `isOptimizedDepFile` (#12601) ([edbd262](https://github.com/vitejs/vite/commit/edbd262)), closes [#12601](https://github.com/vitejs/vite/issues/12601)
* perf: improve cleanUrl util (#12573) ([68d500e](https://github.com/vitejs/vite/commit/68d500e)), closes [#12573](https://github.com/vitejs/vite/issues/12573)
* perf: non-blocking write of optimized dep files (#12603) ([2f5f968](https://github.com/vitejs/vite/commit/2f5f968)), closes [#12603](https://github.com/vitejs/vite/issues/12603)
* perf: try using realpathSync.native in Windows (#12580) ([1cc99f8](https://github.com/vitejs/vite/commit/1cc99f8)), closes [#12580](https://github.com/vitejs/vite/issues/12580)
* perf: use fsp in more cases (#12553) ([e9b92f5](https://github.com/vitejs/vite/commit/e9b92f5)), closes [#12553](https://github.com/vitejs/vite/issues/12553)
* perf(html): apply preTransformRequest for html scripts (#12599) ([420782c](https://github.com/vitejs/vite/commit/420782c)), closes [#12599](https://github.com/vitejs/vite/issues/12599)
* perf(optimizer): bulk optimizer delay (#12609) ([c881971](https://github.com/vitejs/vite/commit/c881971)), closes [#12609](https://github.com/vitejs/vite/issues/12609)
* perf(optimizer): start optimizer early (#12593) ([4f9b8b4](https://github.com/vitejs/vite/commit/4f9b8b4)), closes [#12593](https://github.com/vitejs/vite/issues/12593)
* perf(resolve): avoid isWorkerRequest and clean up .ts imported a .js (#12571) ([8ab1438](https://github.com/vitejs/vite/commit/8ab1438)), closes [#12571](https://github.com/vitejs/vite/issues/12571)
* perf(resolve): findNearestMainPackageData instead of lookupFile (#12576) ([54b376f](https://github.com/vitejs/vite/commit/54b376f)), closes [#12576](https://github.com/vitejs/vite/issues/12576)
* perf(server): only watch .env files in envDir (#12587) ([26d8e72](https://github.com/vitejs/vite/commit/26d8e72)), closes [#12587](https://github.com/vitejs/vite/issues/12587)
* perf: avoid execSync on openBrowser (#12510) ([a2af2f0](https://github.com/vitejs/vite/commit/a2af2f0)), closes [#12510](https://github.com/vitejs/vite/issues/12510)
* perf: extract regex and use Map in data-uri plugin (#12500) ([137e63d](https://github.com/vitejs/vite/commit/137e63d)), closes [#12500](https://github.com/vitejs/vite/issues/12500)
* perf: extract vite:resolve internal functions (#12522) ([6ea4be2](https://github.com/vitejs/vite/commit/6ea4be2)), closes [#12522](https://github.com/vitejs/vite/issues/12522)
* perf: improve package cache usage (#12512) ([abc2b9c](https://github.com/vitejs/vite/commit/abc2b9c)), closes [#12512](https://github.com/vitejs/vite/issues/12512)
* perf: more regex improvements (#12520) ([abf536f](https://github.com/vitejs/vite/commit/abf536f)), closes [#12520](https://github.com/vitejs/vite/issues/12520)
* perf: regex to startsWith/slice in utils (#12532) ([debc6e2](https://github.com/vitejs/vite/commit/debc6e2)), closes [#12532](https://github.com/vitejs/vite/issues/12532)
* perf: remove regex in ImportMetaURL plugins (#12502) ([1030049](https://github.com/vitejs/vite/commit/1030049)), closes [#12502](https://github.com/vitejs/vite/issues/12502)
* perf: replace endsWith with === (#12539) ([7eb52ec](https://github.com/vitejs/vite/commit/7eb52ec)), closes [#12539](https://github.com/vitejs/vite/issues/12539)
* perf: replace startsWith with === (#12531) ([9cce026](https://github.com/vitejs/vite/commit/9cce026)), closes [#12531](https://github.com/vitejs/vite/issues/12531)
* perf: reuse regex in plugins (#12518) ([da43936](https://github.com/vitejs/vite/commit/da43936)), closes [#12518](https://github.com/vitejs/vite/issues/12518)
* perf: use `safeRealpath` in `getRealpath` (#12551) ([cec2320](https://github.com/vitejs/vite/commit/cec2320)), closes [#12551](https://github.com/vitejs/vite/issues/12551)
* perf(css): improve postcss config resolve (#12484) ([58e99b6](https://github.com/vitejs/vite/commit/58e99b6)), closes [#12484](https://github.com/vitejs/vite/issues/12484)
* perf(esbuild): make tsconfck non-blocking (#12548) ([e5cdff7](https://github.com/vitejs/vite/commit/e5cdff7)), closes [#12548](https://github.com/vitejs/vite/issues/12548)
* perf(esbuild): update tsconfck to consume faster find-all implementation (#12541) ([b6ea25a](https://github.com/vitejs/vite/commit/b6ea25a)), closes [#12541](https://github.com/vitejs/vite/issues/12541)
* perf(resolve): fix browser mapping nearest package.json check (#12550) ([eac376e](https://github.com/vitejs/vite/commit/eac376e)), closes [#12550](https://github.com/vitejs/vite/issues/12550)
* perf(resolve): improve package.json resolve speed (#12441) ([1fc8c65](https://github.com/vitejs/vite/commit/1fc8c65)), closes [#12441](https://github.com/vitejs/vite/issues/12441)
* perf(resolve): refactor package.json handling for deep imports (#12461) ([596b661](https://github.com/vitejs/vite/commit/596b661)), closes [#12461](https://github.com/vitejs/vite/issues/12461)
* perf(resolve): refactor tryFsResolve and tryResolveFile (#12542) ([3f70f47](https://github.com/vitejs/vite/commit/3f70f47))
* perf(resolve): skip absolute paths in root as url checks (#12476) ([8d2931b](https://github.com/vitejs/vite/commit/8d2931b)), closes [#12476](https://github.com/vitejs/vite/issues/12476)
* perf(resolve): support # in path only for dependencies (#12469) ([6559fc7](https://github.com/vitejs/vite/commit/6559fc7)), closes [#12469](https://github.com/vitejs/vite/issues/12469)

### Bug Fixes

* fix(build): do not repeatedly output warning message (#12910) ([251d0ab](https://github.com/vitejs/vite/commit/251d0ab)), closes [#12910](https://github.com/vitejs/vite/issues/12910)
* fix: escape msg in render restricted error html (#12889) ([3aa2127](https://github.com/vitejs/vite/commit/3aa2127)), closes [#12889](https://github.com/vitejs/vite/issues/12889)
* fix: yarn pnp considerBuiltins (#12903) ([a0e10d5](https://github.com/vitejs/vite/commit/a0e10d5)), closes [#12903](https://github.com/vitejs/vite/issues/12903)
* fix: broken middleware name (#12871) ([32bef57](https://github.com/vitejs/vite/commit/32bef57)), closes [#12871](https://github.com/vitejs/vite/issues/12871)
* fix: cleanUpStaleCacheDirs once per process (#12847) ([2c58b6e](https://github.com/vitejs/vite/commit/2c58b6e)), closes [#12847](https://github.com/vitejs/vite/issues/12847)
* fix(build): do not warn when URL in CSS is externalized (#12873) ([1510996](https://github.com/vitejs/vite/commit/1510996)), closes [#12873](https://github.com/vitejs/vite/issues/12873)
* fix: build time deps optimization, and ensure single crawl end call (#12851) ([fa30879](https://github.com/vitejs/vite/commit/fa30879)), closes [#12851](https://github.com/vitejs/vite/issues/12851)
* fix: correct vite config temporary name (#12833) ([cdd9c23](https://github.com/vitejs/vite/commit/cdd9c23)), closes [#12833](https://github.com/vitejs/vite/issues/12833)
* fix(importAnalysis): warning on ExportAllDeclaration (#12799) ([5136b9b](https://github.com/vitejs/vite/commit/5136b9b)), closes [#12799](https://github.com/vitejs/vite/issues/12799)
* fix(optimizer): start optimizer after buildStart (#12832) ([cfe75ee](https://github.com/vitejs/vite/commit/cfe75ee)), closes [#12832](https://github.com/vitejs/vite/issues/12832)
* fix: handle try-catch for fs promise when resolve https config (#12808) ([0bba402](https://github.com/vitejs/vite/commit/0bba402)), closes [#12808](https://github.com/vitejs/vite/issues/12808)
* fix(build): correctly handle warning ignore list (#12831) ([8830532](https://github.com/vitejs/vite/commit/8830532)), closes [#12831](https://github.com/vitejs/vite/issues/12831)
* fix(resolve): use different importer check for css imports (#12815) ([d037327](https://github.com/vitejs/vite/commit/d037327)), closes [#12815](https://github.com/vitejs/vite/issues/12815)
* fix: ignore sideEffects for scripts imported from html (#12786) ([f09551f](https://github.com/vitejs/vite/commit/f09551f)), closes [#12786](https://github.com/vitejs/vite/issues/12786)
* fix: warn on build when bundling code that uses nodejs built in module (#12616) ([72050f9](https://github.com/vitejs/vite/commit/72050f9)), closes [#12616](https://github.com/vitejs/vite/issues/12616)
* fix(cli): pass mode to optimize command (#12776) ([da38ad8](https://github.com/vitejs/vite/commit/da38ad8)), closes [#12776](https://github.com/vitejs/vite/issues/12776)
* fix(css): resolve at import from dependency basedir (#12796) ([46bdf7d](https://github.com/vitejs/vite/commit/46bdf7d)), closes [#12796](https://github.com/vitejs/vite/issues/12796)
* fix(worker): asset in iife worker and relative base (#12697) ([ddefc06](https://github.com/vitejs/vite/commit/ddefc06)), closes [#12697](https://github.com/vitejs/vite/issues/12697)
* fix(worker): return null for shouldTransformCachedModule (#12797) ([ea5f6fc](https://github.com/vitejs/vite/commit/ea5f6fc)), closes [#12797](https://github.com/vitejs/vite/issues/12797)
* fix: allow onwarn to override vite default warning handling (#12757) ([f736930](https://github.com/vitejs/vite/commit/f736930)), closes [#12757](https://github.com/vitejs/vite/issues/12757)
* fix: ensure module in graph before transforming (#12774) ([44ad321](https://github.com/vitejs/vite/commit/44ad321)), closes [#12774](https://github.com/vitejs/vite/issues/12774)
* fix: update package cache watcher (#12772) ([a78588f](https://github.com/vitejs/vite/commit/a78588f)), closes [#12772](https://github.com/vitejs/vite/issues/12772)
* fix: avoid clean up while committing deps folder (#12722) ([3f4d109](https://github.com/vitejs/vite/commit/3f4d109)), closes [#12722](https://github.com/vitejs/vite/issues/12722)
* fix: ignore pnp resolve error (#12719) ([2d30ae5](https://github.com/vitejs/vite/commit/2d30ae5)), closes [#12719](https://github.com/vitejs/vite/issues/12719)
* fix: leave fully dynamic import.meta.url asset (fixes #10306) (#10549) ([56802b1](https://github.com/vitejs/vite/commit/56802b1)), closes [#10306](https://github.com/vitejs/vite/issues/10306) [#10549](https://github.com/vitejs/vite/issues/10549)
* fix: output combined sourcemap in importAnalysisBuild plugin (#12642) ([d051639](https://github.com/vitejs/vite/commit/d051639)), closes [#12642](https://github.com/vitejs/vite/issues/12642)
* fix: take in relative assets path fixes from rollup (#12695) ([81e44dd](https://github.com/vitejs/vite/commit/81e44dd)), closes [#12695](https://github.com/vitejs/vite/issues/12695)
* fix: throws error when plugin tries to resolve ID to external URL (#11731) ([49674b5](https://github.com/vitejs/vite/commit/49674b5)), closes [#11731](https://github.com/vitejs/vite/issues/11731)
* fix(css): css file emit synchronously (#12558) ([8e30025](https://github.com/vitejs/vite/commit/8e30025)), closes [#12558](https://github.com/vitejs/vite/issues/12558)
* fix(import-analysis): escape quotes correctly (#12688) ([1638ebd](https://github.com/vitejs/vite/commit/1638ebd)), closes [#12688](https://github.com/vitejs/vite/issues/12688)
* fix(optimizer): load the correct lock file (#12700) ([889eebe](https://github.com/vitejs/vite/commit/889eebe)), closes [#12700](https://github.com/vitejs/vite/issues/12700)
* fix(server): delay ws server listen when restart (#12734) ([abe9274](https://github.com/vitejs/vite/commit/abe9274)), closes [#12734](https://github.com/vitejs/vite/issues/12734)
* fix(ssr): load sourcemaps alongside modules (#11780) ([be95050](https://github.com/vitejs/vite/commit/be95050)), closes [#11780](https://github.com/vitejs/vite/issues/11780)
* fix(ssr): show ssr module loader error stack (#12651) ([050c0f9](https://github.com/vitejs/vite/commit/050c0f9)), closes [#12651](https://github.com/vitejs/vite/issues/12651)
* fix(worker): disable manifest plugins in worker build (#12661) ([20b8ef4](https://github.com/vitejs/vite/commit/20b8ef4)), closes [#12661](https://github.com/vitejs/vite/issues/12661)
* fix(worker): worker import.meta.url should not depends on document in iife mode (#12629) ([65f5ed2](https://github.com/vitejs/vite/commit/65f5ed2)), closes [#12629](https://github.com/vitejs/vite/issues/12629)
* fix: avoid temporal optimize deps dirs (#12582) ([ff92f2f](https://github.com/vitejs/vite/commit/ff92f2f)), closes [#12582](https://github.com/vitejs/vite/issues/12582)
* fix: await `buildStart` before server start (#12647) ([871d353](https://github.com/vitejs/vite/commit/871d353)), closes [#12647](https://github.com/vitejs/vite/issues/12647)
* fix: call `buildStart` only once when using next port (#12624) ([e10c6bd](https://github.com/vitejs/vite/commit/e10c6bd)), closes [#12624](https://github.com/vitejs/vite/issues/12624)
* fix: sourcemapIgnoreList for optimizedDeps (#12633) ([c1d3fc9](https://github.com/vitejs/vite/commit/c1d3fc9)), closes [#12633](https://github.com/vitejs/vite/issues/12633)
* fix: splitFileAndPostfix works as cleanUrl (#12572) ([276725f](https://github.com/vitejs/vite/commit/276725f)), closes [#12572](https://github.com/vitejs/vite/issues/12572)
* fix: throw error on build optimizeDeps issue (#12560) ([02a46d7](https://github.com/vitejs/vite/commit/02a46d7)), closes [#12560](https://github.com/vitejs/vite/issues/12560)
* fix: use nearest pkg to resolved for moduleSideEffects (#12628) ([1dfecc8](https://github.com/vitejs/vite/commit/1dfecc8)), closes [#12628](https://github.com/vitejs/vite/issues/12628)
* fix(css): use `charset: 'utf8'` by default for css (#12565) ([c20a064](https://github.com/vitejs/vite/commit/c20a064)), closes [#12565](https://github.com/vitejs/vite/issues/12565)
* fix(html): dont pretransform public scripts (#12650) ([4f0af3f](https://github.com/vitejs/vite/commit/4f0af3f)), closes [#12650](https://github.com/vitejs/vite/issues/12650)
* fix: avoid crash because of no access permission (#12552) ([eea1682](https://github.com/vitejs/vite/commit/eea1682)), closes [#12552](https://github.com/vitejs/vite/issues/12552)
* fix: esbuild complains with extra fields (#12516) ([7be0ba5](https://github.com/vitejs/vite/commit/7be0ba5)), closes [#12516](https://github.com/vitejs/vite/issues/12516)
* fix: escape replacements in clientInjections (#12486) ([3765067](https://github.com/vitejs/vite/commit/3765067)), closes [#12486](https://github.com/vitejs/vite/issues/12486)
* fix: open browser reuse logic (#12535) ([04d14af](https://github.com/vitejs/vite/commit/04d14af)), closes [#12535](https://github.com/vitejs/vite/issues/12535)
* fix: prevent error on not set location href (#12494) ([2fb8527](https://github.com/vitejs/vite/commit/2fb8527)), closes [#12494](https://github.com/vitejs/vite/issues/12494)
* fix: simplify prettyUrl (#12488) ([ebe5aa5](https://github.com/vitejs/vite/commit/ebe5aa5)), closes [#12488](https://github.com/vitejs/vite/issues/12488)
* fix(config): add random number to temp transpiled file (#12150) ([2b2ba61](https://github.com/vitejs/vite/commit/2b2ba61)), closes [#12150](https://github.com/vitejs/vite/issues/12150)
* fix(deps): update all non-major dependencies (#12389) ([3e60b77](https://github.com/vitejs/vite/commit/3e60b77)), closes [#12389](https://github.com/vitejs/vite/issues/12389)
* fix(html): public asset urls always being treated as paths (fix #11857) (#11870) ([46d1352](https://github.com/vitejs/vite/commit/46d1352)), closes [#11857](https://github.com/vitejs/vite/issues/11857) [#11870](https://github.com/vitejs/vite/issues/11870)
* fix(ssr): hoist import statements to the top (#12274) ([33baff5](https://github.com/vitejs/vite/commit/33baff5)), closes [#12274](https://github.com/vitejs/vite/issues/12274)
* fix(ssr): hoist re-exports with imports (#12530) ([45549e4](https://github.com/vitejs/vite/commit/45549e4)), closes [#12530](https://github.com/vitejs/vite/issues/12530)
* fix: should generate Hi-res sourcemap for dev (#12501) ([1502617](https://github.com/vitejs/vite/commit/1502617)), closes [#12501](https://github.com/vitejs/vite/issues/12501)


### Clean up

* refactor: simplify crawlEndFinder (#12868) ([31f8b51](https://github.com/vitejs/vite/commit/31f8b51)), closes [#12868](https://github.com/vitejs/vite/issues/12868)
* refactor: use simpler resolve for nested optimized deps (#12770) ([d202588](https://github.com/vitejs/vite/commit/d202588)), closes [#12770](https://github.com/vitejs/vite/issues/12770)
* refactor: `import.meta.url` condition from renderChunk hook of worker plugin (#12696) ([fdef8fd](https://github.com/vitejs/vite/commit/fdef8fd)), closes [#12696](https://github.com/vitejs/vite/issues/12696)
* refactor: clean up preTransformRequest (#12672) ([561227c](https://github.com/vitejs/vite/commit/561227c)), closes [#12672](https://github.com/vitejs/vite/issues/12672)
* refactor: make debugger nullable (#12687) ([89e4977](https://github.com/vitejs/vite/commit/89e4977)), closes [#12687](https://github.com/vitejs/vite/issues/12687)
* refactor: remove `ensureVolumeInPath` (#12690) ([a3150ee](https://github.com/vitejs/vite/commit/a3150ee)), closes [#12690](https://github.com/vitejs/vite/issues/12690)
* refactor: remove unused exports data props (#12740) ([4538bfe](https://github.com/vitejs/vite/commit/4538bfe)), closes [#12740](https://github.com/vitejs/vite/issues/12740)
* refactor: use `resolvePackageData` in `requireResolveFromRootWithFallback` (#12712) ([1ea38e2](https://github.com/vitejs/vite/commit/1ea38e2)), closes [#12712](https://github.com/vitejs/vite/issues/12712)
* refactor(css): simplify cached import code (#12730) ([0646754](https://github.com/vitejs/vite/commit/0646754)), closes [#12730](https://github.com/vitejs/vite/issues/12730)
* refactor: improve scanner logs (#12578) ([9925a72](https://github.com/vitejs/vite/commit/9925a72)), closes [#12578](https://github.com/vitejs/vite/issues/12578)
* refactor: isInNodeModules util (#12588) ([fb3245a](https://github.com/vitejs/vite/commit/fb3245a)), closes [#12588](https://github.com/vitejs/vite/issues/12588)
* refactor: remove `idToPkgMap` (#12564) ([a326ec8](https://github.com/vitejs/vite/commit/a326ec8)), closes [#12564](https://github.com/vitejs/vite/issues/12564)
* refactor: simplify lookupFile (#12585) ([4215e22](https://github.com/vitejs/vite/commit/4215e22)), closes [#12585](https://github.com/vitejs/vite/issues/12585)
* refactor: tryStatSync as util (#12575) ([92601db](https://github.com/vitejs/vite/commit/92601db)), closes [#12575](https://github.com/vitejs/vite/issues/12575)
* refactor: use findNearestPackageData in more places (#12577) ([35faae9](https://github.com/vitejs/vite/commit/35faae9)), closes [#12577](https://github.com/vitejs/vite/issues/12577)
* refactor: esbuild plugin config logic (#12493) ([45b5b0f](https://github.com/vitejs/vite/commit/45b5b0f)), closes [#12493](https://github.com/vitejs/vite/issues/12493)


### Previous Changelogs


#### [4.3.0-beta.8](https://github.com/vitejs/vite/compare/v4.3.0-beta.7....v4.3.0-beta.8) (2023-04-19)

See [4.3.0-beta.8 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.8/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.7](https://github.com/vitejs/vite/compare/v4.3.0-beta.6....v4.3.0-beta.7) (2023-04-17)

See [4.3.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.7/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.6](https://github.com/vitejs/vite/compare/v4.3.0-beta.5....v4.3.0-beta.6) (2023-04-14)

See [4.3.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.6/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.5](https://github.com/vitejs/vite/compare/v4.3.0-beta.4....v4.3.0-beta.5) (2023-04-11)

See [4.3.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.5/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.4](https://github.com/vitejs/vite/compare/v4.3.0-beta.3....v4.3.0-beta.4) (2023-04-09)

See [4.3.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.4/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.3](https://github.com/vitejs/vite/compare/v4.3.0-beta.2....v4.3.0-beta.3) (2023-04-07)

See [4.3.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.3/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.2](https://github.com/vitejs/vite/compare/v4.3.0-beta.1....v4.3.0-beta.2) (2023-04-05)

See [4.3.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.1](https://github.com/vitejs/vite/compare/v4.3.0-beta.0....v4.3.0-beta.1) (2023-03-29)

See [4.3.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.3.0-beta.0](https://github.com/vitejs/vite/compare/v4.2.1....v4.3.0-beta.0) (2023-03-23)

See [4.3.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.3.0-beta.0/packages/vite/CHANGELOG.md)


## <small>4.2.2 (2023-04-18)</small>

* fix: escape msg in render restricted error html, backport #12889 ([8758c5c](https://github.com/vitejs/vite/commit/8758c5c)), closes [#12889](https://github.com/vitejs/vite/issues/12889)



## <small>4.2.1 (2023-03-20)</small>

* fix: add `virtual:` to virtual module source map ignore (#12444) ([c4aa28f](https://github.com/vitejs/vite/commit/c4aa28f)), closes [#12444](https://github.com/vitejs/vite/issues/12444)
* fix(css): inject source content conditionally (#12449) ([3e665f6](https://github.com/vitejs/vite/commit/3e665f6)), closes [#12449](https://github.com/vitejs/vite/issues/12449)
* fix(worker): using data URLs for inline shared worker (#12014) ([79a5007](https://github.com/vitejs/vite/commit/79a5007)), closes [#12014](https://github.com/vitejs/vite/issues/12014)
* chore: changelog edits for 4.2 (#12438) ([ce047e3](https://github.com/vitejs/vite/commit/ce047e3)), closes [#12438](https://github.com/vitejs/vite/issues/12438)



## 4.2.0 (2023-03-16)

Vite 4.2 is out!

### Support env variables replacement in HTML files

Vite now supports [replacing env variables in HTML files](https://vitejs.dev/guide/env-and-mode.html#html-env-replacement). Any properties in `import.meta.env` can be used in HTML files with a special `%ENV_NAME%` syntax:

```html
<h1>Vite is running in %MODE%</h1>
<p>Using data from %VITE_API_URL%</p>
```

### Sourcemaps improvements

The Chrome Dev Tools team has been working to improve the DX of Vite and Vite-powered frameworks in the dev tools. Vite 4.2 brings an [improved experience](https://twitter.com/bmeurer/status/1631286267823439881) and tools for framework authors to [hide 3rd party code and build artifacts from the user](https://twitter.com/bmeurer/status/1631531492462526467) from console log traces using [`server.sourcemapIgnoreList`](https://vitejs.dev/config/server-options.html#server-sourcemapignorelist) and [`build.rollupOptions.output.sourcemapIgnoreList`](https://rollupjs.org/configuration-options/#output-sourcemapignorelist).

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

The Vite documentation is now translated to Português at [pt.vitejs.dev](https://pt.vitejs.dev) thanks to [Nazaré Da Piedade](https://twitter.com/nazarepiedady) .


### Features

* feat: add status message for 504 caused by optimizer (#12435) ([5cdd3fa](https://github.com/vitejs/vite/commit/5cdd3fa)), closes [#12435](https://github.com/vitejs/vite/issues/12435)
* feat: update tsconfck to 2.1.0 to add support for typescript 5 config syntax (#12401) ([3f1c379](https://github.com/vitejs/vite/commit/3f1c379)), closes [#12401](https://github.com/vitejs/vite/issues/12401)
* feat: default esbuild jsxDev based on config.isProduction (#12386) ([f24c2b0](https://github.com/vitejs/vite/commit/f24c2b0)), closes [#12386](https://github.com/vitejs/vite/issues/12386)
* feat(css): add `build.cssMinify` (#12207) ([90431f2](https://github.com/vitejs/vite/commit/90431f2)), closes [#12207](https://github.com/vitejs/vite/issues/12207)
* feat(types): export Rollup namespace (#12316) ([6e49e52](https://github.com/vitejs/vite/commit/6e49e52)), closes [#12316](https://github.com/vitejs/vite/issues/12316)
* feat: add `sourcemapIgnoreList` configuration option (#12174) ([f875580](https://github.com/vitejs/vite/commit/f875580)), closes [#12174](https://github.com/vitejs/vite/issues/12174)
* feat: cancellable scan during optimization (#12225) ([1e1cd3b](https://github.com/vitejs/vite/commit/1e1cd3b)), closes [#12225](https://github.com/vitejs/vite/issues/12225)
* feat: don't override `build.target` if terser is 5.16.0+ (#12197) ([9885f6f](https://github.com/vitejs/vite/commit/9885f6f)), closes [#12197](https://github.com/vitejs/vite/issues/12197)
* feat: support ESM subpath imports (#7770) ([cc92da9](https://github.com/vitejs/vite/commit/cc92da9)), closes [#7770](https://github.com/vitejs/vite/issues/7770)
* feat(css): add preprocessor option to define stylus vars & funcs (#7227) ([5968bec](https://github.com/vitejs/vite/commit/5968bec)), closes [#7227](https://github.com/vitejs/vite/issues/7227)
* feat(css): support resolving stylesheets from exports map (#7817) ([108aadf](https://github.com/vitejs/vite/commit/108aadf)), closes [#7817](https://github.com/vitejs/vite/issues/7817)
* feat(html): support env replacement (#12202) ([4f2c49f](https://github.com/vitejs/vite/commit/4f2c49f)), closes [#12202](https://github.com/vitejs/vite/issues/12202)
* refactor: customize ErrorOverlay (part 2) (#11830) ([4159e6f](https://github.com/vitejs/vite/commit/4159e6f)), closes [#11830](https://github.com/vitejs/vite/issues/11830)
* refactor: remove constructed sheet type style injection (#11818) ([1a6a0c2](https://github.com/vitejs/vite/commit/1a6a0c2)), closes [#11818](https://github.com/vitejs/vite/issues/11818)
* refactor(importAnalysis): cache injected env string (#12154) ([2aad552](https://github.com/vitejs/vite/commit/2aad552)), closes [#12154](https://github.com/vitejs/vite/issues/12154)
* feat: esbuild 0.17 (#11908) ([9d42f06](https://github.com/vitejs/vite/commit/9d42f06)), closes [#11908](https://github.com/vitejs/vite/issues/11908)
* feat: ignore list client injected sources (#12170) ([8a98aef](https://github.com/vitejs/vite/commit/8a98aef)), closes [#12170](https://github.com/vitejs/vite/issues/12170)
* feat: support rollup plugin `this.load` in plugin container context (#11469) ([abfa804](https://github.com/vitejs/vite/commit/abfa804)), closes [#11469](https://github.com/vitejs/vite/issues/11469)
* feat(cli): allow to specify sourcemap mode via --sourcemap build's option (#11505) ([ee3b90a](https://github.com/vitejs/vite/commit/ee3b90a)), closes [#11505](https://github.com/vitejs/vite/issues/11505)
* feat(reporter): report built time (#12100) ([f2ad222](https://github.com/vitejs/vite/commit/f2ad222)), closes [#12100](https://github.com/vitejs/vite/issues/12100)


### Bug Fixes

* fix: html env replacement plugin position (#12404) ([96f36a9](https://github.com/vitejs/vite/commit/96f36a9)), closes [#12404](https://github.com/vitejs/vite/issues/12404)
* fix(optimizer): # symbol in deps id stripped by browser (#12415) ([e23f690](https://github.com/vitejs/vite/commit/e23f690)), closes [#12415](https://github.com/vitejs/vite/issues/12415)
* fix(resolve): rebase sub imports relative path (#12373) ([fe1d61a](https://github.com/vitejs/vite/commit/fe1d61a)), closes [#12373](https://github.com/vitejs/vite/issues/12373)
* fix(server): should close server after create new server (#12379) ([d23605d](https://github.com/vitejs/vite/commit/d23605d)), closes [#12379](https://github.com/vitejs/vite/issues/12379)
* fix(resolve): remove deep import syntax handling (#12381) ([42e0d6a](https://github.com/vitejs/vite/commit/42e0d6a)), closes [#12381](https://github.com/vitejs/vite/issues/12381)
* fix: print urls when dns order change (#12261) ([e57cacf](https://github.com/vitejs/vite/commit/e57cacf)), closes [#12261](https://github.com/vitejs/vite/issues/12261)
* fix: throw ssr import error directly (fix #12322) (#12324) ([21ffc6a](https://github.com/vitejs/vite/commit/21ffc6a)), closes [#12322](https://github.com/vitejs/vite/issues/12322) [#12324](https://github.com/vitejs/vite/issues/12324)
* fix(config): watch config even outside of root (#12321) ([7e2fff7](https://github.com/vitejs/vite/commit/7e2fff7)), closes [#12321](https://github.com/vitejs/vite/issues/12321)
* fix(config): watch envDir even outside of root (#12349) ([131f3ee](https://github.com/vitejs/vite/commit/131f3ee)), closes [#12349](https://github.com/vitejs/vite/issues/12349)
* fix(define): correctly replace SSR in dev (#12204) ([0f6de4d](https://github.com/vitejs/vite/commit/0f6de4d)), closes [#12204](https://github.com/vitejs/vite/issues/12204)
* fix(optimizer): suppress esbuild cancel error (#12358) ([86a24e4](https://github.com/vitejs/vite/commit/86a24e4)), closes [#12358](https://github.com/vitejs/vite/issues/12358)
* fix(optimizer): transform css require to import directly (#12343) ([716286e](https://github.com/vitejs/vite/commit/716286e)), closes [#12343](https://github.com/vitejs/vite/issues/12343)
* fix(reporter): build.assetsDir should not impact output when in lib mode (#12108) ([b12f457](https://github.com/vitejs/vite/commit/b12f457)), closes [#12108](https://github.com/vitejs/vite/issues/12108)
* fix(types): avoid resolve.exports types for bundling (#12346) ([6b40f03](https://github.com/vitejs/vite/commit/6b40f03)), closes [#12346](https://github.com/vitejs/vite/issues/12346)
* fix(worker): force rollup to build worker module under watch mode (#11919) ([d464679](https://github.com/vitejs/vite/commit/d464679)), closes [#11919](https://github.com/vitejs/vite/issues/11919)
* fix:  resolve browser mapping using bare imports (fix #11208) (#11219) ([22de84f](https://github.com/vitejs/vite/commit/22de84f)), closes [#11208](https://github.com/vitejs/vite/issues/11208) [#11219](https://github.com/vitejs/vite/issues/11219)
* fix: avoid null sourcePath in `server.sourcemapIgnoreList` (#12251) ([209c3bd](https://github.com/vitejs/vite/commit/209c3bd)), closes [#12251](https://github.com/vitejs/vite/issues/12251)
* fix: configure proxy before subscribing to error events (#12263) ([c35e100](https://github.com/vitejs/vite/commit/c35e100)), closes [#12263](https://github.com/vitejs/vite/issues/12263)
* fix: enforce absolute path for server.sourcemapIgnoreList (#12309) ([ab6ae07](https://github.com/vitejs/vite/commit/ab6ae07)), closes [#12309](https://github.com/vitejs/vite/issues/12309)
* fix: handle error without line and column in loc (#12312) ([ce18eba](https://github.com/vitejs/vite/commit/ce18eba)), closes [#12312](https://github.com/vitejs/vite/issues/12312)
* fix: properly clean up optimization temp folder (#12237) ([fbbf8fe](https://github.com/vitejs/vite/commit/fbbf8fe)), closes [#12237](https://github.com/vitejs/vite/issues/12237)
* fix: unique dep optimizer temp folders (#12252) ([38ce81c](https://github.com/vitejs/vite/commit/38ce81c)), closes [#12252](https://github.com/vitejs/vite/issues/12252)
* fix(build-import-analysis): should not append ?used when css request has ?url or ?raw (#11910) ([e3f725f](https://github.com/vitejs/vite/commit/e3f725f)), closes [#11910](https://github.com/vitejs/vite/issues/11910)
* fix(optimizer): don not call context.rebuild after cancel (#12264) ([520d84e](https://github.com/vitejs/vite/commit/520d84e)), closes [#12264](https://github.com/vitejs/vite/issues/12264)
* fix(resolve): update `resolve.exports` to `2.0.1` to fix `*` resolution issue (#12314) ([523d6f7](https://github.com/vitejs/vite/commit/523d6f7)), closes [#12314](https://github.com/vitejs/vite/issues/12314)
* fix: use relative paths in `sources` for transformed source maps (#12079) ([bcbc582](https://github.com/vitejs/vite/commit/bcbc582)), closes [#12079](https://github.com/vitejs/vite/issues/12079)
* fix(cli): after setting server.open, the default open is inconsistent… (#11974) ([33a38db](https://github.com/vitejs/vite/commit/33a38db)), closes [#11974](https://github.com/vitejs/vite/issues/11974)
* fix(client-inject): replace globalThis.process.env.NODE_ENV (fix #12185) (#12194) ([2063648](https://github.com/vitejs/vite/commit/2063648)), closes [#12185](https://github.com/vitejs/vite/issues/12185) [#12194](https://github.com/vitejs/vite/issues/12194)
* fix(css): should not rebase http url for less (fix: #12155) (#12195) ([9cca30d](https://github.com/vitejs/vite/commit/9cca30d)), closes [#12155](https://github.com/vitejs/vite/issues/12155) [#12195](https://github.com/vitejs/vite/issues/12195)
* fix(deps): update all non-major dependencies (#12036) ([48150f2](https://github.com/vitejs/vite/commit/48150f2)), closes [#12036](https://github.com/vitejs/vite/issues/12036)
* fix(import-analysis): improve error for jsx to not be preserve in tsconfig (#12018) ([91fac1c](https://github.com/vitejs/vite/commit/91fac1c)), closes [#12018](https://github.com/vitejs/vite/issues/12018)
* fix(optimizer): log esbuild error when scanning deps (#11977) ([20e6060](https://github.com/vitejs/vite/commit/20e6060)), closes [#11977](https://github.com/vitejs/vite/issues/11977)
* fix(optimizer): log unoptimizable entries (#12138) ([2c93e0b](https://github.com/vitejs/vite/commit/2c93e0b)), closes [#12138](https://github.com/vitejs/vite/issues/12138)
* fix(server): watch env files creating and deleting (fix #12127) (#12129) ([cc3724f](https://github.com/vitejs/vite/commit/cc3724f)), closes [#12127](https://github.com/vitejs/vite/issues/12127) [#12129](https://github.com/vitejs/vite/issues/12129)
* build: correct d.ts output dir in development (#12212) ([b90bc1f](https://github.com/vitejs/vite/commit/b90bc1f)), closes [#12212](https://github.com/vitejs/vite/issues/12212)


### Previous Changelogs


#### [4.2.0-beta.2](https://github.com/vitejs/vite/compare/v4.2.0-beta.1....v4.2.0-beta.2) (2023-03-13)

See [4.2.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.2.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.2.0-beta.1](https://github.com/vitejs/vite/compare/v4.2.0-beta.0....v4.2.0-beta.1) (2023-03-07)

See [4.2.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.2.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.2.0-beta.0](https://github.com/vitejs/vite/compare/v4.1.4....v4.2.0-beta.0) (2023-02-27)

See [4.2.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.2.0-beta.0/packages/vite/CHANGELOG.md)



## <small>4.1.4 (2023-02-21)</small>

* fix(define): should not stringify vite internal env (#12120) ([73c3999](https://github.com/vitejs/vite/commit/73c3999)), closes [#12120](https://github.com/vitejs/vite/issues/12120)
* docs: update rollup docs links (#12130) ([439a73f](https://github.com/vitejs/vite/commit/439a73f)), closes [#12130](https://github.com/vitejs/vite/issues/12130)



## <small>4.1.3 (2023-02-20)</small>

* fix: catch and handle websocket error (#11991) (#12007) ([4b5cc9f](https://github.com/vitejs/vite/commit/4b5cc9f)), closes [#11991](https://github.com/vitejs/vite/issues/11991) [#12007](https://github.com/vitejs/vite/issues/12007)
* fix: do not append version query param when scanning for dependencies (#11961) ([575bcf6](https://github.com/vitejs/vite/commit/575bcf6)), closes [#11961](https://github.com/vitejs/vite/issues/11961)
* fix(css): handle pure css chunk heuristic with special queries (#12091) ([a873af5](https://github.com/vitejs/vite/commit/a873af5)), closes [#12091](https://github.com/vitejs/vite/issues/12091)
* fix(esbuild): umd helper insert into wrong position in lib mode (#11988) ([86bc243](https://github.com/vitejs/vite/commit/86bc243)), closes [#11988](https://github.com/vitejs/vite/issues/11988)
* fix(html): respect disable modulepreload (#12111) ([6c50119](https://github.com/vitejs/vite/commit/6c50119)), closes [#12111](https://github.com/vitejs/vite/issues/12111)
* fix(html): rewrite assets url in `<noscript>` (#11764) ([1dba285](https://github.com/vitejs/vite/commit/1dba285)), closes [#11764](https://github.com/vitejs/vite/issues/11764)
* feat(preview): improve error when build output missing (#12096) ([a0702a1](https://github.com/vitejs/vite/commit/a0702a1)), closes [#12096](https://github.com/vitejs/vite/issues/12096)
* feat(ssr): add importer path to error msg when invalid url import occur (#11606) ([70729c0](https://github.com/vitejs/vite/commit/70729c0)), closes [#11606](https://github.com/vitejs/vite/issues/11606)



## <small>4.1.2 (2023-02-17)</small>

* fix: correct access to `crossOrigin` attribute (#12023) ([6a0d356](https://github.com/vitejs/vite/commit/6a0d356)), closes [#12023](https://github.com/vitejs/vite/issues/12023)
* fix: narrow defineConfig return type (#12021) ([18fa8f0](https://github.com/vitejs/vite/commit/18fa8f0)), closes [#12021](https://github.com/vitejs/vite/issues/12021)
* fix(define): inconsistent env values in build mode (#12058) ([0a50c59](https://github.com/vitejs/vite/commit/0a50c59)), closes [#12058](https://github.com/vitejs/vite/issues/12058)
* fix(env): compatible with env variables ended with unescaped $ (#12031) ([05b3df0](https://github.com/vitejs/vite/commit/05b3df0)), closes [#12031](https://github.com/vitejs/vite/issues/12031)
* fix(ssr): print file url in `ssrTransform` parse error (#12060) ([19f39f7](https://github.com/vitejs/vite/commit/19f39f7)), closes [#12060](https://github.com/vitejs/vite/issues/12060)
* revert: narrow defineConfig return type (#12077) ([54d511e](https://github.com/vitejs/vite/commit/54d511e)), closes [#12077](https://github.com/vitejs/vite/issues/12077)
* feat: support `import.meta.hot?.accept` (#12053) ([081c27f](https://github.com/vitejs/vite/commit/081c27f)), closes [#12053](https://github.com/vitejs/vite/issues/12053)
* chore: add jsdoc default value (#11746) ([8c87af7](https://github.com/vitejs/vite/commit/8c87af7)), closes [#11746](https://github.com/vitejs/vite/issues/11746)
* chore: fix typos (#12032) ([ee1a686](https://github.com/vitejs/vite/commit/ee1a686)), closes [#12032](https://github.com/vitejs/vite/issues/12032)
* chore(deps): update dependency strip-literal to v1 (#12044) ([5bd6c0a](https://github.com/vitejs/vite/commit/5bd6c0a)), closes [#12044](https://github.com/vitejs/vite/issues/12044)
* chore(pluginContainer): simplify error position judge condition (#12003) ([e3ef9f4](https://github.com/vitejs/vite/commit/e3ef9f4)), closes [#12003](https://github.com/vitejs/vite/issues/12003)



## <small>4.1.1 (2023-02-02)</small>

* chore: 4.1.0 changelog cleanup (#11900) ([7747d32](https://github.com/vitejs/vite/commit/7747d32)), closes [#11900](https://github.com/vitejs/vite/issues/11900)
* fix: catch statSync error (#11907) ([f80b9a2](https://github.com/vitejs/vite/commit/f80b9a2)), closes [#11907](https://github.com/vitejs/vite/issues/11907)



## 4.1.0 (2023-02-02)

Vite 4.1 updates to the latest versions of Rollup and esbuild. Check out the new [Rollup docs](https://rollupjs.org/), that are now powered by VitePress making the navigation between Vite and Rollup docs easier for users.

[Vite docs](https://vitejs.dev) got a theme update migrating to the latest version of VitePress.

As part of [Vite 4](https://vitejs.dev/blog/announcing-vite4.html), the Vue and React plugins have been extracted out of the monorepo. Although their release cycle will no longer follow Vite releases moving forward, Vite 4.1 is released in parallel with new versions of [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react%403.1.0) and [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc/releases/tag/v3.1.0). @vitejs/plugin-react 3.1.0 reworks the way HMR is handled fixing many edge cases and @vitejs/plugin-react-swc 3.1.0 adds support for SWC plugins.

There is also a new major for [@vitejs/plugin-legacy](https://github.com/vitejs/vite/blob/main/packages/plugin-legacy), see [changelog for v4.0.0](https://github.com/vitejs/vite/blob/main/packages/plugin-legacy/CHANGELOG.md#400-2023-02-02). This version contains breaking changes:
- Support browserslist and update default target ([#11318](https://github.com/vitejs/vite/pull/11318)). See [updated `targets` default](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy#targets).
- Bump modern target to support async generator ([#11896](https://github.com/vitejs/vite/pull/11896)). Learn more at [the browsers support docs](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy#browsers-that-supports-esm-but-does-not-support-widely-available-features).

### Features

* feat: add experimental option to skip SSR transform (#11411) ([e781ef3](https://github.com/vitejs/vite/commit/e781ef3)), closes [#11411](https://github.com/vitejs/vite/issues/11411)
* feat: reproducible manifest (#11542) ([efc8979](https://github.com/vitejs/vite/commit/efc8979)), closes [#11542](https://github.com/vitejs/vite/issues/11542)
* feat: support BROWSER and BROWSER_ARGS in env file (#11513) ([8972868](https://github.com/vitejs/vite/commit/8972868)), closes [#11513](https://github.com/vitejs/vite/issues/11513)
* feat(cli): clear console by pressing c (#11493) (#11494) ([1ae018f](https://github.com/vitejs/vite/commit/1ae018f)), closes [#11493](https://github.com/vitejs/vite/issues/11493) [#11494](https://github.com/vitejs/vite/issues/11494)
* perf(build): disable rollup cache for builds (#11454) ([580ba7a](https://github.com/vitejs/vite/commit/580ba7a)), closes [#11454](https://github.com/vitejs/vite/issues/11454)
* perf(resolve): improve file existence check (#11436) ([4a12b89](https://github.com/vitejs/vite/commit/4a12b89)), closes [#11436](https://github.com/vitejs/vite/issues/11436)


### Bug Fixes

* fix: await bundle closing (#11873) ([1e6768d](https://github.com/vitejs/vite/commit/1e6768d)), closes [#11873](https://github.com/vitejs/vite/issues/11873)
* fix: make viteMetadata property of RenderedChunk optional (#11768) ([128f09e](https://github.com/vitejs/vite/commit/128f09e)), closes [#11768](https://github.com/vitejs/vite/issues/11768)
* fix: replace import.meta.hot with undefined in the production (#11317) ([73afe6d](https://github.com/vitejs/vite/commit/73afe6d)), closes [#11317](https://github.com/vitejs/vite/issues/11317)
* fix: update CJS interop error message (#11842) ([356ddfe](https://github.com/vitejs/vite/commit/356ddfe)), closes [#11842](https://github.com/vitejs/vite/issues/11842)
* fix(client): serve client sources next to deployed scripts (#11865) ([63bd261](https://github.com/vitejs/vite/commit/63bd261)), closes [#11865](https://github.com/vitejs/vite/issues/11865)
* fix(deps): update all non-major dependencies (#11846) ([5d55083](https://github.com/vitejs/vite/commit/5d55083)), closes [#11846](https://github.com/vitejs/vite/issues/11846)
* fix(esbuild): avoid polluting global namespace while minify is false (#11882) ([c895379](https://github.com/vitejs/vite/commit/c895379)), closes [#11882](https://github.com/vitejs/vite/issues/11882)
* fix: deep resolve side effects when glob does not contain / (#11807) ([f3a0c3b](https://github.com/vitejs/vite/commit/f3a0c3b)), closes [#11807](https://github.com/vitejs/vite/issues/11807)
* fix: duplicated sourceMappingURL for worker bundles (fix #11601) (#11602) ([5444781](https://github.com/vitejs/vite/commit/5444781)), closes [#11601](https://github.com/vitejs/vite/issues/11601) [#11602](https://github.com/vitejs/vite/issues/11602)
* fix: emit assets from SSR build (#11430) ([ffbdcdb](https://github.com/vitejs/vite/commit/ffbdcdb)), closes [#11430](https://github.com/vitejs/vite/issues/11430)
* fix: revert "load sourcemaps alongside modules (#11576)" (#11775) ([697dd00](https://github.com/vitejs/vite/commit/697dd00)), closes [#11576](https://github.com/vitejs/vite/issues/11576) [#11775](https://github.com/vitejs/vite/issues/11775)
* fix: scope tracking for shadowing variables in blocks (#11806) (#11811) ([568bdab](https://github.com/vitejs/vite/commit/568bdab)), closes [#11806](https://github.com/vitejs/vite/issues/11806) [#11811](https://github.com/vitejs/vite/issues/11811)
* fix(cli): exit 1 on ctrl+c (#11563) ([fb77411](https://github.com/vitejs/vite/commit/fb77411)), closes [#11563](https://github.com/vitejs/vite/issues/11563)
* fix(css): insert styles in the same position (#11763) ([d2f1381](https://github.com/vitejs/vite/commit/d2f1381)), closes [#11763](https://github.com/vitejs/vite/issues/11763)
* fix(esbuild): check server before reload tsconfig (#11747) ([c56b954](https://github.com/vitejs/vite/commit/c56b954)), closes [#11747](https://github.com/vitejs/vite/issues/11747)
* fix(hmr): hmr websocket failure for custom middleware mode with server.hmr.server (#11487) ([00919bb](https://github.com/vitejs/vite/commit/00919bb)), closes [#11487](https://github.com/vitejs/vite/issues/11487)
* fix(ssr): load sourcemaps alongside modules (fix: #3288) (#11576) ([dc05e97](https://github.com/vitejs/vite/commit/dc05e97)), closes [#3288](https://github.com/vitejs/vite/issues/3288) [#11576](https://github.com/vitejs/vite/issues/11576)
* refactor: upgrade resolve.exports (#11712) ([00a79ec](https://github.com/vitejs/vite/commit/00a79ec)), closes [#11712](https://github.com/vitejs/vite/issues/11712)
* fix: remove moment from force interop packages (#11502) ([b89ddd6](https://github.com/vitejs/vite/commit/b89ddd6)), closes [#11502](https://github.com/vitejs/vite/issues/11502)
* fix(css): fix stale css when reloading with hmr disabled (#10270) (#11506) ([e5807c4](https://github.com/vitejs/vite/commit/e5807c4)), closes [#10270](https://github.com/vitejs/vite/issues/10270) [#11506](https://github.com/vitejs/vite/issues/11506)
* fix(hmr): base default protocol on client source location (#11497) ([167753d](https://github.com/vitejs/vite/commit/167753d)), closes [#11497](https://github.com/vitejs/vite/issues/11497)
* fix(metadata): expose viteMetadata type (#11511) ([32dee3c](https://github.com/vitejs/vite/commit/32dee3c)), closes [#11511](https://github.com/vitejs/vite/issues/11511)
* fix(resolve): ensure exports has precedence over mainFields (cherry pick #11234) (#11595) ([691e432](https://github.com/vitejs/vite/commit/691e432)), closes [#11234](https://github.com/vitejs/vite/issues/11234) [#11595](https://github.com/vitejs/vite/issues/11595)
* fix(resolve): use only root package.json as exports source (#11259) ([b9afa6e](https://github.com/vitejs/vite/commit/b9afa6e)), closes [#11259](https://github.com/vitejs/vite/issues/11259)
* refactor(build): close rollup bundle directly (#11460) ([a802828](https://github.com/vitejs/vite/commit/a802828)), closes [#11460](https://github.com/vitejs/vite/issues/11460)


### Previous Changelogs


#### [4.1.0-beta.2](https://github.com/vitejs/vite/compare/v4.1.0-beta.1....v4.1.0-beta.2) (2023-02-01)

See [4.1.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.1.0-beta.2/packages/vite/CHANGELOG.md)


#### [4.1.0-beta.1](https://github.com/vitejs/vite/compare/v4.1.0-beta.0....v4.1.0-beta.1) (2023-01-26)

See [4.1.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.1.0-beta.1/packages/vite/CHANGELOG.md)


#### [4.1.0-beta.0](https://github.com/vitejs/vite/compare/v4.0.3....v4.1.0-beta.0) (2023-01-09)

See [4.1.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.1.0-beta.0/packages/vite/CHANGELOG.md)



## <small>4.0.4 (2023-01-03)</small>

* fix: importmap should insert before module preload link (#11492) ([25c64d7](https://github.com/vitejs/vite/commit/25c64d7)), closes [#11492](https://github.com/vitejs/vite/issues/11492)
* fix: server.host with ipv6 missed [] (fix #11466) (#11509) ([2c38bae](https://github.com/vitejs/vite/commit/2c38bae)), closes [#11466](https://github.com/vitejs/vite/issues/11466) [#11509](https://github.com/vitejs/vite/issues/11509)
* fix: stop considering parent URLs as public file (#11145) ([568a014](https://github.com/vitejs/vite/commit/568a014)), closes [#11145](https://github.com/vitejs/vite/issues/11145)
* fix(build): invalidate chunk hash when css changed (#11475) ([7a97a04](https://github.com/vitejs/vite/commit/7a97a04)), closes [#11475](https://github.com/vitejs/vite/issues/11475)
* fix(cli): ctrl+C no longer kills processes (#11434) (#11518) ([718fc1d](https://github.com/vitejs/vite/commit/718fc1d)), closes [#11434](https://github.com/vitejs/vite/issues/11434) [#11518](https://github.com/vitejs/vite/issues/11518)
* fix(cli): revert ctrl+C no longer kills processes (#11434) (#11518) (#11562) ([3748acb](https://github.com/vitejs/vite/commit/3748acb)), closes [#11434](https://github.com/vitejs/vite/issues/11434) [#11518](https://github.com/vitejs/vite/issues/11518) [#11562](https://github.com/vitejs/vite/issues/11562)
* fix(optimizer): check .vite/deps directory existence before removing (#11499) ([1b043f9](https://github.com/vitejs/vite/commit/1b043f9)), closes [#11499](https://github.com/vitejs/vite/issues/11499)
* fix(ssr): emit js sourcemaps for ssr builds (#11343) ([f12a1ab](https://github.com/vitejs/vite/commit/f12a1ab)), closes [#11343](https://github.com/vitejs/vite/issues/11343)
* chore: update license (#11476) ([3d346c0](https://github.com/vitejs/vite/commit/3d346c0)), closes [#11476](https://github.com/vitejs/vite/issues/11476)
* chore(deps): update dependency @rollup/plugin-json to v6 (#11553) ([3647d07](https://github.com/vitejs/vite/commit/3647d07)), closes [#11553](https://github.com/vitejs/vite/issues/11553)



## <small>4.0.3 (2022-12-21)</small>

* chore(deps): update dependency @rollup/plugin-commonjs to v24 (#11420) ([241db16](https://github.com/vitejs/vite/commit/241db16)), closes [#11420](https://github.com/vitejs/vite/issues/11420)
* chore(typo): fix typo (#11445) ([ed80ea5](https://github.com/vitejs/vite/commit/ed80ea5)), closes [#11445](https://github.com/vitejs/vite/issues/11445)
* fix(ssr): ignore module exports condition (#11409) ([d3c9c0b](https://github.com/vitejs/vite/commit/d3c9c0b)), closes [#11409](https://github.com/vitejs/vite/issues/11409)
* feat: allow import.meta.hot define override (#8944) ([857d578](https://github.com/vitejs/vite/commit/857d578)), closes [#8944](https://github.com/vitejs/vite/issues/8944)



## <small>4.0.2 (2022-12-18)</small>

* fix: fix the error message in the `toOutputFilePathWithoutRuntime` function (#11367) ([8820f75](https://github.com/vitejs/vite/commit/8820f75)), closes [#11367](https://github.com/vitejs/vite/issues/11367)
* fix: make `vite optimize` prebundle for dev (#11387) ([b4ced0f](https://github.com/vitejs/vite/commit/b4ced0f)), closes [#11387](https://github.com/vitejs/vite/issues/11387)
* fix: revert #11290 (#11412) ([6587d2f](https://github.com/vitejs/vite/commit/6587d2f)), closes [#11290](https://github.com/vitejs/vite/issues/11290) [#11412](https://github.com/vitejs/vite/issues/11412)
* fix: server and preview open fails to add slash before relative path (#11394) ([57276b7](https://github.com/vitejs/vite/commit/57276b7)), closes [#11394](https://github.com/vitejs/vite/issues/11394)
* fix: skip applescript when no Chromium browser found (fixes #11205) (#11406) ([274d1f3](https://github.com/vitejs/vite/commit/274d1f3)), closes [#11205](https://github.com/vitejs/vite/issues/11205) [#11406](https://github.com/vitejs/vite/issues/11406)
* fix(deps): update dependency ufo to v1 (#11372) ([4288300](https://github.com/vitejs/vite/commit/4288300)), closes [#11372](https://github.com/vitejs/vite/issues/11372)
* chore: typecheck create-vite (#11295) ([af86e5b](https://github.com/vitejs/vite/commit/af86e5b)), closes [#11295](https://github.com/vitejs/vite/issues/11295)
* chore(deps): update dependency convert-source-map to v2 (#10548) ([8dc6528](https://github.com/vitejs/vite/commit/8dc6528)), closes [#10548](https://github.com/vitejs/vite/issues/10548)
* chore(deps): update dependency mlly to v1 (#11370) ([9662d4d](https://github.com/vitejs/vite/commit/9662d4d)), closes [#11370](https://github.com/vitejs/vite/issues/11370)



## <small>4.0.1 (2022-12-12)</small>

* feat: show server url by pressing `u` (#11319) ([8c0bb7b](https://github.com/vitejs/vite/commit/8c0bb7b)), closes [#11319](https://github.com/vitejs/vite/issues/11319)
* feat(html): clickable error position for html parse error (#11334) ([2e15f3d](https://github.com/vitejs/vite/commit/2e15f3d)), closes [#11334](https://github.com/vitejs/vite/issues/11334)
* fix: ?inline warning for .css.js file (#11347) ([729fb1a](https://github.com/vitejs/vite/commit/729fb1a)), closes [#11347](https://github.com/vitejs/vite/issues/11347)
* fix: check if build exists so preview doesn't show 404s due to nonexistent build (#10564) ([0a1db8c](https://github.com/vitejs/vite/commit/0a1db8c)), closes [#10564](https://github.com/vitejs/vite/issues/10564)
* fix: derive `useDefineForClassFields` value from `tsconfig.compilerOptions.target` (fixes #10296) (# ([42976d8](https://github.com/vitejs/vite/commit/42976d8)), closes [#10296](https://github.com/vitejs/vite/issues/10296) [#11301](https://github.com/vitejs/vite/issues/11301)
* fix: preview fallback (#11312) ([cfedf9c](https://github.com/vitejs/vite/commit/cfedf9c)), closes [#11312](https://github.com/vitejs/vite/issues/11312)
* fix: respect base when using `/__open-in-editor` (#11337) ([8856c2e](https://github.com/vitejs/vite/commit/8856c2e)), closes [#11337](https://github.com/vitejs/vite/issues/11337)
* fix: wrongly resolve to optimized doppelganger (#11290) ([34fec41](https://github.com/vitejs/vite/commit/34fec41)), closes [#11290](https://github.com/vitejs/vite/issues/11290)
* fix(env): test NODE_ENV override before expand (#11309) ([d0a9281](https://github.com/vitejs/vite/commit/d0a9281)), closes [#11309](https://github.com/vitejs/vite/issues/11309)
* fix(preview): Revert #10564 - throw Error on missing outDir (#11335) ([3aaa0ea](https://github.com/vitejs/vite/commit/3aaa0ea)), closes [#10564](https://github.com/vitejs/vite/issues/10564) [#11335](https://github.com/vitejs/vite/issues/11335) [#10564](https://github.com/vitejs/vite/issues/10564)
* docs: fix banner image in CHANGELOG.md (#11336) ([45b66f4](https://github.com/vitejs/vite/commit/45b66f4)), closes [#11336](https://github.com/vitejs/vite/issues/11336)
* chore: enable `@typescript-eslint/ban-ts-comment` (#11326) ([e58a4f0](https://github.com/vitejs/vite/commit/e58a4f0)), closes [#11326](https://github.com/vitejs/vite/issues/11326)
* chore: fix format (#11311) ([9c2b1c0](https://github.com/vitejs/vite/commit/9c2b1c0)), closes [#11311](https://github.com/vitejs/vite/issues/11311)
* chore: update changelog release notes for 4.0 (#11285) ([83abd37](https://github.com/vitejs/vite/commit/83abd37)), closes [#11285](https://github.com/vitejs/vite/issues/11285)
* chore(deps): update all non-major dependencies (#11321) ([dcc0004](https://github.com/vitejs/vite/commit/dcc0004)), closes [#11321](https://github.com/vitejs/vite/issues/11321)
* chore(esbuild): add test for configuration overrides (#11267) ([f897b64](https://github.com/vitejs/vite/commit/f897b64)), closes [#11267](https://github.com/vitejs/vite/issues/11267)



## 4.0.0 (2022-12-09)

![Vite 4 Announcement Cover Image](https://vitejs.dev/og-image-announcing-vite4.png)

Read the announcement blog post: [Announcing Vite 4](https://vitejs.dev/blog/announcing-vite4)

Quick links:

- [Docs](https://vitejs.dev)
- [Migration Guide](https://vitejs.dev/guide/migration)

Docs in other languages:

- [简体中文](https://cn.vitejs.dev/)
- [日本語](https://ja.vitejs.dev/)
- [Español](https://es.vitejs.dev/)

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

* feat: add CLI keyboard shortcuts (#11228) ([87973f1](https://github.com/vitejs/vite/commit/87973f1)), closes [#11228](https://github.com/vitejs/vite/issues/11228)
* feat: export error message generator (#11155) ([493ba1e](https://github.com/vitejs/vite/commit/493ba1e)), closes [#11155](https://github.com/vitejs/vite/issues/11155)
* feat(node/plugins): esbuild options (#11049) ([735b98b](https://github.com/vitejs/vite/commit/735b98b)), closes [#11049](https://github.com/vitejs/vite/issues/11049)
* feat: improve the error message of `expand` (#11141) ([825c793](https://github.com/vitejs/vite/commit/825c793)), closes [#11141](https://github.com/vitejs/vite/issues/11141)
* feat: update @types/node to v18 (#11195) ([4ec9f53](https://github.com/vitejs/vite/commit/4ec9f53)), closes [#11195](https://github.com/vitejs/vite/issues/11195)
* feat(client)!: remove never implemented hot.decline (#11036) ([e257e3b](https://github.com/vitejs/vite/commit/e257e3b)), closes [#11036](https://github.com/vitejs/vite/issues/11036)
* feat!: support `safari14` by default for wider ES2020 compatibility (#9063) ([3cc65d7](https://github.com/vitejs/vite/commit/3cc65d7)), closes [#9063](https://github.com/vitejs/vite/issues/9063)
* feat!: support multiline values in env files (#10826) ([606e60d](https://github.com/vitejs/vite/commit/606e60d)), closes [#10826](https://github.com/vitejs/vite/issues/10826)
* feat(ssr)!: remove dedupe and mode support for CJS (#11101) ([3090564](https://github.com/vitejs/vite/commit/3090564)), closes [#11101](https://github.com/vitejs/vite/issues/11101)
* feat: align object interface for `transformIndexHtml` hook (#9669) ([1db52bf](https://github.com/vitejs/vite/commit/1db52bf)), closes [#9669](https://github.com/vitejs/vite/issues/9669)
* feat(build): cleaner logs output (#10895) ([7d24b5f](https://github.com/vitejs/vite/commit/7d24b5f)), closes [#10895](https://github.com/vitejs/vite/issues/10895)
* feat(css): deprecate css default export (#11094) ([01dee1b](https://github.com/vitejs/vite/commit/01dee1b)), closes [#11094](https://github.com/vitejs/vite/issues/11094)
* feat(optimizer): support patch-package (#10286) ([4fb7ad0](https://github.com/vitejs/vite/commit/4fb7ad0)), closes [#10286](https://github.com/vitejs/vite/issues/10286)
* feat(build): Use kB in build reporter (#10982) ([b57acfa](https://github.com/vitejs/vite/commit/b57acfa)), closes [#10982](https://github.com/vitejs/vite/issues/10982)
* feat(css): upgrade postcss-modules (#10987) ([892916d](https://github.com/vitejs/vite/commit/892916d)), closes [#10987](https://github.com/vitejs/vite/issues/10987)
* feat(hmr): invalidate message (#10946) ([0d73473](https://github.com/vitejs/vite/commit/0d73473)), closes [#10946](https://github.com/vitejs/vite/issues/10946)
* feat(client): expose hot.prune API (#11016) ([f40c18d](https://github.com/vitejs/vite/commit/f40c18d)), closes [#11016](https://github.com/vitejs/vite/issues/11016)
* feat(hmr): deduplicate paths and join them with commas (#10891) ([967299a](https://github.com/vitejs/vite/commit/967299a)), closes [#10891](https://github.com/vitejs/vite/issues/10891)
* feat: base without trailing slash (#10723) ([8f87282](https://github.com/vitejs/vite/commit/8f87282)), closes [#10723](https://github.com/vitejs/vite/issues/10723)
* feat: handle static assets in case-sensitive manner (#10475) ([c1368c3](https://github.com/vitejs/vite/commit/c1368c3)), closes [#10475](https://github.com/vitejs/vite/issues/10475)
* feat(cli): build --profile (#10719) ([9c808cd](https://github.com/vitejs/vite/commit/9c808cd)), closes [#10719](https://github.com/vitejs/vite/issues/10719)
* feat(env): support dotenv-expand to contains process env (#10370) ([d5fe92c](https://github.com/vitejs/vite/commit/d5fe92c)), closes [#10370](https://github.com/vitejs/vite/issues/10370)
* feat!: set esbuild default charset to utf8 (#10753) ([4caf4b6](https://github.com/vitejs/vite/commit/4caf4b6)), closes [#10753](https://github.com/vitejs/vite/issues/10753)
* feat: rollup 3 (#9870) ([beb7166](https://github.com/vitejs/vite/commit/beb7166)), closes [#9870](https://github.com/vitejs/vite/issues/9870)


### Bug Fixes

* fix: add `\0` to virtual files id (#11261) ([02cdfa9](https://github.com/vitejs/vite/commit/02cdfa9)), closes [#11261](https://github.com/vitejs/vite/issues/11261)
* fix: skip shortcuts on non-tty stdin (#11263) ([9602686](https://github.com/vitejs/vite/commit/9602686)), closes [#11263](https://github.com/vitejs/vite/issues/11263)
* fix(ssr): skip rewriting stack trace if it's already rewritten (fixes #11037) (#11070) ([feb8ce0](https://github.com/vitejs/vite/commit/feb8ce0)), closes [#11037](https://github.com/vitejs/vite/issues/11037) [#11070](https://github.com/vitejs/vite/issues/11070)
* refactor(optimizer): await depsOptimizer.scanProcessing (#11251) ([fa64c8e](https://github.com/vitejs/vite/commit/fa64c8e)), closes [#11251](https://github.com/vitejs/vite/issues/11251)
* fix: improve CLI shortcuts help display (#11247) ([bb235b2](https://github.com/vitejs/vite/commit/bb235b2)), closes [#11247](https://github.com/vitejs/vite/issues/11247)
* fix: less promises for scanning and await with allSettled (#11245) ([45b170e](https://github.com/vitejs/vite/commit/45b170e)), closes [#11245](https://github.com/vitejs/vite/issues/11245)
* fix(optimizer): escape entrypoints when running scanner (#11250) ([b61894e](https://github.com/vitejs/vite/commit/b61894e)), closes [#11250](https://github.com/vitejs/vite/issues/11250)
* fix: await scanner (#11242) ([52a6732](https://github.com/vitejs/vite/commit/52a6732)), closes [#11242](https://github.com/vitejs/vite/issues/11242)
* fix(css): fix css lang regex (#11237) ([a55d0b3](https://github.com/vitejs/vite/commit/a55d0b3)), closes [#11237](https://github.com/vitejs/vite/issues/11237)
* fix: don't print urls on restart with default port (#11230) ([5aaecb6](https://github.com/vitejs/vite/commit/5aaecb6)), closes [#11230](https://github.com/vitejs/vite/issues/11230)
* fix: serialize bundleWorkerEntry (#11218) ([306bed0](https://github.com/vitejs/vite/commit/306bed0)), closes [#11218](https://github.com/vitejs/vite/issues/11218)
* fix(config): resolve dynamic import as esm (#11220) ([f8c1ed0](https://github.com/vitejs/vite/commit/f8c1ed0)), closes [#11220](https://github.com/vitejs/vite/issues/11220)
* fix(env): prevent env expand on process.env (#11213) ([d4a1e2b](https://github.com/vitejs/vite/commit/d4a1e2b)), closes [#11213](https://github.com/vitejs/vite/issues/11213)
* fix: add type for function localsConvention value (#11152) ([c9274b4](https://github.com/vitejs/vite/commit/c9274b4)), closes [#11152](https://github.com/vitejs/vite/issues/11152)
* fix: cacheDir should be ignored from watch (#10242) ([75dbca2](https://github.com/vitejs/vite/commit/75dbca2)), closes [#10242](https://github.com/vitejs/vite/issues/10242)
* fix: don't check .yarn/patches for computing dependencies hash (#11168) ([65bcccf](https://github.com/vitejs/vite/commit/65bcccf)), closes [#11168](https://github.com/vitejs/vite/issues/11168)
* fix: formatError() outside rollup context (#11156) ([2aee2eb](https://github.com/vitejs/vite/commit/2aee2eb)), closes [#11156](https://github.com/vitejs/vite/issues/11156)
* fix: Revert "fix: missing js sourcemaps with rewritten imports broke debugging (#7767) (#9476)" (#11 ([fdc6f3a](https://github.com/vitejs/vite/commit/fdc6f3a)), closes [#7767](https://github.com/vitejs/vite/issues/7767) [#9476](https://github.com/vitejs/vite/issues/9476) [#11144](https://github.com/vitejs/vite/issues/11144)
* fix: Dev SSR dep optimization + respect optimizeDeps.include (#11123) ([515caa5](https://github.com/vitejs/vite/commit/515caa5)), closes [#11123](https://github.com/vitejs/vite/issues/11123)
* fix: export preprocessCSS in CJS (#11067) ([793255d](https://github.com/vitejs/vite/commit/793255d)), closes [#11067](https://github.com/vitejs/vite/issues/11067)
* fix: glob import parsing (#10949) (#11056) ([ac2cfd6](https://github.com/vitejs/vite/commit/ac2cfd6)), closes [#10949](https://github.com/vitejs/vite/issues/10949) [#11056](https://github.com/vitejs/vite/issues/11056)
* fix: import.meta.env and process.env undefined variable replacement (fix #8663) (#10958) ([3e0cd3d](https://github.com/vitejs/vite/commit/3e0cd3d)), closes [#8663](https://github.com/vitejs/vite/issues/8663) [#10958](https://github.com/vitejs/vite/issues/10958)
* fix: missing js sourcemaps with rewritten imports broke debugging (#7767) (#9476) ([3fa96f6](https://github.com/vitejs/vite/commit/3fa96f6)), closes [#7767](https://github.com/vitejs/vite/issues/7767) [#9476](https://github.com/vitejs/vite/issues/9476)
* fix: preserve default export from externalized packages (fixes #10258) (#10406) ([88b001b](https://github.com/vitejs/vite/commit/88b001b)), closes [#10258](https://github.com/vitejs/vite/issues/10258) [#10406](https://github.com/vitejs/vite/issues/10406)
* fix: reset global regex before match (#11132) ([db8df14](https://github.com/vitejs/vite/commit/db8df14)), closes [#11132](https://github.com/vitejs/vite/issues/11132)
* fix(css): handle environment with browser globals (#11079) ([e92d025](https://github.com/vitejs/vite/commit/e92d025)), closes [#11079](https://github.com/vitejs/vite/issues/11079)
* fix(deps): update all non-major dependencies (#11091) ([073a4bf](https://github.com/vitejs/vite/commit/073a4bf)), closes [#11091](https://github.com/vitejs/vite/issues/11091)
* fix(esbuild): handle inline sourcemap option (#11120) ([4c85c0a](https://github.com/vitejs/vite/commit/4c85c0a)), closes [#11120](https://github.com/vitejs/vite/issues/11120)
* fix(importGlob): don't warn when CSS default import is not used (#11121) ([97f8b4d](https://github.com/vitejs/vite/commit/97f8b4d)), closes [#11121](https://github.com/vitejs/vite/issues/11121)
* fix(importGlob): preserve line count for sourcemap (#11122) ([14980a1](https://github.com/vitejs/vite/commit/14980a1)), closes [#11122](https://github.com/vitejs/vite/issues/11122)
* fix(importGlob): warn on default import css (#11103) ([fc0d9e3](https://github.com/vitejs/vite/commit/fc0d9e3)), closes [#11103](https://github.com/vitejs/vite/issues/11103)
* fix(plugin-vue): support scss/sass/less... hmr on custom template languages (fix #10677) (#10844) ([d413848](https://github.com/vitejs/vite/commit/d413848)), closes [#10677](https://github.com/vitejs/vite/issues/10677) [#10844](https://github.com/vitejs/vite/issues/10844)
* fix(ssr): preserve require for external node (#11057) ([1ec0176](https://github.com/vitejs/vite/commit/1ec0176)), closes [#11057](https://github.com/vitejs/vite/issues/11057)
* fix(worker): disable build reporter plugin when bundling worker (#11058) ([7b72069](https://github.com/vitejs/vite/commit/7b72069)), closes [#11058](https://github.com/vitejs/vite/issues/11058)
* fix!: make `NODE_ENV` more predictable (#10996) ([8148af7](https://github.com/vitejs/vite/commit/8148af7)), closes [#10996](https://github.com/vitejs/vite/issues/10996)
* fix(config)!: support development build (#11045) ([8b3d656](https://github.com/vitejs/vite/commit/8b3d656)), closes [#11045](https://github.com/vitejs/vite/issues/11045)
* refactor: use function to eval worker and glob options (#10999) ([f4c1264](https://github.com/vitejs/vite/commit/f4c1264)), closes [#10999](https://github.com/vitejs/vite/issues/10999)
* refactor(client): simplify fetchUpdate code (#11004) ([f777b55](https://github.com/vitejs/vite/commit/f777b55)), closes [#11004](https://github.com/vitejs/vite/issues/11004)
* fix(html): transform relative path with long base in /index.html (#10990) ([752740c](https://github.com/vitejs/vite/commit/752740c)), closes [#10990](https://github.com/vitejs/vite/issues/10990)
* fix(mpa): support mpa fallback (#10985) ([61165f0](https://github.com/vitejs/vite/commit/61165f0)), closes [#10985](https://github.com/vitejs/vite/issues/10985)
* feat: align default chunk and asset file names with rollup (#10927) ([cc2adb3](https://github.com/vitejs/vite/commit/cc2adb3)), closes [#10927](https://github.com/vitejs/vite/issues/10927)
* fix: make `addWatchFile()` work (fix #7024) (#9723) ([34db08b](https://github.com/vitejs/vite/commit/34db08b)), closes [#7024](https://github.com/vitejs/vite/issues/7024) [#9723](https://github.com/vitejs/vite/issues/9723)
* fix(config): exclude config.assetsInclude empty array (#10941) ([18c71dc](https://github.com/vitejs/vite/commit/18c71dc)), closes [#10941](https://github.com/vitejs/vite/issues/10941)
* fix(ssr): skip optional peer dep resolve (#10593) ([0a69985](https://github.com/vitejs/vite/commit/0a69985)), closes [#10593](https://github.com/vitejs/vite/issues/10593)
* perf: regexp perf issues, refactor regexp stylistic issues (#10905) ([fc007df](https://github.com/vitejs/vite/commit/fc007df)), closes [#10905](https://github.com/vitejs/vite/issues/10905)
* refactor: move CSS emitFile logic closer to rollup (#10909) ([92a206b](https://github.com/vitejs/vite/commit/92a206b)), closes [#10909](https://github.com/vitejs/vite/issues/10909)
* refactor: use rollup hashing when emitting assets (#10878) ([78c77be](https://github.com/vitejs/vite/commit/78c77be)), closes [#10878](https://github.com/vitejs/vite/issues/10878)
* fix: don't throw on malformed URLs (#10901) ([feb9b10](https://github.com/vitejs/vite/commit/feb9b10)), closes [#10901](https://github.com/vitejs/vite/issues/10901)
* fix: gracefully handle forbidden filesystem access (#10793) ([92637a2](https://github.com/vitejs/vite/commit/92637a2)), closes [#10793](https://github.com/vitejs/vite/issues/10793)
* fix(types): remove `null` from `CSSModulesOptions.localsConvention` (#10904) ([a9978dd](https://github.com/vitejs/vite/commit/a9978dd)), closes [#10904](https://github.com/vitejs/vite/issues/10904)
* refactor(types)!: remove facade type files (#10903) ([a309058](https://github.com/vitejs/vite/commit/a309058)), closes [#10903](https://github.com/vitejs/vite/issues/10903)
* fix: inconsistent handling of non-ASCII `base` in `resolveConfig` and dev server (#10247) ([16e4123](https://github.com/vitejs/vite/commit/16e4123)), closes [#10247](https://github.com/vitejs/vite/issues/10247)
* fix: prevent cache on optional package resolve (#10812) ([c599a2e](https://github.com/vitejs/vite/commit/c599a2e)), closes [#10812](https://github.com/vitejs/vite/issues/10812)
* fix: relocated logger to respect config. (#10787) ([52e64eb](https://github.com/vitejs/vite/commit/52e64eb)), closes [#10787](https://github.com/vitejs/vite/issues/10787)
* fix: throw missing name error only when 'umd' or 'iife' are used (#9886) ([b8aa825](https://github.com/vitejs/vite/commit/b8aa825)), closes [#9886](https://github.com/vitejs/vite/issues/9886)
* fix(deps): update all non-major dependencies (#10804) ([f686afa](https://github.com/vitejs/vite/commit/f686afa)), closes [#10804](https://github.com/vitejs/vite/issues/10804)
* fix(ssr): improve missing file error (#10880) ([5451a34](https://github.com/vitejs/vite/commit/5451a34)), closes [#10880](https://github.com/vitejs/vite/issues/10880)


### Previous Changelogs


#### [4.0.0-beta.7](https://github.com/vitejs/vite/compare/v4.0.0-beta.6....v4.0.0-beta.7) (2022-12-08)

See [4.0.0-beta.7 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.6](https://github.com/vitejs/vite/compare/v4.0.0-beta.5....v4.0.0-beta.6) (2022-12-08)

See [4.0.0-beta.6 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.5](https://github.com/vitejs/vite/compare/v4.0.0-beta.4....v4.0.0-beta.5) (2022-12-08)

See [4.0.0-beta.5 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.4](https://github.com/vitejs/vite/compare/v4.0.0-beta.3....v4.0.0-beta.4) (2022-12-07)

See [4.0.0-beta.4 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.3](https://github.com/vitejs/vite/compare/v4.0.0-beta.2....v4.0.0-beta.3) (2022-12-07)

See [4.0.0-beta.3 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.2](https://github.com/vitejs/vite/compare/v4.0.0-beta.1....v4.0.0-beta.2) (2022-12-07)

See [4.0.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.1](https://github.com/vitejs/vite/compare/v4.0.0-beta.0....v4.0.0-beta.1) (2022-12-06)

See [4.0.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-beta.0](https://github.com/vitejs/vite/compare/v4.0.0-alpha.6....v4.0.0-beta.0) (2022-12-05)

See [4.0.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v4.0.0-beta.0/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.6](https://github.com/vitejs/vite/compare/v4.0.0-alpha.5....v4.0.0-alpha.6) (2022-11-30)

See [4.0.0-alpha.6 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.6/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.5](https://github.com/vitejs/vite/compare/v4.0.0-alpha.5....v4.0.0-alpha.5) (2022-11-22)

See [4.0.0-alpha.5 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.5/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.4](https://github.com/vitejs/vite/compare/v4.0.0-alpha.3....v4.0.0-alpha.4) (2022-11-17)

See [4.0.0-alpha.4 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.4/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.3](https://github.com/vitejs/vite/compare/v4.0.0-alpha.2....v4.0.0-alpha.3) (2022-11-15)

See [4.0.0-alpha.3 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.3/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.2](https://github.com/vitejs/vite/compare/v4.0.0-alpha.1....v4.0.0-alpha.2) (2022-11-13)

See [4.0.0-alpha.2 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.2/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.1](https://github.com/vitejs/vite/compare/v4.0.0-alpha.0....v4.0.0-alpha.1) (2022-11-12)

See [4.0.0-alpha.1 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.1/packages/vite/CHANGELOG.md)


#### [4.0.0-alpha.0](https://github.com/vitejs/vite/compare/v3.2.5....v4.0.0-alpha.0) (2022-11-07)

See [4.0.0-alpha.0 changelog](https://github.com/vitejs/vite/blob/v4.0.0-alpha.0/packages/vite/CHANGELOG.md)



## <small>3.2.6 (2023-04-18)</small>

 * fix: escape msg in render restricted error html, backport (#12889) (#12892) ([b48ac2a](https://github.com/vitejs/vite/commit/b48ac2a)), closes [#12889](https://github.com/vitejs/vite/issues/12889) [#12892](https://github.com/vitejs/vite/issues/12892)


 
## <small>3.2.5 (2022-12-05)</small>

* chore: cherry pick more v4 bug fixes to v3 (#11189) ([eba9b42](https://github.com/vitejs/vite/commit/eba9b42)), closes [#11189](https://github.com/vitejs/vite/issues/11189) [#10949](https://github.com/vitejs/vite/issues/10949) [#11056](https://github.com/vitejs/vite/issues/11056) [#8663](https://github.com/vitejs/vite/issues/8663) [#10958](https://github.com/vitejs/vite/issues/10958) [#11120](https://github.com/vitejs/vite/issues/11120) [#11122](https://github.com/vitejs/vite/issues/11122) [#11123](https://github.com/vitejs/vite/issues/11123) [#11132](https://github.com/vitejs/vite/issues/11132)
* chore: cherry pick v4 bug fix to v3 (#11110) ([c93a526](https://github.com/vitejs/vite/commit/c93a526)), closes [#11110](https://github.com/vitejs/vite/issues/11110) [#10941](https://github.com/vitejs/vite/issues/10941) [#10987](https://github.com/vitejs/vite/issues/10987) [#10985](https://github.com/vitejs/vite/issues/10985) [#11067](https://github.com/vitejs/vite/issues/11067)
* fix: relocated logger to respect config. (#10787) (#10967) ([bc3b5a9](https://github.com/vitejs/vite/commit/bc3b5a9)), closes [#10787](https://github.com/vitejs/vite/issues/10787) [#10967](https://github.com/vitejs/vite/issues/10967)



## <small>3.2.4 (2022-11-15)</small>

* fix: prevent cache on optional package resolve (v3) (#10812) (#10845) ([3ba45b9](https://github.com/vitejs/vite/commit/3ba45b9)), closes [#10812](https://github.com/vitejs/vite/issues/10812) [#10845](https://github.com/vitejs/vite/issues/10845)
* fix(ssr): skip optional peer dep resolve (v3) (#10593) (#10931) ([7f59dcf](https://github.com/vitejs/vite/commit/7f59dcf)), closes [#10593](https://github.com/vitejs/vite/issues/10593) [#10931](https://github.com/vitejs/vite/issues/10931) [#10593](https://github.com/vitejs/vite/issues/10593)



## <small>3.2.3 (2022-11-07)</small>

* refactor: change style.innerHTML to style.textContent (#10801) ([8ea71b4](https://github.com/vitejs/vite/commit/8ea71b4)), closes [#10801](https://github.com/vitejs/vite/issues/10801)
* fix: add `@types/node` as an optional peer dependency (#10757) ([57916a4](https://github.com/vitejs/vite/commit/57916a4)), closes [#10757](https://github.com/vitejs/vite/issues/10757)
* fix: transform import.meta.glob when scan JS/TS #10634 (#10635) ([c53ffec](https://github.com/vitejs/vite/commit/c53ffec)), closes [#10634](https://github.com/vitejs/vite/issues/10634) [#10635](https://github.com/vitejs/vite/issues/10635)
* fix(css): url() with variable in sass/less (fixes #3644, #7651) (#10741) ([fa2e47f](https://github.com/vitejs/vite/commit/fa2e47f)), closes [#3644](https://github.com/vitejs/vite/issues/3644) [#7651](https://github.com/vitejs/vite/issues/7651) [#10741](https://github.com/vitejs/vite/issues/10741)
* feat: add `vite:afterUpdate` event (#9810) ([1f57f84](https://github.com/vitejs/vite/commit/1f57f84)), closes [#9810](https://github.com/vitejs/vite/issues/9810)
* perf: improve `multilineCommentsRE` regex (fix #10689) (#10751) ([51ed059](https://github.com/vitejs/vite/commit/51ed059)), closes [#10689](https://github.com/vitejs/vite/issues/10689) [#10751](https://github.com/vitejs/vite/issues/10751)
* perf: Use only one ps exec to find a Chromium browser opened on Mac OS (#10588) ([f199e90](https://github.com/vitejs/vite/commit/f199e90)), closes [#10588](https://github.com/vitejs/vite/issues/10588)
* chore: fix dev build replacing undefined (#10740) ([1358a3c](https://github.com/vitejs/vite/commit/1358a3c)), closes [#10740](https://github.com/vitejs/vite/issues/10740)
* chore: remove non used type definitions (#10738) ([ee8c7a6](https://github.com/vitejs/vite/commit/ee8c7a6)), closes [#10738](https://github.com/vitejs/vite/issues/10738)
* chore(deps): update dependency @rollup/plugin-commonjs to v23 (#10611) ([cc4be70](https://github.com/vitejs/vite/commit/cc4be70)), closes [#10611](https://github.com/vitejs/vite/issues/10611)
* chore(deps): update dependency @rollup/plugin-dynamic-import-vars to v2 (#10726) ([326f782](https://github.com/vitejs/vite/commit/326f782)), closes [#10726](https://github.com/vitejs/vite/issues/10726)



## <small>3.2.2 (2022-10-31)</small>

* chore: remove src/client from package (#10703) ([816842e](https://github.com/vitejs/vite/commit/816842e)), closes [#10703](https://github.com/vitejs/vite/issues/10703)
* chore(deps): update all non-major dependencies (#10725) ([22cfad8](https://github.com/vitejs/vite/commit/22cfad8)), closes [#10725](https://github.com/vitejs/vite/issues/10725)
* fix: remove loaded input sourcemap (fixes #8411) (#10705) ([eb50e3a](https://github.com/vitejs/vite/commit/eb50e3a)), closes [#8411](https://github.com/vitejs/vite/issues/8411) [#10705](https://github.com/vitejs/vite/issues/10705)
* fix: tsconfig `jsx` overrides esbuild options, reverts #10374 (#10714) ([aacf6a4](https://github.com/vitejs/vite/commit/aacf6a4)), closes [#10374](https://github.com/vitejs/vite/issues/10374) [#10714](https://github.com/vitejs/vite/issues/10714)
* docs(changelog): fix broken url (#10692) ([f937ccc](https://github.com/vitejs/vite/commit/f937ccc)), closes [#10692](https://github.com/vitejs/vite/issues/10692)



## <small>3.2.1 (2022-10-28)</small>

* fix: prioritize existing env over .env (fixes #10676) (#10684) ([e2ea6af](https://github.com/vitejs/vite/commit/e2ea6af)), closes [#10676](https://github.com/vitejs/vite/issues/10676) [#10684](https://github.com/vitejs/vite/issues/10684)
* fix: remove picomatch type import (fixes #10656) (#10678) ([1128b4d](https://github.com/vitejs/vite/commit/1128b4d)), closes [#10656](https://github.com/vitejs/vite/issues/10656) [#10678](https://github.com/vitejs/vite/issues/10678)
* fix(config): resolve externalized specifier with internal resolver (#10683) ([b15d21c](https://github.com/vitejs/vite/commit/b15d21c))
* feat: Add support for imba in html scripts (#10679) ([b823fd6](https://github.com/vitejs/vite/commit/b823fd6)), closes [#10679](https://github.com/vitejs/vite/issues/10679)
* chore: join URL segments more safely (#10590) ([675bf07](https://github.com/vitejs/vite/commit/675bf07)), closes [#10590](https://github.com/vitejs/vite/issues/10590)
* chore: update changelog for 3.2 (#10646) ([f787a60](https://github.com/vitejs/vite/commit/f787a60)), closes [#10646](https://github.com/vitejs/vite/issues/10646)



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
Check out the PR [#7047](https://github.com/vitejs/vite/issues/7047), and the [`build.lib` config docs](https://main.vitejs.dev/config/build-options.html#build-lib)

#### `build.modulePreload` options

Vite now allows filtering and modifying module preload dependencies for each entry and async chunk. [`experimental.renderBuiltUrl`](https://vitejs.dev/guide/build.html#advanced-base-options) will also get called for preload asset paths. And `build.modulePreload.resolveDependencies` will be called both for JS dynamic imports preload lists and also for HTML preload lists for chunks imported from entry HTML files. Refer to the PR for more context [#9938](https://github.com/vitejs/vite/issues/9938) and check out the [modulePreload config docs](https://vitejs.dev/config/build-options.html#build-modulepreload). Note: `build.modulePreloadPolyfill` is now deprecated, please migrate to `build.modulePreload.polyfill`.

#### Include Duplicate Assets in the Manifest

Laravel and other backends integrations will now get entries for every asset file, even if they have been de-duplicated. See [#9928](https://github.com/vitejs/vite/issues/9928) for more information.

#### Customizable ErrorOverlay

You can now customize the ErrorOverlay by using [css parts](https://developer.mozilla.org/en-US/docs/Web/CSS/::part). Check out the PR for more details: [#10234](https://github.com/vitejs/vite/issues/10234).
  
### Features

* feat(build): experimental copyPublicDir option (#10550) ([4f4a39f](https://github.com/vitejs/vite/commit/4f4a39f)), closes [#10550](https://github.com/vitejs/vite/issues/10550)
* feat(css): export preprocessCSS API (#10429) ([177b427](https://github.com/vitejs/vite/commit/177b427)), closes [#10429](https://github.com/vitejs/vite/issues/10429)
* feat(preview): support outDir option (#10418) ([15b90b3](https://github.com/vitejs/vite/commit/15b90b3)), closes [#10418](https://github.com/vitejs/vite/issues/10418)
* feat: include line and column in error format (#10529) ([d806c4a](https://github.com/vitejs/vite/commit/d806c4a)), closes [#10529](https://github.com/vitejs/vite/issues/10529)
* feat: reuse opening tab in chromium browsers when start dev server (#10485) ([1a2e7a8](https://github.com/vitejs/vite/commit/1a2e7a8)), closes [#10485](https://github.com/vitejs/vite/issues/10485)
* feat: update esbuild compilation affecting fields (#10374) ([f542727](https://github.com/vitejs/vite/commit/f542727)), closes [#10374](https://github.com/vitejs/vite/issues/10374)
* feat(proxy): Include URL of request in proxy errors (#10508) ([27e2832](https://github.com/vitejs/vite/commit/27e2832)), closes [#10508](https://github.com/vitejs/vite/issues/10508)
* refactor: delete dependent pre built proxy modules (#10427) ([b3b388d](https://github.com/vitejs/vite/commit/b3b388d)), closes [#10427](https://github.com/vitejs/vite/issues/10427)
* feat(server): invalidate module with hmr (#10333) ([8328011](https://github.com/vitejs/vite/commit/8328011)), closes [#10333](https://github.com/vitejs/vite/issues/10333)
* feat: build.modulePreload options (#9938) ([e223f84](https://github.com/vitejs/vite/commit/e223f84)), closes [#9938](https://github.com/vitejs/vite/issues/9938)
* feat: customize ErrorOverlay (#10234) ([fe4dc8d](https://github.com/vitejs/vite/commit/fe4dc8d)), closes [#10234](https://github.com/vitejs/vite/issues/10234)
* feat: dynamic import support ?url and ?worker (#8261) ([0cb01ca](https://github.com/vitejs/vite/commit/0cb01ca)), closes [#8261](https://github.com/vitejs/vite/issues/8261)
* feat: include duplicate assets in the manifest (#9928) ([42ecf37](https://github.com/vitejs/vite/commit/42ecf37)), closes [#9928](https://github.com/vitejs/vite/issues/9928)
* feat: support import.meta.hot.invalidate (#10244) ([fb8ab16](https://github.com/vitejs/vite/commit/fb8ab16)), closes [#10244](https://github.com/vitejs/vite/issues/10244)
* feat: support postcss sugarss (#6705) ([8ede2f1](https://github.com/vitejs/vite/commit/8ede2f1)), closes [#6705](https://github.com/vitejs/vite/issues/6705)
* feat(assets): allow `new URL` to resolve package assets (#7837) ([bafccf5](https://github.com/vitejs/vite/commit/bafccf5)), closes [#7837](https://github.com/vitejs/vite/issues/7837)
* feat(client): add data-vite-dev-id attribute to style elements (#10080) ([ea09fde](https://github.com/vitejs/vite/commit/ea09fde)), closes [#10080](https://github.com/vitejs/vite/issues/10080)
* feat(lib): allow multiple entries (#7047) ([65a0fad](https://github.com/vitejs/vite/commit/65a0fad)), closes [#7047](https://github.com/vitejs/vite/issues/7047)
* feat(optimizer): Support bun lockfile format (#10288) ([931d69b](https://github.com/vitejs/vite/commit/931d69b)), closes [#10288](https://github.com/vitejs/vite/issues/10288)
* refactor(types): bundle client types (#9966) ([da632bf](https://github.com/vitejs/vite/commit/da632bf)), closes [#9966](https://github.com/vitejs/vite/issues/9966)
* refactor(types): simplify type exports (#10243) ([291174d](https://github.com/vitejs/vite/commit/291174d)), closes [#10243](https://github.com/vitejs/vite/issues/10243)
* perf: cache compiled glob for `server.fs.deny` (#10044) ([df560b0](https://github.com/vitejs/vite/commit/df560b0)), closes [#10044](https://github.com/vitejs/vite/issues/10044)

### Bug Fixes

* fix: add a warning if css urls not exist during build time (fix #9800) (#10331) ([9f268da](https://github.com/vitejs/vite/commit/9f268da)), closes [#9800](https://github.com/vitejs/vite/issues/9800) [#10331](https://github.com/vitejs/vite/issues/10331)
* fix: increase error overlay z-index (#10603) ([1157941](https://github.com/vitejs/vite/commit/1157941)), closes [#10603](https://github.com/vitejs/vite/issues/10603)
* fix: revert es-module-lexer version (#10614) ([cffe5c9](https://github.com/vitejs/vite/commit/cffe5c9)), closes [#10614](https://github.com/vitejs/vite/issues/10614)
* fix: when the file path is an absolute path, parsing causes parameter loss (#10449) ([df86990](https://github.com/vitejs/vite/commit/df86990)), closes [#10449](https://github.com/vitejs/vite/issues/10449)
* fix(config): resolve build options with fallback (#10645) ([f7021e3](https://github.com/vitejs/vite/commit/f7021e3)), closes [#10645](https://github.com/vitejs/vite/issues/10645)
* fix(deps): update all non-major dependencies (#10610) ([bb95467](https://github.com/vitejs/vite/commit/bb95467)), closes [#10610](https://github.com/vitejs/vite/issues/10610)
* fix(hmr): cannot reload after missing import on server startup (#9534) (#10602) ([ee7c28a](https://github.com/vitejs/vite/commit/ee7c28a)), closes [#9534](https://github.com/vitejs/vite/issues/9534) [#10602](https://github.com/vitejs/vite/issues/10602)
* fix(css): strip BOM (fixes #10043) (#10577) ([e0463bd](https://github.com/vitejs/vite/commit/e0463bd)), closes [#10043](https://github.com/vitejs/vite/issues/10043) [#10577](https://github.com/vitejs/vite/issues/10577)
* fix(ssr): resolve with isRequire true (#10569) ([7b81210](https://github.com/vitejs/vite/commit/7b81210)), closes [#10569](https://github.com/vitejs/vite/issues/10569)
* fix: prefer exports when resolving (#10371) ([3259006](https://github.com/vitejs/vite/commit/3259006)), closes [#10371](https://github.com/vitejs/vite/issues/10371)
* fix(config): partial deno support (#10446) ([c4489ea](https://github.com/vitejs/vite/commit/c4489ea)), closes [#10446](https://github.com/vitejs/vite/issues/10446)
* fix(config): skip resolve builtin modules (#10420) ([ecba3f8](https://github.com/vitejs/vite/commit/ecba3f8)), closes [#10420](https://github.com/vitejs/vite/issues/10420)
* fix(ssr): handle parallel hookNodeResolve (#10401) ([1a961d9](https://github.com/vitejs/vite/commit/1a961d9)), closes [#10401](https://github.com/vitejs/vite/issues/10401)
* fix(cli): when the user enters the same command (#10474) ([2326f4a](https://github.com/vitejs/vite/commit/2326f4a)), closes [#10474](https://github.com/vitejs/vite/issues/10474)
* fix(config): don't use module condition (`import.meta.resolve`) (fixes #10430) (#10528) ([64f19b9](https://github.com/vitejs/vite/commit/64f19b9)), closes [#10430](https://github.com/vitejs/vite/issues/10430) [#10528](https://github.com/vitejs/vite/issues/10528)
* fix(css): remove `?direct` in id for postcss process (#10514) ([67e7bf2](https://github.com/vitejs/vite/commit/67e7bf2)), closes [#10514](https://github.com/vitejs/vite/issues/10514)
* fix(html): allow self closing on non-void elements (#10478) ([29292af](https://github.com/vitejs/vite/commit/29292af)), closes [#10478](https://github.com/vitejs/vite/issues/10478)
* fix(legacy): restore entry chunk CSS inlining, reverts #9761 (#10496) ([9cc808e](https://github.com/vitejs/vite/commit/9cc808e)), closes [#9761](https://github.com/vitejs/vite/issues/9761) [#10496](https://github.com/vitejs/vite/issues/10496)
* chore: simplify filter plugin code (#10459) ([5d9b810](https://github.com/vitejs/vite/commit/5d9b810)), closes [#10459](https://github.com/vitejs/vite/issues/10459)
* chore(deps): update all non-major dependencies (#10488) ([15aa827](https://github.com/vitejs/vite/commit/15aa827)), closes [#10488](https://github.com/vitejs/vite/issues/10488)
* chore: update magic-string (#10364) ([23c9259](https://github.com/vitejs/vite/commit/23c9259)), closes [#10364](https://github.com/vitejs/vite/issues/10364)
* chore(deps): update all non-major dependencies (#10393) ([f519423](https://github.com/vitejs/vite/commit/f519423)), closes [#10393](https://github.com/vitejs/vite/issues/10393)
* chore(deps): update dependency @rollup/plugin-alias to v4 (#10394) ([e2b4c8f](https://github.com/vitejs/vite/commit/e2b4c8f)), closes [#10394](https://github.com/vitejs/vite/issues/10394)
* feat(lib): cjs instead of umd as default format for multiple entries (#10315) ([07d3fbd](https://github.com/vitejs/vite/commit/07d3fbd)), closes [#10315](https://github.com/vitejs/vite/issues/10315)
* fix: make client type work with `moduleResolution=node16` (#10375) ([8c4df1f](https://github.com/vitejs/vite/commit/8c4df1f)), closes [#10375](https://github.com/vitejs/vite/issues/10375)
* fix(config): don't resolve by module field (#10347) ([cc1c829](https://github.com/vitejs/vite/commit/cc1c829)), closes [#10347](https://github.com/vitejs/vite/issues/10347)
* fix(html): handle attrs with prefix (fixes #10337) (#10381) ([7b4d6e8](https://github.com/vitejs/vite/commit/7b4d6e8)), closes [#10337](https://github.com/vitejs/vite/issues/10337) [#10381](https://github.com/vitejs/vite/issues/10381)
* fix(ssr): track var as function scope (#10388) ([87b48f9](https://github.com/vitejs/vite/commit/87b48f9)), closes [#10388](https://github.com/vitejs/vite/issues/10388)
* fix: add module types (#10299) ([0b89dd2](https://github.com/vitejs/vite/commit/0b89dd2)), closes [#10299](https://github.com/vitejs/vite/issues/10299)
* fix: css order problem in async chunk (#9949) ([6c7b834](https://github.com/vitejs/vite/commit/6c7b834)), closes [#9949](https://github.com/vitejs/vite/issues/9949)
* fix: don't duplicate styles with dynamic import (fix #9967) (#9970) ([65f97bd](https://github.com/vitejs/vite/commit/65f97bd)), closes [#9967](https://github.com/vitejs/vite/issues/9967) [#9970](https://github.com/vitejs/vite/issues/9970)
* fix: env variables override (#10113) ([d619460](https://github.com/vitejs/vite/commit/d619460)), closes [#10113](https://github.com/vitejs/vite/issues/10113)
* fix: isFromTsImporter flag in worker virtual model (#10273) ([78f74c9](https://github.com/vitejs/vite/commit/78f74c9)), closes [#10273](https://github.com/vitejs/vite/issues/10273)
* fix: properly close optimizer on server restart (#10028) ([a32777f](https://github.com/vitejs/vite/commit/a32777f)), closes [#10028](https://github.com/vitejs/vite/issues/10028)
* fix: respect `mainFields` when resolving browser/module field (fixes #8659) (#10071) ([533d13c](https://github.com/vitejs/vite/commit/533d13c)), closes [#8659](https://github.com/vitejs/vite/issues/8659) [#10071](https://github.com/vitejs/vite/issues/10071)
* fix: respect resolve.conditions, when resolving browser/require field (#9860) ([9a83eaf](https://github.com/vitejs/vite/commit/9a83eaf)), closes [#9860](https://github.com/vitejs/vite/issues/9860)
* fix: support process each out dir when there are two or more (#9748) ([ee3231c](https://github.com/vitejs/vite/commit/ee3231c)), closes [#9748](https://github.com/vitejs/vite/issues/9748)
* fix(build): fix resolution algorithm when `build.ssr` is true (#9989) ([7229251](https://github.com/vitejs/vite/commit/7229251)), closes [#9989](https://github.com/vitejs/vite/issues/9989)
* fix(config): resolve implicit deps as absolute path (#10254) ([ec1f3ae](https://github.com/vitejs/vite/commit/ec1f3ae)), closes [#10254](https://github.com/vitejs/vite/issues/10254)
* fix(css):  missing css in lib mode (#10185) ([e4c1c6d](https://github.com/vitejs/vite/commit/e4c1c6d)), closes [#10185](https://github.com/vitejs/vite/issues/10185)
* fix(deps): update all non-major dependencies (#10160) ([6233c83](https://github.com/vitejs/vite/commit/6233c83)), closes [#10160](https://github.com/vitejs/vite/issues/10160)
* fix(deps): update all non-major dependencies (#10316) ([a38b450](https://github.com/vitejs/vite/commit/a38b450)), closes [#10316](https://github.com/vitejs/vite/issues/10316)
* fix(deps): update rollup to `^2.79.1` (#10298) ([2266d83](https://github.com/vitejs/vite/commit/2266d83)), closes [#10298](https://github.com/vitejs/vite/issues/10298)
* fix(esbuild): transpile with esnext in dev (#10207) ([43b7b78](https://github.com/vitejs/vite/commit/43b7b78)), closes [#10207](https://github.com/vitejs/vite/issues/10207)
* fix(hmr): handle virtual module update (#10324) ([7c4accb](https://github.com/vitejs/vite/commit/7c4accb)), closes [#10324](https://github.com/vitejs/vite/issues/10324)
* fix(optimizer): browser field bare import (fix #7599) (#10314) ([cba13e8](https://github.com/vitejs/vite/commit/cba13e8)), closes [#7599](https://github.com/vitejs/vite/issues/7599) [#10314](https://github.com/vitejs/vite/issues/10314)
* fix(sass): reorder sass importers (#10101) ([a543731](https://github.com/vitejs/vite/commit/a543731)), closes [#10101](https://github.com/vitejs/vite/issues/10101)
* fix(server): handle appType mpa html fallback (#10336) ([65dd88b](https://github.com/vitejs/vite/commit/65dd88b)), closes [#10336](https://github.com/vitejs/vite/issues/10336)
* fix(ssr): correctly track scope (#10300) ([a60529f](https://github.com/vitejs/vite/commit/a60529f)), closes [#10300](https://github.com/vitejs/vite/issues/10300)
* fix(worker): support comment in worker constructor option (#10226) ([66c9058](https://github.com/vitejs/vite/commit/66c9058)), closes [#10226](https://github.com/vitejs/vite/issues/10226)
* fix(worker): support trailing comma (#10211) ([0542e7c](https://github.com/vitejs/vite/commit/0542e7c)), closes [#10211](https://github.com/vitejs/vite/issues/10211)


### Previous Changelogs


#### [3.2.0-beta.4](https://github.com/vitejs/vite/compare/v3.2.0-beta.3....v3.2.0-beta.4) (2022-10-24)

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

* fix: esbuildOutputFromId for symlinked root (#10154) ([fc5310f](https://github.com/vitejs/vite/commit/fc5310f)), closes [#10154](https://github.com/vitejs/vite/issues/10154)
* fix(hmr): dedupe virtual modules in module graph (#10144) ([71f08e7](https://github.com/vitejs/vite/commit/71f08e7)), closes [#10144](https://github.com/vitejs/vite/issues/10144)
* fix(lib): respect `rollupOptions.input` in lib mode (#10116) ([c948e7d](https://github.com/vitejs/vite/commit/c948e7d)), closes [#10116](https://github.com/vitejs/vite/issues/10116)



## <small>3.1.2 (2022-09-17)</small>

* fix: use isOptimizable to ensure version query (#10141) ([23a51c6](https://github.com/vitejs/vite/commit/23a51c6)), closes [#10141](https://github.com/vitejs/vite/issues/10141)



## <small>3.1.1 (2022-09-15)</small>

* fix: ensure version query for relative node_modules imports (#10016) ([1b822d0](https://github.com/vitejs/vite/commit/1b822d0)), closes [#10016](https://github.com/vitejs/vite/issues/10016)
* fix: no quote on attrs (#10117) ([f541239](https://github.com/vitejs/vite/commit/f541239)), closes [#10117](https://github.com/vitejs/vite/issues/10117)
* fix: prevent error overlay style being overridden (fixes #9969) (#9971) ([a7706d0](https://github.com/vitejs/vite/commit/a7706d0)), closes [#9969](https://github.com/vitejs/vite/issues/9969) [#9971](https://github.com/vitejs/vite/issues/9971)
* fix: proxy to secured websocket server (#10045) ([9de9bc4](https://github.com/vitejs/vite/commit/9de9bc4)), closes [#10045](https://github.com/vitejs/vite/issues/10045)
* fix: replace white with reset (#10104) ([5d56e42](https://github.com/vitejs/vite/commit/5d56e42)), closes [#10104](https://github.com/vitejs/vite/issues/10104)
* fix(deps): update all non-major dependencies (#10077) ([caf00c8](https://github.com/vitejs/vite/commit/caf00c8)), closes [#10077](https://github.com/vitejs/vite/issues/10077)
* fix(deps): update all non-major dependencies (#9985) ([855f2f0](https://github.com/vitejs/vite/commit/855f2f0)), closes [#9985](https://github.com/vitejs/vite/issues/9985)
* fix(preview): send configured headers (#9976) ([0d20eae](https://github.com/vitejs/vite/commit/0d20eae)), closes [#9976](https://github.com/vitejs/vite/issues/9976)
* chore: cleanup old changelogs (#10056) ([9e65a41](https://github.com/vitejs/vite/commit/9e65a41)), closes [#10056](https://github.com/vitejs/vite/issues/10056)
* chore: update 3.1 changelog (#9994) ([44dbcbe](https://github.com/vitejs/vite/commit/44dbcbe)), closes [#9994](https://github.com/vitejs/vite/issues/9994)
* chore(deps): update @rollup/plugin-node-resolve to v14 (#10078) ([3390c87](https://github.com/vitejs/vite/commit/3390c87)), closes [#10078](https://github.com/vitejs/vite/issues/10078)
* refactor: config hook helper function (#9982) ([9c1be10](https://github.com/vitejs/vite/commit/9c1be10)), closes [#9982](https://github.com/vitejs/vite/issues/9982)
* refactor: optimize `async` and `await` in code (#9854) ([31f5ff3](https://github.com/vitejs/vite/commit/31f5ff3)), closes [#9854](https://github.com/vitejs/vite/issues/9854)



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

* feat(css): format error (#9909) ([632fedf](https://github.com/vitejs/vite/commit/632fedf)), closes [#9909](https://github.com/vitejs/vite/issues/9909)
* perf: bundle create-vite (#9034) ([37ac91e](https://github.com/vitejs/vite/commit/37ac91e)), closes [#9034](https://github.com/vitejs/vite/issues/9034)
* feat: stabilize server.resolvedUrls (#9866) ([c3f6731](https://github.com/vitejs/vite/commit/c3f6731)), closes [#9866](https://github.com/vitejs/vite/issues/9866)
* feat(client): use debug channel on hot updates (#8855) ([0452224](https://github.com/vitejs/vite/commit/0452224)), closes [#8855](https://github.com/vitejs/vite/issues/8855)
* feat: relax dep browser externals as warning (#9837) ([71cb374](https://github.com/vitejs/vite/commit/71cb374)), closes [#9837](https://github.com/vitejs/vite/issues/9837)
* feat: support object style hooks (#9634) ([757a92f](https://github.com/vitejs/vite/commit/757a92f)), closes [#9634](https://github.com/vitejs/vite/issues/9634)
* refactor: migrate from vue/compiler-dom to parse5 (#9678) ([05b3ce6](https://github.com/vitejs/vite/commit/05b3ce6)), closes [#9678](https://github.com/vitejs/vite/issues/9678)
* refactor: use `server.ssrTransform` (#9769) ([246a087](https://github.com/vitejs/vite/commit/246a087)), closes [#9769](https://github.com/vitejs/vite/issues/9769)
* perf: legacy avoid insert the entry module css (#9761) ([0765ab8](https://github.com/vitejs/vite/commit/0765ab8)), closes [#9761](https://github.com/vitejs/vite/issues/9761)

### Bug Fixes

* fix(css): remove css-post plugin sourcemap (#9914) ([c9521e7](https://github.com/vitejs/vite/commit/c9521e7)), closes [#9914](https://github.com/vitejs/vite/issues/9914)
* fix(hmr): duplicated modules because of query params mismatch (fixes #2255) (#9773) ([86bf776](https://github.com/vitejs/vite/commit/86bf776)), closes [#2255](https://github.com/vitejs/vite/issues/2255) [#9773](https://github.com/vitejs/vite/issues/9773)
* fix(ssr): enable `inlineDynamicImports` when input has length 1 (#9904) ([9ac5075](https://github.com/vitejs/vite/commit/9ac5075)), closes [#9904](https://github.com/vitejs/vite/issues/9904)
* fix(types): mark explicitImportRequired optional and experimental (#9962) ([7b618f0](https://github.com/vitejs/vite/commit/7b618f0)), closes [#9962](https://github.com/vitejs/vite/issues/9962)
* fix: bump esbuild to 0.15.6 (#9934) ([091537c](https://github.com/vitejs/vite/commit/091537c)), closes [#9934](https://github.com/vitejs/vite/issues/9934)
* refactor(hmr): simplify fetchUpdate (#9881) ([8872aba](https://github.com/vitejs/vite/commit/8872aba)), closes [#9881](https://github.com/vitejs/vite/issues/9881)
* fix: ensure version query for direct node_modules imports (#9848) ([e7712ff](https://github.com/vitejs/vite/commit/e7712ff)), closes [#9848](https://github.com/vitejs/vite/issues/9848)
* fix: escape glob path (#9842) ([6be971e](https://github.com/vitejs/vite/commit/6be971e)), closes [#9842](https://github.com/vitejs/vite/issues/9842)
* fix(build): build project path error (#9793) ([cc8800a](https://github.com/vitejs/vite/commit/cc8800a)), closes [#9793](https://github.com/vitejs/vite/issues/9793)
* fix(types): explicitly set Vite hooks' `this` to `void` (#9885) ([2d2f2e5](https://github.com/vitejs/vite/commit/2d2f2e5)), closes [#9885](https://github.com/vitejs/vite/issues/9885)
* fix: `completeSystemWrapPlugin` captures `function ()` (fixes #9807) (#9821) ([1ee0364](https://github.com/vitejs/vite/commit/1ee0364)), closes [#9807](https://github.com/vitejs/vite/issues/9807) [#9821](https://github.com/vitejs/vite/issues/9821)
* fix: `injectQuery` break relative path (#9760) ([61273b2](https://github.com/vitejs/vite/commit/61273b2)), closes [#9760](https://github.com/vitejs/vite/issues/9760)
* fix: close socket when client error handled (#9816) ([ba62be4](https://github.com/vitejs/vite/commit/ba62be4)), closes [#9816](https://github.com/vitejs/vite/issues/9816)
* fix: handle resolve optional peer deps (#9321) ([eec3886](https://github.com/vitejs/vite/commit/eec3886)), closes [#9321](https://github.com/vitejs/vite/issues/9321)
* fix: module graph ensureEntryFromUrl based on id (#9759) ([01857af](https://github.com/vitejs/vite/commit/01857af)), closes [#9759](https://github.com/vitejs/vite/issues/9759)
* fix: sanitize asset filenames (#9737) ([2f468bb](https://github.com/vitejs/vite/commit/2f468bb)), closes [#9737](https://github.com/vitejs/vite/issues/9737)
* fix: Skip inlining Git LFS placeholders (fix #9714) (#9795) ([9c7e43d](https://github.com/vitejs/vite/commit/9c7e43d)), closes [#9714](https://github.com/vitejs/vite/issues/9714) [#9795](https://github.com/vitejs/vite/issues/9795)
* fix(html): move importmap before module scripts (#9392) ([b386fba](https://github.com/vitejs/vite/commit/b386fba)), closes [#9392](https://github.com/vitejs/vite/issues/9392)

### Previous Changelogs

#### [3.1.0-beta.2](https://github.com/vitejs/vite/compare/v3.1.0-beta.1...v3.1.0-beta.2) (2022-09-02)

See [3.1.0-beta.2 changelog](https://github.com/vitejs/vite/blob/v3.1.0-beta.2/packages/vite/CHANGELOG.md)

#### [3.1.0-beta.1](https://github.com/vitejs/vite/compare/v3.1.0-beta.0...v3.1.0-beta.1) (2022-08-29)

See [3.1.0-beta.1 changelog](https://github.com/vitejs/vite/blob/v3.1.0-beta.1/packages/vite/CHANGELOG.md)

#### [3.1.0-beta.0](https://github.com/vitejs/vite/compare/v3.0.0...v3.1.0-beta.0) (2022-08-25)

See [3.1.0-beta.0 changelog](https://github.com/vitejs/vite/blob/v3.1.0-beta.0/packages/vite/CHANGELOG.md)



## <small>3.0.9 (2022-08-19)</small>

* feat(ssr): warn if cant analyze dynamic import (#9738) ([e0ecb80](https://github.com/vitejs/vite/commit/e0ecb80)), closes [#9738](https://github.com/vitejs/vite/issues/9738)
* fix: dynamic import path contain ../ and its own directory (#9350) ([c6870f3](https://github.com/vitejs/vite/commit/c6870f3)), closes [#9350](https://github.com/vitejs/vite/issues/9350)
* fix: legacy no resolve asset urls (#9507) ([1d6a1eb](https://github.com/vitejs/vite/commit/1d6a1eb)), closes [#9507](https://github.com/vitejs/vite/issues/9507)
* fix: print error file path when using `rollupOptions.output.dir` (fix #9100) (#9111) ([3bffd14](https://github.com/vitejs/vite/commit/3bffd14)), closes [#9100](https://github.com/vitejs/vite/issues/9100) [#9111](https://github.com/vitejs/vite/issues/9111)
* fix: skip undefined proxy entry (#9622) ([e396d67](https://github.com/vitejs/vite/commit/e396d67)), closes [#9622](https://github.com/vitejs/vite/issues/9622)
* fix(hmr): duplicate link tags (#9697) ([9aa9515](https://github.com/vitejs/vite/commit/9aa9515)), closes [#9697](https://github.com/vitejs/vite/issues/9697)
* fix(import-analysis): escape quotes (#9729) ([21515f1](https://github.com/vitejs/vite/commit/21515f1)), closes [#9729](https://github.com/vitejs/vite/issues/9729)
* docs: fix typos in comments and documentation (#9711) ([0571232](https://github.com/vitejs/vite/commit/0571232)), closes [#9711](https://github.com/vitejs/vite/issues/9711)
* docs: update import.meta.glob jsdocs (#9709) ([15ff3a2](https://github.com/vitejs/vite/commit/15ff3a2)), closes [#9709](https://github.com/vitejs/vite/issues/9709)
* chore(deps): update all non-major dependencies (#9675) ([4e56e87](https://github.com/vitejs/vite/commit/4e56e87)), closes [#9675](https://github.com/vitejs/vite/issues/9675)
* chore(deps): update dependency es-module-lexer to v1 (#9576) ([1d8613f](https://github.com/vitejs/vite/commit/1d8613f)), closes [#9576](https://github.com/vitejs/vite/issues/9576)
* perf: avoid `ssrTransform` object allocation (#9706) ([6e58d9d](https://github.com/vitejs/vite/commit/6e58d9d)), closes [#9706](https://github.com/vitejs/vite/issues/9706)



## <small>3.0.8 (2022-08-16)</small>

* fix: allow ping to http from https website (#9561) ([f4b4405](https://github.com/vitejs/vite/commit/f4b4405)), closes [#9561](https://github.com/vitejs/vite/issues/9561)
* fix: use browser field if likely esm (fixes #9652) (#9653) ([85e387a](https://github.com/vitejs/vite/commit/85e387a)), closes [#9652](https://github.com/vitejs/vite/issues/9652) [#9653](https://github.com/vitejs/vite/issues/9653)
* fix(ssr-manifest): filter path undefined when dynamic import (#9655) ([1478a2f](https://github.com/vitejs/vite/commit/1478a2f)), closes [#9655](https://github.com/vitejs/vite/issues/9655)
* docs: update WSL2 watch limitation explanation (#8939) ([afbb87d](https://github.com/vitejs/vite/commit/afbb87d)), closes [#8939](https://github.com/vitejs/vite/issues/8939)



## <small>3.0.7 (2022-08-12)</small>

* chore: fix typo in error message (#9645) ([7121ee0](https://github.com/vitejs/vite/commit/7121ee0)), closes [#9645](https://github.com/vitejs/vite/issues/9645)
* fix(config): don't use file url for external files with cjs output (#9642) ([73ad707](https://github.com/vitejs/vite/commit/73ad707)), closes [#9642](https://github.com/vitejs/vite/issues/9642)



## <small>3.0.6 (2022-08-11)</small>

* chore: narrow down rollup version (#9637) ([fcf4d98](https://github.com/vitejs/vite/commit/fcf4d98)), closes [#9637](https://github.com/vitejs/vite/issues/9637)
* feat: show warning on 431 response (#9324) ([e8b61bb](https://github.com/vitejs/vite/commit/e8b61bb)), closes [#9324](https://github.com/vitejs/vite/issues/9324)
* fix: avoid using `import.meta.url` for relative assets if output is not ESM (fixes #9297) (#9381) ([6d95225](https://github.com/vitejs/vite/commit/6d95225)), closes [#9297](https://github.com/vitejs/vite/issues/9297) [#9381](https://github.com/vitejs/vite/issues/9381)
* fix: json HMR (fixes #9521) (#9610) ([e45d95f](https://github.com/vitejs/vite/commit/e45d95f)), closes [#9521](https://github.com/vitejs/vite/issues/9521) [#9610](https://github.com/vitejs/vite/issues/9610)
* fix: legacy no emit worker (#9500) ([9d0b18b](https://github.com/vitejs/vite/commit/9d0b18b)), closes [#9500](https://github.com/vitejs/vite/issues/9500)
* fix: use browser field if it is not likely UMD or CJS (fixes #9445) (#9459) ([c868e64](https://github.com/vitejs/vite/commit/c868e64)), closes [#9445](https://github.com/vitejs/vite/issues/9445) [#9459](https://github.com/vitejs/vite/issues/9459)
* fix(optimizer): ignore EACCES errors while scanner (fixes #8916) (#9509) ([4e6a77f](https://github.com/vitejs/vite/commit/4e6a77f)), closes [#8916](https://github.com/vitejs/vite/issues/8916) [#9509](https://github.com/vitejs/vite/issues/9509)
* fix(ssr): rename objectPattern dynamic key (fixes #9585) (#9609) ([ee7f78f](https://github.com/vitejs/vite/commit/ee7f78f)), closes [#9585](https://github.com/vitejs/vite/issues/9585) [#9609](https://github.com/vitejs/vite/issues/9609)



## <small>3.0.5 (2022-08-09)</small>

* fix: allow tree-shake glob eager css in js (#9547) ([2e309d6](https://github.com/vitejs/vite/commit/2e309d6)), closes [#9547](https://github.com/vitejs/vite/issues/9547)
* fix: ignore tsconfig target when bundling config (#9457) ([c5e7895](https://github.com/vitejs/vite/commit/c5e7895)), closes [#9457](https://github.com/vitejs/vite/issues/9457)
* fix: log worker plugins in debug mode (#9553) ([c1fa219](https://github.com/vitejs/vite/commit/c1fa219)), closes [#9553](https://github.com/vitejs/vite/issues/9553)
* fix: tree-shake modulepreload polyfill (#9531) ([1f11a70](https://github.com/vitejs/vite/commit/1f11a70)), closes [#9531](https://github.com/vitejs/vite/issues/9531)
* fix: update dep types (fixes #9475) (#9489) ([937cecc](https://github.com/vitejs/vite/commit/937cecc)), closes [#9475](https://github.com/vitejs/vite/issues/9475) [#9489](https://github.com/vitejs/vite/issues/9489)
* fix(build): normalized output log (#9594) ([8bae103](https://github.com/vitejs/vite/commit/8bae103)), closes [#9594](https://github.com/vitejs/vite/issues/9594)
* fix(config): try catch unlink after load (#9577) ([d35a1e2](https://github.com/vitejs/vite/commit/d35a1e2)), closes [#9577](https://github.com/vitejs/vite/issues/9577)
* fix(config): use file url for import path (fixes #9471) (#9473) ([22084a6](https://github.com/vitejs/vite/commit/22084a6)), closes [#9471](https://github.com/vitejs/vite/issues/9471) [#9473](https://github.com/vitejs/vite/issues/9473)
* fix(deps): update all non-major dependencies (#9575) ([8071325](https://github.com/vitejs/vite/commit/8071325)), closes [#9575](https://github.com/vitejs/vite/issues/9575)
* fix(ssr): check root import extension for external (#9494) ([ff89df5](https://github.com/vitejs/vite/commit/ff89df5)), closes [#9494](https://github.com/vitejs/vite/issues/9494)
* fix(ssr): use appendRight for import (#9554) ([dfec6ca](https://github.com/vitejs/vite/commit/dfec6ca)), closes [#9554](https://github.com/vitejs/vite/issues/9554)
* refactor(resolve): remove commonjs plugin handling (#9460) ([2042b91](https://github.com/vitejs/vite/commit/2042b91)), closes [#9460](https://github.com/vitejs/vite/issues/9460)
* chore: init imports var before use (#9569) ([905b8eb](https://github.com/vitejs/vite/commit/905b8eb)), closes [#9569](https://github.com/vitejs/vite/issues/9569)
* chore: node prefix lint (#9514) ([9e9cd23](https://github.com/vitejs/vite/commit/9e9cd23)), closes [#9514](https://github.com/vitejs/vite/issues/9514)
* chore: tidy up eslint config (#9468) ([f4addcf](https://github.com/vitejs/vite/commit/f4addcf)), closes [#9468](https://github.com/vitejs/vite/issues/9468)
* chore(deps): update all non-major dependencies (#9478) ([c530d16](https://github.com/vitejs/vite/commit/c530d16)), closes [#9478](https://github.com/vitejs/vite/issues/9478)
* docs: fix incomplete comment (#9466) ([5169c51](https://github.com/vitejs/vite/commit/5169c51)), closes [#9466](https://github.com/vitejs/vite/issues/9466)
* feat(ssr): debug failed node resolve (#9432) ([364aae1](https://github.com/vitejs/vite/commit/364aae1)), closes [#9432](https://github.com/vitejs/vite/issues/9432)



## <small>3.0.4 (2022-07-29)</small>

* fix: __VITE_PUBLIC_ASSET__hash__ in HTML (#9247) ([a2b24ee](https://github.com/vitejs/vite/commit/a2b24ee)), closes [#9247](https://github.com/vitejs/vite/issues/9247)
* fix: inline dynamic imports for ssr-webworker (fixes #9385) (#9401) ([cd69358](https://github.com/vitejs/vite/commit/cd69358)), closes [#9385](https://github.com/vitejs/vite/issues/9385) [#9401](https://github.com/vitejs/vite/issues/9401)
* fix: normalise css paths in manifest on windows (fixes #9295) (#9353) ([13e6450](https://github.com/vitejs/vite/commit/13e6450)), closes [#9295](https://github.com/vitejs/vite/issues/9295) [#9353](https://github.com/vitejs/vite/issues/9353)
* fix: support stylesheets with link tag and media/disable prop (#6751) ([e6c8965](https://github.com/vitejs/vite/commit/e6c8965)), closes [#6751](https://github.com/vitejs/vite/issues/6751)
* fix: url constructor import asset no as url (#9399) ([122c6e7](https://github.com/vitejs/vite/commit/122c6e7)), closes [#9399](https://github.com/vitejs/vite/issues/9399)
* fix(glob): server perf when globbing huge dirs (#9425) ([156a3a4](https://github.com/vitejs/vite/commit/156a3a4)), closes [#9425](https://github.com/vitejs/vite/issues/9425)
* fix(glob): support static template literals (#9352) ([183c6fb](https://github.com/vitejs/vite/commit/183c6fb)), closes [#9352](https://github.com/vitejs/vite/issues/9352)
* fix(ssr): allow virtual paths on node modules (#9405) ([e60368f](https://github.com/vitejs/vite/commit/e60368f)), closes [#9405](https://github.com/vitejs/vite/issues/9405)
* chore(deps): update all non-major dependencies (#9347) ([2fcb027](https://github.com/vitejs/vite/commit/2fcb027)), closes [#9347](https://github.com/vitejs/vite/issues/9347)



## <small>3.0.3 (2022-07-25)</small>

* fix: client type error (#9289) ([b82ddfb](https://github.com/vitejs/vite/commit/b82ddfb)), closes [#9289](https://github.com/vitejs/vite/issues/9289)
* fix: don't modify config (#9262) ([bbc8318](https://github.com/vitejs/vite/commit/bbc8318)), closes [#9262](https://github.com/vitejs/vite/issues/9262)
* fix: entries in ssr.external (#9286) ([d420f01](https://github.com/vitejs/vite/commit/d420f01)), closes [#9286](https://github.com/vitejs/vite/issues/9286)
* fix: externalize explicitly configured linked packages (#9346) ([c33e365](https://github.com/vitejs/vite/commit/c33e365)), closes [#9346](https://github.com/vitejs/vite/issues/9346)
* fix: make `resolveConfig()` concurrent safe (#9224) ([dfaeb2b](https://github.com/vitejs/vite/commit/dfaeb2b)), closes [#9224](https://github.com/vitejs/vite/issues/9224)
* fix: scanner and optimizer should skip wasm (#9257) ([c616077](https://github.com/vitejs/vite/commit/c616077)), closes [#9257](https://github.com/vitejs/vite/issues/9257)
* fix: ssrLoadModule executes code in non-strict mode, fixes #9197 (#9199) ([5866cfb](https://github.com/vitejs/vite/commit/5866cfb)), closes [#9197](https://github.com/vitejs/vite/issues/9197) [#9199](https://github.com/vitejs/vite/issues/9199)
* fix: support multiline dynamic imports (#9314) ([e66cf69](https://github.com/vitejs/vite/commit/e66cf69)), closes [#9314](https://github.com/vitejs/vite/issues/9314)
* fix: support vite client in safari 13 (#9315) ([2415193](https://github.com/vitejs/vite/commit/2415193)), closes [#9315](https://github.com/vitejs/vite/issues/9315)
* fix: worker relative base should use import.meta.url (#9204) ([0358b04](https://github.com/vitejs/vite/commit/0358b04)), closes [#9204](https://github.com/vitejs/vite/issues/9204)
* fix(glob): handle glob prop access (#9281) ([0580215](https://github.com/vitejs/vite/commit/0580215)), closes [#9281](https://github.com/vitejs/vite/issues/9281)
* fix(scan): handle .ts import as .js alias (#9282) ([0b083ca](https://github.com/vitejs/vite/commit/0b083ca)), closes [#9282](https://github.com/vitejs/vite/issues/9282)
* fix(ssr): no external symlink package (#9296) ([ea27701](https://github.com/vitejs/vite/commit/ea27701)), closes [#9296](https://github.com/vitejs/vite/issues/9296)
* chore: adjust comments/typos (#9325) ([ffb2ba3](https://github.com/vitejs/vite/commit/ffb2ba3)), closes [#9325](https://github.com/vitejs/vite/issues/9325)
* chore: fix code typos (#9033) ([ed02861](https://github.com/vitejs/vite/commit/ed02861)), closes [#9033](https://github.com/vitejs/vite/issues/9033)
* docs: fix `@rollup/plugin-commonjs` name (#9313) ([c417364](https://github.com/vitejs/vite/commit/c417364)), closes [#9313](https://github.com/vitejs/vite/issues/9313)
* docs: fix server options link (#9242) ([29db3ea](https://github.com/vitejs/vite/commit/29db3ea)), closes [#9242](https://github.com/vitejs/vite/issues/9242)
* docs: update browser baseline features (#9316) ([b82ee5d](https://github.com/vitejs/vite/commit/b82ee5d)), closes [#9316](https://github.com/vitejs/vite/issues/9316)
* feat: supports cts and mts files (#9268) ([0602017](https://github.com/vitejs/vite/commit/0602017)), closes [#9268](https://github.com/vitejs/vite/issues/9268)
* feat: worker config call config hook (#9212) ([3e510ab](https://github.com/vitejs/vite/commit/3e510ab)), closes [#9212](https://github.com/vitejs/vite/issues/9212)
* feat(css): use esbuild.log* options when minifying (#9210) ([88baa53](https://github.com/vitejs/vite/commit/88baa53)), closes [#9210](https://github.com/vitejs/vite/issues/9210)



## <small>3.0.2 (2022-07-18)</small>

* fix: fs serve only edit pathname (fixes #9148) (#9173) ([28cffc9](https://github.com/vitejs/vite/commit/28cffc9)), closes [#9148](https://github.com/vitejs/vite/issues/9148) [#9173](https://github.com/vitejs/vite/issues/9173)
* fix: prevent null pathname error (#9188) ([d66ffd0](https://github.com/vitejs/vite/commit/d66ffd0)), closes [#9188](https://github.com/vitejs/vite/issues/9188)
* fix: return 500 on proxy error only if possible (fixes #9172) (#9193) ([b2f6bdc](https://github.com/vitejs/vite/commit/b2f6bdc)), closes [#9172](https://github.com/vitejs/vite/issues/9172) [#9193](https://github.com/vitejs/vite/issues/9193)
* fix(deps): update all non-major dependencies (#9176) ([31d3b70](https://github.com/vitejs/vite/commit/31d3b70)), closes [#9176](https://github.com/vitejs/vite/issues/9176)
* fix(dev): build.ssr is set during dev, fix #9134 (#9187) ([99b0e67](https://github.com/vitejs/vite/commit/99b0e67)), closes [#9134](https://github.com/vitejs/vite/issues/9134) [#9187](https://github.com/vitejs/vite/issues/9187)
* fix(ssr): strip NULL_BYTE_PLACEHOLDER before import (#9124) ([c5f2dc7](https://github.com/vitejs/vite/commit/c5f2dc7)), closes [#9124](https://github.com/vitejs/vite/issues/9124)



## <small>3.0.1 (2022-07-18)</small>

* fix: avoid errors when loading the overlay code in workers (#9064) ([a52b45e](https://github.com/vitejs/vite/commit/a52b45e)), closes [#9064](https://github.com/vitejs/vite/issues/9064)
* fix: check server after tsconfig reload (#9106) ([d12d469](https://github.com/vitejs/vite/commit/d12d469)), closes [#9106](https://github.com/vitejs/vite/issues/9106)
* fix: disable keepNames in `vite:esbuild` (fixes #9164) (#9166) ([e6f3b02](https://github.com/vitejs/vite/commit/e6f3b02)), closes [#9164](https://github.com/vitejs/vite/issues/9164) [#9166](https://github.com/vitejs/vite/issues/9166)
* fix: externalize workspace relative import when bundle config (#9140) ([5a8a3ab](https://github.com/vitejs/vite/commit/5a8a3ab)), closes [#9140](https://github.com/vitejs/vite/issues/9140)
* fix: mention that Node.js 13/15 support is dropped (fixes #9113) (#9116) ([2826303](https://github.com/vitejs/vite/commit/2826303)), closes [#9113](https://github.com/vitejs/vite/issues/9113) [#9116](https://github.com/vitejs/vite/issues/9116)
* fix: resolve drive relative path (#9097) ([b393451](https://github.com/vitejs/vite/commit/b393451)), closes [#9097](https://github.com/vitejs/vite/issues/9097)
* fix: respect .mjs .cjs extension in all modes (#9141) ([5ea70b3](https://github.com/vitejs/vite/commit/5ea70b3)), closes [#9141](https://github.com/vitejs/vite/issues/9141)
* fix: return 500 on proxy error only if possible (fixes #9172) (#9175) ([d2f02a8](https://github.com/vitejs/vite/commit/d2f02a8)), closes [#9172](https://github.com/vitejs/vite/issues/9172) [#9175](https://github.com/vitejs/vite/issues/9175)
* fix: server.proxy ws error causes crash (#9123) ([c2426d1](https://github.com/vitejs/vite/commit/c2426d1)), closes [#9123](https://github.com/vitejs/vite/issues/9123)
* fix: ssr.external/noExternal should apply to packageName (#9146) ([5844d8e](https://github.com/vitejs/vite/commit/5844d8e)), closes [#9146](https://github.com/vitejs/vite/issues/9146)
* fix: use correct require extension to load config (#9118) ([ebf682e](https://github.com/vitejs/vite/commit/ebf682e)), closes [#9118](https://github.com/vitejs/vite/issues/9118)
* fix(esbuild): always support dynamic import and import meta (#9105) ([57a7936](https://github.com/vitejs/vite/commit/57a7936)), closes [#9105](https://github.com/vitejs/vite/issues/9105)
* feat: allow declaring dirname (#9154) ([1e078ad](https://github.com/vitejs/vite/commit/1e078ad)), closes [#9154](https://github.com/vitejs/vite/issues/9154)
* refactor: always load config with esbuild bundled code (#9121) ([a2b3131](https://github.com/vitejs/vite/commit/a2b3131)), closes [#9121](https://github.com/vitejs/vite/issues/9121)
* docs: update default for optimizeDeps.disabled (#9078) ([4fbf9a8](https://github.com/vitejs/vite/commit/4fbf9a8)), closes [#9078](https://github.com/vitejs/vite/issues/9078)
* chore: 3.0 release notes and bump peer deps (#9072) ([427ba26](https://github.com/vitejs/vite/commit/427ba26)), closes [#9072](https://github.com/vitejs/vite/issues/9072)



## 3.0.0 (2022-07-13)

### Main Changes

> **Vite 3 is out!**
> Read the [Vite 3 Announcement blog post](https://vitejs.dev/blog/announcing-vite3)

- New docs theme using [VitePress](https://vitepress.vuejs.org/) v1 alpha: https://vitejs.dev
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
  - Vite uses ESM for the SSR build by default, and previous [SSR externalization heuristics](https://vitejs.dev/guide/ssr.html#ssr-externals) are no longer needed.
- `import.meta.glob` has been improved, read about the new features in the [Glob Import Guide](https://vitejs.dev/guide/features.html#glob-import)
- The WebAssembly import API has been revised to avoid collisions with future standards. Read more in the [WebAssembly guide](https://vitejs.dev/guide/features.html#webassembly)
- Improved support for relative base.
- Experimental Features
  - [Build Advanced Base Options](https://vitejs.dev/guide/build.html#advanced-base-options)
  - [HMR Partial Accept](https://github.com/vitejs/vite/pull/7324)
  - Vite now allows the use of [esbuild to optimize dependencies during build time](https://vitejs.dev/guide/migration.html#using-esbuild-deps-optimization-at-build-time) avoiding the need of [`@rollup/plugin-commonjs`](https://github.com/rollup/plugins/tree/master/packages/commonjs), removing one of the difference id dependency handling between dev and prod.
- Bundle size reduction
  - Terser is now an optional dependency. If you use `build.minify: 'terser'`, you'll need to install it (`npm add -D terser`)
  - node-forge moved out of the monorepo to [@vitejs/plugin-basic-ssl](https://vitejs.dev/guide/migration.html#automatic-https-certificate-generation)
- Options that were [already deprecated in v2](https://vitejs.dev/guide/migration.html#config-options-changes) have been removed.

> **Note**
> Before updating, check out the [migration guide from v2](https://vitejs.dev/guide/migration)

### Features

* feat: expose server resolved urls (#8986) ([26bcdc3](https://github.com/vitejs/vite/commit/26bcdc3)), closes [#8986](https://github.com/vitejs/vite/issues/8986)
* feat: show ws connection error (#9007) ([da7c3ae](https://github.com/vitejs/vite/commit/da7c3ae)), closes [#9007](https://github.com/vitejs/vite/issues/9007)
* docs: update api-javascript (#8999) ([05b17df](https://github.com/vitejs/vite/commit/05b17df)), closes [#8999](https://github.com/vitejs/vite/issues/8999)
* refactor: opt-in optimizeDeps during build and SSR (#8965) ([f8c8cf2](https://github.com/vitejs/vite/commit/f8c8cf2)), closes [#8965](https://github.com/vitejs/vite/issues/8965)
* refactor!: move basic ssl setup to external plugin, fix #8532 (#8961) ([5c6cf5a](https://github.com/vitejs/vite/commit/5c6cf5a)), closes [#8532](https://github.com/vitejs/vite/issues/8532) [#8961](https://github.com/vitejs/vite/issues/8961)
* feat: avoid scanner during build and only optimize CJS in SSR (#8932) ([339d9e3](https://github.com/vitejs/vite/commit/339d9e3)), closes [#8932](https://github.com/vitejs/vite/issues/8932)
* feat: improved cold start using deps scanner (#8869) ([188f188](https://github.com/vitejs/vite/commit/188f188)), closes [#8869](https://github.com/vitejs/vite/issues/8869)
* feat: ssr.optimizeDeps (#8917) ([f280dd9](https://github.com/vitejs/vite/commit/f280dd9)), closes [#8917](https://github.com/vitejs/vite/issues/8917)
* feat: support import assertions (#8937) ([2390422](https://github.com/vitejs/vite/commit/2390422)), closes [#8937](https://github.com/vitejs/vite/issues/8937)
* feat: accept AcceptedPlugin type for postcss plugin (#8830) ([6886078](https://github.com/vitejs/vite/commit/6886078)), closes [#8830](https://github.com/vitejs/vite/issues/8830)
* feat: ssrBuild flag in config env (#8863) ([b6d655a](https://github.com/vitejs/vite/commit/b6d655a)), closes [#8863](https://github.com/vitejs/vite/issues/8863)
* feat: experimental.renderBuiltUrl (revised build base options) (#8762) ([895a7d6](https://github.com/vitejs/vite/commit/895a7d6)), closes [#8762](https://github.com/vitejs/vite/issues/8762)
* feat: respect esbuild minify config for css (#8811) ([d90409e](https://github.com/vitejs/vite/commit/d90409e)), closes [#8811](https://github.com/vitejs/vite/issues/8811)
* feat: use esbuild supported feature (#8665) ([2061d41](https://github.com/vitejs/vite/commit/2061d41)), closes [#8665](https://github.com/vitejs/vite/issues/8665)
* feat: respect esbuild minify config (#8754) ([8b77695](https://github.com/vitejs/vite/commit/8b77695)), closes [#8754](https://github.com/vitejs/vite/issues/8754)
* feat: update rollup commonjs plugin to v22  (#8743) ([d4dcdd1](https://github.com/vitejs/vite/commit/d4dcdd1)), closes [#8743](https://github.com/vitejs/vite/issues/8743)
* feat: enable tree-shaking for lib es (#8737) ([5dc0f72](https://github.com/vitejs/vite/commit/5dc0f72)), closes [#8737](https://github.com/vitejs/vite/issues/8737)
* feat: supports cts and mts config (#8729) ([c2b09db](https://github.com/vitejs/vite/commit/c2b09db)), closes [#8729](https://github.com/vitejs/vite/issues/8729)
* feat: bump minimum node version to 14.18.0 (#8662) ([8a05432](https://github.com/vitejs/vite/commit/8a05432)), closes [#8662](https://github.com/vitejs/vite/issues/8662)
* feat: experimental.buildAdvancedBaseOptions (#8450) ([8ef7333](https://github.com/vitejs/vite/commit/8ef7333)), closes [#8450](https://github.com/vitejs/vite/issues/8450)
* feat: export esbuildVersion and rollupVersion (#8675) ([15ebe1e](https://github.com/vitejs/vite/commit/15ebe1e)), closes [#8675](https://github.com/vitejs/vite/issues/8675)
* feat: print resolved address for localhost (#8647) ([eb52d36](https://github.com/vitejs/vite/commit/eb52d36)), closes [#8647](https://github.com/vitejs/vite/issues/8647)
* feat(hmr): experimental.hmrPartialAccept (#7324) ([83dab7e](https://github.com/vitejs/vite/commit/83dab7e)), closes [#7324](https://github.com/vitejs/vite/issues/7324)
* refactor: type client maps (#8626) ([cf87882](https://github.com/vitejs/vite/commit/cf87882)), closes [#8626](https://github.com/vitejs/vite/issues/8626)
* feat: cleaner default dev output (#8638) ([dbd9688](https://github.com/vitejs/vite/commit/dbd9688)), closes [#8638](https://github.com/vitejs/vite/issues/8638)
* feat: legacy options to revert to v2 strategies (#8623) ([993b842](https://github.com/vitejs/vite/commit/993b842)), closes [#8623](https://github.com/vitejs/vite/issues/8623)
* feat: support async plugins (#8574) ([caa8a58](https://github.com/vitejs/vite/commit/caa8a58)), closes [#8574](https://github.com/vitejs/vite/issues/8574)
* feat: support cjs noExternal in SSR dev, fix #2579 (#8430) ([11d2191](https://github.com/vitejs/vite/commit/11d2191)), closes [#2579](https://github.com/vitejs/vite/issues/2579) [#8430](https://github.com/vitejs/vite/issues/8430)
* feat(dev): added assets to manifest (#6649) ([cdf744d](https://github.com/vitejs/vite/commit/cdf744d)), closes [#6649](https://github.com/vitejs/vite/issues/6649)
* feat!: appType (spa, mpa, custom), boolean middlewareMode (#8452) ([14db473](https://github.com/vitejs/vite/commit/14db473)), closes [#8452](https://github.com/vitejs/vite/issues/8452)
* feat: 500 response if the node proxy request fails (#7398) ([73e1775](https://github.com/vitejs/vite/commit/73e1775)), closes [#7398](https://github.com/vitejs/vite/issues/7398)
* feat: expose createFilter util (#8562) ([c5c424a](https://github.com/vitejs/vite/commit/c5c424a)), closes [#8562](https://github.com/vitejs/vite/issues/8562)
* feat: better config `__dirname` support (#8442) ([51e9195](https://github.com/vitejs/vite/commit/51e9195)), closes [#8442](https://github.com/vitejs/vite/issues/8442)
* feat: expose `version` (#8456) ([e992594](https://github.com/vitejs/vite/commit/e992594)), closes [#8456](https://github.com/vitejs/vite/issues/8456)
* feat: handle named imports of builtin modules (#8338) ([e2e44ff](https://github.com/vitejs/vite/commit/e2e44ff)), closes [#8338](https://github.com/vitejs/vite/issues/8338)
* feat: preserve process env vars in lib build (#8090) ([908c9e4](https://github.com/vitejs/vite/commit/908c9e4)), closes [#8090](https://github.com/vitejs/vite/issues/8090)
* refactor!: make terser an optional dependency (#8049) ([164f528](https://github.com/vitejs/vite/commit/164f528)), closes [#8049](https://github.com/vitejs/vite/issues/8049)
* chore: resolve ssr options (#8455) ([d97e402](https://github.com/vitejs/vite/commit/d97e402)), closes [#8455](https://github.com/vitejs/vite/issues/8455)
* perf: disable postcss sourcemap when unused (#8451) ([64fc61c](https://github.com/vitejs/vite/commit/64fc61c)), closes [#8451](https://github.com/vitejs/vite/issues/8451)
* feat: add ssr.format to force esm output for ssr (#6812) ([337b197](https://github.com/vitejs/vite/commit/337b197)), closes [#6812](https://github.com/vitejs/vite/issues/6812)
* feat: default esm SSR build, simplified externalization (#8348) ([f8c92d1](https://github.com/vitejs/vite/commit/f8c92d1)), closes [#8348](https://github.com/vitejs/vite/issues/8348)
* feat: derive proper js extension from package type (#8382) ([95cdd81](https://github.com/vitejs/vite/commit/95cdd81)), closes [#8382](https://github.com/vitejs/vite/issues/8382)
* feat: ssr build using optimized deps (#8403) ([6a5a5b5](https://github.com/vitejs/vite/commit/6a5a5b5)), closes [#8403](https://github.com/vitejs/vite/issues/8403)
* refactor: `ExportData.imports` to `ExportData.hasImports` (#8355) ([168de2d](https://github.com/vitejs/vite/commit/168de2d)), closes [#8355](https://github.com/vitejs/vite/issues/8355)
* feat: scan free dev server (#8319) ([3f742b6](https://github.com/vitejs/vite/commit/3f742b6)), closes [#8319](https://github.com/vitejs/vite/issues/8319)
* feat: non-blocking esbuild optimization at build time (#8280) ([909cf9c](https://github.com/vitejs/vite/commit/909cf9c)), closes [#8280](https://github.com/vitejs/vite/issues/8280)
* feat: non-blocking needs interop (#7568) ([531cd7b](https://github.com/vitejs/vite/commit/531cd7b)), closes [#7568](https://github.com/vitejs/vite/issues/7568)
* refactor(cli): improve output aesthetics (#6997) ([809ab47](https://github.com/vitejs/vite/commit/809ab47)), closes [#6997](https://github.com/vitejs/vite/issues/6997)
* dx: sourcemap combine debug utils (#8307) ([45dba50](https://github.com/vitejs/vite/commit/45dba50)), closes [#8307](https://github.com/vitejs/vite/issues/8307)
* feat: sourcemap for importAnalysis (#8258) ([a4e4d39](https://github.com/vitejs/vite/commit/a4e4d39)), closes [#8258](https://github.com/vitejs/vite/issues/8258)
* feat: spa option, `preview` and `dev` for MPA and SSR apps (#8217) ([d7cba46](https://github.com/vitejs/vite/commit/d7cba46)), closes [#8217](https://github.com/vitejs/vite/issues/8217)
* feat: vite connected logs changed to console.debug (#7733) ([9f00c41](https://github.com/vitejs/vite/commit/9f00c41)), closes [#7733](https://github.com/vitejs/vite/issues/7733)
* feat: worker support query url (#7914) ([95297dd](https://github.com/vitejs/vite/commit/95297dd)), closes [#7914](https://github.com/vitejs/vite/issues/7914)
* feat(wasm): new wasm plugin (`.wasm?init`) (#8219) ([75c3bf6](https://github.com/vitejs/vite/commit/75c3bf6)), closes [#8219](https://github.com/vitejs/vite/issues/8219)
* build!: bump targets (#8045) ([66efd69](https://github.com/vitejs/vite/commit/66efd69)), closes [#8045](https://github.com/vitejs/vite/issues/8045)
* feat!: migrate to ESM (#8178) ([76fdc27](https://github.com/vitejs/vite/commit/76fdc27)), closes [#8178](https://github.com/vitejs/vite/issues/8178)
* feat!: relative base (#7644) ([09648c2](https://github.com/vitejs/vite/commit/09648c2)), closes [#7644](https://github.com/vitejs/vite/issues/7644)
* feat(css): warn if url rewrite has no importer (#8183) ([0858450](https://github.com/vitejs/vite/commit/0858450)), closes [#8183](https://github.com/vitejs/vite/issues/8183)
* feat: allow any JS identifier in define, not ASCII-only (#5972) ([95eb45b](https://github.com/vitejs/vite/commit/95eb45b)), closes [#5972](https://github.com/vitejs/vite/issues/5972)
* feat: enable `generatedCode: 'es2015'` for rollup build (#5018) ([46d5e67](https://github.com/vitejs/vite/commit/46d5e67)), closes [#5018](https://github.com/vitejs/vite/issues/5018)
* feat: rework `dynamic-import-vars` (#7756) ([80d113b](https://github.com/vitejs/vite/commit/80d113b)), closes [#7756](https://github.com/vitejs/vite/issues/7756)
* feat: worker emit fileName with config (#7804) ([04c2edd](https://github.com/vitejs/vite/commit/04c2edd)), closes [#7804](https://github.com/vitejs/vite/issues/7804)
* feat(glob-import): support `{ import: '*' }` (#8071) ([0b78b2a](https://github.com/vitejs/vite/commit/0b78b2a)), closes [#8071](https://github.com/vitejs/vite/issues/8071)
* build!: remove node v12 support (#7833) ([eeac2d2](https://github.com/vitejs/vite/commit/eeac2d2)), closes [#7833](https://github.com/vitejs/vite/issues/7833)
* feat!: rework `import.meta.glob` (#7537) ([330e0a9](https://github.com/vitejs/vite/commit/330e0a9)), closes [#7537](https://github.com/vitejs/vite/issues/7537)
* feat!: vite dev default port is now 5173 (#8148) ([1cc2e2d](https://github.com/vitejs/vite/commit/1cc2e2d)), closes [#8148](https://github.com/vitejs/vite/issues/8148)
* refactor: remove deprecated api for 3.0 (#5868) ([b5c3709](https://github.com/vitejs/vite/commit/b5c3709)), closes [#5868](https://github.com/vitejs/vite/issues/5868)
* chore: stabilize experimental api (#7707) ([b902932](https://github.com/vitejs/vite/commit/b902932)), closes [#7707](https://github.com/vitejs/vite/issues/7707)
* test: migrate to vitest (#8076) ([8148f67](https://github.com/vitejs/vite/commit/8148f67)), closes [#8076](https://github.com/vitejs/vite/issues/8076)

### Bug Fixes

* fix: prevent production node_env in serve (#9066) ([7662998](https://github.com/vitejs/vite/commit/7662998)), closes [#9066](https://github.com/vitejs/vite/issues/9066)
* fix: reload on restart with middleware mode (fixes #9038) (#9040) ([e372693](https://github.com/vitejs/vite/commit/e372693)), closes [#9038](https://github.com/vitejs/vite/issues/9038) [#9040](https://github.com/vitejs/vite/issues/9040)
* fix: remove ws is already closed error (#9041) ([45b8b53](https://github.com/vitejs/vite/commit/45b8b53)), closes [#9041](https://github.com/vitejs/vite/issues/9041)
* fix(ssr): sourcemap content (fixes #8657) (#8997) ([aff4544](https://github.com/vitejs/vite/commit/aff4544)), closes [#8657](https://github.com/vitejs/vite/issues/8657) [#8997](https://github.com/vitejs/vite/issues/8997)
* fix: respect explicitly external/noExternal config (#8983) ([e369880](https://github.com/vitejs/vite/commit/e369880)), closes [#8983](https://github.com/vitejs/vite/issues/8983)
* fix: cjs interop export names local clash, fix #8950 (#8953) ([2185f72](https://github.com/vitejs/vite/commit/2185f72)), closes [#8950](https://github.com/vitejs/vite/issues/8950) [#8953](https://github.com/vitejs/vite/issues/8953)
* fix: handle context resolve options (#8966) ([57c6c15](https://github.com/vitejs/vite/commit/57c6c15)), closes [#8966](https://github.com/vitejs/vite/issues/8966)
* fix: re-encode url to prevent fs.allow bypass (fixes #8498) (#8979) ([b835699](https://github.com/vitejs/vite/commit/b835699)), closes [#8498](https://github.com/vitejs/vite/issues/8498) [#8979](https://github.com/vitejs/vite/issues/8979)
* fix(scan): detect import .ts as .js (#8969) ([752af6c](https://github.com/vitejs/vite/commit/752af6c)), closes [#8969](https://github.com/vitejs/vite/issues/8969)
* fix: ssrBuild is optional, avoid breaking VitePress (#8912) ([722f514](https://github.com/vitejs/vite/commit/722f514)), closes [#8912](https://github.com/vitejs/vite/issues/8912)
* fix(css): always use css module content (#8936) ([6e0dd3a](https://github.com/vitejs/vite/commit/6e0dd3a)), closes [#8936](https://github.com/vitejs/vite/issues/8936)
* fix: avoid optimizing non-optimizable external deps (#8860) ([cd8d63b](https://github.com/vitejs/vite/commit/cd8d63b)), closes [#8860](https://github.com/vitejs/vite/issues/8860)
* fix: ensure define overrides import.meta in build (#8892) ([7d810a9](https://github.com/vitejs/vite/commit/7d810a9)), closes [#8892](https://github.com/vitejs/vite/issues/8892)
* fix: ignore Playwright test results directory (#8778) ([314c09c](https://github.com/vitejs/vite/commit/314c09c)), closes [#8778](https://github.com/vitejs/vite/issues/8778)
* fix: node platform for ssr dev regression (#8840) ([7257fd8](https://github.com/vitejs/vite/commit/7257fd8)), closes [#8840](https://github.com/vitejs/vite/issues/8840)
* fix: optimize deps on dev SSR, builtin imports in node (#8854) ([d49856c](https://github.com/vitejs/vite/commit/d49856c)), closes [#8854](https://github.com/vitejs/vite/issues/8854)
* fix: prevent crash when the pad amount is negative (#8747) ([3af6a1b](https://github.com/vitejs/vite/commit/3af6a1b)), closes [#8747](https://github.com/vitejs/vite/issues/8747)
* fix: reverts #8278 ([a0da2f0](https://github.com/vitejs/vite/commit/a0da2f0)), closes [#8278](https://github.com/vitejs/vite/issues/8278)
* fix: server.force deprecation and force on restart API (#8842) ([c94f564](https://github.com/vitejs/vite/commit/c94f564)), closes [#8842](https://github.com/vitejs/vite/issues/8842)
* fix(deps): update all non-major dependencies (#8802) ([a4a634d](https://github.com/vitejs/vite/commit/a4a634d)), closes [#8802](https://github.com/vitejs/vite/issues/8802)
* fix(hmr): set isSelfAccepting unless it is delayed (#8898) ([ae34565](https://github.com/vitejs/vite/commit/ae34565)), closes [#8898](https://github.com/vitejs/vite/issues/8898)
* fix(worker): dont throw on `import.meta.url` in ssr (#8846) ([ef749ed](https://github.com/vitejs/vite/commit/ef749ed)), closes [#8846](https://github.com/vitejs/vite/issues/8846)
* fix: deps optimizer should wait on entries (#8822) ([2db1b5b](https://github.com/vitejs/vite/commit/2db1b5b)), closes [#8822](https://github.com/vitejs/vite/issues/8822)
* fix: incorrectly resolving `knownJsSrcRE` files from root (fixes #4161) (#8808) ([e1e426e](https://github.com/vitejs/vite/commit/e1e426e)), closes [#4161](https://github.com/vitejs/vite/issues/4161) [#8808](https://github.com/vitejs/vite/issues/8808)
* fix: /@fs/ dir traversal with escaped chars (fixes #8498) (#8804) ([6851009](https://github.com/vitejs/vite/commit/6851009)), closes [#8498](https://github.com/vitejs/vite/issues/8498) [#8804](https://github.com/vitejs/vite/issues/8804)
* fix: preserve extension of css assets in the manifest (#8768) ([9508549](https://github.com/vitejs/vite/commit/9508549)), closes [#8768](https://github.com/vitejs/vite/issues/8768)
* fix: always remove temp config (#8782) ([2c2a86b](https://github.com/vitejs/vite/commit/2c2a86b)), closes [#8782](https://github.com/vitejs/vite/issues/8782)
* fix: ensure deps optimizer first run, fixes #8750 (#8775) ([3f689a4](https://github.com/vitejs/vite/commit/3f689a4)), closes [#8750](https://github.com/vitejs/vite/issues/8750) [#8775](https://github.com/vitejs/vite/issues/8775)
* fix: remove buildTimeImportMetaUrl (#8785) ([cd32095](https://github.com/vitejs/vite/commit/cd32095)), closes [#8785](https://github.com/vitejs/vite/issues/8785)
* fix: skip inline html (#8789) ([4a6408b](https://github.com/vitejs/vite/commit/4a6408b)), closes [#8789](https://github.com/vitejs/vite/issues/8789)
* fix(optimizer): only run require-import conversion if require'd (#8795) ([7ae0d3e](https://github.com/vitejs/vite/commit/7ae0d3e)), closes [#8795](https://github.com/vitejs/vite/issues/8795)
* perf: avoid sourcemap chains during dev (#8796) ([1566f61](https://github.com/vitejs/vite/commit/1566f61)), closes [#8796](https://github.com/vitejs/vite/issues/8796)
* perf(lib): improve helper inject regex (#8741) ([19fc7e5](https://github.com/vitejs/vite/commit/19fc7e5)), closes [#8741](https://github.com/vitejs/vite/issues/8741)
* fix: avoid type mismatch with Rollup (fix #7843) (#8701) ([87e51f7](https://github.com/vitejs/vite/commit/87e51f7)), closes [#7843](https://github.com/vitejs/vite/issues/7843) [#8701](https://github.com/vitejs/vite/issues/8701)
* fix: optimizeDeps.entries transformRequest url (fix #8719) (#8748) ([9208c3b](https://github.com/vitejs/vite/commit/9208c3b)), closes [#8719](https://github.com/vitejs/vite/issues/8719) [#8748](https://github.com/vitejs/vite/issues/8748)
* fix(hmr): __HMR_PORT__ should not be `'undefined'` (#8761) ([3271266](https://github.com/vitejs/vite/commit/3271266)), closes [#8761](https://github.com/vitejs/vite/issues/8761)
* fix: respect `rollupOptions.external` for transitive dependencies (#8679) ([4f9097b](https://github.com/vitejs/vite/commit/4f9097b)), closes [#8679](https://github.com/vitejs/vite/issues/8679)
* fix: use esbuild platform browser/node instead of neutral (#8714) ([a201cd4](https://github.com/vitejs/vite/commit/a201cd4)), closes [#8714](https://github.com/vitejs/vite/issues/8714)
* fix: disable inlineDynamicImports for ssr.target = node (#8641) ([3b41a8e](https://github.com/vitejs/vite/commit/3b41a8e)), closes [#8641](https://github.com/vitejs/vite/issues/8641)
* fix: infer hmr ws target by client location (#8650) ([4061ee0](https://github.com/vitejs/vite/commit/4061ee0)), closes [#8650](https://github.com/vitejs/vite/issues/8650)
* fix: non-relative base public paths in CSS files (#8682) ([d11d6ea](https://github.com/vitejs/vite/commit/d11d6ea)), closes [#8682](https://github.com/vitejs/vite/issues/8682)
* fix: SSR with relative base (#8683) ([c1667bb](https://github.com/vitejs/vite/commit/c1667bb)), closes [#8683](https://github.com/vitejs/vite/issues/8683)
* fix: filter of BOM tags in json plugin (#8628) ([e10530b](https://github.com/vitejs/vite/commit/e10530b)), closes [#8628](https://github.com/vitejs/vite/issues/8628)
* fix: revert #5902, fix #8243 (#8654) ([1b820da](https://github.com/vitejs/vite/commit/1b820da)), closes [#8243](https://github.com/vitejs/vite/issues/8243) [#8654](https://github.com/vitejs/vite/issues/8654)
* fix(optimizer): use simple browser external shim in prod (#8630) ([a32c4ba](https://github.com/vitejs/vite/commit/a32c4ba)), closes [#8630](https://github.com/vitejs/vite/issues/8630)
* fix(server): skip localhost verbatim dns lookup (#8642) ([7632247](https://github.com/vitejs/vite/commit/7632247)), closes [#8642](https://github.com/vitejs/vite/issues/8642)
* fix(wasm): support inlined WASM in Node < v16 (fix #8620) (#8622) ([f586b14](https://github.com/vitejs/vite/commit/f586b14)), closes [#8620](https://github.com/vitejs/vite/issues/8620) [#8622](https://github.com/vitejs/vite/issues/8622)
* fix: allow cache overlap in parallel builds (#8592) ([2dd0b49](https://github.com/vitejs/vite/commit/2dd0b49)), closes [#8592](https://github.com/vitejs/vite/issues/8592)
* fix: avoid replacing defines and NODE_ENV in optimized deps (fix #8593) (#8606) ([739175b](https://github.com/vitejs/vite/commit/739175b)), closes [#8593](https://github.com/vitejs/vite/issues/8593) [#8606](https://github.com/vitejs/vite/issues/8606)
* fix: sequential injection of tags in transformIndexHtml (#5851) (#6901) ([649c7f6](https://github.com/vitejs/vite/commit/649c7f6)), closes [#5851](https://github.com/vitejs/vite/issues/5851) [#6901](https://github.com/vitejs/vite/issues/6901)
* fix(asset): respect assetFileNames if rollupOptions.output is an array (#8561) ([4e6c26f](https://github.com/vitejs/vite/commit/4e6c26f)), closes [#8561](https://github.com/vitejs/vite/issues/8561)
* fix(css): escape pattern chars from base path in postcss dir-dependency messages (#7081) ([5151e74](https://github.com/vitejs/vite/commit/5151e74)), closes [#7081](https://github.com/vitejs/vite/issues/7081)
* fix(optimizer): browser mapping for yarn pnp (#6493) ([c1c7af3](https://github.com/vitejs/vite/commit/c1c7af3)), closes [#6493](https://github.com/vitejs/vite/issues/6493)
* fix: add missed JPEG file extensions to `KNOWN_ASSET_TYPES` (#8565) ([2dfc015](https://github.com/vitejs/vite/commit/2dfc015)), closes [#8565](https://github.com/vitejs/vite/issues/8565)
* fix: default export module transformation for vitest spy (#8567) ([d357e33](https://github.com/vitejs/vite/commit/d357e33)), closes [#8567](https://github.com/vitejs/vite/issues/8567)
* fix: default host to `localhost` instead of `127.0.0.1` (#8543) ([49c0896](https://github.com/vitejs/vite/commit/49c0896)), closes [#8543](https://github.com/vitejs/vite/issues/8543)
* fix: dont handle sigterm in middleware mode (#8550) ([c6f43dd](https://github.com/vitejs/vite/commit/c6f43dd)), closes [#8550](https://github.com/vitejs/vite/issues/8550)
* fix: mime missing extensions (#8568) ([acf3024](https://github.com/vitejs/vite/commit/acf3024)), closes [#8568](https://github.com/vitejs/vite/issues/8568)
* fix: objurl for type module, and concurrent tests (#8541) ([26ecd5a](https://github.com/vitejs/vite/commit/26ecd5a)), closes [#8541](https://github.com/vitejs/vite/issues/8541)
* fix: outdated optimized dep removed from module graph (#8533) ([3f4d22d](https://github.com/vitejs/vite/commit/3f4d22d)), closes [#8533](https://github.com/vitejs/vite/issues/8533)
* fix(config): only rewrite .js loader in `loadConfigFromBundledFile` (#8556) ([2548dd3](https://github.com/vitejs/vite/commit/2548dd3)), closes [#8556](https://github.com/vitejs/vite/issues/8556)
* fix(deps): update all non-major dependencies (#8558) ([9a1fd4c](https://github.com/vitejs/vite/commit/9a1fd4c)), closes [#8558](https://github.com/vitejs/vite/issues/8558)
* fix(ssr): dont replace rollup input (#7275) ([9a88afa](https://github.com/vitejs/vite/commit/9a88afa)), closes [#7275](https://github.com/vitejs/vite/issues/7275)
* fix: deps optimizer idle logic for workers (fix #8479) (#8511) ([1e05548](https://github.com/vitejs/vite/commit/1e05548)), closes [#8479](https://github.com/vitejs/vite/issues/8479) [#8511](https://github.com/vitejs/vite/issues/8511)
* fix: not match \n when injecting esbuild helpers (#8414) ([5a57626](https://github.com/vitejs/vite/commit/5a57626)), closes [#8414](https://github.com/vitejs/vite/issues/8414)
* fix: respect optimize deps entries (#8489) ([fba82d0](https://github.com/vitejs/vite/commit/fba82d0)), closes [#8489](https://github.com/vitejs/vite/issues/8489)
* fix(optimizer): encode `_` and `.` in different way (#8508) ([9065b37](https://github.com/vitejs/vite/commit/9065b37)), closes [#8508](https://github.com/vitejs/vite/issues/8508)
* fix(optimizer): external require-import conversion (fixes #2492, #3409) (#8459) ([1061bbd](https://github.com/vitejs/vite/commit/1061bbd)), closes [#2492](https://github.com/vitejs/vite/issues/2492) [#3409](https://github.com/vitejs/vite/issues/3409) [#8459](https://github.com/vitejs/vite/issues/8459)
* fix: make array `acornInjectPlugins` work (fixes #8410) (#8415) ([08d594b](https://github.com/vitejs/vite/commit/08d594b)), closes [#8410](https://github.com/vitejs/vite/issues/8410) [#8415](https://github.com/vitejs/vite/issues/8415)
* fix: SSR deep imports externalization (fixes #8420) (#8421) ([89d6711](https://github.com/vitejs/vite/commit/89d6711)), closes [#8420](https://github.com/vitejs/vite/issues/8420) [#8421](https://github.com/vitejs/vite/issues/8421)
* fix: `import.meta.accept()` -> `import.meta.hot.accept()` (#8361) ([c5185cf](https://github.com/vitejs/vite/commit/c5185cf)), closes [#8361](https://github.com/vitejs/vite/issues/8361)
* fix: return type of `handleHMRUpdate` (#8367) ([79d5ce1](https://github.com/vitejs/vite/commit/79d5ce1)), closes [#8367](https://github.com/vitejs/vite/issues/8367)
* fix: sourcemap source point to null (#8299) ([356b896](https://github.com/vitejs/vite/commit/356b896)), closes [#8299](https://github.com/vitejs/vite/issues/8299)
* fix: ssr-manifest no base (#8371) ([37eb5b3](https://github.com/vitejs/vite/commit/37eb5b3)), closes [#8371](https://github.com/vitejs/vite/issues/8371)
* fix(deps): update all non-major dependencies (#8391) ([842f995](https://github.com/vitejs/vite/commit/842f995)), closes [#8391](https://github.com/vitejs/vite/issues/8391)
* fix: preserve annotations during build deps optimization (#8358) ([334cd9f](https://github.com/vitejs/vite/commit/334cd9f)), closes [#8358](https://github.com/vitejs/vite/issues/8358)
* fix: missing types for `es-module-lexer` (fixes #8349) (#8352) ([df2cc3d](https://github.com/vitejs/vite/commit/df2cc3d)), closes [#8349](https://github.com/vitejs/vite/issues/8349) [#8352](https://github.com/vitejs/vite/issues/8352)
* fix(optimizer): transpile before calling `transformGlobImport` (#8343) ([1dbc7cc](https://github.com/vitejs/vite/commit/1dbc7cc)), closes [#8343](https://github.com/vitejs/vite/issues/8343)
* fix(deps): update all non-major dependencies (#8281) ([c68db4d](https://github.com/vitejs/vite/commit/c68db4d)), closes [#8281](https://github.com/vitejs/vite/issues/8281)
* fix: expose client dist in `exports` (#8324) ([689adc0](https://github.com/vitejs/vite/commit/689adc0)), closes [#8324](https://github.com/vitejs/vite/issues/8324)
* fix(cjs): build cjs for `loadEnv` (#8305) ([80dd2df](https://github.com/vitejs/vite/commit/80dd2df)), closes [#8305](https://github.com/vitejs/vite/issues/8305)
* fix: correctly replace process.env.NODE_ENV (#8283) ([ec52baa](https://github.com/vitejs/vite/commit/ec52baa)), closes [#8283](https://github.com/vitejs/vite/issues/8283)
* fix: dev sourcemap (#8269) ([505f75e](https://github.com/vitejs/vite/commit/505f75e)), closes [#8269](https://github.com/vitejs/vite/issues/8269)
* fix: glob types (#8257) ([03b227e](https://github.com/vitejs/vite/commit/03b227e)), closes [#8257](https://github.com/vitejs/vite/issues/8257)
* fix: srcset handling in html (#6419) ([a0ee4ff](https://github.com/vitejs/vite/commit/a0ee4ff)), closes [#6419](https://github.com/vitejs/vite/issues/6419)
* fix: support set NODE_ENV in scripts when custom mode option (#8218) ([adcf041](https://github.com/vitejs/vite/commit/adcf041)), closes [#8218](https://github.com/vitejs/vite/issues/8218)
* fix(hmr): catch thrown errors when connecting to hmr websocket (#7111) ([4bc9284](https://github.com/vitejs/vite/commit/4bc9284)), closes [#7111](https://github.com/vitejs/vite/issues/7111)
* fix(plugin-legacy): respect `entryFileNames` for polyfill chunks (#8247) ([baa9632](https://github.com/vitejs/vite/commit/baa9632)), closes [#8247](https://github.com/vitejs/vite/issues/8247)
* fix(plugin-react): broken optimized deps dir check (#8255) ([9e2a1ea](https://github.com/vitejs/vite/commit/9e2a1ea)), closes [#8255](https://github.com/vitejs/vite/issues/8255)
* fix!: do not fixStacktrace by default (#7995) ([23f8e08](https://github.com/vitejs/vite/commit/23f8e08)), closes [#7995](https://github.com/vitejs/vite/issues/7995)
* fix(glob): properly handles tailing comma (#8181) ([462be8e](https://github.com/vitejs/vite/commit/462be8e)), closes [#8181](https://github.com/vitejs/vite/issues/8181)
* fix: add hash to lib chunk names (#7190) ([c81cedf](https://github.com/vitejs/vite/commit/c81cedf)), closes [#7190](https://github.com/vitejs/vite/issues/7190)
* fix: allow css to be written for systemjs output (#5902) ([780b4f5](https://github.com/vitejs/vite/commit/780b4f5)), closes [#5902](https://github.com/vitejs/vite/issues/5902)
* fix: client full reload (#8018) ([2f478ed](https://github.com/vitejs/vite/commit/2f478ed)), closes [#8018](https://github.com/vitejs/vite/issues/8018)
* fix: handle optimize failure (#8006) ([ba95a2a](https://github.com/vitejs/vite/commit/ba95a2a)), closes [#8006](https://github.com/vitejs/vite/issues/8006)
* fix: increase default HTTPS dev server session memory limit (#6207) ([f895f94](https://github.com/vitejs/vite/commit/f895f94)), closes [#6207](https://github.com/vitejs/vite/issues/6207)
* fix: relative path html (#8122) ([d0deac0](https://github.com/vitejs/vite/commit/d0deac0)), closes [#8122](https://github.com/vitejs/vite/issues/8122)
* fix: Remove ssrError when invalidating a module (#8124) ([a543220](https://github.com/vitejs/vite/commit/a543220)), closes [#8124](https://github.com/vitejs/vite/issues/8124)
* fix: remove useless `/__vite_ping` handler (#8133) ([d607b2b](https://github.com/vitejs/vite/commit/d607b2b)), closes [#8133](https://github.com/vitejs/vite/issues/8133)
* fix: typo in #8121 (#8143) ([c32e3ac](https://github.com/vitejs/vite/commit/c32e3ac)), closes [#8121](https://github.com/vitejs/vite/issues/8121) [#8143](https://github.com/vitejs/vite/issues/8143)
* fix: use Vitest for unit testing, clean regex bug (#8040) ([63cd53d](https://github.com/vitejs/vite/commit/63cd53d)), closes [#8040](https://github.com/vitejs/vite/issues/8040)
* fix: Vite cannot load configuration files in the link directory (#4180) (#4181) ([a3fa1a3](https://github.com/vitejs/vite/commit/a3fa1a3)), closes [#4180](https://github.com/vitejs/vite/issues/4180) [#4181](https://github.com/vitejs/vite/issues/4181)
* fix: vite client types (#7877) ([0e67fe8](https://github.com/vitejs/vite/commit/0e67fe8)), closes [#7877](https://github.com/vitejs/vite/issues/7877)
* fix: warn for unresolved css in html (#7911) ([2b58cb3](https://github.com/vitejs/vite/commit/2b58cb3)), closes [#7911](https://github.com/vitejs/vite/issues/7911)
* fix(build): use crossorigin for module preloaded ([85cab70](https://github.com/vitejs/vite/commit/85cab70))
* fix(client): wait on the socket host, not the ping host (#6819) ([ae56e47](https://github.com/vitejs/vite/commit/ae56e47)), closes [#6819](https://github.com/vitejs/vite/issues/6819)
* fix(css): hoist external @import for non-split css (#8022) ([5280908](https://github.com/vitejs/vite/commit/5280908)), closes [#8022](https://github.com/vitejs/vite/issues/8022)
* fix(css): preserve dynamic import css code (fix #5348) (#7746) ([12d0cc0](https://github.com/vitejs/vite/commit/12d0cc0)), closes [#5348](https://github.com/vitejs/vite/issues/5348) [#7746](https://github.com/vitejs/vite/issues/7746)
* fix(glob): wrap glob compile output in function invocation (#3682) ([bb603d3](https://github.com/vitejs/vite/commit/bb603d3)), closes [#3682](https://github.com/vitejs/vite/issues/3682)
* fix(lib): enable inlineDynamicImports for umd and iife (#8126) ([272a252](https://github.com/vitejs/vite/commit/272a252)), closes [#8126](https://github.com/vitejs/vite/issues/8126)
* fix(lib): use proper extension (#6827) ([34df307](https://github.com/vitejs/vite/commit/34df307)), closes [#6827](https://github.com/vitejs/vite/issues/6827)
* fix(ssr): avoid transforming json file in ssrTransform (#6597) ([a709440](https://github.com/vitejs/vite/commit/a709440)), closes [#6597](https://github.com/vitejs/vite/issues/6597)
* fix(lib)!: remove format prefixes for cjs and esm (#8107) ([ad8c3b1](https://github.com/vitejs/vite/commit/ad8c3b1)), closes [#8107](https://github.com/vitejs/vite/issues/8107)


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
