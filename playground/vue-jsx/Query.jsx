import { defineComponent, ref } from 'vue'

export default defineComponent(() => {
  const count = ref(6)
  const inc = () => count.value++

  return () => (
    <button class="jsx-with-query" onClick={inc}>
      import with query transform fail
    </button>
  )
})
