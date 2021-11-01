<template>
  <h1>{{foo}}</h1>
</template>

<script>
export default {
  async setup() {
    if (typeof window === 'undefined') {
      // code execute in server side
      const { resolve } = require('path')
      const cwd = process.env.JEST_WORKER_ID !== undefined ? resolve(process.cwd(), './packages/playground/ssr-vue') : process.cwd()
      const { foo } = require(resolve(cwd, './config'))
      return {
        foo: foo
      }
    }
    return {
      foo: 'foo'
    }
  }
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>
