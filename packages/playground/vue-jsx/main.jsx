import { createApp } from 'vue'
import { Named, NamedSpec, default as Default } from './Comps'
import { default as TsxDefault } from './Comp'

function App() {
  return (
    <>
      <Named />
      <NamedSpec />
      <Default />
      <TsxDefault />
    </>
  )
}

createApp(App).mount('#app')
