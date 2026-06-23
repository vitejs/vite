// `.sss` (SugarSS) imported from JS — mirrors Vite's `playground/css` "sugarss"
// case (tests.ts `test('sugarss')`): a SugarSS file parsed by the sugarss
// PostCSS syntax and injected as a <style>, asserted to render the expected
// color. SugarSS is indentation-based (no braces / semicolons), so the source
// is NOT valid plain CSS — the sugarss parser must run for it to compile.
import './sugarss.sss'

document.querySelector('.app').textContent = 'sss loaded'
