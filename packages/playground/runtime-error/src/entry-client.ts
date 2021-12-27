document.querySelector<HTMLButtonElement>('#throwBtn').onclick = () => {
  throw new Error('Why did you click the button')
}
