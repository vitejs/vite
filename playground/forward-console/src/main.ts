import { throwDepError } from '@vitejs/test-forward-console-throw-dep'

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

document.getElementById('test-console-error').addEventListener('click', () => {
  testConsoleError()
})

document.getElementById('test-dep-error').addEventListener('click', () => {
  testDepError()
})

export type AnotherPadding = {
  there: boolean
}

function testError() {
  throw new Error('this is test error')
}

function testUnhandledRejection() {
  Promise.reject(new Error('this is test unhandledrejection'))
}

function testConsoleError() {
  console.error('this is test console error')
}

function testDepError() {
  throwDepError()
}
