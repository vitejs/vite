import { watchEffect } from 'vue'
import { useCounter } from './counter'

const { count, increment, decrement } = useCounter()

watchEffect(() => {
  document.querySelector('#app')!.textContent = `${count.value}`
})

const timer = setInterval(() => {
  if (count.value < 6) {
    increment()
  } else {
    decrement()
    clearInterval(timer)
  }
}, 1000)
