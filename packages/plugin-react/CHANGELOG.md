## [1.1.4](https://github.com/vitejs/vite/compare/plugin-react@1.1.3...plugin-react@1.1.4) (2022-01-04)


### Bug Fixes

* **plugin-react:** check for import React statement in .js files ([#6320](https://github.com/vitejs/vite/issues/6320)) ([bd9e97b](https://github.com/vitejs/vite/commit/bd9e97bd1b9156059b78b531871a12f6f47c04b1)), closes [#6148](https://github.com/vitejs/vite/issues/6148) [#6148](https://github.com/vitejs/vite/issues/6148)
* **plugin-react:** restore-jsx bug when component name is lowercase ([#6110](https://github.com/vitejs/vite/issues/6110)) ([ce65c56](https://github.com/vitejs/vite/commit/ce65c567a64fad3be4209cbd1132e62e905fe349))


### Features

* **plugin-react:** check for `api.reactBabel` on other plugins ([#5454](https://github.com/vitejs/vite/issues/5454)) ([2ab41b3](https://github.com/vitejs/vite/commit/2ab41b3184d2452be4fa0b427f05c791311644aa))



## [1.1.3](https://github.com/vitejs/vite/compare/plugin-react@1.1.2...plugin-react@1.1.3) (2021-12-13)


### Bug Fixes

* **plugin-react:** only detect preamble in hmr context ([#6096](https://github.com/vitejs/vite/issues/6096)) ([8735294](https://github.com/vitejs/vite/commit/8735294055ce16308a6b8302eba4538f4a2931d0))



## [1.1.2](https://github.com/vitejs/vite/compare/plugin-react@1.1.1...plugin-react@1.1.2) (2021-12-13)


### Bug Fixes

* ignore babel config when running restore-jsx ([#6047](https://github.com/vitejs/vite/issues/6047)) ([9c2843c](https://github.com/vitejs/vite/commit/9c2843cf0506844ee32f042a04c22c440434df2a))



## [1.1.1](https://github.com/vitejs/vite/compare/plugin-react@1.1.0...plugin-react@1.1.1) (2021-12-07)



# [1.1.0](https://github.com/vitejs/vite/compare/plugin-react@1.1.0-beta.1...plugin-react@1.1.0) (2021-11-22)



# [1.1.0-beta.1](https://github.com/vitejs/vite/compare/plugin-react@1.1.0-beta.0...plugin-react@1.1.0-beta.1) (2021-11-19)


### Bug Fixes

* **plugin-react:** apply `babel.plugins` to project files only ([#5255](https://github.com/vitejs/vite/issues/5255)) ([377d0be](https://github.com/vitejs/vite/commit/377d0be5cf85a50240e160beaaafda77b7199452))
* **plugin-react:** remove querystring from sourcemap filename ([#5760](https://github.com/vitejs/vite/issues/5760)) ([d93a9fa](https://github.com/vitejs/vite/commit/d93a9fab8986f3659e79d7b0b065e99ef625a5dd))
* **plugin-react:** restore usage of extension instead of id ([#5761](https://github.com/vitejs/vite/issues/5761)) ([59471b1](https://github.com/vitejs/vite/commit/59471b186612d3da0083543e23d660747d3287f3))
* **plugin-react:** uncompiled JSX in linked pkgs ([#5669](https://github.com/vitejs/vite/issues/5669)) ([41a7c9c](https://github.com/vitejs/vite/commit/41a7c9ccfbc1a7bc60aec672056eac3966ddd036))



# [1.1.0-beta.0](https://github.com/vitejs/vite/compare/plugin-react@1.0.6...plugin-react@1.1.0-beta.0) (2021-10-28)


### Bug Fixes

* **plugin-react:** avoid mangling the sourcemaps of virtual modules ([#5421](https://github.com/vitejs/vite/issues/5421)) ([8556ffe](https://github.com/vitejs/vite/commit/8556ffe3c59952d7e64565422bf433699e97756e))



## [1.0.6](https://github.com/vitejs/vite/compare/plugin-react@1.0.5...plugin-react@1.0.6) (2021-10-25)


### Bug Fixes

* **plugin-react:** account for querystring in transform hook ([#5333](https://github.com/vitejs/vite/issues/5333)) ([13c3813](https://github.com/vitejs/vite/commit/13c381368caf8302a0c5b7cec07dfc0eb344bede))



## [1.0.5](https://github.com/vitejs/vite/compare/plugin-react@1.0.4...plugin-react@1.0.5) (2021-10-18)


### Bug Fixes

* **plugin-react:** fix regex for react imports ([#5274](https://github.com/vitejs/vite/issues/5274)) ([00b3e4f](https://github.com/vitejs/vite/commit/00b3e4fe102652b2d92e76a05e8c7a5b766b1d03))
* **plugin-react:** transform .mjs files ([#5314](https://github.com/vitejs/vite/issues/5314)) ([8ce2ea1](https://github.com/vitejs/vite/commit/8ce2ea17d51b80c660f2cdca7844d4fc6991baed))



## [1.0.4](https://github.com/vitejs/vite/compare/plugin-react@1.0.3...plugin-react@1.0.4) (2021-10-11)



## [1.0.3](https://github.com/vitejs/vite/compare/plugin-react@1.0.2...plugin-react@1.0.3) (2021-10-11)


### Bug Fixes

* **plugin-react:** turn off jsx for .ts ([#5198](https://github.com/vitejs/vite/issues/5198)) ([916f9d3](https://github.com/vitejs/vite/commit/916f9d3984d5e83f7cb869b3606a1f043a814b97)), closes [#5102](https://github.com/vitejs/vite/issues/5102)



## [1.0.2](https://github.com/vitejs/vite/compare/plugin-react@1.0.1...plugin-react@1.0.2) (2021-10-05)


### Bug Fixes

* **plugin-react:** respect `opts.fastRefresh` in viteBabel ([#5139](https://github.com/vitejs/vite/issues/5139)) ([5cf4e69](https://github.com/vitejs/vite/commit/5cf4e69cd3afc7f960e02072171c7c441747e8f0))



## [1.0.1](https://github.com/vitejs/vite/compare/plugin-react@1.0.0...plugin-react@1.0.1) (2021-09-22)


### Bug Fixes

* **plugin-react:** inconsistent error warning ([#5031](https://github.com/vitejs/vite/issues/5031)) ([89ba8ce](https://github.com/vitejs/vite/commit/89ba8cedb8636968516bc38b37e1d2d5ed6234bb))


### Features

* **plugin-react:** pre-optimize jsx-dev-runtime ([#5036](https://github.com/vitejs/vite/issues/5036)) ([a34dd27](https://github.com/vitejs/vite/commit/a34dd2725e64fedf626e23ba9ced480f5465a59b))



# [1.0.0](https://github.com/vitejs/vite/compare/plugin-react@1.0.0-beta.0...plugin-react@1.0.0) (2021-09-22)

See the [readme](https://github.com/aleclarson/vite/blob/f8129ce6e87684eb7a4edd8106351c5d98207d7b/packages/plugin-react/README.md#vitejsplugin-react-) for more information.

- Support for [automatic JSX runtime](https://github.com/alloc/vite-react-jsx)
- Babel integration for both development and production builds
- Add `react` and `react-dom` to [`resolve.dedupe`](https://vitejs.dev/config/#resolve-dedupe) automatically

Thanks to @aleclarson and @pengx17 for preparing this release!

# Legacy

Before `@vitejs/plugin-react`, there was `@vitejs/plugin-react-refresh`.

See its changelog [here.](https://github.com/vitejs/vite/blob/b9e837a2aa2c1a7a8f93d4b19df9f72fd3c6fb09/packages/plugin-react-refresh/CHANGELOG.md)
