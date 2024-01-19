import { nextTick, onMounted } from 'vue'
import { gsap } from 'gsap'

export function useSlideIn(el: HTMLElement | string) {
  onMounted(async () => {
    await nextTick(() => {
      gsap.to(el, {
        x: 0,
        scrollTrigger: {
          trigger: el,
          start: 'top 100%',
          end: 'top 70%',
          scrub: 1,
        },
      })
    })
  })
}
