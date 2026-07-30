import { onMounted, ref } from 'vue'
import type { Sponsor, SponsorTier } from '@voidzero-dev/vitepress-theme'

interface Sponsors {
  main: Sponsor[]
  partnership: Sponsor[]
  platinum: Sponsor[]
  gold: Sponsor[]
}

// shared data across instances so we load only once.
const data = ref<SponsorTier[]>()

export function useSponsor() {
  onMounted(async () => {
    if (data.value) return

    const result = await fetch('https://sponsors.vite.dev/sponsors.json')
    const sponsors: Sponsors = await result.json()

    data.value = [
      {
        tier: 'Brought to you by',
        size: 'big',
        items: sponsors.main,
      },
      {
        tier: 'In partnership with',
        size: 'big',
        items: sponsors.partnership,
      },
      {
        tier: 'Platinum Sponsors',
        size: 'big',
        items: sponsors.platinum,
      },
      {
        tier: 'Gold Sponsors',
        size: 'medium',
        items: sponsors.gold,
      },
    ]
  })

  return data
}
