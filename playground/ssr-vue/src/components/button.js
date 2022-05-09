import { createVNode, defineComponent } from 'vue'
import '../assets/button.css'

export default defineComponent({
  setup() {
    return () => {
      return createVNode(
        'div',
        {
          class: 'btn'
        },
        'dynamicBtn'
      )
    }
  }
})
