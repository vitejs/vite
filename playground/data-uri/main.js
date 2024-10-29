import sqdqs from './single-quote-in-double-quotes.svg'
import sqsdqs from './single-quotes-in-double-quotes.svg'
import dqsqs from './double-quote-in-single-quotes.svg'
import dqssqs from './double-quotes-in-single-quotes.svg'

document.querySelector('#sqdqs').innerHTML = `
  <img data-testid="sqdqs" src="${sqdqs}" class="sqdqs" alt="load failed" />
`
document.querySelector('#sqsdqs').innerHTML = `
  <img data-testid="sqsdqs" src="${sqsdqs}" class="sqsdqs" alt="load failed" />
`

document.querySelector('#dqsqs').innerHTML = `
  <img data-testid="dqsqs" src="${dqsqs}" class="dqsqs" alt="load failed" />
`
document.querySelector('#dqssqs').innerHTML = `
  <img data-testid="dqssqs" src="${dqssqs}" class="dqssqs" alt="load failed" />
`
