import { defineComponent, ref } from 'vue'

const MultiLineClass = defineComponent(() => {
  const count = ref(1)
  const inc = () => count.value++

  return () => (
    <button
      class="
      class-one
      class-two
    "
      onClick={inc}
    >
      multi line class {count.value}
    </button>
  )
})

export { MultiLineClass }

const Default = defineComponent(() => {
  const count = ref(3)
  const inc = () => count.value++

  return () => (
    <button class="default-tsx" onClick={inc}>
      default tsx {count.value}
    </button>
  )
})

export default Default
