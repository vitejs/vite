import { createVNode, isVNode } from 'vue'

if (import.meta.env.MODE === 'development') {
  console.log(
    `[vue tip] You are using an non-optimized version of Vue 3 JSX, ` +
      `which does not take advantage of Vue 3's runtime fast paths. An improved ` +
      `JSX transform will be provided at a later stage.`
  )
}

const slice = Array.prototype.slice

export function jsx(tag: any, props = null, children: any = null) {
  if (arguments.length > 3 || isVNode(children)) {
    children = slice.call(arguments, 2)
  }
  return createVNode(tag, props, children)
}
