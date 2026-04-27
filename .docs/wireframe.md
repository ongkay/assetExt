# Extension UI ASCII

Dokumen ini menyimpan wireframe ASCII awal untuk browser extension Asset Manager berdasarkan `PRD.md` dan `extension-v2-api.md`.

## Visual Direction

- Pola utama: balanced card layout
- Basis popup: utility panel gelap, rapi, ringkas
- Aksen semantik:
  - hijau untuk active/success
  - amber untuk processed/update available
  - merah untuk expired/update required
- Satu CTA utama per konteks
- Lebar target popup mengikuti template repo saat ini: sekitar `332px`

## State 1: Unauthenticated

```text
+----------------------------------+
| [Logo] Asset Manager v2.0        |
| Premium Access Extension         |
+----------------------------------+
|                                  |
|  Anda belum login ke web app.    |
|  Login diperlukan untuk sinkron  |
|  akun dan akses asset premium.   |
|                                  |
|  +----------------------------+  |
|  |          Login             |  |
|  +----------------------------+  |
|                                  |
|  membuka: localhost:3000/login   |
+----------------------------------+
```

## State 2: Authenticated + Active

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SA] |
| Premium Access Extension         |
+----------------------------------+
| [!] Update tersedia. Harap update|
|     untuk fitur optimal.         |
+----------------------------------+
| Status      : [ACTIVE]           |
| Paket       : Paket 3            |
| Expired At  : 01 May 2026        |
| Countdown   : 06d 04h 12m 09s    |
+----------------------------------+
| Akses Asset                      |
| +----------------------------+   |
| | TradingView            ->  |   |
| | share access available     |   |
| +----------------------------+   |
| +----------------------------+   |
| | FXReplay               ->  |   |
| | private access available   |   |
| +----------------------------+   |
| +----------------------------+   |
| | FXTester               ->  |   |
| | ready to inject            |   |
| +----------------------------+   |
+----------------------------------+
| [ Logout ]              [ Refresh]|
+----------------------------------+
```

## State 2b: Authenticated + Processed

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SP] |
| Premium Access Extension         |
+----------------------------------+
| Status      : [PROCESSED]        |
| Paket       : Paket 2            |
| Expired At  : 10 Jun 2026        |
| Countdown   : 11d 09h 40m 22s    |
+----------------------------------+
| [!] Pesanan sedang diproses      |
|     admin, mohon tunggu.         |
+----------------------------------+
| Akses Asset                      |
| +----------------------------+   |
| | TradingView            ->  |   |
| | akses aktif setelah sync    |   |
| +----------------------------+   |
+----------------------------------+
| [ Logout ]              [ Refresh]|
+----------------------------------+
```

## State 2c: Authenticated + Near Expiry

Jika countdown sisa `<= 3 hari`, tampilkan warning dan button renewal seperti state 3.

Default:

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SA] |
| Premium Access Extension         |
+----------------------------------+
| Status      : [ACTIVE]           |
| Paket       : Paket 3            |
| Expired At  : 01 May 2026        |
| Countdown   : 02d 14h 12m 09s    |
+----------------------------------+
| [!] Paket Anda akan berakhir     |
|     dalam 3 hari. Segera         |
|     perpanjang agar akses tidak  |
|     terputus.                    |
+----------------------------------+
| [ Pilih Paket ] [ Redeem CDKey ] |
+----------------------------------+
| Akses Asset                      |
| +----------------------------+   |
| | TradingView            ->  |   |
| | share access available     |   |
| +----------------------------+   |
| +----------------------------+   |
| | FXReplay               ->  |   |
| | private access available   |   |
| +----------------------------+   |
+----------------------------------+
| [ Logout ]              [ Refresh]|
+----------------------------------+
```

Saat `Pilih Paket` dibuka:

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SA] |
| Premium Access Extension         |
+----------------------------------+
| Status      : [ACTIVE]           |
| Paket       : Paket 3            |
| Countdown   : 02d 14h 12m 09s    |
+----------------------------------+
| [!] Paket Anda akan berakhir     |
|     dalam 3 hari.                |
+----------------------------------+
| [*Pilih Paket*] [ Redeem CDKey ] |
+----------------------------------+
| Paket Tersedia                   |
| +----------------------------+   |
| | Paket 1            Rp 99k  |   |
| | basic access              >|   |
| +----------------------------+   |
| +----------------------------+   |
| | Paket 2           Rp 150k  |   |
| | mixed access              >|   |
| +----------------------------+   |
| +----------------------------+   |
| | Paket 3           Rp 250k  |   |
| | full access               >|   |
| +----------------------------+   |
+----------------------------------+
```

