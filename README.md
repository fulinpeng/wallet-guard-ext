# Wallet Guard

个人自用的 Chrome 扩展，用于 Web3 场景下的地址管理与安全提醒：可信地址簿、剪贴板校验、签名前确认、BSC 链上监控与钓鱼域拦截。

## 开发

```bash
npm install
npm run dev      # 开发模式，改代码自动重建
npm run build    # 生产构建 → dist/
```

## 安装

1. 打开 `chrome://extensions`，开启「开发者模式」
2. 点击「加载已解压的扩展程序」，选择 `dist` 目录

## 配置

在 Popup「设置」中可配置 BSC RPC 地址，以及可选的 Telegram Bot Token 与 Chat ID。

## 安全说明

扩展不会要求输入助记词或私钥。本仓库为个人工具，自行承担使用风险。
