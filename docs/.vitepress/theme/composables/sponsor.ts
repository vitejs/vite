import { onMounted, onUnmounted, ref } from 'vue'

interface Sponsors {
  special: Sponsor[]
  platinum: Sponsor[]
  platinum_china: Sponsor[]
  gold: Sponsor[]
  silver: Sponsor[]
  bronze: Sponsor[]
}

interface Sponsor {
  name: string
  img: string
  url: string
  /**
   * Expects to also have an **inversed** image with `-dark` postfix.
   */
  hasDark?: true
}

// shared data across instances so we load only once.
const data = ref()

const dataHost = 'https://sponsors.vuejs.org'
const dataUrl = `${dataHost}/vite.json`

const viteSponsors: Pick<Sponsors, 'special' | 'gold'> = {
  special: [
    // sponsors patak-dev
    {
      name: 'StackBlitz',
      url: 'https://stackblitz.com',
      img: '/stackblitz.svg',
    },
    // sponsors antfu
    {
      name: 'NuxtLabs',
      url: 'https://nuxtlabs.com',
      img: '/nuxtlabs.svg',
    },
    // sponsors bluwy
    {
      name: 'Astro',
      url: 'https://astro.build',
      img: '/astro.svg',
    },
  ],
  gold: [
    // through GitHub -> OpenCollective
    {
      name: 'Remix',
      url: 'https://remix.run/',
      img: '/remix.svg',
    },
    {
      name: 'Nx',
      url: 'https://nx.dev/',
      img: '/nx.svg',
    },
    {
      name: 'Transloadit',
      url: 'https://transloadit.com/?utm_source=vite&utm_medium=referral&utm_campaign=sponsorship&utm_content=website',
      img: '/transloadit.svg',
      hasDark: true,
    },
    {
      name: 'Huly',
      url: 'https://huly.io/',
      img: '/huly.svg',
    },
  ],
}

function toggleDarkLogos() {
  if (data.value) {
    const isDark = document.documentElement.classList.contains('dark')
    data.value.forEach(({ items }) => {
      items.forEach((s: Sponsor) => {
        if (s.hasDark) {
          s.img = isDark
            ? s.img.replace(/(\.\w+)$/, '-dark$1')
            : s.img.replace(/-dark(\.\w+)$/, '$1')
        }
      })
    })
  }
}

export function useSponsor() {
  onMounted(async () => {
    const ob = new MutationObserver((list) => {
      for (const m of list) {
        if (m.attributeName === 'class') {
          toggleDarkLogos()
        }
      }
    })
    ob.observe(document.documentElement, { attributes: true })
    onUnmounted(() => {
      ob.disconnect()
    })

    if (data.value) {
      return
    }

    const result = await fetch(dataUrl)
    const json = await result.json()

    data.value = mapSponsors(json)
    toggleDarkLogos()
  })

  return {
    data,
  }
}

function mapSponsors(sponsors: Sponsors) {
  return [
    {
      tier: 'Special Sponsors',
      size: 'big',
      items: viteSponsors['special'],
    },
    {
      tier: 'Platinum Sponsors',
      size: 'big',
      items: mapImgPath(sponsors['platinum']),
    },
    {
      tier: 'Gold Sponsors',
      size: 'medium',
      items: [...mapImgPath(sponsors['gold']), ...viteSponsors['gold']],
    },
  ]
}

const viteSponsorNames = new Set(
  Object.values(viteSponsors).flatMap((sponsors) =>
    sponsors.map((s) => s.name),
  ),
)

/**
 * Map Vue/Vite sponsors data to objects and filter out Vite-specific sponsors
 */
function mapImgPath(sponsors: Sponsor[]) {
  return sponsors
    .filter((sponsor) => !viteSponsorNames.has(sponsor.name))
    .map((sponsor) => ({
      ...sponsor,
      img: `${dataHost}/images/${sponsor.img}`,
    }))
}
