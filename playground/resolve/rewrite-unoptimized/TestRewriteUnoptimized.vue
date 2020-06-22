<template>
  <h2>Test rewrite in optimized module</h2>
  <p class="test-rewrite-in-unoptimized">{{ msg }}</p>
</template>

<script>
import value from 'rewrite-unoptimized-test-package'

export default {
  data: () => ({ msg: value })
}
</script>
