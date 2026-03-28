import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    const updateCopyButtons = () => {
      nextTick(() => {
        const buttons = document.querySelectorAll('button.copy')
        buttons.forEach(btn => {
          if (!btn.getAttribute('aria-label')) {
            // Fallback to 'Copy code' if no label is present
            btn.setAttribute('aria-label', 'Copy code')
          }
        })
      })
    }

    onMounted(updateCopyButtons)
    watch(() => route.path, updateCopyButtons)
  }
}