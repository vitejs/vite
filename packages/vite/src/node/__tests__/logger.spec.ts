import { stripVTControlCharacters } from 'node:util'
import { describe, expect, test } from 'vitest'
import { printServerUrls } from '../logger'
import type { ResolvedServerUrls } from '../server'

function collectServerUrls(urls: ResolvedServerUrls): string[] {
  const messages: string[] = []
  printServerUrls(urls, undefined, (msg) =>
    messages.push(stripVTControlCharacters(String(msg))),
  )
  return messages
}

describe('printServerUrls', () => {
  test('appends the network interface name to each network URL', () => {
    const messages = collectServerUrls({
      local: ['http://localhost:5173/'],
      network: ['http://172.18.0.1:5173/', 'http://10.0.0.2:5173/'],
      networkInterfaceNames: ['eth0', 'wlan0'],
    })
    expect(messages[0]).toContain('Local:')
    expect(messages[1]).toContain('http://172.18.0.1:5173/')
    expect(messages[1]).toMatch(/eth0$/)
    expect(messages[2]).toMatch(/wlan0$/)
  })

  test('aligns interface names into a column', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://172.18.0.1:5173/', 'http://10.0.0.2:5173/'],
      networkInterfaceNames: ['eth0', 'wlan0'],
    })
    expect(messages[0].indexOf('eth0')).toBe(messages[1].indexOf('wlan0'))
  })

  test('truncates an over-long interface name', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://10.0.0.2:5173/'],
      networkInterfaceNames: ['vEthernet (WSL (Hyper-V firewall))'],
    })
    expect(messages[0]).toContain('vEthernet (WSL (Hyp…')
    expect(messages[0]).not.toContain('firewall')
  })

  test('omits the annotation when the interface name is unknown', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://10.0.0.2:5173/'],
      networkInterfaceNames: [undefined],
    })
    expect(messages[0].trimEnd()).toMatch(
      /Network: http:\/\/10\.0\.0\.2:5173\/$/,
    )
  })

  test('works when networkInterfaceNames is absent', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://10.0.0.2:5173/'],
    })
    expect(messages[0]).toContain('http://10.0.0.2:5173/')
  })
})
