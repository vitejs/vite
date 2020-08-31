<template>
  <h2>The hmr should work with setup script block w/ template block has child component</h2>
  <p class="test-script-setup-child">Child has prop {{msg}}</p>
</template>

<script>
  export default {
    props: {
      msg: String
    }
  }
</script>
