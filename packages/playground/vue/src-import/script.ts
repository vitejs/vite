import { defineComponent } from 'vue'
import A from './srcImportStyle.vue'
import B from './srcImportStyle2.vue'

export default defineComponent({
  components: {
    A,
    B
  },
  setup() {
    return {
      msg: 'hello from script src!'
    }
  }
})
