<template>
  <div class="vite-command-builder">
    <div class="builder-header">
      <h3>🚀 Build Your Vite Project</h3>
      <p>Configure your project and get the scaffolding command:</p>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label class="form-label">Project Location:</label>
        <div class="location-group">
          <input
            v-model="projectName"
            type="text"
            placeholder="my-vite-project"
            class="form-input"
            :class="{ 'current-folder': useCurrentFolder }"
            :disabled="useCurrentFolder"
          />
          <button
            @click="useCurrentFolder = !useCurrentFolder"
            :class="['current-folder-button', { active: useCurrentFolder }]"
          >
            Current folder
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Framework Template:</label>
        <div class="template-grid">
          <button
            v-for="template in data.templates"
            :key="template.id"
            @click="selectedTemplate = template.id"
            :class="[
              'template-button',
              { active: selectedTemplate === template.id },
            ]"
          >
            <span class="template-name">{{ template.name }}</span>
            <span v-if="template.description" class="template-description">{{
              template.description
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="command-output">
      <div class="command-header">
        <h4>Generated Command:</h4>
        <button
          @click="copyCommand"
          class="copy-button"
          :class="{ copied: copied }"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>

      <div class="command-display">
        <div class="command-tabs">
          <button
            v-for="tool in data.tools"
            :key="tool.id"
            @click="selectedTool = tool.id"
            :class="['command-tab', { active: selectedTool === tool.id }]"
          >
            {{ tool.name }}
          </button>
        </div>
        <div class="command-code">
          <div v-if="selectedTool === 'npm'" class="command-comment">
            # npm 7+, extra double-dash is needed:
          </div>
          <pre><code>$ {{ generatedCommand }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

// Data structure for tools and templates
const data = reactive({
  tools: [
    {
      id: 'npm',
      name: 'npm',
      version: null,
      filename: 'package.json',
      buildCommand: (projectName, template, useCurrentFolder) => {
        const target = useCurrentFolder ? '.' : projectName || ''
        const templateFlag = template ? ` -- --template ${template}` : ''
        return `npm create vite@latest${target ? ` ${target}` : ''}${templateFlag}`
      },
    },
    {
      id: 'yarn',
      name: 'Yarn',
      version: null,
      filename: 'yarn.lock',
      buildCommand: (projectName, template, useCurrentFolder) => {
        const target = useCurrentFolder ? '.' : projectName || ''
        const templateFlag = template ? ` --template ${template}` : ''
        return `yarn create vite${target ? ` ${target}` : ''}${templateFlag}`
      },
    },
    {
      id: 'pnpm',
      name: 'pnpm',
      version: null,
      filename: 'pnpm-lock.yaml',
      buildCommand: (projectName, template, useCurrentFolder) => {
        const target = useCurrentFolder ? '.' : projectName || ''
        const templateFlag = template ? ` --template ${template}` : ''
        return `pnpm create vite${target ? ` ${target}` : ''}${templateFlag}`
      },
    },
    {
      id: 'bun',
      name: 'Bun',
      version: null,
      filename: 'bun.lockb',
      buildCommand: (projectName, template, useCurrentFolder) => {
        const target = useCurrentFolder ? '.' : projectName || ''
        const templateFlag = template ? ` --template ${template}` : ''
        return `bun create vite${target ? ` ${target}` : ''}${templateFlag}`
      },
    },
    {
      id: 'deno',
      name: 'Deno',
      version: null,
      filename: 'deno.json',
      buildCommand: (projectName, template, useCurrentFolder) => {
        const target = useCurrentFolder ? '.' : projectName || ''
        const templateFlag = template ? ` --template ${template}` : ''
        return `deno init --npm vite${target ? ` ${target}` : ''}${templateFlag}`
      },
    },
  ],
  templates: [
    {
      id: '',
      name: 'Default (Select framework interactively)',
      description: '',
    },
    { id: 'vanilla', name: 'Vanilla JS', description: 'Vanilla JavaScript' },
    { id: 'vanilla-ts', name: 'Vanilla TS', description: 'Vanilla TypeScript' },
    { id: 'vue', name: 'Vue', description: 'Vue.js framework' },
    { id: 'vue-ts', name: 'Vue TS', description: 'Vue.js with TypeScript' },
    { id: 'react', name: 'React', description: 'React framework' },
    { id: 'react-ts', name: 'React TS', description: 'React with TypeScript' },
    { id: 'react-swc', name: 'React SWC', description: 'React with SWC' },
    {
      id: 'react-swc-ts',
      name: 'React SWC TS',
      description: 'React with SWC and TypeScript',
    },
    { id: 'preact', name: 'Preact', description: 'Preact framework' },
    {
      id: 'preact-ts',
      name: 'Preact TS',
      description: 'Preact with TypeScript',
    },
    { id: 'lit', name: 'Lit', description: 'Lit web components' },
    { id: 'lit-ts', name: 'Lit TS', description: 'Lit with TypeScript' },
    { id: 'svelte', name: 'Svelte', description: 'Svelte framework' },
    {
      id: 'svelte-ts',
      name: 'Svelte TS',
      description: 'Svelte with TypeScript',
    },
    { id: 'solid', name: 'Solid', description: 'SolidJS framework' },
    {
      id: 'solid-ts',
      name: 'Solid TS',
      description: 'SolidJS with TypeScript',
    },
    { id: 'qwik', name: 'Qwik', description: 'Qwik framework' },
    { id: 'qwik-ts', name: 'Qwik TS', description: 'Qwik with TypeScript' },
  ],
})

// Reactive state
const selectedTool = ref('npm')
const projectName = ref('')
const selectedTemplate = ref('')
const useCurrentFolder = ref(false)
const copied = ref(false)

// Methods
const getCommandForTool = (toolId) => {
  const tool = data.tools.find((t) => t.id === toolId)
  if (!tool || !tool.buildCommand) return ''

  return tool.buildCommand(
    projectName.value || 'my-vite-project',
    selectedTemplate.value,
    useCurrentFolder.value,
  )
}

// Computed properties
const selectedToolData = computed(() =>
  data.tools.find((tool) => tool.id === selectedTool.value),
)

const generatedCommand = computed(() => {
  return getCommandForTool(selectedTool.value)
})

const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(generatedCommand.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch (err) {
    console.error('Failed to copy command:', err)
    // Fallback for browsers without clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = generatedCommand.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1200)
  }
}
</script>

<style scoped>
.vite-command-builder {
  border: 1px solid var(--vp-c-border);
  padding: 24px;
  border-radius: 8px;
  margin: 24px 0;
  background-color: var(--vp-c-bg-soft);
}

.builder-header h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.builder-header p {
  margin-bottom: 24px;
  color: var(--vp-c-text-2);
}

.form-section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: var(--vp-c-text-1);
  font-weight: 500;
  font-size: 14px;
}

.form-select,
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.form-input.current-folder {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: not-allowed;
}

/* Button Groups */
.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-button {
  padding: 8px 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-button:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.tool-button.active {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

/* Location Group */
.location-group {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.location-group .form-input {
  flex: 1;
}

.current-folder-button {
  padding: 8px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.current-folder-button:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.current-folder-button.active {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

/* Template Grid */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 6px;
}

.template-button {
  padding: 8px 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-button:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.template-button.active {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-soft);
}

.template-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
}

.template-description {
  font-size: 11px;
  color: var(--vp-c-text-2);
  line-height: 1.2;
}

.command-output {
  margin-top: 24px;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.command-header h4 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.copy-button {
  padding: 6px 12px;
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: var(--vp-c-brand-2);
}

.copy-button.copied {
  background-color: var(--vp-c-green-1);
}

/* Command Display */
.command-display {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg);
}

.command-tabs {
  display: flex;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  overflow-x: auto;
}

.command-tab {
  padding: 12px 16px;
  border: none;
  background-color: transparent;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.command-tab:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg-mute);
}

.command-tab.active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg);
}

.command-code {
  padding: 16px 20px;
  background-color: var(--vp-code-block-bg);
}

.command-comment {
  font-family: var(--vp-font-family-mono);
  font-size: var(--vp-code-font-size);
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
  font-style: italic;
}

.command-code pre {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: var(--vp-code-font-size);
  line-height: var(--vp-code-line-height);
}

.command-code code {
  color: var(--shiki-light, #6f42c1);
  background-color: transparent;
  border-radius: 0;
  padding: 0;
}

@media (prefers-color-scheme: dark) {
  .command-code code {
    color: var(--shiki-dark, #b392f0);
  }
}

.vp-adaptive-theme .command-code code {
  color: var(--shiki-light, #6f42c1);
}

.dark .command-code code,
.vp-adaptive-theme.dark .command-code code {
  color: var(--shiki-dark, #b392f0);
}

/* Responsive design */
@media (max-width: 768px) {
  .vite-command-builder {
    padding: 16px;
    margin: 16px 0;
  }

  .command-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .copy-button {
    align-self: stretch;
  }

  .button-group {
    flex-direction: column;
  }

  .tool-button {
    text-align: center;
  }

  .location-group {
    flex-direction: column;
  }

  .current-folder-button {
    text-align: center;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }

  .command-tabs {
    flex-direction: row;
    overflow-x: auto;
  }

  .command-tab {
    min-width: 80px;
    text-align: center;
  }
}
</style>
