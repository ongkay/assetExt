# AGENTS.md

## Stack And Runtime
- Single-package Chrome extension repo using Vite + CRXJS, React 19, TypeScript, Tailwind CSS v4, and shadcn/base-ui primitives.
- Use Node `24` (`.nvmrc`, `package.json#engines`) and pnpm `10+`.

## Entry Points And Boundaries
- Extension surfaces are separate apps:
  - `popup.html` -> `src/popup/index.tsx`
  - `options.html` -> `src/options/index.tsx`
  - content script -> `src/content/index.tsx`
  - background service worker -> `src/background/index.ts`
- `manifest.json` points at the TypeScript entry files directly; CRXJS/Vite handles bundling. New permissions, content scripts, or extension surfaces usually require `manifest.json` changes too.
- Shared app helpers live in `src/lib/*`.
- `src/components/ui/*` is the shared shadcn/base-ui primitive layer.
- `src/component/*` is a separate singular directory for app-specific shared components like `Logo`; do not confuse it with `src/components/*`.


## Engineering Rules
Semua perubahan harus:
- sekecil mungkin tetapi benar
- mudah dibaca tanpa perlu menebak intent
- rapi dan konsisten secara struktur, spacing, dan naming
- konsisten dengan struktur folder repo
- type-safe end-to-end
- mudah dikembangkan ke depan
- tidak menambah abstraction, helper, atau layer baru tanpa alasan jelas

Aturan ringkas:
- gunakan TypeScript strict
- hindari `any`
- hindari `unknown` untuk kontrak domain final
- gunakan penamaan yang eksplisit, mudah dipahami, dan menjelaskan intent
- hindari nama generik yang kabur seperti `data`, `item`, `temp`, `value2`, `handleSubmit`, atau `onSubmit` jika ada nama yang lebih spesifik
- untuk event handler, action handler, dan form handler, gunakan nama berbasis use case atau intent, misalnya `onSubmitRegister`, `onSubmitLogin`, `handleRedeemCdKey`, atau `handleDisableAsset`
- gunakan early return
- hindari nested logic yang terlalu dalam
- satu file satu tanggung jawab utama, kecuali memang ada alasan kuat untuk tetap digabung
- komentar hanya jika logic tidak langsung obvious
- utamakan perubahan kecil pada file yang tepat daripada refactor besar yang tidak diminta
- ikuti pola repo dan dokumen arsitektur sebelum memperkenalkan pola baru


## UI Rules
Aturan inti:
- UI harus terasa seperti produk nyata, bukan demo.
- prioritas token dan theme selalu mengikuti `src/app/globals.css`
- reuse primitive yang sudah ada di `src/components/ui/**` sebelum membuat primitive baru
- jangan membuat UI asal jadi, layout generik, atau copy yang terasa demo/template
- semua UI baru harus tetap responsif, accessible, dan konsisten di desktop maupun mobile
- semua form input, button, wajib memiliki icon di sebelah kiri
- gunakan state loading, disabled, success, dan error yang jelas


## Quality Gate
Pekerjaan belum selesai sebelum semua gate yang relevan hijau.

Gate yang benar-benar tersedia di repo saat ini:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:web`
- `pnpm build`
- browser verification untuk flow yang terdampak menggunakan ` next-devtools_browser_eval` atau `playwright` mcp tools
- tidak ada error log
