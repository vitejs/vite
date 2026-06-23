// `.pcss` imported from JS — mirrors Vite's `playground/css` PostCSS case
// (tests.ts `test('postcss config', ...)`): a CSS module written with nested
// rules that the `postcss-nested` PostCSS plugin flattens, injected as a
// <style>, asserted to render the expected color on the (flattened) child.
import './nested.pcss'

document.querySelector('.app').textContent = 'pcss loaded'
