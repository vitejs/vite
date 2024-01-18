<script setup>
import SvgNode from './SvgNode.vue'

defineProps({
  outputLines: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="844"
    height="80"
    viewBox="0 0 844 40"
    fill="none"
    class="output-line"
  >
    <path
      d="M843.463 1.3315L245.316 5.47507L0.633077 4.69725"
      stroke="url(#output_gradient)"
      stroke-width="1.2"
    />
    <g v-for="outputLine in outputLines">
      <SvgNode
        path="M843.463 1.3315L245.316 5.47507L0.633077 4.69725"
        :position="outputLine.position.value"
        :visible="outputLine.visible.value"
        :label-visible="outputLine.labelVisible.value"
        :label="outputLine.label.value"
        dot-color="#ce9bf4"
        glow-color="#BD34FE"
      />
    </g>
    <defs>
      <linearGradient id="output_gradient" gradientUnits="userSpaceOnUse">
        <stop offset="0.1" stop-color="white" stop-opacity="0" />
        <stop offset="0.4" stop-color="white" stop-opacity="0.33" />
        <stop offset="1" stop-color="white" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>

<style scoped>
.output-line {
  position: absolute;
  top: 300px;
  left: 785px;
}
</style>
