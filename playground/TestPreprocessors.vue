<template lang="pug">
h2 Pre-Processors
p.pug
  | This is rendered from &lt;template lang="pug"&gt;
  | and styled with &lt;style lang="sass"&gt;. It should be megenta.
</template>

<style lang="scss">
$color: magenta;

.pug {
  color: $color;
}
</style>
