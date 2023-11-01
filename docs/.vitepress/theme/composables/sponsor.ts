import { ref, onMounted } from 'vue'

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
  ],
}

export function useSponsor() {
  onMounted(async () => {
    if (data.value) {
      return
    }

    const result = await fetch(dataUrl)
    const json = await result.json()

    data.value = mapSponsors(json)
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
      items: viteSponsors['gold'].concat(mapImgPath(sponsors['gold'])),
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
