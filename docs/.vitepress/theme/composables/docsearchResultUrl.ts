export interface DocSearchNavigationTarget {
  external: boolean
  url: string
}

export function resolveDocSearchNavigationTarget(
  url: string,
  origin: string,
  cleanUrls: boolean,
): DocSearchNavigationTarget {
  const resolvedUrl = new URL(url, origin)
  const external = resolvedUrl.origin !== origin

  return {
    external,
    url: external
      ? resolvedUrl.href
      : `${cleanPathname(resolvedUrl.pathname, cleanUrls)}${resolvedUrl.search}${resolvedUrl.hash}`,
  }
}

export function resolveDocSearchResultUrl(
  url: string,
  origin: string,
  cleanUrls: boolean,
): string {
  return resolveDocSearchNavigationTarget(url, origin, cleanUrls).url
}

function cleanPathname(pathname: string, cleanUrls: boolean): string {
  return cleanUrls ? pathname.replace(/\.html$/, '') : pathname
}
