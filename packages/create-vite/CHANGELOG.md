## <small>[7.0.3](https://github.com/vitejs/vite/compare/create-vite@7.0.2...create-vite@7.0.3) (2025-07-11)</small>
### Features

* **create-vite:** bump vite-plugin-svelte to new major for vite7 ([#20394](https://github.com/vitejs/vite/issues/20394)) ([a829a29](https://github.com/vitejs/vite/commit/a829a2963cd201ef0422afdc4cfca3d3e7c92770))

## <small>[7.0.2](https://github.com/vitejs/vite/compare/create-vite@7.0.1...create-vite@7.0.2) (2025-07-10)</small>
### Bug Fixes

* **create-vite:** fix command for react rsc template ([#20378](https://github.com/vitejs/vite/issues/20378)) ([0362484](https://github.com/vitejs/vite/commit/03624844ebc2950cfb1a48379726d60e6d31bd6e))

## <small>[7.0.1](https://github.com/vitejs/vite/compare/create-vite@7.0.0...create-vite@7.0.1) (2025-07-08)</small>
### Features

* **create-vite:** update rsc template to use `@vitejs/plugin-rsc` ([#20351](https://github.com/vitejs/vite/issues/20351)) ([b9ebc96](https://github.com/vitejs/vite/commit/b9ebc967bb9e8137dedb7d1304e4f693a52f1c03))

### Bug Fixes

* **deps:** update all non-major dependencies ([#20324](https://github.com/vitejs/vite/issues/20324)) ([3e81af3](https://github.com/vitejs/vite/commit/3e81af38a80c7617aba6bf3300d8b4267570f9cf))
* **deps:** update all non-major dependencies ([#20366](https://github.com/vitejs/vite/issues/20366)) ([43ac73d](https://github.com/vitejs/vite/commit/43ac73da27b3907c701e95e6a7d28fde659729ec))

### Miscellaneous Chores

* **deps:** update rolldown-related dependencies ([#20323](https://github.com/vitejs/vite/issues/20323)) ([30d2f1b](https://github.com/vitejs/vite/commit/30d2f1b38c72387ffdca3ee4746730959a020b59))
* group commits by category in changelog ([#20310](https://github.com/vitejs/vite/issues/20310)) ([41e83f6](https://github.com/vitejs/vite/commit/41e83f62b1adb65f5af4c1ec006de1c845437edc))

## [7.0.0](https://github.com/vitejs/vite/compare/create-vite@6.5.0...create-vite@7.0.0) (2025-06-24)
### ⚠ BREAKING CHANGES

* bump `build.target` and name it `baseline-widely-available` (#20007)
* bump required node version to 20.19+, 22.12+ and remove cjs build (#20032)
* remove node 18 support (#19972)

### Features

* bump `build.target` and name it `baseline-widely-available` ([#20007](https://github.com/vitejs/vite/issues/20007)) ([4a8aa82](https://github.com/vitejs/vite/commit/4a8aa82556eb2b9e54673a6aac77873e0eb27fa9))
* **create-vite:** add `@hiogawa/vite-rsc` ([#20209](https://github.com/vitejs/vite/issues/20209)) ([7cf0aff](https://github.com/vitejs/vite/commit/7cf0aff0370ca106b0ec88a3741f505f3351a3f4))
* **create-vite:** update "react" and "react-ts" templates to use extends in eslint config ([#19732](https://github.com/vitejs/vite/issues/19732)) ([8679a43](https://github.com/vitejs/vite/commit/8679a43de710052c5c84bb6c253829ab999b040a))
* **create-vite:** update target to es2023 in `tsconfig.node.json` ([#20078](https://github.com/vitejs/vite/issues/20078)) ([8424af3](https://github.com/vitejs/vite/commit/8424af398159e58cf662f7175fca2bed90dbd671))
* **create-vite:** use more extends in eslint config ([#20008](https://github.com/vitejs/vite/issues/20008)) ([976103e](https://github.com/vitejs/vite/commit/976103ea7ccd831ee4ae334e5ee1e0f5edb5d5b1))
* **create-vite:** validate project name ([#20257](https://github.com/vitejs/vite/issues/20257)) ([17700b7](https://github.com/vitejs/vite/commit/17700b76a6535b90e27ebfa67e2f2f78bd4ea844))
* **deps:** update plugin-vue to 6.0.0 in create-vite templates for Vite 7 ([#20281](https://github.com/vitejs/vite/issues/20281)) ([ec06767](https://github.com/vitejs/vite/commit/ec067671d019023109f974310a9cd974a4091251))

### Bug Fixes

* **create-vite:** targetDir is empty fallback defaultTargetDir ([#20199](https://github.com/vitejs/vite/issues/20199)) ([1aae595](https://github.com/vitejs/vite/commit/1aae59594dfc2138144874322e0f26f8fd2188bd))
* **deps:** update all non-major dependencies ([#19953](https://github.com/vitejs/vite/issues/19953)) ([ac8e1fb](https://github.com/vitejs/vite/commit/ac8e1fb289a06fc0671dab1f4ef68e508e34360e))
* **deps:** update all non-major dependencies ([#20061](https://github.com/vitejs/vite/issues/20061)) ([7b58856](https://github.com/vitejs/vite/commit/7b588563636a6f735a6e25832f33fc08572b25d9))
* **deps:** update all non-major dependencies ([#20141](https://github.com/vitejs/vite/issues/20141)) ([89ca65b](https://github.com/vitejs/vite/commit/89ca65ba1d849046dccdea52e9eca980f331be26))
* **deps:** update all non-major dependencies ([#20181](https://github.com/vitejs/vite/issues/20181)) ([d91d4f7](https://github.com/vitejs/vite/commit/d91d4f7ad55edbcb4a51fc23376cbff89f776d30))
* **deps:** update all non-major dependencies ([#20212](https://github.com/vitejs/vite/issues/20212)) ([a80339b](https://github.com/vitejs/vite/commit/a80339b1798607dd7389f42964272181cf9eb453))
* **deps:** update all non-major dependencies ([#20271](https://github.com/vitejs/vite/issues/20271)) ([6b64d63](https://github.com/vitejs/vite/commit/6b64d63d700154de2c00270300b671cef8863708))
* error starting project with TanStack Router template ([#20184](https://github.com/vitejs/vite/issues/20184)) ([44bd3eb](https://github.com/vitejs/vite/commit/44bd3ebe51a861739ec1656d188246654149eab5))
* error starting solid project with Tanstack Router template ([#20189](https://github.com/vitejs/vite/issues/20189)) ([dad3962](https://github.com/vitejs/vite/commit/dad3962257fdf916caafefc45743898a56cbac0b))

### Documentation

* tiny typo ([#20110](https://github.com/vitejs/vite/issues/20110)) ([d20fc2c](https://github.com/vitejs/vite/commit/d20fc2cdc9700513425b18b625e01224f61e4eab))

### Miscellaneous Chores

* **deps:** update rolldown-related dependencies ([#20140](https://github.com/vitejs/vite/issues/20140)) ([0387447](https://github.com/vitejs/vite/commit/03874471e3de14e7d2f474ecb354499e7f5eb418))
* **deps:** update rolldown-related dependencies ([#20182](https://github.com/vitejs/vite/issues/20182)) ([6172f41](https://github.com/vitejs/vite/commit/6172f410b44cbae8d052997bb1819a6197a4d397))
* **deps:** update rolldown-related dependencies ([#20270](https://github.com/vitejs/vite/issues/20270)) ([f7377c3](https://github.com/vitejs/vite/commit/f7377c3eae6323bd3237ff5de5ae55c879fe7325))
* remove node 18 support ([#19972](https://github.com/vitejs/vite/issues/19972)) ([00b8a98](https://github.com/vitejs/vite/commit/00b8a98f36376804437e1342265453915ae613de))
* speed up typechecking ([#20131](https://github.com/vitejs/vite/issues/20131)) ([a357c19](https://github.com/vitejs/vite/commit/a357c1987f332519d7bacafebc5620c7ab534d8f))
* update deps in create-vite for 7.0-beta ([#20148](https://github.com/vitejs/vite/issues/20148)) ([c05c159](https://github.com/vitejs/vite/commit/c05c159b84c5e358c1a03991e50179952235910c))
* use tsdown ([#20065](https://github.com/vitejs/vite/issues/20065)) ([d488efd](https://github.com/vitejs/vite/commit/d488efda95ff40f63684194d51858f84c3d05379))

### Code Refactoring

* bump required node version to 20.19+, 22.12+ and remove cjs build ([#20032](https://github.com/vitejs/vite/issues/20032)) ([2b80243](https://github.com/vitejs/vite/commit/2b80243fada75378e80475028fdcc78f4432bd6f))

## [6.5.0](https://github.com/vitejs/vite/compare/create-vite@6.4.1...create-vite@6.5.0) (2025-05-05)
### Features

* **create-vite:** add Marko ([#19257](https://github.com/vitejs/vite/issues/19257)) ([171e856](https://github.com/vitejs/vite/commit/171e856e011512098591234d0557804c6175b625))
* **create-vite:** add RedwoodSDK to create-vite app. ([#19927](https://github.com/vitejs/vite/issues/19927)) ([7f5e0e6](https://github.com/vitejs/vite/commit/7f5e0e61a809412b279338772e205ea458011aa4))
* **create-vite:** bump TS to 5.8 ([#19892](https://github.com/vitejs/vite/issues/19892)) ([1f90255](https://github.com/vitejs/vite/commit/1f902551207dd4e995eea4263fda28aed59150a6))

### Bug Fixes

* **deps:** update all non-major dependencies ([#19698](https://github.com/vitejs/vite/issues/19698)) ([bab4cb9](https://github.com/vitejs/vite/commit/bab4cb92248adf6b9b18df12b2bf03889b0bd1eb))
* **deps:** update all non-major dependencies ([#19899](https://github.com/vitejs/vite/issues/19899)) ([a4b500e](https://github.com/vitejs/vite/commit/a4b500ef9ccc9b19a2882156a9ba8397e69bc6b2))

## <small>[6.4.1](https://github.com/vitejs/vite/compare/create-vite@6.4.0...create-vite@6.4.1) (2025-04-17)</small>
### Bug Fixes

* **create-vite:** adding an interactive flag to force interactivity ([#19875](https://github.com/vitejs/vite/issues/19875)) ([608457c](https://github.com/vitejs/vite/commit/608457cd03ce593492abfe007e20468387c4c895))

### Documentation

* **create-vite:** update react template README files ([#19876](https://github.com/vitejs/vite/issues/19876)) ([2d4c20e](https://github.com/vitejs/vite/commit/2d4c20ebadc35dae7327ffe6cba85cc5c36d579a))

## [6.4.0](https://github.com/vitejs/vite/compare/create-vite@6.3.1...create-vite@6.4.0) (2025-04-16)
### Features

* **create-vite:** add TanStack Router commands ([#19573](https://github.com/vitejs/vite/issues/19573)) ([e49a3b5](https://github.com/vitejs/vite/commit/e49a3b523c8894e8e0df766642999a944e0148ef))

### Bug Fixes

* **deps:** update all non-major dependencies ([#19555](https://github.com/vitejs/vite/issues/19555)) ([f612e0f](https://github.com/vitejs/vite/commit/f612e0fdf6810317b61fcca1ded125755f261d78))
* **deps:** update all non-major dependencies ([#19613](https://github.com/vitejs/vite/issues/19613)) ([363d691](https://github.com/vitejs/vite/commit/363d691b4995d72f26a14eb59ed88a9483b1f931))
* **deps:** update all non-major dependencies ([#19649](https://github.com/vitejs/vite/issues/19649)) ([f4e712f](https://github.com/vitejs/vite/commit/f4e712ff861f8a9504594a4a5e6d35a7547e5a7e))

### Documentation

* remove $ prefix from create-vite terminal commands in README ([#19532](https://github.com/vitejs/vite/issues/19532)) ([cb9165c](https://github.com/vitejs/vite/commit/cb9165c1b2569aabe3e110e9684a909918eae22c))

### Miscellaneous Chores

* **deps:** update dependency globals to v16 ([#19556](https://github.com/vitejs/vite/issues/19556)) ([e4bdd6b](https://github.com/vitejs/vite/commit/e4bdd6b9dd6e2ccf7d11e84a9c2da805e98eed58))

## <small>[6.3.1](https://github.com/vitejs/vite/compare/create-vite@6.3.0...create-vite@6.3.1) (2025-02-27)</small>
### Bug Fixes

* **create-vite:** make custom command visible ([#19519](https://github.com/vitejs/vite/issues/19519)) ([5ea9a42](https://github.com/vitejs/vite/commit/5ea9a422c5a000c6a3183c617d6c853cdc4a5151))
* **create-vite:** remove eslint-plugin-react ([#19514](https://github.com/vitejs/vite/issues/19514)) ([c0e3dba](https://github.com/vitejs/vite/commit/c0e3dba3108e479ab839205cfb046db327bdaf43))

### Documentation

* **create-vite:** recommend eslint-react for linting ([#19524](https://github.com/vitejs/vite/issues/19524)) ([e912080](https://github.com/vitejs/vite/commit/e9120805df4dcf202caa65f15edc7d94fb521a63))

### Miscellaneous Chores

* remove prompts alias ([#19507](https://github.com/vitejs/vite/issues/19507)) ([276c1d3](https://github.com/vitejs/vite/commit/276c1d3b4761c436dc668e76decb9cf20cb25ab9))

## [6.3.0](https://github.com/vitejs/vite/compare/create-vite@6.2.1...create-vite@6.3.0) (2025-02-25)
### Features

* **create-vite:** use `@clack/prompts` ([#19445](https://github.com/vitejs/vite/issues/19445)) ([5dae6c1](https://github.com/vitejs/vite/commit/5dae6c17da2ef135c2864500db2c8f3e2cf2b3db))

## <small>[6.2.1](https://github.com/vitejs/vite/compare/create-vite@6.2.0...create-vite@6.2.1) (2025-02-25)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#19392](https://github.com/vitejs/vite/issues/19392)) ([60456a5](https://github.com/vitejs/vite/commit/60456a54fe90872dbd4bed332ecbd85bc88deb92))
* **deps:** update all non-major dependencies ([#19440](https://github.com/vitejs/vite/issues/19440)) ([ccac73d](https://github.com/vitejs/vite/commit/ccac73d9d0e92c7232f09207d1d6b893e823ed8e))
* **deps:** update all non-major dependencies ([#19501](https://github.com/vitejs/vite/issues/19501)) ([c94c9e0](https://github.com/vitejs/vite/commit/c94c9e052127cf4796374de1d698ec60b2973dfa))

### Miscellaneous Chores

* **create-vite:** remove font family `Inter` ([#19474](https://github.com/vitejs/vite/issues/19474)) ([4bcd79a](https://github.com/vitejs/vite/commit/4bcd79a0b38c968825494da1a48f3f91fbc0fbf5))
* **create-vite:** update `@vitejs/plugin-react-swc` version ([#19384](https://github.com/vitejs/vite/issues/19384)) ([39fab6d](https://github.com/vitejs/vite/commit/39fab6db204ea88ffdb346ee98d8abe0ff5d685f))

### Continuous Integration

* update react-swc plugin version in create-vite by renovate ([#19394](https://github.com/vitejs/vite/issues/19394)) ([0f058a9](https://github.com/vitejs/vite/commit/0f058a989f974d6f012539122f0580e37c2e9852))

## [6.2.0](https://github.com/vitejs/vite/compare/create-vite@6.1.1...create-vite@6.2.0) (2025-02-05)
### Features

* **create-vite:** add hint for external CLIs ([#19157](https://github.com/vitejs/vite/issues/19157)) ([b9a4cc6](https://github.com/vitejs/vite/commit/b9a4cc6b2875555b621f23ae5457fa37f31e2e24))
* **create-vite:** official starters options naming ([#19163](https://github.com/vitejs/vite/issues/19163)) ([1992f68](https://github.com/vitejs/vite/commit/1992f681fc7662780f2f2fa4fdb0865a8a54deff))

### Bug Fixes

* **deps:** update all non-major dependencies ([#19098](https://github.com/vitejs/vite/issues/19098)) ([8639538](https://github.com/vitejs/vite/commit/8639538e6498d1109da583ad942c1472098b5919))
* **deps:** update all non-major dependencies ([#19190](https://github.com/vitejs/vite/issues/19190)) ([f2c07db](https://github.com/vitejs/vite/commit/f2c07dbfc874b46f6e09bb04996d0514663e4544))
* **deps:** update all non-major dependencies ([#19296](https://github.com/vitejs/vite/issues/19296)) ([2bea7ce](https://github.com/vitejs/vite/commit/2bea7cec4b7fddbd5f2fb6090a7eaf5ae7ca0f1b))
* **deps:** update all non-major dependencies ([#19341](https://github.com/vitejs/vite/issues/19341)) ([a2b2fad](https://github.com/vitejs/vite/commit/a2b2fad6adb781d3fb163a7e2ce4670d56d60748))
* **deps:** update react monorepo to v19 (major) ([#18917](https://github.com/vitejs/vite/issues/18917)) ([93d5443](https://github.com/vitejs/vite/commit/93d54439784da0c0a995e50dcfcc081ce4da0121))

### Miscellaneous Chores

* bump TypeScript to ~5.7.2 ([#19056](https://github.com/vitejs/vite/issues/19056)) ([1acea1f](https://github.com/vitejs/vite/commit/1acea1f7c42e43209a6ea0aa99441f143ee15018))

## <small>[6.1.1](https://github.com/vitejs/vite/compare/create-vite@6.1.0...create-vite@6.1.1) (2024-12-24)</small>
### Bug Fixes

* **create-vite:** svelte-ts typecheck command ([#19014](https://github.com/vitejs/vite/issues/19014)) ([ac32968](https://github.com/vitejs/vite/commit/ac329685bba229e1ff43e3d96324f817d48abe48))
* **deps:** update all non-major dependencies ([#19045](https://github.com/vitejs/vite/issues/19045)) ([b442d12](https://github.com/vitejs/vite/commit/b442d12c97357697be9341b7abebd78382a3d93d))

### Code Refactoring

* **create-vite:** remove tslib from svelte-ts template ([#19015](https://github.com/vitejs/vite/issues/19015)) ([9066049](https://github.com/vitejs/vite/commit/9066049216b41ac8c6b9177539647d50d3498f1f))

## [6.1.0](https://github.com/vitejs/vite/compare/create-vite@6.0.1...create-vite@6.1.0) (2024-12-19)
### Features

* **create-vite:** align tsconfigs in svelte-ts template with others ([#18995](https://github.com/vitejs/vite/issues/18995)) ([b48b98c](https://github.com/vitejs/vite/commit/b48b98ce0618eb3d142c0ce86a765502fb4ac190))
* **create-vite:** extend from @vue/tsconfig to simplify tsconfig.app.json ([#18862](https://github.com/vitejs/vite/issues/18862)) ([89eea02](https://github.com/vitejs/vite/commit/89eea020a3723276495b950542e1c71f4ced781a))

### Bug Fixes

* **deps:** update all non-major dependencies ([#18853](https://github.com/vitejs/vite/issues/18853)) ([5c02236](https://github.com/vitejs/vite/commit/5c0223636fa277d5daeb4d93c3f32d9f3cd69fc5))
* **deps:** update all non-major dependencies ([#18967](https://github.com/vitejs/vite/issues/18967)) ([d88d000](https://github.com/vitejs/vite/commit/d88d0004a8e891ca6026d356695e0b319caa7fce))
* **deps:** update all non-major dependencies ([#18996](https://github.com/vitejs/vite/issues/18996)) ([2b4f115](https://github.com/vitejs/vite/commit/2b4f115129fb3fbd730a92078acb724f8527b7f7))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#18916](https://github.com/vitejs/vite/issues/18916)) ([ef7a6a3](https://github.com/vitejs/vite/commit/ef7a6a35e6827b92445e5a0c2c0022616efc80dd))

### Code Refactoring

* fix logic errors found by no-unnecessary-condition rule ([#18891](https://github.com/vitejs/vite/issues/18891)) ([ea802f8](https://github.com/vitejs/vite/commit/ea802f8f8bcf3771a35c1eaf687378613fbabb24))

## <small>[6.0.1](https://github.com/vitejs/vite/compare/create-vite@6.0.0...create-vite@6.0.1) (2024-11-27)</small>
### Features

* **create-vite:** bump vite-plugin-solid to `2.11.0` ([#18792](https://github.com/vitejs/vite/issues/18792)) ([32ac96f](https://github.com/vitejs/vite/commit/32ac96f54ca459d1a4c7ff7f4dbb4111eaea00f1))
* **create-vite:** change Remix to React Router v7 ([#18785](https://github.com/vitejs/vite/issues/18785)) ([31cc61b](https://github.com/vitejs/vite/commit/31cc61b7404b2b22d956856f97eeebd0a62f3b4d))

### Reverts

* update moduleResolution value casing ([#18409](https://github.com/vitejs/vite/issues/18409)) ([#18774](https://github.com/vitejs/vite/issues/18774)) ([b0fc6e3](https://github.com/vitejs/vite/commit/b0fc6e3c2591a30360d3714263cf7cc0e2acbfdf))

## [6.0.0](https://github.com/vitejs/vite/compare/create-vite@5.5.5...create-vite@6.0.0) (2024-11-26)
### ⚠ BREAKING CHANGES

* drop node 21 support in version ranges (#18729)

### Features

* drop node 21 support in version ranges ([#18729](https://github.com/vitejs/vite/issues/18729)) ([a384d8f](https://github.com/vitejs/vite/commit/a384d8fd39162190675abcfea31ba657383a3d03))

### Bug Fixes

* **create-vite:** change create-app prompt to not remove existing files by default ([#18710](https://github.com/vitejs/vite/issues/18710)) ([c2b7529](https://github.com/vitejs/vite/commit/c2b75292f48be0371e337193c3b37a67b8212f97))
* **create-vite:** improve project name inference from path ([#16490](https://github.com/vitejs/vite/issues/16490)) ([8518113](https://github.com/vitejs/vite/commit/8518113dee2554401d23b2fba62ecab31d2b0541))
* **deps:** update all non-major dependencies ([#18691](https://github.com/vitejs/vite/issues/18691)) ([f005461](https://github.com/vitejs/vite/commit/f005461ecce89ada21cb0c021f7af460b5479736))

### Miscellaneous Chores

* **create-vite:** change directory structure of `template-vanilla` for consistency ([#18716](https://github.com/vitejs/vite/issues/18716)) ([56a86ae](https://github.com/vitejs/vite/commit/56a86ae479b6aaf1c0a15bfedb0ee435e8ffcf3a))
* **create-vite:** update to vite 6 ([#18770](https://github.com/vitejs/vite/issues/18770)) ([80bf954](https://github.com/vitejs/vite/commit/80bf9549b48c66a47e5cc76a7540ce3e62e2f2da))
* **deps:** update all non-major dependencies ([#18562](https://github.com/vitejs/vite/issues/18562)) ([fb227ec](https://github.com/vitejs/vite/commit/fb227ec4402246b5a13e274c881d9de6dd8082dd))
* **deps:** update all non-major dependencies ([#18634](https://github.com/vitejs/vite/issues/18634)) ([e2231a9](https://github.com/vitejs/vite/commit/e2231a92af46db144b9c94fb57918ac683dc93cb))
* **deps:** update all non-major dependencies ([#18746](https://github.com/vitejs/vite/issues/18746)) ([0ad16e9](https://github.com/vitejs/vite/commit/0ad16e92d57453d9e5392c90fd06bda947be9de6))

## <small>[5.5.5](https://github.com/vitejs/vite/compare/create-vite@5.5.4...create-vite@5.5.5) (2024-10-30)</small>
### Bug Fixes

* **create-vite:** add tsBuildInfoFile option ([#18435](https://github.com/vitejs/vite/issues/18435)) ([0a4427f](https://github.com/vitejs/vite/commit/0a4427fc44b9b2075225bf8a9f1d88a8a428a217))
* **deps:** update all non-major dependencies ([#18484](https://github.com/vitejs/vite/issues/18484)) ([2ec12df](https://github.com/vitejs/vite/commit/2ec12df98d07eb4c986737e86a4a9f8066724658))

### Miscellaneous Chores

* upgrade to unbuild v3 rc ([#18502](https://github.com/vitejs/vite/issues/18502)) ([ddd5c5d](https://github.com/vitejs/vite/commit/ddd5c5d00ff7894462a608841560883f9c771f22))

## <small>[5.5.4](https://github.com/vitejs/vite/compare/create-vite@5.5.3...create-vite@5.5.4) (2024-10-23)</small>
### Features

* add custom Angular variants ([#18410](https://github.com/vitejs/vite/issues/18410)) ([ac1fd41](https://github.com/vitejs/vite/commit/ac1fd41059f5549922b9f1a93c2bc00fbfcca3e8))
* **create-vite:** update to svelte 5 ([#18407](https://github.com/vitejs/vite/issues/18407)) ([291830f](https://github.com/vitejs/vite/commit/291830fa632c756b2a0311142d1f25ca7b56a637))

### Bug Fixes

* **create-vite:** update qwik URL ([#18285](https://github.com/vitejs/vite/issues/18285)) ([45c9b5c](https://github.com/vitejs/vite/commit/45c9b5cca160346b41dbddacf6f9000ab1b638bc))
* **deps:** update all non-major dependencies ([#18292](https://github.com/vitejs/vite/issues/18292)) ([5cac054](https://github.com/vitejs/vite/commit/5cac0544dca2764f0114aac38e9922a0c13d7ef4))
* **deps:** update all non-major dependencies ([#18345](https://github.com/vitejs/vite/issues/18345)) ([5552583](https://github.com/vitejs/vite/commit/5552583a2272cd4208b30ad60e99d984e34645f0))

### Miscellaneous Chores

* change Angular customCommand ([#18425](https://github.com/vitejs/vite/issues/18425)) ([b53db53](https://github.com/vitejs/vite/commit/b53db53df17c43602d61a24e9bf579267ee8eb6b))
* combine deps license with same text ([#18356](https://github.com/vitejs/vite/issues/18356)) ([b5d1a05](https://github.com/vitejs/vite/commit/b5d1a058f9dab6a6b1243c2a0b11d2c421dd3291))
* **create-vite:** mark template files as CC0 ([#18366](https://github.com/vitejs/vite/issues/18366)) ([f6b9074](https://github.com/vitejs/vite/commit/f6b90747eb2b1ad863e5f147a80c75b15e38a51b))
* **deps:** bump TypeScript to 5.6 ([#18254](https://github.com/vitejs/vite/issues/18254)) ([57a0e85](https://github.com/vitejs/vite/commit/57a0e85186b88118bf5f79dd53391676fb91afec))
* **deps:** update all non-major dependencies ([#18404](https://github.com/vitejs/vite/issues/18404)) ([802839d](https://github.com/vitejs/vite/commit/802839d48335a69eb15f71f2cd816d0b6e4d3556))
* **deps:** update eslint-plugin-react-hooks to stable v5 ([#18335](https://github.com/vitejs/vite/issues/18335)) ([0ddfb9f](https://github.com/vitejs/vite/commit/0ddfb9f31a74eea6d61bbedbda2a5c280c9bcc77))
* specify TypeScript version with `~` ([#18406](https://github.com/vitejs/vite/issues/18406)) ([70bb8de](https://github.com/vitejs/vite/commit/70bb8ded1d5d2f1323d0350a8ad9cb3954c0bd61))
* update all url references of vitejs.dev to vite.dev ([#18276](https://github.com/vitejs/vite/issues/18276)) ([7052c8f](https://github.com/vitejs/vite/commit/7052c8f6fc253f0a88ff04a4c18c108f3bfdaa78))
* update license copyright ([#18278](https://github.com/vitejs/vite/issues/18278)) ([56eb869](https://github.com/vitejs/vite/commit/56eb869a67551a257d20cba00016ea59b1e1a2c4))
* update moduleResolution value casing ([#18409](https://github.com/vitejs/vite/issues/18409)) ([ff018dc](https://github.com/vitejs/vite/commit/ff018dca959c73481ae5f8328cd77d3b02f02134))

## <small>[5.5.3](https://github.com/vitejs/vite/compare/create-vite@5.5.2...create-vite@5.5.3) (2024-10-04)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#18170](https://github.com/vitejs/vite/issues/18170)) ([c8aea5a](https://github.com/vitejs/vite/commit/c8aea5ae0af90dc6796ef3bdd612d1eb819f157b))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#17896](https://github.com/vitejs/vite/issues/17896)) ([3dc23d9](https://github.com/vitejs/vite/commit/3dc23d9aa5deac4d5591ff94eeb978ec1d702072))
* **deps:** update all non-major dependencies ([#17945](https://github.com/vitejs/vite/issues/17945)) ([cfb621e](https://github.com/vitejs/vite/commit/cfb621e7a5a3e24d710a9af156e6855e73caf891))
* **deps:** update all non-major dependencies ([#17991](https://github.com/vitejs/vite/issues/17991)) ([0ca53cf](https://github.com/vitejs/vite/commit/0ca53cff9ff49108fcec75ff01d2445f9c2f2a4c))
* **deps:** update all non-major dependencies ([#18050](https://github.com/vitejs/vite/issues/18050)) ([7cac03f](https://github.com/vitejs/vite/commit/7cac03fa5197a72d2e2422bd0243a85a9a18abfc))
* **deps:** update all non-major dependencies ([#18108](https://github.com/vitejs/vite/issues/18108)) ([a73bbaa](https://github.com/vitejs/vite/commit/a73bbaadb512a884924cc884060e50ea6d809d74))
* **deps:** update all non-major dependencies ([#18230](https://github.com/vitejs/vite/issues/18230)) ([c0edd26](https://github.com/vitejs/vite/commit/c0edd26bbfeb9a8d80ebaa420e54fbb7f165bd9b))
* **deps:** update dependency svelte-check to v4 ([#18051](https://github.com/vitejs/vite/issues/18051)) ([ecabf89](https://github.com/vitejs/vite/commit/ecabf8954ff1db3f9f3e32861de765f028108d2e))
* enable some eslint rules ([#18084](https://github.com/vitejs/vite/issues/18084)) ([e9a2746](https://github.com/vitejs/vite/commit/e9a2746ca77473b1814fd05db3d299c074135fe5))

### Code Refactoring

* **create-vite:** use picocolors ([#18085](https://github.com/vitejs/vite/issues/18085)) ([ba37df0](https://github.com/vitejs/vite/commit/ba37df0813ad3864fc4b8c6c0b289a1f2bc00c36))

## <small>[5.5.2](https://github.com/vitejs/vite/compare/create-vite@5.5.1...create-vite@5.5.2) (2024-08-15)</small>
### Bug Fixes

* **create-vite:** move ESLint "ignores" config to a separate object in React templates ([#17885](https://github.com/vitejs/vite/issues/17885)) ([1b3b702](https://github.com/vitejs/vite/commit/1b3b702a7ec04fecb81f2642ffdde0b13e38a921))
* **deps:** update all non-major dependencies ([#17869](https://github.com/vitejs/vite/issues/17869)) ([d11711c](https://github.com/vitejs/vite/commit/d11711c7e4c082fd0400245bfdc766006fd38ac8))

## <small>[5.5.1](https://github.com/vitejs/vite/compare/create-vite@5.5.0...create-vite@5.5.1) (2024-08-07)</small>
### Bug Fixes

* **create-vite:** remove eslint overrides ([#17833](https://github.com/vitejs/vite/issues/17833)) ([8bc122f](https://github.com/vitejs/vite/commit/8bc122feea8b840575796e1846871a2090525fc9))

## [5.5.0](https://github.com/vitejs/vite/compare/create-vite@5.4.0...create-vite@5.5.0) (2024-08-07)
### Features

* **create-vite:** add eslint.config.js to React templates ([#12860](https://github.com/vitejs/vite/issues/12860)) ([dcfa75c](https://github.com/vitejs/vite/commit/dcfa75c6f5422d47cbe670798080d3f6d9dcdb6b))

### Bug Fixes

* **create-vite:** avoid usage of composite in TS configs ([#17774](https://github.com/vitejs/vite/issues/17774)) ([efcd830](https://github.com/vitejs/vite/commit/efcd830e479092a0d3b95e0caf4a253d7835892c))
* **deps:** update all non-major dependencies ([#17629](https://github.com/vitejs/vite/issues/17629)) ([93281b0](https://github.com/vitejs/vite/commit/93281b0e09ff8b00e21c24b80ed796db89cbc1ef))
* **deps:** update all non-major dependencies ([#17780](https://github.com/vitejs/vite/issues/17780)) ([e408542](https://github.com/vitejs/vite/commit/e408542748edebd93dba07f21e3fd107725cadca))

### Miscellaneous Chores

* bump typescript-eslint to v8 ([#17624](https://github.com/vitejs/vite/issues/17624)) ([d1891fd](https://github.com/vitejs/vite/commit/d1891fda026d27f53409dec97e156a59da609196))
* **deps:** update all non-major dependencies ([#17734](https://github.com/vitejs/vite/issues/17734)) ([9983731](https://github.com/vitejs/vite/commit/998373120c8306326469d4f342690c17774acdf9))
* **deps:** update all non-major dependencies ([#17820](https://github.com/vitejs/vite/issues/17820)) ([bb2f8bb](https://github.com/vitejs/vite/commit/bb2f8bb55fdd64e4f16831ff98921c221a5e734a))
* **deps:** update typescript ([#17699](https://github.com/vitejs/vite/issues/17699)) ([df5ceb3](https://github.com/vitejs/vite/commit/df5ceb35b7f744cfcdfe3a28834f890f35f2b18f))
* extend commit hash ([#17709](https://github.com/vitejs/vite/issues/17709)) ([4fc9b64](https://github.com/vitejs/vite/commit/4fc9b6424c27aca8004c368b69991a56264e4fdb))
* remove fs-extra dev dependency ([#17782](https://github.com/vitejs/vite/issues/17782)) ([461d37b](https://github.com/vitejs/vite/commit/461d37b9472ab0f12f9da5bf9aa6f98ece1f1962))

### Code Refactoring

* **create-vite:** use named imports for react ([#17773](https://github.com/vitejs/vite/issues/17773)) ([6eab91e](https://github.com/vitejs/vite/commit/6eab91e5011ec443179af5e58aa7c6123b2d445e))

## [5.4.0](https://github.com/vitejs/vite/compare/create-vite@5.3.0...create-vite@5.4.0) (2024-07-16)
### Features

* add `create-preact` to list of options in `create-vite` ([#17674](https://github.com/vitejs/vite/issues/17674)) ([d4d98dc](https://github.com/vitejs/vite/commit/d4d98dc95e1f4e4bbbd1ed4529e08e159598a83a))

### Bug Fixes

* **create-vite:** target dir contains special characters ([#17549](https://github.com/vitejs/vite/issues/17549)) ([f946c86](https://github.com/vitejs/vite/commit/f946c8694056fe05262b08a549f3ff7b484d03ea))
* **deps:** update all non-major dependencies ([#17590](https://github.com/vitejs/vite/issues/17590)) ([012490c](https://github.com/vitejs/vite/commit/012490ca8682e2b560737cb54dbb465ab4f36471))

### Documentation

* **create-vite:** add missing tsconfig.app.json file at the project array for react-ts ([#17645](https://github.com/vitejs/vite/issues/17645)) ([6d31a1d](https://github.com/vitejs/vite/commit/6d31a1de593520ca0f6a323d4f2fde4e59770f4a))

### Miscellaneous Chores

* add `create-preact` recommendation to Preact templates ([#17649](https://github.com/vitejs/vite/issues/17649)) ([564c8f4](https://github.com/vitejs/vite/commit/564c8f45f5429bd149b441d7dca4f44347dedfb1))
* **deps:** update all non-major dependencies ([#17553](https://github.com/vitejs/vite/issues/17553)) ([a33a97f](https://github.com/vitejs/vite/commit/a33a97f8c32bdeadcad5a9e0de50612ac985d3d0))

## [5.3.0](https://github.com/vitejs/vite/compare/create-vite@5.2.3...create-vite@5.3.0) (2024-06-21)
### Features

* **create-vite:** add help usage ([#16390](https://github.com/vitejs/vite/issues/16390)) ([1d9bfc0](https://github.com/vitejs/vite/commit/1d9bfc006bcfdc9159154fe453adeab9294afd54))
* **create-vite:** use "solution" tsconfig so that vite.config.ts is type checked ([#15913](https://github.com/vitejs/vite/issues/15913)) ([cf3f40c](https://github.com/vitejs/vite/commit/cf3f40cd383509fdb1294568fb38bacfac419ea1))

### Bug Fixes

* **create-vite:** revert eslint 9 upgrade in templates ([#17511](https://github.com/vitejs/vite/issues/17511)) ([86cf1b4](https://github.com/vitejs/vite/commit/86cf1b4b497557f09a0d9a81dc304e7a081d6198))
* **create-vite:** update tsconfig with moduleDetection true ([#17468](https://github.com/vitejs/vite/issues/17468)) ([7b240e4](https://github.com/vitejs/vite/commit/7b240e408ed83f172e9f88823eae3b4a9ba92674))
* **deps:** update all non-major dependencies ([#16258](https://github.com/vitejs/vite/issues/16258)) ([7caef42](https://github.com/vitejs/vite/commit/7caef4216e16d9ac71e38598a9ecedce2281d42f))
* **deps:** update all non-major dependencies ([#16376](https://github.com/vitejs/vite/issues/16376)) ([58a2938](https://github.com/vitejs/vite/commit/58a2938a9766981fdc2ed89bec8ff1c96cae0716))
* **deps:** update all non-major dependencies ([#16488](https://github.com/vitejs/vite/issues/16488)) ([2d50be2](https://github.com/vitejs/vite/commit/2d50be2a5424e4f4c22774652ed313d2a232f8af))
* **deps:** update all non-major dependencies ([#16549](https://github.com/vitejs/vite/issues/16549)) ([2d6a13b](https://github.com/vitejs/vite/commit/2d6a13b0aa1f3860482dac2ce260cfbb0713033f))
* **deps:** update all non-major dependencies ([#16603](https://github.com/vitejs/vite/issues/16603)) ([6711553](https://github.com/vitejs/vite/commit/671155337af795156fe40a95935a8d2b27af1048))
* **deps:** update all non-major dependencies ([#16660](https://github.com/vitejs/vite/issues/16660)) ([bf2f014](https://github.com/vitejs/vite/commit/bf2f0145fecb67ca2342c3530716f4c5ddd35a68))
* **deps:** update all non-major dependencies ([#17321](https://github.com/vitejs/vite/issues/17321)) ([4a89766](https://github.com/vitejs/vite/commit/4a89766d838527c144f14e842211100b16792018))
* **deps:** update all non-major dependencies ([#17430](https://github.com/vitejs/vite/issues/17430)) ([4453d35](https://github.com/vitejs/vite/commit/4453d3578b343d16a8a5298bf154f280088968d9))
* **deps:** update all non-major dependencies ([#17494](https://github.com/vitejs/vite/issues/17494)) ([bf123f2](https://github.com/vitejs/vite/commit/bf123f2c6242424a3648cf9234281fd9ff44e3d5))

### Documentation

* **create-vite:** link to Vue docs for IDE support info ([#16225](https://github.com/vitejs/vite/issues/16225)) ([520bb89](https://github.com/vitejs/vite/commit/520bb8917e9bef86c27a1e3486d51a4878bd4297))

### Miscellaneous Chores

* **create-vite:** update IDE support instructions in helloworld components ([#16605](https://github.com/vitejs/vite/issues/16605)) ([a265282](https://github.com/vitejs/vite/commit/a2652825b791336f7fa7e7b78665a50a043f7b3a))
* **deps:** update all non-major dependencies ([#16325](https://github.com/vitejs/vite/issues/16325)) ([a78e265](https://github.com/vitejs/vite/commit/a78e265822ebf06c5775c2083ee345e974488c6b))
* **deps:** update all non-major dependencies ([#16722](https://github.com/vitejs/vite/issues/16722)) ([b45922a](https://github.com/vitejs/vite/commit/b45922a91d4a73c27f78f26e369b7b1fd8d800e3))
* **deps:** update all non-major dependencies ([#17373](https://github.com/vitejs/vite/issues/17373)) ([f2d52f1](https://github.com/vitejs/vite/commit/f2d52f1384e4048ebe7d6bb8c5410e81540c469a))
* **deps:** update dependency eslint to v9 ([#16661](https://github.com/vitejs/vite/issues/16661)) ([6c10662](https://github.com/vitejs/vite/commit/6c106622812480d2bb134f8ed8efa84e2eb942c4))
* **deps:** update dependency execa to v9 ([#16662](https://github.com/vitejs/vite/issues/16662)) ([76d1642](https://github.com/vitejs/vite/commit/76d1642c3c9b0f5ec2c52a66dd0d0d565c3a2309))

## <small>[5.2.3](https://github.com/vitejs/vite/compare/create-vite@5.2.2...create-vite@5.2.3) (2024-03-20)</small>
### Bug Fixes

* **create-vite:** remove vue3 deprecated plugin (TypeScript Vue Plugin) ([#16158](https://github.com/vitejs/vite/issues/16158)) ([1645fc0](https://github.com/vitejs/vite/commit/1645fc0b284d98998348cddbd6945d6e7f897104))
* **create-vite:** switch to default Remix template ([#16203](https://github.com/vitejs/vite/issues/16203)) ([ea480df](https://github.com/vitejs/vite/commit/ea480df56d355d978e510ea017924bfd876804be))

### Documentation

* update volar name and remove takeover mode related docs ([#16171](https://github.com/vitejs/vite/issues/16171)) ([0a56177](https://github.com/vitejs/vite/commit/0a56177272449489921fef5479b7385dc79a8beb))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#16186](https://github.com/vitejs/vite/issues/16186)) ([842643d](https://github.com/vitejs/vite/commit/842643d82b5fc2b17e994cf47f8fc1a39c09201e))
* **deps:** update dependency vue-tsc to v2 ([#16187](https://github.com/vitejs/vite/issues/16187)) ([72104f6](https://github.com/vitejs/vite/commit/72104f6de5398a1a0511404e8485b3b7721be537))

## <small>[5.2.2](https://github.com/vitejs/vite/compare/create-vite@5.2.1...create-vite@5.2.2) (2024-03-11)</small>
### Bug Fixes

* **create-vite:** ts error in the svelte-ts template ([#16031](https://github.com/vitejs/vite/issues/16031)) ([ff4c834](https://github.com/vitejs/vite/commit/ff4c83456f474e0da0fa7848f6431d4fe35306b8))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#16028](https://github.com/vitejs/vite/issues/16028)) ([7cfe80d](https://github.com/vitejs/vite/commit/7cfe80d0df7edfe861b8cc281303f20fc7633841))
* **deps:** update all non-major dependencies ([#16131](https://github.com/vitejs/vite/issues/16131)) ([a862ecb](https://github.com/vitejs/vite/commit/a862ecb941a432b6e3bab62331012e4b53ddd4e8))

## <small>[5.2.1](https://github.com/vitejs/vite/compare/create-vite@5.2.0...create-vite@5.2.1) (2024-02-21)</small>
### Features

* **create-vite:** add custom remix option for React ([#15995](https://github.com/vitejs/vite/issues/15995)) ([f3b195c](https://github.com/vitejs/vite/commit/f3b195cf3344d1f0a3b6f8cd8600e4df7c577d62))

### Bug Fixes

* **create-vite:** remove tsc command from qwik template ([#15982](https://github.com/vitejs/vite/issues/15982)) ([5e05f10](https://github.com/vitejs/vite/commit/5e05f10069c84f5749da9d3cdb7d5a5a1a349c53))
* **deps:** update all non-major dependencies ([#15959](https://github.com/vitejs/vite/issues/15959)) ([571a3fd](https://github.com/vitejs/vite/commit/571a3fde438d60540cfeba132e24646badf5ff2f))
* **qwik template:** change preview script ([#15975](https://github.com/vitejs/vite/issues/15975)) ([725589a](https://github.com/vitejs/vite/commit/725589adbf7f5ab940600c51f8540c7b15fb3d69))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#15874](https://github.com/vitejs/vite/issues/15874)) ([d16ce5d](https://github.com/vitejs/vite/commit/d16ce5db2f0c4dd327093bae2cbaab0d20c511e9))
* **deps:** update typescript-eslint monorepo to v7 (major) ([#15960](https://github.com/vitejs/vite/issues/15960)) ([7b9e927](https://github.com/vitejs/vite/commit/7b9e927a65e0f8580a6a8faeaa938f659390259f))

## [5.2.0](https://github.com/vitejs/vite/compare/create-vite@5.1.0...create-vite@5.2.0) (2024-02-08)
### Features

* **create-vite:** allow overwrite in command line ([#15808](https://github.com/vitejs/vite/issues/15808)) ([1882c73](https://github.com/vitejs/vite/commit/1882c734b1aa3199d12988f06591b71ed5d5af27))
* **create-vite:** set "strict: true" in tsconfig.node.json ([#15820](https://github.com/vitejs/vite/issues/15820)) ([5e5ca7d](https://github.com/vitejs/vite/commit/5e5ca7d1db938cfd8c770746facf52e099c62583))

### Bug Fixes

* **create-vite:** turn off `react/jsx-no-target-blank` ESLint rule in React JS template ([#15672](https://github.com/vitejs/vite/issues/15672)) ([a6f39e8](https://github.com/vitejs/vite/commit/a6f39e861c9981ea36864ebac90ea4c52863b9a5))
* **deps:** update all non-major dependencies ([#15375](https://github.com/vitejs/vite/issues/15375)) ([ab56227](https://github.com/vitejs/vite/commit/ab56227d89c92bfa781264e1474ed522892e3b8f))
* **deps:** update all non-major dependencies ([#15603](https://github.com/vitejs/vite/issues/15603)) ([109fb80](https://github.com/vitejs/vite/commit/109fb805fd28c9f738036985b90cf207d1c48e89))
* **deps:** update all non-major dependencies ([#15675](https://github.com/vitejs/vite/issues/15675)) ([4d9363a](https://github.com/vitejs/vite/commit/4d9363ad6bc460fe2da811cb48b036e53b8cfc75))
* **deps:** update all non-major dependencies ([#15803](https://github.com/vitejs/vite/issues/15803)) ([e0a6ef2](https://github.com/vitejs/vite/commit/e0a6ef2b9e6f1df8c5e71efab6182b7cf662d18d))

### Documentation

* changed bunx create-vite to bun create vite ([#15646](https://github.com/vitejs/vite/issues/15646)) ([f3c11bb](https://github.com/vitejs/vite/commit/f3c11bb8ab14648379d9816b4e0df980cd4ac214))

### Miscellaneous Chores

* **deps:** update dependency @vitejs/plugin-vue to v5 ([#15474](https://github.com/vitejs/vite/issues/15474)) ([17857e7](https://github.com/vitejs/vite/commit/17857e79d2c9bbe53f7d35ea6046133d68699940))

## [5.1.0](https://github.com/vitejs/vite/compare/create-vite@5.0.0...create-vite@5.1.0) (2023-12-12)
### Features

* **cli:** allow initializing non-empty directory ([#15272](https://github.com/vitejs/vite/issues/15272)) ([00669e1](https://github.com/vitejs/vite/commit/00669e135ecfe7f8dbaddcee531efd368bdfa2d2))

### Bug Fixes

* **deps:** update all non-major dependencies ([#15233](https://github.com/vitejs/vite/issues/15233)) ([ad3adda](https://github.com/vitejs/vite/commit/ad3adda7215c33874a07cbd4d430fcffe4c85dce))
* **deps:** update all non-major dependencies ([#15304](https://github.com/vitejs/vite/issues/15304)) ([bb07f60](https://github.com/vitejs/vite/commit/bb07f605cca698a81f1b4606ddefb34485069dd1))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#15145](https://github.com/vitejs/vite/issues/15145)) ([7ff2c0a](https://github.com/vitejs/vite/commit/7ff2c0afe8c6b6901385af829f2e7e80c1fe344c))

## [5.0.0](https://github.com/vitejs/vite/compare/create-vite@5.0.0-beta.1...create-vite@5.0.0) (2023-11-16)
### Features

* **create-vite:** update templates for vite 5 ([#15007](https://github.com/vitejs/vite/issues/15007)) ([e208697](https://github.com/vitejs/vite/commit/e208697c8e772e01b62797e29ae808ba40aa3a7c))

### Bug Fixes

* **create-vite:** remove repeated styles in vue-template ([#14766](https://github.com/vitejs/vite/issues/14766)) ([0fed210](https://github.com/vitejs/vite/commit/0fed2104ad07f0de4dbf29ed8d6047b6918c7db3))
* **deps:** update all non-major dependencies ([#14729](https://github.com/vitejs/vite/issues/14729)) ([d5d96e7](https://github.com/vitejs/vite/commit/d5d96e712788bc762d9c135bc84628dbcfc7fb58))
* **deps:** update all non-major dependencies ([#14883](https://github.com/vitejs/vite/issues/14883)) ([e5094e5](https://github.com/vitejs/vite/commit/e5094e5bf2aee3516d04ce35ba2fb27e70ea9858))
* **deps:** update all non-major dependencies ([#14961](https://github.com/vitejs/vite/issues/14961)) ([0bb3995](https://github.com/vitejs/vite/commit/0bb3995a7d2245ef1cc7b2ed8a5242e33af16874))

### Miscellaneous Chores

* **deps:** update dependency eslint-plugin-react-refresh to ^0.4.4 ([#14795](https://github.com/vitejs/vite/issues/14795)) ([7881457](https://github.com/vitejs/vite/commit/788145790e7652d715575d7a0bc33a825b49d566))

## [5.0.0-beta.1](https://github.com/vitejs/vite/compare/create-vite@5.0.0-beta.0...create-vite@5.0.0-beta.1) (2023-10-19)
### ⚠ BREAKING CHANGES

* rollup v4 (#14508)

### Features

* rollup v4 ([#14508](https://github.com/vitejs/vite/issues/14508)) ([dee6067](https://github.com/vitejs/vite/commit/dee6067ec78c9f9d7923d780b4941d835b34fcf4))

### Bug Fixes

* **deps:** update all non-major dependencies ([#14559](https://github.com/vitejs/vite/issues/14559)) ([6868480](https://github.com/vitejs/vite/commit/6868480d0036f08388e82611992d58ee52cf97b7))
* **deps:** update all non-major dependencies ([#14635](https://github.com/vitejs/vite/issues/14635)) ([21017a9](https://github.com/vitejs/vite/commit/21017a9408643cbc7204215ecc5a3fdaf74dc81e))
* **deps:** update dependency lit to v3 ([#14638](https://github.com/vitejs/vite/issues/14638)) ([c81f3da](https://github.com/vitejs/vite/commit/c81f3da6c3a07beb3cd84fe538090754a3549ce9))

### Documentation

* **create-vite:** add qwik and qwik-ts to the list ([#14624](https://github.com/vitejs/vite/issues/14624)) ([de87fe4](https://github.com/vitejs/vite/commit/de87fe442facd66124fae959baa769ada2e4b6c0))

### Miscellaneous Chores

* **create-vite:** update dependencies ([#14698](https://github.com/vitejs/vite/issues/14698)) ([bd82c30](https://github.com/vitejs/vite/commit/bd82c308c01587d14aeb90af054bcc433b3833fd))

## [5.0.0-beta.0](https://github.com/vitejs/vite/compare/create-vite@4.4.1...create-vite@5.0.0-beta.0) (2023-10-04)
### ⚠ BREAKING CHANGES

* bump minimum node version to 18 (#14030)

### Features

* bump minimum node version to 18 ([#14030](https://github.com/vitejs/vite/issues/14030)) ([2c1a45c](https://github.com/vitejs/vite/commit/2c1a45c86cab6ecf02abb6e50385f773d5ed568e))
* **create-vite:** update to vite 5.0 beta ([#14534](https://github.com/vitejs/vite/issues/14534)) ([97c58e0](https://github.com/vitejs/vite/commit/97c58e0d045aea9088ae7d0492c3073847658e95))

### Bug Fixes

* **create-vite:** remove non-standard style ([#14451](https://github.com/vitejs/vite/issues/14451)) ([8349d4e](https://github.com/vitejs/vite/commit/8349d4e7efd2835eafde5d85eec51defa5d8b69f))
* **create-vite:** remove redundant tsconfig include configuration ([#14256](https://github.com/vitejs/vite/issues/14256)) ([6ea34cc](https://github.com/vitejs/vite/commit/6ea34ccdd5b83f2b76aebbff2cf263621322e0f9))
* **deps:** update all non-major dependencies ([#14092](https://github.com/vitejs/vite/issues/14092)) ([68638f7](https://github.com/vitejs/vite/commit/68638f7b0b04ddfdf35dc8686c6a022aadbb9453))
* **deps:** update all non-major dependencies ([#14460](https://github.com/vitejs/vite/issues/14460)) ([b77bff0](https://github.com/vitejs/vite/commit/b77bff0b93ba9449f63c8373ecf82289a39832a0))
* **deps:** update all non-major dependencies ([#14510](https://github.com/vitejs/vite/issues/14510)) ([eb204fd](https://github.com/vitejs/vite/commit/eb204fd3c5bffb6c6fb40f562f762e426fbaf183))
* **template:** eliminate the error that occurs when enabling eslint-plugin-markdown ([#13942](https://github.com/vitejs/vite/issues/13942)) ([6251a66](https://github.com/vitejs/vite/commit/6251a666555a42ae518e76af6011e9cb091e3028))

### Documentation

* detect Bun package manager in `create-vite` ([#14017](https://github.com/vitejs/vite/issues/14017)) ([4d3cdd1](https://github.com/vitejs/vite/commit/4d3cdd1b316950885d3edd210d7777cf71b347ce))
* remove npm@6 commands ([#14240](https://github.com/vitejs/vite/issues/14240)) ([65b6906](https://github.com/vitejs/vite/commit/65b690657f0f97ef7912f3f45002c725d4bcc989))

### Miscellaneous Chores

* **create-vite:** add npm badge ([#14251](https://github.com/vitejs/vite/issues/14251)) ([68bd0a8](https://github.com/vitejs/vite/commit/68bd0a84011eb2bd8a7bb03da6e95acc97e466ea))
* **deps:** update all non-major dependencies ([#13938](https://github.com/vitejs/vite/issues/13938)) ([a1b519e](https://github.com/vitejs/vite/commit/a1b519e2c71593b6b4286c2f0bd8bfe2e0ad046d))
* **deps:** update all non-major dependencies ([#14034](https://github.com/vitejs/vite/issues/14034)) ([b0ebf5c](https://github.com/vitejs/vite/commit/b0ebf5c69d5dbd1daad32ae3f96515e6073473ad))
* ensure create-vite has unbuild dev dep ([#14419](https://github.com/vitejs/vite/issues/14419)) ([881d080](https://github.com/vitejs/vite/commit/881d080c293b642685b2448088422102f24821e7))
* **templates:** alias react to preact/compat in tsconfig ([#14262](https://github.com/vitejs/vite/issues/14262)) ([c796959](https://github.com/vitejs/vite/commit/c7969597caba80cf5d3348cba9f18ad9d14e9295))
* update manually bumped deps ([#14430](https://github.com/vitejs/vite/issues/14430)) ([995c4b6](https://github.com/vitejs/vite/commit/995c4b6303e418780d3039db09f591d41dd6b473))

## <small>[4.4.1](https://github.com/vitejs/vite/compare/create-vite@4.4.0...create-vite@4.4.1) (2023-07-20)</small>
### Bug Fixes

* **create-vite:** fix eslint configuration for React templates ([#13749](https://github.com/vitejs/vite/issues/13749)) ([2ad78aa](https://github.com/vitejs/vite/commit/2ad78aa205563f87b1607d0789608c13695cd9da))
* **deps:** update all non-major dependencies ([#13758](https://github.com/vitejs/vite/issues/13758)) ([8ead116](https://github.com/vitejs/vite/commit/8ead11648514ae4975bf4328d6e15bd4dd42e45e))
* **deps:** update all non-major dependencies ([#13872](https://github.com/vitejs/vite/issues/13872)) ([975a631](https://github.com/vitejs/vite/commit/975a631ec7c2373354aeeac6bc2977f24b54d13d))

### Miscellaneous Chores

* **deps:** update dependency prettier to v3 ([#13759](https://github.com/vitejs/vite/issues/13759)) ([5a56941](https://github.com/vitejs/vite/commit/5a56941a895fd0ffdbdbf0094336fb7f0f4099c1))

## [4.4.0](https://github.com/vitejs/vite/compare/create-vite@4.3.2...create-vite@4.4.0) (2023-07-06)
### Features

* **create-vite:** add qwik templates ([#13620](https://github.com/vitejs/vite/issues/13620)) ([ef4602b](https://github.com/vitejs/vite/commit/ef4602bc56c0b9579342acca7ef82ba655d56a2e))
* **create-vite:** add solidjs templates ([#12218](https://github.com/vitejs/vite/issues/12218)) ([#12241](https://github.com/vitejs/vite/issues/12241)) ([277e844](https://github.com/vitejs/vite/commit/277e844c1a0cc729c387d9a16ef838835eb06f49))
* **create-vite:** update create vite for Svelte 4 ([#13602](https://github.com/vitejs/vite/issues/13602)) ([8868fb7](https://github.com/vitejs/vite/commit/8868fb76e18f532e5f72b154f37d518dcc68e45b))
* update eslint config in React templates ([#13550](https://github.com/vitejs/vite/issues/13550)) ([6fe1491](https://github.com/vitejs/vite/commit/6fe14911deac34f5874687705a46deb9caf1cb10))

### Bug Fixes

* 'module' is not defined eslint error in template-react (fix [#13517](https://github.com/vitejs/vite/issues/13517)) ([#13518](https://github.com/vitejs/vite/issues/13518)) ([41380a5](https://github.com/vitejs/vite/commit/41380a5bbce90f0c9e00d80a55b5dd71a5a706f8))
* **create-vite:** support bun as a script runner ([#13402](https://github.com/vitejs/vite/issues/13402)) ([471fba2](https://github.com/vitejs/vite/commit/471fba2d1cf647a0bea747739d4d90def60e83ce))
* **deps:** update all non-major dependencies ([#13059](https://github.com/vitejs/vite/issues/13059)) ([123ef4c](https://github.com/vitejs/vite/commit/123ef4c47c611ebd99d8b41c89c547422aea9c1d))
* **deps:** update all non-major dependencies ([#13488](https://github.com/vitejs/vite/issues/13488)) ([bd09248](https://github.com/vitejs/vite/commit/bd09248e50ae50ec57b9a72efe0a27aa397ec2e1))
* **deps:** update all non-major dependencies ([#13701](https://github.com/vitejs/vite/issues/13701)) ([02c6bc3](https://github.com/vitejs/vite/commit/02c6bc38645ce18f9e1c8a71421fb8aad7081688))
* **template:** bump react-swc plugin version ([#13699](https://github.com/vitejs/vite/issues/13699)) ([8315f9e](https://github.com/vitejs/vite/commit/8315f9ec8555aa6f91531425c817683f054fc45f))

### Miscellaneous Chores

* add funding field ([#13585](https://github.com/vitejs/vite/issues/13585)) ([2501627](https://github.com/vitejs/vite/commit/250162775031a8798f67e8be71fd226a79c9831b))
* **deps:** update all non-major dependencies ([#13553](https://github.com/vitejs/vite/issues/13553)) ([3ea0534](https://github.com/vitejs/vite/commit/3ea05342d41277baf11a73763f082e6e75c46a8f))
* **deps:** update all non-major dependencies ([#13633](https://github.com/vitejs/vite/issues/13633)) ([c72fb9b](https://github.com/vitejs/vite/commit/c72fb9b91a277cc79862e65bb1138a44bc339813))
* **deps:** update dependency @tsconfig/svelte to v5 ([#13702](https://github.com/vitejs/vite/issues/13702)) ([70f0659](https://github.com/vitejs/vite/commit/70f0659a51c18bf764ba8f5b981444e15aa468e3))

## <small>[4.3.2](https://github.com/vitejs/vite/compare/create-vite@4.3.1...create-vite@4.3.2) (2023-05-29)</small>
### Bug Fixes

* **create-vite:** use `"target": "ES2020"` in React template ([#13147](https://github.com/vitejs/vite/issues/13147)) ([23096b1](https://github.com/vitejs/vite/commit/23096b19998978803c132021eee175153fa6078d))
* upgrade svelte-check preventing unmet peer deps errors ([#13103](https://github.com/vitejs/vite/issues/13103)) ([c63ba3f](https://github.com/vitejs/vite/commit/c63ba3fa08a64d75bfffa6885dc4c44875b9c5ba))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#12805](https://github.com/vitejs/vite/issues/12805)) ([5731ac9](https://github.com/vitejs/vite/commit/5731ac9caaef629e892e20394f0cc73c565d9a87))

## <small>[4.3.1](https://github.com/vitejs/vite/compare/create-vite@4.3.0...create-vite@4.3.1) (2023-04-25)</small>
### Bug Fixes

* **create-vite:** fix h1 css selector in lit templates ([#12951](https://github.com/vitejs/vite/issues/12951)) ([21c61cb](https://github.com/vitejs/vite/commit/21c61cbbbe1add738f3fc4e8e80de2c73b1fc5a8))

### Miscellaneous Chores

* **create-vite:** bump vue-tsc ([#12952](https://github.com/vitejs/vite/issues/12952)) ([30fd101](https://github.com/vitejs/vite/commit/30fd101aa170e06d89a938e657bd4af7da6ee17e))
* **create-vite:** update to plugin-react 4.0.0 ([14cd939](https://github.com/vitejs/vite/commit/14cd93979265700677bcc8322ff729a33bebe514))

## [4.3.0](https://github.com/vitejs/vite/compare/create-vite@4.3.0-beta.0...create-vite@4.3.0) (2023-04-20)
### Features

* **create-vite:** add eslint to React templates ([#12801](https://github.com/vitejs/vite/issues/12801)) ([d84460a](https://github.com/vitejs/vite/commit/d84460a5fcc553d71ce1d4962d22ab53419d2b10))
* **create-vite:** move TypeScript ones up ([#12057](https://github.com/vitejs/vite/issues/12057)) ([313712d](https://github.com/vitejs/vite/commit/313712d28893c1e2405f4c2937033873e4c38d7b))

### Bug Fixes

* **create-vite:** update template-lit-ts tsconfig (fix [#12854](https://github.com/vitejs/vite/issues/12854)) ([#12855](https://github.com/vitejs/vite/issues/12855)) ([c186815](https://github.com/vitejs/vite/commit/c186815e38f1e0f9fb8195456eb41ffec07d3c80))

### Documentation

* update link to svelte-hmr ([#12893](https://github.com/vitejs/vite/issues/12893)) ([2ddeead](https://github.com/vitejs/vite/commit/2ddeead7beabbc1c6dd292dcb1f728a0bdd8ad63))

### Miscellaneous Chores

* **create-vite:** remove unnecessary App class Reference ([#12771](https://github.com/vitejs/vite/issues/12771)) ([1607f4a](https://github.com/vitejs/vite/commit/1607f4ac10715a60a32a1a6029a4fea9eaa33b14))
* **create-vite:** remove wrapper div for react template ([#12867](https://github.com/vitejs/vite/issues/12867)) ([3679bd7](https://github.com/vitejs/vite/commit/3679bd757f1b24d40f7c66ace14167b97f8093cc))
* **deps:** update dependency @tsconfig/svelte to v4 ([#12879](https://github.com/vitejs/vite/issues/12879)) ([79619a9](https://github.com/vitejs/vite/commit/79619a95ab5ecd848fb73583fa578851c374d27e))

## [4.3.0-beta.0](https://github.com/vitejs/vite/compare/create-vite@4.2.0...create-vite@4.3.0-beta.0) (2023-04-06)
### Features

* **create-vite:** lit templates will create application instead of library ([#12459](https://github.com/vitejs/vite/issues/12459)) ([8186b9b](https://github.com/vitejs/vite/commit/8186b9b2b0734544ec37412de7ec2606ba8b1359))
* **create-vite:** stricter TS configs in templates ([#12604](https://github.com/vitejs/vite/issues/12604)) ([4ffaeee](https://github.com/vitejs/vite/commit/4ffaeee2033531788bc6d4d2541b8b5e44352591))
* **create-vite:** use typescript 5.0 in templates ([#12481](https://github.com/vitejs/vite/issues/12481)) ([8582e2d](https://github.com/vitejs/vite/commit/8582e2dcfbfa3cd6bf72a305adcba40bbe8d0570))

### Bug Fixes

* **create-vite:** skip lib check in tsconfig templates ([#12591](https://github.com/vitejs/vite/issues/12591)) ([a59914c](https://github.com/vitejs/vite/commit/a59914c71d28a89f5b71b836d8d278d2ed43d2c3))
* **create-vite:** updated js & ts templates with new react docs link ([#12479](https://github.com/vitejs/vite/issues/12479)) ([c327006](https://github.com/vitejs/vite/commit/c3270069d91e44f498c81674dfb00a9392fce7ee))
* **deps:** update all non-major dependencies ([#12389](https://github.com/vitejs/vite/issues/12389)) ([3e60b77](https://github.com/vitejs/vite/commit/3e60b778b0ed178a83f674031f5edb123e6c123c))

### Miscellaneous Chores

* **create-vite:** revert to vite 4.2 ([#12456](https://github.com/vitejs/vite/issues/12456)) ([535c8c5](https://github.com/vitejs/vite/commit/535c8c5ca4afdc7b3507c860aedb2a257f97f95a))
* **create-vite:** rollback to vite 4.1 due to npm publish outage ([d8cb765](https://github.com/vitejs/vite/commit/d8cb765a52598778352dfbc428ace4a306ccbcdb))
* **create-vite:** update to vite 4.3 beta ([9b0df5d](https://github.com/vitejs/vite/commit/9b0df5d55f677dd0c9b180ebd8e3f29c30d7a592))
* use @vitejs/release-scripts ([#12682](https://github.com/vitejs/vite/issues/12682)) ([9c37cc1](https://github.com/vitejs/vite/commit/9c37cc1148737458d0580353e37f1e746f766eae))

## [4.2.0](https://github.com/vitejs/vite/compare/create-vite@4.2.0-beta.1...create-vite@4.2.0) (2023-03-16)
### Features

* **create-vite:** support create-electron-vite ([#12390](https://github.com/vitejs/vite/issues/12390)) ([708133e](https://github.com/vitejs/vite/commit/708133e8453ded99d18886087807139977166c9d))

### Bug Fixes

* **create-vite:** fix broken vite logo when base changed ([#12374](https://github.com/vitejs/vite/issues/12374)) ([2b472d1](https://github.com/vitejs/vite/commit/2b472d1ea0fb1a9fea33e2b5ad71c0a22bcd56d0))

### Styles

* **create-vite:** use quotes for attributes consistently ([#12383](https://github.com/vitejs/vite/issues/12383)) ([46c5f46](https://github.com/vitejs/vite/commit/46c5f469edf0315934222c88fba4ddda87c85adc))

### Miscellaneous Chores

* **create-vite:** update plugin-vue ([e06cda9](https://github.com/vitejs/vite/commit/e06cda970cdb3773c75aecfc12e6fe2151156966))
* **deps:** update all non-major dependencies ([#12299](https://github.com/vitejs/vite/issues/12299)) ([b41336e](https://github.com/vitejs/vite/commit/b41336e450b093fb3e454806ec4245ebad7ba9c5))

## [4.2.0-beta.1](https://github.com/vitejs/vite/compare/create-vite@4.2.0-beta.0...create-vite@4.2.0-beta.1) (2023-03-07)
### Miscellaneous Chores

* **create-vite:** update to beta deps ([5ffcaa0](https://github.com/vitejs/vite/commit/5ffcaa00b1dfd2281988e29506ea801d7ac57e8f))

## [4.2.0-beta.0](https://github.com/vitejs/vite/compare/create-vite@4.1.0...create-vite@4.2.0-beta.0) (2023-03-07)
### Bug Fixes

* **create-vite:** add final newline for package.json ([#11906](https://github.com/vitejs/vite/issues/11906)) ([e033e49](https://github.com/vitejs/vite/commit/e033e492d491d25790baf475023a828eda6d4d9a))
* **deps:** update all non-major dependencies ([#12036](https://github.com/vitejs/vite/issues/12036)) ([48150f2](https://github.com/vitejs/vite/commit/48150f2ea4d7ff8e3b67f15239ae05f5be317436))

### Miscellaneous Chores

* **create-vite:** update volar link in helloworld components ([#12145](https://github.com/vitejs/vite/issues/12145)) ([7110ddf](https://github.com/vitejs/vite/commit/7110ddf39b3b6f122945bbbc5025773c64f9d948))

## [4.1.0](https://github.com/vitejs/vite/compare/create-vite@4.1.0-beta.0...create-vite@4.1.0) (2023-02-02)
### Bug Fixes

* **deps:** update all non-major dependencies ([#11846](https://github.com/vitejs/vite/issues/11846)) ([5d55083](https://github.com/vitejs/vite/commit/5d5508311f9856de69babd72dc4de0e7c21c7ae8))
* two folders are created when the project name contains spaces ([#11630](https://github.com/vitejs/vite/issues/11630)) ([758fc6c](https://github.com/vitejs/vite/commit/758fc6c0b5b7e98e73007172abe3d6b28b24a4be))

### Miscellaneous Chores

* **create-vite:** update plugin-react to 3.1.0 ([8895629](https://github.com/vitejs/vite/commit/8895629f0067acb9f5072d3b7bed1d57da43be66))

## [4.1.0-beta.0](https://github.com/vitejs/vite/compare/create-vite@4.0.0...create-vite@4.1.0-beta.0) (2023-01-26)
### Features

* **create-vite:** add preprocess to sveltejs template ([#11600](https://github.com/vitejs/vite/issues/11600)) ([529b0a6](https://github.com/vitejs/vite/commit/529b0a6f3cfe20b973a91722eba4adaf71224a48))

### Bug Fixes

* **create-vite:** update templates to use better font ([#11665](https://github.com/vitejs/vite/issues/11665)) ([a65d31b](https://github.com/vitejs/vite/commit/a65d31bbdfca43f76cf0e6212fef7841af8f148d))

### Miscellaneous Chores

* **create-vite:** added transition to grow back drop in ([#11392](https://github.com/vitejs/vite/issues/11392)) ([d0757e2](https://github.com/vitejs/vite/commit/d0757e29380c2086f50ef595d468b7f9f911acd0))
* **deps:** update all non-major dependencies ([#11321](https://github.com/vitejs/vite/issues/11321)) ([dcc0004](https://github.com/vitejs/vite/commit/dcc0004ceb7a76e6d0cbae8b84a103a15f80049b))
* **deps:** update all non-major dependencies ([#11419](https://github.com/vitejs/vite/issues/11419)) ([896475d](https://github.com/vitejs/vite/commit/896475dc6c7e5f1168e21d556201a61659552617))
* **deps:** update all non-major dependencies ([#11701](https://github.com/vitejs/vite/issues/11701)) ([1d2ee63](https://github.com/vitejs/vite/commit/1d2ee6315365b33f84d9d8703fcd46307f6250e3))
* **deps:** update all non-major dependencies ([#11787](https://github.com/vitejs/vite/issues/11787)) ([271394f](https://github.com/vitejs/vite/commit/271394fc7157a08b19f22d3751c8ec6e69f0bd5f))
* typecheck create-vite ([#11295](https://github.com/vitejs/vite/issues/11295)) ([af86e5b](https://github.com/vitejs/vite/commit/af86e5bcfe4b78f486f499cba09c3270fb151d54))
* update create-vite templates for beta testing ([7dbb24f](https://github.com/vitejs/vite/commit/7dbb24fd6b76d732e3b33287eccb50762c8312cd))
* update plugin-react to 3.1.0-beta.0 ([#11820](https://github.com/vitejs/vite/issues/11820)) ([f0480a5](https://github.com/vitejs/vite/commit/f0480a5691241ee755eda4ed9d4c814ef4524377))

### Tests

* use default import for fs-extra ([#11543](https://github.com/vitejs/vite/issues/11543)) ([d3bed53](https://github.com/vitejs/vite/commit/d3bed53929cf4e3187137a4f4e9e1e4b3a2a5a95))

## [4.0.0](https://github.com/vitejs/vite/compare/create-vite@4.0.0-beta.0...create-vite@4.0.0) (2022-12-09)
### ⚠ BREAKING CHANGES

* **svelte:** update svelte templates to vite-plugin-svelte 2.0.0 (#11279)

### Features

* **create-vite:** add react-swc templates ([#11280](https://github.com/vitejs/vite/issues/11280)) ([348146f](https://github.com/vitejs/vite/commit/348146f3e39232900eeb347d0922b97b5886bafa))
* **svelte:** update svelte templates to vite-plugin-svelte 2.0.0 ([#11279](https://github.com/vitejs/vite/issues/11279)) ([2a558ef](https://github.com/vitejs/vite/commit/2a558efd2fa7de6c8c91b2bda2a0dea9de6658ae))

### Bug Fixes

* **create-vite:** update react-swc template name ([#11281](https://github.com/vitejs/vite/issues/11281)) ([b3b9ac5](https://github.com/vitejs/vite/commit/b3b9ac511f550d4635489f0609cd6efdde1f79b3))

### Miscellaneous Chores

* udpate vite and plugins to stable ([#11278](https://github.com/vitejs/vite/issues/11278)) ([026f41e](https://github.com/vitejs/vite/commit/026f41e87e6eb89491c88f62952d7a094f810811))

## [4.0.0-beta.0](https://github.com/vitejs/vite/compare/create-vite@3.2.1...create-vite@4.0.0-beta.0) (2022-12-07)
### Bug Fixes

* **deps:** update all non-major dependencies ([#10804](https://github.com/vitejs/vite/issues/10804)) ([f686afa](https://github.com/vitejs/vite/commit/f686afa6d3bc0f501b936dcbc2c4552c865fa3f9))
* **deps:** update all non-major dependencies ([#11091](https://github.com/vitejs/vite/issues/11091)) ([073a4bf](https://github.com/vitejs/vite/commit/073a4bfe2642a4dda2183a9dfecac864524893e1))

### Performance Improvements

* regexp perf issues, refactor regexp stylistic issues ([#10905](https://github.com/vitejs/vite/issues/10905)) ([fc007df](https://github.com/vitejs/vite/commit/fc007dfba2e0392bd29f7e6e2663ca910ed18a6b))

### Miscellaneous Chores

* **create-vite:** align vue template with create-vue ([#11128](https://github.com/vitejs/vite/issues/11128)) ([1a54e58](https://github.com/vitejs/vite/commit/1a54e58fbd55d89d4e8681d1e62eb5a76f4600e9))
* **deps:** typescript 4.9 ([#11229](https://github.com/vitejs/vite/issues/11229)) ([6b4c4e2](https://github.com/vitejs/vite/commit/6b4c4e28bd1b125adb842e333813e8d57b7ee43d))
* **deps:** update all non-major dependencies ([#10910](https://github.com/vitejs/vite/issues/10910)) ([f6ad607](https://github.com/vitejs/vite/commit/f6ad607d2430a44ea7dc71ecd3c44c1e8bf8446f))
* **deps:** update all non-major dependencies ([#11006](https://github.com/vitejs/vite/issues/11006)) ([96f2e98](https://github.com/vitejs/vite/commit/96f2e98f6a196652962ccb5f2fa6195c050c463f))
* **deps:** update all non-major dependencies ([#11182](https://github.com/vitejs/vite/issues/11182)) ([8b83089](https://github.com/vitejs/vite/commit/8b830899ef0ce4ebe257ed18222543f60b775832))
* enable prettier trailing commas ([#11167](https://github.com/vitejs/vite/issues/11167)) ([134ce68](https://github.com/vitejs/vite/commit/134ce6817984bad0f5fb043481502531fee9b1db))
* update create-vite to use beta versions ([#11244](https://github.com/vitejs/vite/issues/11244)) ([f7cfab9](https://github.com/vitejs/vite/commit/f7cfab95ee87a4a2377c5c57f506cc7464347d45))

### Code Refactoring

* move framework plugins out of core ([#11158](https://github.com/vitejs/vite/issues/11158)) ([5935619](https://github.com/vitejs/vite/commit/5935619d855951be50e4e9f1bcccaeda83aae432))

## <small>[3.2.1](https://github.com/vitejs/vite/compare/create-vite@3.2.0...create-vite@3.2.1) (2022-11-07)</small>
### Bug Fixes

* **create-vite:** add `rel="noreferrer"` to elements with `target="_blank"` ([#10675](https://github.com/vitejs/vite/issues/10675)) ([e8eb67a](https://github.com/vitejs/vite/commit/e8eb67a6aed1408d43cc5c9176b3f697c0153f94))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#10725](https://github.com/vitejs/vite/issues/10725)) ([22cfad8](https://github.com/vitejs/vite/commit/22cfad87c824e717b6c616129f3b579be2e979b2))

## [3.2.0](https://github.com/vitejs/vite/compare/create-vite@3.1.0...create-vite@3.2.0) (2022-10-26)
### Features

* **create-vite:** support create-vite-extra ([#10214](https://github.com/vitejs/vite/issues/10214)) ([8116cbd](https://github.com/vitejs/vite/commit/8116cbdf67d2e15e5520e8d408b453f825270727))
* Switch to JSX runtime transform in preact-ts template ([#10061](https://github.com/vitejs/vite/issues/10061)) ([bf69063](https://github.com/vitejs/vite/commit/bf69063282c27d66bc5b9ad04feec288c0142a86))

### Bug Fixes

* **create-vite:** remove baseUrl from Svelte configs ([#10200](https://github.com/vitejs/vite/issues/10200)) ([9c7a331](https://github.com/vitejs/vite/commit/9c7a33156bc9a71ba1fd013732c0a798df5baa13))
* **deps:** update all non-major dependencies ([#10077](https://github.com/vitejs/vite/issues/10077)) ([caf00c8](https://github.com/vitejs/vite/commit/caf00c8c7a5c81a92182116ffa344b34ce4c3b5e))
* **deps:** update all non-major dependencies ([#10160](https://github.com/vitejs/vite/issues/10160)) ([6233c83](https://github.com/vitejs/vite/commit/6233c830201085d869fbbd2a7e622a59272e0f43))
* **deps:** update all non-major dependencies ([#10316](https://github.com/vitejs/vite/issues/10316)) ([a38b450](https://github.com/vitejs/vite/commit/a38b450441eea02a680b80ac0624126ba6abe3f7))
* **deps:** update all non-major dependencies ([#10610](https://github.com/vitejs/vite/issues/10610)) ([bb95467](https://github.com/vitejs/vite/commit/bb954672e3ee863e5cb37fa78167e5fc6df9ae4e))
* **deps:** update all non-major dependencies ([#9985](https://github.com/vitejs/vite/issues/9985)) ([855f2f0](https://github.com/vitejs/vite/commit/855f2f077eb8dc41b395bccecb6a5b836eb526a9))

### Miscellaneous Chores

* **create-vite:** remove sourcemap, move --noEmit to tsconfig ([#10150](https://github.com/vitejs/vite/issues/10150)) ([414d2ef](https://github.com/vitejs/vite/commit/414d2ef6e53a8030be68388952f28e1b42d2bb8e))
* **deps:** update all non-major dependencies ([#10393](https://github.com/vitejs/vite/issues/10393)) ([f519423](https://github.com/vitejs/vite/commit/f519423170fafeee9d58aeb2052cb3bc224f25f8))
* **deps:** update all non-major dependencies ([#10488](https://github.com/vitejs/vite/issues/10488)) ([15aa827](https://github.com/vitejs/vite/commit/15aa827283d6cbf9f55c02d6d8a3fe43dbd792e4))
* **deps:** update dependency vue-tsc to v1 ([#10547](https://github.com/vitejs/vite/issues/10547)) ([9d0e0af](https://github.com/vitejs/vite/commit/9d0e0af41ad21ceb6a94396965a90e613e476e7b))
* remove duplicated logic in vanilla template ([#10145](https://github.com/vitejs/vite/issues/10145)) ([f29fef5](https://github.com/vitejs/vite/commit/f29fef5dc3f87ccc5d430e177bbc0671e9d56679))

## [3.1.0](https://github.com/vitejs/vite/compare/create-vite@3.0.2...create-vite@3.1.0) (2022-09-05)
### Features

* **create-vite:** add support for custom init commands (`create-vue`, Nuxt, and SvelteKit) ([#9406](https://github.com/vitejs/vite/issues/9406)) ([1673f3d](https://github.com/vitejs/vite/commit/1673f3daa0147b2afa546648ec913837402fec21))
* skip `.git` when emptying dir ([#9659](https://github.com/vitejs/vite/issues/9659)) ([07fe65e](https://github.com/vitejs/vite/commit/07fe65e33a014e54ce331fb5192aa7c7585eebfa))

### Bug Fixes

* **deps:** update all non-major dependencies ([#9888](https://github.com/vitejs/vite/issues/9888)) ([e35a58b](https://github.com/vitejs/vite/commit/e35a58ba46f906feea8ab46886c3306257c61560))

### Performance Improvements

* bundle create-vite ([#9034](https://github.com/vitejs/vite/issues/9034)) ([37ac91e](https://github.com/vitejs/vite/commit/37ac91e5f680aea56ce5ca15ce1291adc3cbe05e))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#9675](https://github.com/vitejs/vite/issues/9675)) ([4e56e87](https://github.com/vitejs/vite/commit/4e56e87623501109198e019ebe809872528ab088))
* **deps:** update all non-major dependencies ([#9778](https://github.com/vitejs/vite/issues/9778)) ([aceaefc](https://github.com/vitejs/vite/commit/aceaefc19eaa05c76b8a7adec035a0e4b33694c6))

### Code Refactoring

* **create-vite:** migrate to TypeScript ([#9941](https://github.com/vitejs/vite/issues/9941)) ([85fa2c8](https://github.com/vitejs/vite/commit/85fa2c89f35ecdda4ec5ed52ea50110337d98822))

### Tests

* **cli:** remove unnecessary generics usage ([#9859](https://github.com/vitejs/vite/issues/9859)) ([45d6797](https://github.com/vitejs/vite/commit/45d6797d9e573fe572dfd6d1c337c8c21f4c29a4))

## <small>[3.0.2](https://github.com/vitejs/vite/compare/create-vite@3.0.1...create-vite@3.0.2) (2022-08-12)</small>
## <small>[3.0.1](https://github.com/vitejs/vite/compare/create-vite@3.0.0...create-vite@3.0.1) (2022-08-11)</small>
### Bug Fixes

* **create-vite:** update vanilla-ts brand color ([#9254](https://github.com/vitejs/vite/issues/9254)) ([bff3abb](https://github.com/vitejs/vite/commit/bff3abbc9a6ebe8dabd2398666de42ae8e13f2dc))
* **deps:** update all non-major dependencies ([#9176](https://github.com/vitejs/vite/issues/9176)) ([31d3b70](https://github.com/vitejs/vite/commit/31d3b70672ea8759a8d7ff1993d64bb4f0e30fab))
* **deps:** update all non-major dependencies ([#9575](https://github.com/vitejs/vite/issues/9575)) ([8071325](https://github.com/vitejs/vite/commit/80713256d0dd5716e42086fb617e96e9e92c3675))
* mention that Node.js 13/15 support is dropped (fixes [#9113](https://github.com/vitejs/vite/issues/9113)) ([#9116](https://github.com/vitejs/vite/issues/9116)) ([2826303](https://github.com/vitejs/vite/commit/2826303bd253e20df2746f84f6a7c06cb5cf3d6b))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#9347](https://github.com/vitejs/vite/issues/9347)) ([2fcb027](https://github.com/vitejs/vite/commit/2fcb0272442664c395322acfc7899ab6a32bd86c))
* **deps:** update all non-major dependencies ([#9478](https://github.com/vitejs/vite/issues/9478)) ([c530d16](https://github.com/vitejs/vite/commit/c530d168309557c7a254128364f07f7b4f017e14))
* remove unused `favicon.svg` ([#9181](https://github.com/vitejs/vite/issues/9181)) ([33b5b0d](https://github.com/vitejs/vite/commit/33b5b0d0231f4ce0f40c799965f9352ae062eff3))
* tidy up eslint config ([#9468](https://github.com/vitejs/vite/issues/9468)) ([f4addcf](https://github.com/vitejs/vite/commit/f4addcfc24b1668b906411ff8f8fc394ce5c3643))

## [3.0.0](https://github.com/vitejs/vite/compare/create-vite@2.9.3...create-vite@3.0.0) (2022-07-13)
### ⚠ BREAKING CHANGES

* bump targets (#8045)
* remove node v12 support (#7833)

### Features

* bump minimum node version to 14.18.0 ([#8662](https://github.com/vitejs/vite/issues/8662)) ([8a05432](https://github.com/vitejs/vite/commit/8a05432e6dcc0e11d78c7b029e7340fa47fceb92))
* **create-vite:** add `type: module` to all templates ([#8251](https://github.com/vitejs/vite/issues/8251)) ([c3ec60c](https://github.com/vitejs/vite/commit/c3ec60c4eca39d5641141ed0d1812f37e047a2e6))
* **create-vite:** align template styles with docs ([#8478](https://github.com/vitejs/vite/issues/8478)) ([d72b3dd](https://github.com/vitejs/vite/commit/d72b3ddacd7fee209234dc1dd4081ce90f10d091))
* **create-vite:** migrate to ESM ([#8253](https://github.com/vitejs/vite/issues/8253)) ([49478ae](https://github.com/vitejs/vite/commit/49478ae7c2ea9f9fe197021bed4a2f9f0f9c7b1e))
* **create-vite:** supports nested directory (closes [#6638](https://github.com/vitejs/vite/issues/6638)) ([#6739](https://github.com/vitejs/vite/issues/6739)) ([6ccf9aa](https://github.com/vitejs/vite/commit/6ccf9aab1d2c89d05dce97051a2eca71b5d1145b))
* **create-vite:** use framework brand glow color ([#8539](https://github.com/vitejs/vite/issues/8539)) ([3a21a5e](https://github.com/vitejs/vite/commit/3a21a5e39b47120e5139269138eae0e2ca2efcd4))

### Bug Fixes

* **create-vite:** allow slash at the end of project path ([#6897](https://github.com/vitejs/vite/issues/6897)) ([8167db3](https://github.com/vitejs/vite/commit/8167db32ec44047b006a93a7969028101f5d9276))
* **create-vite:** remove import from public ([#9074](https://github.com/vitejs/vite/issues/9074)) ([880f560](https://github.com/vitejs/vite/commit/880f5608b435a32a5c5b4554c8ef929c24149007))
* **deps:** update all non-major dependencies ([#8281](https://github.com/vitejs/vite/issues/8281)) ([c68db4d](https://github.com/vitejs/vite/commit/c68db4d7ad2c1baee41f280b34ae89a85ba0373d))
* **deps:** update all non-major dependencies ([#8391](https://github.com/vitejs/vite/issues/8391)) ([842f995](https://github.com/vitejs/vite/commit/842f995ca69600c4c06c46d202fe713b80373418))
* **deps:** update all non-major dependencies ([#8558](https://github.com/vitejs/vite/issues/8558)) ([9a1fd4c](https://github.com/vitejs/vite/commit/9a1fd4ccf8986dd92b85563e7304b2591f782365))
* **deps:** update all non-major dependencies ([#8802](https://github.com/vitejs/vite/issues/8802)) ([a4a634d](https://github.com/vitejs/vite/commit/a4a634d6a08f8b54f052cfc2cc1b60c1bca6d48a))
* **lib:** use proper extension ([#6827](https://github.com/vitejs/vite/issues/6827)) ([34df307](https://github.com/vitejs/vite/commit/34df3075fce5bf71f4f69335bb6811731b1cadb0))
* template-react-ts warning when importing path in vite.config.ts ([#8924](https://github.com/vitejs/vite/issues/8924)) ([0e6b82e](https://github.com/vitejs/vite/commit/0e6b82ea130963ff60f419e3f352ec7702bea22e))
* use Vitest for unit testing, clean regex bug ([#8040](https://github.com/vitejs/vite/issues/8040)) ([63cd53d](https://github.com/vitejs/vite/commit/63cd53d2480e40db717aff78966240eb6482aba4))

### Documentation

* correct pnpm command ([#8763](https://github.com/vitejs/vite/issues/8763)) ([8108b1b](https://github.com/vitejs/vite/commit/8108b1ba1f954241d3bdd18bbc70905aa2dc95f3))

### Miscellaneous Chores

* bump minors and rebuild lock ([#8074](https://github.com/vitejs/vite/issues/8074)) ([aeb5b74](https://github.com/vitejs/vite/commit/aeb5b7436df5a4d7cf0ee1a9f6f110d00ef7aac1))
* cleanup now that we've dropped Node 12 ([#8239](https://github.com/vitejs/vite/issues/8239)) ([29659a0](https://github.com/vitejs/vite/commit/29659a0cbb58e3d7a7fcb951ee50dd64ce24be49))
* **create-vite:** add current directory description ([#8501](https://github.com/vitejs/vite/issues/8501)) ([8d08220](https://github.com/vitejs/vite/commit/8d082204cb9b7f7412f328ea7670e76738cce44a))
* **create-vite:** react-ts non-null-assertion ([#7881](https://github.com/vitejs/vite/issues/7881)) ([771312b](https://github.com/vitejs/vite/commit/771312b9b3ae5d68eecbcf1c22f7ba08e8f9347c))
* **create-vite:** update logo and header styles ([#8502](https://github.com/vitejs/vite/issues/8502)) ([1f1ca5e](https://github.com/vitejs/vite/commit/1f1ca5eb2a2493804f79562334bc8708dd246f0d))
* **create-vite:** upgrade vite-plugin-svelte ([#9076](https://github.com/vitejs/vite/issues/9076)) ([acaf9e0](https://github.com/vitejs/vite/commit/acaf9e04cee054ec82b5236696e6c749a44745d6))
* **create-vite:** use Type assertion in preact-ts ([#8579](https://github.com/vitejs/vite/issues/8579)) ([d1ba059](https://github.com/vitejs/vite/commit/d1ba0590a43f3c25a25522b1b2c9bf51a17fbde4))
* **deps:** update all non-major dependencies ([#8474](https://github.com/vitejs/vite/issues/8474)) ([6d0ede7](https://github.com/vitejs/vite/commit/6d0ede7c60aaa4c010207a047bf30a2b87b5049f))
* **deps:** update all non-major dependencies ([#8669](https://github.com/vitejs/vite/issues/8669)) ([628863d](https://github.com/vitejs/vite/commit/628863dc6120804cc1af8bda2ea98e802ded0e84))
* **deps:** update all non-major dependencies ([#8905](https://github.com/vitejs/vite/issues/8905)) ([4a24c17](https://github.com/vitejs/vite/commit/4a24c17772bdbbc6077fae08b536bdb089eeefe1))
* **deps:** update all non-major dependencies ([#9022](https://github.com/vitejs/vite/issues/9022)) ([6342140](https://github.com/vitejs/vite/commit/6342140e6ac7e033ca83d3494f94ea20ca2eaf07))
* **deps:** update dependency @tsconfig/svelte to v3 ([#8282](https://github.com/vitejs/vite/issues/8282)) ([015ebed](https://github.com/vitejs/vite/commit/015ebed220011b9e12d63906cea315a77a31c8d7))
* enable ESLint for `__tests__` dir ([#8370](https://github.com/vitejs/vite/issues/8370)) ([cd21abf](https://github.com/vitejs/vite/commit/cd21abfb636ce4c6dd1507f134f1ee9bb67f6717))
* update major deps ([#8572](https://github.com/vitejs/vite/issues/8572)) ([0e20949](https://github.com/vitejs/vite/commit/0e20949dbf0ba38bdaefbf32a36764fe29858e20))
* use node prefix ([#8309](https://github.com/vitejs/vite/issues/8309)) ([60721ac](https://github.com/vitejs/vite/commit/60721ac53a1bf326d1cac097f23642faede234ff))
* use vite-env.d.ts convention ([#8988](https://github.com/vitejs/vite/issues/8988)) ([cf23963](https://github.com/vitejs/vite/commit/cf23963b50eafe5504cb16e97b161fa6cc4ebabe))

### Build System

* bump targets ([#8045](https://github.com/vitejs/vite/issues/8045)) ([66efd69](https://github.com/vitejs/vite/commit/66efd69a399fd73284cc7a3bffc904e154291a14))
* remove node v12 support ([#7833](https://github.com/vitejs/vite/issues/7833)) ([eeac2d2](https://github.com/vitejs/vite/commit/eeac2d2e217ddbca79d5b1dfde9bb5097e821b6a))

## <small>[2.9.3](https://github.com/vitejs/vite/compare/create-vite@2.9.2...create-vite@2.9.3) (2022-05-02)</small>
### Features

* **create-vite:** scaffold directory with only .git ([#7971](https://github.com/vitejs/vite/issues/7971)) ([a5bdb9f](https://github.com/vitejs/vite/commit/a5bdb9fa706850c45134c25b77aea2dee1ea03d4))

### Miscellaneous Chores

* **create-vite:** update reference to volar vscode extension ([#7994](https://github.com/vitejs/vite/issues/7994)) ([2b6d8fe](https://github.com/vitejs/vite/commit/2b6d8fec25961b34e2bfcf776be0fb4e499b4cf9))

## <small>[2.9.2](https://github.com/vitejs/vite/compare/create-vite@2.9.1...create-vite@2.9.2) (2022-04-19)</small>
### Bug Fixes

* **create-vite:** bump `vue-tsc` to `0.34.7` ([#7760](https://github.com/vitejs/vite/issues/7760)) ([9a93233](https://github.com/vitejs/vite/commit/9a932339aae8bfbb9f3b522706c551a21a1eea3a))
* **create-vite:** set skipLibCheck true ([#7726](https://github.com/vitejs/vite/issues/7726)) ([54e9cdd](https://github.com/vitejs/vite/commit/54e9cdd9f913ba7b650bce6657b5ff666dd0b5a8))

### Miscellaneous Chores

* remove useless code in preact template ([#7789](https://github.com/vitejs/vite/issues/7789)) ([e5729be](https://github.com/vitejs/vite/commit/e5729bee1e3f0753dc3514757fa15e5533c387fe))

## <small>[2.9.1](https://github.com/vitejs/vite/compare/create-vite@2.9.0...create-vite@2.9.1) (2022-04-13)</small>
### Miscellaneous Chores

* **create-vite-app:** upgrade react to 18 ([#7597](https://github.com/vitejs/vite/issues/7597)) ([8b21029](https://github.com/vitejs/vite/commit/8b21029f9dcd1a63e8b58f3d54cef12c53ebef53))
* **create-vite:** add isolatedModules ([#7697](https://github.com/vitejs/vite/issues/7697)) ([8f28350](https://github.com/vitejs/vite/commit/8f28350291dde55e9d20b05f124b53867bcaf8e9))
* fix term cases ([#7553](https://github.com/vitejs/vite/issues/7553)) ([c296130](https://github.com/vitejs/vite/commit/c29613013ca1c6d9c77b97e2253ed1f07e40a544))
* update @types/react version ([#7655](https://github.com/vitejs/vite/issues/7655)) ([eb57627](https://github.com/vitejs/vite/commit/eb57627a368a5ae0532b5836c176647525d5394f))
* update vue template setup api doc url ([#7628](https://github.com/vitejs/vite/issues/7628)) ([4433df4](https://github.com/vitejs/vite/commit/4433df4c6b278d5a2f4d2ca14f0a7930ed647e80))

## [2.9.0](https://github.com/vitejs/vite/compare/create-vite@2.8.0...create-vite@2.9.0) (2022-03-30)
### Documentation

* **vue-ts:** update note on vue type support in ts ([#6165](https://github.com/vitejs/vite/issues/6165)) ([cfc7648](https://github.com/vitejs/vite/commit/cfc76482269b2f2c9f44404e901b208b9c8b7331))

### Miscellaneous Chores

* add isolatedModules to create-vite > template-vue-ts > tsconfig ([#7304](https://github.com/vitejs/vite/issues/7304)) ([21990ea](https://github.com/vitejs/vite/commit/21990ea394e3c82ca716cb6b55d2f5ca3bec646c))
* **deps:** update all non-major dependencies ([#7490](https://github.com/vitejs/vite/issues/7490)) ([42c15f6](https://github.com/vitejs/vite/commit/42c15f6bad06f98962bc058c69a9f1e1a0f23440))

## [2.8.0](https://github.com/vitejs/vite/compare/create-vite@2.7.2...create-vite@2.8.0) (2022-02-09)
### Features

* **create-vite:** tsconfig support vite.config.ts ([#6324](https://github.com/vitejs/vite/issues/6324)) ([bfbdb22](https://github.com/vitejs/vite/commit/bfbdb2242e57cfba0309a88475a1f9cf2a50413f))

### Bug Fixes

* **create-vite:** use `reset` for prompts for white bg color shell ([#6131](https://github.com/vitejs/vite/issues/6131)) ([dd3bbb8](https://github.com/vitejs/vite/commit/dd3bbb8e21aff812ec482f760e1abceb6bd67aef))

### Documentation

* align npm commands to other pms (create and add) ([#6550](https://github.com/vitejs/vite/issues/6550)) ([e6b06e5](https://github.com/vitejs/vite/commit/e6b06e535fb26e064f5c341703df4bcb30aa6432))
* update node version note ([#6177](https://github.com/vitejs/vite/issues/6177)) ([10e8f85](https://github.com/vitejs/vite/commit/10e8f857d320cfbb2f0375dac03911484cbc0b33))

### Miscellaneous Chores

* convert scripts to TS ([#6160](https://github.com/vitejs/vite/issues/6160)) ([15b6f1b](https://github.com/vitejs/vite/commit/15b6f1ba82731c16b19e00ca3b28b1a898caa4d4))
* **create-vite:** add more gitignore ([#6247](https://github.com/vitejs/vite/issues/6247)) ([64b1595](https://github.com/vitejs/vite/commit/64b1595030be0500b1fbc31ec8e51d34951c6c11))
* **deps:** update all non-major dependencies ([#6185](https://github.com/vitejs/vite/issues/6185)) ([b45f4ad](https://github.com/vitejs/vite/commit/b45f4ad9f1336d1e88d271d7aca9498dde2e5013))
* ensure local package private ([#6785](https://github.com/vitejs/vite/issues/6785)) ([487c1d1](https://github.com/vitejs/vite/commit/487c1d1236a7459f5b2e1d1af049d9e085b1e5ee))
* prefer type imports ([#5835](https://github.com/vitejs/vite/issues/5835)) ([7186857](https://github.com/vitejs/vite/commit/71868579058512b51991718655e089a78b99d39c))

## <small>[2.7.2](https://github.com/vitejs/vite/compare/create-vite@2.7.1...create-vite@2.7.2) (2021-12-13)</small>
## <small>[2.7.1](https://github.com/vitejs/vite/compare/create-vite@2.7.0...create-vite@2.7.1) (2021-12-12)</small>
### Miscellaneous Chores

* bump vue version ([5e60562](https://github.com/vitejs/vite/commit/5e60562254e47d2ad0aaa246d3c5016e498d98bf))
* update create-vite templates ([cdebb49](https://github.com/vitejs/vite/commit/cdebb49c558864cb09019dd3e62a2f5335a05ee8))

## [2.7.0](https://github.com/vitejs/vite/compare/create-vite@2.6.6...create-vite@2.7.0) (2021-12-07)
### Bug Fixes

* **create-vite:** update vue-tsc for dts flags ([#5453](https://github.com/vitejs/vite/issues/5453)) ([c93bc3d](https://github.com/vitejs/vite/commit/c93bc3df90b5c4e8e25ffd864ae53a3ae7559315))

### Documentation

* switch from pnpm dlx to pnpm create ([#5322](https://github.com/vitejs/vite/issues/5322)) ([9afc2e7](https://github.com/vitejs/vite/commit/9afc2e7c5d6e7289bf035e9ad3cbf5a7758a0732))

### Miscellaneous Chores

* bump vue version ([ecafa80](https://github.com/vitejs/vite/commit/ecafa8090b50131c34a9973f4f66db0c15aafa51))
* **deps:** update create-vite ([#5461](https://github.com/vitejs/vite/issues/5461)) ([6e8a70f](https://github.com/vitejs/vite/commit/6e8a70fd3979334f6f8abe3fcd795437e887c9d5))
* use cjs extension with scripts ([#5877](https://github.com/vitejs/vite/issues/5877)) ([775baba](https://github.com/vitejs/vite/commit/775babac40da546b01b8b8cbd7dff32b5cfcee6d))

### Code Refactoring

* normalize scripts and commands naming ([#5207](https://github.com/vitejs/vite/issues/5207)) ([22873a7](https://github.com/vitejs/vite/commit/22873a7d040a244935aca24823a484cb0cdc0876))

## <small>[2.6.6](https://github.com/vitejs/vite/compare/create-vite@2.6.5...create-vite@2.6.6) (2021-10-07)</small>
## <small>[2.6.5](https://github.com/vitejs/vite/compare/create-vite@2.6.4...create-vite@2.6.5) (2021-09-29)</small>
### Features

* **create-vite:** migrate lit-element to lit ([#5012](https://github.com/vitejs/vite/issues/5012)) ([d66ea0f](https://github.com/vitejs/vite/commit/d66ea0f420eb7926d927b64e40ecaf83d9388e63))

## <small>[2.6.4](https://github.com/vitejs/vite/compare/create-vite@2.6.3...create-vite@2.6.4) (2021-09-22)</small>
### Miscellaneous Chores

* **create-vite:** use @vitejs/plugin-react ([#5030](https://github.com/vitejs/vite/issues/5030)) ([42a9ef2](https://github.com/vitejs/vite/commit/42a9ef269617318b68cd379f3a71eeee6f8d5e29))

## <small>[2.6.3](https://github.com/vitejs/vite/compare/create-vite@2.6.2...create-vite@2.6.3) (2021-09-21)</small>
### Features

* **create-vite:** update vue templates ([a2be9c1](https://github.com/vitejs/vite/commit/a2be9c11fccb53ed60a33d72025c2d30635be1a7))

### Bug Fixes

* pnpm create-vite command documentation ([#4902](https://github.com/vitejs/vite/issues/4902)) ([3392a8a](https://github.com/vitejs/vite/commit/3392a8ad5618cc68b6898a327b6c8959de6f4992))

### Miscellaneous Chores

* **create-vite:** skip pre-releases when updating version ([9bc56ef](https://github.com/vitejs/vite/commit/9bc56efb21511a62f94a5c6a4937b09ad9c5c7fe))
* format ([#4931](https://github.com/vitejs/vite/issues/4931)) ([e59997f](https://github.com/vitejs/vite/commit/e59997f79c8b450bdc9ab357d90f444dc0a99f50))

## <small>[2.6.2](https://github.com/vitejs/vite/compare/create-vite@2.6.1...create-vite@2.6.2) (2021-09-07)</small>
### Miscellaneous Chores

* recommend volar vscode extension ([#4842](https://github.com/vitejs/vite/issues/4842)) ([5bc0ffc](https://github.com/vitejs/vite/commit/5bc0ffc125ffe105de73f4cf306e2b24f7ec644c))

## <small>[2.6.1](https://github.com/vitejs/vite/compare/create-vite@2.5.4...create-vite@2.6.1) (2021-08-31)</small>
### Features

* **create-vite:** update vue templates ([87a9a70](https://github.com/vitejs/vite/commit/87a9a70f75991a8afb06a0b84f4eab43ca76fa89))
* explicit set `useDefineForClassFields` in ts templates ([#4280](https://github.com/vitejs/vite/issues/4280)) ([fe74173](https://github.com/vitejs/vite/commit/fe74173f19b6e341114723a99043440abce27bd6))

### Bug Fixes

* **create-vite:** project name with only numbers as an argument ([#4606](https://github.com/vitejs/vite/issues/4606)) ([085a621](https://github.com/vitejs/vite/commit/085a6219ceb89052ac0a269e7ccda081e534a800))

### Miscellaneous Chores

* bump vue version (fix broken alias test case) ([a6c8fa3](https://github.com/vitejs/vite/commit/a6c8fa3b465d03475a4c372b17cf9f3153b73a84))
* **create-vite:** bump versions ([12bca19](https://github.com/vitejs/vite/commit/12bca19530104240ca55cedb71cce6183ecd9c07))

## <small>[2.5.4](https://github.com/vitejs/vite/compare/create-vite@2.5.3...create-vite@2.5.4) (2021-08-03)</small>
### Bug Fixes

* **create-vite:** distinguish pnpm pkgManager ([#4220](https://github.com/vitejs/vite/issues/4220)) ([c0a3dbf](https://github.com/vitejs/vite/commit/c0a3dbfa66266378f6f329f1981d5827b781fdbb))

## <small>[2.5.3](https://github.com/vitejs/vite/compare/create-vite@2.5.2...create-vite@2.5.3) (2021-07-27)</small>
### Miscellaneous Chores

* **create-vite:** update version of vue-tsc ([#4390](https://github.com/vitejs/vite/issues/4390)) ([08471ef](https://github.com/vitejs/vite/commit/08471ef626b325572c823ea82c4e23e8c312798e))

## <small>[2.5.2](https://github.com/vitejs/vite/compare/create-vite@2.5.1...create-vite@2.5.2) (2021-07-20)</small>
### Bug Fixes

* create-vite when targetDir is a valid packageName ([#4247](https://github.com/vitejs/vite/issues/4247)) ([02e244d](https://github.com/vitejs/vite/commit/02e244dce128e7ea054034f68a0e28edabec28a0))

### Miscellaneous Chores

* format ([#4233](https://github.com/vitejs/vite/issues/4233)) ([e519548](https://github.com/vitejs/vite/commit/e519548be0eb5ddb9cb43486174d9b0fb6eb4d05))
* use eslint rule eqeqeq ([#4234](https://github.com/vitejs/vite/issues/4234)) ([732d60c](https://github.com/vitejs/vite/commit/732d60cc99c6ea4dfcf5fd625d36632a8dc6c078))

## <small>[2.5.1](https://github.com/vitejs/vite/compare/create-vite@2.5.0...create-vite@2.5.1) (2021-07-12)</small>
### Miscellaneous Chores

* update create-vite commands ([#4216](https://github.com/vitejs/vite/issues/4216)) ([eb39853](https://github.com/vitejs/vite/commit/eb39853479d6dfd6bd0e63ad07a44e8614986866))

# 2.5.0 (2021-07-12)

* @vitejs/create-app has been moved to create-vite, so the command to scaffold a Vite app is now shorter and easier to remember.

With NPM:

```bash
$ npm init vite@latest
```

With Yarn:

```bash
$ yarn create vite
```

With PNPM:

```bash
$ pnpm dlx create-vite
```


## [2.4.5](https://github.com/vitejs/vite/compare/create-app@2.4.4...create-app@2.4.5) (2021-07-05)


### Bug Fixes

* **deps:** update all non-major dependencies ([#3878](https://github.com/vitejs/vite/issues/3878)) ([a66a805](https://github.com/vitejs/vite/commit/a66a8053e9520d20bcf95fce870570c5195bcc91))



## [2.4.4](https://github.com/vitejs/vite/compare/create-app@2.4.3...create-app@2.4.4) (2021-06-22)


### Bug Fixes

* **create-app:** svelte templates use type module (fixes [#3834](https://github.com/vitejs/vite/issues/3834)) ([#3835](https://github.com/vitejs/vite/issues/3835)) ([ddefe84](https://github.com/vitejs/vite/commit/ddefe8410efdb2104763b9d03fec0e42b9f7bf17))
* **deps:** update all non-major dependencies ([#3791](https://github.com/vitejs/vite/issues/3791)) ([74d409e](https://github.com/vitejs/vite/commit/74d409eafca8d74ec4a6ece621ea2895bc1f2a32))



## [2.4.3](https://github.com/vitejs/vite/compare/create-app@2.4.2...create-app@2.4.3) (2021-06-16)


### Bug Fixes

* **create-app:** improve prompt message ([#3769](https://github.com/vitejs/vite/issues/3769)) ([9703bcd](https://github.com/vitejs/vite/commit/9703bcd7e594769792779306f8f978dcc010d92f))
* **create-app:** update svelte templates to use named export of vite-… ([#3760](https://github.com/vitejs/vite/issues/3760)) ([c69f836](https://github.com/vitejs/vite/commit/c69f83615292953d40f07b1178d1ed1d72abe695))



## [2.4.2](https://github.com/vitejs/vite/compare/create-app@2.4.1...create-app@2.4.2) (2021-06-08)


### Features

* **create-app:** update svelte-ts template to use @tsconfig/svelte a… ([#3668](https://github.com/vitejs/vite/issues/3668)) ([5c3b668](https://github.com/vitejs/vite/commit/5c3b668250903ba9ed75db5c4bb7f548d5cb6105))



## [2.4.1](https://github.com/vitejs/vite/compare/create-app@2.4.0...create-app@2.4.1) (2021-06-01)


### Bug Fixes

* **create-app:** handle invalid template ([#3615](https://github.com/vitejs/vite/issues/3615)) ([4578a8c](https://github.com/vitejs/vite/commit/4578a8cc2f0ab972d6dc6bdb9ac92d6fbbd6fb05))



# [2.4.0](https://github.com/vitejs/vite/compare/create-app@2.3.2...create-app@2.4.0) (2021-06-01)



## [2.3.2](https://github.com/vitejs/vite/compare/create-app@2.3.1...create-app@2.3.2) (2021-05-25)


### Features

* **create-app:** improve client types ([#3214](https://github.com/vitejs/vite/issues/3214)) ([ba8b7af](https://github.com/vitejs/vite/commit/ba8b7afa650277b7218e0bd53564b5fb45bf4549))



## [2.3.1](https://github.com/vitejs/vite/compare/create-app@2.3.0...create-app@2.3.1) (2021-05-17)


### Bug Fixes

* **create-app:** lit-element templates package.json ([#3435](https://github.com/vitejs/vite/issues/3435)) ([74986d3](https://github.com/vitejs/vite/commit/74986d3d053aabe7ec3de20c987e9df309c684b2))



# [2.3.0](https://github.com/vitejs/vite/compare/create-app@2.2.5...create-app@2.3.0) (2021-05-11)


### Features

* **create-app:** bump vite version to 2.3 ([f8315c9](https://github.com/vitejs/vite/commit/f8315c936dd07aa62c51b02f059a42aab103c9c1))



## [2.2.5](https://github.com/vitejs/vite/compare/create-app@2.2.4...create-app@2.2.5) (2021-04-25)


### Features

* **create-app:** improve non-empty message for current dir ([#3117](https://github.com/vitejs/vite/issues/3117)) ([c0a0a84](https://github.com/vitejs/vite/commit/c0a0a8427e61dc0f5774056aebd038c69492294a))



## [2.2.4](https://github.com/vitejs/vite/compare/create-app@2.2.3...create-app@2.2.4) (2021-04-15)


### Bug Fixes

* **create-app:** change index.html templates' favicon.svg href to absolute URL ([#2620](https://github.com/vitejs/vite/issues/2620)) ([3816f6e](https://github.com/vitejs/vite/commit/3816f6edb67e6bdf94db98e82e8acff4029bfe48))
* **create-app:** the node in the svelte template is incorrectly mounted ([#2947](https://github.com/vitejs/vite/issues/2947)) ([0825f7e](https://github.com/vitejs/vite/commit/0825f7ee3574ae3f28f566da27835fbf3b210fac))


### Features

* **create-app:** add template vanilla-ts ([#2023](https://github.com/vitejs/vite/issues/2023)) ([89898d3](https://github.com/vitejs/vite/commit/89898d36cbe03bce9b6a7ab80a1c45de9989e56e))
* **create-app:** two-level prompt for framework and variants ([#2941](https://github.com/vitejs/vite/issues/2941)) ([176e55d](https://github.com/vitejs/vite/commit/176e55dd1bf0232f483697d35b95f6e29a47fd74))



## [2.2.3](https://github.com/vitejs/vite/compare/create-app@2.2.2...create-app@2.2.3) (2021-03-31)


### Features

* **create-app:** improved package name validation ([#2772](https://github.com/vitejs/vite/issues/2772)) ([9fa282e](https://github.com/vitejs/vite/commit/9fa282e9209185c70ac80e2fe1fbe4b7e92dae07))



## [2.2.2](https://github.com/vitejs/vite/compare/create-app@2.2.1...create-app@2.2.2) (2021-03-25)



## [2.2.1](https://github.com/vitejs/vite/compare/create-app@2.2.0...create-app@2.2.1) (2021-03-25)



# [2.2.0](https://github.com/vitejs/vite/compare/create-app@2.1.0...create-app@2.2.0) (2021-03-16)


### Features

* **create-app:** add 'svelte' and 'svelte-ts' options ([#2537](https://github.com/vitejs/vite/issues/2537)) ([e441f23](https://github.com/vitejs/vite/commit/e441f23e187eec0834704949da492515cd25f8cd))



# [2.1.0](https://github.com/vitejs/vite/compare/create-app@2.0.2...create-app@2.1.0) (2021-03-15)


### Bug Fixes

* **create-app:** ensure valid package name when creating project ([1dbf246](https://github.com/vitejs/vite/commit/1dbf24627d0fed4d6936f53fb84bc94b79372652)), closes [#2360](https://github.com/vitejs/vite/issues/2360)


### Features

* **create-app:** add `vue-tsc` for vue-ts template ([#2498](https://github.com/vitejs/vite/issues/2498)) ([b3b3c01](https://github.com/vitejs/vite/commit/b3b3c017d90ac86ba8d02deb93dec443a4fa4bad))



## [2.0.2](https://github.com/vitejs/vite/compare/create-app@2.0.1...create-app@2.0.2) (2021-03-02)


### Bug Fixes

* **create-app:** add missing import meta types in preact ts template ([#2298](https://github.com/vitejs/vite/issues/2298)) ([ee86d2c](https://github.com/vitejs/vite/commit/ee86d2c3a7e967626da5e1d8ed104102df563980))
* typo ([#2127](https://github.com/vitejs/vite/issues/2127)) ([ea95a1d](https://github.com/vitejs/vite/commit/ea95a1d44ab6f1a66701ae43c48f10b2047cb141))



## [2.0.1](https://github.com/vitejs/vite/compare/create-app@2.0.0...create-app@2.0.1) (2021-02-20)


### Bug Fixes

* **create-app:** prompt the user on supplying an invalid template ([#2072](https://github.com/vitejs/vite/issues/2072)) ([ea31690](https://github.com/vitejs/vite/commit/ea31690580d4966b60e2aa8e14ae78dee955935f))
* **create-app:** update prompt message based on user input ([#2103](https://github.com/vitejs/vite/issues/2103)) ([038f786](https://github.com/vitejs/vite/commit/038f78660042454935ef343bce240a5220328760))



# [2.0.0](https://github.com/vitejs/vite/compare/create-app@1.8.0...create-app@2.0.0) (2021-02-16)


### Features

* **create-app:** bump to vite 2.0 ([81c72bb](https://github.com/vitejs/vite/commit/81c72bbdb112e3a6a48c026d4bc18410ec42a53a))



# [1.8.0](https://github.com/vitejs/vite/compare/create-app@1.7.1...create-app@1.8.0) (2021-02-15)


### Bug Fixes

* **create-app:** add declaration tsconfig option ([7b3da03](https://github.com/vitejs/vite/commit/7b3da0320e9d43816e467d7ac8daef3fcdd1dc1e)), closes [#2010](https://github.com/vitejs/vite/issues/2010)


### Features

* **create-app:** closer parity on preact typescript template to preact template ([#1996](https://github.com/vitejs/vite/issues/1996)) ([c2622de](https://github.com/vitejs/vite/commit/c2622defe13a888f398df44d993cd40e0ee07f11))



## [1.7.1](https://github.com/vitejs/vite/compare/create-app@1.7.0...create-app@1.7.1) (2021-02-12)


### Bug Fixes

* ensure intellisense for all create-app templates ([589b295](https://github.com/vitejs/vite/commit/589b29596e8046122b1ad8b69c4c70aa40cd4165))
* **create-app:** Adds a newline before "Scaffolding project in..." ([#1945](https://github.com/vitejs/vite/issues/1945)) ([8a1c602](https://github.com/vitejs/vite/commit/8a1c602b29413b297c811577a9f6690bef88e01c))



# [1.7.0](https://github.com/vitejs/vite/compare/create-app@1.6.0...create-app@1.7.0) (2021-02-08)


### Features

* **create-app:** add favicons for all templates that are missing one ([#1935](https://github.com/vitejs/vite/issues/1935)) ([3fa1d39](https://github.com/vitejs/vite/commit/3fa1d398080372bddc5dab0b4021ac1670a644b9))



# [1.6.0](https://github.com/vitejs/vite/compare/create-app@1.5.2...create-app@1.6.0) (2021-02-05)


### Bug Fixes

* **create-app:** add resolveJsonModule to tsconfig.json for vue-ts template ([#1879](https://github.com/vitejs/vite/issues/1879)) ([2c914a5](https://github.com/vitejs/vite/commit/2c914a5b728d0c130f1e5b73c7b0ab0eedc1cda5))


### Features

* **create-app:** clearer vue-ts setup recommend ([#1896](https://github.com/vitejs/vite/issues/1896)) [skip ci] ([d6bf066](https://github.com/vitejs/vite/commit/d6bf066e3a18b749bed1a7fc622dd2551404e29f))



## [1.5.2](https://github.com/vitejs/vite/compare/create-app@1.5.1...create-app@1.5.2) (2021-02-03)


### Features

* **create-app:** more detailed instructions for vue-ts template ([79dd32c](https://github.com/vitejs/vite/commit/79dd32cbb61b2aeedfd6b1081867a98cc7c73a68))



## [1.5.1](https://github.com/vitejs/vite/compare/create-app@1.5.0...create-app@1.5.1) (2021-01-27)


### Features

* add link to config docs ([ce71d71](https://github.com/vitejs/vite/commit/ce71d71e83785a1072204bf8117a61ab7e4e772c))



# [1.5.0](https://github.com/vitejs/vite/compare/create-app@1.4.0...create-app@1.5.0) (2021-01-25)


### Features

* bump vuedx versions ([fa1229a](https://github.com/vitejs/vite/commit/fa1229abc5602f14cf88470b7337e085164a989e))
* lit-element templates ([830f3d3](https://github.com/vitejs/vite/commit/830f3d34f58cfa7680e1b2d753a023bcb1018ba2)), closes [#1684](https://github.com/vitejs/vite/issues/1684)



# [1.4.0](https://github.com/vitejs/vite/compare/create-app@1.3.0...create-app@1.4.0) (2021-01-24)



# [1.3.0](https://github.com/vitejs/vite/compare/create-app@1.1.0...create-app@1.3.0) (2021-01-23)


### Features

* add colors to create-app options ([cf7e43f](https://github.com/vitejs/vite/commit/cf7e43f8484e21ebd3efb3c86899eadb4f949848))



# [1.2.0](https://github.com/vitejs/vite/compare/create-app@1.1.0...create-app@1.2.0) (2021-01-08)


### Features

* add colors to create-app options ([870f57a](https://github.com/vitejs/vite/commit/870f57a0a67b0ee854b67b40e2c7b9dad58b4004))



# [1.1.0](https://github.com/vitejs/vite/compare/create-app@1.0.6...create-app@1.1.0) (2021-01-08)


### Features

* preact templates ([905cb65](https://github.com/vitejs/vite/commit/905cb65d3b766d584137e5fbb400764bd3156558))



## [1.0.6](https://github.com/vitejs/vite/compare/create-app@1.0.5...create-app@1.0.6) (2021-01-05)


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



## [1.0.5](https://github.com/vitejs/vite/compare/create-app@1.0.4...create-app@1.0.5) (2021-01-05)


### Features

* **create-app:** include env shim ([4802c1a](https://github.com/vitejs/vite/commit/4802c1a56ca79718881fae9466cbb836db8e9453))



## [1.0.4](https://github.com/vitejs/vite/compare/create-app@1.0.3...create-app@1.0.4) (2021-01-04)


### Bug Fixes

* **create-app:** remove favicon link in vanilla template ([d9df7eb](https://github.com/vitejs/vite/commit/d9df7ebc48cd5c04c43830b14504ba391caf37c6)), closes [#1340](https://github.com/vitejs/vite/issues/1340)



## [1.0.3](https://github.com/vitejs/vite/compare/create-app@1.0.2...create-app@1.0.3) (2021-01-02)


### Bug Fixes

* fix yarn create compat ([d135949](https://github.com/vitejs/vite/commit/d135949013ea0e572fe0a7b22bb9306644036c08))



## [1.0.2](https://github.com/vitejs/vite/compare/create-app@1.0.1...create-app@1.0.2) (2021-01-02)



## [1.0.1](https://github.com/vitejs/vite/compare/create-app@1.0.0...create-app@1.0.1) (2021-01-02)


### Bug Fixes

* include template in dist files ([8d0ddf9](https://github.com/vitejs/vite/commit/8d0ddf9f8bdf76b94e31358a3f03955fb4d4e247))



# 1.0.0 (2021-01-02)


### Features

* create-app ([7785958](https://github.com/vitejs/vite/commit/7785958d28316464d2309981d9d0b0ac716da95e))
* initial batch of templates ([2168ed0](https://github.com/vitejs/vite/commit/2168ed0f5019363d71956eabcce60bc31a36d30b))
