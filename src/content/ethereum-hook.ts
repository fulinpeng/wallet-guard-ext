import { parseSendTransaction } from '../lib/tx-decode'

type EthereumRequest = (args: { method: string; params?: unknown[] }) => Promise<unknown>

export function installEthereumHook(): void {
  const attach = (provider: { request: EthereumRequest }) => {
    if ((provider as { __wgHooked?: boolean }).__wgHooked) return
    const original = provider.request.bind(provider)
    ;(provider as { __wgHooked?: boolean }).__wgHooked = true

    provider.request = async (args) => {
      if (args.method === 'eth_sendTransaction' && args.params?.[0]) {
        const tx = args.params[0] as { to?: string; value?: string; data?: string }
        const parsed = parseSendTransaction(tx)
        const lines = [
          'Wallet Guard 签名确认',
          `类型：${parsed.methodLabel}`,
          `to：${parsed.to ?? '(无)'}`,
          `value：${parsed.valueWei.toString()} wei`,
        ]
        if (parsed.isApprove) {
          lines.push(`spender：${parsed.approveSpender}`)
          if (parsed.isUnlimitedApprove) {
            lines.push('⚠️ 无限授权！')
          }
        }
        const ok = window.confirm(lines.join('\n'))
        if (!ok) {
          throw new Error('Wallet Guard: user rejected transaction')
        }
      }

      if (
        args.method === 'personal_sign' ||
        args.method === 'eth_sign' ||
        args.method === 'eth_signTypedData' ||
        args.method === 'eth_signTypedData_v4'
      ) {
        const host = location.hostname
        const ok = window.confirm(
          `Wallet Guard：站点 ${host} 请求签名\n\n确认这是你信任的操作吗？`,
        )
        if (!ok) {
          throw new Error('Wallet Guard: user rejected sign request')
        }
      }

      return original(args)
    }
  }

  const eth = (window as unknown as { ethereum?: { request: EthereumRequest } }).ethereum
  if (eth?.request) {
    attach(eth)
  }

  window.addEventListener('ethereum#initialized', () => {
    const late = (window as unknown as { ethereum?: { request: EthereumRequest } }).ethereum
    if (late?.request) attach(late)
  })
}
