import { defineComponent } from 'vue'

import HelloWorld from './components/HelloWorld'
import Logo from './assets/logo.png'

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <>
        <img alt="Vue logo" src={Logo} />
        <HelloWorld msg="Hello Vue 3 + JSX + Vite"></HelloWorld>
      </>
    )
  }
})
