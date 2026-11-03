# 🏍️ BengkelPro POS - Aplikasi Kasir & Manajemen Bengkel Motor / Mobil

Aplikasi Kasir (Point of Sale), Manajemen Stok Sparepart, dan Pembukuan Keuangan Bengkel yang dirancang khusus untuk pelaku usaha mikro, kecil, dan menengah (UMKM) di Indonesia. Sangat mudah digunakan oleh mekanik maupun kasir non-teknis, serta dapat beroperasi secara **100% Offline (tanpa internet)** maupun **Online**.

---

## 🌟 Fitur Utama

### 1. 🛒 Kasir & Servis Cepat (POS)
* **Katalog Visual Touch-Friendly:** Tata letak grid kartu produk dengan foto/ikon, harga jual, dan status stok real-time.
* **Filter Kategori Cepat:** Oli & Pelumas, Ban & Kaki-Kaki, Sparepart Mesin & CVT, Kelistrikan & Aki, Rem & Suspensi, serta Jasa Servis.
* **Pencarian Instan:** Cari cepat berdasarkan nama barang atau barcode/kode SKU.
* **Identitas Kendaraan Pelanggan (Konteks Bengkel):**
  * Nomor Plat Kendaraan (otomatis huruf kapital, misal `B 1234 XYZ`).
  * Nama Pelanggan / Pemilik.
  * Tipe Kendaraan (Beat, Vario, NMAX, Mobil, dll.) & Kilometer (KM).
  * Catatan keluhan mekanik.
* **Kalkulasi & Diskon:** Subtotal, input potongan diskon (dalam Rupiah maupun persentase `%`), dan grand total otomatis.
* **Metode Pembayaran Lengkap:**
  * **Tunai (Cash):** Tombol pecahan cepat (Uang Pas, Rp 20.000, Rp 50.000, Rp 100.000, Rp 200.000, Rp 500.000) dan kalkulator kembalian otomatis.
  * **Transfer Bank:** Pilihan rekening BCA, Mandiri, BRI dengan tombol salin nomor rekening 1-klik.
  * **QRIS Standar Nasional:** Tampilan QRIS interaktif untuk pembayaran via dompet digital / m-banking.
* **Struk & Nota Bengkel:**
  * Format cetak thermal standar 58mm / 80mm (`window.print()`).
  * Rincian sparepart, oli, dan biaya jasa mekanik terpisah rapi.
  * Syarat garansi servis & ucapan terima kasih.
  * **Kirim Struk ke WhatsApp:** 1-klik kirim rincian nota langsung ke nomor WhatsApp pelanggan.

---

### 2. 📦 Manajemen Inventori & Restock Barang (Owner)
* **Katalog Sparepart & Jasa:** Kelola harga beli modal (HPP), harga jual, batas minimum stok (alert menipis), dan satuan (Botol, Pcs, Set, Jasa).
* **Indikator Stok Otomatis:**
  * 🟢 Stok Aman
  * 🟡 Stok Kritis (Menipis di bawah batas minimum)
  * 🔴 Stok Habis (0)
* **Fitur Restock Barang Masuk:** Pemilik dapat menambah stok belanja dari supplier, memperbarui harga modal terbaru jika ada kenaikan harga, dan mencatat nama supplier.
* **Riwayat Mutasi Restock:** Tersimpan rapi mencakup tanggal masuk, jumlah unit, harga beli, dan total biaya belanja.
* **Ekspor CSV:** Unduh seluruh data stok barang ke file CSV (kompatibel dengan Microsoft Excel).

---

### 3. 📊 Laporan Keuangan & Laba Rugi (Owner Finance)
* **Filter Rentang Waktu:**
  * **Hari Ini**
  * **Per Minggu (7 Hari Terakhir)**
  * **Per Bulan (30 Hari Terakhir)**
  * **Per Tahun (1 Tahun Berjalan)**
  * **Semua Periode**
* **4 Kartu Metrik Finansial:**
  * **Total Omset (Pendapatan Kotor)**
  * **Total Modal (HPP Sparepart Terjual)**
  * **Laba Bersih (Keuntungan Nyata)**
  * **Persentase Margin Keuntungan (%)** & Total Unit Kendaraan Diservis.