Saat `Redeem CDKey` dibuka:

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SA] |
| Premium Access Extension         |
+----------------------------------+
| Status      : [ACTIVE]           |
| Paket       : Paket 3            |
| Countdown   : 02d 14h 12m 09s    |
+----------------------------------+
| [!] Paket Anda akan berakhir     |
|     dalam 3 hari.                |
+----------------------------------+
| [ Pilih Paket ] [*Redeem CDKey*] |
+----------------------------------+
| Redeem CDKey                     |
| +----------------------------+   |
| | ABCD123456                 |   |
| +----------------------------+   |
| [ Redeem Sekarang ]              |
| Jika berhasil, paket diperbarui  |
| tanpa menunggu expired.          |
+----------------------------------+
```

## State Profile: Authenticated User Info

```text
+----------------------------------+
| [< Kembali] Profile        [SA]  |
| Account Information             |
+----------------------------------+
|            (avatar)             |
|      seed-active-browser        |
|      seed@asset.dev             |
|      MEM-BRW-01                 |
+----------------------------------+
| [ Logout ]                      |
+----------------------------------+
```

Fallback avatar jika `avatarUrl` null:

```text
+----------------------------------+
| [< Kembali] Profile        [SB]  |
| Account Information             |
+----------------------------------+
|             ( SB )              |
|        seed-basic-user          |
|        user@asset.dev           |
|        MEM-BRW-77               |
+----------------------------------+
| [ Logout ]                      |
+----------------------------------+
```

## State 3: Expired / No Subscription

Default:

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SB] |
| Premium Access Extension         |
+----------------------------------+
| Status : [EXPIRED]               |
| Langganan Anda sudah berakhir.   |
| Aktifkan kembali akses melalui   |
| salah satu opsi di bawah.        |
+----------------------------------+
| [ Pilih Paket ] [ Redeem CDKey ] |
+----------------------------------+
```

Saat `Pilih Paket` dibuka:

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SB] |
| Premium Access Extension         |
+----------------------------------+
| Status : [EXPIRED]               |
| Langganan Anda sudah berakhir.   |
+----------------------------------+
| [*Pilih Paket*] [ Redeem CDKey ] |
+----------------------------------+
| Paket Tersedia                   |
| +----------------------------+   |
| | Paket 1            Rp 99k  |   |
| | basic access              >|   |
| +----------------------------+   |
| +----------------------------+   |
| | Paket 2           Rp 150k  |   |
| | mixed access              >|   |
| +----------------------------+   |
| +----------------------------+   |
| | Paket 3           Rp 250k  |   |
| | full access               >|   |
| +----------------------------+   |
+----------------------------------+
```

Saat `Redeem CDKey` dibuka:

```text
+----------------------------------+
| [Logo] Asset Manager v2.0   [SB] |
| Premium Access Extension         |
+----------------------------------+
| Status : [NONE]                  |
| Belum ada paket aktif.           |
+----------------------------------+
| [ Pilih Paket ] [*Redeem CDKey*] |
+----------------------------------+
| Redeem CDKey                     |
| +----------------------------+   |
| | ABCD123456                 |   |
| +----------------------------+   |
| [ Redeem Sekarang ]              |
| Jika berhasil, status berubah    |
| ke Active otomatis.              |
+----------------------------------+
```

Interaksi yang dipilih:

- `Pilih Paket` dan `Redeem CDKey` adalah button toggle, bukan tabs tradisional
- Default: tidak ada panel terbuka
- Klik satu button membuka panel terkait
- Klik button aktif lagi menutup panel
- Saat satu panel dibuka, panel lain tertutup

## State 4: Update Required

```text
+----------------------------------+
| [Logo] Asset Manager v1.2        |
| Premium Access Extension         |
+----------------------------------+
|                                  |
|              [X]                 |
|      Versi ini sudah tidak       |
|       didukung. Anda wajib       |
|        melakukan upgrade.        |
|                                  |
|  +----------------------------+  |
|  |   Download New Version     |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

## Loading State: Refresh Bootstrap Skeleton

```text
+----------------------------------+
| [Logo] Asset Manager v2.0  [..]  |
| Premium Access Extension   [--]  |
+----------------------------------+
| [ skeleton      ] [ skeleton ]   |
| [ skeleton      ] [ skeleton ]   |
| [ skeleton      ] [ skeleton ]   |
+----------------------------------+
| [ skeleton                   ]   |
| [ skeleton                   ]   |
| [ skeleton                   ]   |
+----------------------------------+
| [ skeleton ]        [ skeleton ] |
+----------------------------------+
```

## Overlay: Preparing Access

```text
               .--------------------------.
               |   Menyiapkan akses aset  |
               |                          |
               |       [ spinner ]        |
               |                          |
               |   Sinkron cookie aman    |
               |   Mohon tunggu...        |
               '--------------------------'
```

## Overlay: Mode Chooser

```text
+--------------------------------------+
| Pilih mode akses TradingView         |
+--------------------------------------+
| Anda memiliki dua tipe akses.        |
| Pilih mode sebelum injeksi cookie.   |
| Auto pilih private dalam 10 detik.   |
+--------------------------------------+
| +----------------------------------+ |
| | Private                          | |
| | sesi personal, prioritas utama   | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Share                            | |
| | sesi bersama, fallback cepat     | |
| +----------------------------------+ |
+--------------------------------------+
|  Auto select in: 00:10              |
+--------------------------------------+
```

## Flow Klik Asset Button

```text
[Klik TradingView]
      |
      v
[Clear old cookies]
      |
      v
[Fetch /api/ext/asset?platform=tradingview]
      |
      +--> jika selection_required -> chooser
      |
      v
[Inject all returned cookies by domain]
      |
      v
[Open / refresh target page]
      |
      v
[Heartbeat tiap 5 menit]
```

## UX Notes

- Refresh icon berada di header kanan dan berubah menjadi spinner saat fetch bootstrap
- Countdown sebaiknya memakai angka tabular agar tidak bergoyang saat update per detik
- `Processed` harus terlihat jelas tanpa terasa seperti hard error
- `Logout` dipisahkan dari CTA asset untuk mengurangi salah klik
- Asset card menampilkan sublabel akses, bukan hanya nama platform
