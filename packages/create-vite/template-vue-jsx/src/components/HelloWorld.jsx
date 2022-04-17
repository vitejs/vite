import { ref, defineComponent } from 'vue'
import styles from '../styles/HelloWorld.module.css'

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: String
  },
  setup({ msg }) {
    const count = ref(0)

    const btnOnClick = () => (count.value += 1)

    return () => (
      <div class={styles.container}>
        <h1>{msg}</h1>

        <p>
          {'Recommended IDE setup: '}
          <a href="https://code.visualstudio.com/" target="_blank">
            VS Code
          </a>
          {'  +  '}
          <a href="https://github.com/johnsoncodehk/volar" target="_blank">
            Volar
          </a>
        </p>

        <p>
          <a href="https://vitejs.dev/guide/features.html" target="_blank">
            Vite Documentation
          </a>
          {'  |  '}
          <a href="https://v3.vuejs.org/" target="_blank">
            Vue 3 Documentation
          </a>
        </p>

        <button type="button" onClick={btnOnClick}>
          count is: {count.value}
        </button>
        <p>
          Edit
          <code>components/HelloWorld.vue</code> to test hot module replacement.
        </p>
      </div>
    )
  }
})
