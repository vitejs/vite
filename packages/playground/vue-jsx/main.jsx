import { createApp } from 'vue'
import { Named, NamedSpec, default as Default } from './Comps'
import { default as TsxDefault } from './Comp'
import OtherExt from './OtherExt.tesx'

function App() {
  return (
    <>
      <Named />
      <NamedSpec />
      <Default />
      <TsxDefault />
      <OtherExt />
    </>
  )
}

createApp(App).mount('#app')
