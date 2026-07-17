import { stripVTControlCharacters } from 'node:util'
import { describe, expect, test } from 'vitest'
import { printServerUrls } from '../logger'
import type { ResolvedServerUrls } from '../server'

function collectServerUrls(urls: ResolvedServerUrls): string {
  const messages: string[] = []
  printServerUrls(urls, undefined, (msg) =>
    messages.push(stripVTControlCharacters(msg)),
  )
  return '\n' + messages.join('\n') + '\n'
}

describe('printServerUrls', () => {
  test('appends the network interface name to each network URL', () => {
    const messages = collectServerUrls({
      local: ['http://localhost:5173/'],
      network: ['http://172.18.0.1:5173/', 'http://10.0.0.2:5173/'],
      networkInterfaceNames: ['eth0', 'wlan0'],
    })
    expect(messages).toMatchSnapshot()
  })

  test('aligns interface names into a column', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://172.18.0.1:5173/', 'http://10.0.0.2:5173/'],
      networkInterfaceNames: ['eth0', 'wlan0'],
    })
    expect(messages).toMatchSnapshot()
  })

  test('truncates an over-long interface name', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://10.0.0.2:5173/'],
      networkInterfaceNames: ['vEthernet (WSL (Hyper-V firewall))'],
    })
    expect(messages).toMatchSnapshot()
  })

  test('omits the annotation when the interface name is unknown', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://10.0.0.2:5173/'],
      networkInterfaceNames: [undefined],
    })
    expect(messages).toMatchSnapshot()
  })

  test('works when networkInterfaceNames is absent', () => {
    const messages = collectServerUrls({
      local: [],
      network: ['http://10.0.0.2:5173/'],
    })
    expect(messages).toMatchSnapshot()
  })
})
