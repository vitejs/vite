/* eslint-disable import-x/no-nodejs-modules */
import assert from 'assert'
import { defineConfig } from 'vite'

let count = 0
export default defineConfig({
  plugins: [
    {
      name: 'plugin1',
      buildStart: {
        async handler() {
          await new Promise((r) => setTimeout(r, 100))
          count += 1
        },
      },
      transform: {
        order: 'post',
        handler(code) {
          return code.replace('__TRANSFORM3__', 'ok')
        },
      },
    },
    {
      name: 'plugin2',
      buildStart: {
        sequential: true,
        async handler() {
          assert(count === 1)
          await new Promise((r) => setTimeout(r, 100))
          count += 1
        },
      },
      transform: {
        handler(code) {
          return code.replace('__TRANSFORM1__', '__TRANSFORM2__')
        },
      },
    },
    {
      name: 'plugin3',
      buildStart: {
        async handler() {
          assert(count === 2)
          await new Promise((r) => setTimeout(r, 100))
          count += 1
        },
      },
      transform: {
        order: 'pre',
        handler(code) {
          return code.replace('__TRANSFORM__', '__TRANSFORM1__')
        },
      },
    },
    {
      name: 'plugin4',
      buildStart: {
        async handler() {
          assert(count === 2)
        },
      },
      transform: {
        handler(code) {
          return code.replace('__TRANSFORM2__', '__TRANSFORM3__')
        },
      },
    },
  ],
})
