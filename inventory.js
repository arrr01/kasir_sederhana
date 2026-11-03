/**
 * Manajemen Inventori, Barang & Restock untuk BengkelPro POS
 * Mengelola katalog sparepart, harga beli (modal), harga jual, stok minimum, dan mutasi restock barang
 */

const InventoryApp = {
  activeTab: 'items', // 'items' atau 'restock'
  searchQuery: '',
  filterCategory: 'ALL',
  filterStockStatus: 'ALL', // 'ALL', 'SAFE', 'LOW', 'EMPTY'
  editingProductId: null,

  init() {
    this.populateCategorySelects();
    this.renderProductsTable();
    this.renderRestockTable();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('invSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderProductsTable();
      });
    }

    const catFilter = document.getElementById('invCategoryFilter');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.filterCategory = e.target.value;
        this.renderProductsTable();
      });
    }

    const statusFilter = document.getElementById('invStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterStockStatus = e.target.value;
        this.renderProductsTable();
      });
    }

    // Hitung margin otomatis saat isi form produk
    const buyPriceInput = document.getElementById('prodBuyPrice');
    const sellPriceInput = document.getElementById('prodSellPrice');
    if (buyPriceInput && sellPriceInput) {
      const calcMargin = () => {
        const buy = Number(buyPriceInput.value) || 0;
        const sell = Number(sellPriceInput.value) || 0;
        const profit = sell - buy;
        const marginPct = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0;
        const preview = document.getElementById('prodMarginPreview');
        if (preview) {
          preview.innerHTML = `Laba kotor: <b>Rp ${profit.toLocaleString('id-ID')}</b> (${marginPct}%)`;
          preview.className = profit < 0 ? 'text-xs text-red-500 font-bold mt-1' : 'text-xs text-emerald-600 font-bold mt-1';
        }
      };
      buyPriceInput.addEventListener('input', calcMargin);
      sellPriceInput.addEventListener('input', calcMargin);
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    const tabItemsBtn = document.getElementById('invTabBtnItems');
    const tabRestockBtn = document.getElementById('invTabBtnRestock');
    const viewItems = document.getElementById('invViewItems');
    const viewRestock = document.getElementById('invViewRestock');

    if (tab === 'items') {
      tabItemsBtn.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-md transition-all";
      tabRestockBtn.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all";
      viewItems.classList.remove('hidden');
      viewRestock.classList.add('hidden');
      this.renderProductsTable();
    } else {
      tabItemsBtn.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all";
      tabRestockBtn.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-md transition-all";
      viewItems.classList.add('hidden');
      viewRestock.classList.remove('hidden');
      this.renderRestockTable();
    }
  },

  populateCategorySelects() {
    const categories = StorageManager.getCategories();
    
    // Filter dropdown
    const filterSelect = document.getElementById('invCategoryFilter');
    if (filterSelect) {
      let opt = '<option value="ALL">Semua Kategori</option>';
      categories.forEach(c => {
        opt += `<option value="${c.id}">${c.name}</option>`;
      });
      filterSelect.innerHTML = opt;
    }

    // Modal Form Dropdown
    const formSelect = document.getElementById('prodCategory');
    if (formSelect) {
      let opt = '';
      categories.forEach(c => {
        opt += `<option value="${c.id}">${c.name}</option>`;
      });
      formSelect.innerHTML = opt;
    }

    // Restock Modal Dropdown
    const restockSelect = document.getElementById('restockProductId');
    if (restockSelect) {
      const products = StorageManager.getProducts().filter(p => !p.isService);
      let opt = '<option value="">-- Pilih Barang yang Akan Direstock --</option>';
      products.forEach(p => {
        opt += `<option value="${p.id}">${p.name} (Stok Saat Ini: ${p.stock} ${p.unit})</option>`;
      });
      restockSelect.innerHTML = opt;
    }
  },

  /**
   * Render Tabel Produk & Jasa
   */
  renderProductsTable() {
    const tbody = document.getElementById('invProductsTableBody');
    if (!tbody) return;

    let products = StorageManager.getProducts();
    const categories = StorageManager.getCategories();
    const catMap = {};
    categories.forEach(c => catMap[c.id] = c.name);

    // Filter Kategori
    if (this.filterCategory !== 'ALL') {
      products = products.filter(p => p.categoryId === this.filterCategory);
    }

    // Filter Status Stok
    if (this.filterStockStatus === 'EMPTY') {
      products = products.filter(p => !p.isService && p.stock <= 0);
    } else if (this.filterStockStatus === 'LOW') {
      products = products.filter(p => !p.isService && p.stock > 0 && p.stock <= (p.minStock || 3));
    } else if (this.filterStockStatus === 'SAFE') {
      products = products.filter(p => p.isService || p.stock > (p.minStock || 3));
    }

    // Filter Pencarian
    if (this.searchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(this.searchQuery) ||
        (p.sku && p.sku.toLowerCase().includes(this.searchQuery))
      );
    }

    // Update Counter Summary
    const totalCountEl = document.getElementById('invTotalItemsCount');
    const lowStockCountEl = document.getElementById('invLowStockCount');
    if (totalCountEl) totalCountEl.textContent = products.length;
    if (lowStockCountEl) {
      const allProds = StorageManager.getProducts();
      const lowCount = allProds.filter(p => !p.isService && p.stock <= (p.minStock || 3)).length;
      lowStockCountEl.textContent = lowCount;
    }

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <p class="font-medium text-sm">Tidak ada barang yang sesuai filter</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    products.forEach((p, idx) => {
      const isOutOfStock = !p.isService && p.stock <= 0;
      const isLowStock = !p.isService && p.stock > 0 && p.stock <= (p.minStock || 3);
      const profitPerUnit = p.sellPrice - p.buyPrice;
      const marginPct = p.sellPrice > 0 ? ((profitPerUnit / p.sellPrice) * 100).toFixed(0) : 0;

      let stockBadge = '';
      if (p.isService) {
        stockBadge = `<span class="badge-service text-xs px-2.5 py-1 rounded-full font-bold">Jasa Servis</span>`;
      } else if (isOutOfStock) {
        stockBadge = `<span class="badge-stock-empty text-xs px-2.5 py-1 rounded-full font-bold">Habis (0)</span>`;
      } else if (isLowStock) {
        stockBadge = `<span class="badge-stock-low text-xs px-2.5 py-1 rounded-full font-bold">Kritis (${p.stock} ${p.unit})</span>`;
      } else {
        stockBadge = `<span class="badge-stock-safe text-xs px-2.5 py-1 rounded-full font-bold">${p.stock} ${p.unit}</span>`;
      }

      html += `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
          <td class="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
            ${p.sku || '-'}
          </td>
          <td class="py-3.5 px-4">
            <div class="font-bold text-slate-800 text-sm">${p.name}</div>
            <span class="text-xs text-slate-400 font-medium">${catMap[p.categoryId] || 'Umum'}</span>
          </td>
          <td class="py-3.5 px-4 text-xs font-semibold text-slate-600">
            ${p.isService ? '<span class="text-slate-400">-</span>' : 'Rp ' + (p.buyPrice || 0).toLocaleString('id-ID')}
          </td>
          <td class="py-3.5 px-4 text-sm font-extrabold text-blue-600">
            Rp ${p.sellPrice.toLocaleString('id-ID')}
          </td>
          <td class="py-3.5 px-4">
            ${stockBadge}
          </td>
          <td class="py-3.5 px-4">
            <div class="text-xs font-bold ${profitPerUnit < 0 ? 'text-red-500' : 'text-emerald-600'}">
              +Rp ${profitPerUnit.toLocaleString('id-ID')}
              <span class="text-[10px] text-slate-400 font-normal">(${marginPct}%)</span>
            </div>
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${!p.isService ? `
              <button onclick="InventoryApp.openQuickRestockModal('${p.id}')"
                class="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1" title="Tambah Stok / Restock">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Restock
              </button>` : ''}
              
              <button onclick="InventoryApp.openEditModal('${p.id}')"
                class="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors" title="Edit Barang">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </button>

              <button onclick="InventoryApp.deleteProduct('${p.id}')"
                class="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors" title="Hapus Barang">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  /**
   * Render Tabel Riwayat Restock Barang Masuk
   */
  renderRestockTable() {
    const tbody = document.getElementById('invRestockTableBody');
    if (!tbody) return;

    const restocks = StorageManager.getRestocks();

    if (restocks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <p class="font-medium text-sm">Belum ada riwayat restock barang</p>
            <p class="text-xs text-slate-400 mt-1">Klik tombol 'Tambah Restock' untuk memasukkan stok baru dari supplier.</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    restocks.forEach(r => {
      const formattedDate = new Date(r.date).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      html += `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
          <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
            ${formattedDate}
          </td>
          <td class="py-3 px-4 font-bold text-slate-800 text-sm">
            ${r.productName}
          </td>
          <td class="py-3 px-4 font-extrabold text-emerald-600 text-sm">
            +${r.qtyAdded}
          </td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-600">
            Rp ${Number(r.buyPricePerUnit || 0).toLocaleString('id-ID')}
          </td>
          <td class="py-3 px-4 text-xs font-bold text-slate-800">
            Rp ${Number(r.totalCost || 0).toLocaleString('id-ID')}
          </td>
          <td class="py-3 px-4 text-xs text-slate-500">
            <span class="font-medium text-slate-700">${r.supplier || 'Supplier Umum'}</span>
            ${r.notes ? `<p class="text-[11px] text-slate-400">${r.notes}</p>` : ''}
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  /**
   * Modal Tambah & Edit Barang
   */
  openAddModal() {
    this.editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Tambah Barang / Jasa Baru';
    
    // Reset Form
    document.getElementById('prodSku').value = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('prodName').value = '';
    document.getElementById('prodBuyPrice').value = '';
    document.getElementById('prodSellPrice').value = '';
    document.getElementById('prodStock').value = '10';
    document.getElementById('prodMinStock').value = '3';
    document.getElementById('prodUnit').value = 'Pcs';
    document.getElementById('prodIsService').checked = false;
    this.toggleServiceFields(false);

    document.getElementById('prodMarginPreview').innerHTML = '';
    App.openModal('productFormModal');
  },

  openEditModal(id) {
    const p = StorageManager.getProductById(id);
    if (!p) return;

    this.editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'Edit Data Barang / Jasa';

    document.getElementById('prodSku').value = p.sku || '';
    document.getElementById('prodName').value = p.name || '';
    document.getElementById('prodCategory').value = p.categoryId || 'CAT-01';
    document.getElementById('prodBuyPrice').value = p.buyPrice || 0;
    document.getElementById('prodSellPrice').value = p.sellPrice || 0;
    document.getElementById('prodStock').value = p.stock || 0;
    document.getElementById('prodMinStock').value = p.minStock || 3;
    document.getElementById('prodUnit').value = p.unit || 'Pcs';
    document.getElementById('prodIsService').checked = !!p.isService;

    this.toggleServiceFields(p.isService);

    // Trigger hitung margin
    const profit = p.sellPrice - p.buyPrice;
    const marginPct = p.sellPrice > 0 ? ((profit / p.sellPrice) * 100).toFixed(1) : 0;
    document.getElementById('prodMarginPreview').innerHTML = `Laba kotor: <b>Rp ${profit.toLocaleString('id-ID')}</b> (${marginPct}%)`;

    App.openModal('productFormModal');
  },

  toggleServiceFields(isService) {
    const stockContainer = document.getElementById('prodStockContainer');
    const buyPriceContainer = document.getElementById('prodBuyPriceContainer');
    if (stockContainer) stockContainer.style.display = isService ? 'none' : 'block';
    if (buyPriceContainer) buyPriceContainer.style.display = isService ? 'none' : 'block';
  },

  saveProductForm() {
    const sku = document.getElementById('prodSku').value.trim();
    const name = document.getElementById('prodName').value.trim();
    const categoryId = document.getElementById('prodCategory').value;
    const isService = document.getElementById('prodIsService').checked;
    const buyPrice = isService ? 0 : Number(document.getElementById('prodBuyPrice').value) || 0;
    const sellPrice = Number(document.getElementById('prodSellPrice').value) || 0;
    const stock = isService ? 9999 : Number(document.getElementById('prodStock').value) || 0;
    const minStock = isService ? 0 : Number(document.getElementById('prodMinStock').value) || 0;
    const unit = isService ? 'Jasa' : document.getElementById('prodUnit').value.trim() || 'Pcs';

    if (!name) {
      App.toast('Nama barang / jasa wajib diisi!', 'warning');
      return;
    }
    if (sellPrice <= 0) {
      App.toast('Harga jual harus lebih besar dari Rp 0!', 'warning');
      return;
    }

    if (this.editingProductId) {
      // Update
      const existing = StorageManager.getProductById(this.editingProductId);
      if (existing) {
        existing.sku = sku;
        existing.name = name;
        existing.categoryId = categoryId;
        existing.buyPrice = buyPrice;
        existing.sellPrice = sellPrice;
        existing.stock = stock;
        existing.minStock = minStock;
        existing.unit = unit;
        existing.isService = isService;
        StorageManager.updateProduct(existing);
        App.toast('Data barang berhasil diperbarui.', 'success');
      }
    } else {
      // Tambah baru
      const newProd = {
        id: 'PRD-' + Date.now().toString().slice(-6),
        sku: sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        name: name,
        categoryId: categoryId,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        stock: stock,
        minStock: minStock,
        unit: unit,
        isService: isService
      };
      StorageManager.addProduct(newProd);
      App.toast('Barang baru berhasil ditambahkan.', 'success');
    }

    App.closeModal('productFormModal');
    this.renderProductsTable();
    this.populateCategorySelects();
    PosApp.renderProductGrid();
  },

  deleteProduct(id) {
    const p = StorageManager.getProductById(id);
    if (!p) return;
    if (confirm(`Yakin ingin menghapus barang "${p.name}"?`)) {
      StorageManager.deleteProduct(id);
      App.toast(`Barang "${p.name}" telah dihapus.`, 'info');
      this.renderProductsTable();
      PosApp.renderProductGrid();
    }
  },

  /**
   * Modal Restock Barang
   */
  openQuickRestockModal(productId = null) {
    this.populateCategorySelects();
    const select = document.getElementById('restockProductId');
    if (productId && select) {
      select.value = productId;
      this.onRestockProductSelected();
    }
    document.getElementById('restockQty').value = '10';
    document.getElementById('restockSupplier').value = '';
    document.getElementById('restockNotes').value = '';

    App.openModal('restockModal');
  },

  onRestockProductSelected() {
    const select = document.getElementById('restockProductId');
    const infoBox = document.getElementById('restockProductInfoBox');
    const buyPriceInput = document.getElementById('restockNewBuyPrice');
    
    if (!select || !select.value) {
      if (infoBox) infoBox.classList.add('hidden');
      return;
    }

    const p = StorageManager.getProductById(select.value);
    if (p) {
      infoBox.classList.remove('hidden');
      document.getElementById('restockCurrentStockDisplay').textContent = `${p.stock} ${p.unit}`;
      document.getElementById('restockCurrentBuyPriceDisplay').textContent = `Rp ${p.buyPrice.toLocaleString('id-ID')}`;
      if (buyPriceInput) buyPriceInput.value = p.buyPrice;
    }
  },

  submitRestock() {
    const productId = document.getElementById('restockProductId').value;
    const qtyAdded = Number(document.getElementById('restockQty').value) || 0;
    const newBuyPrice = Number(document.getElementById('restockNewBuyPrice').value) || 0;
    const supplier = document.getElementById('restockSupplier').value.trim() || 'Supplier Umum';
    const notes = document.getElementById('restockNotes').value.trim();

    if (!productId) {
      App.toast('Pilih barang yang ingin direstock!', 'warning');
      return;
    }
    if (qtyAdded <= 0) {
      App.toast('Jumlah restock harus lebih dari 0!', 'warning');
      return;
    }

    const prod = StorageManager.getProductById(productId);
    if (!prod) return;

    const unitBuyPrice = newBuyPrice > 0 ? newBuyPrice : prod.buyPrice;
    const totalCost = unitBuyPrice * qtyAdded;

    const success = StorageManager.addRestockRecord({
      productId: productId,
      productName: prod.name,
      supplier: supplier,
      qtyAdded: qtyAdded,
      buyPricePerUnit: unitBuyPrice,
      newBuyPrice: newBuyPrice,
      totalCost: totalCost,
      notes: notes
    });

    if (success) {
      App.toast(`Berhasil restock +${qtyAdded} ${prod.unit} untuk ${prod.name}!`, 'success');
      App.closeModal('restockModal');
      this.renderProductsTable();
      this.renderRestockTable();
      PosApp.renderProductGrid();
    }
  },

  /**
   * Ekspor Daftar Inventori ke Format Excel (.xlsx) yang Rapi
   */
  exportInventoryExcel() {
    const products = StorageManager.getProducts();
    const categories = StorageManager.getCategories();
    const catMap = {};
    categories.forEach(c => catMap[c.id] = c.name);

    // Data header & baris
    const headers = ['Kode SKU', 'Nama Barang/Jasa', 'Kategori', 'Tipe', 'Modal Beli (HPP)', 'Harga Jual', 'Stok', 'Satuan', 'Stok Minimum', 'Laba Kotor/Unit'];
    const rows = products.map(p => [
      p.sku || '-',
      p.name,
      catMap[p.categoryId] || '-',
      p.isService ? 'Jasa Servis' : 'Barang Fisik',
      p.buyPrice,
      p.sellPrice,
      p.stock,
      p.unit || 'Pcs',
      p.minStock || 3,
      p.sellPrice - p.buyPrice
    ]);

    // Buat workbook
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Lebar kolom otomatis
    ws['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 14 },
      { wch: 18 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
      { wch: 14 }, { wch: 18 }
    ];

    // Style header (bold, background biru)
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: { patternType: 'solid', fgColor: { rgb: 'FF1D4ED8' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { rgb: 'FFCCCCCC' } }
        }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Inventori Barang');
    const tanggal = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `bengkel_inventori_${tanggal}.xlsx`);
    App.toast('Data inventori berhasil diekspor ke file Excel (.xlsx)!', 'success');
  },

  /**
   * Segarkan / Refresh Data Inventori
   */
  refreshData() {
    this.searchQuery = '';
    this.filterCategory = 'ALL';
    this.filterStockStatus = 'ALL';
    const searchEl = document.getElementById('invSearchInput');
    if (searchEl) searchEl.value = '';
    const catEl = document.getElementById('invCategoryFilter');
    if (catEl) catEl.value = 'ALL';
    const statusEl = document.getElementById('invStatusFilter');
    if (statusEl) statusEl.value = 'ALL';
    this.renderProductsTable();
    this.renderRestockTable();
    App.toast('Data inventori berhasil disegarkan!', 'success');
  }
};
