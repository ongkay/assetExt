# Desain Browser Extension Asset Manager

Tanggal: 2026-04-27

## Tujuan

Browser extension ini mengelola akses akun premium untuk platform aset seperti TradingView, FXReplay, dan FXTester. Extension membaca sesi login web app, menampilkan status langganan, melakukan redeem CD-Key, menginjeksi cookie akses aset, dan mengirim heartbeat aktivitas saat user aktif di domain aset.

Dokumen ini mengikuti kontrak di `.docs/PRD.md`, `.docs/wireframe.md`, dan `.docs/extension-v2-api.md`, serta tetap mengikuti struktur template repo di `README.md`.

## Keputusan Desain Utama

- Pendekatan implementasi: core-first vertical slice.
- Auth/session: extension memanggil API web app dengan `fetch(..., { credentials: "include" })` agar backend membaca cookie `app_session` dari web app.
- Base URL: configurable melalui env Vite, dengan fallback `http://localhost:3000`.
- Content script: dibatasi di manifest hanya untuk domain aset, bukan `<all_urls>`.
- Bootstrap cache: memakai pola stale-while-revalidate dengan TTL 10 menit.
- Cookie injection: hanya dilakukan di background service worker, bukan popup atau content script.
- Mode chooser: hanya muncul jika API `/api/ext/asset` mengembalikan `status: "selection_required"`.

## Struktur Folder

Struktur folder tetap mengikuti template repo, tetapi komponen domain dibuat reusable agar mudah dibaca dan dikembangkan.

```text
src/
├── popup/
│   ├── index.tsx
│   ├── PopupApp.tsx
│   └── ui/
├── content/
│   ├── index.tsx
│   ├── ContentApp.tsx
│   ├── ui/
│   └── dom/
├── background/
│   ├── index.ts
│   └── core/
├── components/
│   ├── asset-manager/
│   └── ui/
└── lib/
    ├── api/
    ├── asset-access/
    ├── runtime/
    ├── storage/
    └── styles/
```

Peran folder:

- `src/popup/` hanya menjadi entry composition popup. `PopupApp.tsx` harus tipis dan fokus menyambungkan state, cache, dan event handler.
- `src/popup/ui/` hanya untuk UI yang benar-benar spesifik popup, seperti wrapper ukuran popup atau layout shell ukuran `332px`.
- `src/components/asset-manager/` berisi komponen domain reusable seperti header, avatar, subscription summary, renewal actions, package list, redeem form, profile panel, dan asset access list.
- `src/components/ui/` tetap khusus primitive shadcn/base-ui seperti button, input, card, badge, alert, skeleton, dan spinner.
- `src/component/Logo.tsx` dari template sebaiknya dipindah ke `src/components/asset-manager/Logo.tsx` saat implementasi agar tidak ada dua pola folder komponen yang mirip.
- `src/lib/api/` berisi client API `/api/ext/*`, tipe response, dan parser/error helper API.
- `src/lib/storage/` berisi helper `chrome.storage.local` untuk bootstrap cache, cooldown injection, timestamp heartbeat, dan device id.
- `src/lib/runtime/` berisi kontrak message typed antara popup, content script, dan background.
- `src/lib/asset-access/` berisi domain logic murni seperti mapping platform, target URL, label platform, status helper, countdown helper, dan aturan near expiry.
- `src/background/core/` berisi orchestration yang menyentuh Chrome API sensitif: cookies, tabs, storage, heartbeat, dan bootstrap cache.
- `src/content/` berisi composition content script, overlay loading, dan chooser mode akses pada domain aset.

## Konfigurasi Manifest

Manifest perlu diperbarui dari template demo menjadi extension Asset Manager.

Perubahan utama:

- `name`, `description`, dan `version` disesuaikan menjadi Asset Manager.
- `permissions` minimal mencakup `cookies`, `storage`, dan `tabs`.
- `host_permissions` mencakup base URL web app dan domain aset yang perlu diakses.
- `content_scripts.matches` hanya berisi domain aset utama.
- Demo permission dan behavior yang tidak dipakai dari template dihapus.

Domain target awal:

