# Asset Manager Extension

Chrome extension Asset Manager built with React 19, TypeScript, Vite, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder

## Project Structure

```text
├── popup.html              # Popup page entry
├── options.html            # Options page entry
├── src/
│   ├── popup/              # Popup entry composition
│   ├── options/            # Extension settings page
│   ├── content/            # Asset-domain overlay and automation
│   ├── background/         # MV3 service worker orchestration
│   │   └── core/           # cookies, bootstrap, asset access, heartbeat
│   ├── components/
│   │   ├── asset-manager/  # reusable domain UI components
│   │   └── ui/             # shadcn/base-ui primitives
│   └── lib/
│       ├── api/            # api/ext client and contracts
│       ├── asset-access/   # platform/subscription helpers
│       ├── runtime/        # typed runtime messages
│       ├── storage/        # chrome.storage helpers
│       └── styles/         # Tailwind theme tokens
├── tests/
│   ├── unit/               # Unit tests vitest
│   ├── integration/        # web integration tests playwright
│   └── setup.ts
├── public/
│   └── icons/              # Extension icons (16, 32, 48, 128px)
└── manifest.json           # Extension configuration
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:web` | Run Playwright browser tests |

## Customizing Icons

Replace the files in `public/icons/` with your own icon set:

```json
"icons": {
  "16": "icons/icon-16.png",
  "32": "icons/icon-32.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
}
```

## Asset Manager Flow

1. Login ke web app local `http://localhost:3000` memakai akun seed di `.docs/dev-seed.md`.
2. Buka popup extension untuk melihat bootstrap state, subscription, package, dan asset access.
3. Klik asset untuk clear cookie, fetch payload `/api/ext/asset`, inject cookie, dan membuka domain target.
4. Buka domain aset langsung untuk menjalankan auto sync dengan cooldown 5 menit.
5. Gunakan tombol Refresh untuk forced bootstrap sync dan Redeem CDKey untuk memperbarui paket.

## Customization

### Change Content Script URL Pattern

Edit `manifest.json` to change which pages the content script runs on:

```json
"content_scripts": [
  {
    "matches": ["https://example.com/*"],
    "js": ["src/content/index.tsx"]
  }
]
```

### Add Permissions

Asset Manager currently uses MV3 permissions for alarms, cookies, storage, and tabs. Update
`manifest.json` when adding a new privileged browser capability:

```json
"permissions": ["alarms", "cookies", "storage", "tabs"]
```

## Tech Stack

- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [CRXJS](https://crxjs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [ESLint](https://eslint.org)

## License

MIT
