<script setup lang="ts">
defineProps<{
  href: string
  title: string
}>()
</script>

<template>
  <div class="scrimba">
    <span class="play-button">
      <span class="play-icon"></span>
    </span>
    <a :href="href" target="_blank" rel="sponsored noopener" :title="title">
      <slot>Watch an interactive lesson on Scrimba</slot>
    </a>
  </div>
</template>

<style scoped>
.scrimba {
  margin: 28px 0;
  background-color: var(--vp-c-bg-soft);
  padding: 1em 1.25em;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 50%;
  background-color: var(--vp-c-brand-1);
}
.play-icon {
  width: 0;
  height: 0;
  margin-left: 2px;
  border-style: solid;
  border-width: 5px 0 5px 8px;
  border-color: transparent transparent transparent #fff;
}
.scrimba a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
.scrimba a:hover {
  color: var(--vp-c-brand-2);
}
</style>
