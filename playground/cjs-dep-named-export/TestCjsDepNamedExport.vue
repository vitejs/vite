<template>
  <h2>Optimize cjs dep with named export</h2>
  <p class="cjs-dep-named-export">
    result: {{result}}
  </p>
</template>

<script>
import React, { useState, createContext } from 'react'
import ReactDOM, { render } from 'react-dom'

export default {
  data() {
    if (
      typeof React.useState === 'function' &&
      typeof useState === 'function' &&
      typeof createContext === 'function' &&
      typeof render === 'function' &&
      typeof ReactDOM.render === 'function'
    ) {
      return {
        result: 'success'
      }
    }
    return {
      result: 'fail'
    }
  }
}
</script>
