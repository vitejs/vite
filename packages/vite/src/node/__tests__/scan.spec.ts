describe('optimizer-scan:script-test', () => {
  const scriptRE = /(<script\b(\s[^>]*>|>))(.*?)<\/script>/gims

  const scriptContent = `import { defineComponent } from 'vue'
      import ScriptDevelopPane from './ScriptDevelopPane.vue';
      export default defineComponent({
        components: {
          ScriptDevelopPane
        }
      })`

  test('component return value test', () => {
    scriptRE.lastIndex = 0
    const [, tsOpenTag, , tsContent] = scriptRE.exec(
      `<script lang="ts">${scriptContent}</script>`
    )
    expect(tsOpenTag).toEqual('<script lang="ts">')
    expect(tsContent).toEqual(scriptContent)

    scriptRE.lastIndex = 0
    const [, openTag, , content] = scriptRE.exec(
      `<script>${scriptContent}</script>`
    )
    expect(openTag).toEqual('<script>')
    expect(content).toEqual(scriptContent)
  })

  test('components with script keyword test', () => {
    scriptRE.lastIndex = 0
    let ret = scriptRE.exec(`<template><script-develop-pane/></template>`)
    expect(ret).toBe(null)

    scriptRE.lastIndex = 0
    ret = scriptRE.exec(
      `<template><script-develop-pane></script-develop-pane></template>`
    )
    expect(ret).toBe(null)

    scriptRE.lastIndex = 0
    ret = scriptRE.exec(
      `<template><script-develop-pane  > content </script-develop-pane></template>`
    )
    expect(ret).toBe(null)
  })

  test('ordinary script tag test', () => {
    scriptRE.lastIndex = 0
    const [, tag, , content] = scriptRE.exec(
      `<script  >var test = null</script>`
    )
    expect(tag).toEqual('<script  >')
    expect(content).toEqual('var test = null')

    scriptRE.lastIndex = 0
    const [, tag1, , content1] = scriptRE.exec(
      `<script>var test = null</script>`
    )
    expect(tag1).toEqual('<script>')
    expect(content1).toEqual('var test = null')
  })

  test('html script tag test', () => {
    scriptRE.lastIndex = 0
    const [, tag, , content] = scriptRE.exec(
      `<body>
          <script type="module" src="/src/main.ts"></script>
      </body>`
    )
    expect(tag).toEqual('<script type="module" src="/src/main.ts">')
    expect(content).toEqual('')
  })
})
