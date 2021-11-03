import { createApp } from 'vue'
import { Named, NamedSpec, default as Default } from './Comps'
import { default as TsxDefault, MultiLineClass } from './Comp'
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
      <MultiLineClass />
      <OtherExt />
      <JsxScript />
      <JsxSrcImport />
    </>
  )
}

createApp(App).mount('#app')
