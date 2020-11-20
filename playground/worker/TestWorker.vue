<template>
  <h2>Inline Web Worker</h2>
  <p>
    <button class="worker-send" @click="send">Click to ping worker</button>
    <span class="worker-response">{{ res }}</span>
  </p>
</template>

<script>
import { ref } from 'vue'
import Worker from './worker?worker'

export default {
  setup() {
    const worker = new Worker()
    const res = ref()

    worker.addEventListener('message', (e) => {
      res.value = `Message from worker: ${e.data}`
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
