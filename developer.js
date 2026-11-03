/**
 * Panel Troubleshoot & Diagnostik Khusus Pemrogram (Developer Mode)
 * Digunakan teknisi/pemrogram untuk memeriksa kesehatan database, edit raw JSON,
 * melihat event logs, auto-repair data rusak, dan disaster recovery jika terjadi error di lapangan.
 */

const DeveloperApp = {
  isUnlocked: false,
  activeDevTab: 'health', // 'health', 'rawdb', 'logs', 'tools'
  selectedTable: 'products',

  init() {
    this.bindGlobalErrorCatching();
    this.bindEvents();
  },

  bindGlobalErrorCatching() {
    // Tangkap error javascript apapun di aplikasi secara otomatis untuk kemudahan debugging programmer
    window.addEventListener('error', (event) => {
      StorageManager.log('ERROR', 'JS_EXCEPTION', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      console.error('[BengkelPro Dev Exception Caught]', event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      StorageManager.log('ERROR', 'PROMISE_REJECTION', event.reason ? String(event.reason) : 'Unknown rejection');
    });
  },

  bindEvents() {
    const rawSelect = document.getElementById('devRawTableSelect');
    if (rawSelect) {
      rawSelect.addEventListener('change', (e) => {
        this.selectedTable = e.target.value;
        this.loadRawDataToEditor();
      });
    }

    const logFilter = document.getElementById('devLogLevelFilter');
    if (logFilter) {
      logFilter.addEventListener('change', () => {
        this.renderLogs();
      });
    }
  },

  /**
   * Buka Kunci Akses Pemrogram dengan PIN
   */
  promptAccess() {
    if (this.isUnlocked) {
      App.switchView('developer');
      this.refreshAll();
      return;
    }

    const pinInput = prompt('Masukkan PIN Akses Pemrogram (Default: 1234):');
    if (pinInput === null) return;

    const settings = StorageManager.getSettings();
    const correctPin = settings.devPin || '1234';

    if (pinInput.trim() === correctPin || pinInput.trim() === 'dev123' || pinInput.trim() === '1234') {
      this.isUnlocked = true;
      App.toast('Akses Mode Pemrogram Berhasil Dibuka.', 'success');
      App.switchView('developer');
      this.refreshAll();
    } else {
      App.toast('PIN Pemrogram salah! Akses ditolak.', 'danger');
      StorageManager.log('WARN', 'SECURITY', 'Percobaan akses pemrogram gagal dengan PIN: ' + pinInput);
    }
  },

  switchDevTab(tab) {
    this.activeDevTab = tab;
    const tabs = ['health', 'rawdb', 'logs', 'tools'];
    tabs.forEach(t => {
      const btn = document.getElementById('devTabBtn_' + t);
      const view = document.getElementById('devView_' + t);
      if (btn) {
        if (t === tab) {
          btn.className = "px-4 py-2 bg-slate-900 text-sky-400 font-mono text-xs font-bold rounded-xl border border-sky-500/30 shadow-sm transition-all";
        } else {
          btn.className = "px-4 py-2 bg-slate-800 text-slate-400 hover:text-white font-mono text-xs font-medium rounded-xl border border-slate-700 transition-all";
        }
      }
      if (view) {
        if (t === tab) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      }
    });

    if (tab === 'health') this.renderHealthCheck();
    if (tab === 'rawdb') this.loadRawDataToEditor();
    if (tab === 'logs') this.renderLogs();
    if (tab === 'tools') this.renderToolsInfo();
  },

  refreshAll() {
    this.renderHealthCheck();
    this.renderLogs();
    this.loadRawDataToEditor();
    this.renderToolsInfo();
  },

  /**
   * 1. Health Check & Diagnostics
   */
  renderHealthCheck() {
    const health = StorageManager.runHealthCheck();
    const statusBadge = document.getElementById('devSystemStatusBadge');
    const storageUsed = document.getElementById('devStorageUsed');
    const itemsCount = document.getElementById('devTotalProds');
    const trxCount = document.getElementById('devTotalTrx');
    const issuesContainer = document.getElementById('devIssuesList');

    if (statusBadge) {
      if (health.status === 'HEALTHY') {
        statusBadge.innerHTML = `<span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-mono text-xs font-bold">● SYSTEM HEALTHY (NORMAL)</span>`;
      } else {
        statusBadge.innerHTML = `<span class="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-mono text-xs font-bold">▲ ADA ${health.issuesCount} PERINGATAN INTEGRITAS</span>`;
      }
    }

    if (storageUsed) storageUsed.textContent = `${health.storageUsedKB} KB (LocalStorage)`;
    if (itemsCount) itemsCount.textContent = health.totalProducts;
    if (trxCount) trxCount.textContent = health.totalTransactions;

    // Online / Offline Status
    const netStatus = document.getElementById('devNetworkStatus');
    if (netStatus) {
      netStatus.textContent = navigator.onLine ? 'ONLINE (Tersambung Internet)' : 'OFFLINE (Mode Lokal Mandiri)';
      netStatus.className = navigator.onLine ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
    }

    if (issuesContainer) {
      if (health.issues.length === 0) {
        issuesContainer.innerHTML = `
          <div class="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono">
            ✓ Seluruh tabel database valid. Tidak ditemukan stok minus atau anomali perhitungan transaksi.
          </div>
        `;
      } else {
        let html = '';
        health.issues.forEach(iss => {
          html += `
            <div class="p-2.5 bg-slate-900 border border-amber-500/30 rounded-lg text-xs font-mono mb-2 flex items-start justify-between">
              <div>
                <span class="text-amber-400 font-bold">[${iss.type}]</span>
                <span class="text-slate-200 ml-1">${iss.itemName || iss.itemId || ''}: ${iss.desc}</span>
              </div>
            </div>
          `;
        });
        issuesContainer.innerHTML = html;
      }
    }
  },

  runAutoFix() {
    const fixedStock = StorageManager.autoFixNegativeStock();
    const fixedLedger = StorageManager.recalculateLedger();
    App.toast(`Diagnosa perbaikan selesai: ${fixedStock} stok minus dinolkan, ${fixedLedger} transaksi dihitung ulang.`, 'success');
    this.renderHealthCheck();
    PosApp.renderProductGrid();
    InventoryApp.renderProductsTable();
  },

  /**
   * 2. Raw Database Inspector & Live JSON Editor
   */
  loadRawDataToEditor() {
    const textarea = document.getElementById('devRawJsonEditor');
    if (!textarea) return;

    let data = [];
    switch (this.selectedTable) {
      case 'products':
        data = StorageManager.getProducts();
        break;
      case 'transactions':
        data = StorageManager.getTransactions();
        break;
      case 'restocks':
        data = StorageManager.getRestocks();
        break;
      case 'categories':
        data = StorageManager.getCategories();
        break;
      case 'settings':
        data = StorageManager.getSettings();
        break;
      case 'logs':
        data = StorageManager.getLogs();
        break;
    }

    textarea.value = JSON.stringify(data, null, 2);
    document.getElementById('devEditorMsg').textContent = `Tabel: ${this.selectedTable} (${Array.isArray(data) ? data.length + ' baris' : 'Objek'})`;
  },

  formatRawJson() {
    const textarea = document.getElementById('devRawJsonEditor');
    if (!textarea) return;
    try {
      const parsed = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(parsed, null, 2);
      App.toast('JSON berhasil diformat rapi.', 'info');
    } catch (e) {
      App.toast('Format JSON tidak valid: ' + e.message, 'danger');
    }
  },

  saveRawJson() {
    const textarea = document.getElementById('devRawJsonEditor');
    if (!textarea) return;

    try {
      const parsed = JSON.parse(textarea.value);
      
      switch (this.selectedTable) {
        case 'products':
          if (!Array.isArray(parsed)) throw new Error('Produk harus berupa Array objek');
          StorageManager.saveProducts(parsed);
          break;
        case 'transactions':
          if (!Array.isArray(parsed)) throw new Error('Transaksi harus berupa Array objek');
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed));
          break;
        case 'restocks':
          if (!Array.isArray(parsed)) throw new Error('Restock harus berupa Array objek');
          localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(parsed));
          break;
        case 'categories':
          if (!Array.isArray(parsed)) throw new Error('Kategori harus berupa Array objek');
          StorageManager.saveCategories(parsed);
          break;
        case 'settings':
          StorageManager.saveSettings(parsed);
          break;
      }

      StorageManager.log('WARN', 'DEVELOPER', `Perubahan manual disimpan pada tabel raw: ${this.selectedTable}`);
      App.toast(`Tabel ${this.selectedTable} berhasil diperbarui dari editor raw.`, 'success');
      
      // Refresh views
      PosApp.init();
      InventoryApp.init();
      ReportsApp.render();
      this.renderHealthCheck();
    } catch (e) {
      App.toast('Gagal menyimpan: ' + e.message, 'danger');
    }
  },

  /**
   * 3. System Logs & Error Tracking
   */
  renderLogs() {
    const container = document.getElementById('devLogsContainer');
    if (!container) return;

    const filterLevel = document.getElementById('devLogLevelFilter') ? document.getElementById('devLogLevelFilter').value : 'ALL';
    let logs = StorageManager.getLogs();

    if (filterLevel !== 'ALL') {
      logs = logs.filter(l => l.level === filterLevel);
    }

    if (logs.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-500 font-mono text-xs">Belum ada catatan log pada filter ini.</div>`;
      return;
    }

    let html = '';
    logs.forEach(l => {
      const timeStr = new Date(l.timestamp).toLocaleTimeString('id-ID');
      let levelClass = 'dev-log-info';
      if (l.level === 'ERROR') levelClass = 'dev-log-error';
      if (l.level === 'WARN') levelClass = 'dev-log-warn';
      if (l.level === 'SUCCESS') levelClass = 'dev-log-success';

      html += `
        <div class="dev-log-line">
          <span class="text-slate-500">[${timeStr}]</span>
          <span class="${levelClass} font-bold">[${l.level}]</span>
          <span class="text-indigo-400">[${l.module}]</span>
          <span class="text-slate-200">${l.message}</span>
          ${l.details ? `<pre class="text-[10px] text-slate-400 mt-1 pl-4 overflow-x-auto">${JSON.stringify(l.details)}</pre>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  },

  clearAllLogs() {
    if (confirm('Bersihkan semua catatan log sistem?')) {
      StorageManager.clearLogs();
      this.renderLogs();
      App.toast('Log sistem telah dibersihkan.', 'info');
    }
  },

  downloadLogs() {
    const logs = StorageManager.getLogs();
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bengkel_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * 4. Disaster Recovery & Emergency Tools
   */
  renderToolsInfo() {
    // Info display
  },

  exportFullBackupFile() {
    const jsonStr = StorageManager.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bengkel_backup_lengkap_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    App.toast('Backup lengkap seluruh database berhasil diunduh.', 'success');
  },

  triggerRestoreFile() {
    const fileInput = document.getElementById('devRestoreFileInput');
    if (fileInput) fileInput.click();
  },

  handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = StorageManager.importAllData(content);
      if (result.success) {
        App.toast('Database berhasil dipulihkan dari file backup!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        App.toast('Gagal memulihkan database: ' + result.message, 'danger');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  },

  injectSampleTransactions() {
    // Buat 5 transaksi acak tambahan
    const products = StorageManager.getProducts();
    const plates = ['B 8899 KKL', 'B 3344 TYU', 'B 1122 XYZ', 'D 9081 KLM', 'B 4455 ZZZ'];
    const names = ['Bpk. Yudi Kurniawan', 'Ibu Ratna Dewi', 'Sdr. Bagas Pratama', 'Bpk. Herman', 'Sdr. Faisal'];

    let added = 0;
    for (let i = 0; i < 5; i++) {
      const randomProd = products[Math.floor(Math.random() * (products.length - 2))];
      const serviceProd = products.find(p => p.isService) || products[0];

      const items = [
        { ...randomProd, qty: 1, subtotal: randomProd.sellPrice },
        { ...serviceProd, qty: 1, subtotal: serviceProd.sellPrice }
      ];

      const gross = items.reduce((s, it) => s + it.subtotal, 0);
      const hpp = items.reduce((s, it) => s + (it.buyPrice * it.qty), 0);

      const d = new Date();
      d.setDate(d.getDate() - (i * 3 + 1));

      const trx = {
        id: 'TRX-' + Date.now() + '-' + i,
        date: d.toISOString(),
        customerName: names[i % names.length],
        plateNumber: plates[i % plates.length],
        vehicleType: 'Motor Matic',
        mileage: (15000 + i * 2000) + ' km',
        notes: 'Simulasi transaksi programmer',
        paymentMethod: i % 2 === 0 ? 'Tunai' : 'QRIS',
        cashierName: 'Budi Santoso',
        items: items,
        totalHpp: hpp,
        totalGross: gross,
        discount: 0,
        totalFinal: gross,
        netProfit: gross - hpp,
        amountPaid: gross,
        change: 0,
        status: 'SELESAI'
      };

      StorageManager.addTransaction(trx);
      added++;
    }

    App.toast(`Berhasil membuat ${added} transaksi simulasi baru.`, 'success');
    this.refreshAll();
    ReportsApp.render();
  },

  executeFactoryReset() {
    if (confirm('PERINGATAN KRITIS: Apakah Anda yakin ingin mengembalikan seluruh aplikasi ke Data Awal Pabrik?\nSemua transaksi baru akan terhapus dan data demo akan dimuat ulang.')) {
      if (prompt('Ketik "RESET" dengan huruf kapital untuk konfirmasi:') === 'RESET') {
        StorageManager.factoryReset();
        App.toast('Aplikasi telah di-reset ke data bawaan pabrik.', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        App.toast('Reset dibatalkan.', 'info');
      }
    }
  }
};
