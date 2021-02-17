# Vue 3 + Typescript + Vite
This template should help get you started developing with Vue 3 and Typescript in Vite.

## Recommended IDE Setup
[VSCode](https://code.visualstudio.com/) with [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur) allows
for syntax highlighting and autocomplete, and adding the [VueDX](https://marketplace.visualstudio.com/items?itemName=znck.vue-language-features) extension provides improved type checking, completion, and refactoring tools.

If you would like to use the new `<script setup>` feature, [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) is recommended for VSCode instead.

##Type Support For .vue Modules

Without the following steps, TypeScript won't be able to identify the types of `.vue` files when they're imported as modules. The [VueDX Typescript plugin](https://www.npmjs.com/package/@vuedx/typescript-plugin-vue) provides this functionality along with other type-checking improvements.

   1. Install and add `@vuedx/typescript-plugin-vue` to the [plugins section](https://www.typescriptlang.org/tsconfig#plugins) in `tsconfig.json`
   2. Delete `src/shims-vue.d.ts` as it is no longer needed to provide module info to Typescript 
   3. Open `src/main.ts` in VSCode 
   4. Open the VSCode command palette
   5. Search and run "Select TypeScript version" -> "Use workspace version"
