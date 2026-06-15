import { initClipboardGuard } from './clipboard-guard'
import { installEthereumHook } from './ethereum-hook'

installEthereumHook()
initClipboardGuard()

console.info('[wallet-guard] content script ready')
