<template>
  <div>
    <h2>Static Asset Handling</h2>
    <p class="asset-import">
      Path for assets import from js: <code>{{ filepath }}</code>
    </p>
    <p>
      Relative asset reference in template:
      <img src="./nested/testAssets.png" style="width: 30px" />
    </p>
    <p>
      Alias asset reference in template:
      <img src="/@/test-assets/nested/testAssets.png" style="width: 30px" />
    </p>
    <p>
      Absolute asset reference in template:
      <img src="/favicon.ico" style="width: 30px" />
    </p>
    <p>
      Absolute asset reference without protocol header in the template:
      <img src="//cli.vuejs.org/favicon.png" style="width: 30px" />
    </p>
  </div>
</template>

<script>
import filepath from './nested/testAssets.png'

export default {
  data() {
    return {
      filepath
    }
  }
}
</script>
