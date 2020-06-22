<template>
  <h2>JSON</h2>
  <pre class="json">Imported JSON: {{ json }}</pre>
</template>

<script>
import json from './testJsonImport.json'

export default {
  data: () => ({ json })
}
</script>