* **Analisa Kerugian & Resiko:** Sistem otomatis mendeteksi jika ada barang yang dijual rugi di bawah harga modal atau transaksi dengan diskon berlebih.
* **Grafik Interaktif (Chart.js):**
  * Grafik Batang Tren Finansial (Omset vs Modal vs Laba).
  * Donut Chart Komposisi Penjualan: Penjualan Sparepart Fisik vs Pendapatan Jasa Servis Mekanik.
* **Riwayat Transaksi & Pembatalan:** Cari transaksi berdasarkan plat nomor, cetak ulang nota kapan saja, atau batalkan transaksi (stok otomatis dikembalikan).

---

### 4. 🛠️ Panel Khusus Pemrogram / Troubleshoot (Tech Support)
Dibuat khusus untuk programmer atau teknisi support jika bengkel mengalami masalah di lapangan:
* **Akses Keamanan:** Dilindungi PIN Pemrogram (Default: `1234` atau dapat disesuaikan di menu pengaturan).
* **Shortcut Cepat:** Tekan `Ctrl + Shift + D` dari halaman mana saja.
* **Fitur Pemrogram:**
  1. **Uji Integritas & Diagnostik Sistem:**
     * Deteksi stok negatif.
     * Deteksi anomali perhitungan pembukuan & foreign key kategori.
     * Tombol **"Auto-Fix Data"** untuk menormalkan stok dan hitung ulang ledger seketika.
  2. **Raw Database Explorer & Live JSON Editor:**
     * Lihat dan edit langsung tabel mentah JSON (`products`, `transactions`, `restocks`, `categories`, `settings`, `logs`).
     * Dilengkapi fungsi *Prettify JSON* dan validasi sintaks sebelum disimpan.
  3. **Log Sistem & Error Tracker:**
     * Menangkap error JavaScript (`window.onerror` dan `unhandledrejection`) secara otomatis.
     * Filter level log (INFO, WARN, ERROR, SUCCESS) dan tombol unduh log ke file `.txt`.
  4. **Disaster Recovery & Emergency Tools:**
     * **Unduh Full Backup JSON:** Salin seluruh database bengkel ke 1 file.
     * **Restore Database:** Pulihkan database dari file backup jika komputer/browser ganti atau error.
     * **Inject Data Simulasi:** Tambah 5-10 transaksi contoh secara otomatis.
     * **Factory Reset:** Kembalikan aplikasi ke setelan bawaan pabrik jika diperlukan.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Langsung (Offline Tanpa Server)
Cukup klik dua kali (double-click) file `index.html` menggunakan browser modern (Google Chrome, Microsoft Edge, Mozilla Firefox). Seluruh data akan otomatis tersimpan di memori browser (`LocalStorage`).

### Opsi 2: Menjalankan dengan Local Web Server (Rekomendasi untuk PWA)
Buka terminal / PowerShell di folder proyek ini:
```powershell
python -m http.server 8080
```
Buka browser dan akses:
```
http://localhost:8080
```
Pada browser Chrome/Edge, klik ikon **"Install App"** di bilah alamat untuk menginstal BengkelPro sebagai aplikasi desktop/aplikasi HP yang bisa dibuka dari ikon layar utama.

### Opsi 3: Di-onlinekan (Cloud Hosting Gratis)
Unggah folder proyek ini ke layanan hosting statis seperti:
* **Vercel**
* **Netlify**
* **GitHub Pages**
Aplikasi akan langsung online dan bisa diakses bersama dari HP kasir, tablet mekanik di pit servis, dan laptop pemilik bengkel dari rumah.

---

## ⌨️ Shortcut Keyboard Cepat
* `F1` : Buka Halaman Kasir (POS)
* `F2` : Buka Halaman Barang & Restock
* `F3` : Buka Halaman Laba / Rugi
* `F4` / `F9` : Buka Modal Checkout / Pembayaran
* `Escape` : Tutup Semua Modal Popup
* `Ctrl + Shift + D` : Buka Portal Pemrogram (`developer.html`)

---

