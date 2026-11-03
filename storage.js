/**
 * Storage Manager untuk BengkelPro POS
 * Mengelola LocalStorage, Sinkronisasi Offline/Online, Auto-Backup, Integritas Data & Logger
 */

const STORAGE_KEYS = {
  SETTINGS: 'bengkel_settings',
  CATEGORIES: 'bengkel_categories',
  PRODUCTS: 'bengkel_products',
  TRANSACTIONS: 'bengkel_transactions',
  RESTOCKS: 'bengkel_restocks',
  SYSTEM_LOGS: 'bengkel_system_logs'
};

const StorageManager = {
  /**
   * Inisialisasi Database Lokal
   */
  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_WORKSHOP_SETTINGS));
      } else {
        // Migrasi nomor WhatsApp jika masih nomor dummy lama
        try {
          const currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
          if (!currentSettings.devWhatsapp || currentSettings.devWhatsapp === '6281234567890') {
            currentSettings.devWhatsapp = '6282220869361';
            currentSettings.phone = '0822-2086-9361';
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
          }
        } catch (_) {}
      }
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      }

      const rawProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!rawProds || rawProds === '[]') {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      } else {
        try {
          const prods = JSON.parse(rawProds);
          if (!Array.isArray(prods) || prods.length === 0) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
          } else {
            // Pastikan jika ada produk yang stoknya 0 / habis semua, isi stok positif agar kasir langsung bisa memilih barang
            const hasStock = prods.some(p => p.isService || (Number(p.stock) > 0));
            if (!hasStock) {
              prods.forEach(p => {
                if (!p.isService) p.stock = 25;
              });
              localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
            }
          }
        } catch (_) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }
      }
      if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.RESTOCKS)) {
        localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(INITIAL_RESTOCK_HISTORY));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS)) {
        const initialLogs = [
          {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            module: 'SYSTEM',
            message: 'Database lokal berhasil diinisialisasi untuk pertama kali.'
          }
        ];
        localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(initialLogs));
      }
      this.log('INFO', 'STORAGE', 'StorageManager berhasil dimuat.');
    } catch (e) {
      console.error('Gagal inisialisasi localStorage:', e);
      this.log('ERROR', 'STORAGE', 'Gagal inisialisasi localStorage: ' + e.message);
    }
  },

  /**
   * Catat Log Sistem untuk Developer Troubleshoot
   */
  log(level, module, message, details = null) {
    try {
      const logs = this.getLogs();
      const newEntry = {
        id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(), // INFO, WARN, ERROR, SUCCESS
        module: module.toUpperCase(),
        message: message,
        details: details
      };
      logs.unshift(newEntry);
      // Batasi 200 log terakhir
      if (logs.length > 200) logs.pop();
      localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Logging gagal:', e);
    }
  },

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS)) || [];
    } catch (e) {
      return [];
    }
  },

  clearLogs() {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify([]));
    this.log('INFO', 'SYSTEM', 'Log sistem telah dibersihkan oleh pengguna.');
  },

  // ===== SETTINGS =====
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || INITIAL_WORKSHOP_SETTINGS;
    } catch (e) {
      return INITIAL_WORKSHOP_SETTINGS;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.log('INFO', 'SETTINGS', 'Pengaturan bengkel diperbarui.');
  },

  // ===== CATEGORIES =====
  getCategories() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
      if (Array.isArray(data) && data.length > 0) return data;
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    } catch (e) {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // ===== PRODUCTS & SERVICES =====
  getProducts() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
      if (Array.isArray(data) && data.length > 0) return data;
      // Auto-fallback data awal agar barang langsung tampil di kasir
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    } catch (e) {
      this.log('ERROR', 'PRODUCTS', 'Gagal memuat produk dari storage, fallback ke data bawaan');
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
  },

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },

  saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  addProduct(product) {
    const products = this.getProducts();
    if (!product.id) {
      product.id = 'PRD-' + Date.now().toString().slice(-6);
    }
    products.push(product);
    this.saveProducts(products);
    this.log('INFO', 'INVENTORY', `Menambahkan barang baru: ${product.name} (SKU: ${product.sku})`);
    return product;
  },

  updateProduct(updatedProduct) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === updatedProduct.id);
    if (idx !== -1) {
      products[idx] = updatedProduct;
      this.saveProducts(products);
      this.log('INFO', 'INVENTORY', `Memperbarui barang: ${updatedProduct.name}`);
      return true;
    }
    return false;
  },

  deleteProduct(id) {
    const products = this.getProducts();
    const target = products.find(p => p.id === id);
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
    this.log('WARN', 'INVENTORY', `Menghapus barang: ${target ? target.name : id}`);
    return true;
  },

  // Kurangi stok barang saat checkout kasir
  deductStock(items) {
    const products = this.getProducts();
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod && !prod.isService) {
        prod.stock = Math.max(0, (prod.stock || 0) - item.qty);
      }
    });
    this.saveProducts(products);
  },

  // Kembalikan stok (jika transaksi dibatalkan/void)
  restoreStock(items) {
    const products = this.getProducts();
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod && !prod.isService) {
        prod.stock = (prod.stock || 0) + item.qty;
      }
    });
    this.saveProducts(products);
    this.log('INFO', 'INVENTORY', `Stok barang dikembalikan untuk ${items.length} item.`);
  },

  // ===== RESTOCK =====
  getRestocks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESTOCKS)) || [];
    } catch (e) {
      return [];
    }
  },

  addRestockRecord(record) {
    const restocks = this.getRestocks();
    const products = this.getProducts();
    const prod = products.find(p => p.id === record.productId);

    if (prod) {
      // Tambah stok fisik
      prod.stock = (prod.stock || 0) + Number(record.qtyAdded);
      // Jika pemilik memperbarui harga beli (modal baru)
      if (record.newBuyPrice && Number(record.newBuyPrice) > 0) {
        prod.buyPrice = Number(record.newBuyPrice);
      }
      this.saveProducts(products);

      // Simpan log restock
      record.id = 'RST-' + Date.now();
      record.date = record.date || new Date().toISOString();
      restocks.unshift(record);
      localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(restocks));

      this.log('SUCCESS', 'RESTOCK', `Restock berhasil: +${record.qtyAdded} ${prod.unit} untuk ${prod.name}`);
      return true;
    }
    return false;
  },

  // ===== TRANSACTIONS =====
  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    } catch (e) {
      return [];
    }
  },

  addTransaction(trx) {
    const transactions = this.getTransactions();
    transactions.unshift(trx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    // Potong stok produk non-jasa
    this.deductStock(trx.items);
    this.log('SUCCESS', 'POS', `Transaksi baru berhasil disimpan: ${trx.id} (Total: Rp ${trx.totalFinal.toLocaleString('id-ID')})`);
    return trx;
  },

  voidTransaction(trxId) {
    const transactions = this.getTransactions();
    const idx = transactions.findIndex(t => t.id === trxId);
    if (idx !== -1) {
      const trx = transactions[idx];
      trx.status = 'DIBATALKAN';
      this.restoreStock(trx.items);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      this.log('WARN', 'POS', `Transaksi ${trxId} dibatalkan (stok dikembalikan).`);
      return true;
    }
    return false;
  },

  // ===== DEVELOPER & DISASTER RECOVERY TOOLS =====
  
  /**
   * Ekspor Seluruh Database ke File JSON Backup
   */
  exportAllData() {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'BengkelPro POS',
      settings: this.getSettings(),
      categories: this.getCategories(),
      products: this.getProducts(),
      transactions: this.getTransactions(),
      restocks: this.getRestocks(),
      logs: this.getLogs()
    };
    return JSON.stringify(backup, null, 2);
  },

  /**
   * Impor Database dari JSON String
   */
  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !data.transactions) {
        throw new Error('Format file backup tidak valid. Harus memiliki data produk & transaksi.');
      }
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.restocks) localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(data.restocks));
      
      this.log('SUCCESS', 'DEVELOPER', 'Restore data backup berhasil diselesaikan.');
      return { success: true, message: 'Restore database berhasil.' };
    } catch (e) {
      this.log('ERROR', 'DEVELOPER', 'Restore database gagal: ' + e.message);
      return { success: false, message: e.message };
    }
  },

  /**
   * Reset ke data default pabrik
   */
  factoryReset() {
    localStorage.clear();
    this.init();
    this.log('WARN', 'DEVELOPER', 'Factory reset dilakukan. Database kembali ke data bawaan.');
    return true;
  },

  /**
   * Jalankan Uji Kesehatan & Integritas Data (Data Integrity Check)
   */
  runHealthCheck() {
    const products = this.getProducts();
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const categoryIds = new Set(categories.map(c => c.id));

    const issues = [];

    // Cek stok minus & harga abnormal
    products.forEach(p => {
      if (!p.isService && p.stock < 0) {
        issues.push({ type: 'NEGATIVE_STOCK', itemId: p.id, itemName: p.name, desc: `Stok minus (${p.stock})` });
      }
      if (p.buyPrice > p.sellPrice && !p.isService) {
        issues.push({ type: 'SELLING_AT_LOSS', itemId: p.id, itemName: p.name, desc: `Harga jual (Rp ${p.sellPrice}) lebih rendah dari modal beli (Rp ${p.buyPrice})` });
      }
      if (!categoryIds.has(p.categoryId)) {
        issues.push({ type: 'ORPHAN_CATEGORY', itemId: p.id, itemName: p.name, desc: `Kategori ${p.categoryId} tidak ditemukan di daftar kategori` });
      }
    });

    // Cek konsistensi transaksi
    transactions.forEach(t => {
      if (!t.items || t.items.length === 0) {
        issues.push({ type: 'EMPTY_TRANSACTION', itemId: t.id, desc: 'Transaksi tanpa item' });
      }
    });

    // Hitung perkiraan kuota localStorage yang terpakai
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    const kbUsed = (totalBytes / 1024).toFixed(2);

    return {
      status: issues.length === 0 ? 'HEALTHY' : 'WARNING',
      issuesCount: issues.length,
      issues: issues,
      storageUsedKB: kbUsed,
      totalProducts: products.length,
      totalTransactions: transactions.length
    };
  },

  /**
   * Alat Pemrogram Darurat: Perbaiki Stok Minus Otomatis
   */
  autoFixNegativeStock() {
    const products = this.getProducts();
    let fixedCount = 0;
    products.forEach(p => {
      if (!p.isService && p.stock < 0) {
        p.stock = 0;
        fixedCount++;
      }
    });
    if (fixedCount > 0) {
      this.saveProducts(products);
      this.log('SUCCESS', 'DEVELOPER', `Berhasil memperbaiki ${fixedCount} barang yang memiliki stok negatif.`);
    }
    return fixedCount;
  },

  /**
   * Alat Pemrogram Darurat: Hitung Ulang Kalkulasi Finansial
   */
  recalculateLedger() {
    const transactions = this.getTransactions();
    let updatedCount = 0;
    transactions.forEach(t => {
      if (t.status !== 'DIBATALKAN') {
        let calculatedHpp = 0;
        let calculatedGross = 0;
        t.items.forEach(it => {
          calculatedHpp += (it.buyPrice || 0) * (it.qty || 1);
          calculatedGross += (it.sellPrice || 0) * (it.qty || 1);
        });
        const disc = t.discount || 0;
        const calculatedFinal = calculatedGross - disc;
        const calculatedNet = calculatedFinal - calculatedHpp;
        
        t.totalHpp = calculatedHpp;
        t.totalGross = calculatedGross;
        t.totalFinal = calculatedFinal;
        t.netProfit = calculatedNet;
        updatedCount++;
      }
    });
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.log('SUCCESS', 'DEVELOPER', `Berhasil menghitung ulang pembukuan ${updatedCount} transaksi.`);
    return updatedCount;
  }
};
