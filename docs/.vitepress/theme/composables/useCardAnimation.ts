import { onMounted, ref, Ref } from 'vue'
import { gsap } from 'gsap'

/**
 * A custom hook for animating a card element.
 *
 * @param {HTMLElement | string} el - The element or selector for the element to be animated
 * @param {() => GSAPTimeline | null} animation - A function that returns a GSAP timeline for the animation
 */
export function useCardAnimation(
  el: HTMLElement | string,
  animation: () => GSAPTimeline | null = null,
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
        isCardActive.value = false
        setTimeout(() => {
          isAnimationRunning.value = false
        }, 3000)
      },
    })
    timeline.add(animation())
  }

  /**
   * Trigger's the card's animation automatically on mobile devices (no hover method)
   */
  onMounted(() => {
    if (window.innerWidth < 768) {
      gsap.to(window, {
        scrollTrigger: {
          trigger: el,
          start: 'top center',
          onEnter: () => {
            startAnimation()
          },
        },
      })
    }
  })

  return {
    startAnimation,
    isCardActive,
  }
}
