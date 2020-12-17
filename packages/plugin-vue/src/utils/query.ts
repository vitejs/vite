import qs from 'querystring'

export interface VueQuery {
  vue?: boolean
  type?: 'script' | 'template' | 'style' | 'custom'
  src?: string
  index?: number
  lang?: string
}

export function parseVueRequest(id: string) {
  const [filename, rawQuery] = id.split(`?`, 2)
  const query = qs.parse(rawQuery) as VueQuery
  if (query.vue != null) {
    query.vue = true
  }
  if (query.index) {
    query.index = Number(query.index)
  }
  return {
    filename,
    query
  }
}
