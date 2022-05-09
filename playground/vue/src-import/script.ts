import { defineComponent } from 'vue'
import SrcImportStyle from './srcImportStyle.vue'
import SrcImportStyle2 from './srcImportStyle2.vue'

export default defineComponent({
  components: {
    SrcImportStyle,
    SrcImportStyle2
  },
  setup() {
    return {
      msg: 'hello from script src!'
    }
  }
})
