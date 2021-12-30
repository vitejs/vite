import { isBuild } from '../../testUtils'

interface testErrorOverlayOptions {
  message: string | RegExp
  file: string | RegExp | null
  frame: (string | RegExp)[] | null
  stack: (string | RegExp)[]
}

const testErrorOverlay = async (
  btnSelector: string,
  { message, file, frame, stack }: testErrorOverlayOptions
) => {
  await (await page.$(btnSelector)).click()

  const overlay = await page.waitForSelector('vite-error-overlay')
  expect(overlay).toBeTruthy()

  const overlayMessage = await (await overlay.$('.message-body'))?.innerHTML()
  expect(overlayMessage).toMatch(message)

  const overlayFile =
    (await (await overlay.$('.file > .file-link'))?.innerText()) || null

  if (file == null) {
    expect(overlayFile).toBeNull()
  } else {
    expect(overlayFile).toMatch(file)
  }

  const overlayFrame = (await (await overlay.$('.frame')).innerText()) || null

  if (frame == null) {
    expect(overlayFrame).toBeNull()
  } else {
    frame.forEach((f) => {
      expect(overlayFrame).toMatch(f)
    })
  }

  const overlayStack = await (await overlay.$('.stack')).innerText()
  stack.forEach((s) => {
    expect(overlayStack).toMatch(s)
  })
}

if (!isBuild) {
  beforeEach(async () => {
    // reset the page before each run
    // viteTestUrl is globally injected in scripts/jestPerTestSetup.ts
    await page.goto(viteTestUrl)
  })

  describe('unhandled exceptions', () => {
    test('should catch unhandled errors', async () => {
      await testErrorOverlay('#throwBtn', {
        message: 'Why did you click the button',
        file: '/runtime-error/src/entry-client.ts:4:8',
        frame: [
          'querySelector<HTMLButtonElement>',
          "new Error('Why did you click the button')"
        ],
        stack: [
          'Error: Why did you click the button',
          '/runtime-error/src/entry-client.ts:4:8'
        ]
      })
    })

    test('should catch runtime errors', async () => {
      await testErrorOverlay('#invalidAccessor', {
        message: 'Cannot set properties of undefined',
        file: '/runtime-error/src/entry-client.ts:9:16',
        frame: [
          'querySelector<HTMLButtonElement>',
          '//@ts-expect-error',
          'window.doesnt.exists = 5'
        ],
        stack: [
          'TypeError: Cannot set properties of undefined',
          'HTMLButtonElement.document.querySelector.onclick',
          '/runtime-error/src/entry-client.ts:9:16'
        ]
      })
    })

    test('should handle string errors', async () => {
      await testErrorOverlay('#throwStr', {
        message: 'String Error',
        file: '/runtime-error/src/entry-client.ts:17:2',
        frame: ['querySelector<HTMLButtonElement>', "throw 'String Error'"],
        stack: [
          "a non-error was thrown please check your browser's devtools for more information"
        ]
      })
    })

    test('should handle number errors', async () => {
      await testErrorOverlay('#throwNum', {
        message: '42',
        file: '/runtime-error/src/entry-client.ts:21:2',
        frame: ['querySelector<HTMLButtonElement>', 'throw 42'],
        stack: [
          "a non-error was thrown please check your browser's devtools for more information"
        ]
      })
    })
    test('should show stack trace from multiple files', async () => {
      await testErrorOverlay('#throwExternal', {
        message: 'Throw from externalThrow',
        file: '/src/external.js:2:9',
        frame: [
          'export const externalThrow',
          "throw new Error('Throw from externalThrow')"
        ],
        stack: [
          'Error: Throw from externalThrow',
          '/src/external.js',
          '2:9',
          'HTMLButtonElement.document.querySelector.onclick',
          '/runtime-error/src/entry-client.ts:25:2'
        ]
      })
    })
  })

  describe('unhandled rejections', () => {
    test('should catch unhandled promises', async () => {
      await testErrorOverlay('#reject', {
        message: 'async failure',
        file: '/runtime-error/src/entry-client.ts:13:17',
        frame: ['const asyncFunc = async () => {', 'async failure'],
        stack: [
          'asyncFunc',
          'runtime-error/src/entry-client.ts:13:17',
          'HTMLButtonElement.document.querySelector.onclick',
          'runtime-error/src/entry-client.ts:29:8'
        ]
      })
    })

    test('should handle uncaught string reason', async () => {
      await testErrorOverlay('#rejectExternal', {
        message: 'Reject from externalAsync',
        file: null,
        frame: null,
        stack: [
          "a non-error was thrown please check your browser's devtools for more information"
        ]
      })
    })

    test('should handle rejected module', async () => {
      await testErrorOverlay('#rejectExternalModule', {
        message: 'Thrown From Module',
        file: '/runtime-error/src/module-thrown.ts:1:6',
        frame: ["throw new Error('Thrown From Module')"],
        stack: [
          'Error: Thrown From Module',
          '/runtime-error/src/module-thrown.ts:1:6'
        ]
      })
    })
  })
}
