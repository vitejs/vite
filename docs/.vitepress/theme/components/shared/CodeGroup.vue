<script setup lang="ts">
import { ref, computed } from 'vue'

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

// Split the prompt ($) from the command once per tab and cache the result
const splitCommands = computed(() => {
  return props.tabs.map((tab) => {
    const match = tab.code.match(/^(\s*\$\s+)(.*)$/)
    return match
      ? { prompt: match[1], command: match[2] }
      : { prompt: '', command: tab.code }
  })
})
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
        <pre><code><span class="prompt" v-if="splitCommands[index].prompt">{{ splitCommands[index].prompt }}</span><span class="command">{{ splitCommands[index].command }}</span></code></pre>
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
