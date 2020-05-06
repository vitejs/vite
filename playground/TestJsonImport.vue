<template>
  <pre>Imported JSON: {{ json }}</pre>
</template>

<script>
import json from './testJsonImport.json'

export default {
  data: () => ({ json })
}
</script>
