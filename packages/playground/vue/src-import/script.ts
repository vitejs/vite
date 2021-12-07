import { defineComponent } from 'vue'
import A from './a.vue'
import B from './b.vue'

export default defineComponent({
  components: {
    A, B
  },
  setup() {
    return {
      msg: 'hello from script src!'
    }
  }
})
