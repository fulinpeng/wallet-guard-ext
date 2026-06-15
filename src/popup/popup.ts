import { normalizeAddress, shortenAddress } from '../lib/address'
import {
  getSettings,
  listAddresses,
  saveAddresses,
  saveSettings,
  setClipboardSource,
} from '../lib/storage'
import { CHAIN_LABELS, type ChainId, type TrustedAddress } from '../lib/types'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

async function renderList(): Promise<void> {
  const list = $('address-list')
  const items = await listAddresses()
  list.innerHTML = ''
  if (items.length === 0) {
    list.innerHTML = '<li class="addr-meta">暂无地址，请先添加。</li>'
    return
  }
  for (const item of items) {
    const li = document.createElement('li')
    li.innerHTML = `
      <div class="addr-meta">${item.label} · ${CHAIN_LABELS[item.chain]}</div>
      <div class="addr-value">${item.address}</div>
      <div class="actions">
        <button type="button" data-copy="${item.id}">复制地址</button>
        <button type="button" class="secondary" data-del="${item.id}">删除</button>
      </div>
    `
    list.appendChild(li)
  }

  list.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLButtonElement).dataset.copy!
      const item = items.find((x) => x.id === id)
      if (!item) return
      await navigator.clipboard.writeText(item.address)
      await setClipboardSource({
        address: item.address,
        label: item.label,
        copiedAt: Date.now(),
      })
      alert(`已复制：${item.label}`)
    })
  })

  list.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLButtonElement).dataset.del!
      const next = items.filter((x) => x.id !== id)
      await saveAddresses(next)
      await renderList()
    })
  })
}

async function loadSettingsForm(): Promise<void> {
  const s = await getSettings()
  ;($('clipboard-guard') as HTMLInputElement).checked = s.clipboardGuard
  ;($('page-visible-guard') as HTMLInputElement).checked = s.pageVisibleAddressGuard
  ;($('similarity-guard') as HTMLInputElement).checked = s.similarityGuard
  ;($('chain-watch') as HTMLInputElement).checked = s.chainWatch
  ;($('rpc-bsc') as HTMLInputElement).value = s.rpcBsc
  ;($('tg-token') as HTMLInputElement).value = s.telegramBotToken
  ;($('tg-chat') as HTMLInputElement).value = s.telegramChatId
}

$('add-btn').addEventListener('click', async () => {
  const label = ($('label') as HTMLInputElement).value.trim()
  const chain = ($('chain') as HTMLSelectElement).value as ChainId
  const address = normalizeAddress(($('address') as HTMLInputElement).value)
  if (!label || !address) {
    alert('请填写备注和有效地址')
    return
  }
  const items = await listAddresses()
  const entry: TrustedAddress = {
    id: crypto.randomUUID(),
    label,
    chain,
    address,
    createdAt: Date.now(),
  }
  await saveAddresses([entry, ...items])
  ;($('label') as HTMLInputElement).value = ''
  ;($('address') as HTMLInputElement).value = ''
  await renderList()
})

$('save-settings').addEventListener('click', async () => {
  await saveSettings({
    clipboardGuard: ($('clipboard-guard') as HTMLInputElement).checked,
    pageVisibleAddressGuard: ($('page-visible-guard') as HTMLInputElement).checked,
    similarityGuard: ($('similarity-guard') as HTMLInputElement).checked,
    chainWatch: ($('chain-watch') as HTMLInputElement).checked,
    rpcBsc: ($('rpc-bsc') as HTMLInputElement).value.trim(),
    telegramBotToken: ($('tg-token') as HTMLInputElement).value.trim(),
    telegramChatId: ($('tg-chat') as HTMLInputElement).value.trim(),
  })
  alert('设置已保存')
})

void renderList()
void loadSettingsForm()

console.info('Wallet Guard popup', shortenAddress('0x0000000000000000000000000000000000000000'))
