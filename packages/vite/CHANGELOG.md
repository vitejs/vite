## 4.3.0-beta.3 (2023-04-07)

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
