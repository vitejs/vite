import { createApp } from 'vue'
import { Named, NamedSpec, default as Default } from './Comps'
import { default as TsxDefault } from './Comp'
import OtherExt from './OtherExt.tesx'
import JsxScript from './Script.vue'
import JsxSrcImport from './SrcImport.vue'
import JsxSetupSyntax from './setup-syntax-jsx.vue'
// eslint-disable-next-line
import JsxWithQuery from './Query.jsx?query=true'
import TsImport from './TsImport.vue'

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
      <JsxSetupSyntax />
      <JsxWithQuery />
      <TsImport />
    </>
  )
}

createApp(App).mount('#app')
