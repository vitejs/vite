import { createApp } from 'vue'
import { Named, NamedSpec, default as Default } from './Comps'
import { default as TsxDefault } from './Comp'
import OtherExt from './OtherExt.tesx'
import JsxScript from './Script.vue'
import JsxSrcImport from './SrcImport.vue'

function App() {
  return (
    <>
      <Named />
      <NamedSpec />
      <Default />
      <TsxDefault />
      <OtherExt />
      <JsxScript />
      <JsxSrcImport />
    </>
  )
}

createApp(App).mount('#app')
