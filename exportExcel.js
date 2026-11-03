// Export to Excel utility using SheetJS (xlsx) library
// Functions to export inventory/restock and profit/loss reports as formatted .xlsx files

// Helper to create a workbook and add a styled sheet
function createWorkbook(sheetName, headers, data) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  // Apply basic style: header bold, fill color
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFFFF' } },
      fill: { fgColor: { rgb: 'FF4A90E2' } },
      alignment: { vertical: 'center', horizontal: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
        top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
      },
    };
  }
  // Auto width
  const colWidths = headers.map((h, i) => ({ wch: Math.max(h.length, 12) }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

// Export inventory (products) to Excel
function exportInventoryExcel() {
  const products = StorageManager.getProducts();
  const headers = ['SKU', 'Nama', 'Kategori', 'Harga Jual', 'Harga Beli', 'Stok', 'Satuan', 'Tipe'];
  const data = products.map(p => [
    p.sku || '-',
    p.name,
    (StorageManager.getCategoryById(p.categoryId) || {}).name || '-',
    p.sellPrice,
    p.buyPrice,
    p.stock,
    p.unit || 'Pcs',
    p.isService ? 'Jasa' : 'Barang',
  ]);
  const wb = createWorkbook('Inventaris', headers, data);
  XLSX.writeFile(wb, 'Inventaris.xlsx');
}

// Export profit/loss report (transactions) to Excel
function exportProfitLossExcel() {
  const transactions = StorageManager.getTransactions ? StorageManager.getTransactions() : [];
  const headers = ['Tanggal', 'No. Nota', 'Total', 'Diskon', 'Tunai', 'Kembali'];
  const data = transactions.map(t => [
    new Date(t.date).toLocaleDateString('id-ID'),
    t.invoice || '-',
    t.total,
    t.discount || 0,
    t.cashPaid || 0,
    t.change || 0,
  ]);
  const wb = createWorkbook('Laporan Laba Rugi', headers, data);
  XLSX.writeFile(wb, 'Laporan_Laba_Rugi.xlsx');
}

// Expose globally for UI buttons
window.exportInventoryExcel = exportInventoryExcel;
window.exportProfitLossExcel = exportProfitLossExcel;
