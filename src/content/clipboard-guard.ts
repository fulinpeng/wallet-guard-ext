import {
  extractAddressContextFromText,
  extractAddressesFromText,
  findSimilarInList,
  isSimilarAddress,
  normalizeAddress,
  shortenAddress,
} from '../lib/address'
import { getClipboardSource, getSettings, listAddresses } from '../lib/storage'

const MAX_VISIBLE_TEXT_LENGTH = 120_000
const MAX_VISIBLE_ADDRESS_COUNT = 150

export function initClipboardGuard(): void {
  document.addEventListener(
    'paste',
    (ev) => {
      void handlePaste(ev)
    },
    true,
  )
}

async function handlePaste(ev: ClipboardEvent): Promise<void> {
  const settings = await getSettings()
  if (!settings.clipboardGuard) return

  const text = ev.clipboardData?.getData('text/plain') ?? ''
  const pasted = extractAddressesFromText(text)
  if (pasted.length === 0) return

  const pastedAddr = pasted[0]
  const source = await getClipboardSource()

  if (source) {
    const expected = normalizeAddress(source.address)
    if (expected && pastedAddr !== expected) {
      const ok = window.confirm(
        [
          '⚠️ Wallet Guard：粘贴的地址与插件内复制的地址不一致！',
          '',
          `插件复制：${source.label}`,
          expected,
          '',
          `当前粘贴：${pastedAddr}`,
          '',
          '仍要使用粘贴的地址吗？',
        ].join('\n'),
      )
      if (!ok) {
        ev.preventDefault()
        ev.stopPropagation()
      }
      return
    }
  }

  if (settings.pageVisibleAddressGuard) {
    const pageText = getPageVisibleText()
    const visibleAddresses = collectVisibleAddressesFromPage(pageText)
    if (visibleAddresses.length > 0 && !visibleAddresses.includes(pastedAddr)) {
      const similarOnPage = findSimilarInList(pastedAddr, visibleAddresses)
      if (similarOnPage.length > 0) {
        const ok = window.confirm(
          [
            '⚠️ Wallet Guard：疑似地址替换风险！',
            '',
            `当前粘贴：${pastedAddr}`,
            formatPageAddressHints(similarOnPage, pageText),
            '',
            '你粘贴的地址与页面展示地址不一致，仍要继续吗？',
          ].join('\n'),
        )
        if (!ok) {
          ev.preventDefault()
          ev.stopPropagation()
        }
        return
      }
    }
  }

  if (settings.similarityGuard) {
    const book = await listAddresses()
    const trusted = book.map((b) => b.address)
    const similar = findSimilarInList(pastedAddr, trusted)
    if (similar.length > 0) {
      const ok = window.confirm(
        [
          '⚠️ Wallet Guard：疑似地址投毒！',
          '',
          `粘贴地址：${pastedAddr}`,
          `与可信地址相似：${similar.join(', ')}`,
          '',
          '仍要继续吗？',
        ].join('\n'),
      )
      if (!ok) {
        ev.preventDefault()
        ev.stopPropagation()
      }
    }
  }
}

export function checkDomAddressAgainstTrusted(domAddress: string, trusted: string[]): boolean {
  const n = normalizeAddress(domAddress)
  if (!n) return true
  return !trusted.some((t) => isSimilarAddress(n, t) && n !== t.toLowerCase())
}

function getPageVisibleText(): string {
  const text = document.body?.innerText ?? ''
  if (!text) return ''
  return text.slice(0, MAX_VISIBLE_TEXT_LENGTH)
}

function collectVisibleAddressesFromPage(text?: string): string[] {
  const source = text ?? getPageVisibleText()
  if (!source) return []
  return extractAddressesFromText(source).slice(0, MAX_VISIBLE_ADDRESS_COUNT)
}

function formatPageAddressHints(addresses: string[], pageText: string): string {
  const lines: string[] = ['', '页面展示：']
  for (const addr of addresses.slice(0, 3)) {
    lines.push(`· ${shortenAddress(addr)}`)
    const ctx = extractAddressContextFromText(pageText, addr)
    if (ctx) lines.push(`  ${ctx}`)
  }
  return lines.join('\n')
}
