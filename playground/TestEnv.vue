<template>
  <h2>Environment Variables</h2>
  <p class="node-env">
    <code>process.env.NODE_ENV: {{ NODE_ENV }}</code>
  </p>
  <p class="customize-env-variable">
    <code>process.env.CUSTOM_ENV_VARIABLE: {{ CUSTOM_ENV_VARIABLE }}</code>
  </p>
</template>

<script>
export default {
  data() {
    return {
      NODE_ENV: process.env.NODE_ENV,
      CUSTOM_ENV_VARIABLE: process.env.CUSTOM_ENV_VARIABLE
    }
  }
}
</script>
