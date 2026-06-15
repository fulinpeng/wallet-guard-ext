import type { AppSettings, ClipboardSource, TrustedAddress } from './types'
import { DEFAULT_SETTINGS } from './types'

const KEYS = {
  addresses: 'wg_addresses',
  settings: 'wg_settings',
  clipboard: 'wg_clipboard_source',
  balances: 'wg_balance_snapshots',
} as const

export async function getSettings(): Promise<AppSettings> {
  const { wg_settings } = await chrome.storage.local.get(KEYS.settings)
  return { ...DEFAULT_SETTINGS, ...(wg_settings as Partial<AppSettings> | undefined) }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const next = { ...current, ...patch }
  await chrome.storage.local.set({ [KEYS.settings]: next })
  return next
}

export async function listAddresses(): Promise<TrustedAddress[]> {
  const { wg_addresses } = await chrome.storage.local.get(KEYS.addresses)
  return (wg_addresses as TrustedAddress[] | undefined) ?? []
}

export async function saveAddresses(list: TrustedAddress[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.addresses]: list })
}

export async function setClipboardSource(source: ClipboardSource): Promise<void> {
  await chrome.storage.local.set({ [KEYS.clipboard]: source })
}

export async function getClipboardSource(): Promise<ClipboardSource | null> {
  const { wg_clipboard } = await chrome.storage.local.get(KEYS.clipboard)
  return (wg_clipboard as ClipboardSource | undefined) ?? null
}

export async function getBalanceSnapshots(): Promise<Record<string, string>> {
  const { wg_balance_snapshots } = await chrome.storage.local.get(KEYS.balances)
  return (wg_balance_snapshots as Record<string, string> | undefined) ?? {}
}

export async function setBalanceSnapshots(map: Record<string, string>): Promise<void> {
  await chrome.storage.local.set({ [KEYS.balances]: map })
}
