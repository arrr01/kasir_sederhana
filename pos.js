/**
 * Kasir (POS) & Transaksi Servis BengkelPro
 * Menangani keranjang, data pelanggan & plat nomor, kalkulasi kasir, checkout, dan cetak struk nota
 */

const PosApp = {
  cart: [],
  selectedCategory: 'ALL',
  searchQuery: '',
  activePaymentMethod: 'Tunai',
  currentCompletedTrx: null,

  init() {
    this.renderCategoryTabs();
    this.renderProductGrid();
    this.renderCart();
    this.bindEvents();
  },

  bindEvents() {
    // Pencarian Barang
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderProductGrid();
      });
    }

    // Input Diskon
    const discountInput = document.getElementById('posDiscountInput');
    if (discountInput) {
      discountInput.addEventListener('input', () => {
        this.updateTotals();
      });
    }

    // Input Bayar Tunai
    const cashInput = document.getElementById('cashPaidInput');
    if (cashInput) {
      cashInput.addEventListener('input', () => {
        this.calculateChange();
      });
    }

    // Auto-uppercase Plat Nomor
    const plateInput = document.getElementById('customerPlate');
    if (plateInput) {
      plateInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }
  },

  /**
   * Render Filter Kategori
   */
  renderCategoryTabs() {
    const container = document.getElementById('posCategoryTabs');
    if (!container) return;

    const categories = StorageManager.getCategories();
    let html = `
      <button onclick="PosApp.selectCategory('ALL')" 
        class="px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          this.selectedCategory === 'ALL'
            ? 'bg-blue-600 text-white shadow-blue-200'
            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
        }">
        Semua Kategori
      </button>
    `;

    categories.forEach(cat => {
      const isActive = this.selectedCategory === cat.id;
      html += `
        <button onclick="PosApp.selectCategory('${cat.id}')" 
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm whitespace-nowrap ${
            isActive
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }">
          ${cat.name}
        </button>
      `;
    });

    container.innerHTML = html;
  },

  selectCategory(catId) {
    this.selectedCategory = catId;
    this.renderCategoryTabs();
    this.renderProductGrid();
  },

  /**
   * Render Grid Produk & Jasa
   */
  renderProductGrid() {
    const grid = document.getElementById('posProductGrid');
    if (!grid) return;

    let products = StorageManager.getProducts();

    // Filter Kategori
    if (this.selectedCategory !== 'ALL') {
      products = products.filter(p => p.categoryId === this.selectedCategory);
    }

    // Filter Pencarian
    if (this.searchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(this.searchQuery) ||
        (p.sku && p.sku.toLowerCase().includes(this.searchQuery))
      );
    }

    const totalCountBadge = document.getElementById('posTotalProductsCount');
    if (totalCountBadge) {
      totalCountBadge.textContent = `(${products.length} item siap dipesan)`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <svg class="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-base font-bold text-slate-600">Barang atau jasa tidak ditemukan</p>
          <p class="text-xs text-slate-400 mt-1">Coba kata kunci lain atau klik tab "Semua Kategori" di atas</p>
          <button onclick="PosApp.selectCategory('ALL')" class="mt-3 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all">
            Tampilkan Semua Barang
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    products.forEach(p => {
      const isOutOfStock = !p.isService && (p.stock <= 0);
      const isLowStock = !p.isService && (p.stock > 0 && p.stock <= (p.minStock || 3));
      
      const inCartItem = this.cart.find(it => it.id === p.id);
      const inCartQty = inCartItem ? inCartItem.qty : 0;

      let stockBadge = '';
      if (p.isService) {
        stockBadge = `<span class="badge-service text-[11px] px-2 py-0.5 rounded-full font-bold">⚡ Jasa Mekanik</span>`;
      } else if (isOutOfStock) {
        stockBadge = `<span class="badge-stock-empty text-[11px] px-2 py-0.5 rounded-full font-bold">Habis (0)</span>`;
      } else if (isLowStock) {
        stockBadge = `<span class="badge-stock-low text-[11px] px-2 py-0.5 rounded-full font-bold">Sisa ${p.stock} ${p.unit}</span>`;
      } else {
        stockBadge = `<span class="badge-stock-safe text-[11px] px-2 py-0.5 rounded-full font-bold">Stok ${p.stock} ${p.unit}</span>`;
      }

      html += `
        <div onclick="${isOutOfStock ? `App.toast('Stok barang ini sedang habis!', 'warning')` : `PosApp.addToCart('${p.id}')`}"
          class="product-card bg-white p-3.5 rounded-2xl border ${inCartQty > 0 ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100' : 'border-slate-200/80 shadow-xs'} flex flex-col justify-between cursor-pointer relative overflow-hidden select-none transition-all ${isOutOfStock ? 'opacity-60 grayscale' : 'hover:border-blue-400 hover:shadow-md'}">
          
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                ${p.sku || 'SKU'}
              </span>
              ${stockBadge}
            </div>

            <h4 class="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
              ${p.name}
            </h4>

            ${inCartQty > 0 ? `
              <div class="mt-1">
                <span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                  ✓ Sudah Dipesan (${inCartQty} ${p.unit})
                </span>
              </div>
            ` : ''}
          </div>

          <div class="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">Harga Satuan</p>
                <p class="text-base font-black text-blue-600">
                  Rp ${p.sellPrice.toLocaleString('id-ID')}
                </p>
              </div>
              <span class="text-[10px] text-slate-400 font-semibold">/${p.unit}</span>
            </div>

            <!-- Tombol Pesan Langsung yang Sangat Jelas -->
            <button type="button" 
              onclick="${isOutOfStock ? `event.stopPropagation(); App.toast('Stok barang ini sedang habis!', 'warning');` : `event.stopPropagation(); PosApp.addToCart('${p.id}');`}"
              class="w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : inCartQty > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20'
              }">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
              </svg>
              <span>${isOutOfStock ? 'Stok Habis' : inCartQty > 0 ? `+ Tambah (${inCartQty})` : '+ Pesan Barang'}</span>
            </button>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  },

  /**
   * Set metode pembayaran dari tombol pilihan di UI
   */
  setPaymentMethod(method) {
    this.activePaymentMethod = method;
    ['Tunai', 'Transfer', 'QRIS'].forEach(m => {
      const btn = document.getElementById('payBtn_' + m);
      if (!btn) return;
      if (m === method) {
        btn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-blue-600 text-white border-blue-600 transition-all';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all';
      }
    });
    App.toast('Metode pembayaran: ' + method, 'info', 1000);
  },

  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    this.selectedCategory = 'ALL';
    this.searchQuery = '';
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) searchInput.value = '';
    this.renderCategoryTabs();
    this.renderProductGrid();
    this.renderCart();
    App.toast('Katalog barang kasir berhasil disegarkan.', 'success');
  },

  /**
   * Manajemen Keranjang Kasir
   */
  addToCart(productId) {
    const product = StorageManager.getProductById(productId);
    if (!product) {
      App.toast('Data produk tidak ditemukan.', 'warning');
      return;
    }

    if (!product.isService) {
      product.stock = Number(product.stock) || 0;
      if (product.stock <= 0) {
        // Otomatis pulihkan stok darurat agar kasir bisa langsung memilih dan memesan
        product.stock = 25;
        StorageManager.updateProduct(product);
      }
    }

    const existingIndex = this.cart.findIndex(item => item.id === productId);
    if (existingIndex !== -1) {
      const currentItem = this.cart[existingIndex];
      if (!product.isService && currentItem.qty >= product.stock) {
        // Tambahkan batas stok jika kasir memesan melebihi stok yang ada
        product.stock += 10;
        StorageManager.updateProduct(product);
      }
      currentItem.qty++;
      currentItem.subtotal = currentItem.qty * currentItem.sellPrice;
      currentItem.totalProfit = currentItem.qty * (currentItem.sellPrice - currentItem.buyPrice);
    } else {
      this.cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        isService: product.isService,
        unit: product.unit || 'Pcs',
        stock: product.stock,
        qty: 1,
        subtotal: product.sellPrice,
        totalProfit: product.sellPrice - product.buyPrice
      });
    }

    this.renderCart();
    this.renderProductGrid();
    App.toast(`Ditambahkan ke Pesanan: ${product.name}`, 'info', 1200);
  },

  updateQty(index, change) {
    const item = this.cart[index];
    if (!item) return;

    const newQty = item.qty + change;
    if (newQty <= 0) {
      this.removeItem(index);
      return;
    }

    if (!item.isService && newQty > item.stock) {
      App.toast(`Maksimal stok tersedia hanya ${item.stock} ${item.unit}`, 'warning');
      return;
    }

    item.qty = newQty;
    item.subtotal = item.qty * item.sellPrice;
    item.totalProfit = item.qty * (item.sellPrice - item.buyPrice);
    this.renderCart();
    this.renderProductGrid();
  },

  removeItem(index) {
    this.cart.splice(index, 1);
    this.renderCart();
    this.renderProductGrid();
  },

  /**
   * Update harga satuan item keranjang (editable oleh kasir)
   */
  updatePrice(index, newPrice) {
    const item = this.cart[index];
    if (!item) return;
    const price = Math.max(0, Number(newPrice) || 0);
    item.sellPrice = price;
    item.subtotal = item.qty * price;
    item.totalProfit = item.qty * (price - item.buyPrice);
    this.updateTotals();
    App.toast(`Harga ${item.name} diubah ke Rp ${price.toLocaleString('id-ID')}`, 'info', 1500);
  },

  /**
   * Update qty langsung lewat input angka
   */
  updateQtyDirect(index, newQty) {
    const item = this.cart[index];
    if (!item) return;
    const qty = Math.max(1, parseInt(newQty) || 1);
    if (!item.isService && qty > item.stock) {
      App.toast(`Maksimal stok tersedia hanya ${item.stock} ${item.unit}`, 'warning');
      return;
    }
    item.qty = qty;
    item.subtotal = qty * item.sellPrice;
    item.totalProfit = qty * (item.sellPrice - item.buyPrice);
    this.renderCart();
    this.renderProductGrid();
  },

  clearCart() {
    if (this.cart.length === 0) return;
    if (confirm('Kosongkan semua daftar belanja di keranjang?')) {
      this.cart = [];
      this.renderCart();
      this.renderProductGrid();
      App.toast('Keranjang belanja dikosongkan', 'info');
    }
  },

  renderCart() {
    const container = document.getElementById('cartItemsList');
    const badgeCount = document.getElementById('cartItemCountBadge');
    if (badgeCount) {
      const totalUnits = this.cart.reduce((sum, it) => sum + it.qty, 0);
      badgeCount.textContent = totalUnits;
    }

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p class="font-semibold text-slate-600 text-sm">Keranjang Belanja Kosong</p>
          <p class="text-xs text-slate-400 mt-1">Pilih sparepart atau jasa servis di sebelah kiri untuk menambahkan pesanan.</p>
        </div>
      `;
      this.updateTotals();
      return;
    }

    let html = '';
    this.cart.forEach((item, index) => {
      html += `
        <div class="cart-row p-3 rounded-xl border border-slate-100 bg-white mb-2 shadow-xs">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h5 class="font-semibold text-slate-800 text-sm line-clamp-1">${item.name}</h5>
              <p class="text-[11px] text-slate-400 mt-0.5">${item.sku || ''} · ${item.unit}</p>
            </div>
            <button onclick="PosApp.removeItem(${index})" class="text-slate-300 hover:text-red-500 p-1 transition-colors shrink-0" title="Hapus item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>

          <div class="mt-2 space-y-1.5">
            <!-- Edit Harga -->
            <div class="flex items-center justify-between gap-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase">Harga Satuan</label>
              <input type="number" min="0" step="500"
                value="${item.sellPrice}"
                onchange="PosApp.updatePrice(${index}, this.value)"
                class="w-28 text-right text-xs font-bold text-blue-600 border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 bg-blue-50">
            </div>

            <!-- Qty & Total -->
            <div class="flex items-center justify-between pt-1.5 border-t border-slate-50">
              <div class="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                <button onclick="PosApp.updateQty(${index}, -1)" class="w-6 h-6 rounded-md bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center justify-center font-bold text-sm shadow-xs transition-colors">−</button>
                <input type="number" min="1" value="${item.qty}"
                  onchange="PosApp.updateQtyDirect(${index}, this.value)"
                  class="w-10 text-center text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none">
                <button onclick="PosApp.updateQty(${index}, 1)" class="w-6 h-6 rounded-md bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center font-bold text-sm shadow-xs transition-colors">+</button>
              </div>
              <span class="text-sm font-extrabold text-slate-800">Rp ${item.subtotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.updateTotals();
  },

  updateTotals() {
    const subtotal = this.cart.reduce((sum, it) => sum + it.subtotal, 0);
    const discountEl = document.getElementById('posDiscountInput');
    const discount = discountInputToAmount(discountEl ? discountEl.value : 0, subtotal);
    const grandTotal = Math.max(0, subtotal - discount);

    const subtotalDisplay = document.getElementById('cartSubtotalDisplay');
    const discountDisplay = document.getElementById('cartDiscountDisplay');
    const grandTotalDisplay = document.getElementById('cartGrandTotalDisplay');
    const checkoutBtn = document.getElementById('posCheckoutBtn');

    if (subtotalDisplay) subtotalDisplay.textContent = 'Rp ' + subtotal.toLocaleString('id-ID');
    if (discountDisplay) discountDisplay.textContent = 'Rp ' + discount.toLocaleString('id-ID');
    if (grandTotalDisplay) grandTotalDisplay.textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');

    if (checkoutBtn) {
      checkoutBtn.disabled = this.cart.length === 0;
      if (this.cart.length === 0) {
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    // Update Floating Quick Bar untuk Mobile
    const mobileFloatingBar = document.getElementById('mobileCartFloatingBar');
    const mobileBadge = document.getElementById('mobileFloatingBadge');
    const mobileTotal = document.getElementById('mobileFloatingTotal');
    const totalUnits = this.cart.reduce((sum, it) => sum + it.qty, 0);

    if (mobileFloatingBar) {
      if (this.cart.length > 0) {
        mobileFloatingBar.classList.remove('hidden');
        if (mobileBadge) mobileBadge.textContent = totalUnits;
        if (mobileTotal) mobileTotal.textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');
      } else {
        mobileFloatingBar.classList.add('hidden');
      }
    }
  },

  /**
   * Buka Modal Pembayaran (Checkout)
   */
  openCheckoutModal() {
    if (this.cart.length === 0) {
      App.toast('Keranjang masih kosong', 'warning');
      return;
    }

    const plateInput = document.getElementById('customerPlate');
    const nameInput = document.getElementById('customerName');
    let plate = plateInput ? plateInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';

    if (!plate) {
      plate = 'UMUM';
      if (plateInput) plateInput.value = 'UMUM';
    }

    const subtotal = this.cart.reduce((sum, it) => sum + it.subtotal, 0);
    const discountEl = document.getElementById('posDiscountInput');
    const discount = discountInputToAmount(discountEl ? discountEl.value : 0, subtotal);
    const grandTotal = Math.max(0, subtotal - discount);

    document.getElementById('modalCheckoutTotal').textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');
    document.getElementById('modalCustomerSummary').textContent = `${plate} (${name || 'Pelanggan Umum'})`;

    // Reset payment method
    this.selectPaymentMethod('Tunai');
    
    // Set default uang pas
    const cashInput = document.getElementById('cashPaidInput');
    if (cashInput) {
      cashInput.value = grandTotal;
      this.calculateChange();
    }

    // Render Quick Cash Buttons
    this.renderQuickCashButtons(grandTotal);

    App.openModal('checkoutModal');
  },

  renderQuickCashButtons(total) {
    const container = document.getElementById('quickCashButtons');
    if (!container) return;

    // Tombol Uang Pas, Pembulatan ke atas, 50k, 100k, 200k, 500k
    const options = [total];
    [50000, 100000, 200000, 500000].forEach(denom => {
      if (denom >= total && !options.includes(denom)) {
        options.push(denom);
      }
    });

    let html = '';
    options.forEach(amt => {
      const label = (amt === total) ? `Uang Pas (Rp ${amt.toLocaleString('id-ID')})` : `Rp ${amt.toLocaleString('id-ID')}`;
      html += `
        <button type="button" onclick="PosApp.setQuickCash(${amt})"
          class="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all">
          ${label}
        </button>
      `;
    });

    container.innerHTML = html;
  },

  setQuickCash(amount) {
    const cashInput = document.getElementById('cashPaidInput');
    if (cashInput) {
      cashInput.value = amount;
      this.calculateChange();
    }
  },

  calculateChange() {
    const subtotal = this.cart.reduce((sum, it) => sum + it.subtotal, 0);
    const discountEl = document.getElementById('posDiscountInput');
    const discount = discountInputToAmount(discountEl ? discountEl.value : 0, subtotal);
    const grandTotal = Math.max(0, subtotal - discount);

    const cashInput = document.getElementById('cashPaidInput');
    const paid = cashInput ? Number(cashInput.value || 0) : 0;
    const change = paid - grandTotal;

    const changeDisplay = document.getElementById('cashChangeDisplay');
    const changeAlert = document.getElementById('cashInsufficientAlert');
    const submitBtn = document.getElementById('btnSubmitPayment');

    if (changeDisplay) {
      changeDisplay.textContent = 'Rp ' + Math.max(0, change).toLocaleString('id-ID');
    }

    if (this.activePaymentMethod === 'Tunai') {
      if (paid < grandTotal) {
        if (changeAlert) changeAlert.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
      } else {
        if (changeAlert) changeAlert.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
      }
    } else {
      if (changeAlert) changeAlert.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  selectPaymentMethod(method) {
    this.activePaymentMethod = method;
    const methods = ['Tunai', 'Transfer', 'QRIS'];

    methods.forEach(m => {
      const btn = document.getElementById('payMethodBtn_' + m);
      const section = document.getElementById('paySection_' + m);
      if (btn) {
        if (m === method) {
          btn.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-md transition-all";
        } else {
          btn.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all";
        }
      }
      if (section) {
        if (m === method) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      }
    });

    this.calculateChange();
  },

  /**
   * Proses Finalisasi Transaksi
   */
  processCheckout() {
    const subtotal = this.cart.reduce((sum, it) => sum + it.subtotal, 0);
    const totalHpp = this.cart.reduce((sum, it) => sum + (it.buyPrice * it.qty), 0);
    const discountEl = document.getElementById('posDiscountInput');
    const discount = discountInputToAmount(discountEl ? discountEl.value : 0, subtotal);
    const grandTotal = Math.max(0, subtotal - discount);
    const netProfit = grandTotal - totalHpp;

    const plateInput = document.getElementById('customerPlate');
    const nameInput = document.getElementById('customerName');
    const typeInput = document.getElementById('customerVehicleType');
    const mileageInput = document.getElementById('customerMileage');
    const notesInput = document.getElementById('customerNotes');

    const cashInput = document.getElementById('cashPaidInput');
    const paidAmount = this.activePaymentMethod === 'Tunai' 
      ? Number(cashInput ? cashInput.value : grandTotal) 
      : grandTotal;
    const change = Math.max(0, paidAmount - grandTotal);

    const settings = StorageManager.getSettings();

    // Generate Transaksi
    const now = new Date();
    const dateCode = now.getFullYear().toString() + 
      String(now.getMonth() + 1).padStart(2, '0') + 
      String(now.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const trxId = `TRX-${dateCode}-${randomSuffix}`;

    const newTransaction = {
      id: trxId,
      date: now.toISOString(),
      customerName: nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Pelanggan Umum',
      plateNumber: plateInput && plateInput.value.trim() ? plateInput.value.trim().toUpperCase() : 'UMUM',
      vehicleType: typeInput ? typeInput.value.trim() || 'Motor' : 'Motor',
      mileage: mileageInput ? mileageInput.value.trim() : '-',
      notes: notesInput ? notesInput.value.trim() : '-',
      paymentMethod: this.activePaymentMethod,
      cashierName: settings.cashierName || 'Kasir',
      items: JSON.parse(JSON.stringify(this.cart)),
      totalHpp: totalHpp,
      totalGross: subtotal,
      discount: discount,
      totalFinal: grandTotal,
      netProfit: netProfit,
      amountPaid: paidAmount,
      change: change,
      status: 'SELESAI'
    };

    // Simpan ke storage (otomatis potong stok)
    StorageManager.addTransaction(newTransaction);
    this.currentCompletedTrx = newTransaction;

    // Tutup modal checkout & buka modal Struk Nota
    App.closeModal('checkoutModal');
    this.showReceiptModal(newTransaction);

    // Reset Form & Keranjang
    this.cart = [];
    if (plateInput) plateInput.value = '';
    if (nameInput) nameInput.value = '';
    if (typeInput) typeInput.value = '';
    if (mileageInput) mileageInput.value = '';
    if (notesInput) notesInput.value = '';
    if (discountEl) discountEl.value = '0';

    this.renderCart();
    this.renderProductGrid();

    // Refresh laporan jika tab laporan sedang aktif
    if (typeof ReportsApp !== 'undefined') {
      ReportsApp.render();
    }
  },

  // Pengaturan Tampilan & Cetak Struk
  selectedPaperWidth: '58mm',
  currentReceiptView: 'thermal', // 'thermal' atau 'digital'

  switchReceiptView(view) {
    this.currentReceiptView = view;
    const btnThermal = document.getElementById('receiptTabBtn_thermal');
    const btnDigital = document.getElementById('receiptTabBtn_digital');
    const sizeControls = document.getElementById('thermalSizeControls');
    const modalContent = document.getElementById('receiptModalContent');
    const printBtnLabel = document.getElementById('receiptPrintBtnLabel');

    if (printBtnLabel) {
      printBtnLabel.textContent = (view === 'digital') ? 'Cetak Bukti Pembayaran' : 'Cetak Struk Servis Motor';
    }

    if (btnThermal && btnDigital) {
      if (view === 'thermal') {
        btnThermal.className = "flex-1 py-1.5 rounded-xl font-bold bg-white text-blue-600 shadow-xs transition-all";
        btnDigital.className = "flex-1 py-1.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 transition-all";
        if (sizeControls) sizeControls.classList.remove('hidden');
      } else {
        btnThermal.className = "flex-1 py-1.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 transition-all";
        btnDigital.className = "flex-1 py-1.5 rounded-xl font-bold bg-white text-emerald-600 shadow-xs transition-all";
        if (sizeControls) sizeControls.classList.add('hidden');
      }
    }

    if (this.currentCompletedTrx && modalContent) {
      const settings = StorageManager.getSettings();
      if (view === 'thermal') {
        modalContent.innerHTML = this.generateReceiptHtml(this.currentCompletedTrx, settings, this.selectedPaperWidth);
      } else {
        modalContent.innerHTML = this.generateDigitalReceiptHtml(this.currentCompletedTrx, settings);
      }
    }
  },

  setPaperWidth(width) {
    this.selectedPaperWidth = width;
    const btn58 = document.getElementById('receiptPaperBtn_58');
    const btn80 = document.getElementById('receiptPaperBtn_80');
    const previewContainer = document.getElementById('receiptPreviewWrapper');

    if (btn58 && btn80) {
      if (width === '58mm') {
        btn58.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs";
        btn80.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-600 hover:bg-slate-200 border border-slate-200";
      } else {
        btn58.className = "px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-600 hover:bg-slate-200 border border-slate-200";
        btn80.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs";
      }
    }

    if (previewContainer) {
      if (width === '58mm') {
        previewContainer.className = "thermal-receipt-preview preview-58mm mx-auto p-3.5";
      } else {
        previewContainer.className = "thermal-receipt-preview preview-80mm mx-auto p-4";
      }
    }

    // Refresh receipt HTML jika transaksi ada dan sedang di tab thermal
    if (this.currentCompletedTrx) {
      const settings = StorageManager.getSettings();
      const modalContent = document.getElementById('receiptModalContent');
      const printArea = document.getElementById('receiptPrintArea');
      
      const receiptHtml = this.generateReceiptHtml(this.currentCompletedTrx, settings, width);
      if (printArea) {
        printArea.innerHTML = receiptHtml;
        printArea.className = 'paper-' + width;
      }
      if (this.currentReceiptView === 'thermal' && modalContent) {
        modalContent.innerHTML = receiptHtml;
      }
    }
  },

  /**
   * Tampilkan Modal Struk Nota & Bukti Pembayaran Servis Motor
   */
  showReceiptModal(trx) {
    this.currentCompletedTrx = trx;
    const settings = StorageManager.getSettings();
    const width = settings.printerWidth || this.selectedPaperWidth || '58mm';
    this.selectedPaperWidth = width;

    const modalContent = document.getElementById('receiptModalContent');
    const printArea = document.getElementById('receiptPrintArea');
    const plateSubtitle = document.getElementById('receiptModalPlateSubtitle');

    if (plateSubtitle) {
      plateSubtitle.textContent = `Motor: ${trx.plateNumber} (${trx.vehicleType || 'Servis'}) • ${trx.customerName}`;
    }

    const receiptHtml = this.generateReceiptHtml(trx, settings, width);

    if (printArea) {
      printArea.innerHTML = receiptHtml;
      printArea.className = 'paper-' + width;
    }

    // Default ke tampilan struk thermal
    this.switchReceiptView('thermal');
    this.setPaperWidth(width);

    App.openModal('receiptModal');
  },

  /**
   * 🧾 Format Cetak Struk Thermal Khusus Servis Motor (58mm / 80mm)
   */
  generateReceiptHtml(trx, settings, paperWidth = '58mm') {
    const is58 = paperWidth === '58mm';
    const separator = is58 ? '--------------------------------' : '========================================';
    const formattedDate = new Date(trx.date).toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    // Pisahkan Sparepart Motor dan Jasa Servis Motor
    const parts = (trx.items || []).filter(it => !it.isService);
    const services = (trx.items || []).filter(it => it.isService);

    let partsHtml = '';
    if (parts.length > 0) {
      partsHtml += `<div class="font-bold text-[9px] text-slate-500 uppercase mt-1 mb-0.5">[SPAREPART & OLI MOTOR]</div>`;
      parts.forEach(it => {
        partsHtml += `
          <div class="mb-1 leading-tight">
            <div class="flex justify-between font-bold text-slate-900 ${is58 ? 'text-[10px]' : 'text-xs'}">
              <span class="truncate pr-1">${it.name}</span>
              <span class="whitespace-nowrap">Rp ${it.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-slate-500 ${is58 ? 'text-[9px]' : 'text-[10px]'}">
              <span>${it.qty} ${it.unit || 'pcs'} x Rp ${it.sellPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>
        `;
      });
    }

    let servicesHtml = '';
    if (services.length > 0) {
      servicesHtml += `<div class="font-bold text-[9px] text-slate-500 uppercase mt-1 mb-0.5">[JASA SERVIS MOTOR]</div>`;
      services.forEach(it => {
        servicesHtml += `
          <div class="mb-1 leading-tight">
            <div class="flex justify-between font-bold text-slate-900 ${is58 ? 'text-[10px]' : 'text-xs'}">
              <span class="truncate pr-1">${it.name}</span>
              <span class="whitespace-nowrap">Rp ${it.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-slate-500 ${is58 ? 'text-[9px]' : 'text-[10px]'}">
              <span>${it.qty}x [MEKANIK]</span>
            </div>
          </div>
        `;
      });
    }

    // Rekomendasi servis berikutnya (+2.000 KM atau 1 bulan)
    let nextKmText = '1 Bulan Lagi';
    if (trx.mileage && trx.mileage !== '-') {
      const numMatch = trx.mileage.replace(/[^0-9]/g, '');
      if (numMatch) {
        const nextKm = Number(numMatch) + 2000;
        nextKmText = `${nextKm.toLocaleString('id-ID')} km (atau 1 bln)`;
      }
    }

    return `
      <div id="receiptPreviewWrapper" class="thermal-receipt-preview ${is58 ? 'preview-58mm p-3.5' : 'preview-80mm p-4'} mx-auto text-slate-900 font-mono">
        <!-- Header Struk Servis Motor -->
        <div class="text-center pb-1.5">
          <div class="font-black uppercase tracking-wider ${is58 ? 'text-xs' : 'text-sm'} leading-snug">${settings.name}</div>
          <div class="${is58 ? 'text-[9px]' : 'text-[10px]'} text-slate-600 font-semibold">${settings.tagline || 'Spesialis Servis Motor, Tune-Up & Sparepart'}</div>
          <div class="${is58 ? 'text-[8px]' : 'text-[9px]'} text-slate-500">${settings.address}</div>
          <div class="${is58 ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-800">WA: ${settings.phone || '0822-2086-9361'}</div>
        </div>

        <div class="text-center text-slate-400 select-none text-[9px] my-1 overflow-hidden whitespace-nowrap">${separator}</div>

        <!-- Identitas Transaksi & Motor Pelanggan -->
        <div class="py-1 ${is58 ? 'text-[10px]' : 'text-xs'} space-y-0.5">
          <div class="flex justify-between">
            <span class="text-slate-500">No. Nota:</span>
            <span class="font-bold">${trx.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Waktu:</span>
            <span>${formattedDate}</span>
          </div>
          <div class="flex justify-between font-black pt-0.5">
            <span class="text-slate-700">PLAT MOTOR:</span>
            <span class="px-1.5 py-0.2 bg-black text-white text-[10px] tracking-wider font-bold rounded">${trx.plateNumber}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Pemilik:</span>
            <span class="font-bold truncate max-w-[150px]">${trx.customerName}</span>
          </div>
          ${trx.vehicleType && trx.vehicleType !== '-' ? `
          <div class="flex justify-between text-slate-600 ${is58 ? 'text-[9px]' : 'text-[10px]'}">
            <span>Tipe Motor:</span>
            <span class="font-bold">${trx.vehicleType}</span>
          </div>` : ''}
          ${trx.mileage && trx.mileage !== '-' ? `
          <div class="flex justify-between text-slate-600 ${is58 ? 'text-[9px]' : 'text-[10px]'}">
            <span>KM Servis:</span>
            <span>${trx.mileage}</span>
          </div>` : ''}
          ${trx.notes && trx.notes !== '-' ? `
          <div class="flex justify-between text-slate-500 ${is58 ? 'text-[9px]' : 'text-[10px]'} pt-0.5">
            <span>Keluhan:</span>
            <span class="truncate max-w-[150px]">${trx.notes}</span>
          </div>` : ''}
          <div class="flex justify-between text-slate-500 ${is58 ? 'text-[9px]' : 'text-[10px]'}">
            <span>Mekanik:</span>
            <span>${trx.cashierName}</span>
          </div>
        </div>

        <div class="text-center text-slate-400 select-none text-[9px] my-1 overflow-hidden whitespace-nowrap">${separator}</div>

        <!-- Rincian Sparepart & Jasa Servis -->
        <div class="py-0.5">
          ${partsHtml}
          ${servicesHtml}
        </div>

        <div class="text-center text-slate-400 select-none text-[9px] my-1 overflow-hidden whitespace-nowrap">${separator}</div>

        <!-- Rincian Pembayaran & Status Lunas -->
        <div class="py-1 ${is58 ? 'text-[10px]' : 'text-xs'} space-y-0.5">
          <div class="flex justify-between">
            <span class="text-slate-600">Subtotal:</span>
            <span>Rp ${trx.totalGross.toLocaleString('id-ID')}</span>
          </div>
          ${trx.discount > 0 ? `
          <div class="flex justify-between text-slate-800">
            <span>Diskon:</span>
            <span>- Rp ${trx.discount.toLocaleString('id-ID')}</span>
          </div>` : ''}
          <div class="flex justify-between font-black text-slate-900 pt-0.5 border-t border-dotted border-slate-300 ${is58 ? 'text-xs' : 'text-sm'}">
            <span>TOTAL:</span>
            <span>Rp ${trx.totalFinal.toLocaleString('id-ID')}</span>
          </div>
          <div class="flex justify-between pt-0.5 font-bold text-emerald-800">
            <span>STATUS:</span>
            <span>[ L U N A S ]</span>
          </div>
          <div class="flex justify-between text-slate-600 ${is58 ? 'text-[9px]' : 'text-[10px]'}">
            <span>Bayar (${trx.paymentMethod}):</span>
            <span>Rp ${trx.amountPaid.toLocaleString('id-ID')}</span>
          </div>
          <div class="flex justify-between font-bold ${is58 ? 'text-[9px]' : 'text-[10px]'}">
            <span>Kembalian:</span>
            <span>Rp ${trx.change.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div class="text-center text-slate-400 select-none text-[9px] my-1 overflow-hidden whitespace-nowrap">${separator}</div>

        <!-- Jadwal Servis Berkala & Garansi Motor -->
        <div class="py-1 text-center ${is58 ? 'text-[9px]' : 'text-[10px]'} space-y-0.5">
          <div class="font-bold text-slate-800 uppercase">* SERVIS & GANTI OLI BERIKUTNYA:</div>
          <div class="font-extrabold text-blue-700 bg-slate-100 py-0.5 rounded">${nextKmText}</div>
        </div>

        <div class="text-center text-slate-400 select-none text-[9px] my-0.5 overflow-hidden whitespace-nowrap">${separator}</div>

        <!-- Footer Struk -->
        <div class="text-center pt-1 text-[8.5px] text-slate-600 space-y-0.5 leading-tight">
          <p class="font-bold text-slate-800">${settings.receiptFooter || 'Garansi servis motor 7 hari / 1.000 KM.'}</p>
          <p>Terima kasih atas kunjungan Anda!</p>
          <p class="text-[8px] text-slate-400 mt-1">*** BENGKELPRO THERMAL POS ***</p>
          <div class="h-3"></div>
        </div>
      </div>
    `;
  },

  /**
   * 💳 Tampilan Bukti Pembayaran Digital / Tanda Lunas Resmi
   */
  generateDigitalReceiptHtml(trx, settings) {
    const formattedDate = new Date(trx.date).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    let itemsRows = '';
    (trx.items || []).forEach(it => {
      itemsRows += `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
          <div>
            <div class="font-bold text-slate-800">${it.name}</div>
            <div class="text-[11px] text-slate-400">
              ${it.qty} ${it.unit || 'pcs'} x Rp ${it.sellPrice.toLocaleString('id-ID')}
              ${it.isService ? '<span class="text-blue-600 font-bold ml-1">• Jasa Servis</span>' : ''}
            </div>
          </div>
          <div class="font-extrabold text-slate-800">
            Rp ${it.subtotal.toLocaleString('id-ID')}
          </div>
        </div>
      `;
    });

    return `
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-slate-800 font-sans">
        <!-- Banner Bukti Pembayaran Lunas -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white text-center relative overflow-hidden">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-2xl font-bold mb-1 shadow-inner">
            ✓
          </div>
          <h4 class="font-black text-base tracking-wide uppercase">BUKTI PEMBAYARAN LUNAS</h4>
          <p class="text-xs text-emerald-100 mt-0.5">Servis & Pembelian Sparepart Motor Selesai</p>
          <div class="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-bold tracking-wider">
            ${trx.id}
          </div>
        </div>

        <!-- Body Detail Bukti Bayar -->
        <div class="p-4 space-y-4">
          <!-- Info Bengkel & Waktu -->
          <div class="flex justify-between items-start text-xs pb-3 border-b border-slate-100">
            <div>
              <div class="font-black text-slate-900 text-sm">${settings.name}</div>
              <div class="text-[11px] text-slate-500">${settings.address}</div>
              <div class="text-[11px] text-emerald-600 font-bold">WhatsApp: ${settings.phone || '0822-2086-9361'}</div>
            </div>
            <div class="text-right text-[11px] text-slate-500">
              <div>${formattedDate}</div>
              <div>Kasir: <b class="text-slate-700">${trx.cashierName}</b></div>
            </div>
          </div>

          <!-- Kartu Identitas Motor & Plat Nomor -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-semibold">Nomor Plat Motor:</span>
              <span class="px-2.5 py-0.5 bg-slate-900 text-white font-mono font-extrabold rounded-md text-xs tracking-wider">
                ${trx.plateNumber}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-semibold">Nama Pemilik:</span>
              <span class="font-bold text-slate-800">${trx.customerName}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-semibold">Tipe Kendaraan:</span>
              <span class="font-bold text-slate-700">${trx.vehicleType || 'Motor'}</span>
            </div>
            ${trx.mileage && trx.mileage !== '-' ? `
            <div class="flex items-center justify-between">
              <span class="text-slate-500 font-semibold">Kilometer Saat Ini:</span>
              <span class="font-mono text-slate-700">${trx.mileage}</span>
            </div>` : ''}
            ${trx.notes && trx.notes !== '-' ? `
            <div class="pt-1 border-t border-slate-200 text-[11px] text-slate-600">
              <span class="text-slate-400 font-semibold">Catatan Servis:</span> ${trx.notes}
            </div>` : ''}
          </div>

          <!-- Rincian Item -->
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Barang & Jasa:</div>
            <div class="divide-y divide-slate-100">
              ${itemsRows}
            </div>
          </div>

          <!-- Rincian Keuangan -->
          <div class="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>Rp ${trx.totalGross.toLocaleString('id-ID')}</span>
            </div>
            ${trx.discount > 0 ? `
            <div class="flex justify-between text-red-600 font-semibold">
              <span>Potongan Diskon:</span>
              <span>- Rp ${trx.discount.toLocaleString('id-ID')}</span>
            </div>` : ''}
            <div class="flex justify-between items-center pt-1 border-t border-slate-200">
              <span class="font-bold text-slate-900 text-sm">TOTAL DIBAYAR:</span>
              <span class="font-black text-emerald-600 text-lg">Rp ${trx.totalFinal.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-slate-500 text-[11px] pt-1">
              <span>Metode Pembayaran:</span>
              <span class="font-bold text-slate-800">${trx.paymentMethod}</span>
            </div>
            <div class="flex justify-between text-slate-500 text-[11px]">
              <span>Nominal Diterima:</span>
              <span>Rp ${trx.amountPaid.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex justify-between text-slate-700 font-bold text-[11px]">
              <span>Uang Kembalian:</span>
              <span>Rp ${trx.change.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <!-- Footer Kartu -->
          <div class="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
            <p class="font-semibold text-slate-600">${settings.receiptFooter || 'Garansi servis motor 7 hari.'}</p>
            <p>Terima kasih atas kepercayaan Anda merawat motor di bengkel kami!</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Cetak ke Printer Thermal (58mm / 80mm via Driver / USB / Bluetooth Dialog)
   */
  printReceipt() {
    if (!this.currentCompletedTrx) {
      App.toast('Tidak ada transaksi yang aktif untuk dicetak.', 'warning');
      return;
    }
    const printArea = document.getElementById('receiptPrintArea');
    if (printArea) {
      const settings = StorageManager.getSettings();
      if (this.currentReceiptView === 'digital') {
        printArea.innerHTML = this.generateDigitalReceiptHtml(this.currentCompletedTrx, settings);
        printArea.className = 'paper-digital';
      } else {
        printArea.innerHTML = this.generateReceiptHtml(this.currentCompletedTrx, settings, this.selectedPaperWidth);
        printArea.className = 'paper-' + this.selectedPaperWidth;
      }
    }
    window.print();
  },

  /**
   * Cetak Langsung via Bluetooth ESC/POS
   */
  async printBluetoothThermal() {
    if (!navigator.bluetooth) {
      App.toast('Web Bluetooth tidak didukung di browser ini. Menggunakan Cetak Thermal Standar.', 'info');
      this.printReceipt();
      return;
    }

    try {
      App.toast('Mencari printer Bluetooth Thermal terdekat...', 'info');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristics();

      if (characteristic && characteristic.length > 0) {
        const trx = this.currentCompletedTrx;
        const settings = StorageManager.getSettings();
        let rawText = `\x1B\x40\x1B\x61\x01${settings.name}\n${settings.tagline || 'Spesialis Servis Motor'}\nTelp: ${settings.phone || '0822-2086-9361'}\n--------------------------------\n\x1B\x61\x00` +
          `Nota: ${trx.id}\nPlat: ${trx.plateNumber}\nMotor: ${trx.vehicleType || '-'}\n` +
          `Total: Rp ${trx.totalFinal.toLocaleString('id-ID')}\nSTATUS: LUNAS\n--------------------------------\nTerima Kasih!\n\n\n\n`;

        const encoder = new TextEncoder();
        await characteristic[0].writeValue(encoder.encode(rawText));
        App.toast('Struk Servis Motor berhasil dicetak ke Printer Bluetooth!', 'success');
      }
    } catch (err) {
      console.warn('Bluetooth print fallback:', err);
      this.printReceipt();
    }
  },

  /**
   * Kirim Bukti Pembayaran & Struk Servis Motor via WhatsApp
   */
  shareReceiptWhatsApp() {
    if (!this.currentCompletedTrx) return;
    const trx = this.currentCompletedTrx;
    const settings = StorageManager.getSettings();

    let itemsText = '';
    (trx.items || []).forEach(it => {
      itemsText += `- ${it.name} (${it.qty}x) = Rp ${it.subtotal.toLocaleString('id-ID')}\n`;
    });

    // Hitung rekomendasi servis berikutnya
    let nextKm = '1 Bulan ke Depan';
    if (trx.mileage && trx.mileage !== '-') {
      const numMatch = trx.mileage.replace(/[^0-9]/g, '');
      if (numMatch) {
        nextKm = `${(Number(numMatch) + 2000).toLocaleString('id-ID')} km (atau 1 bln)`;
      }
    }

    const msg = `*BUKTI PEMBAYARAN & STRUK SERVIS MOTOR*
*${settings.name.toUpperCase()}*
${settings.address}
Telp/WA: ${settings.phone || '0822-2086-9361'}
----------------------------------------
No. Nota  : *${trx.id}*
Tanggal   : ${new Date(trx.date).toLocaleDateString('id-ID')} ${new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
Plat Motor: *${trx.plateNumber}*
Pemilik   : ${trx.customerName}
Tipe Motor: ${trx.vehicleType || '-'} (${trx.mileage !== '-' ? trx.mileage : ''})
Mekanik   : ${trx.cashierName}
${trx.notes && trx.notes !== '-' ? `Catatan   : ${trx.notes}\n` : ''}----------------------------------------
*Rincian Sparepart & Jasa Servis:*
${itemsText}----------------------------------------
Subtotal : Rp ${trx.totalGross.toLocaleString('id-ID')}
${trx.discount > 0 ? `Diskon   : - Rp ${trx.discount.toLocaleString('id-ID')}\n` : ''}*TOTAL    : Rp ${trx.totalFinal.toLocaleString('id-ID')}*
*STATUS   : LUNAS (${trx.paymentMethod})*
Bayar    : Rp ${trx.amountPaid.toLocaleString('id-ID')}
Kembalian: Rp ${trx.change.toLocaleString('id-ID')}
----------------------------------------
*Rekomendasi Servis Motor Berikutnya:*
👉 Ganti Oli/Servis di: *${nextKm}*

${settings.receiptFooter || 'Garansi servis motor 7 hari.'}
Terima kasih telah melakukan servis di bengkel kami!`;

    const encoded = encodeURI(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }
};

// Helper kalkulasi diskon
function discountInputToAmount(inputValue, subtotal) {
  if (!inputValue) return 0;
  const str = String(inputValue).trim();
  if (str.endsWith('%')) {
    const percent = parseFloat(str.replace('%', '')) || 0;
    return Math.round((percent / 100) * subtotal);
  }
  return parseFloat(str) || 0;
}
