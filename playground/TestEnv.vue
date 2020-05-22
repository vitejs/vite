<template>
  <h2>Environment Variables</h2>
  <p class="node-env">
    <code>process.env.NODE_ENV: {{ NODE_ENV }}</code>
  </p>
  <p class="customize-env-variable">
    <code>process.env.CUSTOMIZE_ENV_VARIABLE: {{ CUSTOMIZE_ENV_VARIABLE }}</code>
  </p>
  <p class="defined-variable-names">
    <code>Defined environment variable names: {{ variableNames }}</code>
  </p>
</template>

<script>
export default {
  data() {
    return {
      NODE_ENV: process.env['NODE_ENV'],
      CUSTOMIZE_ENV_VARIABLE: process.env.CUSTOMIZE_ENV_VARIABLE,
      variableNames: Object.keys(process.env).join(",")
    }
  }
}
</script>
