// `.scss` imported from JS — mirrors Vite's `playground/css` "sass" case
// (sass-tests.ts `sassTest`): a .scss file compiled by the Sass preprocessor
// and injected as a <style>, asserted to render the expected color.
import './sass.scss'

document.querySelector('.app').textContent = 'scss loaded'
