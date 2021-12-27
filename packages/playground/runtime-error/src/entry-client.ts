document.querySelector<HTMLButtonElement>('#throwBtn').onclick = () => {
  throw new Error('Why did you click the button')
}

document.querySelector<HTMLButtonElement>('#invalidAccessor').onclick = () => {
  window.doesnt.exists = 5
}

const asyncFunc = async () => {
  throw new Error('async failure')
}

document.querySelector<HTMLButtonElement>('#promise').onclick = async () => {
  await asyncFunc()
}
