<template lang="pug">
h2 Pre-Processors
p(id).pug
  | This is rendered from &lt;template lang="pug"&gt;
  | and styled with &lt;style lang="sass"&gt;. It should be megenta.
p.pug-less
  | This is rendered from &lt;template lang="pug"&gt;
  | and styled with &lt;style lang="less"&gt;. It should be green.
</template>

<style lang="scss">
$color: magenta;

.pug {
  color: $color;
}
</style>

<style lang="less">
.pug-less {
  color: @preprocess-custom-color;
}
</style>
