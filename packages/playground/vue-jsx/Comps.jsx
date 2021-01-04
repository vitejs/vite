import { defineComponent, ref } from 'vue'

export const Named = defineComponent(() => {
  const count = ref(0)
  const inc = () => count.value++

  return () => (
    <button class="named" onClick={inc}>
      named {count.value}
    </button>
  )
})

const NamedSpec = defineComponent(() => {
  const count = ref(1)
  const inc = () => count.value++

  return () => (
    <button class="named-specifier" onClick={inc}>
      named specifier {count.value}
    </button>
  )
})
export { NamedSpec }

export default defineComponent(() => {
  const count = ref(2)
  const inc = () => count.value++

  return () => (
    <button class="default" onClick={inc}>
      default {count.value}
    </button>
  )
})
