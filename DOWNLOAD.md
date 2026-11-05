# Download Monarch

Installable desktop builds are published on GitHub Releases:

**https://github.com/usamamir/check/releases/tag/v1.0.0**

## Windows (recommended)

1. Download **[Monarch-Setup-1.0.0.exe](https://github.com/usamamir/check/releases/download/v1.0.0/Monarch-Setup-1.0.0.exe)**
2. Double-click the file
3. The one-click installer installs Monarch, creates Desktop + Start Menu shortcuts, and launches the app

Portable (no install): **[Monarch-Portable-1.0.0.exe](https://github.com/usamamir/check/releases/download/v1.0.0/Monarch-Portable-1.0.0.exe)** — double-click to run.

> First launch may show Windows SmartScreen (“Windows protected your PC”) because the build is unsigned. Click **More info** → **Run anyway**.

## Linux

- **[Monarch-1.0.0-linux.AppImage](https://github.com/usamamir/check/releases/download/v1.0.0/Monarch-1.0.0-linux.AppImage)** — `chmod +x` then double-click
- **[Monarch-1.0.0-linux.deb](https://github.com/usamamir/check/releases/download/v1.0.0/Monarch-1.0.0-linux.deb)** — double-click or `sudo dpkg -i Monarch-1.0.0-linux.deb`

## Build locally

```bash
npm install
npm run electron:build:win    # Windows installers
npm run electron:build:linux  # AppImage + deb
```