- `http://localhost:3000/*`
- `https://www.tradingview.com/*`
- `https://*.tradingview.com/*`
- `https://fxreplay.com/*`
- `https://*.fxreplay.com/*`
- `https://forextester.com/*`
- `https://*.forextester.com/*`

Jika server mengirim cookie untuk domain tambahan seperti `tv.checkout.com`, domain tersebut harus tersedia di host permissions agar `chrome.cookies.set` dapat bekerja.

## API Client

`src/lib/api/extensionApi.ts` menyediakan fungsi kecil untuk kontrak API:

- `fetchBootstrap()` untuk `GET /api/ext/bootstrap`.
- `fetchAsset(platform, mode?)` untuk `GET /api/ext/asset`.
- `postHeartbeat(deviceId)` untuk `POST /api/ext/heartbeat`.
- `postRedeem(code)` untuk `POST /api/ext/redeem`.
- `postLogout()` untuk `POST /api/ext/logout`.

Semua request API memakai:

- `credentials: "include"`
- `x-extension-version`
- `x-extension-id` jika tersedia melalui `chrome.runtime.id`

Local dev tetap bisa memakai fallback base URL `http://localhost:3000`. Jika env dipakai, nama env disarankan `VITE_EXT_API_BASE_URL`.

## Bootstrap Cache

Bootstrap cache memakai pola stale-while-revalidate agar popup tidak menampilkan skeleton berulang setiap dibuka.

Storage record berisi:

- `snapshot`: hasil bootstrap terakhir.
- `fetchedAt`: timestamp fetch sukses terakhir.
- `isValid`: status validitas cache untuk UI.
- `lastErrorMessage`: pesan error terakhir jika sync terbaru gagal.

Aturan cache:

- `BootstrapSkeleton` hanya muncul jika belum pernah ada `snapshot` di storage.
- Jika snapshot lama ada, popup langsung render snapshot tersebut walaupun TTL sudah lewat.
- Background melakukan sync terbaru jika `fetchedAt` lebih lama dari 10 menit.
- Manual Refresh selalu bypass cache.
- Redeem sukses langsung mengganti snapshot dari response bootstrap.
- Logout tidak menghapus record secara fisik, tetapi mengganti snapshot menjadi unauthenticated state dan menandai cache invalid agar data user lama tidak tampil.
- Jika fetch terbaru gagal, snapshot lama tetap tampil dan UI menampilkan notice error kecil.

Saat sync berjalan:

- Avatar kanan berubah menjadi spinner.
- Tombol Refresh disabled dan menampilkan loading.
- Layout utama tetap menampilkan data cached.
- Action sensitif boleh disabled saat forced refresh berlangsung.

TTL bootstrap cache: 10 menit.

## Runtime Messaging

Popup dan content script tidak menyentuh langsung API Chrome sensitif. Semua flow utama lewat background.

Message utama:

- `bootstrapRequested`: popup meminta snapshot bootstrap.
- `bootstrapRefreshRequested`: popup meminta forced refresh.
- `assetAccessRequested`: popup meminta akses platform tertentu.
- `autoAccessRequested`: content script meminta otomasi akses berdasarkan domain aktif.
- `assetModeSelected`: popup atau content script mengirim mode hasil chooser.
- `redeemCdKeyRequested`: popup submit kode CD-Key.
- `logoutRequested`: popup meminta logout.
- `heartbeatStarted` dan `heartbeatStopped`: background mengelola heartbeat tab aset.

Semua message dan response harus typed di `src/lib/runtime/messages.ts` tanpa `any`.

## Popup UI

Popup memakai layout ringkas dengan lebar sekitar `332px` dan harus support light mode serta dark mode. UI tidak boleh hardcode sebagai layout gelap; semua warna mengikuti token theme yang sudah ada di `src/lib/styles/globals.css` dan mekanisme theme preference template repo. Semua tombol dan input form memiliki icon kiri sesuai aturan repo.

Aturan theme:

