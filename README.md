# Wallet Guard

个人自用 Chrome 扩展：**地址簿、剪贴板守护、签名前确认、BSC 入账与 sweep 告警**。

> 私钥泄露后的扫币机器人无法拦截，本扩展侧重「防误操作 + 尽早发现异常」。

## 技术栈

- Manifest V3 + TypeScript + Vite + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)
- 链上读：`viem`（BSC balance 轮询）

## 目录结构

```
wallet-guard-ext/
├── public/icons/          # 扩展图标
├── public/rules/          # 钓鱼域拦截规则（declarativeNetRequest）
├── src/
│   ├── background/        # Service Worker：链上监控、通知
│   ├── content/           # 剪贴板守护、ethereum.request hook
│   ├── lib/               # 地址工具、存储、交易解析
│   ├── popup/             # 地址簿与设置 UI
│   └── manifest.json
└── dist/                  # 构建产物（加载到 Chrome）
```

## 开发

```bash
cd E:/practice/wallet-guard-ext
npm install
npm run dev      # 开发模式，改代码自动重建
npm run build    # 生产构建 → dist/
```

## 安装到 Chrome（自用，不上架）

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 **`dist`** 目录（`npm run build` 后生成）

开发时也可选 `dist`（`npm run dev` 会持续更新）。

## 已实现（v0.1 脚手架）

| 模块 | 能力 |
|------|------|
| Popup | 可信地址簿 CRUD、**仅从插件复制**并记录来源 |
| Content | 粘贴地址校验、投毒相似度警告 |
| Content | Hook `eth_sendTransaction` / 签名请求二次确认 |
| Content | `approve` 无限授权识别 |
| Background | BSC 余额轮询、到账通知、sweep 疑似告警 |
| Background | 可选 Telegram 推送 |
| DNR | 示例钓鱼域拦截规则（可自行扩充 `public/rules/phishing-rules.json`） |

## 后续开发建议（按优先级）

1. **W1** 完善剪贴板：与页面可见地址对比
2. **W2** 扩充钓鱼黑名单（可定时拉 ScamSniffer 开源列表）
3. **W3** ERC20 `Transfer` 日志监控（不仅 native BNB）
4. **W4** `eth_signTypedData` EIP-712 字段解析

## 配置

在 Popup「设置」中：

- **BSC RPC**：默认 `https://bsc-dataseed.binance.org`
- **Telegram**：填 Bot Token + Chat ID 可收到账/告警（可选）

## 安全说明

- 扩展**不会**也**不应**要求输入助记词或私钥
- 已泄露过的地址请废弃，不要继续充值
- 本仓库为个人工具，自行承担使用风险
