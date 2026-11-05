# Download Monarch

Installable desktop builds are published on GitHub Releases:

**https://github.com/usamamir/check/releases/tag/v1.0.1**

## Windows (recommended)

1. Download **[Monarch-Setup-1.0.1.exe](https://github.com/usamamir/check/releases/download/v1.0.1/Monarch-Setup-1.0.1.exe)**
2. Double-click the file
3. The one-click installer installs Monarch, creates Desktop + Start Menu shortcuts, and launches the app

Portable (no install): **[Monarch-Portable-1.0.1.exe](https://github.com/usamamir/check/releases/download/v1.0.1/Monarch-Portable-1.0.1.exe)** — double-click to run.

> First launch may show Windows SmartScreen (“Windows protected your PC”) because the build is unsigned. Click **More info** → **Run anyway**.

## Linux

- **[Monarch-1.0.1-linux.AppImage](https://github.com/usamamir/check/releases/download/v1.0.1/Monarch-1.0.1-linux.AppImage)** — `chmod +x` then double-click
- **[Monarch-1.0.1-linux.deb](https://github.com/usamamir/check/releases/download/v1.0.1/Monarch-1.0.1-linux.deb)** — double-click or `sudo dpkg -i Monarch-1.0.1-linux.deb`

## Start with your own data

On first launch choose **Start from scratch**, or open **Settings → Erase all data & start from scratch** to wipe the sample household and enter your own accounts, transactions, budgets, and goals.

## Build locally

```bash
npm install
npm run electron:build:win    # Windows installers
npm run electron:build:linux  # AppImage + deb
```
