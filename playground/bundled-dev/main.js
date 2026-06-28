import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

text('.app', 'hello')
text('.date-fns-locale', format(new Date(2020, 5, 1), 'MMMM', { locale: pl }))

function text(el, text) {
  document.querySelector(el).textContent = text
}
