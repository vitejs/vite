<template>
  <h2>Environment Variables</h2>
  <p class="base">
    <code>import.meta.env.BASE_URL: {{ base }}</code>
  </p>
  <p class="mode">
    <code>import.meta.env.MODE: {{ mode }}</code>
  </p>
  <p class="dev">
    <code>import.meta.env.DEV: {{ dev }}</code>
  </p>
  <p class="prod">
    <code>import.meta.env.PROD: {{ prod }}</code>
  </p>
  <p class="custom-env-variable">
    <code>import.meta.env.VITE_CUSTOM_ENV_VARIABLE: {{ custom }}</code>
  </p>
  <p class="effective-mode-file-name">
    <code>import.meta.env.VITE_EFFECTIVE_MODE_FILE_NAME: {{ modeFile }}</code>
  </p>
  <p class="node-env">
    <code>process.env.NODE_ENV: {{ NODE_ENV }}</code>
  </p>
</template>

<script>
export default {
  data() {
    return {
      base: import.meta.env.BASE_URL,
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      custom: import.meta.env.VITE_CUSTOM_ENV_VARIABLE,
      modeFile: import.meta.env.VITE_EFFECTIVE_MODE_FILE_NAME,
      NODE_ENV: process.env.NODE_ENV
    }
  }
}
</script>
