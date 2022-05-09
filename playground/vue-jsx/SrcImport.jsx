import { defineComponent, ref } from 'vue'

export default defineComponent(() => {
  const count = ref(5)
  const inc = () => count.value++

  return () => (
    <button class="src-import" onClick={inc}>
      src import {count.value}
    </button>
  )
})
