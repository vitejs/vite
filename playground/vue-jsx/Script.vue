<script lang="jsx">
import { defineComponent, ref } from 'vue'

export default defineComponent(() => {
  const count = ref(4)
  const inc = () => count.value++

  return () => (
    <button class="script" onClick={inc}>
      script {count.value}
    </button>
  )
})
</script>
