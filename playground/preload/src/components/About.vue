<script setup>
import { msg } from '@vitejs/test-dep-including-a'
</script>

<template>
  <div>
    This is <b>about</b> page.
    <br />
    Go to <router-link to="/">Home</router-link> page
    <br />
    {{ msg }}
  </div>
</template>
