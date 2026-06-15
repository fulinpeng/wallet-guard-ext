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

/** Snippet of visible text around the first occurrence of an address. */
export function extractAddressContextFromText(
  text: string,
  address: string,
  contextChars = 28,
  maxLength = 96,
): string | null {
  const target = address.toLowerCase()
  const re = /0x[a-fA-F0-9]{40}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const n = normalizeAddress(match[0])
    if (n !== target) continue
    const raw = match[0]
    const start = Math.max(0, match.index - contextChars)
    const end = Math.min(text.length, match.index + raw.length + contextChars)
    let snippet = text.slice(start, end).replace(/\s+/g, ' ').trim()
    if (start > 0) snippet = `…${snippet}`
    if (end < text.length) snippet = `${snippet}…`
    if (snippet.length > maxLength) {
      snippet = `${snippet.slice(0, maxLength - 1)}…`
    }
    return snippet
  }
  return null
}
