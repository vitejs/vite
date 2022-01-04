import { createVNode } from 'vue'

const UIExternalComponent = {
  setup() {
    return () => {
      return createVNode(
        'div',
        {
          class: 'btn'
        },
        'externalBtn'
      )
    }
  }
}

export { UIExternalComponent }
