import { type Ref, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * A custom hook for animating a card element.
 *
 * @param {HTMLElement | string} el - The element or selector for the element to be animated
 * @param {() => GSAPTimeline | null} animation - A function that returns a GSAP timeline for the animation
 * @param {object} options - Options for the animation
 */
export function useCardAnimation(
  el: HTMLElement | string,
  animation: (() => GSAPTimeline) | undefined = undefined,
  options?: {
    /**
     * A flag to indicate whether the animation should only run once, and not reset once complete.
     */
    once?: boolean
  },
) {
  /**
   * The GSAP timeline for this animation.
   */
  let timeline: GSAPTimeline | null

  /**
   * A flag to indicate whether the card is currently active or not.
   * May be inactive while the animation is still finishing up, due to CSS transitions.
   */
  const isCardActive: Ref<boolean> = ref(false)

  /**
   * An internal flag to prevent multiple animations from running at the same time.
   */
  const isAnimationRunning: Ref<boolean> = ref(false)

  /**
   * Starts the card's animation, managing the lifecycle internally to prevent multiple animations from running at the same time.
   */
  const startAnimation = () => {
    if (isAnimationRunning.value) {
      return
    } else {
      isAnimationRunning.value = true
      isCardActive.value = true
    }
    if (timeline) {
      timeline.kill()
    }
    if (!animation) {
      return
    }
    timeline = gsap.timeline({
      onComplete: () => {
        if (!options?.once) {
          isCardActive.value = false
          setTimeout(() => {
            isAnimationRunning.value = false
          }, 3000)
        }
      },
    })
    timeline.add(animation())
  }

  /**
   * The ScrollTrigger instance for this card.
   */
  let scrollTriggerInstance: ScrollTrigger | null = null

  /**
   * Trigger's the card's animation automatically on mobile devices (no hover method)
   */
  onMounted(() => {
    if (window.innerWidth < 768) {
      scrollTriggerInstance = ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        onEnter: () => {
          startAnimation()
        },
      })
    }
  })

  /**
   * Remove the ScrollTrigger and GSAP timeline instances when the component is unmounted
   */
  onUnmounted(() => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill()
      scrollTriggerInstance = null
    }
    if (timeline) {
      timeline.kill()
      timeline = null
    }
  })

  return {
    startAnimation,
    isCardActive,
  }
}
