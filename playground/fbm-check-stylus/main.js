// `.styl` imported from JS — mirrors Vite's `playground/css` "stylus" case
// (tests.ts `test('stylus', ...)`): a .styl file compiled by the Stylus
// preprocessor and injected as a <style>, asserted to render the expected color.
import './stylus.styl'

document.querySelector('.app').textContent = 'stylus loaded'
