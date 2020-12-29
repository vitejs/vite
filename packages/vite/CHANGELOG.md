# [2.0.0-alpha.1](https://github.com/vitejs/vite/compare/v1.0.0-rc.13...v2.0.0-alpha.1) (2020-12-29)


### Bug Fixes

* always normalize paths on windows ([490484b](https://github.com/vitejs/vite/commit/490484bb44f8bb7d1fc4172445c2b896a60a68b3))
* avoid self referencing type in plugin-vue ([9cccdaa](https://github.com/vitejs/vite/commit/9cccdaa0935ca664c8a709a89ebd1f2216565546))
* don't fail on missing sourcemap source ([#1159](https://github.com/vitejs/vite/issues/1159)) ([18c2c6f](https://github.com/vitejs/vite/commit/18c2c6fc74862ff07c33cad798002e242acfc195))
* fix check for out of root files when outside dir ([4bfd823](https://github.com/vitejs/vite/commit/4bfd82393a2b0a8f4c9da900ce3d6959a5b06469))
* fix client resolve ([577ba6e](https://github.com/vitejs/vite/commit/577ba6e19a09e4625346eff33d3fc0139788129e))
* fix custom hmr event ([09d2cdd](https://github.com/vitejs/vite/commit/09d2cdd05f75f3fa74e5b2205e4684b3b7d09a0e))
* ignore external imports ([0f61b23](https://github.com/vitejs/vite/commit/0f61b23d65df07a5ba575f17c2d128fd72d1d825))
* no need to ensure ext ([a1dda24](https://github.com/vitejs/vite/commit/a1dda24f8bba795ec5745ac3b671916c00c16cde))
* normalize all paths for windows ([44001b6](https://github.com/vitejs/vite/commit/44001b65785f92828367fa44e9c738fc9f1ac662))
* normalize path when creating css dep module entries ([a173b62](https://github.com/vitejs/vite/commit/a173b62d2cccd4e6ac5ef5066e2d4ba8c9967a69))
* properly handle multiple inline module scripts in html ([89558a6](https://github.com/vitejs/vite/commit/89558a635d68de74f9e68e92759892d9db032252))
* respect minify false ([1fc6b64](https://github.com/vitejs/vite/commit/1fc6b6459f342c62224c4f5e487d35aa19b889dc))
* **build:** ensure a non-zero exit code on failure ([#1038](https://github.com/vitejs/vite/issues/1038)) ([650ca16](https://github.com/vitejs/vite/commit/650ca16fef050da87cb6a2a883fd9a43536326d5))
* **build:** keep css generate order ([#1186](https://github.com/vitejs/vite/issues/1186)) ([4f7f518](https://github.com/vitejs/vite/commit/4f7f51820cb627d3354c914b00e699ad2d5ad1c6)), closes [#1171](https://github.com/vitejs/vite/issues/1171)
* **dev:** add  watch option passed to `chokidar` ([#841](https://github.com/vitejs/vite/issues/841)) ([a73c29b](https://github.com/vitejs/vite/commit/a73c29b18a78103ee45099aca685ad1dfec9baf5)), closes [/github.com/vitejs/vite/issues/610#issuecomment-694445467](https://github.com//github.com/vitejs/vite/issues/610/issues/issuecomment-694445467) [#1153](https://github.com/vitejs/vite/issues/1153)
* **plugin-vue:** ensure id on descriptor ([91217f6](https://github.com/vitejs/vite/commit/91217f6d968485303e71128bb79ad4400b9b4412))
* respect VITE_ values in process.env ([#1181](https://github.com/vitejs/vite/issues/1181)) ([e6a8473](https://github.com/vitejs/vite/commit/e6a847336c286cb2795565e7c07d5e1bb64926a8)), closes [#1180](https://github.com/vitejs/vite/issues/1180)
* use paths instead of import paths for _analysis keys ([b8dea1b](https://github.com/vitejs/vite/commit/b8dea1b85fb17707d3bc6919d954b9ae32e4dfdf)), closes [#1151](https://github.com/vitejs/vite/issues/1151)
* **build:** ignore other bundles in vite:emit plugin ([59fed49](https://github.com/vitejs/vite/commit/59fed49e511789d8dcc1036019113c08e0ef2049)), closes [#1071](https://github.com/vitejs/vite/issues/1071)
* **config:** detect TS when configPath is provided ([#1165](https://github.com/vitejs/vite/issues/1165)) ([fca0892](https://github.com/vitejs/vite/commit/fca0892395a7aaaf9393a16708af79225a0608d6))
* **dev:** send ping socket for hmr ws ([#1028](https://github.com/vitejs/vite/issues/1028)) ([7a298b7](https://github.com/vitejs/vite/commit/7a298b7812b2ba104c48eee73cd957de09012427)), closes [#1020](https://github.com/vitejs/vite/issues/1020)
* unset `output.file` when input is "index.html" ([c036f7d](https://github.com/vitejs/vite/commit/c036f7d561a87b714cf3bbfc670eb05eddf1b274))


### Features

* allow browsers to cache node_modules ([64cd625](https://github.com/vitejs/vite/commit/64cd625aa11540143c64d2ee5afc912af74e1285))
* auto restart server on config/.env change ([e8d3277](https://github.com/vitejs/vite/commit/e8d32773059d66636f0b111d3186fa6c91fd9405))
* basic build ([3517827](https://github.com/vitejs/vite/commit/3517827ed94f2e5cdf7a64c1a535d4b1a001d7d7))
* custom blocks ([085599b](https://github.com/vitejs/vite/commit/085599b242c58eefc88db3135dad210a0250483f))
* dynamic import w/ variables ([7cbbca4](https://github.com/vitejs/vite/commit/7cbbca4a939e9b78427a96a19e40473b4fd4ccea))
* lib mode ([edfc4ef](https://github.com/vitejs/vite/commit/edfc4ef212dafa314a681928875d5b8bd29f9d95))
* manifest ([ab26e25](https://github.com/vitejs/vite/commit/ab26e258ead697e6128d8ab6046bf48933be6eb6))
* multi html build ([e5a4cd2](https://github.com/vitejs/vite/commit/e5a4cd286e8c8e3ef58fad2a7605bacdb61ba480))
* support native esm config files ([6687720](https://github.com/vitejs/vite/commit/6687720a39a25838e51c24c9bdbad32bd2b9ce4d))
* wasm ([e23e21f](https://github.com/vitejs/vite/commit/e23e21f5168c3761c5cb192d4201c97bb4b57d59))
* web worker ([a9fe3e7](https://github.com/vitejs/vite/commit/a9fe3e7de7e871400b1df6cce80cb52d1f5c0a94))
* **dev:** reload output add hotUpdate time ([#1195](https://github.com/vitejs/vite/issues/1195)) ([0ff4b73](https://github.com/vitejs/vite/commit/0ff4b73a60a610dd398fb45f6391c3aa8caa76dc))


### Performance Improvements

* skip import analysis when url is import.meta ([8debb22](https://github.com/vitejs/vite/commit/8debb22a3c3d8d534fe11ccadf07024011a313b4))



