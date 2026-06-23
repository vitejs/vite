// `.less` imported from JS — mirrors Vite's `playground/css` "less" case
// (css.spec.ts `test('less', ...)`): a .less file compiled by the Less
// preprocessor and injected as a <style>, asserted to render the expected color.
import './less.less'

document.querySelector('.app').textContent = 'less loaded'
