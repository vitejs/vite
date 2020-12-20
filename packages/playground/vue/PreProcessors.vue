<template lang="pug">
h2.pre-processors Pre-Processors
p.pug
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

<style lang="less" scoped>
@color: green;

.pug-less {
  color: @color;
}
</style>
