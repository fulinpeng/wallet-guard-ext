const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

export function normalizeAddress(raw: string): string | null {
  const s = raw.trim()
  if (!ETH_ADDRESS_RE.test(s)) return null
  return s.toLowerCase()
}

export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length < head + tail + 2) return addr
  return `${addr.slice(0, head + 2)}…${addr.slice(-tail)}`
}

/** True when first/last visible chars match but full address differs (address poisoning). */
export function isSimilarAddress(a: string, b: string, prefixLen = 6, suffixLen = 4): boolean {
  const na = normalizeAddress(a)
  const nb = normalizeAddress(b)
  if (!na || !nb || na === nb) return false
  const ap = na.slice(2, 2 + prefixLen)
  const bp = nb.slice(2, 2 + prefixLen)
  const as = na.slice(-suffixLen)
  const bs = nb.slice(-suffixLen)
  return ap === bp && as === bs
}

export function findSimilarInList(target: string, list: string[]): string[] {
  return list.filter((item) => isSimilarAddress(target, item))
}

export function extractAddressesFromText(text: string): string[] {
  const re = /0x[a-fA-F0-9]{40}/g
  const found = text.match(re) ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of found) {
    const n = normalizeAddress(raw)
    if (n && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  return out
}
