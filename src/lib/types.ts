export type ChainId = 'bsc' | 'ethereum' | 'hyperliquid'

export const CHAIN_LABELS: Record<ChainId, string> = {
  bsc: '币安链',
  ethereum: '以太坊',
  hyperliquid: '超流动',
}

export interface TrustedAddress {
  id: string
  label: string
  chain: ChainId
  address: string
  createdAt: number
}

export interface AppSettings {
  clipboardGuard: boolean
  pageVisibleAddressGuard: boolean
  phishingBlock: boolean
  chainWatch: boolean
  similarityGuard: boolean
  rpcBsc: string
  telegramBotToken: string
  telegramChatId: string
  pollIntervalSec: number
  sweepWindowSec: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  clipboardGuard: true,
  pageVisibleAddressGuard: true,
  phishingBlock: true,
  chainWatch: true,
  similarityGuard: true,
  rpcBsc: 'https://bsc-dataseed.binance.org',
  telegramBotToken: '',
  telegramChatId: '',
  pollIntervalSec: 45,
  sweepWindowSec: 300,
}

/** Set when user copies from extension popup; used for paste verification. */
export interface ClipboardSource {
  address: string
  label: string
  copiedAt: number
}

export interface BalanceSnapshot {
  address: string
  chain: ChainId
  balanceWei: string
  updatedAt: number
}

export interface WatchEvent {
  type: 'deposit' | 'sweep_suspect' | 'withdraw'
  address: string
  chain: ChainId
  message: string
  at: number
}
