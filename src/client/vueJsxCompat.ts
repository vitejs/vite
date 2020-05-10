import { createVNode } from 'vue'

declare const __DEV__: boolean

if (__DEV__) {
  console.log(
    `[vue tip] You are using an non-optimized version of Vue 3 JSX, ` +
      `which does not take advantage of Vue 3's runtime fast paths. An improved ` +
      `JSX transform will be provided at a later stage.`
  )
}

export function jsx(tag: any, props = null) {
  const c =
    arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null
  return createVNode(tag, props, typeof tag === 'string' ? c : () => c)
}
