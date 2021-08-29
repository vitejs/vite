import { ref, withModifiers, defineComponent } from 'vue';
import './HelloWorld.css'

export default defineComponent({
  props: {
    msg: String
  },

  setup(props) {
    const count = ref(0)
    const { msg } = props;

    const inc = () => {
      count.value++;
    };

    return () => (
      <>
        <h1>{ msg }</h1>

        <p>
          Recommended IDE setup:
          <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
          +
          <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
        </p>

        <p>See <code>README.md</code> for more information.</p>

        <p>
          <a href="https://vitejs.dev/guide/features.html" target="_blank">
            Vite Docs
          </a>
          |
          <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
        </p>

        <button type="button" onClick={withModifiers(inc, ["self"])}>count is:{count.value}</button>
        <p>
          Edit
          <code>components/HelloWorld.tsx</code> to test hot module replacement.
        </p>
      </>
    )
  }
})