- Popup, options, dan content overlay tetap memakai theme preference yang sudah tersedia di repo.
- Komponen Asset Manager memakai token seperti `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary`, dan state semantic yang kompatibel dengan light/dark.
- Aksen status tetap semantik: hijau untuk active/success, amber untuk processed/update available/near expiry, dan merah untuk expired/update required.
- Content overlay tetap memakai Shadow DOM agar style extension tidak bocor ke host page, tetapi visualnya tetap mengikuti theme extension.

State popup:

- Loading awal: `BootstrapSkeleton`, hanya jika tidak ada snapshot storage.
- Unauthenticated: pesan login dan tombol Login yang membuka `baseUrl + loginUrl`.
- Authenticated active/processed: header, avatar, subscription summary, update warning opsional, processed warning, asset access list, logout, refresh.
- Near expiry: jika `countdownSeconds <= 259200`, tampilkan renewal warning dan tombol `Pilih Paket` serta `Redeem CDKey`.
- Expired/canceled/none: tampilkan pesan status, tombol `Pilih Paket`, dan `Redeem CDKey`.
- Profile: tampil setelah user klik avatar, berisi avatar besar, username, email, public id, dan logout.
- Update required: blokir semua fitur dan tampilkan tombol `Download New Version`.

Komponen domain reusable di `src/components/asset-manager/`:

- `ExtensionHeader`
- `UserAvatar`
- `ProfilePanel`
- `BootstrapSkeleton`
- `VersionGatePanel`
- `UnauthenticatedPanel`
- `SubscriptionSummary`
- `StatusNotice`
- `RenewalActions`
- `PackageList`
- `RedeemCdKeyForm`
- `AssetAccessList`
- `AssetAccessCard`

Aturan toggle renewal:

- Default tidak ada panel terbuka.
- Klik `Pilih Paket` membuka list paket.
- Klik `Redeem CDKey` membuka form redeem.
- Klik button aktif lagi menutup panel.
- Membuka satu panel menutup panel lain.

## Flow Asset Access

Flow ini berlaku untuk klik asset dari popup dan otomasi dari content script.

Langkah utama:

1. Background menerima request platform.
2. Background fetch `GET /api/ext/asset?platform=<platform>`.
3. Jika response `ready`, background langsung memakai cookie dan mode yang dikirim server.
4. Jika response `selection_required`, surface yang memulai flow menampilkan chooser mode.
5. Jika user memilih mode, background fetch ulang dengan `mode=<selectedMode>`.
6. Jika user tidak memilih dalam timeout 10 detik, background memakai `defaultMode` dari server, fallback `private`.
7. Setelah response `ready`, background menghapus cookie lama domain platform.
8. Background menginjeksi semua cookie dari server sesuai `cookie.domain` masing-masing.
9. Background membuka atau reload target URL platform.

Aturan mode:

- Jika user hanya punya akses `share`, server mengembalikan `ready` dengan mode `share`; chooser tidak muncul.
- Jika user hanya punya akses `private`, server mengembalikan `ready` dengan mode `private`; chooser tidak muncul.
- Chooser hanya muncul jika server mengembalikan `selection_required`, yaitu saat user punya akses `private` dan `share` sekaligus.
- Untuk klik asset dari popup, chooser muncul di popup karena user belum tentu sedang membuka domain target.
- Untuk otomasi domain dari content script, chooser muncul sebagai overlay di halaman target.

Jika response `forbidden` atau error auth/subscription, extension tidak menghapus atau menginjeksi cookie. UI menampilkan error yang sesuai dan dapat meminta refresh bootstrap.

## Content Automation

Content script hanya berjalan pada domain aset yang terdaftar.

Saat user membuka atau refresh domain aset:

- Content script mendeteksi platform dari hostname.
- Content script mengirim `autoAccessRequested(platform)` ke background.
- Background cek cooldown injection 5 menit di storage.
- Jika cooldown belum lewat, background no-op dan halaman lanjut normal.
- Jika cooldown lewat, content menampilkan overlay `Menyiapkan akses aset...`.
- Background menjalankan flow asset access.
- Setelah cookie berhasil diinjeksi, halaman direload otomatis.

Overlay content:

- Loading overlay memakai Shadow DOM agar CSS extension tidak mengganggu host page.
- Mode chooser muncul hanya saat `selection_required`.
- Chooser menampilkan private/share, penjelasan singkat, dan countdown timeout 10 detik.

