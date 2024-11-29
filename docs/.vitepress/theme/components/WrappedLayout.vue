<script setup lang="ts">
import Theme from 'vitepress/theme'
import OldDocument from './OldDocument.vue'
</script>

<template>
  <Theme.Layout>
    <template #sidebar-bottom>
      <slot name="sidebar-bottom"></slot>
    </template>
  </Theme.Layout>
  <OldDocument />
</template>
