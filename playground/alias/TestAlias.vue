<template>
  <h2>Alias</h2>
  <p class="alias">{{ msg }}</p>
  <p class="dir-alias">{{ dirMsg }}</p>
  <p class="dir-alias-index">{{ dirIndexMsg }}</p>
  <p class="dir-alias-import-outside">{{ importOutsideMsg }}</p>
</template>

<script>
import { msg } from 'alias'
import { msg as dirMsg } from '/@alias/named'
import { msg as dirIndexMsg } from '/@alias/'
import { msg as importOutsideMsg } from '/@alias/importOutside'

export default {
  data: () => ({
    msg,
    dirMsg,
    dirIndexMsg,
    importOutsideMsg
  })
}
</script>
