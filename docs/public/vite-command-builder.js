// Vite Project Command Builder
const viteBuilderData = {
  tools: [
    {
      id: 'npm',
      label: 'npm',
      command: 'npm create vite@latest {name} -- --template {template}',
    },
    {
      id: 'yarn',
      label: 'Yarn',
      command: 'yarn create vite {name} --template {template}',
    },
    {
      id: 'pnpm',
      label: 'pnpm',
      command: 'pnpm create vite {name} --template {template}',
    },
    {
      id: 'bun',
      label: 'Bun',
      command: 'bun create vite {name} --template {template}',
    },
    {
      id: 'deno',
      label: 'Deno',
      command: 'deno init --npm vite {name} --template {template}',
    },
  ],
  templates: [
    { id: 'vanilla', label: 'Vanilla JS', ts: 'vanilla-ts' },
    { id: 'vue', label: 'Vue', ts: 'vue-ts' },
    { id: 'react', label: 'React', ts: 'react-ts' },
    { id: 'react-swc', label: 'React (SWC)', ts: 'react-swc-ts' },
    { id: 'preact', label: 'Preact', ts: 'preact-ts' },
    { id: 'lit', label: 'Lit', ts: 'lit-ts' },
    { id: 'svelte', label: 'Svelte', ts: 'svelte-ts' },
    { id: 'solid', label: 'Solid', ts: 'solid-ts' },
    { id: 'qwik', label: 'Qwik', ts: 'qwik-ts' },
  ],
}

function initViteCommandBuilder() {
  function buildField(label, input) {
    return (
      '<label style="display:block;margin-bottom:8px;">' +
      label +
      ' ' +
      input +
      '</label>'
    )
  }

  const fields = []
  fields.push(
    buildField(
      'Build Tool:',
      '<select id="vite-builder-tool">' +
        viteBuilderData.tools
          .map((t) => '<option value="' + t.id + '">' + t.label + '</option>')
          .join('') +
        '</select>',
    ),
  )
  fields.push(
    buildField(
      'Project Name:',
      '<input id="vite-builder-name" type="text" value="my-app" style="width:120px;">',
    ),
  )
  fields.push(
    buildField(
      'Template:',
      '<select id="vite-builder-template">' +
        viteBuilderData.templates
          .map((t) => '<option value="' + t.id + '">' + t.label + '</option>')
          .join('') +
        '</select>',
    ),
  )
  fields.push(
    buildField(
      '',
      '<input id="vite-builder-ts" type="checkbox"> Use TypeScript',
    ),
  )
  document.getElementById('vite-builder-fields').innerHTML = fields.join('')

  function getTemplate() {
    const t = viteBuilderData.templates.find((x) => x.id === template.value)
    return ts.checked && t.ts ? t.ts : t.id
  }

  function getCommand() {
    const toolObj = viteBuilderData.tools.find((x) => x.id === tool.value)
    if (!toolObj) return ''
    return toolObj.command
      .replace('{name}', name.value || 'my-app')
      .replace('{template}', getTemplate())
  }

  const tool = document.getElementById('vite-builder-tool')
  const name = document.getElementById('vite-builder-name')
  const template = document.getElementById('vite-builder-template')
  const ts = document.getElementById('vite-builder-ts')
  const output = document.getElementById('vite-builder-output')
  const copy = document.getElementById('vite-builder-copy')

  function update() {
    output.textContent = getCommand()
  }
  tool.onchange = name.oninput = template.onchange = ts.onchange = update
  update()

  copy.onclick = () => {
    navigator.clipboard.writeText(output.textContent)
    copy.textContent = 'Copied!'
    setTimeout(() => (copy.textContent = 'Copy Command'), 1200)
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViteCommandBuilder)
} else {
  initViteCommandBuilder()
}
