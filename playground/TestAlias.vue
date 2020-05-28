<template>
  <h2>Alias</h2>
  <p class="alias">{{ msg }}</p>
  <p class="dir-alias">{{ dirMsg }}</p>
  <p class="dir-alias-index">{{ dirIndexMsg }}</p>
</template>

<script>
import { msg } from 'alias'
import { msg as dirMsg } from '/@alias/named'
import { msg as dirIndexMsg } from '/@alias/'

export default {
  data: () => ({
    msg,
    dirMsg,
    dirIndexMsg
  })
}
</script>
