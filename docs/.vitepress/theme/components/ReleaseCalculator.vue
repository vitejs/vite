<script setup lang="ts">
import { ref, computed } from 'vue'

declare const __VITE_VERSION__: string

const previousMajorLatestMinors: Record<string, string> = {
  '2': '2.9',
  '3': '3.2',
  '4': '4.5',
  '5': '5.4',
  '6': '6.4',
}

const viteVersion = ref(__VITE_VERSION__)

const parsedVersion = computed(() => {
  if (!isValidViteVersion(viteVersion.value)) return null

  let [major, minor, patch] = viteVersion.value.split('.').map((v) => {
    const num = /^\d+$/.exec(v)?.[0]
    return num ? parseInt(num) : null
  })
  if (!major) return null
  minor ??= 0
  patch ??= 0

  return { major, minor, patch }
})

const supportInfo = computed(() => {
  if (!parsedVersion.value) return null

  const { major, minor } = parsedVersion.value
  const f = (versions: string[]) => {
    return versions
      .map((v) => previousMajorLatestMinors[v] ?? v)
      .filter((version) => {
        if (!isValidViteVersion(version)) return false
        // Negative versions are invalid
        if (/-\d/.test(version)) return false
        return true
      })
  }

  return {
    regularPatches: f([`${major}.${minor}`]),
    importantFixes: f([`${major - 1}`, `${major}.${minor - 1}`]),
    securityPatches: f([`${major - 2}`, `${major}.${minor - 2}`]),
    unsupported: f([`${major - 3}`, `${major}.${minor - 3}`]),
  }
})

function versionsToText(versions: string[]) {
  versions = versions.map((v) => (/^\d/.test(v) ? `<code>vite@${v}</code>` : v))
  if (versions.length === 0) return ''
  if (versions.length === 1) return versions[0]
  return (
    versions.slice(0, -1).join(', ') + ' and ' + versions[versions.length - 1]
  )
}

function isValidViteVersion(version: string) {
  if (version.length === 1) version += '.'
  // Vite 0.x shouldn't be mentioned, and Vite 1.x was never released
  if (version.startsWith('0.') || version.startsWith('1.')) return false
  return true
}

function invalidReason(version: string) {
  let str = `"${version}" is not a valid version.`
  if (!isValidViteVersion(version)) {
    str += ' Vite version should be 2.x or higher.'
  }
  return str
}
</script>

<template>
  <div>
    <p class="version-text">
      <label for="version-input">If the latest Vite version is</label>
      <input
        id="version-input"
        type="text"
        v-model="viteVersion"
        :placeholder="viteVersion"
      />
    </p>

    <ul v-if="supportInfo" class="support-info">
      <li v-if="supportInfo.regularPatches.length">
        Regular patches are released for
        <span v-html="versionsToText(supportInfo.regularPatches)"></span>.
      </li>
      <li v-if="supportInfo.importantFixes.length">
        Important fixes and security patches are backported to
        <span v-html="versionsToText(supportInfo.importantFixes)"></span>.
      </li>
      <li v-if="supportInfo.securityPatches.length">
        Security patches are also backported to
        <span v-html="versionsToText(supportInfo.securityPatches)"></span>.
      </li>
      <li v-if="supportInfo.unsupported.length">
        No longer supported versions include
        <span
          v-html="versionsToText(supportInfo.unsupported.concat('below'))"
        ></span
        >. Users should upgrade to receive updates.
      </li>
    </ul>
    <p v-else class="invalid">{{ invalidReason(viteVersion) }}</p>
  </div>
</template>

<style scoped>
.version-text {
  margin-bottom: -16px;
}

#version-input {
  padding: 2px 8px;
  margin: 2px 0 2px 6px;
  font-size: inherit;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  transition: border-color 0.1s;
}

#version-input:focus,
#version-input:hover {
  border-color: var(--vp-c-brand);
}

.invalid {
  color: var(--vp-c-danger-1);
}

.support-info {
  margin-top: 4px;
  margin-bottom: 8px;
}
</style>
