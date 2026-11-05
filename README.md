# Monarch

A working interactive clone of [Monarch Money](https://app.monarch.com/) — personal finance dashboard with accounts, transactions, budgets, cash flow, reports, recurring bills, goals, and investments.

## Download & install

**One-click Windows installer:**  
https://github.com/usamamir/check/releases/download/v1.0.1/Monarch-Setup-1.0.1.exe

Double-click → installs → opens Monarch (Desktop + Start Menu shortcuts included).

All platforms & portable builds: see [DOWNLOAD.md](./DOWNLOAD.md) or the [v1.0.1 release](https://github.com/usamamir/check/releases/tag/v1.0.1).

**Your own data:** Settings → **Erase all data & start from scratch**, or choose **Start from scratch** on login.

## Features

- **Dashboard** — net worth chart, review queue, recent activity, budget & goals snapshot
- **Accounts** — grouped cash / credit / investments / property / loans, add manual accounts
- **Transactions** — search, filter, categorize, review, bulk actions, add & delete
- **Cash flow** — monthly income vs expenses
- **Reports** — interactive spending-by-category charts that filter the transaction list
- **Budget** — flex & category modes with editable planned amounts
- **Recurring** — bills, subscriptions, and income with on/off toggles
- **Goals** — save-up and pay-down goals with progress tracking
- **Investments** — portfolio allocation and holdings
- **Settings** — preferences, reset sample data, sign out

Sample household data persists in your browser (`localStorage`). No real bank connections.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
