// CSS Modules imported from JS — mirrors Vite's `playground/css` "css modules"
// case (main.js L20-22, tests.ts L166-182): a `*.module.css` import returns a
// class-name map (default export: { localName: hashedName }). We apply the
// mapped (hashed) class to a DOM node so its style takes effect, and render the
// map so the test can inspect the resolved class.
import mod from './mod.module.css'

document.querySelector('.modules').classList.add(mod['apply-color'])
document.querySelector('.modules-code').textContent = JSON.stringify(
  mod,
  null,
  2,
)

document.querySelector('.app').textContent = 'css-modules loaded'

// Same accept block Vite's css playground uses (main.js L78-83): on an edit the
// hashed class may change, so swap it. (CSS HMR also refreshes the <style>.)
if (import.meta.hot) {
  import.meta.hot.accept('./mod.module.css', (newMod) => {
    const list = document.querySelector('.modules').classList
    list.remove(mod['apply-color'])
    list.add(newMod.default['apply-color'])
    document.querySelector('.modules-code').textContent = JSON.stringify(
      newMod.default,
      null,
      2,
    )
  })
}
