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



