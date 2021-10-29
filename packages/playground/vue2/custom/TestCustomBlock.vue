<template>
  <div>
    <p class="custom-block">{{ custom }}</p>
    <p class="custom-block-lang">{{ customLang }}</p>
    <p class="custom-block-src">{{ customSrc }}</p>
  </div>
</template>

<script>
export default {
  name: 'TestCustomBlock',
  data() {
    return {
      custom: '',
      customLang: '',
      customSrc: ''
    }
  },
  created() {
    this.custom = this.$options.__customBlock.custom
    this.customLang = this.$options.__customBlock.customLang
    this.customSrc = this.$options.__customBlock.customSrc
  }
}
</script>

<custom>
export default {
  "custom": "Custom Block"
}
</custom>

<custom lang="json">
{
  "customLang": "Custom Block"
}
</custom>

<custom src="./custom.json"></custom>
