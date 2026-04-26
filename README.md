# React Chrome Extension Template

A minimal Chrome extension starter built with React 19, TypeScript, Vite, and Tailwind CSS.

## Quick Start

```bash
# Clone the template
git clone https://github.com/ongkay/react-web-extension-template.git my-extension
cd my-extension

# Run setup wizard
pnpm setup
# (resets name/version/manifest to your project)

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
│   ├── popup/
│   │   ├── index.tsx
│   │   ├── PopupApp.tsx
│   │   └── ui/
│   ├── options/
│   │   ├── index.tsx
│   │   ├── OptionsApp.tsx
│   │   └── ui/
│   ├── content/
│   │   ├── index.tsx
│   │   ├── ContentApp.tsx
│   │   ├── ui/
│   │   └── dom/
│   ├── background/
│   │   ├── index.ts
│   │   └── core/
│   ├── component/          # Shared UI used across entrypoints
│   └── lib/
│       ├── runtime/
│       ├── storage/        # Reserved for shared storage helpers
│       ├── api/            # Reserved for shared API helpers
│       └── styles/
├── tests/
│   ├── unit/               # Unit tests vitest
│   ├── integration/        # web integration tests playwright
│   └── setup.ts
├── public/
│   └── icons/              # Extension icons (16, 32, 48, 128px)
├── manifest.json           # Extension configuration
└── scripts/
    └── setup.js            # Setup wizard
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:web` | Run Playwright browser tests |
| `pnpm setup` | Run setup wizard |

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

## Background Service Worker

The service worker (`src/background/index.ts`) demonstrates a minimal use case:
increment a badge counter for quick visual feedback.

## Options Page

An options page is available at `options.html`. The popup include
entry points into the demo controls, or you can open it from the extension details
page. It also includes a "Reset badge" button to show background messaging.

## Demo: Extension Tour

This template includes a tiny demo app that touches the core extension pieces:
- Content overlay injected on pages through `src/content/index.tsx`.
- Popup buttons that message the content script and background.
- Background service worker that updates the badge.
- Options page that can trigger background actions.

Quick tour:
1. Visit any page and spot the content overlay.
2. Use "Overlay" in the popup (or the in-page Hide/Show controls).
3. Click "Badge +" in the popup or overlay to update the toolbar badge.
4. Open Settings and click "Reset badge count".

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

This template uses `activeTab`. Add more
permissions to `manifest.json` as needed:

```json
"permissions": ["storage", "activeTab"]
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
