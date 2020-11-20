<template>
  <h2>Test rewrite in optimized module</h2>
  <p class="test-rewrite-in-optimized">{{ msg }}</p>
</template>

<script>
import moment from 'rewrite-optimized-test-package'

export default {
  data: () => ({ msg: moment(1590231082886).format('MMMM Do YYYY, h:mm:ss a') })
}
</script>
