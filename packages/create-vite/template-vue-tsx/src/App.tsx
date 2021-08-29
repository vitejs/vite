import { defineComponent } from 'vue';
import HelloWorld from './components/HelloWorld'
import './App.css'

export default defineComponent({
  props: {
  },

  setup(props) {

    return () => (
      <>
        <img alt="Vue logo" src="@/assets/logo.png" />
        <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
      </>
    )
  }
})