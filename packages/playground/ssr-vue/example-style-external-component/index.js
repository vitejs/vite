const { createVNode } = require('vue')

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

exports.UIExternalComponent = UIExternalComponent
