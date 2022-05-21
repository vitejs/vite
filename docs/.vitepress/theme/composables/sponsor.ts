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

export function useSponsor() {
  onMounted(async () => {
    if (data.value) {
      return
    }

    const result = await fetch(dataUrl)
    // const json = await result.json()
    const json = mock

    data.value = mapSponsors(json)
  })

  return {
    data
  }
}

function mapSponsors(sponsors: Sponsors) {
  return [
    {
      tier: 'Platinum Sponsor',
      size: 'big',
      items: mapImgPath(sponsors['platinum'])
    },
    {
      tier: 'Gold Sponsors',
      size: 'medium',
      items: mapImgPath(sponsors['gold'])
    }
  ]
}

function mapImgPath(sponsors: Sponsor[]) {
  return sponsors.map((sponsor) => ({
    ...sponsor,
    img: `${dataHost}/images/${sponsor.img}`
  }))
}

const mock = {
  platinum: [
    {
      name: 'StackBlitz',
      url: 'https://stackblitz.com/',
      img: 'stackblitz.svg'
    }
  ],
  gold: [
    {
      name: 'Tailwind Labs',
      url: 'https://tailwindcss.com',
      img: 'tailwind_labs.svg'
    },
    {
      name: 'Repl.it',
      url: 'https://replit.com/',
      img: 'repl_it.svg'
    },
    {
      name: 'Vue Jobs',
      url: 'https://vuejobs.com/?ref=vuejs',
      img: 'vue_jobs.png'
    },
    {
      name: 'PLAID, Inc.',
      url: 'https://plaid.co.jp/',
      img: 'plaid__inc_.svg'
    },
    {
      name: 'divriots',
      url: 'https://divriots.com/',
      img: 'divriots.png'
    },
    {
      name: 'Cypress.io',
      url: 'https://cypress.io',
      img: 'cypress_io.svg'
    },
    {
      name: 'Prefect.io',
      url: 'https://www.prefect.io/',
      img: 'prefect_io.svg'
    }
  ]
}
