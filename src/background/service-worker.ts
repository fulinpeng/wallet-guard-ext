import { createPublicClient, formatEther, http, type Address } from 'viem'
import { bsc } from 'viem/chains'
import { getBalanceSnapshots, getSettings, listAddresses, setBalanceSnapshots } from '../lib/storage'
import type { ChainId } from '../lib/types'

const ALARM_WATCH = 'wg-chain-watch'

export function initChainWatch(): void {
  chrome.alarms.create(ALARM_WATCH, { periodInMinutes: 1 })
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_WATCH) {
      void pollBalances()
    }
  })
  void pollBalances()
}

async function pollBalances(): Promise<void> {
  const settings = await getSettings()
  if (!settings.chainWatch) return

  const addresses = await listAddresses()
  const bscAddrs = addresses.filter((a) => a.chain === 'bsc')
  if (bscAddrs.length === 0) return

  const client = createPublicClient({
    chain: bsc,
    transport: http(settings.rpcBsc),
  })

  const prev = await getBalanceSnapshots()
  const next: Record<string, string> = { ...prev }
  const now = Date.now()

  for (const item of bscAddrs) {
    const key = snapshotKey(item.chain, item.address)
    try {
      const balance = await client.getBalance({ address: item.address as Address })
      const prevWei = prev[key] ? BigInt(prev[key]) : null
      next[key] = balance.toString()

      if (prevWei !== null) {
        if (balance > prevWei) {
          const delta = formatEther(balance - prevWei)
          await notify('钱包卫士 · 到账', `${item.label} 收到约 ${delta} 币安币`)
          await maybeTelegram(settings, `✅ 到账 ${item.label}：+${delta} 币安币`)
          chrome.storage.local.set({
            [`wg_last_deposit_${key}`]: { at: now, balance: balance.toString() },
          })
        } else if (prevWei > balance) {
          const drop = formatEther(prevWei - balance)
          const depositKey = `wg_last_deposit_${key}`
          const last = (await chrome.storage.local.get(depositKey))[depositKey] as
            | { at: number; balance: string }
            | undefined
          const withinSweepWindow =
            last && now - last.at < settings.sweepWindowSec * 1000
          if (withinSweepWindow) {
            await notify(
              '钱包卫士 · 紧急',
              `${item.label} 入账后短时间内转出约 ${drop} 币安币，钱包可能已泄露！`,
            )
            await maybeTelegram(
              settings,
              `🚨 疑似扫币 ${item.label}：-${drop} 币安币，请立即停用该地址`,
            )
          }
        }
      }
    } catch (err) {
      console.warn('[wallet-guard] balance poll failed', item.address, err)
    }
  }

  await setBalanceSnapshots(next)
}

function snapshotKey(chain: ChainId, address: string): string {
  return `${chain}:${address.toLowerCase()}`
}

async function notify(title: string, message: string): Promise<void> {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title,
    message,
  })
}

async function maybeTelegram(
  settings: Awaited<ReturnType<typeof getSettings>>,
  text: string,
): Promise<void> {
  const token = settings.telegramBotToken.trim()
  const chatId = settings.telegramChatId.trim()
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
  } catch (err) {
    console.warn('[wallet-guard] telegram failed', err)
  }
}

initChainWatch()

chrome.runtime.onInstalled.addListener(() => {
  console.info('[wallet-guard] extension installed')
})
