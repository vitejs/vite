<script setup lang="ts">
import { ref } from 'vue'

interface CodeTab {
  label: string
  code: string
  language?: string
}

const props = defineProps<{
  tabs: CodeTab[]
}>()

const activeTab = ref(0)
const groupId = Math.random().toString(36).substring(7)

// Function to split the prompt ($) from the command
const splitCommand = (code: string) => {
  const match = code.match(/^(\s*\$\s+)(.*)$/)
  if (match) {
    return { prompt: match[1], command: match[2] }
  }
  return { prompt: '', command: code }
}
</script>

<template>
  <div class="vp-doc">
    <div class="vp-code-group">
      <div class="tabs">
        <template v-for="(tab, index) in tabs" :key="index">
          <input
            :id="`tab-${groupId}-${index}`"
            type="radio"
            :name="`code-group-tabs-${groupId}`"
            :checked="index === activeTab"
            @change="activeTab = index"
          />
          <label :for="`tab-${groupId}-${index}`">{{ tab.label }}</label>
        </template>
      </div>
      <div
        v-for="(tab, index) in tabs"
        :key="`content-${index}`"
        :class="[
          'language-' + (tab.language || 'bash'),
          { active: index === activeTab },
        ]"
      >
        <button class="copy"></button>
        <span class="lang">{{ tab.language || 'bash' }}</span>
        <pre><code><span class="prompt" v-if="splitCommand(tab.code).prompt">{{ splitCommand(tab.code).prompt }}</span><span class="command">{{ splitCommand(tab.code).command }}</span></code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Inherits styles from vp-code-group.css and vp-doc.css */
code {
  outline: none !important;
  color: var(--vp-c-brand-1) !important;
}

.prompt {
  user-select: none;
}

.command {
  user-select: text;
}
</style>
