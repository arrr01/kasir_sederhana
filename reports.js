/**
 * Laporan Penjualan, Analisa Keuntungan & Kerugian (Profit & Loss) BengkelPro
 * Menghitung keuntungan & kerugian per minggu, per bulan, dan per tahun dengan visualisasi grafik interaktif
 */

const ReportsApp = {
  currentPeriod: 'WEEK', // 'TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'
  chartInstance: null,
  donutChartInstance: null,
  searchPlateQuery: '',

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    const searchInput = document.getElementById('reportSearchPlate');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchPlateQuery = e.target.value.toLowerCase().trim();
        this.renderTransactionsTable();
      });
    }
  },

  setPeriod(period) {
    this.currentPeriod = period;
    const periods = ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'];
    periods.forEach(p => {
      const btn = document.getElementById('periodBtn_' + p);
      if (btn) {
        if (p === period) {
          btn.className = "px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all";
        } else {
          btn.className = "px-4 py-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold transition-all";
        }
      }
    });

    this.render();
  },

  /**
   * Filter Transaksi Berdasarkan Periode
   */
  getFilteredTransactions() {
    const allTrx = StorageManager.getTransactions();
    const now = new Date();

    return allTrx.filter(t => {
      // Abaikan transaksi yang berstatus dibatalkan
      if (t.status === 'DIBATALKAN') return false;

      const trxDate = new Date(t.date);
      const diffMs = now - trxDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (this.currentPeriod === 'TODAY') {
        return trxDate.toDateString() === now.toDateString();
      } else if (this.currentPeriod === 'WEEK') {
        // 7 Hari terakhir
        return diffDays <= 7 && diffDays >= 0;
      } else if (this.currentPeriod === 'MONTH') {
        // 30 Hari terakhir / bulan ini
        return diffDays <= 30 && diffDays >= 0;
      } else if (this.currentPeriod === 'YEAR') {
        // 365 Hari terakhir / tahun ini
        return diffDays <= 365 && diffDays >= 0;
      }
      return true; // ALL
    });
  },

  render() {
    const transactions = this.getFilteredTransactions();
    this.renderFinancialMetrics(transactions);
    this.renderLossAnalysis(transactions);
    this.renderCharts(transactions);
    this.renderTransactionsTable();
  },

  /**
   * Render Kartu Metrik Keuangan (Omset, Modal/HPP, Laba Bersih, Margin)
   */
  renderFinancialMetrics(transactions) {
    let totalOmset = 0;
    let totalHpp = 0;
    let totalDiscount = 0;
    let totalSparepartRevenue = 0;
    let totalServiceRevenue = 0;

    transactions.forEach(t => {
      totalOmset += t.totalFinal || 0;
      totalHpp += t.totalHpp || 0;
      totalDiscount += t.discount || 0;

      (t.items || []).forEach(it => {
        if (it.isService) {
          totalServiceRevenue += it.subtotal || 0;
        } else {
          totalSparepartRevenue += it.subtotal || 0;
        }
      });
    });

    const netProfit = totalOmset - totalHpp;
    const marginPercent = totalOmset > 0 ? ((netProfit / totalOmset) * 100).toFixed(1) : 0;

    // Label Periode
    const periodLabels = {
      TODAY: 'Hari Ini',
      WEEK: 'Minggu Ini (7 Hari Terakhir)',
      MONTH: 'Bulan Ini (30 Hari Terakhir)',
      YEAR: 'Tahun Ini (1 Tahun Berjalan)',
      ALL: 'Sepanjang Waktu'
    };
    const periodText = periodLabels[this.currentPeriod] || 'Periode Ini';

    const periodLabelEl = document.getElementById('reportCurrentPeriodLabel');
    if (periodLabelEl) periodLabelEl.textContent = periodText;

    // Element bindings
    document.getElementById('metricTotalOmset').textContent = 'Rp ' + totalOmset.toLocaleString('id-ID');
    document.getElementById('metricTotalHpp').textContent = 'Rp ' + totalHpp.toLocaleString('id-ID');
    
    const profitEl = document.getElementById('metricNetProfit');
    const profitCard = document.getElementById('metricProfitCard');
    if (profitEl) {
      if (netProfit >= 0) {
        profitEl.textContent = '+ Rp ' + netProfit.toLocaleString('id-ID');
        profitEl.className = 'text-2xl font-extrabold text-emerald-600';
      } else {
        profitEl.textContent = '- Rp ' + Math.abs(netProfit).toLocaleString('id-ID');
        profitEl.className = 'text-2xl font-extrabold text-red-600';
      }
    }

    document.getElementById('metricMarginPct').textContent = marginPercent + '%';
    document.getElementById('metricTotalTrxCount').textContent = transactions.length + ' Servis';
    document.getElementById('metricServiceRevenue').textContent = 'Rp ' + totalServiceRevenue.toLocaleString('id-ID');
    document.getElementById('metricPartsRevenue').textContent = 'Rp ' + totalSparepartRevenue.toLocaleString('id-ID');
  },

  /**
   * Analisis Kerugian & Potensi Resiko Finansial Bengkel
   */
  renderLossAnalysis(transactions) {
    const lossContainer = document.getElementById('reportLossAnalysisContainer');
    if (!lossContainer) return;

    let itemsSoldAtLoss = [];
    let heavyDiscountTrx = [];

    transactions.forEach(t => {
      // Diskon lebih dari 20%
      if (t.discount > 0 && (t.discount / (t.totalGross || 1)) > 0.2) {
        heavyDiscountTrx.push({
          trxId: t.id,
          plate: t.plateNumber,
          discount: t.discount,
          gross: t.totalGross
        });
      }

      (t.items || []).forEach(it => {
        if (!it.isService && it.sellPrice < it.buyPrice) {
          itemsSoldAtLoss.push({
            name: it.name,
            buy: it.buyPrice,
            sell: it.sellPrice,
            lossPerUnit: it.buyPrice - it.sellPrice
          });
        }
      });
    });

    if (itemsSoldAtLoss.length === 0 && heavyDiscountTrx.length === 0) {
      lossContainer.innerHTML = `
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
            ✓
          </div>
          <div>
            <h5 class="text-sm font-bold text-emerald-900">Performa Keuangan Sehat</h5>
            <p class="text-xs text-emerald-700 mt-0.5">
              Tidak ditemukan penjualan rugi atau diskon berlebih pada ${periodToIndonesian(this.currentPeriod)}. Semua barang terjual dengan margin laba positif.
            </p>
          </div>
        </div>
      `;
    } else {
      let lossDetailsHtml = '';
      if (itemsSoldAtLoss.length > 0) {
        lossDetailsHtml += `<p class="text-xs text-red-700 font-semibold">• Ada ${itemsSoldAtLoss.length} item terjual di bawah harga modal (rugi).</p>`;
      }
      if (heavyDiscountTrx.length > 0) {
        lossDetailsHtml += `<p class="text-xs text-amber-700 font-semibold">• Ada ${heavyDiscountTrx.length} transaksi dengan potongan diskon tinggi (>20%).</p>`;
      }

      lossContainer.innerHTML = `
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
            !
          </div>
          <div>
            <h5 class="text-sm font-bold text-amber-900">Peringatan Margin & Kerugian</h5>
            <div class="mt-1 space-y-0.5">${lossDetailsHtml}</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render Grafik (Chart.js)
   */
  renderCharts(transactions) {
    if (typeof Chart === 'undefined') return;

    // 1. Line/Bar Chart: Omset vs Laba
    const canvasTrend = document.getElementById('chartRevenueProfitTrend');
    if (canvasTrend) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      // Kelompokkan data berdasarkan tanggal
      const groupedData = {};
      
      // Urutkan tanggal dari lama ke baru
      const sortedTrx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

      sortedTrx.forEach(t => {
        const d = new Date(t.date);
        let key = '';
        if (this.currentPeriod === 'TODAY') {
          key = d.getHours() + ':00';
        } else if (this.currentPeriod === 'YEAR') {
          key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        } else {
          key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }

        if (!groupedData[key]) {
          groupedData[key] = { omset: 0, modal: 0, profit: 0 };
        }
        groupedData[key].omset += t.totalFinal || 0;
        groupedData[key].modal += t.totalHpp || 0;
        groupedData[key].profit += t.netProfit || 0;
      });

      const labels = Object.keys(groupedData);
      const omsetData = labels.map(k => groupedData[k].omset);
      const modalData = labels.map(k => groupedData[k].modal);
      const profitData = labels.map(k => groupedData[k].profit);

      this.chartInstance = new Chart(canvasTrend, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['Belum ada transaksi'],
          datasets: [
            {
              label: 'Pendapatan (Omset)',
              data: omsetData.length > 0 ? omsetData : [0],
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderColor: '#2563eb',
              borderWidth: 1.5,
              borderRadius: 6
            },
            {
              label: 'Modal (HPP Barang)',
              data: modalData.length > 0 ? modalData : [0],
              backgroundColor: 'rgba(148, 163, 184, 0.5)',
              borderColor: '#94a3b8',
              borderWidth: 1.5,
              borderRadius: 6
            },
            {
              label: 'Keuntungan Bersih (Laba)',
              data: profitData.length > 0 ? profitData : [0],
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: '#10b981',
              borderWidth: 1.5,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                font: { size: 11, weight: 'bold' }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': Rp ' + Number(context.raw || 0).toLocaleString('id-ID');
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + ' jt';
                  if (value >= 1000) return (value / 1000).toFixed(0) + ' rb';
                  return value;
                },
                font: { size: 10 }
              }
            },
            x: {
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    }

    // 2. Donut Chart: Sparepart Fisik vs Jasa Servis
    const canvasDonut = document.getElementById('chartRevenueSplitDonut');
    if (canvasDonut) {
      if (this.donutChartInstance) {
        this.donutChartInstance.destroy();
      }

      let sparepartTotal = 0;
      let serviceTotal = 0;

      transactions.forEach(t => {
        (t.items || []).forEach(it => {
          if (it.isService) {
            serviceTotal += it.subtotal || 0;
          } else {
            sparepartTotal += it.subtotal || 0;
          }
        });
      });

      this.donutChartInstance = new Chart(canvasDonut, {
        type: 'doughnut',
        data: {
          labels: ['Sparepart & Oli', 'Jasa Servis'],
          datasets: [
            {
              data: (sparepartTotal === 0 && serviceTotal === 0) ? [1, 1] : [sparepartTotal, serviceTotal],
              backgroundColor: ['#3b82f6', '#10b981'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': Rp ' + Number(context.raw || 0).toLocaleString('id-ID');
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  },

  /**
   * Render Tabel Riwayat Transaksi
   */
  renderTransactionsTable() {
    const tbody = document.getElementById('reportTransactionsTableBody');
    if (!tbody) return;

    let transactions = this.getFilteredTransactions();

    if (this.searchPlateQuery) {
      transactions = transactions.filter(t => 
        (t.plateNumber && t.plateNumber.toLowerCase().includes(this.searchPlateQuery)) ||
        (t.customerName && t.customerName.toLowerCase().includes(this.searchPlateQuery)) ||
        (t.id && t.id.toLowerCase().includes(this.searchPlateQuery))
      );
    }

    if (transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="py-12 text-center text-slate-400">
            <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="font-medium text-sm">Tidak ada transaksi pada periode yang dipilih</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    transactions.forEach(t => {
      const formattedDate = new Date(t.date).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const itemCount = (t.items || []).reduce((sum, it) => sum + it.qty, 0);
      const itemsPreview = (t.items || []).map(it => `${it.name} (${it.qty}x)`).join(', ');

      const isCanceled = t.status === 'DIBATALKAN';

      html += `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors ${isCanceled ? 'opacity-50 line-through bg-slate-50' : ''}">
          <td class="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
            <div class="font-bold text-slate-700">${t.id}</div>
            <span class="text-[11px] text-slate-400">${formattedDate}</span>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-slate-900 text-xs">
              <span class="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[10px] tracking-wider">${t.plateNumber}</span>
            </div>
            <div class="text-xs text-slate-600 mt-1 font-semibold">${t.customerName}</div>
            <div class="text-[11px] text-slate-400">${t.vehicleType || '-'}</div>
          </td>
          <td class="py-3 px-4 max-w-xs">
            <div class="text-xs font-medium text-slate-700 truncate" title="${itemsPreview}">
              ${itemsPreview}
            </div>
            <span class="text-[10px] text-slate-400">Total ${itemCount} item/jasa</span>
          </td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
            <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]">
              ${t.paymentMethod}
            </span>
          </td>
          <td class="py-3 px-4 text-xs font-bold text-slate-800 whitespace-nowrap">
            Rp ${t.totalFinal.toLocaleString('id-ID')}
          </td>
          <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
            Rp ${(t.totalHpp || 0).toLocaleString('id-ID')}
          </td>
          <td class="py-3 px-4 text-xs font-extrabold text-emerald-600 whitespace-nowrap">
            +Rp ${(t.netProfit || 0).toLocaleString('id-ID')}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="ReportsApp.viewReceipt('${t.id}')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-2xs" title="Lihat Bukti Pembayaran Lunas & Cetak Struk Servis Motor">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Bukti Bayar / Struk
              </button>
              ${!isCanceled ? `
              <button onclick="ReportsApp.cancelTransaction('${t.id}')"
                class="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors" title="Batalkan Transaksi (Kembalikan Stok)">
                ✕
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  viewReceipt(trxId) {
    const allTrx = StorageManager.getTransactions();
    const trx = allTrx.find(t => t.id === trxId);
    if (trx) {
      PosApp.showReceiptModal(trx);
    }
  },

  cancelTransaction(trxId) {
    if (confirm(`Apakah Anda yakin ingin MEMBATALKAN transaksi ${trxId}?\nSemua stok barang fisik yang terjual akan otomatis dikembalikan ke inventori.`)) {
      const success = StorageManager.voidTransaction(trxId);
      if (success) {
        App.toast(`Transaksi ${trxId} dibatalkan dan stok dikembalikan.`, 'info');
        this.render();
        PosApp.renderProductGrid();
        InventoryApp.renderProductsTable();
      }
    }
  },

  /**
   * Ekspor Laporan Penjualan ke File Excel (.xlsx) yang Rapi
   */
  exportReportExcel() {
    const transactions = this.getFilteredTransactions();

    if (transactions.length === 0) {
      App.toast('Tidak ada data transaksi untuk diekspor pada periode ini.', 'warning');
      return;
    }

    const headers = [
      'No. Nota', 'Tanggal', 'Plat Nomor', 'Nama Pelanggan',
      'Kendaraan', 'Metode Bayar', 'Total Omset (Rp)',
      'Modal HPP (Rp)', 'Diskon (Rp)', 'Laba Bersih (Rp)',
      'Kasir', 'Status'
    ];

    const rows = transactions.map(t => [
      t.id,
      new Date(t.date).toLocaleDateString('id-ID') + ' ' + new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      t.plateNumber,
      t.customerName,
      t.vehicleType || '-',
      t.paymentMethod || 'Tunai',
      t.totalFinal || 0,
      t.totalHpp || 0,
      t.discount || 0,
      t.netProfit || 0,
      t.cashierName || '-',
      t.status || 'LUNAS'
    ]);

    // Hitung ringkasan
    const totalOmset = transactions.reduce((s, t) => s + (t.totalFinal || 0), 0);
    const totalHpp   = transactions.reduce((s, t) => s + (t.totalHpp || 0), 0);
    const totalLaba  = transactions.reduce((s, t) => s + (t.netProfit || 0), 0);
    const totalDiskon = transactions.reduce((s, t) => s + (t.discount || 0), 0);

    // Baris ringkasan
    const summaryBlank = ['', '', '', '', '', '', '', '', '', '', '', ''];
    const summaryHeader = ['RINGKASAN', '', '', '', '', '', 'Total Omset', 'Total Modal', 'Total Diskon', 'Total Laba', '', ''];
    const summaryValues = ['', '', '', '', '', '', totalOmset, totalHpp, totalDiskon, totalLaba, '', ''];

    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows, summaryBlank, summaryHeader, summaryValues];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Lebar kolom
    ws['!cols'] = [
      { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 20 },
      { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 12 }
    ];

    // Style baris header
    for (let C = 0; C <= 11; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: { patternType: 'solid', fgColor: { rgb: 'FF047857' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { rgb: 'FFCCCCCC' } }
        }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Laba Rugi');
    const tanggal = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `bengkel_laporan_${this.currentPeriod.toLowerCase()}_${tanggal}.xlsx`);
    App.toast('Laporan keuangan berhasil diekspor ke file Excel (.xlsx)!', 'success');
  },

  /**
   * Segarkan / Refresh Data Laporan
   */
  refreshData() {
    this.render();
    App.toast('Data laporan berhasil disegarkan!', 'success');
  }
};

function periodToIndonesian(p) {
  switch (p) {
    case 'TODAY': return 'hari ini';
    case 'WEEK': return 'minggu ini';
    case 'MONTH': return 'bulan ini';
    case 'YEAR': return 'tahun ini';
    default: return 'seluruh periode';
  }
}
