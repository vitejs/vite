import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    const setAccessibleLabels = () => {
      nextTick(() => {
        const copyButtons = document.querySelectorAll('button.copy')
        copyButtons.forEach((btn) => {
          if (!btn.hasAttribute('aria-label')) {
            btn.setAttribute('aria-label', 'Copy code to clipboard')
          }
        })
      })
    }

    onMounted(() => {
      setAccessibleLabels()
    })

    watch(() => route.path, () => {
      setAccessibleLabels()
    })
  }
}