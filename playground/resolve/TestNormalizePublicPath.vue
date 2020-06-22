<template>
  <h2>TestNormalizePublicPath</h2>
  <p class="normalize-public-path">{{ msg }}</p>
</template>

<script>
import slicedToArray from '@babel/runtime/helpers/esm/slicedToArray'

const iterable = (function* () {
  yield 2
  yield 4
  yield 6
  yield 8
})()

export default {
  data: () => ({
    msg: JSON.stringify(slicedToArray(iterable, 2))
  })
}
</script>
