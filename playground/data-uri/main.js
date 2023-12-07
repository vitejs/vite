import oneApos from './one-apos.svg'
import twoApos from './two-apos.svg'

document.querySelector('#one-apos').innerHTML = `
  <img data-testid="one-apos" src="${oneApos}" class="one-pos" alt="load failed" />
`
document.querySelector('#two-apos').innerHTML = `
  <img data-testid="two-apos" src="${twoApos}" class="two-apos" alt="load failed" />
`
