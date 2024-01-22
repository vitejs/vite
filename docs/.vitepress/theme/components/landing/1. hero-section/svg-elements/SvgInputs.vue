<script setup lang="ts">
import SvgNode, { SvgNodeProps } from '../../common/SvgNode.vue'
import { Ref } from 'vue'

defineProps({
  inputLines: {
    type: Array as () => Ref<SvgNodeProps>[],
    required: true,
  },
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="844"
    height="644"
    viewBox="0 0 844 644"
    fill="none"
    class="input-lines"
  >
    <!-- Input Lines -->
    <g v-for="inputLine in inputLines" :key="inputLine.value.path">
      <path
        :d="inputLine.value.path"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
        style="opacity: 0.8"
      />
      <SvgNode v-bind="inputLine.value" />
    </g>

    <defs>
      <linearGradient
        id="base_gradient"
        x1="88.1032"
        y1="324.167"
        x2="843.505"
        y2="324.167"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="#c6caff" stop-opacity="0" />
        <stop offset="0.2" stop-color="#c6caff" stop-opacity="0.1" />
        <stop offset="0.4" stop-color="white" stop-opacity="0.4" />
        <stop offset="0.6" stop-color="#c6caff" stop-opacity="0.2" />
        <stop offset="0.8" stop-color="#c6caff" stop-opacity="0.2" />
        <stop offset="0.9" stop-color="#c6caff" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>

<style scoped>
.input-lines {
  transform: translate3d(0, 0, 0);

  &:deep(.circle-dot) {
    display: none;

    @media (min-width: 768px) {
      display: block;
    }
  }
}
</style>
