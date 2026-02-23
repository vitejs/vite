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

function testDepError() {
  throwDepError()
}

function testConsoleError() {
  console.error(
    'format: string=%s number=%d int=%i float=%f json=%j object=%o object2=%O style=%c literal=%% trailing',
    'hello',
    12.9,
    '42px',
    '3.5',
    { id: 1 },
    { enabled: true },
    { nested: { deep: 1 } },
    'color:red',
    'done',
  )
}
