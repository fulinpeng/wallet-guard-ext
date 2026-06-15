import { extractAddressesFromText, findSimilarInList, isSimilarAddress, normalizeAddress } from '../lib/address'
import { getClipboardSource, getSettings, listAddresses } from '../lib/storage'

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
