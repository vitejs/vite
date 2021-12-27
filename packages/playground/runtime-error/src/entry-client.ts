document.querySelector<HTMLButtonElement>('#throwBtn').onclick = () => {
  throw new Error('Why did you click the button')
}

document.querySelector<HTMLButtonElement>('#invalidAccessor').onclick = () => {
  window.doesnt.exists = 5
}
