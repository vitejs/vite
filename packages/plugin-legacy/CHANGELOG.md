## 5.0.0-beta.2 (2023-10-09)

* fix(legacy)!: should rename `x.[hash].js` to `x-legacy.[hash].js` (#11599) ([e7d7a6f](https://github.com/vitejs/vite/commit/e7d7a6f)), closes [#11599](https://github.com/vitejs/vite/issues/11599)
* fix(deps): update all non-major dependencies (#14510) ([eb204fd](https://github.com/vitejs/vite/commit/eb204fd)), closes [#14510](https://github.com/vitejs/vite/issues/14510)
* fix(legacy): fix broken build when renderModernChunks=false & polyfills=false (fix #14324) (#14346) ([27e5b11](https://github.com/vitejs/vite/commit/27e5b11)), closes [#14324](https://github.com/vitejs/vite/issues/14324) [#14346](https://github.com/vitejs/vite/issues/14346)



## 5.0.0-beta.1 (2023-09-25)

* fix(deps): update all non-major dependencies (#14460) ([b77bff0](https://github.com/vitejs/vite/commit/b77bff0)), closes [#14460](https://github.com/vitejs/vite/issues/14460)
* fix(legacy): add guard to modern polyfill chunk (#13719) ([945dc4d](https://github.com/vitejs/vite/commit/945dc4d)), closes [#13719](https://github.com/vitejs/vite/issues/13719)
* fix(legacy): modern polyfill autodetection was injecting more polyfills than needed (#14428) ([1c2e941](https://github.com/vitejs/vite/commit/1c2e941)), closes [#14428](https://github.com/vitejs/vite/issues/14428)
* fix(legacy): suppress babel warning during polyfill scan (#14425) ([aae3a83](https://github.com/vitejs/vite/commit/aae3a83)), closes [#14425](https://github.com/vitejs/vite/issues/14425)
* fix(plugin-legacy): ensure correct typing for node esm (#13892) ([d914a9d](https://github.com/vitejs/vite/commit/d914a9d)), closes [#13892](https://github.com/vitejs/vite/issues/13892)
* refactor(legacy)!: remove `ignoreBrowserslistConfig` option (#14429) ([941bb16](https://github.com/vitejs/vite/commit/941bb16)), closes [#14429](https://github.com/vitejs/vite/issues/14429)



## 5.0.0-beta.0 (2023-09-19)

* fix(deps): update all non-major dependencies (#14092) ([68638f7](https://github.com/vitejs/vite/commit/68638f7)), closes [#14092](https://github.com/vitejs/vite/issues/14092)
* chore: upgrade babel and release-scripts (#14330) ([b361ffa](https://github.com/vitejs/vite/commit/b361ffa)), closes [#14330](https://github.com/vitejs/vite/issues/14330)
* chore(deps): update all non-major dependencies (#13938) ([a1b519e](https://github.com/vitejs/vite/commit/a1b519e)), closes [#13938](https://github.com/vitejs/vite/issues/13938)
* chore(eslint): allow type annotations (#13920) ([d1264fd](https://github.com/vitejs/vite/commit/d1264fd)), closes [#13920](https://github.com/vitejs/vite/issues/13920)
* docs(legacy): correct `modernPolyfills` description (#14233) ([a57f388](https://github.com/vitejs/vite/commit/a57f388)), closes [#14233](https://github.com/vitejs/vite/issues/14233)
* docs(plugin-legacy): fix typo (#13936) ([28ddd43](https://github.com/vitejs/vite/commit/28ddd43)), closes [#13936](https://github.com/vitejs/vite/issues/13936)
* feat!: bump minimum node version to 18 (#14030) ([2c1a45c](https://github.com/vitejs/vite/commit/2c1a45c)), closes [#14030](https://github.com/vitejs/vite/issues/14030)
* perf: use magic-string hires boundary for sourcemaps (#13971) ([b9a8d65](https://github.com/vitejs/vite/commit/b9a8d65)), closes [#13971](https://github.com/vitejs/vite/issues/13971)



## <small>4.1.1 (2023-07-20)</small>

* fix(deps): update all non-major dependencies (#13758) ([8ead116](https://github.com/vitejs/vite/commit/8ead116)), closes [#13758](https://github.com/vitejs/vite/issues/13758)
* fix(deps): update all non-major dependencies (#13872) ([975a631](https://github.com/vitejs/vite/commit/975a631)), closes [#13872](https://github.com/vitejs/vite/issues/13872)



## 4.1.0 (2023-07-06)

* feat(plugin-legacy): add option to output only legacy builds (#10139) ([931b24f](https://github.com/vitejs/vite/commit/931b24f)), closes [#10139](https://github.com/vitejs/vite/issues/10139)
* fix(deps): update all non-major dependencies (#13701) ([02c6bc3](https://github.com/vitejs/vite/commit/02c6bc3)), closes [#13701](https://github.com/vitejs/vite/issues/13701)



## <small>4.0.5 (2023-06-21)</small>

* chore: add funding field (#13585) ([2501627](https://github.com/vitejs/vite/commit/2501627)), closes [#13585](https://github.com/vitejs/vite/issues/13585)
* chore(deps): update all non-major dependencies (#13553) ([3ea0534](https://github.com/vitejs/vite/commit/3ea0534)), closes [#13553](https://github.com/vitejs/vite/issues/13553)
* fix(deps): update all non-major dependencies (#13059) ([123ef4c](https://github.com/vitejs/vite/commit/123ef4c)), closes [#13059](https://github.com/vitejs/vite/issues/13059)
* fix(deps): update all non-major dependencies (#13488) ([bd09248](https://github.com/vitejs/vite/commit/bd09248)), closes [#13488](https://github.com/vitejs/vite/issues/13488)
* docs(legacy): add test case to ensure correct csp hashes in readme.md (#13384) ([bf0cd25](https://github.com/vitejs/vite/commit/bf0cd25)), closes [#13384](https://github.com/vitejs/vite/issues/13384)



## <small>4.0.4 (2023-05-24)</small>

* fix(legacy): import `@babel/preset-env` (#12961) ([d53c650](https://github.com/vitejs/vite/commit/d53c650)), closes [#12961](https://github.com/vitejs/vite/issues/12961)
* chore(deps): update all non-major dependencies (#12805) ([5731ac9](https://github.com/vitejs/vite/commit/5731ac9)), closes [#12805](https://github.com/vitejs/vite/issues/12805)



## <small>4.0.3 (2023-04-25)</small>

* feat(plugin-legacy): support file protocol (#8524) ([7a87ff4](https://github.com/vitejs/vite/commit/7a87ff4)), closes [#8524](https://github.com/vitejs/vite/issues/8524)
* refactor(eslint): migrate to `eslint-plugin-n` (#12895) ([62ebe28](https://github.com/vitejs/vite/commit/62ebe28)), closes [#12895](https://github.com/vitejs/vite/issues/12895)
* fix(deps): update all non-major dependencies (#12389) ([3e60b77](https://github.com/vitejs/vite/commit/3e60b77)), closes [#12389](https://github.com/vitejs/vite/issues/12389)



## <small>4.0.2 (2023-03-16)</small>

* chore(deps): update all non-major dependencies (#12299) ([b41336e](https://github.com/vitejs/vite/commit/b41336e)), closes [#12299](https://github.com/vitejs/vite/issues/12299)
* chore(deps): update rollup to 3.17.2 (#12110) ([e54ffbd](https://github.com/vitejs/vite/commit/e54ffbd)), closes [#12110](https://github.com/vitejs/vite/issues/12110)
* fix(deps): update all non-major dependencies (#12036) ([48150f2](https://github.com/vitejs/vite/commit/48150f2)), closes [#12036](https://github.com/vitejs/vite/issues/12036)
* fix(plugin-legacy): no `build.target` override on SSR build (#12171) ([a1019f8](https://github.com/vitejs/vite/commit/a1019f8)), closes [#12171](https://github.com/vitejs/vite/issues/12171)
* docs(plugin-legacy): outdated csp hash (fix #12112) (#12118) ([5f7f5dc](https://github.com/vitejs/vite/commit/5f7f5dc)), closes [#12112](https://github.com/vitejs/vite/issues/12112) [#12118](https://github.com/vitejs/vite/issues/12118)



## <small>4.0.1 (2023-02-02)</small>

* fix(legacy): fix browserslist import, close https://github.com/vitejs/vite/issues/11898 (#11899) ([9241d08](https://github.com/vitejs/vite/commit/9241d08)), closes [#11899](https://github.com/vitejs/vite/issues/11899)



## 4.0.0 (2023-02-02)

* feat(legacy)!: bump modern target to support async generator (#11896) ([55b9711](https://github.com/vitejs/vite/commit/55b9711)), closes [#11896](https://github.com/vitejs/vite/issues/11896)
* fix(plugin-legacy)!: support browserslist and update default target (#11318) ([d5b8f86](https://github.com/vitejs/vite/commit/d5b8f86)), closes [#11318](https://github.com/vitejs/vite/issues/11318)
* fix: typo (#11283) ([bf234a6](https://github.com/vitejs/vite/commit/bf234a6)), closes [#11283](https://github.com/vitejs/vite/issues/11283)
* fix(deps): update all non-major dependencies (#11846) ([5d55083](https://github.com/vitejs/vite/commit/5d55083)), closes [#11846](https://github.com/vitejs/vite/issues/11846)
* fix(plugin-legacy): legacy sourcemap not generate (fix #11693) (#11841) ([2ff5930](https://github.com/vitejs/vite/commit/2ff5930)), closes [#11693](https://github.com/vitejs/vite/issues/11693) [#11841](https://github.com/vitejs/vite/issues/11841)
* chore: enable `@typescript-eslint/ban-ts-comment` (#11326) ([e58a4f0](https://github.com/vitejs/vite/commit/e58a4f0)), closes [#11326](https://github.com/vitejs/vite/issues/11326)
* chore: update packages' (vite, vite-legacy) keywords (#11402) ([a56bc34](https://github.com/vitejs/vite/commit/a56bc34)), closes [#11402](https://github.com/vitejs/vite/issues/11402)
* chore(deps): update all non-major dependencies (#11419) ([896475d](https://github.com/vitejs/vite/commit/896475d)), closes [#11419](https://github.com/vitejs/vite/issues/11419)
* chore(deps): update all non-major dependencies (#11787) ([271394f](https://github.com/vitejs/vite/commit/271394f)), closes [#11787](https://github.com/vitejs/vite/issues/11787)
* refactor(plugin-legacy): optimize cspHashes array (#11734) ([b1a8e58](https://github.com/vitejs/vite/commit/b1a8e58)), closes [#11734](https://github.com/vitejs/vite/issues/11734)



## <small>3.0.1 (2022-12-09)</small>

* chore: update vite and plugins to stable (#11278) ([026f41e](https://github.com/vitejs/vite/commit/026f41e)), closes [#11278](https://github.com/vitejs/vite/issues/11278)



## 3.0.0 (2022-12-09)

* chore: enable prettier trailing commas (#11167) ([134ce68](https://github.com/vitejs/vite/commit/134ce68)), closes [#11167](https://github.com/vitejs/vite/issues/11167)
* chore(deps): update all non-major dependencies (#11182) ([8b83089](https://github.com/vitejs/vite/commit/8b83089)), closes [#11182](https://github.com/vitejs/vite/issues/11182)



## 3.0.0-alpha.0 (2022-11-30)

* fix: support polyfill import paths containing an escaping char (e.g. '\') (#10859) ([7ac2535](https://github.com/vitejs/vite/commit/7ac2535)), closes [#10859](https://github.com/vitejs/vite/issues/10859)
* fix(deps): update all non-major dependencies (#10804) ([f686afa](https://github.com/vitejs/vite/commit/f686afa)), closes [#10804](https://github.com/vitejs/vite/issues/10804)
* fix(deps): update all non-major dependencies (#11091) ([073a4bf](https://github.com/vitejs/vite/commit/073a4bf)), closes [#11091](https://github.com/vitejs/vite/issues/11091)
* chore(deps): update all non-major dependencies (#10910) ([f6ad607](https://github.com/vitejs/vite/commit/f6ad607)), closes [#10910](https://github.com/vitejs/vite/issues/10910)
* chore(deps): update all non-major dependencies (#11006) ([96f2e98](https://github.com/vitejs/vite/commit/96f2e98)), closes [#11006](https://github.com/vitejs/vite/issues/11006)
* feat: align default chunk and asset file names with rollup (#10927) ([cc2adb3](https://github.com/vitejs/vite/commit/cc2adb3)), closes [#10927](https://github.com/vitejs/vite/issues/10927)
* feat: rollup 3 (#9870) ([beb7166](https://github.com/vitejs/vite/commit/beb7166)), closes [#9870](https://github.com/vitejs/vite/issues/9870)



## <small>2.3.1 (2022-11-07)</small>

* chore(deps): update all non-major dependencies (#10725) ([22cfad8](https://github.com/vitejs/vite/commit/22cfad8)), closes [#10725](https://github.com/vitejs/vite/issues/10725)



## 2.3.0 (2022-10-26)

* fix(deps): update all non-major dependencies (#10610) ([bb95467](https://github.com/vitejs/vite/commit/bb95467)), closes [#10610](https://github.com/vitejs/vite/issues/10610)
* chore(deps): update all non-major dependencies (#10393) ([f519423](https://github.com/vitejs/vite/commit/f519423)), closes [#10393](https://github.com/vitejs/vite/issues/10393)
* chore(deps): update all non-major dependencies (#10488) ([15aa827](https://github.com/vitejs/vite/commit/15aa827)), closes [#10488](https://github.com/vitejs/vite/issues/10488)



## 2.3.0-beta.0 (2022-10-05)

* fix(deps): update all non-major dependencies (#10160) ([6233c83](https://github.com/vitejs/vite/commit/6233c83)), closes [#10160](https://github.com/vitejs/vite/issues/10160)
* fix(deps): update all non-major dependencies (#10246) ([81d4d04](https://github.com/vitejs/vite/commit/81d4d04)), closes [#10246](https://github.com/vitejs/vite/issues/10246)
* fix(deps): update all non-major dependencies (#10316) ([a38b450](https://github.com/vitejs/vite/commit/a38b450)), closes [#10316](https://github.com/vitejs/vite/issues/10316)
* fix(legacy): don't force set `build.target` when `renderLegacyChunks=false` (fixes #10201) (#10220) ([7f548e8](https://github.com/vitejs/vite/commit/7f548e8)), closes [#10201](https://github.com/vitejs/vite/issues/10201) [#10220](https://github.com/vitejs/vite/issues/10220)
* refactor(types): bundle client types (#9966) ([da632bf](https://github.com/vitejs/vite/commit/da632bf)), closes [#9966](https://github.com/vitejs/vite/issues/9966)



## 2.2.0 (2022-09-19)

* docs(plugin-legacy): fix Vite default target (#10158) ([62ff788](https://github.com/vitejs/vite/commit/62ff788)), closes [#10158](https://github.com/vitejs/vite/issues/10158)
* fix(deps): update all non-major dependencies (#10077) ([caf00c8](https://github.com/vitejs/vite/commit/caf00c8)), closes [#10077](https://github.com/vitejs/vite/issues/10077)
* fix(deps): update all non-major dependencies (#9985) ([855f2f0](https://github.com/vitejs/vite/commit/855f2f0)), closes [#9985](https://github.com/vitejs/vite/issues/9985)
* fix(plugin-legacy): force set `build.target` (#10072) ([a13a7eb](https://github.com/vitejs/vite/commit/a13a7eb)), closes [#10072](https://github.com/vitejs/vite/issues/10072)



## 2.1.0 (2022-09-05)




## 2.1.0-beta.0 (2022-08-29)

* fix(deps): update all non-major dependencies (#9888) ([e35a58b](https://github.com/vitejs/vite/commit/e35a58b)), closes [#9888](https://github.com/vitejs/vite/issues/9888)
* fix(plugin-legacy): prevent global process.env.NODE_ENV mutation (#9741) ([a8279af](https://github.com/vitejs/vite/commit/a8279af)), closes [#9741](https://github.com/vitejs/vite/issues/9741)
* chore(deps): update all non-major dependencies (#9675) ([4e56e87](https://github.com/vitejs/vite/commit/4e56e87)), closes [#9675](https://github.com/vitejs/vite/issues/9675)
* chore(deps): update all non-major dependencies (#9778) ([aceaefc](https://github.com/vitejs/vite/commit/aceaefc)), closes [#9778](https://github.com/vitejs/vite/issues/9778)
* refactor(legacy): build polyfill chunk (#9639) ([7ba0c9f](https://github.com/vitejs/vite/commit/7ba0c9f)), closes [#9639](https://github.com/vitejs/vite/issues/9639)
* refactor(legacy): remove code for Vite 2 (#9640) ([b1bbc5b](https://github.com/vitejs/vite/commit/b1bbc5b)), closes [#9640](https://github.com/vitejs/vite/issues/9640)



## <small>2.0.1 (2022-08-11)</small>

* fix: mention that Node.js 13/15 support is dropped (fixes #9113) (#9116) ([2826303](https://github.com/vitejs/vite/commit/2826303)), closes [#9113](https://github.com/vitejs/vite/issues/9113) [#9116](https://github.com/vitejs/vite/issues/9116)
* fix(deps): update all non-major dependencies (#9176) ([31d3b70](https://github.com/vitejs/vite/commit/31d3b70)), closes [#9176](https://github.com/vitejs/vite/issues/9176)
* fix(deps): update all non-major dependencies (#9575) ([8071325](https://github.com/vitejs/vite/commit/8071325)), closes [#9575](https://github.com/vitejs/vite/issues/9575)
* fix(legacy): skip esbuild transform for systemjs (#9635) ([ac16abd](https://github.com/vitejs/vite/commit/ac16abd)), closes [#9635](https://github.com/vitejs/vite/issues/9635)
* chore: fix code typos (#9033) ([ed02861](https://github.com/vitejs/vite/commit/ed02861)), closes [#9033](https://github.com/vitejs/vite/issues/9033)
* chore(deps): update all non-major dependencies (#9347) ([2fcb027](https://github.com/vitejs/vite/commit/2fcb027)), closes [#9347](https://github.com/vitejs/vite/issues/9347)
* chore(deps): update all non-major dependencies (#9478) ([c530d16](https://github.com/vitejs/vite/commit/c530d16)), closes [#9478](https://github.com/vitejs/vite/issues/9478)



## 2.0.0 (2022-07-13)

* chore: 3.0 release notes and bump peer deps (#9072) ([427ba26](https://github.com/vitejs/vite/commit/427ba26)), closes [#9072](https://github.com/vitejs/vite/issues/9072)
* chore(deps): update all non-major dependencies (#9022) ([6342140](https://github.com/vitejs/vite/commit/6342140)), closes [#9022](https://github.com/vitejs/vite/issues/9022)
* docs: cleanup changes (#8989) ([07aef1b](https://github.com/vitejs/vite/commit/07aef1b)), closes [#8989](https://github.com/vitejs/vite/issues/8989)



## 2.0.0-beta.1 (2022-07-06)

* fix(deps): update all non-major dependencies (#8802) ([a4a634d](https://github.com/vitejs/vite/commit/a4a634d)), closes [#8802](https://github.com/vitejs/vite/issues/8802)
* feat: experimental.renderBuiltUrl (revised build base options) (#8762) ([895a7d6](https://github.com/vitejs/vite/commit/895a7d6)), closes [#8762](https://github.com/vitejs/vite/issues/8762)
* chore: use `tsx` directly instead of indirect `esno` (#8773) ([f018f13](https://github.com/vitejs/vite/commit/f018f13)), closes [#8773](https://github.com/vitejs/vite/issues/8773)



## 2.0.0-beta.0 (2022-06-21)

* feat: bump minimum node version to 14.18.0 (#8662) ([8a05432](https://github.com/vitejs/vite/commit/8a05432)), closes [#8662](https://github.com/vitejs/vite/issues/8662)
* feat: experimental.buildAdvancedBaseOptions (#8450) ([8ef7333](https://github.com/vitejs/vite/commit/8ef7333)), closes [#8450](https://github.com/vitejs/vite/issues/8450)
* chore: use node prefix (#8309) ([60721ac](https://github.com/vitejs/vite/commit/60721ac)), closes [#8309](https://github.com/vitejs/vite/issues/8309)
* chore(deps): update all non-major dependencies (#8669) ([628863d](https://github.com/vitejs/vite/commit/628863d)), closes [#8669](https://github.com/vitejs/vite/issues/8669)
* fix(plugin-legacy): prevent esbuild injecting arrow function (#8660) ([c0e74e5](https://github.com/vitejs/vite/commit/c0e74e5)), closes [#8660](https://github.com/vitejs/vite/issues/8660)



## 2.0.0-alpha.2 (2022-06-19)

* fix(build): use crossorigin for nomodule (#8322) ([7f59989](https://github.com/vitejs/vite/commit/7f59989)), closes [#8322](https://github.com/vitejs/vite/issues/8322)
* fix(deps): update all non-major dependencies (#8281) ([c68db4d](https://github.com/vitejs/vite/commit/c68db4d)), closes [#8281](https://github.com/vitejs/vite/issues/8281)
* fix(deps): update all non-major dependencies (#8391) ([842f995](https://github.com/vitejs/vite/commit/842f995)), closes [#8391](https://github.com/vitejs/vite/issues/8391)
* fix(plugin-legacy): disable babel.compact when minify is disabled (#8244) ([742188c](https://github.com/vitejs/vite/commit/742188c)), closes [#8244](https://github.com/vitejs/vite/issues/8244)
* fix(plugin-legacy): don't include SystemJS in modern polyfills (#6902) ([eb47b1e](https://github.com/vitejs/vite/commit/eb47b1e)), closes [#6902](https://github.com/vitejs/vite/issues/6902)
* fix(plugin-legacy): empty base makes import fail (fixes #4212) (#8387) ([1a16f12](https://github.com/vitejs/vite/commit/1a16f12)), closes [#4212](https://github.com/vitejs/vite/issues/4212) [#8387](https://github.com/vitejs/vite/issues/8387)
* fix(plugin-legacy): modern polyfill latest features (fixes #8399) (#8408) ([ed25817](https://github.com/vitejs/vite/commit/ed25817)), closes [#8399](https://github.com/vitejs/vite/issues/8399) [#8408](https://github.com/vitejs/vite/issues/8408)
* fix(plugin-legacy): prevent failed to load module (#8285) ([d671811](https://github.com/vitejs/vite/commit/d671811)), closes [#8285](https://github.com/vitejs/vite/issues/8285)
* fix(plugin-legacy): respect `entryFileNames` for polyfill chunks (#8247) ([baa9632](https://github.com/vitejs/vite/commit/baa9632)), closes [#8247](https://github.com/vitejs/vite/issues/8247)
* chore: enable `@typescript-eslint/explicit-module-boundary-types` (#8372) ([104caf9](https://github.com/vitejs/vite/commit/104caf9)), closes [#8372](https://github.com/vitejs/vite/issues/8372)
* chore: update major deps (#8572) ([0e20949](https://github.com/vitejs/vite/commit/0e20949)), closes [#8572](https://github.com/vitejs/vite/issues/8572)
* chore: use `esno` to replace `ts-node` (#8162) ([c18a5f3](https://github.com/vitejs/vite/commit/c18a5f3)), closes [#8162](https://github.com/vitejs/vite/issues/8162)
* chore(deps): update all non-major dependencies (#8474) ([6d0ede7](https://github.com/vitejs/vite/commit/6d0ede7)), closes [#8474](https://github.com/vitejs/vite/issues/8474)
* refactor!: make terser an optional dependency (#8049) ([164f528](https://github.com/vitejs/vite/commit/164f528)), closes [#8049](https://github.com/vitejs/vite/issues/8049)
* refactor(plugin-legacy): improve default polyfill (#8312) ([4370d91](https://github.com/vitejs/vite/commit/4370d91)), closes [#8312](https://github.com/vitejs/vite/issues/8312)



## 2.0.0-alpha.1 (2022-05-19)

* fix: rewrite CJS specific funcs/vars in plugins (#8227) ([9baa70b](https://github.com/vitejs/vite/commit/9baa70b)), closes [#8227](https://github.com/vitejs/vite/issues/8227)
* fix(plugin-legacy): fail to get the fileName (#5250) ([c7fc1d4](https://github.com/vitejs/vite/commit/c7fc1d4)), closes [#5250](https://github.com/vitejs/vite/issues/5250)
* build!: bump targets (#8045) ([66efd69](https://github.com/vitejs/vite/commit/66efd69)), closes [#8045](https://github.com/vitejs/vite/issues/8045)
* feat!: relative base (#7644) ([09648c2](https://github.com/vitejs/vite/commit/09648c2)), closes [#7644](https://github.com/vitejs/vite/issues/7644)
* docs: use latest core-js unpkg link (#8190) ([102b678](https://github.com/vitejs/vite/commit/102b678)), closes [#8190](https://github.com/vitejs/vite/issues/8190)



## 2.0.0-alpha.0 (2022-05-13)

* chore: bump minors and rebuild lock (#8074) ([aeb5b74](https://github.com/vitejs/vite/commit/aeb5b74)), closes [#8074](https://github.com/vitejs/vite/issues/8074)
* chore: revert vitejs/vite#8152 (#8161) ([85b8b55](https://github.com/vitejs/vite/commit/85b8b55)), closes [vitejs/vite#8152](https://github.com/vitejs/vite/issues/8152) [#8161](https://github.com/vitejs/vite/issues/8161)
* chore: update plugins peer deps ([d57c23c](https://github.com/vitejs/vite/commit/d57c23c))
* chore: use `unbuild` to bundle plugins (#8139) ([638b168](https://github.com/vitejs/vite/commit/638b168)), closes [#8139](https://github.com/vitejs/vite/issues/8139)
* chore(deps): use `esno` to replace `ts-node` (#8152) ([2363bd3](https://github.com/vitejs/vite/commit/2363bd3)), closes [#8152](https://github.com/vitejs/vite/issues/8152)
* build!: remove node v12 support (#7833) ([eeac2d2](https://github.com/vitejs/vite/commit/eeac2d2)), closes [#7833](https://github.com/vitejs/vite/issues/7833)
* docs(plugin-legacy): remove regenerator-runtime note (#8007) ([834efe9](https://github.com/vitejs/vite/commit/834efe9)), closes [#8007](https://github.com/vitejs/vite/issues/8007)



## <small>1.8.2 (2022-05-02)</small>

* chore(deps): update all non-major dependencies (#7780) ([eba9d05](https://github.com/vitejs/vite/commit/eba9d05)), closes [#7780](https://github.com/vitejs/vite/issues/7780)
* chore(deps): update all non-major dependencies (#7847) ([e29d1d9](https://github.com/vitejs/vite/commit/e29d1d9)), closes [#7847](https://github.com/vitejs/vite/issues/7847)
* chore(deps): update all non-major dependencies (#7949) ([b877d30](https://github.com/vitejs/vite/commit/b877d30)), closes [#7949](https://github.com/vitejs/vite/issues/7949)
* refactor(legacy): remove unneeded dynamic import var init code (#7759) ([12a4e7d](https://github.com/vitejs/vite/commit/12a4e7d)), closes [#7759](https://github.com/vitejs/vite/issues/7759)



## <small>1.8.1 (2022-04-13)</small>

* fix(deps): update all non-major dependencies (#7668) ([485263c](https://github.com/vitejs/vite/commit/485263c)), closes [#7668](https://github.com/vitejs/vite/issues/7668)
* docs(legacy): note works in build only (#7596) ([f26b14a](https://github.com/vitejs/vite/commit/f26b14a)), closes [#7596](https://github.com/vitejs/vite/issues/7596)



## 1.8.0 (2022-03-30)

* fix(deps): update all non-major dependencies (#6782) ([e38be3e](https://github.com/vitejs/vite/commit/e38be3e)), closes [#6782](https://github.com/vitejs/vite/issues/6782)
* fix(deps): update all non-major dependencies (#7392) ([b63fc3b](https://github.com/vitejs/vite/commit/b63fc3b)), closes [#7392](https://github.com/vitejs/vite/issues/7392)
* fix(plugin-legacy): always fallback legacy build when CSP (#6535) ([a118a1d](https://github.com/vitejs/vite/commit/a118a1d)), closes [#6535](https://github.com/vitejs/vite/issues/6535)
* fix(plugin-legacy): polyfill latest features (#7514) ([cb388e2](https://github.com/vitejs/vite/commit/cb388e2)), closes [#7514](https://github.com/vitejs/vite/issues/7514)
* fix(plugin-legacy): require Vite 2.8.0 (#6272) (#6869) ([997b8f1](https://github.com/vitejs/vite/commit/997b8f1)), closes [#6272](https://github.com/vitejs/vite/issues/6272) [#6869](https://github.com/vitejs/vite/issues/6869)
* chore(deps): update all non-major dependencies (#6905) ([839665c](https://github.com/vitejs/vite/commit/839665c)), closes [#6905](https://github.com/vitejs/vite/issues/6905)
* docs(vite-legacy): Note about using `regenerator-runtime` in Content Security Policy environment (#7 ([0fd6422](https://github.com/vitejs/vite/commit/0fd6422)), closes [#7234](https://github.com/vitejs/vite/issues/7234)
* workflow: separate version bumping and publishing on release (#6879) ([fe8ef39](https://github.com/vitejs/vite/commit/fe8ef39)), closes [#6879](https://github.com/vitejs/vite/issues/6879)
* release: plugin-legacy@1.7.1 ([19a58dd](https://github.com/vitejs/vite/commit/19a58dd))



## [1.7.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.7.0...plugin-legacy@1.7.1) (2022-02-11)

### Bug Fixes

* require Vite 2.8.0 ([#6272](https://github.com/vitejs/vite/issues/6272)) ([#6869](https://github.com/vitejs/vite/issues/6869)) ([997b8f1](https://github.com/vitejs/vite/commit/997b8f11cb156cc374ae991875a09534b5489a93))



# [1.7.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.4...plugin-legacy@1.7.0) (2022-02-09)


### Bug Fixes

* don't force terser on non-legacy (fix [#6266](https://github.com/vitejs/vite/issues/6266)) ([#6272](https://github.com/vitejs/vite/issues/6272)) ([1da104e](https://github.com/vitejs/vite/commit/1da104e8597e2965313e8cd582d032bca551e4ee))
* **legacy:** fix conflict with the modern build on css emitting ([#6584](https://github.com/vitejs/vite/issues/6584)) ([f48255e](https://github.com/vitejs/vite/commit/f48255e6e0058e973b949fb4a2372974f0480e11)), closes [#3296](https://github.com/vitejs/vite/issues/3296) [#3317](https://github.com/vitejs/vite/issues/3317) [/github.com/vitejs/vite/commit/6bce1081991501f3779bff1a81e5dd1e63e5d38e#diff-2cfbd4f4d8c32727cd8e1a561cffbde0b384a3ce0789340440e144f9d64c10f6R262-R263](https://github.com//github.com/vitejs/vite/commit/6bce1081991501f3779bff1a81e5dd1e63e5d38e/issues/diff-2cfbd4f4d8c32727cd8e1a561cffbde0b384a3ce0789340440e144f9d64c10f6R262-R263)



## [1.6.4](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.3...plugin-legacy@1.6.4) (2021-12-07)



## [1.6.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.2...plugin-legacy@1.6.3) (2021-11-22)


### Bug Fixes

* **build:** resolve `rollupOptions.input` paths ([#5601](https://github.com/vitejs/vite/issues/5601)) ([5b6b016](https://github.com/vitejs/vite/commit/5b6b01693720290e8998b2613f0dcb2d699ee84f))



## [1.6.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.1...plugin-legacy@1.6.2) (2021-10-11)


### Features

* add `build.cssTarget` option ([#5132](https://github.com/vitejs/vite/issues/5132)) ([b17444f](https://github.com/vitejs/vite/commit/b17444fd97b02bc54410c8575e7d3cb25e4058c2)), closes [#4746](https://github.com/vitejs/vite/issues/4746) [#5070](https://github.com/vitejs/vite/issues/5070) [#4930](https://github.com/vitejs/vite/issues/4930)



## [1.6.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.0...plugin-legacy@1.6.1) (2021-10-05)


### Bug Fixes

* **plugin-legacy:** use terser as the default minifier ([#5168](https://github.com/vitejs/vite/issues/5168)) ([9ee7234](https://github.com/vitejs/vite/commit/9ee72343884a7d679767833f7a659bbca6b96595))



# [1.6.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.3...plugin-legacy@1.6.0) (2021-09-29)


### Bug Fixes

* **deps:** update all non-major dependencies ([#4545](https://github.com/vitejs/vite/issues/4545)) ([a44fd5d](https://github.com/vitejs/vite/commit/a44fd5d38679da0be2536103e83af730cda73a95))
* esbuild minification and renderLegacyChunks false ([#5054](https://github.com/vitejs/vite/issues/5054)) ([ed384cf](https://github.com/vitejs/vite/commit/ed384cfeff9e3ccb0fdbb07ec91758308da66226))
* normalize internal plugin names ([#4976](https://github.com/vitejs/vite/issues/4976)) ([37f0b2f](https://github.com/vitejs/vite/commit/37f0b2fff74109d381513ed052a32b43655ee11d))
* **plugin-legacy:** fix type errors ([#4762](https://github.com/vitejs/vite/issues/4762)) ([5491143](https://github.com/vitejs/vite/commit/5491143be0b4214d2dab91076a85739d6d106481))


### Features

* **plugin-legacy:** add externalSystemJS option ([#5024](https://github.com/vitejs/vite/issues/5024)) ([60b6f55](https://github.com/vitejs/vite/commit/60b6f5595a00cbf014a30d57721081eb79436a97))



## [1.5.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.2...plugin-legacy@1.5.3) (2021-09-07)


### Bug Fixes

* **plugin-legacy:** fix regression introduced in [#4536](https://github.com/vitejs/vite/issues/4536) ([#4861](https://github.com/vitejs/vite/issues/4861)) ([fdc3212](https://github.com/vitejs/vite/commit/fdc3212474ff951e7e67810eca6cfb3ef1ed9ea2))
* **plugin-legacy:** skip in SSR build ([#4536](https://github.com/vitejs/vite/issues/4536)) ([1f068fc](https://github.com/vitejs/vite/commit/1f068fcec38fc07c34e75a19821064386e460907))



## [1.5.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.1...plugin-legacy@1.5.2) (2021-09-01)


### Bug Fixes

* **plugin-legacy:** avoid executing blank dynamic import ([#4767](https://github.com/vitejs/vite/issues/4767)) ([de71408](https://github.com/vitejs/vite/commit/de7140853140029a3f48600b60e700464e7662b5)), closes [#4568](https://github.com/vitejs/vite/issues/4568)



## [1.5.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.0...plugin-legacy@1.5.1) (2021-08-03)


### Bug Fixes

* **deps:** update all non-major dependencies ([#4468](https://github.com/vitejs/vite/issues/4468)) ([cd54a22](https://github.com/vitejs/vite/commit/cd54a22b8d5048f5d25a9954697f49b6d65dcc1f))
* **plugin-legacy:** bake-in Promise polyfill, fix [#4414](https://github.com/vitejs/vite/issues/4414) ([#4440](https://github.com/vitejs/vite/issues/4440)) ([024a2de](https://github.com/vitejs/vite/commit/024a2de63df60a4037f9f7b13a0bc6e2b0d41fb6))



# [1.5.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.4...plugin-legacy@1.5.0) (2021-07-27)


### Bug Fixes

* **deps:** update all non-major dependencies ([#4387](https://github.com/vitejs/vite/issues/4387)) ([2f900ba](https://github.com/vitejs/vite/commit/2f900ba4d4ad8061e0046898e8d1de3129e7f784))
* **plugin-legacy:** legacy fallback for dynamic import ([#3885](https://github.com/vitejs/vite/issues/3885)) ([fc6d8f1](https://github.com/vitejs/vite/commit/fc6d8f1d3efe836f17f3c45375dd3749128b8137))



## [1.4.4](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.3...plugin-legacy@1.4.4) (2021-07-12)


### Features

* allow entryFileNames, chunkFileNames functions for legacy ([#4122](https://github.com/vitejs/vite/issues/4122)) ([df29bff](https://github.com/vitejs/vite/commit/df29bfff44ad7f2e822f92935d0ca9c99f15b67e))



## [1.4.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.2...plugin-legacy@1.4.3) (2021-06-27)


### Bug Fixes

* don't force polyfillDynamicImport if renderLegacyChunks is false ([#3695](https://github.com/vitejs/vite/issues/3695)) ([#3774](https://github.com/vitejs/vite/issues/3774)) ([d2a51ca](https://github.com/vitejs/vite/commit/d2a51ca4eda2ca9f99d9a066836d76d2253cfc24))
* **deps:** update all non-major dependencies ([#3878](https://github.com/vitejs/vite/issues/3878)) ([a66a805](https://github.com/vitejs/vite/commit/a66a8053e9520d20bcf95fce870570c5195bcc91))
* **plugin-legacy:** chunk may not exist ([#3886](https://github.com/vitejs/vite/issues/3886)) ([dd5931d](https://github.com/vitejs/vite/commit/dd5931d9c1cf382849047332b2c3409755ceebf5))



## [1.4.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.1...plugin-legacy@1.4.2) (2021-06-22)


### Bug Fixes

* **deps:** update all non-major dependencies ([#3791](https://github.com/vitejs/vite/issues/3791)) ([74d409e](https://github.com/vitejs/vite/commit/74d409eafca8d74ec4a6ece621ea2895bc1f2a32))
* **plugin-legacy:** wrap chunks in IIFE ([#3783](https://github.com/vitejs/vite/issues/3783)) ([9abdb81](https://github.com/vitejs/vite/commit/9abdb8137ef54dd095e7bc47ae6a1ccf490fd196))



## [1.4.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.0...plugin-legacy@1.4.1) (2021-06-01)


### Bug Fixes

* **plugin-legacy:** respect custom filenames formats, fix [#2356](https://github.com/vitejs/vite/issues/2356) ([#2641](https://github.com/vitejs/vite/issues/2641)) ([d852731](https://github.com/vitejs/vite/commit/d852731622a1c009d15a5172343fc166c4bb5cb7))



# [1.4.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.4...plugin-legacy@1.4.0) (2021-05-17)


### Bug Fixes

* **plugin-legacy:** turn off babel loose mode ([#3406](https://github.com/vitejs/vite/issues/3406)) ([5348c02](https://github.com/vitejs/vite/commit/5348c02f58bde36c412dbfe36c3ad37772bf83e5))
* restore dynamic-import-polyfill ([#3434](https://github.com/vitejs/vite/issues/3434)) ([4112c5d](https://github.com/vitejs/vite/commit/4112c5d103673b83c50d446096086617dfaac5a3))



## [1.3.4](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.3...plugin-legacy@1.3.4) (2021-05-11)


### Bug Fixes

* **plugin-legacy:** move polyfills in plugin post, fixes [#2786](https://github.com/vitejs/vite/issues/2786) and [#2781](https://github.com/vitejs/vite/issues/2781) ([#3023](https://github.com/vitejs/vite/issues/3023)) ([43150e3](https://github.com/vitejs/vite/commit/43150e352d164744e2fda766927053439bdf7db9))
* **plugin-legacy:** require Vite 2.0.0 final ([#3265](https://github.com/vitejs/vite/issues/3265)) ([e395dee](https://github.com/vitejs/vite/commit/e395deeb0f11ebb1bcebe69233adebaad10f77eb))



## [1.3.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.2...plugin-legacy@1.3.3) (2021-05-03)


### Bug Fixes

* **plugin-legacy:** correct log level to error ([#3241](https://github.com/vitejs/vite/issues/3241)) ([474fe9a](https://github.com/vitejs/vite/commit/474fe9a3abbdf4845447eaab821d2ba51fda6207))
* ignore babelrc in legacy plugin ([#2801](https://github.com/vitejs/vite/issues/2801)) ([d466ad0](https://github.com/vitejs/vite/commit/d466ad0a095859a895fd4cb85f425ad4c4583e4e))



## [1.3.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.1...plugin-legacy@1.3.2) (2021-03-27)


### Bug Fixes

* typo in plugin-legacy ([#2651](https://github.com/vitejs/vite/issues/2651)) ([9a2ce75](https://github.com/vitejs/vite/commit/9a2ce7580772cb783a9f8fda7e45e4a9adacbec2))



## [1.3.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.0...plugin-legacy@1.3.1) (2021-02-15)


### Bug Fixes

* **plugin-legacy:** prevent constant folding for import.meta.env.LEGACY ([bace724](https://github.com/vitejs/vite/commit/bace7244e776b3f4c9dd7e3ff1885df668cbcb87)), closes [#1999](https://github.com/vitejs/vite/issues/1999)
* **plugin-legacy:** use correct string length in legacy env replacement ([#2015](https://github.com/vitejs/vite/issues/2015)) ([7f48086](https://github.com/vitejs/vite/commit/7f4808634f57ca8f4be3b455cc4fb8016acdc4fd))



# [1.3.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.3...plugin-legacy@1.3.0) (2021-02-11)


### Features

* **plugin-legacy:** inject import.meta.env.LEGACY ([416f190](https://github.com/vitejs/vite/commit/416f190aa92f06a06f3ded403fb1e4cb8729256d))



## [1.2.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.2...plugin-legacy@1.2.3) (2021-02-01)


### Features

* **plugin-legacy:** use compact output when transpiling legacy chunks ([045e519](https://github.com/vitejs/vite/commit/045e519d51fbce94bddb60793e9e99311acc5aa2)), closes [#1828](https://github.com/vitejs/vite/issues/1828)



## [1.2.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.1...plugin-legacy@1.2.2) (2021-01-25)


### Bug Fixes

* **plugin-legacy:** throw error when using esbuild minify with legacy plugin ([8fb2511](https://github.com/vitejs/vite/commit/8fb2511a02c163d85f60dfab0bef104756768e35))


### Features

* default vendor chunk splitting ([f6b58a0](https://github.com/vitejs/vite/commit/f6b58a0f535b1c26f9c1dfda74c28c685402c3c9))
* support `base` option during dev, deprecate `build.base` ([#1556](https://github.com/vitejs/vite/issues/1556)) ([809d4bd](https://github.com/vitejs/vite/commit/809d4bd3bf62d3bc6b35f182178922d2ab2175f1))



## [1.2.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.0...plugin-legacy@1.2.1) (2021-01-14)


### Bug Fixes

* **plugin-legacy:** respect config.build.assetsDir ([#1532](https://github.com/vitejs/vite/issues/1532)) ([3e7ad3f](https://github.com/vitejs/vite/commit/3e7ad3fa26a6149b44b2e522648cbda1009e4888)), closes [#1530](https://github.com/vitejs/vite/issues/1530)



# [1.2.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.1.1...plugin-legacy@1.2.0) (2021-01-11)


### Bug Fixes

* **plugin-html:** typo in the Safari 10 nomodule snippet ([#1483](https://github.com/vitejs/vite/issues/1483)) ([e5576c3](https://github.com/vitejs/vite/commit/e5576c32c08214766c8bac5458dfcad8301d3a1a))


### Features

* **plugin-legacy:** support additionalLegacyPolyfills ([ca25896](https://github.com/vitejs/vite/commit/ca258962957c32df0196f30267c3d77b544aacbd)), closes [#1475](https://github.com/vitejs/vite/issues/1475)



## [1.1.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.1.0...plugin-legacy@1.1.1) (2021-01-09)


### Bug Fixes

* **plugin-legacy:** add `index.d.ts` at publish ([#1457](https://github.com/vitejs/vite/issues/1457)) ([dce2456](https://github.com/vitejs/vite/commit/dce245629651edab9719127deaf07ecfbcf20c5f))



# [1.1.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.0.1...plugin-legacy@1.1.0) (2021-01-07)


### Features

* use constant inline script + provide CSP hashes ([72107cd](https://github.com/vitejs/vite/commit/72107cdcdb7241e9fadd67528abb14f54b1c901d))



## [1.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.0.0...plugin-legacy@1.0.1) (2021-01-07)


### Bug Fixes

* **plugin-legacy:** avoid esbuild transform on legacy chunks ([7734105](https://github.com/vitejs/vite/commit/7734105093c6dabf64da6bfc11486aa9ac62efea))
* add promise polyfill if not used in bundle ([b72db4e](https://github.com/vitejs/vite/commit/b72db4e3ec5ca8974ea2f1913d5611f73c0978b5))


### Performance Improvements

* use @babel/standalone + lazy load ([b2f98fb](https://github.com/vitejs/vite/commit/b2f98fba0215ef171af2abc62e3aefc35f00d168))



# 1.0.0 (2021-01-07)


### Features

* **plugin-legacy:** @vitejs/plugin-legacy ([8c34870](https://github.com/vitejs/vite/commit/8c34870040f8c2f4be7d00245a3683f9e64d894e))