## 🖨️ Panduan Cetak Struk Printer Thermal (58mm & 80mm)
Aplikasi mendukung semua merk printer kasir thermal (Panda, Eppos, VSC, Iware, Xprinter, Epson, Mini Bluetooth 58mm/80mm):
1. Saat menyelesaikan transaksi atau klik **Cetak Nota**, pilih ukuran kertas:
   * **58 mm (Mini)** : Untuk printer thermal Bluetooth portable / kasir mini.
   * **80 mm (Besar)** : Untuk printer kasir desktop POS meja.
2. Klik tombol **Cetak Thermal** (atau **Cetak Langsung Bluetooth** jika memakai Android/Tablet/Laptop ber-Bluetooth).
3. Pada jendela dialog cetak printer browser:
   * **Destination / Tujuan** : Pilih Printer Thermal Anda.
   * **Margins** : Pilih **None** (Tanpa Margin).
   * **Headers and Footers** : Hilangkan centang agar URL browser tidak tercetak.

---

## 💬 Fitur Bantuan & Hubungi WhatsApp Programmer (0822-2086-9361)
Bagi staf dan kasir bengkel, jika terjadi kendala atau trouble sistem:
* **Tombol Hubungi WA Teknisi** tersedia di header dan sidebar aplikasi.
* Terkoneksi langsung ke nomor WhatsApp teknisi/programmer: **`0822-2086-9361`** (`6282220869361`).
* Pilih jenis kendala (Printer thermal macet, stok barang selisih, transaksi error, dll).
* Klik **Kirim Laporan via WhatsApp**. Sistem otomatis merangkum data diagnostik (status koneksi, jumlah transaksi, total produk, jenis perangkat) ke pesan WhatsApp.
* Programmer dapat langsung membuka portal pemeliharaan di:
  🔗 `developer.html` (dilindungi PIN keamanan: `1234`).

---

## 🧾 Bukti Pembayaran Lunas & Cetak Struk Servis Motor
Sistem menyediakan dua format tampilan nota pasca transaksi:
1. **🧾 Struk Thermal Servis Motor (58mm / 80mm):**
   * Rincian sparepart & oli motor vs jasa servis mekanik terpisah rapi.
   * Identitas motor lengkap: Nomor Plat, Pemilik, Tipe Motor, KM saat ini.
   * **Rekomendasi Servis & Ganti Oli Berkala Berikutnya** otomatis dihitung (+2.000 KM atau 1 bulan).
   * Keterangan masa garansi servis motor (7 hari).
   * Cetak bebas margin via dialog printer atau kirim langsung Bluetooth ESC/POS.
2. **💳 Bukti Pembayaran Digital (Tanda Lunas Resmi):**
   * Format voucher digital dengan badge hijau "✓ LUNAS".
   * Tombol 1-klik kirim rincian nota lengkap ke WhatsApp pelanggan.

---

## 🏢 Struktur Berkas Proyek
```text
bengkel-pos/
├── index.html          # Antarmuka kasir & website utama (Kasir, Stok, Laporan, Bantuan WA)
├── developer.html      # Portal Mandiri Khusus Pemrogram & Super Admin (PIN: 1234)
├── manifest.json       # PWA Web App Manifest
├── sw.js               # Service Worker untuk dukungan Offline Cache
├── css/
│   └── style.css       # Styling kustom & CSS Thermal Print 58mm/80mm
├── js/
│   ├── data.js         # Mock data awal (Profil bengkel, sparepart & riwayat transaksi)
│   ├── storage.js      # Storage Manager (LocalStorage, logger, backup, integritas data)
│   ├── pos.js          # Logika kasir, keranjang, kalkulasi & cetak nota thermal
│   ├── inventory.js    # Logika inventori, form produk, restock & ekspor CSV
│   ├── reports.js      # Perhitungan laba rugi mingguan/bulanan/tahunan & grafik Chart.js
│   ├── developer.js    # Panel diagnostik, live JSON editor & disaster recovery pemrogram
│   └── app.js          # Controller utama, routing navigasi, toast & WhatsApp trouble handler
└── README.md           # Panduan lengkap sistem
```
