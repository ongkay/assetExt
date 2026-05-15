# Peer Guard E2E Manual Test Plan

Dokumen ini dipakai untuk verifikasi browser-level pada flow dual-extension protection:

- `ext-1`: Asset Manager ext-1
- `ext-2`: Asset Manager ext-2

Scope dokumen ini fokus pada behavior saat salah satu extension dimatikan, session dibersihkan, dan tab asset aktif dipaksa keluar ke warning page internal.

## Prasyarat

1. Jalankan `pnpm build`.
2. Buka `chrome://extensions`.
3. Aktifkan `Developer mode`.
4. Load unpacked:
   - `dist/ext-1`
   - `dist/ext-2`
5. Pastikan dua extension aktif bersamaan.
6. Login normal lewat flow aplikasi sampai akses asset aktif.

## Domain Yang Termasuk Asset

Tab yang wajib dipaksa keluar saat peer extension mati:

- `tradingview.com`
- `*.tradingview.com`
- `forextester.com`
- `*.forextester.com`

Tab yang tidak boleh ikut dipaksa keluar:

- `whoer.net`
- `*.whoer.net`
- `browserscan.net`
- `*.browserscan.net`
- tab browser lain yang bukan asset

## Test Matrix

### 1. Baseline Healthy Pair

Langkah:

1. Aktifkan `ext-1` dan `ext-2`.
2. Login normal.
3. Buka popup `ext-1`.
4. Buka tab asset berikut:
   - `https://www.tradingview.com/chart/`
   - `https://forextester.com/`

Ekspektasi:

- popup `ext-1` tampil normal
- asset access normal
- tidak ada warning page internal yang terbuka

### 2. Disable ext-2 Saat Tab Asset Aktif

Langkah:

1. Dengan session masih aktif, biarkan tab TradingView dan ForexTester tetap terbuka.
2. Tambahkan juga tab berikut:
   - `https://whoer.net/`
   - `https://browserscan.net/`
3. Matikan `ext-2` dari `chrome://extensions`.

Ekspektasi:

- semua tab `tradingview.com` dan `forextester.com` langsung berubah ke `ext-1-blocked.html`
- tab `whoer.net` tidak berubah
- tab `browserscan.net` tidak berubah
- tab non-asset lain tidak berubah
- popup `ext-1` masuk blocked state
- session asset tidak bisa dipakai lagi tanpa aktivasi ulang dua extension dan login ulang

### 3. Disable ext-1 Saat Tab Asset Aktif

Langkah:

1. Aktifkan lagi `ext-2`, lalu aktifkan ulang `ext-1` dan login kembali.
2. Buka ulang tab TradingView dan ForexTester.
3. Matikan `ext-1` dari `chrome://extensions`.

Ekspektasi:

- semua tab `tradingview.com` dan `forextester.com` langsung berubah ke `ext-2-blocked.html`
- tab `whoer.net` tidak berubah
- tab `browserscan.net` tidak berubah
- `ext-2` tetap hidup dan menampilkan warning/fallback behavior yang sesuai

### 4. Disable Peer Saat Tidak Ada Tab Asset Aktif

Langkah:

1. Tutup semua tab TradingView dan ForexTester.
2. Sisakan hanya tab biasa atau tab `whoer.net` / `browserscan.net`.
3. Matikan salah satu extension.

Ekspektasi:

- tidak ada tab non-asset yang dipaksa keluar
- extension yang masih aktif tetap membuka atau memfokuskan warning page internal
- blocked state tetap tersimpan

### 5. Logout Session Benar-Benar Terjadi

Langkah:

1. Setelah salah satu extension dimatikan, aktifkan kembali extension yang mati agar pasangan kembali lengkap.
2. Tutup warning page bila perlu.
3. Buka ulang TradingView dan ForexTester.
4. Buka popup `ext-1`.

Ekspektasi:

- user tidak kembali ke session lama secara otomatis
- popup `ext-1` tidak langsung menganggap session lama masih valid
- user harus login/bootstrap ulang

### 6. Recovery Setelah Dua Extension Aktif Lagi

Langkah:

1. Aktifkan kembali dua extension.
2. Klik `Periksa ulang` pada warning page jika ada.
3. Login ulang.
4. Coba akses TradingView dan ForexTester lagi.

Ekspektasi:

- blocked state hilang setelah peer kembali sehat
- login ulang berhasil
- akses asset kembali normal

### 7. Warning Tab Tidak Spam

Langkah:

1. Ulangi disable/enable peer beberapa kali.
2. Perhatikan jumlah warning page internal yang terbuka.

Ekspektasi:

- warning page tidak membuka tab duplikat berlebihan
- behavior yang diterima:
  - tab asset aktif di-replace ke warning page, atau
  - satu warning page difokuskan saat tidak ada tab asset aktif

### 8. Multi-Tab Asset Coverage

Langkah:

1. Buka beberapa tab asset sekaligus:
   - 2+ tab TradingView
   - 2+ tab ForexTester
2. Matikan salah satu extension.

Ekspektasi:

- semua tab asset aktif ikut di-replace
- tidak ada tab asset yang lolos dan tetap tinggal di halaman asli

## Evidence Yang Disarankan

Saat menjalankan verifikasi manual, simpan evidence berikut jika perlu:

1. screenshot `chrome://extensions` saat dua extension aktif
2. screenshot tab asset sebelum peer dimatikan
3. screenshot tab asset setelah berubah ke warning page internal
4. screenshot popup `ext-1` saat blocked
5. catatan apakah `whoer.net` dan `browserscan.net` tetap tidak berubah

## Exit Criteria

Verifikasi dianggap lulus bila semua kondisi berikut terpenuhi:

1. mematikan `ext-1` atau `ext-2` langsung memutus semua tab asset aktif
2. hanya domain asset yang terkena replace
3. `whoer.net` dan `browserscan.net` tidak ikut terdampak
4. user tidak bisa lanjut memakai session lama tanpa mengaktifkan kembali dua extension
5. setelah recovery, login ulang diperlukan sebelum akses asset normal kembali
