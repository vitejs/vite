
const input = document.querySelector('input')

input.addEventListener('click', handleClick)

function handleClick () {
  throw new Error('Something went wrong')
}
