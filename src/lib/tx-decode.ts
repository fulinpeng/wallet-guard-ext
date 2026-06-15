import { decodeFunctionData, type Hex } from 'viem'

const APPROVE_SELECTOR = '0x095ea7b3'
const TRANSFER_SELECTOR = '0xa9059cbb'

export interface ParsedTx {
  to: string | null
  valueWei: bigint
  isApprove: boolean
  isUnlimitedApprove: boolean
  approveSpender: string | null
  methodLabel: string
}

export function parseSendTransaction(params: {
  to?: string
  value?: string
  data?: string
}): ParsedTx {
  const to = params.to?.toLowerCase() ?? null
  const valueWei = params.value ? BigInt(params.value) : 0n
  const data = (params.data ?? '0x') as Hex

  let isApprove = false
  let isUnlimitedApprove = false
  let approveSpender: string | null = null
  let methodLabel = '转账'

  if (data.length >= 10) {
    const selector = data.slice(0, 10).toLowerCase()
    if (selector === APPROVE_SELECTOR) {
      isApprove = true
      methodLabel = '授权'
      try {
        const decoded = decodeFunctionData({
          abi: [
            {
              type: 'function',
              name: 'approve',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
            },
          ],
          data,
        })
        const args = decoded.args as readonly [string, bigint]
        approveSpender = args[0].toLowerCase()
        isUnlimitedApprove = args[1] >= 2n ** 256n - 1000n
      } catch {
        // keep defaults
      }
    } else if (selector === TRANSFER_SELECTOR) {
      methodLabel = '代币转账'
    } else if (data !== '0x') {
      methodLabel = '合约调用'
    }
  }

  return {
    to,
    valueWei,
    isApprove,
    isUnlimitedApprove,
    approveSpender,
    methodLabel,
  }
}
