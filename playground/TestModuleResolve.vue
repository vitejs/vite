<template>
  <h2>Module Resolving</h2>
  <div class="module-resolve-router" :class="router">vue-router@next {{ router }}</div>
  <div class="module-resolve-store" :class="store">vuex@next {{ store }}</div>
  <div class="module-resolve-web" :class="web_modules">web_modules {{ web_modules }}</div>
</template>

<script>
import { createRouter } from "vue-router";
import { createStore } from "vuex";
import { dep } from "web-modules-dep";

export default {
  setup() {
    return {
      router: typeof createRouter === "function" ? "ok" : "error",
      store: typeof createStore === "function" ? "ok" : "error",
      web_modules: dep() ? "ok" : "error",
    };
  },
};
</script>

<style scoped>
.ok {
  color: green;
}
.error {
  color: red;
}
</style>
