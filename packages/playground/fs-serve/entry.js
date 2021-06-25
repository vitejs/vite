import { msg } from './nested/foo'

export const fullmsg = msg + 'bar'

document.querySelector('.nested-entry').textContent = fullmsg
