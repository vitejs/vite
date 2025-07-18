## <small>[7.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@7.0.0...plugin-legacy@7.0.1) (2025-07-17)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#20324](https://github.com/vitejs/vite/issues/20324)) ([3e81af3](https://github.com/vitejs/vite/commit/3e81af38a80c7617aba6bf3300d8b4267570f9cf))
* **deps:** update all non-major dependencies ([#20366](https://github.com/vitejs/vite/issues/20366)) ([43ac73d](https://github.com/vitejs/vite/commit/43ac73da27b3907c701e95e6a7d28fde659729ec))
* **deps:** update all non-major dependencies ([#20406](https://github.com/vitejs/vite/issues/20406)) ([1a1cc8a](https://github.com/vitejs/vite/commit/1a1cc8a435a21996255b3e5cc75ed4680de2a7f3))
* **legacy:** don't lower CSS if legacy chunks are not generated ([#20392](https://github.com/vitejs/vite/issues/20392)) ([d2c81f7](https://github.com/vitejs/vite/commit/d2c81f7c13030c08becd8a768182074eedb87333))

### Performance Improvements

* **legacy:** skip lowering when detecting polyfills ([#20387](https://github.com/vitejs/vite/issues/20387)) ([7cc0338](https://github.com/vitejs/vite/commit/7cc0338de3a67597956af58e931e46e7913c063b))

### Miscellaneous Chores

* **deps:** update rolldown-related dependencies ([#20323](https://github.com/vitejs/vite/issues/20323)) ([30d2f1b](https://github.com/vitejs/vite/commit/30d2f1b38c72387ffdca3ee4746730959a020b59))
* group commits by category in changelog ([#20310](https://github.com/vitejs/vite/issues/20310)) ([41e83f6](https://github.com/vitejs/vite/commit/41e83f62b1adb65f5af4c1ec006de1c845437edc))

### Code Refactoring

* **legacy:** use Rollup type export from Vite ([#20335](https://github.com/vitejs/vite/issues/20335)) ([d62dc33](https://github.com/vitejs/vite/commit/d62dc3321db05d91e74facff51799496ce8601f3))
* use `foo.endsWith("bar")` instead of `/bar$/.test(foo)` ([#20413](https://github.com/vitejs/vite/issues/20413)) ([862e192](https://github.com/vitejs/vite/commit/862e192d21f66039635a998724bdc6b94fd293a0))

## [7.0.0](https://github.com/vitejs/vite/compare/plugin-legacy@7.0.0-beta.1...plugin-legacy@7.0.0) (2025-06-24)
### Miscellaneous Chores

* **deps:** update rolldown-related dependencies ([#20270](https://github.com/vitejs/vite/issues/20270)) ([f7377c3](https://github.com/vitejs/vite/commit/f7377c3eae6323bd3237ff5de5ae55c879fe7325))
* **legacy:** update peer dep Vite to 7 ([8ff13cd](https://github.com/vitejs/vite/commit/8ff13cdba1c57284eb8f4586b52f814fcf5afcdf))

## [7.0.0-beta.1](https://github.com/vitejs/vite/compare/plugin-legacy@7.0.0-beta.0...plugin-legacy@7.0.0-beta.1) (2025-06-17)
### ⚠ BREAKING CHANGES

* **legacy:** remove `location.protocol!="file:"` condition for modern android webview (#20179)

### Bug Fixes

* **deps:** update all non-major dependencies ([#20141](https://github.com/vitejs/vite/issues/20141)) ([89ca65b](https://github.com/vitejs/vite/commit/89ca65ba1d849046dccdea52e9eca980f331be26))
* **deps:** update all non-major dependencies ([#20181](https://github.com/vitejs/vite/issues/20181)) ([d91d4f7](https://github.com/vitejs/vite/commit/d91d4f7ad55edbcb4a51fc23376cbff89f776d30))
* **legacy:** remove `location.protocol!="file:"` condition for modern android webview ([#20179](https://github.com/vitejs/vite/issues/20179)) ([a6d5997](https://github.com/vitejs/vite/commit/a6d599718ee109798e8f552e317f175513d157e7))

### Miscellaneous Chores

* **deps:** update rolldown-related dependencies ([#20140](https://github.com/vitejs/vite/issues/20140)) ([0387447](https://github.com/vitejs/vite/commit/03874471e3de14e7d2f474ecb354499e7f5eb418))
* **deps:** update rolldown-related dependencies ([#20182](https://github.com/vitejs/vite/issues/20182)) ([6172f41](https://github.com/vitejs/vite/commit/6172f410b44cbae8d052997bb1819a6197a4d397))

## [7.0.0-beta.0](https://github.com/vitejs/vite/compare/plugin-legacy@6.1.1...plugin-legacy@7.0.0-beta.0) (2025-06-02)
### ⚠ BREAKING CHANGES

* bump required node version to 20.19+, 22.12+ and remove cjs build (#20032)
* remove node 18 support (#19972)

### Bug Fixes

* **deps:** update all non-major dependencies ([#19953](https://github.com/vitejs/vite/issues/19953)) ([ac8e1fb](https://github.com/vitejs/vite/commit/ac8e1fb289a06fc0671dab1f4ef68e508e34360e))

### Miscellaneous Chores

* remove node 18 support ([#19972](https://github.com/vitejs/vite/issues/19972)) ([00b8a98](https://github.com/vitejs/vite/commit/00b8a98f36376804437e1342265453915ae613de))
* use tsdown ([#20065](https://github.com/vitejs/vite/issues/20065)) ([d488efd](https://github.com/vitejs/vite/commit/d488efda95ff40f63684194d51858f84c3d05379))

### Code Refactoring

* bump required node version to 20.19+, 22.12+ and remove cjs build ([#20032](https://github.com/vitejs/vite/issues/20032)) ([2b80243](https://github.com/vitejs/vite/commit/2b80243fada75378e80475028fdcc78f4432bd6f))

## <small>[6.1.1](https://github.com/vitejs/vite/compare/plugin-legacy@6.1.0...plugin-legacy@6.1.1) (2025-04-28)</small>
### Bug Fixes

* **legacy:** use unbuild 3.4 for now ([#19928](https://github.com/vitejs/vite/issues/19928)) ([96f73d1](https://github.com/vitejs/vite/commit/96f73d16c8501013be57aee1c8a2353a56460281))

## [6.1.0](https://github.com/vitejs/vite/compare/plugin-legacy@6.0.2...plugin-legacy@6.1.0) (2025-04-16)
### Features

* **legacy:** add 'assumptions' option ([#19719](https://github.com/vitejs/vite/issues/19719)) ([d1d99c9](https://github.com/vitejs/vite/commit/d1d99c9220989ce903dea9cae6c3608f57f377ea))
* **legacy:** add sourcemapBaseUrl support ([#19281](https://github.com/vitejs/vite/issues/19281)) ([a92c74b](https://github.com/vitejs/vite/commit/a92c74b088a253257c01596bd7c67e0f8fa39512))

### Bug Fixes

* **deps:** update all non-major dependencies ([#19555](https://github.com/vitejs/vite/issues/19555)) ([f612e0f](https://github.com/vitejs/vite/commit/f612e0fdf6810317b61fcca1ded125755f261d78))
* **deps:** update all non-major dependencies ([#19613](https://github.com/vitejs/vite/issues/19613)) ([363d691](https://github.com/vitejs/vite/commit/363d691b4995d72f26a14eb59ed88a9483b1f931))
* **deps:** update all non-major dependencies ([#19649](https://github.com/vitejs/vite/issues/19649)) ([f4e712f](https://github.com/vitejs/vite/commit/f4e712ff861f8a9504594a4a5e6d35a7547e5a7e))

### Code Refactoring

* restore endsWith usage ([#19554](https://github.com/vitejs/vite/issues/19554)) ([6113a96](https://github.com/vitejs/vite/commit/6113a9670cc9b7d29fe0bffe033f7823e36ded00))

## <small>[6.0.2](https://github.com/vitejs/vite/compare/plugin-legacy@6.0.1...plugin-legacy@6.0.2) (2025-02-25)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#19392](https://github.com/vitejs/vite/issues/19392)) ([60456a5](https://github.com/vitejs/vite/commit/60456a54fe90872dbd4bed332ecbd85bc88deb92))
* **deps:** update all non-major dependencies ([#19440](https://github.com/vitejs/vite/issues/19440)) ([ccac73d](https://github.com/vitejs/vite/commit/ccac73d9d0e92c7232f09207d1d6b893e823ed8e))
* **legacy:** warn if plugin-legacy is passed to `worker.plugins` ([#19079](https://github.com/vitejs/vite/issues/19079)) ([171f2fb](https://github.com/vitejs/vite/commit/171f2fbe0afe09eeb49f5f29f9ecd845c39a8401))

### Miscellaneous Chores

* fix typos ([#19398](https://github.com/vitejs/vite/issues/19398)) ([b44e3d4](https://github.com/vitejs/vite/commit/b44e3d43db65babe1c32e143964add02e080dc15))

## <small>[6.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@6.0.0...plugin-legacy@6.0.1) (2025-02-05)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#18853](https://github.com/vitejs/vite/issues/18853)) ([5c02236](https://github.com/vitejs/vite/commit/5c0223636fa277d5daeb4d93c3f32d9f3cd69fc5))
* **deps:** update all non-major dependencies ([#18967](https://github.com/vitejs/vite/issues/18967)) ([d88d000](https://github.com/vitejs/vite/commit/d88d0004a8e891ca6026d356695e0b319caa7fce))
* **deps:** update all non-major dependencies ([#19098](https://github.com/vitejs/vite/issues/19098)) ([8639538](https://github.com/vitejs/vite/commit/8639538e6498d1109da583ad942c1472098b5919))
* **deps:** update all non-major dependencies ([#19190](https://github.com/vitejs/vite/issues/19190)) ([f2c07db](https://github.com/vitejs/vite/commit/f2c07dbfc874b46f6e09bb04996d0514663e4544))
* **deps:** update all non-major dependencies ([#19296](https://github.com/vitejs/vite/issues/19296)) ([2bea7ce](https://github.com/vitejs/vite/commit/2bea7cec4b7fddbd5f2fb6090a7eaf5ae7ca0f1b))
* **legacy:** build respect `hashCharacters` config ([#19262](https://github.com/vitejs/vite/issues/19262)) ([3aa10b7](https://github.com/vitejs/vite/commit/3aa10b7d618b178aec0f027b1f5fcd3353d2b166))
* **legacy:** import babel once ([#19152](https://github.com/vitejs/vite/issues/19152)) ([282496d](https://github.com/vitejs/vite/commit/282496daaca43494feceaa59809f6ceafd62dedd))

### Reverts

* update moduleResolution value casing ([#18409](https://github.com/vitejs/vite/issues/18409)) ([#18774](https://github.com/vitejs/vite/issues/18774)) ([b0fc6e3](https://github.com/vitejs/vite/commit/b0fc6e3c2591a30360d3714263cf7cc0e2acbfdf))

## [6.0.0](https://github.com/vitejs/vite/compare/plugin-legacy@5.4.3...plugin-legacy@6.0.0) (2024-11-26)
### ⚠ BREAKING CHANGES

* drop node 21 support in version ranges (#18729)

### Features

* drop node 21 support in version ranges ([#18729](https://github.com/vitejs/vite/issues/18729)) ([a384d8f](https://github.com/vitejs/vite/commit/a384d8fd39162190675abcfea31ba657383a3d03))

### Bug Fixes

* **deps:** update all non-major dependencies ([#18484](https://github.com/vitejs/vite/issues/18484)) ([2ec12df](https://github.com/vitejs/vite/commit/2ec12df98d07eb4c986737e86a4a9f8066724658))
* **deps:** update all non-major dependencies ([#18691](https://github.com/vitejs/vite/issues/18691)) ([f005461](https://github.com/vitejs/vite/commit/f005461ecce89ada21cb0c021f7af460b5479736))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#18562](https://github.com/vitejs/vite/issues/18562)) ([fb227ec](https://github.com/vitejs/vite/commit/fb227ec4402246b5a13e274c881d9de6dd8082dd))
* **legacy:** bump terser peer dep to ^5.16 ([#18772](https://github.com/vitejs/vite/issues/18772)) ([3f6d5fe](https://github.com/vitejs/vite/commit/3f6d5fed8739f30cddb821a680576d93b3a60bba))
* **legacy:** update peer dep Vite to 6 ([#18771](https://github.com/vitejs/vite/issues/18771)) ([63c62b3](https://github.com/vitejs/vite/commit/63c62b3059b589a51d1673bfdcefdb0b4e87c089))
* **plugin-legacy:** add type module in package.json ([#18535](https://github.com/vitejs/vite/issues/18535)) ([28cefca](https://github.com/vitejs/vite/commit/28cefcaf2861b72901abe1f047d9ec6298b745f8))
* upgrade to unbuild v3 rc ([#18502](https://github.com/vitejs/vite/issues/18502)) ([ddd5c5d](https://github.com/vitejs/vite/commit/ddd5c5d00ff7894462a608841560883f9c771f22))

## <small>[5.4.3](https://github.com/vitejs/vite/compare/plugin-legacy@5.4.2...plugin-legacy@5.4.3) (2024-10-25)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#18170](https://github.com/vitejs/vite/issues/18170)) ([c8aea5a](https://github.com/vitejs/vite/commit/c8aea5ae0af90dc6796ef3bdd612d1eb819f157b))
* **deps:** update all non-major dependencies ([#18292](https://github.com/vitejs/vite/issues/18292)) ([5cac054](https://github.com/vitejs/vite/commit/5cac0544dca2764f0114aac38e9922a0c13d7ef4))
* **deps:** update all non-major dependencies ([#18345](https://github.com/vitejs/vite/issues/18345)) ([5552583](https://github.com/vitejs/vite/commit/5552583a2272cd4208b30ad60e99d984e34645f0))
* **legacy:** generate sourcemap for polyfill chunks ([#18250](https://github.com/vitejs/vite/issues/18250)) ([f311ff3](https://github.com/vitejs/vite/commit/f311ff3c2b19636457c3023095ef32ab9a96b84a))

### Performance Improvements

* use `crypto.hash` when available ([#18317](https://github.com/vitejs/vite/issues/18317)) ([2a14884](https://github.com/vitejs/vite/commit/2a148844cf2382a5377b75066351f00207843352))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#17945](https://github.com/vitejs/vite/issues/17945)) ([cfb621e](https://github.com/vitejs/vite/commit/cfb621e7a5a3e24d710a9af156e6855e73caf891))
* **deps:** update all non-major dependencies ([#18050](https://github.com/vitejs/vite/issues/18050)) ([7cac03f](https://github.com/vitejs/vite/commit/7cac03fa5197a72d2e2422bd0243a85a9a18abfc))
* **deps:** update all non-major dependencies ([#18404](https://github.com/vitejs/vite/issues/18404)) ([802839d](https://github.com/vitejs/vite/commit/802839d48335a69eb15f71f2cd816d0b6e4d3556))
* enable some eslint rules ([#18084](https://github.com/vitejs/vite/issues/18084)) ([e9a2746](https://github.com/vitejs/vite/commit/e9a2746ca77473b1814fd05db3d299c074135fe5))
* remove stale TODOs ([#17866](https://github.com/vitejs/vite/issues/17866)) ([e012f29](https://github.com/vitejs/vite/commit/e012f296df583bd133d26399397bd4ae49de1497))
* update license copyright ([#18278](https://github.com/vitejs/vite/issues/18278)) ([56eb869](https://github.com/vitejs/vite/commit/56eb869a67551a257d20cba00016ea59b1e1a2c4))

## <small>[5.4.2](https://github.com/vitejs/vite/compare/plugin-legacy@5.4.1...plugin-legacy@5.4.2) (2024-08-15)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#17430](https://github.com/vitejs/vite/issues/17430)) ([4453d35](https://github.com/vitejs/vite/commit/4453d3578b343d16a8a5298bf154f280088968d9))
* **deps:** update all non-major dependencies ([#17494](https://github.com/vitejs/vite/issues/17494)) ([bf123f2](https://github.com/vitejs/vite/commit/bf123f2c6242424a3648cf9234281fd9ff44e3d5))
* **deps:** update all non-major dependencies ([#17629](https://github.com/vitejs/vite/issues/17629)) ([93281b0](https://github.com/vitejs/vite/commit/93281b0e09ff8b00e21c24b80ed796db89cbc1ef))
* **deps:** update all non-major dependencies ([#17780](https://github.com/vitejs/vite/issues/17780)) ([e408542](https://github.com/vitejs/vite/commit/e408542748edebd93dba07f21e3fd107725cadca))
* handle encoded base paths ([#17577](https://github.com/vitejs/vite/issues/17577)) ([720447e](https://github.com/vitejs/vite/commit/720447ee725046323387f661341d44e2ad390f41))

### Performance Improvements

* improve regex performance ([#17789](https://github.com/vitejs/vite/issues/17789)) ([952bae3](https://github.com/vitejs/vite/commit/952bae3efcbd871fc3df5b1947060de7ebdafa36))

### Documentation

* rename cdnjs link ([#17565](https://github.com/vitejs/vite/issues/17565)) ([61357f6](https://github.com/vitejs/vite/commit/61357f67cdb8eca2c551150a1f0329e272f4da62))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#17820](https://github.com/vitejs/vite/issues/17820)) ([bb2f8bb](https://github.com/vitejs/vite/commit/bb2f8bb55fdd64e4f16831ff98921c221a5e734a))
* extend commit hash ([#17709](https://github.com/vitejs/vite/issues/17709)) ([4fc9b64](https://github.com/vitejs/vite/commit/4fc9b6424c27aca8004c368b69991a56264e4fdb))

## <small>[5.4.1](https://github.com/vitejs/vite/compare/plugin-legacy@5.4.0...plugin-legacy@5.4.1) (2024-05-30)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#17321](https://github.com/vitejs/vite/issues/17321)) ([4a89766](https://github.com/vitejs/vite/commit/4a89766d838527c144f14e842211100b16792018))
* **plugin-legacy:** group discovered polyfills by output ([#17347](https://github.com/vitejs/vite/issues/17347)) ([c735cc7](https://github.com/vitejs/vite/commit/c735cc7895b34dd760f57145a00ddc1da7526b8c))
* **plugin-legacy:** improve deterministic polyfills discovery ([#16566](https://github.com/vitejs/vite/issues/16566)) ([48edfcd](https://github.com/vitejs/vite/commit/48edfcd91386a28817cbe5a361beb87c7d17f490))

### Documentation

* **plugin-legacy:** update outdated warning about `modernPolyfills` ([#17335](https://github.com/vitejs/vite/issues/17335)) ([e6a70b7](https://github.com/vitejs/vite/commit/e6a70b7c2d8a23cd2c3a20fbd9c33f199fdc3944))

### Miscellaneous Chores

* **deps:** remove unused deps ([#17329](https://github.com/vitejs/vite/issues/17329)) ([5a45745](https://github.com/vitejs/vite/commit/5a457454bfee1892b0d58c4b1c401cfb15986097))
* **deps:** update all non-major dependencies ([#16722](https://github.com/vitejs/vite/issues/16722)) ([b45922a](https://github.com/vitejs/vite/commit/b45922a91d4a73c27f78f26e369b7b1fd8d800e3))

## [5.4.0](https://github.com/vitejs/vite/compare/plugin-legacy@5.3.2...plugin-legacy@5.4.0) (2024-05-08)
### Features

* **plugin-legacy:** support `additionalModernPolyfills` ([#16514](https://github.com/vitejs/vite/issues/16514)) ([2322657](https://github.com/vitejs/vite/commit/232265783670563e34cf96240bf0e383a3653e6c))

### Bug Fixes

* **deps:** update all non-major dependencies ([#16258](https://github.com/vitejs/vite/issues/16258)) ([7caef42](https://github.com/vitejs/vite/commit/7caef4216e16d9ac71e38598a9ecedce2281d42f))
* **deps:** update all non-major dependencies ([#16376](https://github.com/vitejs/vite/issues/16376)) ([58a2938](https://github.com/vitejs/vite/commit/58a2938a9766981fdc2ed89bec8ff1c96cae0716))
* **deps:** update all non-major dependencies ([#16488](https://github.com/vitejs/vite/issues/16488)) ([2d50be2](https://github.com/vitejs/vite/commit/2d50be2a5424e4f4c22774652ed313d2a232f8af))
* **deps:** update all non-major dependencies ([#16549](https://github.com/vitejs/vite/issues/16549)) ([2d6a13b](https://github.com/vitejs/vite/commit/2d6a13b0aa1f3860482dac2ce260cfbb0713033f))
* **legacy:** modern polyfill autodetection was not injecting enough polyfills ([#16367](https://github.com/vitejs/vite/issues/16367)) ([4af9f97](https://github.com/vitejs/vite/commit/4af9f97cade9fdb349e4928871bbf15c190f9e2b))

### Documentation

* **legacy:** update `modernTargets` option default value description ([#16491](https://github.com/vitejs/vite/issues/16491)) ([7171837](https://github.com/vitejs/vite/commit/7171837abbf8634be2c2e9c32d5dc6a8cbf31e0d))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#16131](https://github.com/vitejs/vite/issues/16131)) ([a862ecb](https://github.com/vitejs/vite/commit/a862ecb941a432b6e3bab62331012e4b53ddd4e8))

## <small>[5.3.2](https://github.com/vitejs/vite/compare/plugin-legacy@5.3.1...plugin-legacy@5.3.2) (2024-03-08)</small>
### Bug Fixes

* **plugin-legacy:** dynamic import browserslist-to-esbuild ([#16011](https://github.com/vitejs/vite/issues/16011)) ([42fd11c](https://github.com/vitejs/vite/commit/42fd11c1c6d37402bd15ba816fbf65dbed3abe55))
* **plugin-legacy:** replace `esbuild-plugin-browserslist` with `browserslist-to-esbuild` ([#15988](https://github.com/vitejs/vite/issues/15988)) ([37af8a7](https://github.com/vitejs/vite/commit/37af8a7be417f1fb2cf9a0d5e9ad90b76ff211b4))
* **plugin-legacy:** respect modernTargets option if renderLegacyChunks disabled ([#15789](https://github.com/vitejs/vite/issues/15789)) ([0813531](https://github.com/vitejs/vite/commit/081353179a4029d8aedaf3dfd78b95d95b757668))

## <small>[5.3.1](https://github.com/vitejs/vite/compare/plugin-legacy@5.3.0...plugin-legacy@5.3.1) (2024-02-21)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#15675](https://github.com/vitejs/vite/issues/15675)) ([4d9363a](https://github.com/vitejs/vite/commit/4d9363ad6bc460fe2da811cb48b036e53b8cfc75))
* **deps:** update all non-major dependencies ([#15803](https://github.com/vitejs/vite/issues/15803)) ([e0a6ef2](https://github.com/vitejs/vite/commit/e0a6ef2b9e6f1df8c5e71efab6182b7cf662d18d))
* **deps:** update all non-major dependencies ([#15959](https://github.com/vitejs/vite/issues/15959)) ([571a3fd](https://github.com/vitejs/vite/commit/571a3fde438d60540cfeba132e24646badf5ff2f))

## [5.3.0](https://github.com/vitejs/vite/compare/plugin-legacy@5.2.0...plugin-legacy@5.3.0) (2024-01-25)
### Features

* **legacy:** build file name optimization ([#15115](https://github.com/vitejs/vite/issues/15115)) ([39f435d](https://github.com/vitejs/vite/commit/39f435d8ce329870754f33509e9fdbb61883c9fc))
* **legacy:** support any separator before hash in fileNames ([#15170](https://github.com/vitejs/vite/issues/15170)) ([ecab41a](https://github.com/vitejs/vite/commit/ecab41a7f8ee09c43e7ace6ef20d2f8693a5978a))
* **plugin-legacy:** add `modernTargets` option ([#15506](https://github.com/vitejs/vite/issues/15506)) ([cf56507](https://github.com/vitejs/vite/commit/cf56507dbfd41c4af63de511a320971668d5204f))

### Bug Fixes

* **deps:** update all non-major dependencies ([#15233](https://github.com/vitejs/vite/issues/15233)) ([ad3adda](https://github.com/vitejs/vite/commit/ad3adda7215c33874a07cbd4d430fcffe4c85dce))
* **deps:** update all non-major dependencies ([#15304](https://github.com/vitejs/vite/issues/15304)) ([bb07f60](https://github.com/vitejs/vite/commit/bb07f605cca698a81f1b4606ddefb34485069dd1))
* **deps:** update all non-major dependencies ([#15375](https://github.com/vitejs/vite/issues/15375)) ([ab56227](https://github.com/vitejs/vite/commit/ab56227d89c92bfa781264e1474ed522892e3b8f))

### Documentation

* fix commit id collision ([#15105](https://github.com/vitejs/vite/issues/15105)) ([0654d1b](https://github.com/vitejs/vite/commit/0654d1b52448db4d7a9b69aee6aad9e015481452))
* fix dead link ([#15700](https://github.com/vitejs/vite/issues/15700)) ([aa7916a](https://github.com/vitejs/vite/commit/aa7916a5c2d580cdd9968fc221826ddd17443bac))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#15145](https://github.com/vitejs/vite/issues/15145)) ([7ff2c0a](https://github.com/vitejs/vite/commit/7ff2c0afe8c6b6901385af829f2e7e80c1fe344c))

## [5.2.0](https://github.com/vitejs/vite/compare/plugin-legacy@5.1.0...plugin-legacy@5.2.0) (2023-11-22)
### Bug Fixes

* **plugin-legacy:** syntax error in variable `detectModernBrowserCode` ([#15095](https://github.com/vitejs/vite/issues/15095)) ([1c605ff](https://github.com/vitejs/vite/commit/1c605ffe9b56dcf731f341a687b1d5b55bba48c6))

### Tests

* **legacy:** add a test to checks all inline snippets are valid JS ([#15098](https://github.com/vitejs/vite/issues/15098)) ([1b9ca66](https://github.com/vitejs/vite/commit/1b9ca66b6d777bd4a03165512de5d65d83a2f25b))

## [5.1.0](https://github.com/vitejs/vite/compare/plugin-legacy@5.0.0...plugin-legacy@5.1.0) (2023-11-21)
### Bug Fixes

* **legacy:** preserve async generator function invocation ([#15021](https://github.com/vitejs/vite/issues/15021)) ([47551a6](https://github.com/vitejs/vite/commit/47551a6f32eace64a4f5b669f997892c5ab867af))

### Documentation

* **legacy:** clarify that csp hashes could change between minors ([#15057](https://github.com/vitejs/vite/issues/15057)) ([cd35330](https://github.com/vitejs/vite/commit/cd353306eefa9787c07b257c8c7f3f68e0949240))

## [5.0.0](https://github.com/vitejs/vite/compare/plugin-legacy@5.0.0-beta.3...plugin-legacy@5.0.0) (2023-11-16)
### ⚠ BREAKING CHANGES

* **plugin-legacy:** bump vite peer dep (#15004)

### Features

* **plugin-legacy:** bump vite peer dep ([#15004](https://github.com/vitejs/vite/issues/15004)) ([3c92c7b](https://github.com/vitejs/vite/commit/3c92c7bca23616f156b70311b149cbc1af59d40b))

## [5.0.0-beta.3](https://github.com/vitejs/vite/compare/plugin-legacy@5.0.0-beta.2...plugin-legacy@5.0.0-beta.3) (2023-11-14)
### Features

* **legacy:** export `Options` ([#14933](https://github.com/vitejs/vite/issues/14933)) ([071bfc8](https://github.com/vitejs/vite/commit/071bfc8e18ebe3981bded8e7bab605bd473d72b9))

### Bug Fixes

* **deps:** update all non-major dependencies ([#14635](https://github.com/vitejs/vite/issues/14635)) ([21017a9](https://github.com/vitejs/vite/commit/21017a9408643cbc7204215ecc5a3fdaf74dc81e))
* **deps:** update all non-major dependencies ([#14729](https://github.com/vitejs/vite/issues/14729)) ([d5d96e7](https://github.com/vitejs/vite/commit/d5d96e712788bc762d9c135bc84628dbcfc7fb58))
* **deps:** update all non-major dependencies ([#14883](https://github.com/vitejs/vite/issues/14883)) ([e5094e5](https://github.com/vitejs/vite/commit/e5094e5bf2aee3516d04ce35ba2fb27e70ea9858))
* **deps:** update all non-major dependencies ([#14961](https://github.com/vitejs/vite/issues/14961)) ([0bb3995](https://github.com/vitejs/vite/commit/0bb3995a7d2245ef1cc7b2ed8a5242e33af16874))
* **plugin-legacy:** add invoke to modern detector to avoid terser treeshaking ([#14968](https://github.com/vitejs/vite/issues/14968)) ([4033a32](https://github.com/vitejs/vite/commit/4033a320d6809c9a0c2552f0ef2bf686c63aa35a))

### Miscellaneous Chores

* **deps:** update dependency eslint-plugin-regexp to v2 ([#14730](https://github.com/vitejs/vite/issues/14730)) ([0a7c753](https://github.com/vitejs/vite/commit/0a7c75305a312161979eaf13d7b48d784bdb6b76))

## [5.0.0-beta.2](https://github.com/vitejs/vite/compare/plugin-legacy@5.0.0-beta.1...plugin-legacy@5.0.0-beta.2) (2023-10-09)
### ⚠ BREAKING CHANGES

* **legacy:** should rename `x.[hash].js` to `x-legacy.[hash].js` (#11599)

### Bug Fixes

* **deps:** update all non-major dependencies ([#14510](https://github.com/vitejs/vite/issues/14510)) ([eb204fd](https://github.com/vitejs/vite/commit/eb204fd3c5bffb6c6fb40f562f762e426fbaf183))
* **legacy:** fix broken build when renderModernChunks=false & polyfills=false (fix [#14324](https://github.com/vitejs/vite/issues/14324)) ([#14346](https://github.com/vitejs/vite/issues/14346)) ([27e5b11](https://github.com/vitejs/vite/commit/27e5b1114ce653b5716cd175aed9e2775da2f97a))
* **legacy:** should rename `x.[hash].js` to `x-legacy.[hash].js` ([#11599](https://github.com/vitejs/vite/issues/11599)) ([e7d7a6f](https://github.com/vitejs/vite/commit/e7d7a6f4ee095bca4ed4fddf387a9ff06fcea7bb))

## [5.0.0-beta.1](https://github.com/vitejs/vite/compare/plugin-legacy@5.0.0-beta.0...plugin-legacy@5.0.0-beta.1) (2023-09-25)
### ⚠ BREAKING CHANGES

* **legacy:** remove `ignoreBrowserslistConfig` option (#14429)

### Bug Fixes

* **deps:** update all non-major dependencies ([#14460](https://github.com/vitejs/vite/issues/14460)) ([b77bff0](https://github.com/vitejs/vite/commit/b77bff0b93ba9449f63c8373ecf82289a39832a0))
* **legacy:** add guard to modern polyfill chunk ([#13719](https://github.com/vitejs/vite/issues/13719)) ([945dc4d](https://github.com/vitejs/vite/commit/945dc4de52e64a1a8f6e2451fadf6aba7e460234))
* **legacy:** modern polyfill autodetection was injecting more polyfills than needed ([#14428](https://github.com/vitejs/vite/issues/14428)) ([1c2e941](https://github.com/vitejs/vite/commit/1c2e941d03621a4b77d9dfca8841e336b716691c))
* **legacy:** suppress babel warning during polyfill scan ([#14425](https://github.com/vitejs/vite/issues/14425)) ([aae3a83](https://github.com/vitejs/vite/commit/aae3a83b5fb49bbd9f174cfeac66f00483829da4))
* **plugin-legacy:** ensure correct typing for node esm ([#13892](https://github.com/vitejs/vite/issues/13892)) ([d914a9d](https://github.com/vitejs/vite/commit/d914a9d79adfe0aed2ee5d69f6f6d1e80b613b98))

### Code Refactoring

* **legacy:** remove `ignoreBrowserslistConfig` option ([#14429](https://github.com/vitejs/vite/issues/14429)) ([941bb16](https://github.com/vitejs/vite/commit/941bb1610c9c9576e0b5738c9075b3eb2f16a357))

## [5.0.0-beta.0](https://github.com/vitejs/vite/compare/plugin-legacy@4.1.1...plugin-legacy@5.0.0-beta.0) (2023-09-19)
### ⚠ BREAKING CHANGES

* bump minimum node version to 18 (#14030)

### Features

* bump minimum node version to 18 ([#14030](https://github.com/vitejs/vite/issues/14030)) ([2c1a45c](https://github.com/vitejs/vite/commit/2c1a45c86cab6ecf02abb6e50385f773d5ed568e))

### Bug Fixes

* **deps:** update all non-major dependencies ([#14092](https://github.com/vitejs/vite/issues/14092)) ([68638f7](https://github.com/vitejs/vite/commit/68638f7b0b04ddfdf35dc8686c6a022aadbb9453))

### Performance Improvements

* use magic-string hires boundary for sourcemaps ([#13971](https://github.com/vitejs/vite/issues/13971)) ([b9a8d65](https://github.com/vitejs/vite/commit/b9a8d65fd64d101ea596bc98a0aea0f95674a95a))

### Documentation

* **legacy:** correct `modernPolyfills` description ([#14233](https://github.com/vitejs/vite/issues/14233)) ([a57f388](https://github.com/vitejs/vite/commit/a57f388f53bdcbcacd7585724b43953c32e6806e))
* **plugin-legacy:** fix typo ([#13936](https://github.com/vitejs/vite/issues/13936)) ([28ddd43](https://github.com/vitejs/vite/commit/28ddd43906825db9e1ffa030551e8f975d97f3a9))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#13938](https://github.com/vitejs/vite/issues/13938)) ([a1b519e](https://github.com/vitejs/vite/commit/a1b519e2c71593b6b4286c2f0bd8bfe2e0ad046d))
* **eslint:** allow type annotations ([#13920](https://github.com/vitejs/vite/issues/13920)) ([d1264fd](https://github.com/vitejs/vite/commit/d1264fd34313a2da80af8dadbeab1c8e6013bb10))
* upgrade babel and release-scripts ([#14330](https://github.com/vitejs/vite/issues/14330)) ([b361ffa](https://github.com/vitejs/vite/commit/b361ffa6724d9191fc6a581acfeab5bc3ebbd931))

## <small>[4.1.1](https://github.com/vitejs/vite/compare/plugin-legacy@4.1.0...plugin-legacy@4.1.1) (2023-07-20)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#13758](https://github.com/vitejs/vite/issues/13758)) ([8ead116](https://github.com/vitejs/vite/commit/8ead11648514ae4975bf4328d6e15bd4dd42e45e))
* **deps:** update all non-major dependencies ([#13872](https://github.com/vitejs/vite/issues/13872)) ([975a631](https://github.com/vitejs/vite/commit/975a631ec7c2373354aeeac6bc2977f24b54d13d))

## [4.1.0](https://github.com/vitejs/vite/compare/plugin-legacy@4.0.5...plugin-legacy@4.1.0) (2023-07-06)
### Features

* **plugin-legacy:** add option to output only legacy builds ([#10139](https://github.com/vitejs/vite/issues/10139)) ([931b24f](https://github.com/vitejs/vite/commit/931b24f5eac4b9b5422a235782ca13baa9a99563))

### Bug Fixes

* **deps:** update all non-major dependencies ([#13701](https://github.com/vitejs/vite/issues/13701)) ([02c6bc3](https://github.com/vitejs/vite/commit/02c6bc38645ce18f9e1c8a71421fb8aad7081688))

## <small>[4.0.5](https://github.com/vitejs/vite/compare/plugin-legacy@4.0.4...plugin-legacy@4.0.5) (2023-06-21)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#13059](https://github.com/vitejs/vite/issues/13059)) ([123ef4c](https://github.com/vitejs/vite/commit/123ef4c47c611ebd99d8b41c89c547422aea9c1d))
* **deps:** update all non-major dependencies ([#13488](https://github.com/vitejs/vite/issues/13488)) ([bd09248](https://github.com/vitejs/vite/commit/bd09248e50ae50ec57b9a72efe0a27aa397ec2e1))

### Documentation

* **legacy:** add test case to ensure correct csp hashes in readme.md ([#13384](https://github.com/vitejs/vite/issues/13384)) ([bf0cd25](https://github.com/vitejs/vite/commit/bf0cd25adb3b8bb5d53433ba9323d0a95e9f756a))

### Miscellaneous Chores

* add funding field ([#13585](https://github.com/vitejs/vite/issues/13585)) ([2501627](https://github.com/vitejs/vite/commit/250162775031a8798f67e8be71fd226a79c9831b))
* **deps:** update all non-major dependencies ([#13553](https://github.com/vitejs/vite/issues/13553)) ([3ea0534](https://github.com/vitejs/vite/commit/3ea05342d41277baf11a73763f082e6e75c46a8f))

## <small>[4.0.4](https://github.com/vitejs/vite/compare/plugin-legacy@4.0.3...plugin-legacy@4.0.4) (2023-05-24)</small>
### Bug Fixes

* **legacy:** import `@babel/preset-env` ([#12961](https://github.com/vitejs/vite/issues/12961)) ([d53c650](https://github.com/vitejs/vite/commit/d53c650a69aeb43efd99b210ccc3a5606f2fc31b))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#12805](https://github.com/vitejs/vite/issues/12805)) ([5731ac9](https://github.com/vitejs/vite/commit/5731ac9caaef629e892e20394f0cc73c565d9a87))

## <small>[4.0.3](https://github.com/vitejs/vite/compare/plugin-legacy@4.0.2...plugin-legacy@4.0.3) (2023-04-25)</small>
### Features

* **plugin-legacy:** support file protocol ([#8524](https://github.com/vitejs/vite/issues/8524)) ([7a87ff4](https://github.com/vitejs/vite/commit/7a87ff4b0950012ad0d85b05fe36b17e1ee2ee76))

### Bug Fixes

* **deps:** update all non-major dependencies ([#12389](https://github.com/vitejs/vite/issues/12389)) ([3e60b77](https://github.com/vitejs/vite/commit/3e60b778b0ed178a83f674031f5edb123e6c123c))

### Code Refactoring

* **eslint:** migrate to `eslint-plugin-n` ([#12895](https://github.com/vitejs/vite/issues/12895)) ([62ebe28](https://github.com/vitejs/vite/commit/62ebe28d4023c1f67578b1977edd3371f44f475a))

## <small>[4.0.2](https://github.com/vitejs/vite/compare/plugin-legacy@4.0.1...plugin-legacy@4.0.2) (2023-03-16)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#12036](https://github.com/vitejs/vite/issues/12036)) ([48150f2](https://github.com/vitejs/vite/commit/48150f2ea4d7ff8e3b67f15239ae05f5be317436))
* **plugin-legacy:** no `build.target` override on SSR build ([#12171](https://github.com/vitejs/vite/issues/12171)) ([a1019f8](https://github.com/vitejs/vite/commit/a1019f80a5d5b6242d8fb0975994ce1ae6e78e94))

### Documentation

* **plugin-legacy:** outdated csp hash (fix [#12112](https://github.com/vitejs/vite/issues/12112)) ([#12118](https://github.com/vitejs/vite/issues/12118)) ([5f7f5dc](https://github.com/vitejs/vite/commit/5f7f5dcb0c006012631c1d5df61d79307d9097f4))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#12299](https://github.com/vitejs/vite/issues/12299)) ([b41336e](https://github.com/vitejs/vite/commit/b41336e450b093fb3e454806ec4245ebad7ba9c5))
* **deps:** update rollup to 3.17.2 ([#12110](https://github.com/vitejs/vite/issues/12110)) ([e54ffbd](https://github.com/vitejs/vite/commit/e54ffbdcbd5d90d560a1bda7a140de046019fcf5))

## <small>[4.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@4.0.0...plugin-legacy@4.0.1) (2023-02-02)</small>
### Bug Fixes

* **legacy:** fix browserslist import, close https://github.com/vitejs/vite/issues/11898 ([#11899](https://github.com/vitejs/vite/issues/11899)) ([9241d08](https://github.com/vitejs/vite/commit/9241d0895b37c658a2dccfd961958c0c5238a49b))

## [4.0.0](https://github.com/vitejs/vite/compare/plugin-legacy@3.0.1...plugin-legacy@4.0.0) (2023-02-02)
### ⚠ BREAKING CHANGES

* **legacy:** bump modern target to support async generator (#11896)
* **plugin-legacy:** support browserslist and update default target (#11318)

### Features

* **legacy:** bump modern target to support async generator ([#11896](https://github.com/vitejs/vite/issues/11896)) ([55b9711](https://github.com/vitejs/vite/commit/55b971139557f65f249f5385b580fa45946cb1d3))

### Bug Fixes

* **deps:** update all non-major dependencies ([#11846](https://github.com/vitejs/vite/issues/11846)) ([5d55083](https://github.com/vitejs/vite/commit/5d5508311f9856de69babd72dc4de0e7c21c7ae8))
* **plugin-legacy:** legacy sourcemap not generate (fix [#11693](https://github.com/vitejs/vite/issues/11693)) ([#11841](https://github.com/vitejs/vite/issues/11841)) ([2ff5930](https://github.com/vitejs/vite/commit/2ff5930e02d80d6254037281b4c62b8e489d63ba))
* **plugin-legacy:** support browserslist and update default target ([#11318](https://github.com/vitejs/vite/issues/11318)) ([d5b8f86](https://github.com/vitejs/vite/commit/d5b8f8615e880e854a3e1105e3193c24cc964f30))
* typo ([#11283](https://github.com/vitejs/vite/issues/11283)) ([bf234a6](https://github.com/vitejs/vite/commit/bf234a63b46f0dc7a629abe0d69863ac15c381e1))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#11419](https://github.com/vitejs/vite/issues/11419)) ([896475d](https://github.com/vitejs/vite/commit/896475dc6c7e5f1168e21d556201a61659552617))
* **deps:** update all non-major dependencies ([#11787](https://github.com/vitejs/vite/issues/11787)) ([271394f](https://github.com/vitejs/vite/commit/271394fc7157a08b19f22d3751c8ec6e69f0bd5f))
* enable `@typescript-eslint/ban-ts-comment` ([#11326](https://github.com/vitejs/vite/issues/11326)) ([e58a4f0](https://github.com/vitejs/vite/commit/e58a4f00e201e9c0d43ddda51ccac7b612d58650))
* update packages' (vite, vite-legacy) keywords ([#11402](https://github.com/vitejs/vite/issues/11402)) ([a56bc34](https://github.com/vitejs/vite/commit/a56bc3434e9d4bc7f9d580ae630ccc633e7d436a))

### Code Refactoring

* **plugin-legacy:** optimize cspHashes array ([#11734](https://github.com/vitejs/vite/issues/11734)) ([b1a8e58](https://github.com/vitejs/vite/commit/b1a8e5856db91df264a7d1e40bf847dde5eb0981))

## <small>[3.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@3.0.0...plugin-legacy@3.0.1) (2022-12-09)</small>
### Miscellaneous Chores

* udpate vite and plugins to stable ([#11278](https://github.com/vitejs/vite/issues/11278)) ([026f41e](https://github.com/vitejs/vite/commit/026f41e87e6eb89491c88f62952d7a094f810811))

## [3.0.0](https://github.com/vitejs/vite/compare/plugin-legacy@3.0.0-alpha.0...plugin-legacy@3.0.0) (2022-12-09)
### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#11182](https://github.com/vitejs/vite/issues/11182)) ([8b83089](https://github.com/vitejs/vite/commit/8b830899ef0ce4ebe257ed18222543f60b775832))
* enable prettier trailing commas ([#11167](https://github.com/vitejs/vite/issues/11167)) ([134ce68](https://github.com/vitejs/vite/commit/134ce6817984bad0f5fb043481502531fee9b1db))

## [3.0.0-alpha.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.3.1...plugin-legacy@3.0.0-alpha.0) (2022-11-30)
### Features

* align default chunk and asset file names with rollup ([#10927](https://github.com/vitejs/vite/issues/10927)) ([cc2adb3](https://github.com/vitejs/vite/commit/cc2adb39254d6de139bc3dfad976430c03250b27))
* rollup 3 ([#9870](https://github.com/vitejs/vite/issues/9870)) ([beb7166](https://github.com/vitejs/vite/commit/beb716695d5dd11fd9f3d7350c1c807dfa37a216))

### Bug Fixes

* **deps:** update all non-major dependencies ([#10804](https://github.com/vitejs/vite/issues/10804)) ([f686afa](https://github.com/vitejs/vite/commit/f686afa6d3bc0f501b936dcbc2c4552c865fa3f9))
* **deps:** update all non-major dependencies ([#11091](https://github.com/vitejs/vite/issues/11091)) ([073a4bf](https://github.com/vitejs/vite/commit/073a4bfe2642a4dda2183a9dfecac864524893e1))
* support polyfill import paths containing an escaping char (e.g. '\') ([#10859](https://github.com/vitejs/vite/issues/10859)) ([7ac2535](https://github.com/vitejs/vite/commit/7ac2535cfc1eb276237a66f9776f9cda3db1148a))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#10910](https://github.com/vitejs/vite/issues/10910)) ([f6ad607](https://github.com/vitejs/vite/commit/f6ad607d2430a44ea7dc71ecd3c44c1e8bf8446f))
* **deps:** update all non-major dependencies ([#11006](https://github.com/vitejs/vite/issues/11006)) ([96f2e98](https://github.com/vitejs/vite/commit/96f2e98f6a196652962ccb5f2fa6195c050c463f))

## <small>[2.3.1](https://github.com/vitejs/vite/compare/plugin-legacy@2.3.0...plugin-legacy@2.3.1) (2022-11-07)</small>
### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#10725](https://github.com/vitejs/vite/issues/10725)) ([22cfad8](https://github.com/vitejs/vite/commit/22cfad87c824e717b6c616129f3b579be2e979b2))

## [2.3.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.3.0-beta.0...plugin-legacy@2.3.0) (2022-10-26)
### Bug Fixes

* **deps:** update all non-major dependencies ([#10610](https://github.com/vitejs/vite/issues/10610)) ([bb95467](https://github.com/vitejs/vite/commit/bb954672e3ee863e5cb37fa78167e5fc6df9ae4e))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#10393](https://github.com/vitejs/vite/issues/10393)) ([f519423](https://github.com/vitejs/vite/commit/f519423170fafeee9d58aeb2052cb3bc224f25f8))
* **deps:** update all non-major dependencies ([#10488](https://github.com/vitejs/vite/issues/10488)) ([15aa827](https://github.com/vitejs/vite/commit/15aa827283d6cbf9f55c02d6d8a3fe43dbd792e4))

## [2.3.0-beta.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.2.0...plugin-legacy@2.3.0-beta.0) (2022-10-05)
### Bug Fixes

* **deps:** update all non-major dependencies ([#10160](https://github.com/vitejs/vite/issues/10160)) ([6233c83](https://github.com/vitejs/vite/commit/6233c830201085d869fbbd2a7e622a59272e0f43))
* **deps:** update all non-major dependencies ([#10246](https://github.com/vitejs/vite/issues/10246)) ([81d4d04](https://github.com/vitejs/vite/commit/81d4d04c37b805843ea83075d1c0819c31726c4e))
* **deps:** update all non-major dependencies ([#10316](https://github.com/vitejs/vite/issues/10316)) ([a38b450](https://github.com/vitejs/vite/commit/a38b450441eea02a680b80ac0624126ba6abe3f7))
* **legacy:** don't force set `build.target` when `renderLegacyChunks=false` (fixes [#10201](https://github.com/vitejs/vite/issues/10201)) ([#10220](https://github.com/vitejs/vite/issues/10220)) ([7f548e8](https://github.com/vitejs/vite/commit/7f548e874a2fb2b09f08fe123bb3ebc10aa2f54b))

### Code Refactoring

* **types:** bundle client types ([#9966](https://github.com/vitejs/vite/issues/9966)) ([da632bf](https://github.com/vitejs/vite/commit/da632bf36f561c0fc4031830721a7d4d86135efb))

## [2.2.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.1.0...plugin-legacy@2.2.0) (2022-09-19)
### Bug Fixes

* **deps:** update all non-major dependencies ([#10077](https://github.com/vitejs/vite/issues/10077)) ([caf00c8](https://github.com/vitejs/vite/commit/caf00c8c7a5c81a92182116ffa344b34ce4c3b5e))
* **deps:** update all non-major dependencies ([#9985](https://github.com/vitejs/vite/issues/9985)) ([855f2f0](https://github.com/vitejs/vite/commit/855f2f077eb8dc41b395bccecb6a5b836eb526a9))
* **plugin-legacy:** force set `build.target` ([#10072](https://github.com/vitejs/vite/issues/10072)) ([a13a7eb](https://github.com/vitejs/vite/commit/a13a7eb4165d38ce0ab6eefd4e4d38104ce63699))

### Documentation

* **plugin-legacy:** fix Vite default target ([#10158](https://github.com/vitejs/vite/issues/10158)) ([62ff788](https://github.com/vitejs/vite/commit/62ff7887870392f0cce2a40b3cc5d1b7c48a9a47))

## [2.1.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.1.0-beta.0...plugin-legacy@2.1.0) (2022-09-05)
## [2.1.0-beta.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.1...plugin-legacy@2.1.0-beta.0) (2022-08-29)
### Bug Fixes

* **deps:** update all non-major dependencies ([#9888](https://github.com/vitejs/vite/issues/9888)) ([e35a58b](https://github.com/vitejs/vite/commit/e35a58ba46f906feea8ab46886c3306257c61560))
* **plugin-legacy:** prevent global process.env.NODE_ENV mutation ([#9741](https://github.com/vitejs/vite/issues/9741)) ([a8279af](https://github.com/vitejs/vite/commit/a8279af608657861b64af5980942cced0b04c8ac))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#9675](https://github.com/vitejs/vite/issues/9675)) ([4e56e87](https://github.com/vitejs/vite/commit/4e56e87623501109198e019ebe809872528ab088))
* **deps:** update all non-major dependencies ([#9778](https://github.com/vitejs/vite/issues/9778)) ([aceaefc](https://github.com/vitejs/vite/commit/aceaefc19eaa05c76b8a7adec035a0e4b33694c6))

### Code Refactoring

* **legacy:** build polyfill chunk ([#9639](https://github.com/vitejs/vite/issues/9639)) ([7ba0c9f](https://github.com/vitejs/vite/commit/7ba0c9f60e147a0039d2607a10c55e4feecd4bee))
* **legacy:** remove code for Vite 2 ([#9640](https://github.com/vitejs/vite/issues/9640)) ([b1bbc5b](https://github.com/vitejs/vite/commit/b1bbc5bcc01bfc9b5923e9e58d744c594799a873))

## <small>[2.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.0...plugin-legacy@2.0.1) (2022-08-11)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#9176](https://github.com/vitejs/vite/issues/9176)) ([31d3b70](https://github.com/vitejs/vite/commit/31d3b70672ea8759a8d7ff1993d64bb4f0e30fab))
* **deps:** update all non-major dependencies ([#9575](https://github.com/vitejs/vite/issues/9575)) ([8071325](https://github.com/vitejs/vite/commit/80713256d0dd5716e42086fb617e96e9e92c3675))
* **legacy:** skip esbuild transform for systemjs ([#9635](https://github.com/vitejs/vite/issues/9635)) ([ac16abd](https://github.com/vitejs/vite/commit/ac16abda0a3f96daa61507bda666ade5867ec909))
* mention that Node.js 13/15 support is dropped (fixes [#9113](https://github.com/vitejs/vite/issues/9113)) ([#9116](https://github.com/vitejs/vite/issues/9116)) ([2826303](https://github.com/vitejs/vite/commit/2826303bd253e20df2746f84f6a7c06cb5cf3d6b))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#9347](https://github.com/vitejs/vite/issues/9347)) ([2fcb027](https://github.com/vitejs/vite/commit/2fcb0272442664c395322acfc7899ab6a32bd86c))
* **deps:** update all non-major dependencies ([#9478](https://github.com/vitejs/vite/issues/9478)) ([c530d16](https://github.com/vitejs/vite/commit/c530d168309557c7a254128364f07f7b4f017e14))
* fix code typos ([#9033](https://github.com/vitejs/vite/issues/9033)) ([ed02861](https://github.com/vitejs/vite/commit/ed0286186b24748ec7bfa336f83c382363a22f1d))

## [2.0.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.0-beta.1...plugin-legacy@2.0.0) (2022-07-13)
### Documentation

* cleanup changes ([#8989](https://github.com/vitejs/vite/issues/8989)) ([07aef1b](https://github.com/vitejs/vite/commit/07aef1b4c02a64732b31b00591d2d9d9c8025aab))

### Miscellaneous Chores

* 3.0 release notes and bump peer deps ([#9072](https://github.com/vitejs/vite/issues/9072)) ([427ba26](https://github.com/vitejs/vite/commit/427ba26fa720a11530d135b2ee39876fc9a778fb))
* **deps:** update all non-major dependencies ([#9022](https://github.com/vitejs/vite/issues/9022)) ([6342140](https://github.com/vitejs/vite/commit/6342140e6ac7e033ca83d3494f94ea20ca2eaf07))

## [2.0.0-beta.1](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.0-beta.0...plugin-legacy@2.0.0-beta.1) (2022-07-06)
### Features

* experimental.renderBuiltUrl (revised build base options) ([#8762](https://github.com/vitejs/vite/issues/8762)) ([895a7d6](https://github.com/vitejs/vite/commit/895a7d66bc93beaf18ebcbee23b00fda9ca4c33c))

### Bug Fixes

* **deps:** update all non-major dependencies ([#8802](https://github.com/vitejs/vite/issues/8802)) ([a4a634d](https://github.com/vitejs/vite/commit/a4a634d6a08f8b54f052cfc2cc1b60c1bca6d48a))

### Miscellaneous Chores

* use `tsx` directly instead of indirect `esno` ([#8773](https://github.com/vitejs/vite/issues/8773)) ([f018f13](https://github.com/vitejs/vite/commit/f018f135ffa5a2885c063d4509d39958c788120c))

## [2.0.0-beta.0](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.0-alpha.2...plugin-legacy@2.0.0-beta.0) (2022-06-21)
### Features

* bump minimum node version to 14.18.0 ([#8662](https://github.com/vitejs/vite/issues/8662)) ([8a05432](https://github.com/vitejs/vite/commit/8a05432e6dcc0e11d78c7b029e7340fa47fceb92))
* experimental.buildAdvancedBaseOptions ([#8450](https://github.com/vitejs/vite/issues/8450)) ([8ef7333](https://github.com/vitejs/vite/commit/8ef733368fd6618a252e44616f7577f593fd4fbc))

### Bug Fixes

* **plugin-legacy:** prevent esbuild injecting arrow function ([#8660](https://github.com/vitejs/vite/issues/8660)) ([c0e74e5](https://github.com/vitejs/vite/commit/c0e74e5f687b8f2bb308acb51cd94c31aea2808b))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#8669](https://github.com/vitejs/vite/issues/8669)) ([628863d](https://github.com/vitejs/vite/commit/628863dc6120804cc1af8bda2ea98e802ded0e84))
* use node prefix ([#8309](https://github.com/vitejs/vite/issues/8309)) ([60721ac](https://github.com/vitejs/vite/commit/60721ac53a1bf326d1cac097f23642faede234ff))

## [2.0.0-alpha.2](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.0-alpha.1...plugin-legacy@2.0.0-alpha.2) (2022-06-19)
### ⚠ BREAKING CHANGES

* make terser an optional dependency (#8049)

### Bug Fixes

* **build:** use crossorigin for nomodule ([#8322](https://github.com/vitejs/vite/issues/8322)) ([7f59989](https://github.com/vitejs/vite/commit/7f59989ec1fee7f8b71d297169589e010d3b84e3))
* **deps:** update all non-major dependencies ([#8281](https://github.com/vitejs/vite/issues/8281)) ([c68db4d](https://github.com/vitejs/vite/commit/c68db4d7ad2c1baee41f280b34ae89a85ba0373d))
* **deps:** update all non-major dependencies ([#8391](https://github.com/vitejs/vite/issues/8391)) ([842f995](https://github.com/vitejs/vite/commit/842f995ca69600c4c06c46d202fe713b80373418))
* **plugin-legacy:** disable babel.compact when minify is disabled ([#8244](https://github.com/vitejs/vite/issues/8244)) ([742188c](https://github.com/vitejs/vite/commit/742188cc04526439060bdac7125237c20463d5a5))
* **plugin-legacy:** don't include SystemJS in modern polyfills ([#6902](https://github.com/vitejs/vite/issues/6902)) ([eb47b1e](https://github.com/vitejs/vite/commit/eb47b1e2580cd6f8285dadba8f943e1b667ec390))
* **plugin-legacy:** empty base makes import fail (fixes [#4212](https://github.com/vitejs/vite/issues/4212)) ([#8387](https://github.com/vitejs/vite/issues/8387)) ([1a16f12](https://github.com/vitejs/vite/commit/1a16f123e0781449c511af2d0112b8c4639972f1))
* **plugin-legacy:** modern polyfill latest features (fixes [#8399](https://github.com/vitejs/vite/issues/8399)) ([#8408](https://github.com/vitejs/vite/issues/8408)) ([ed25817](https://github.com/vitejs/vite/commit/ed2581778baff3201f47866799f006a490a7e35b))
* **plugin-legacy:** prevent failed to load module ([#8285](https://github.com/vitejs/vite/issues/8285)) ([d671811](https://github.com/vitejs/vite/commit/d67181195aec99ee6aa71bd8fdb69f1f09f57c9d))
* **plugin-legacy:** respect `entryFileNames` for polyfill chunks ([#8247](https://github.com/vitejs/vite/issues/8247)) ([baa9632](https://github.com/vitejs/vite/commit/baa9632a2c2befafdfde0f131f84f247fa8b6478))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#8474](https://github.com/vitejs/vite/issues/8474)) ([6d0ede7](https://github.com/vitejs/vite/commit/6d0ede7c60aaa4c010207a047bf30a2b87b5049f))
* enable `@typescript-eslint/explicit-module-boundary-types` ([#8372](https://github.com/vitejs/vite/issues/8372)) ([104caf9](https://github.com/vitejs/vite/commit/104caf95ecd8cdf2d21ca7171931622b52fd74ff))
* update major deps ([#8572](https://github.com/vitejs/vite/issues/8572)) ([0e20949](https://github.com/vitejs/vite/commit/0e20949dbf0ba38bdaefbf32a36764fe29858e20))
* use `esno` to replace `ts-node` ([#8162](https://github.com/vitejs/vite/issues/8162)) ([c18a5f3](https://github.com/vitejs/vite/commit/c18a5f36410e418aaf8309102f1cacf7aef31b43))

### Code Refactoring

* make terser an optional dependency ([#8049](https://github.com/vitejs/vite/issues/8049)) ([164f528](https://github.com/vitejs/vite/commit/164f528838f3a146c82d68992d38316b9214f9b8))
* **plugin-legacy:** improve default polyfill ([#8312](https://github.com/vitejs/vite/issues/8312)) ([4370d91](https://github.com/vitejs/vite/commit/4370d9123da20c586938753d9f606d84907334c9))

## [2.0.0-alpha.1](https://github.com/vitejs/vite/compare/plugin-legacy@2.0.0-alpha.0...plugin-legacy@2.0.0-alpha.1) (2022-05-19)
### ⚠ BREAKING CHANGES

* bump targets (#8045)
* relative base (#7644)

### Features

* relative base ([#7644](https://github.com/vitejs/vite/issues/7644)) ([09648c2](https://github.com/vitejs/vite/commit/09648c220a67852c38da0ba742501a15837e16c2))

### Bug Fixes

* **plugin-legacy:** fail to get the fileName ([#5250](https://github.com/vitejs/vite/issues/5250)) ([c7fc1d4](https://github.com/vitejs/vite/commit/c7fc1d4a532eae7b519bd70c6eba701e23b0635a))
* rewrite CJS specific funcs/vars in plugins ([#8227](https://github.com/vitejs/vite/issues/8227)) ([9baa70b](https://github.com/vitejs/vite/commit/9baa70b788ec0b0fc419db30d627567242c6af7d))

### Documentation

* use latest core-js unpkg link ([#8190](https://github.com/vitejs/vite/issues/8190)) ([102b678](https://github.com/vitejs/vite/commit/102b678335ba74ac8f0ab94c8c49cba97e836e6d))

### Build System

* bump targets ([#8045](https://github.com/vitejs/vite/issues/8045)) ([66efd69](https://github.com/vitejs/vite/commit/66efd69a399fd73284cc7a3bffc904e154291a14))

## [2.0.0-alpha.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.8.2...plugin-legacy@2.0.0-alpha.0) (2022-05-13)
### ⚠ BREAKING CHANGES

* remove node v12 support (#7833)

### Documentation

* **plugin-legacy:** remove regenerator-runtime note ([#8007](https://github.com/vitejs/vite/issues/8007)) ([834efe9](https://github.com/vitejs/vite/commit/834efe94fe2c26fcdeabcc34a667dcc6a52326ee))

### Miscellaneous Chores

* bump minors and rebuild lock ([#8074](https://github.com/vitejs/vite/issues/8074)) ([aeb5b74](https://github.com/vitejs/vite/commit/aeb5b7436df5a4d7cf0ee1a9f6f110d00ef7aac1))
* **deps:** use `esno` to replace `ts-node` ([#8152](https://github.com/vitejs/vite/issues/8152)) ([2363bd3](https://github.com/vitejs/vite/commit/2363bd3e5443aad43351ac16400b5a6ab7e0ef83))
* revert vitejs/vite[#8152](https://github.com/vitejs/vite/issues/8152) ([#8161](https://github.com/vitejs/vite/issues/8161)) ([85b8b55](https://github.com/vitejs/vite/commit/85b8b55c0d39f53581047f622717d4a009c594f6))
* update plugins peer deps ([d57c23c](https://github.com/vitejs/vite/commit/d57c23ca9b59491160017cea996fdbff4216263c))
* use `unbuild` to bundle plugins ([#8139](https://github.com/vitejs/vite/issues/8139)) ([638b168](https://github.com/vitejs/vite/commit/638b1686288ad685243d34cd9f1db3814f4db1c0))

### Build System

* remove node v12 support ([#7833](https://github.com/vitejs/vite/issues/7833)) ([eeac2d2](https://github.com/vitejs/vite/commit/eeac2d2e217ddbca79d5b1dfde9bb5097e821b6a))

## <small>[1.8.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.8.1...plugin-legacy@1.8.2) (2022-05-02)</small>
### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#7780](https://github.com/vitejs/vite/issues/7780)) ([eba9d05](https://github.com/vitejs/vite/commit/eba9d05d7adbb5d4dd25f14b085b15eb3488dfe4))
* **deps:** update all non-major dependencies ([#7847](https://github.com/vitejs/vite/issues/7847)) ([e29d1d9](https://github.com/vitejs/vite/commit/e29d1d92f7810c5160aac2f1e56f7b03bfa4c933))
* **deps:** update all non-major dependencies ([#7949](https://github.com/vitejs/vite/issues/7949)) ([b877d30](https://github.com/vitejs/vite/commit/b877d30a05691bb6ea2da4e67b931a5a3d32809f))

### Code Refactoring

* **legacy:** remove unneeded dynamic import var init code ([#7759](https://github.com/vitejs/vite/issues/7759)) ([12a4e7d](https://github.com/vitejs/vite/commit/12a4e7d8bbf06d35d6fcc0135dcb76fd06a57c22))

## <small>[1.8.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.8.0...plugin-legacy@1.8.1) (2022-04-13)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#7668](https://github.com/vitejs/vite/issues/7668)) ([485263c](https://github.com/vitejs/vite/commit/485263cdca78e5b30fce77f1af9862b3ea3d76f1))

### Documentation

* **legacy:** note works in build only ([#7596](https://github.com/vitejs/vite/issues/7596)) ([f26b14a](https://github.com/vitejs/vite/commit/f26b14a0d8f4c909cb8cf3188684333b488c0714))

## [1.8.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.7.0...plugin-legacy@1.8.0) (2022-03-30)
### Bug Fixes

* **deps:** update all non-major dependencies ([#6782](https://github.com/vitejs/vite/issues/6782)) ([e38be3e](https://github.com/vitejs/vite/commit/e38be3e6ca7bf79319d5d7188e1d347b1d6091ef))
* **deps:** update all non-major dependencies ([#7392](https://github.com/vitejs/vite/issues/7392)) ([b63fc3b](https://github.com/vitejs/vite/commit/b63fc3bbdaf59358b89a0844c264deea1b25c034))
* **plugin-legacy:** always fallback legacy build when CSP ([#6535](https://github.com/vitejs/vite/issues/6535)) ([a118a1d](https://github.com/vitejs/vite/commit/a118a1d98c63028ddc8b2b3389b8cfa58d771e76))
* **plugin-legacy:** polyfill latest features ([#7514](https://github.com/vitejs/vite/issues/7514)) ([cb388e2](https://github.com/vitejs/vite/commit/cb388e2dfd39fab751d0656a811c39f8440c48e2))
* **plugin-legacy:** require Vite 2.8.0 ([#6272](https://github.com/vitejs/vite/issues/6272)) ([#6869](https://github.com/vitejs/vite/issues/6869)) ([997b8f1](https://github.com/vitejs/vite/commit/997b8f11cb156cc374ae991875a09534b5489a93))

### Documentation

* **vite-legacy:** Note about using `regenerator-runtime` in Content Security Policy environment ([#7234](https://github.com/vitejs/vite/issues/7234)) ([0fd6422](https://github.com/vitejs/vite/commit/0fd64223304442bb483c55d818fcf808b7ffbaa8))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#6905](https://github.com/vitejs/vite/issues/6905)) ([839665c](https://github.com/vitejs/vite/commit/839665c5985101c1765f0d68cf429ac96157d062))

## [1.7.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.4...plugin-legacy@1.7.0) (2022-02-09)
### Bug Fixes

* don't force terser on non-legacy (fix [#6266](https://github.com/vitejs/vite/issues/6266)) ([#6272](https://github.com/vitejs/vite/issues/6272)) ([1da104e](https://github.com/vitejs/vite/commit/1da104e8597e2965313e8cd582d032bca551e4ee))
* **legacy:** fix conflict with the modern build on css emitting ([#6584](https://github.com/vitejs/vite/issues/6584)) ([f48255e](https://github.com/vitejs/vite/commit/f48255e6e0058e973b949fb4a2372974f0480e11)), closes [#3296](https://github.com/vitejs/vite/issues/3296) [#3317](https://github.com/vitejs/vite/issues/3317)

### Miscellaneous Chores

* convert scripts to TS ([#6160](https://github.com/vitejs/vite/issues/6160)) ([15b6f1b](https://github.com/vitejs/vite/commit/15b6f1ba82731c16b19e00ca3b28b1a898caa4d4))
* **deps:** update all non-major dependencies ([#5879](https://github.com/vitejs/vite/issues/5879)) ([aab303f](https://github.com/vitejs/vite/commit/aab303f7bd333307c77363259f97a310762c4848))
* **deps:** update all non-major dependencies ([#6185](https://github.com/vitejs/vite/issues/6185)) ([b45f4ad](https://github.com/vitejs/vite/commit/b45f4ad9f1336d1e88d271d7aca9498dde2e5013))
* **deps:** update all non-major dependencies ([#6357](https://github.com/vitejs/vite/issues/6357)) ([a272c07](https://github.com/vitejs/vite/commit/a272c07e5c442f54e4439a4f3a9da0ebb10f73c9))
* prefer type imports ([#5835](https://github.com/vitejs/vite/issues/5835)) ([7186857](https://github.com/vitejs/vite/commit/71868579058512b51991718655e089a78b99d39c))
* properly parse process.env.DEBUG in plugin-legacy ([#6545](https://github.com/vitejs/vite/issues/6545)) ([155fd11](https://github.com/vitejs/vite/commit/155fd11b783eddd33f0cd7e411eea40a3585217a))

## <small>[1.6.4](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.3...plugin-legacy@1.6.4) (2021-12-07)</small>
### Miscellaneous Chores

* use cjs extension with scripts ([#5877](https://github.com/vitejs/vite/issues/5877)) ([775baba](https://github.com/vitejs/vite/commit/775babac40da546b01b8b8cbd7dff32b5cfcee6d))

## <small>[1.6.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.2...plugin-legacy@1.6.3) (2021-11-22)</small>
### Bug Fixes

* **build:** resolve `rollupOptions.input` paths ([#5601](https://github.com/vitejs/vite/issues/5601)) ([5b6b016](https://github.com/vitejs/vite/commit/5b6b01693720290e8998b2613f0dcb2d699ee84f))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#5679](https://github.com/vitejs/vite/issues/5679)) ([09f4d57](https://github.com/vitejs/vite/commit/09f4d57e12de46ffc5fa151c218f31845ad4b471))
* **deps:** update all non-major dependencies ([#5783](https://github.com/vitejs/vite/issues/5783)) ([eee9406](https://github.com/vitejs/vite/commit/eee940678b76966647b543e1f10fdb113da64b21))
* **deps:** update non critical deps ([#5569](https://github.com/vitejs/vite/issues/5569)) ([09e2a5f](https://github.com/vitejs/vite/commit/09e2a5f16f36d84e95448a9ae819cec5faeb41f3))
* **deps:** update plugins ([#5462](https://github.com/vitejs/vite/issues/5462)) ([50b5e2e](https://github.com/vitejs/vite/commit/50b5e2ea2605ba392fa622c9419b8cb5da69e0d2))

## <small>[1.6.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.1...plugin-legacy@1.6.2) (2021-10-11)</small>
### Features

* add `build.cssTarget` option ([#5132](https://github.com/vitejs/vite/issues/5132)) ([b17444f](https://github.com/vitejs/vite/commit/b17444fd97b02bc54410c8575e7d3cb25e4058c2)), closes [#4746](https://github.com/vitejs/vite/issues/4746) [#5070](https://github.com/vitejs/vite/issues/5070) [#4930](https://github.com/vitejs/vite/issues/4930)

## <small>[1.6.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.6.0...plugin-legacy@1.6.1) (2021-10-05)</small>
### Bug Fixes

* **plugin-legacy:** use terser as the default minifier ([#5168](https://github.com/vitejs/vite/issues/5168)) ([9ee7234](https://github.com/vitejs/vite/commit/9ee72343884a7d679767833f7a659bbca6b96595))

## [1.6.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.3...plugin-legacy@1.6.0) (2021-09-29)
### Features

* **plugin-legacy:** add externalSystemJS option ([#5024](https://github.com/vitejs/vite/issues/5024)) ([60b6f55](https://github.com/vitejs/vite/commit/60b6f5595a00cbf014a30d57721081eb79436a97))

### Bug Fixes

* **deps:** update all non-major dependencies ([#4545](https://github.com/vitejs/vite/issues/4545)) ([a44fd5d](https://github.com/vitejs/vite/commit/a44fd5d38679da0be2536103e83af730cda73a95))
* esbuild minification and renderLegacyChunks false ([#5054](https://github.com/vitejs/vite/issues/5054)) ([ed384cf](https://github.com/vitejs/vite/commit/ed384cfeff9e3ccb0fdbb07ec91758308da66226))
* normalize internal plugin names ([#4976](https://github.com/vitejs/vite/issues/4976)) ([37f0b2f](https://github.com/vitejs/vite/commit/37f0b2fff74109d381513ed052a32b43655ee11d))
* **plugin-legacy:** fix type errors ([#4762](https://github.com/vitejs/vite/issues/4762)) ([5491143](https://github.com/vitejs/vite/commit/5491143be0b4214d2dab91076a85739d6d106481))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#4992](https://github.com/vitejs/vite/issues/4992)) ([5274c2e](https://github.com/vitejs/vite/commit/5274c2e9fbfd7d80392b5d0c9daacbe2d7237649))
* **deps:** update all non-major dependencies ([#5100](https://github.com/vitejs/vite/issues/5100)) ([b2ae627](https://github.com/vitejs/vite/commit/b2ae627c74ee8aeff82c80d3461ae3004d0d8369))
* prettier format ([#5121](https://github.com/vitejs/vite/issues/5121)) ([16fc894](https://github.com/vitejs/vite/commit/16fc8942e2b2181d78359cdc37e85a17be031af4))

## <small>[1.5.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.2...plugin-legacy@1.5.3) (2021-09-07)</small>
### Bug Fixes

* **plugin-legacy:** fix regression introduced in [#4536](https://github.com/vitejs/vite/issues/4536) ([#4861](https://github.com/vitejs/vite/issues/4861)) ([fdc3212](https://github.com/vitejs/vite/commit/fdc3212474ff951e7e67810eca6cfb3ef1ed9ea2))
* **plugin-legacy:** skip in SSR build ([#4536](https://github.com/vitejs/vite/issues/4536)) ([1f068fc](https://github.com/vitejs/vite/commit/1f068fcec38fc07c34e75a19821064386e460907))

## <small>[1.5.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.1...plugin-legacy@1.5.2) (2021-09-01)</small>
### Bug Fixes

* **plugin-legacy:** avoid executing blank dynamic import ([#4767](https://github.com/vitejs/vite/issues/4767)) ([de71408](https://github.com/vitejs/vite/commit/de7140853140029a3f48600b60e700464e7662b5)), closes [#4568](https://github.com/vitejs/vite/issues/4568)

### Documentation

* include algorithm in Content Security Policy hash ([#4690](https://github.com/vitejs/vite/issues/4690)) ([6815edd](https://github.com/vitejs/vite/commit/6815eddbb94f60bf0c08f91ee9404d93357eb602))

## <small>[1.5.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.5.0...plugin-legacy@1.5.1) (2021-08-03)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#4468](https://github.com/vitejs/vite/issues/4468)) ([cd54a22](https://github.com/vitejs/vite/commit/cd54a22b8d5048f5d25a9954697f49b6d65dcc1f))
* **plugin-legacy:** bake-in Promise polyfill, fix [#4414](https://github.com/vitejs/vite/issues/4414) ([#4440](https://github.com/vitejs/vite/issues/4440)) ([024a2de](https://github.com/vitejs/vite/commit/024a2de63df60a4037f9f7b13a0bc6e2b0d41fb6))

## [1.5.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.4...plugin-legacy@1.5.0) (2021-07-27)
### Bug Fixes

* **deps:** update all non-major dependencies ([#4387](https://github.com/vitejs/vite/issues/4387)) ([2f900ba](https://github.com/vitejs/vite/commit/2f900ba4d4ad8061e0046898e8d1de3129e7f784))
* **plugin-legacy:** legacy fallback for dynamic import ([#3885](https://github.com/vitejs/vite/issues/3885)) ([fc6d8f1](https://github.com/vitejs/vite/commit/fc6d8f1d3efe836f17f3c45375dd3749128b8137))

## <small>[1.4.4](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.3...plugin-legacy@1.4.4) (2021-07-12)</small>
### Features

* allow entryFileNames, chunkFileNames functions for legacy ([#4122](https://github.com/vitejs/vite/issues/4122)) ([df29bff](https://github.com/vitejs/vite/commit/df29bfff44ad7f2e822f92935d0ca9c99f15b67e))

### Miscellaneous Chores

* **deps:** update all non-major dependencies ([#4117](https://github.com/vitejs/vite/issues/4117)) ([e30ce56](https://github.com/vitejs/vite/commit/e30ce56861a154389a47e679c46a93680aae1325))
* improve prettier config ([#4154](https://github.com/vitejs/vite/issues/4154)) ([98d95e3](https://github.com/vitejs/vite/commit/98d95e3e11bbc43e410b213b682e315b9344d2d7))

## <small>[1.4.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.2...plugin-legacy@1.4.3) (2021-06-27)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#3878](https://github.com/vitejs/vite/issues/3878)) ([a66a805](https://github.com/vitejs/vite/commit/a66a8053e9520d20bcf95fce870570c5195bcc91))
* don't force polyfillDynamicImport if renderLegacyChunks is false ([#3695](https://github.com/vitejs/vite/issues/3695)) ([#3774](https://github.com/vitejs/vite/issues/3774)) ([d2a51ca](https://github.com/vitejs/vite/commit/d2a51ca4eda2ca9f99d9a066836d76d2253cfc24))
* **plugin-legacy:** chunk may not exist ([#3886](https://github.com/vitejs/vite/issues/3886)) ([dd5931d](https://github.com/vitejs/vite/commit/dd5931d9c1cf382849047332b2c3409755ceebf5))

## <small>[1.4.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.1...plugin-legacy@1.4.2) (2021-06-22)</small>
### Bug Fixes

* **deps:** update all non-major dependencies ([#3791](https://github.com/vitejs/vite/issues/3791)) ([74d409e](https://github.com/vitejs/vite/commit/74d409eafca8d74ec4a6ece621ea2895bc1f2a32))
* **plugin-legacy:** wrap chunks in IIFE ([#3783](https://github.com/vitejs/vite/issues/3783)) ([9abdb81](https://github.com/vitejs/vite/commit/9abdb8137ef54dd095e7bc47ae6a1ccf490fd196))

## <small>[1.4.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.4.0...plugin-legacy@1.4.1) (2021-06-01)</small>
### Bug Fixes

* **plugin-legacy:** respect custom filenames formats, fix [#2356](https://github.com/vitejs/vite/issues/2356) ([#2641](https://github.com/vitejs/vite/issues/2641)) ([d852731](https://github.com/vitejs/vite/commit/d852731622a1c009d15a5172343fc166c4bb5cb7))

## [1.4.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.4...plugin-legacy@1.4.0) (2021-05-17)
### Bug Fixes

* **plugin-legacy:** turn off babel loose mode ([#3406](https://github.com/vitejs/vite/issues/3406)) ([5348c02](https://github.com/vitejs/vite/commit/5348c02f58bde36c412dbfe36c3ad37772bf83e5))
* restore dynamic-import-polyfill ([#3434](https://github.com/vitejs/vite/issues/3434)) ([4112c5d](https://github.com/vitejs/vite/commit/4112c5d103673b83c50d446096086617dfaac5a3))

### Documentation

* **plugin-legacy:** add note about IE11, close [#3362](https://github.com/vitejs/vite/issues/3362) ([#3389](https://github.com/vitejs/vite/issues/3389)) ([b0b62f9](https://github.com/vitejs/vite/commit/b0b62f96d7d4b04d3bfea683feff84c8b31f1eca))

## <small>[1.3.4](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.3...plugin-legacy@1.3.4) (2021-05-11)</small>
### Bug Fixes

* **plugin-legacy:** move polyfills in plugin post, fixes [#2786](https://github.com/vitejs/vite/issues/2786) and [#2781](https://github.com/vitejs/vite/issues/2781) ([#3023](https://github.com/vitejs/vite/issues/3023)) ([43150e3](https://github.com/vitejs/vite/commit/43150e352d164744e2fda766927053439bdf7db9))
* **plugin-legacy:** require Vite 2.0.0 final ([#3265](https://github.com/vitejs/vite/issues/3265)) ([e395dee](https://github.com/vitejs/vite/commit/e395deeb0f11ebb1bcebe69233adebaad10f77eb))

## <small>[1.3.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.2...plugin-legacy@1.3.3) (2021-05-03)</small>
### Bug Fixes

* ignore babelrc in legacy plugin ([#2801](https://github.com/vitejs/vite/issues/2801)) ([d466ad0](https://github.com/vitejs/vite/commit/d466ad0a095859a895fd4cb85f425ad4c4583e4e))
* **plugin-legacy:** correct log level to error ([#3241](https://github.com/vitejs/vite/issues/3241)) ([474fe9a](https://github.com/vitejs/vite/commit/474fe9a3abbdf4845447eaab821d2ba51fda6207))

### Miscellaneous Chores

* Add `repository.directory` to `packages/**/package.json` ([#2687](https://github.com/vitejs/vite/issues/2687)) ([0ecff94](https://github.com/vitejs/vite/commit/0ecff9417ee0ccfea9132fb9df39eb4398c11eaf))

### Tests

* fix timeout hiding runtime build error ([#3185](https://github.com/vitejs/vite/issues/3185)) ([978d991](https://github.com/vitejs/vite/commit/978d991293f5b8e1a4197ac4e3aee4fa2e838a88))

## <small>[1.3.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.1...plugin-legacy@1.3.2) (2021-03-27)</small>
### Bug Fixes

* typo in plugin-legacy ([#2651](https://github.com/vitejs/vite/issues/2651)) ([9a2ce75](https://github.com/vitejs/vite/commit/9a2ce7580772cb783a9f8fda7e45e4a9adacbec2))

### Miscellaneous Chores

* **plugin-legacy:** upgrade @babel/standalone to 7.13.12 ([#2649](https://github.com/vitejs/vite/issues/2649)) ([4b89f5b](https://github.com/vitejs/vite/commit/4b89f5b97e715cff9078a528d06ef1255dfff293))
* **plugin-legacy:** upgrade @babel/standalone to 7.13.6 ([#2198](https://github.com/vitejs/vite/issues/2198)) ([609f8aa](https://github.com/vitejs/vite/commit/609f8aa726d81a4094b60d3e0374c78238837a07))

## <small>[1.3.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.3.0...plugin-legacy@1.3.1) (2021-02-15)</small>
### Bug Fixes

* **plugin-legacy:** prevent constant folding for import.meta.env.LEGACY ([bace724](https://github.com/vitejs/vite/commit/bace7244e776b3f4c9dd7e3ff1885df668cbcb87)), closes [#1999](https://github.com/vitejs/vite/issues/1999)
* **plugin-legacy:** use correct string length in legacy env replacement ([#2015](https://github.com/vitejs/vite/issues/2015)) ([7f48086](https://github.com/vitejs/vite/commit/7f4808634f57ca8f4be3b455cc4fb8016acdc4fd))

### Miscellaneous Chores

* **plugin-legacy:** typo ([#2004](https://github.com/vitejs/vite/issues/2004)) [skip ci] ([5225253](https://github.com/vitejs/vite/commit/5225253bc9730b2db1a8b62642cd1496053fce6e))

## [1.3.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.3...plugin-legacy@1.3.0) (2021-02-11)
### Features

* **plugin-legacy:** inject import.meta.env.LEGACY ([416f190](https://github.com/vitejs/vite/commit/416f190aa92f06a06f3ded403fb1e4cb8729256d))

### Code Refactoring

* remove unused ast, adjust logic ([859fed6](https://github.com/vitejs/vite/commit/859fed6780e2412e64e27aa841a7de0aa2986728))

## <small>[1.2.3](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.2...plugin-legacy@1.2.3) (2021-02-01)</small>
### Features

* **plugin-legacy:** use compact output when transpiling legacy chunks ([045e519](https://github.com/vitejs/vite/commit/045e519d51fbce94bddb60793e9e99311acc5aa2)), closes [#1828](https://github.com/vitejs/vite/issues/1828)

### Code Refactoring

* **plugin-legacy:** improve polyfill import removal strategy ([e40e6b2](https://github.com/vitejs/vite/commit/e40e6b29e62acf8300de5cca16e376bfeb27bc5e))

## <small>[1.2.2](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.1...plugin-legacy@1.2.2) (2021-01-25)</small>
### Features

* default vendor chunk splitting ([f6b58a0](https://github.com/vitejs/vite/commit/f6b58a0f535b1c26f9c1dfda74c28c685402c3c9))
* support `base` option during dev, deprecate `build.base` ([#1556](https://github.com/vitejs/vite/issues/1556)) ([809d4bd](https://github.com/vitejs/vite/commit/809d4bd3bf62d3bc6b35f182178922d2ab2175f1))

### Bug Fixes

* **plugin-legacy:** throw error when using esbuild minify with legacy plugin ([8fb2511](https://github.com/vitejs/vite/commit/8fb2511a02c163d85f60dfab0bef104756768e35))

## <small>[1.2.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.2.0...plugin-legacy@1.2.1) (2021-01-14)</small>
### Bug Fixes

* **plugin-legacy:** respect config.build.assetsDir ([#1532](https://github.com/vitejs/vite/issues/1532)) ([3e7ad3f](https://github.com/vitejs/vite/commit/3e7ad3fa26a6149b44b2e522648cbda1009e4888)), closes [#1530](https://github.com/vitejs/vite/issues/1530)

## [1.2.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.1.1...plugin-legacy@1.2.0) (2021-01-11)
### Features

* **plugin-legacy:** support additionalLegacyPolyfills ([ca25896](https://github.com/vitejs/vite/commit/ca258962957c32df0196f30267c3d77b544aacbd)), closes [#1475](https://github.com/vitejs/vite/issues/1475)

### Bug Fixes

* **plugin-html:** typo in the Safari 10 nomodule snippet ([#1483](https://github.com/vitejs/vite/issues/1483)) ([e5576c3](https://github.com/vitejs/vite/commit/e5576c32c08214766c8bac5458dfcad8301d3a1a))

## <small>[1.1.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.1.0...plugin-legacy@1.1.1) (2021-01-09)</small>
### Bug Fixes

* **plugin-legacy:** add `index.d.ts` at publish ([#1457](https://github.com/vitejs/vite/issues/1457)) ([dce2456](https://github.com/vitejs/vite/commit/dce245629651edab9719127deaf07ecfbcf20c5f))

### Documentation

* **plugin-legacy:** fix typos ([#1422](https://github.com/vitejs/vite/issues/1422)) [skip ci] ([16cf3d0](https://github.com/vitejs/vite/commit/16cf3d0cc758591c2a44abbf10b7f2fd21d5ef99))
* Typo in plugin-legacy README ([#1455](https://github.com/vitejs/vite/issues/1455)) [skip ci] ([4647e07](https://github.com/vitejs/vite/commit/4647e072cb89d6eac648a66314f26cb6b65c68b4))

### Miscellaneous Chores

* add version badge for plugins [skip ci] ([62925eb](https://github.com/vitejs/vite/commit/62925eb4da2ce2053e3d28068db5423e2e66ae3d))

## [1.1.0](https://github.com/vitejs/vite/compare/plugin-legacy@1.0.1...plugin-legacy@1.1.0) (2021-01-07)
### Features

* use constant inline script + provide CSP hashes ([72107cd](https://github.com/vitejs/vite/commit/72107cdcdb7241e9fadd67528abb14f54b1c901d))

## <small>[1.0.1](https://github.com/vitejs/vite/compare/plugin-legacy@1.0.0...plugin-legacy@1.0.1) (2021-01-07)</small>
### Features

* **plugin-legacy:** @vitejs/plugin-legacy ([8c34870](https://github.com/vitejs/vite/commit/8c34870040f8c2f4be7d00245a3683f9e64d894e))

### Bug Fixes

* add promise polyfill if not used in bundle ([b72db4e](https://github.com/vitejs/vite/commit/b72db4e3ec5ca8974ea2f1913d5611f73c0978b5))
* **plugin-legacy:** avoid esbuild transform on legacy chunks ([7734105](https://github.com/vitejs/vite/commit/7734105093c6dabf64da6bfc11486aa9ac62efea))

### Performance Improvements

* use @babel/standalone + lazy load ([b2f98fb](https://github.com/vitejs/vite/commit/b2f98fba0215ef171af2abc62e3aefc35f00d168))

### Documentation

* **plugin-legacy:** fix typo ([#1411](https://github.com/vitejs/vite/issues/1411)) ([3321111](https://github.com/vitejs/vite/commit/3321111c77f33ccb9bc06bfa84f6d3fc27902a6e))

### Miscellaneous Chores

* add plugin-legacy version requirement ([3b7a07a](https://github.com/vitejs/vite/commit/3b7a07ac5c7422b01577a26b2ca5b8e1e7001fa3))
* changelog for plugin-legacy [skip ci] ([52ac81a](https://github.com/vitejs/vite/commit/52ac81a14298bf41e11f3bc0d2ae870d67b5ae9d))

# 1.0.0 (2021-01-07)


### Features

* **plugin-legacy:** @vitejs/plugin-legacy ([8c34870](https://github.com/vitejs/vite/commit/8c34870040f8c2f4be7d00245a3683f9e64d894e))
