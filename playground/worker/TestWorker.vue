<template>
  <h2>Inline Web Worker</h2>
  <p><button class="worker-send" @click="send">Click to ping worker</button></p>
  <p class="worker-response">Message from worker: {{ res }}</p>
</template>

<script>
import { ref } from 'vue'
import Worker from './worker?worker'

export default {
  setup() {
    const worker = new Worker()
    const res = ref()

    worker.addEventListener('message', e => {
      res.value = e.data
    })

    return {
      res,
      send() {
        worker.postMessage('ping')
      }
    }
  }
}
</script>
