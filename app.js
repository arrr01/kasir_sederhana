/**
 * App Controller Utama BengkelPro POS
 * Mengatur navigasi tampilan, modal, toast notifikasi, status online/offline, dan sinkronisasi
 */

const App = {
  currentView: 'pos', // 'pos', 'inventory', 'reports', 'developer', 'settings'

  init() {
    // 1. Inisialisasi Database Lokal
    StorageManager.init();

    // 2. Inisialisasi Sub-Modul
    PosApp.init();
    InventoryApp.init();
    ReportsApp.init();
    DeveloperApp.init();
    this.loadSettingsForm();

    // 3. Listener Status Jaringan (Online / Offline)
    this.initNetworkStatus();

    // 4. Registrasi Service Worker untuk PWA Offline
    this.registerServiceWorker();

    // 5. Setup Shortcut Keyboard (e.g. F2 untuk Kasir, F3 untuk Inventori, F4 untuk Laporan)
    this.initKeyboardShortcuts();

    console.log('[BengkelPro] Aplikasi Kasir & Manajemen Bengkel siap digunakan.');
  },

  /**
   * Pindah Tampilan / Menu Navigasi
   */
  switchView(viewName) {
    this.currentView = viewName;
    const views = ['pos', 'inventory', 'reports', 'developer', 'settings'];

    views.forEach(v => {
      const viewEl = document.getElementById(`view_${v}`);
      const navBtnDesktop = document.getElementById(`navDesktop_${v}`);
      const navBtnMobile = document.getElementById(`navMobile_${v}`);

      if (viewEl) {
        if (v === viewName) {
          viewEl.classList.remove('hidden');
        } else {
          viewEl.classList.add('hidden');
        }
      }

      // Update Nav Button Styles (Desktop)
      if (navBtnDesktop) {
        if (v === viewName) {
          navBtnDesktop.className = "flex items-center gap-3 px-3.5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md transition-all";
        } else {
          navBtnDesktop.className = "flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-all";
        }
      }

      // Update Nav Button Styles (Mobile)
      if (navBtnMobile) {
        if (v === viewName) {
          navBtnMobile.className = "flex flex-col items-center justify-center py-1 text-blue-600 font-bold text-xs";
        } else {
          navBtnMobile.className = "flex flex-col items-center justify-center py-1 text-slate-500 font-medium text-xs";
        }
      }
    });

    // Refresh data saat pindah view
    if (viewName === 'pos') {
      PosApp.renderProductGrid();
      PosApp.renderCart();
    } else if (viewName === 'inventory') {
      InventoryApp.renderProductsTable();
      InventoryApp.renderRestockTable();
    } else if (viewName === 'reports') {
      ReportsApp.render();
    } else if (viewName === 'developer') {
      DeveloperApp.refreshAll();
    } else if (viewName === 'settings') {
      this.loadSettingsForm();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Sistem Toast Notifikasi Modern
   */
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastId = 'toast_' + Date.now();
    const colors = {
      info: 'bg-slate-900 text-white border-slate-700',
      success: 'bg-emerald-600 text-white border-emerald-500',
      warning: 'bg-amber-600 text-white border-amber-500',
      danger: 'bg-red-600 text-white border-red-500'
    };

    const icons = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      danger: '✕'
    };

    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all transform duration-300 translate-y-4 opacity-0 ${colors[type] || colors.info}`;
    toastEl.innerHTML = `
      <span class="w-5 h-5 flex items-center justify-center font-bold text-base">${icons[type] || '•'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toastEl);

    // Fade in
    requestAnimationFrame(() => {
      toastEl.classList.remove('translate-y-4', 'opacity-0');
      toastEl.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto remove
    setTimeout(() => {
      toastEl.classList.remove('translate-y-0', 'opacity-100');
      toastEl.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => {
        if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      }, 300);
    }, duration);
  },

  /**
   * Helper Modal
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  /**
   * Monitor Status Online / Offline
   */
  initNetworkStatus() {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      const statusPill = document.getElementById('globalNetworkBadge');
      if (statusPill) {
        if (isOnline) {
          statusPill.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-semibold text-emerald-700">Online</span>
          `;
          statusPill.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200";
        } else {
          statusPill.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-xs font-semibold text-amber-700">Mode Offline</span>
          `;
          statusPill.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200";
        }
      }
    };

    window.addEventListener('online', () => {
      updateStatus();
      this.toast('Tersambung kembali ke internet (Online).', 'success');
      StorageManager.log('INFO', 'NETWORK', 'Koneksi kembali Online.');
    });

    window.addEventListener('offline', () => {
      updateStatus();
      this.toast('Internet terputus. Aplikasi tetap berfungsi normal dalam Mode Offline!', 'warning');
      StorageManager.log('WARN', 'NETWORK', 'Koneksi Offline. Menggunakan LocalStorage.');
    });

    updateStatus();
  },

  /**
   * Registrasi PWA Service Worker
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('[BengkelPro] ServiceWorker terdaftar:', reg.scope);
          StorageManager.log('INFO', 'PWA', 'ServiceWorker berhasil didaftarkan: ' + reg.scope);
        })
        .catch(err => {
          console.warn('[BengkelPro] Gagal mendaftarkan ServiceWorker:', err);
        });
    }
  },

  /**
   * Shortcut Keyboard Cepat untuk Kasir
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Jangan trigger saat mengetik di input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          // Tutup modal aktif jika ada
          const openModals = document.querySelectorAll('.fixed.flex');
          openModals.forEach(m => {
            m.classList.add('hidden');
            m.classList.remove('flex');
          });
        }
        return;
      }

      // F1 -> POS
      if (e.key === 'F1') {
        e.preventDefault();
        this.switchView('pos');
      }
      // F2 -> Inventori
      else if (e.key === 'F2') {
        e.preventDefault();
        this.switchView('inventory');
      }
      // F3 -> Laporan
      else if (e.key === 'F3') {
        e.preventDefault();
        this.switchView('reports');
      }
      // F4 / F9 -> Buka Checkout
      else if (e.key === 'F4' || e.key === 'F9') {
        e.preventDefault();
        if (this.currentView === 'pos') {
          PosApp.openCheckoutModal();
        }
      }
      // Ctrl + Shift + D -> Buka Portal Pemrogram Standalone
      else if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        window.open('developer.html', '_blank');
      }
    });
  },

  /**
   * Buka Modal Bantuan & Lapor Kendala via WhatsApp
   */
  openTroubleModal() {
    const netDiag = document.getElementById('troubleNetDiag');
    const trxDiag = document.getElementById('troubleTrxDiag');
    const prodDiag = document.getElementById('troubleProdDiag');
    const deviceDiag = document.getElementById('troubleDeviceDiag');
    const detailInput = document.getElementById('troubleDetail');

    if (netDiag) netDiag.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE (Lokal)';
    if (trxDiag) trxDiag.textContent = StorageManager.getTransactions().length + ' Transaksi';
    if (prodDiag) prodDiag.textContent = StorageManager.getProducts().length + ' Produk';
    if (deviceDiag) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      deviceDiag.textContent = isMobile ? 'Perangkat HP / Tablet' : 'Desktop PC / Laptop';
    }
    if (detailInput) detailInput.value = '';

    this.openModal('troubleReportModal');
  },

  /**
   * Kirim Laporan Kendala Otomatis ke WhatsApp Programmer
   */
  sendTroubleReportWhatsApp() {
    const settings = StorageManager.getSettings();
    const devPhone = (settings.devWhatsapp || '6282220869361').replace(/[^0-9]/g, '');
    const category = document.getElementById('troubleCategory') ? document.getElementById('troubleCategory').value : 'Kendala Umum';
    const detail = document.getElementById('troubleDetail') ? document.getElementById('troubleDetail').value.trim() : '';

    const trxs = StorageManager.getTransactions();
    const prods = StorageManager.getProducts();

    const msg = `*LAPORAN KENDALA APLIKASI BENGKEL*
Bengkel: *${settings.name}*
Alamat: ${settings.address}
Waktu: ${new Date().toLocaleString('id-ID')}
Kasir Bertugas: ${settings.cashierName}

--------------------------------------
*Jenis Kendala:*
👉 *${category}*

*Keterangan Keluhan:*
${detail || '(Tidak ada catatan tambahan)'}
--------------------------------------

*Diagnostik Sistem Otomatis:*
- Status Koneksi: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}
- Total Transaksi Tercatat: ${trxs.length}
- Total Item Inventori: ${prods.length}
- Versi Aplikasi: BengkelPro v2.1 Standalone

Mohon bantuan tim pemrogram/teknisi IT untuk kendala ini. Terima kasih!`;

    const encoded = encodeURI(msg);
    window.open(`https://api.whatsapp.com/send?phone=${devPhone}&text=${encoded}`, '_blank');
    this.closeModal('troubleReportModal');
    this.toast('Menghubungkan ke WhatsApp Teknisi Support...', 'info');
  },

  /**
   * Pengaturan Bengkel
   */
  loadSettingsForm() {
    const s = StorageManager.getSettings();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('settingWorkshopName', s.name);
    setVal('settingTagline', s.tagline);
    setVal('settingAddress', s.address);
    setVal('settingPhone', s.phone);
    setVal('settingReceiptFooter', s.receiptFooter);
    setVal('settingCashierName', s.cashierName);
    setVal('settingDevPin', s.devPin || '1234');
    setVal('settingDevWhatsapp', s.devWhatsapp || '6281234567890');
    setVal('settingPrinterWidth', s.printerWidth || '58mm');

    // Update Brand Display di Sidebar & Header
    const brandNameEls = document.querySelectorAll('.workshop-brand-name');
    brandNameEls.forEach(el => el.textContent = s.name);
  },

  saveSettingsForm() {
    const s = {
      name: document.getElementById('settingWorkshopName').value.trim() || 'Bengkel Motor',
      tagline: document.getElementById('settingTagline').value.trim(),
      address: document.getElementById('settingAddress').value.trim(),
      phone: document.getElementById('settingPhone').value.trim(),
      receiptFooter: document.getElementById('settingReceiptFooter').value.trim(),
      cashierName: document.getElementById('settingCashierName').value.trim() || 'Kasir',
      devPin: document.getElementById('settingDevPin').value.trim() || '1234',
      devWhatsapp: document.getElementById('settingDevWhatsapp') ? document.getElementById('settingDevWhatsapp').value.trim() || '6281234567890' : '6281234567890',
      printerWidth: document.getElementById('settingPrinterWidth') ? document.getElementById('settingPrinterWidth').value : '58mm',
      taxPercent: 0,
      currency: "IDR"
    };

    StorageManager.saveSettings(s);
    if (typeof PosApp !== 'undefined' && PosApp.setPaperWidth) {
      PosApp.setPaperWidth(s.printerWidth);
    }
    this.loadSettingsForm();
    this.toast('Pengaturan profil bengkel & printer thermal berhasil disimpan!', 'success');
  },

  /**
   * Buka Modal Hapus & Reset Data
   * @param {string} context - 'pos' | 'inventory' | 'reports'
   */
  _resetContext: null,
  openResetModal(context) {
    this._resetContext = context;
    const subtitleEl = document.getElementById('resetModalSubtitle');
    const optionsEl = document.getElementById('resetOptions');
    const inputEl = document.getElementById('resetNewDataInput');
    if (inputEl) inputEl.value = '';

    const configs = {
      pos: {
        subtitle: 'Menu Kasir Servis (POS) — Keranjang & Katalog Produk',
        options: [
          { key: 'cart',     label: '🛒 Kosongkan Keranjang Belanja Aktif',       danger: false },
          { key: 'products', label: '📦 Reset Katalog Produk ke Data Bawaan',      danger: true  },
        ]
      },
      inventory: {
        subtitle: 'Menu Barang & Restock — Stok & Riwayat Masuk',
        options: [
          { key: 'products', label: '📦 Hapus & Reset Semua Data Produk ke Bawaan', danger: true  },
          { key: 'restocks', label: '📋 Hapus Seluruh Riwayat Restock Masuk',       danger: true  },
        ]
      },
      reports: {
        subtitle: 'Menu Laporan Laba / Rugi — Riwayat Transaksi',
        options: [
          { key: 'transactions', label: '🧾 Hapus Semua Riwayat Transaksi Penjualan', danger: true },
        ]
      }
    };

    const cfg = configs[context];
    if (!cfg) return;

    if (subtitleEl) subtitleEl.textContent = cfg.subtitle;
    if (optionsEl) {
      optionsEl.innerHTML = cfg.options.map((opt, i) => `
        <label class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all ${opt.danger ? 'border-red-200 bg-red-50/50' : 'border-slate-200'}">
          <input type="checkbox" name="resetOpt" value="${opt.key}" class="mt-0.5 w-4 h-4 accent-red-600">
          <span class="text-xs font-semibold ${opt.danger ? 'text-red-700' : 'text-slate-700'}">${opt.label}</span>
        </label>
      `).join('');
    }

    const modal = document.getElementById('resetDataModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  /**
   * Eksekusi reset berdasarkan opsi yang dipilih
   */
  executeReset() {
    const context = this._resetContext;
    const checkedBoxes = document.querySelectorAll('input[name="resetOpt"]:checked');
    const selectedKeys = Array.from(checkedBoxes).map(cb => cb.value);
    const newDataRaw = (document.getElementById('resetNewDataInput') || {}).value || '';

    if (selectedKeys.length === 0) {
      this.toast('Pilih minimal satu opsi data yang ingin dihapus/direset!', 'warning');
      return;
    }

    let newDataParsed = null;
    if (newDataRaw.trim()) {
      try {
        newDataParsed = JSON.parse(newDataRaw.trim());
      } catch (e) {
        this.toast('Format JSON tidak valid. Periksa kembali data yang Anda masukkan.', 'error');
        return;
      }
    }

    selectedKeys.forEach(key => {
      switch (key) {
        case 'cart':
          if (typeof PosApp !== 'undefined') {
            PosApp.cart = [];
            PosApp.renderCart();
            PosApp.renderProductGrid();
          }
          break;
        case 'products':
          const newProds = Array.isArray(newDataParsed) ? newDataParsed : INITIAL_PRODUCTS;
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProds));
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
          if (typeof PosApp !== 'undefined') {
            PosApp.renderCategoryTabs();
            PosApp.renderProductGrid();
          }
          if (typeof InventoryApp !== 'undefined') {
            InventoryApp.populateCategorySelects();
            InventoryApp.renderProductsTable();
          }
          break;
        case 'restocks':
          const newRestocks = Array.isArray(newDataParsed) ? newDataParsed : [];
          localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(newRestocks));
          if (typeof InventoryApp !== 'undefined') {
            InventoryApp.renderRestockTable();
          }
          break;
        case 'transactions':
          const newTrx = Array.isArray(newDataParsed) ? newDataParsed : [];
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTrx));
          if (typeof ReportsApp !== 'undefined') {
            ReportsApp.render();
          }
          break;
      }
    });

    this.closeModal('resetDataModal');
    this.toast('✅ Data berhasil dihapus & direset!', 'success');
  }
};

// Jalankan aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
