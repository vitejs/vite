<template>
  <h2>JSON</h2>
  <pre class="json">Imported JSON: {{ json }}</pre>
  <pre class="json-named-exports">JSON Named Exports: {{ hello }}</pre>
</template>

<script>
import json, { hello } from './test.json'

export default {
  data: () => ({ json, hello })
}
</script>
