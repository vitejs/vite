<template>
  <h2>Scan Deps from &lt;script setup lang=ts&gt; blocks</h2>
  <div class="scan">{{ typeof debounce === 'function' ? 'ok' : 'error' }}</div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
</script>
