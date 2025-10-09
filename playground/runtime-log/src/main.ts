export type SomePadding = {
  here: boolean
}

document.getElementById('test-error').addEventListener('click', () => {
  testError()
})

document
  .getElementById('test-unhandledrejection')
  .addEventListener('click', () => {
    testUnhandledRejection()
  })

export type AnotherPadding = {
  there: boolean
}

function testError() {
  throw new Error('testError')
}

async function testUnhandledRejection() {
  throw new Error('testUnhandledRejection')
}
