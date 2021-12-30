import { externalThrow } from './external'

document.querySelector<HTMLButtonElement>('#throwBtn').onclick = () => {
  throw new Error('Why did you click the button')
}

document.querySelector<HTMLButtonElement>('#invalidAccessor').onclick = () => {
  //@ts-expect-error
  window.doesnt.exists = 5
}

const asyncFunc = async () => {
  Promise.reject(new Error('async failure'))
}

document.querySelector<HTMLButtonElement>('#throwStr').onclick = () => {
  throw 'String Error'
}

document.querySelector<HTMLButtonElement>('#throwNum').onclick = () => {
  throw 42
}

document.querySelector<HTMLButtonElement>('#throwExternal').onclick = () => {
  externalThrow()
}

document.querySelector<HTMLButtonElement>('#reject').onclick = async () => {
  await asyncFunc()
}

document.querySelector<HTMLButtonElement>('#rejectExternalModule').onclick =
  async () => {
    await import('./module-thrown')
  }

document.querySelector<HTMLButtonElement>('#rejectExternal').onclick =
  async () => {
    ;(await import('./external')).externalAsync()
  }
