import { view1 } from './views/view1'

export const main = (view1Content) => /* html */ `
  <h1 id="pagetitle" class="text-3xl text-violet-600">Page title</h1>
  ${view1Content}
  <!-- used in postcss-plugins-different-dir -->
  <div id="tailwind-style" class="bg-red-100 text-[#888888]">style</div>
`

document.getElementById('app').innerHTML = main(view1)

import.meta.hot?.accept((mod) => {
  document.getElementById('app').innerHTML = mod.main(view1)
})

import.meta.hot?.accept(['./views/view1'], ([mod]) => {
  document.getElementById('app').innerHTML = main(mod.view1)
})
