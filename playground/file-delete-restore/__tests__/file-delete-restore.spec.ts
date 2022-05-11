import {
  addFile,
  editFile,
  isBuild,
  page,
  removeFile,
  untilUpdated
} from '~utils'

test.runIf(isBuild)(
  'should hmr when file is deleted and restored',
  async () => {
    await untilUpdated(() => page.textContent('p'), 'Child state 1')

    editFile('Child.jsx', (code) =>
      code.replace('Child state 1', 'Child state 2')
    )

    await untilUpdated(() => page.textContent('p'), 'Child state 2')

    editFile('App.jsx', (code) =>
      code
        .replace(`import Child from './Child'`, '')
        .replace(`<Child />`, '<p>Child deleted</p>')
    )
    removeFile('Child.jsx')
    await untilUpdated(() => page.textContent('p'), 'Child deleted')

    // restore Child.jsx
    addFile(
      'Child.jsx',
      ` export default function Child() {
          return <p>Child state 1</p>
        }
      `
    )

    // restore App.jsx
    editFile(
      'App.jsx',
      (code) =>
        `import { useState } from 'react'
      import Child from './Child'

      function App() {
        return (
          <div className="App">
            <Child />
          </div>
        )
      }

      export default App
      `
    )

    await untilUpdated(() => page.textContent('p'), 'Child state 1')
  }
)
