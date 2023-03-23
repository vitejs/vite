<template>
  <span :class="$style.module"
    >Notice any errors? Please feel free to edit
    <a :href="url" :alt="label" target="_blank">{{ label }}</a> and issue a pull
    request.
  </span>
</template>

<script>
export default {
  props: {
    label: String,
    url: String,
  },
}
</script>

<style module>
span {
  font-size: 0.8125rem;
}
</style>
