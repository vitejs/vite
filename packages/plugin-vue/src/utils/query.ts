import qs from 'querystring'

export interface VueQuery {
  vue?: boolean
  src?: string
  type?: 'script' | 'template' | 'style' | 'custom'
  index?: number
  lang?: string
  raw?: boolean
}

export function parseVueRequest(id: string): {
  filename: string
  query: VueQuery
} {
  const [filename, rawQuery] = id.split(`?`, 2)
  const query = qs.parse(rawQuery) as VueQuery
  if (query.vue != null) {
    query.vue = true
  }
  if (query.index != null) {
    query.index = Number(query.index)
  }
  if (query.raw != null) {
    query.raw = true
  }
  return {
    filename,
    query
  }
}
