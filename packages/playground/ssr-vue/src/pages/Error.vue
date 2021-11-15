<template>
  <h1>Error</h1>
</template>

<script>
export default {
  setup() {
    throw new Error('This should render vite-error-overlay')
  }
}
</script>
