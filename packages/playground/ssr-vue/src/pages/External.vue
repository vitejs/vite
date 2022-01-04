<template>
  <ExampleExternalComponent />
  <UIExternalComponent />
</template>

<script>
import ExampleExternalComponent from 'example-external-component'
import { UIExternalComponent } from 'example-style-external-component'
import 'example-style-external-component/style/index.js'

export default {
  components: {
    ExampleExternalComponent,
    UIExternalComponent
  }
}
</script>