## Heartbeat

Heartbeat dikirim setiap 5 menit selama user aktif di tab domain aset.

Aturan:

- Background memulai heartbeat saat tab aktif berada di domain aset.
- Background menghentikan heartbeat saat tab tidak aktif, tab ditutup, atau URL bukan domain aset.
- Device id disimpan di `chrome.storage.local` dan dipakai ulang.
- Payload heartbeat mengikuti kontrak API: `deviceId` dan `extensionVersion`.
- Error heartbeat tidak memblokir UI, tetapi dapat dicatat sebagai status internal.

## Logout

Logout dilakukan lewat background.

Langkah:

1. Popup mengirim `logoutRequested`.
2. Background memanggil `POST /api/ext/logout` dengan `credentials: "include"`.
3. Background menghapus cookie domain aset sesuai daftar platform yang diketahui dari snapshot terakhir.
4. Background mengganti bootstrap cache menjadi unauthenticated state dan menandai cache invalid.
5. Popup kembali ke state unauthenticated.

Data user lama tidak boleh tetap tampil setelah logout.

## Error Handling

Error API mengikuti contract `.docs/extension-v2-api.md`.

Aturan UI:

- `EXT_UNAUTHENTICATED`: refresh bootstrap dan tampilkan login state.
- `EXT_UPDATE_REQUIRED`: tampilkan update required panel.
- `EXT_REDEEM_INVALID` dan `EXT_REDEEM_USED`: tampilkan error inline di form redeem.
- `subscription_required`: tampilkan state langganan tidak aktif dan minta refresh bootstrap.
- Runtime error dari `chrome.runtime.sendMessage` ditampilkan sebagai status user-friendly.
- Cookie injection failure menghentikan flow sebelum redirect/reload.
- Fetch bootstrap gagal tidak menghapus snapshot lama; popup tetap menampilkan cached data dengan notice error kecil.

## Testing dan Verification

Quality gate yang relevan:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:web`
- `pnpm build`

Data seed local di `.docs/dev-seed.md` dibutuhkan untuk manual/browser verification terhadap backend local. Seed ini tidak dipakai untuk unit test otomatis karena unit test harus tetap deterministik dan tidak bergantung pada akun/session backend.

Skenario seed yang perlu diverifikasi:

- `seed.active.browser@assetnext.dev`: state authenticated active, asset access list, optional update, near expiry jika data backend mendukung.
- `seed.processed.browser@assetnext.dev`: state processed dan warning pesanan sedang diproses.
- `seed.expired.browser@assetnext.dev`: state expired dan renewal actions.
- `seed.canceled.browser@assetnext.dev`: state canceled dan renewal actions.
- `seed.none.browser@assetnext.dev`: state none dan renewal actions.

Password seed hanya digunakan untuk login manual di web app local sebelum extension memanggil API dengan `credentials: "include"`.

Test yang perlu ditambah:

- Unit test helper platform mapping dan target URL.
- Unit test near expiry `countdownSeconds <= 259200`.
- Unit test bootstrap cache stale-while-revalidate behavior.
- Unit test version status/render decision jika helper dibuat.
- Playwright integration untuk content overlay/chooser tanpa membuat CSS bocor ke host page.

Browser verification manual:

- Popup unauthenticated membuka login URL.
- Popup authenticated menampilkan cached snapshot lalu sync avatar spinner.
- Manual Refresh bypass cache.
- Redeem success mengganti snapshot.
- Asset click inject cookie dan membuka target URL.
- Mode chooser hanya muncul saat `selection_required`.
- Logout mengganti UI ke unauthenticated dan data user lama tidak tampil.

## Batasan Scope

- Extension mengikuti kontrak API yang sudah ada, tidak mengubah backend.
- Tidak menambah abstraction layer baru di luar kebutuhan struktur di atas.
- Tidak membuat login form di extension karena auth mengikuti sesi web app.
- Tidak memakai `<all_urls>` untuk content script.
- Tidak memindahkan primitive UI dari `src/components/ui/`.
