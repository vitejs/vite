<template>
  <h2>Optimize cjs dep with named export</h2>
  <p class="cjs-dep-named-export-static">
    static import result: {{ staticImport }}
  </p>
  <p class="cjs-dep-named-export-dynamic">
    dynamic import result: {{ dynamicImport }}
  </p>
  <button class="cjs-dep-named-export-dynamic-load" @click="loadDynamic()">
    load dynamic
  </button>
</template>

<script>
import { ref } from 'vue'

import React, { useState, createContext } from 'react'
import { default as React2, useState as useState2 } from 'react'
import * as ReactStar from 'react'

import PropTypes, { oneOfType } from 'prop-types'

export default {
  setup() {
    let staticImport
    if (
      isFunction(React.useState) &&
      isFunction(useState) &&
      isFunction(createContext) &&
      isFunction(React2.useState) &&
      isFunction(useState2) &&
      isFunction(ReactStar.useState) &&
      isFunction(PropTypes.oneOfType) &&
      isFunction(oneOfType)
    ) {
      staticImport = 'success'
    } else {
      staticImport = 'fail'
    }

    const dynamicImport = ref('dynamic not loaded')
    function loadDynamic() {
      // dynamic import cjs dep and get named-export
      import('react-dom').then(({ render }) => {
        dynamicImport.value = isFunction(render) ? 'success' : 'fail'
      })
    }

    return {
      staticImport,
      dynamicImport,
      loadDynamic
    }
  }
}

function isFunction(v) {
  return typeof v === 'function'
}
</script>
