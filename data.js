/**
 * Data Awal & Mock Seed untuk BengkelPro POS
 * Memuat profil bengkel, kategori, daftar barang/jasa, dan riwayat transaksi simulasi
 */

const INITIAL_WORKSHOP_SETTINGS = {
  name: "Bengkel Jaya Abadi Motor",
  tagline: "Spesialis Servis Motor, Tune-Up & Sparepart",
  address: "Jl. Raya Otista No. 45, Cawang, Jakarta Timur",
  phone: "0822-2086-9361",
  receiptFooter: "Garansi servis motor 7 hari. Terima kasih atas kepercayaan Anda!",
  cashierName: "Budi Santoso",
  devPin: "1234", // PIN default untuk akses mode programmer/troubleshoot
  devWhatsapp: "6282220869361", // Nomor WhatsApp Resmi: 082220869361
  devName: "Tim Programmer & IT Support",
  printerWidth: "58mm", // 58mm atau 80mm untuk printer thermal kasir
  taxPercent: 0, // 0 = non-PPN untuk UMKM mikro
  currency: "IDR"
};

const INITIAL_CATEGORIES = [
  { id: "CAT-01", name: "Oli & Pelumas", icon: "droplet", color: "amber" },
  { id: "CAT-02", name: "Ban & Kaki-Kaki", icon: "disc", color: "blue" },
  { id: "CAT-03", name: "Sparepart Mesin & CVT", icon: "cog", color: "purple" },
  { id: "CAT-04", name: "Kelistrikan & Aki", icon: "zap", color: "yellow" },
  { id: "CAT-05", name: "Rem & Suspensi", icon: "shield", color: "rose" },
  { id: "CAT-06", name: "Jasa Servis", icon: "wrench", color: "emerald" }
];

const INITIAL_PRODUCTS = [
  {
    id: "PRD-001",
    sku: "OLI-MPX2-08",
    name: "Oli Mesin AHM MPX2 0.8L (Matic)",
    categoryId: "CAT-01",
    buyPrice: 42000,
    sellPrice: 55000,
    stock: 28,
    unit: "Botol",
    minStock: 5,
    isService: false
  },
  {
    id: "PRD-002",
    sku: "OLI-YML-08",
    name: "Oli Yamalube Matic 0.8L",
    categoryId: "CAT-01",
    buyPrice: 43000,
    sellPrice: 56000,
    stock: 18,
    unit: "Botol",
    minStock: 5,
    isService: false
  },
  {
    id: "PRD-003",
    sku: "OLI-GRD-AHM",
    name: "Oli Gardan AHM Gear Matic 120ml",
    categoryId: "CAT-01",
    buyPrice: 12000,
    sellPrice: 18000,
    stock: 35,
    unit: "Botol",
    minStock: 8,
    isService: false
  },
  {
    id: "PRD-004",
    sku: "OLI-SHELL-AX7",
    name: "Oli Shell Advance AX7 10W-40 0.8L",
    categoryId: "CAT-01",
    buyPrice: 50000,
    sellPrice: 65000,
    stock: 12,
    unit: "Botol",
    minStock: 4,
    isService: false
  },
  {
    id: "PRD-005",
    sku: "BAN-FDR-9090",
    name: "Ban Luar Tubeless FDR Sport XR 90/90-14",
    categoryId: "CAT-02",
    buyPrice: 170000,
    sellPrice: 225000,
    stock: 6,
    unit: "Pcs",
    minStock: 3,
    isService: false
  },
  {
    id: "PRD-006",
    sku: "BAN-IRC-8090",
    name: "Ban Luar Tubeless IRC NR83 80/90-14",
    categoryId: "CAT-02",
    buyPrice: 155000,
    sellPrice: 205000,
    stock: 8,
    unit: "Pcs",
    minStock: 3,
    isService: false
  },
  {
    id: "PRD-007",
    sku: "BAN-TBL-CRN",
    name: "Cairan Ban Tubeless M-One 350ml",
    categoryId: "CAT-02",
    buyPrice: 20000,
    sellPrice: 32000,
    stock: 15,
    unit: "Botol",
    minStock: 5,
    isService: false
  },
  {
    id: "PRD-008",
    sku: "SP-VBLT-BEAT",
    name: "Paket V-Belt + Roller Beat FI / ESP",
    categoryId: "CAT-03",
    buyPrice: 115000,
    sellPrice: 165000,
    stock: 7,
    unit: "Set",
    minStock: 2,
    isService: false
  },
  {
    id: "PRD-009",
    sku: "SP-BUSI-NGK",
    name: "Busi Standar NGK CPR9EA-9 (Beat/Vario)",
    categoryId: "CAT-03",
    buyPrice: 16000,
    sellPrice: 25000,
    stock: 32,
    unit: "Pcs",
    minStock: 6,
    isService: false
  },
  {
    id: "PRD-010",
    sku: "SP-FLTR-VARIO",
    name: "Filter Udara Honda Vario 125/150 ESP",
    categoryId: "CAT-03",
    buyPrice: 38000,
    sellPrice: 55000,
    stock: 9,
    unit: "Pcs",
    minStock: 3,
    isService: false
  },
  {
    id: "PRD-011",
    sku: "REM-KMP-DPN",
    name: "Kampas Rem Cakram Depan Honda Matic",
    categoryId: "CAT-05",
    buyPrice: 22000,
    sellPrice: 38000,
    stock: 14,
    unit: "Set",
    minStock: 4,
    isService: false
  },
  {
    id: "PRD-012",
    sku: "REM-KMP-BLK",
    name: "Kampas Rem Tromol Belakang Matic",
    categoryId: "CAT-05",
    buyPrice: 28000,
    sellPrice: 45000,
    stock: 10,
    unit: "Set",
    minStock: 3,
    isService: false
  },
  {
    id: "PRD-013",
    sku: "ELK-AKI-GTZ5S",
    name: "Aki Kering GS Astra GTZ5S MF 3.5Ah",
    categoryId: "CAT-04",
    buyPrice: 195000,
    sellPrice: 260000,
    stock: 4,
    unit: "Pcs",
    minStock: 2,
    isService: false
  },
  {
    id: "PRD-014",
    sku: "ELK-LMP-H4",
    name: "Bohlam Depan Halogen Osram 12V 35W",
    categoryId: "CAT-04",
    buyPrice: 18000,
    sellPrice: 30000,
    stock: 16,
    unit: "Pcs",
    minStock: 4,
    isService: false
  },
  // JASA SERVIS (isService = true, stok 9999 / tidak berkurang)
  {
    id: "PRD-015",
    sku: "JSA-SRV-RGN",
    name: "Jasa Servis Ringan + Tune Up Injeksi",
    categoryId: "CAT-06",
    buyPrice: 0,
    sellPrice: 45000,
    stock: 9999,
    unit: "Jasa",
    minStock: 0,
    isService: true
  },
  {
    id: "PRD-016",
    sku: "JSA-SRV-CVT",
    name: "Jasa Servis & Pembersihan CVT Matic",
    categoryId: "CAT-06",
    buyPrice: 0,
    sellPrice: 50000,
    stock: 9999,
    unit: "Jasa",
    minStock: 0,
    isService: true
  },
  {
    id: "PRD-017",
    sku: "JSA-PSG-BAN",
    name: "Jasa Bongkar Pasang Ban Luar Tubeless",
    categoryId: "CAT-06",
    buyPrice: 0,
    sellPrice: 15000,
    stock: 9999,
    unit: "Jasa",
    minStock: 0,
    isService: true
  },
  {
    id: "PRD-018",
    sku: "JSA-KMP-REM",
    name: "Jasa Pasang Kampas Rem Depan/Belakang",
    categoryId: "CAT-06",
    buyPrice: 0,
    sellPrice: 15000,
    stock: 9999,
    unit: "Jasa",
    minStock: 0,
    isService: true
  },
  {
    id: "PRD-019",
    sku: "JSA-SRV-BSR",
    name: "Jasa Servis Besar / Skir Klep / Turun Mesin",
    categoryId: "CAT-06",
    buyPrice: 0,
    sellPrice: 220000,
    stock: 9999,
    unit: "Jasa",
    minStock: 0,
    isService: true
  }
];

// Helper untuk membuat tanggal relatif (hari ini, minggu ini, bulan ini, dll.)
function getRelativeDate(daysAgo, hour = 10, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const INITIAL_TRANSACTIONS = [
  // 1. Hari Ini - Servis Beat
  {
    id: "TRX-20261102-001",
    date: getRelativeDate(0, 9, 15),
    customerName: "Bpk. Hendra Wijaya",
    plateNumber: "B 4521 KZX",
    vehicleType: "Honda Beat ESP 2021",
    mileage: "18.450 km",
    notes: "Tarikan gas loyo, minta ganti oli dan servis CVT",
    paymentMethod: "Tunai",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-001", sku: "OLI-MPX2-08", name: "Oli Mesin AHM MPX2 0.8L (Matic)", qty: 1, buyPrice: 42000, sellPrice: 55000, subtotal: 55000, profit: 13000 },
      { id: "PRD-003", sku: "OLI-GRD-AHM", name: "Oli Gardan AHM Gear Matic 120ml", qty: 1, buyPrice: 12000, sellPrice: 18000, subtotal: 18000, profit: 6000 },
      { id: "PRD-016", sku: "JSA-SRV-CVT", name: "Jasa Servis & Pembersihan CVT Matic", qty: 1, buyPrice: 0, sellPrice: 50000, subtotal: 50000, profit: 50000 }
    ],
    totalHpp: 54000,
    totalGross: 123000,
    discount: 5000,
    totalFinal: 118000,
    netProfit: 64000,
    amountPaid: 120000,
    change: 2000,
    status: "SELESAI"
  },
  // 2. Hari Ini - Ganti Ban Tubeless Vario
  {
    id: "TRX-20261102-002",
    date: getRelativeDate(0, 11, 40),
    customerName: "Sdr. Dimas Aditya",
    plateNumber: "B 6789 SKL",
    vehicleType: "Honda Vario 150",
    mileage: "32.100 km",
    notes: "Ban belakang botak bocor halus",
    paymentMethod: "QRIS",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-005", sku: "BAN-FDR-9090", name: "Ban Luar Tubeless FDR Sport XR 90/90-14", qty: 1, buyPrice: 170000, sellPrice: 225000, subtotal: 225000, profit: 55000 },
      { id: "PRD-007", sku: "BAN-TBL-CRN", name: "Cairan Ban Tubeless M-One 350ml", qty: 1, buyPrice: 20000, sellPrice: 32000, subtotal: 32000, profit: 12000 },
      { id: "PRD-017", sku: "JSA-PSG-BAN", name: "Jasa Bongkar Pasang Ban Luar Tubeless", qty: 1, buyPrice: 0, sellPrice: 15000, subtotal: 15000, profit: 15000 }
    ],
    totalHpp: 190000,
    totalGross: 272000,
    discount: 0,
    totalFinal: 272000,
    netProfit: 82000,
    amountPaid: 272000,
    change: 0,
    status: "SELESAI"
  },
  // 3. 2 Hari Lalu (Minggu ini) - Ganti V-Belt & Kampas Rem
  {
    id: "TRX-20261031-003",
    date: getRelativeDate(2, 14, 10),
    customerName: "Ibu Nuraini",
    plateNumber: "B 3108 TVR",
    vehicleType: "Yamaha Mio M3",
    mileage: "24.500 km",
    notes: "Suara kasar di bagian CVT & rem berdecit",
    paymentMethod: "Transfer Bank",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-008", sku: "SP-VBLT-BEAT", name: "Paket V-Belt + Roller Beat FI / ESP", qty: 1, buyPrice: 115000, sellPrice: 165000, subtotal: 165000, profit: 50000 },
      { id: "PRD-011", sku: "REM-KMP-DPN", name: "Kampas Rem Cakram Depan Honda Matic", qty: 1, buyPrice: 22000, sellPrice: 38000, subtotal: 38000, profit: 16000 },
      { id: "PRD-016", sku: "JSA-SRV-CVT", name: "Jasa Servis & Pembersihan CVT Matic", qty: 1, buyPrice: 0, sellPrice: 50000, subtotal: 50000, profit: 50000 },
      { id: "PRD-018", sku: "JSA-KMP-REM", name: "Jasa Pasang Kampas Rem Depan/Belakang", qty: 1, buyPrice: 0, sellPrice: 15000, subtotal: 15000, profit: 15000 }
    ],
    totalHpp: 137000,
    totalGross: 268000,
    discount: 8000,
    totalFinal: 260000,
    netProfit: 123000,
    amountPaid: 260000,
    change: 0,
    status: "SELESAI"
  },
  // 4. 4 Hari Lalu (Minggu ini) - Ganti Aki & Busi
  {
    id: "TRX-20261029-004",
    date: getRelativeDate(4, 16, 25),
    customerName: "Bpk. Rahmat Hidayat",
    plateNumber: "B 5432 PQR",
    vehicleType: "Honda Scoopy 2019",
    mileage: "41.000 km",
    notes: "Starter tangan mati tidak bisa nyala",
    paymentMethod: "Tunai",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-013", sku: "ELK-AKI-GTZ5S", name: "Aki Kering GS Astra GTZ5S MF 3.5Ah", qty: 1, buyPrice: 195000, sellPrice: 260000, subtotal: 260000, profit: 65000 },
      { id: "PRD-009", sku: "SP-BUSI-NGK", name: "Busi Standar NGK CPR9EA-9 (Beat/Vario)", qty: 1, buyPrice: 16000, sellPrice: 25000, subtotal: 25000, profit: 9000 }
    ],
    totalHpp: 211000,
    totalGross: 285000,
    discount: 0,
    totalFinal: 285000,
    netProfit: 74000,
    amountPaid: 300000,
    change: 15000,
    status: "SELESAI"
  },
  // 5. 6 Hari Lalu (Minggu ini) - Tune Up & Filter Udara
  {
    id: "TRX-20261027-005",
    date: getRelativeDate(6, 10, 0),
    customerName: "Sdr. Kevin Sanjaya",
    plateNumber: "B 1928 KNM",
    vehicleType: "Yamaha NMAX 155",
    mileage: "19.800 km",
    notes: "Servis rutin bulanan",
    paymentMethod: "QRIS",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-004", sku: "OLI-SHELL-AX7", name: "Oli Shell Advance AX7 10W-40 0.8L", qty: 2, buyPrice: 50000, sellPrice: 65000, subtotal: 130000, profit: 30000 },
      { id: "PRD-010", sku: "SP-FLTR-VARIO", name: "Filter Udara Honda Vario 125/150 ESP", qty: 1, buyPrice: 38000, sellPrice: 55000, subtotal: 55000, profit: 17000 },
      { id: "PRD-015", sku: "JSA-SRV-RGN", name: "Jasa Servis Ringan + Tune Up Injeksi", qty: 1, buyPrice: 0, sellPrice: 45000, subtotal: 45000, profit: 45000 }
    ],
    totalHpp: 138000,
    totalGross: 230000,
    discount: 5000,
    totalFinal: 225000,
    netProfit: 87000,
    amountPaid: 225000,
    change: 0,
    status: "SELESAI"
  },
  // 6. 12 Hari Lalu (Bulan ini)
  {
    id: "TRX-20261021-006",
    date: getRelativeDate(12, 13, 15),
    customerName: "Bpk. Teguh Prakoso",
    plateNumber: "B 4411 XYZ",
    vehicleType: "Honda Revo Fit",
    mileage: "55.000 km",
    notes: "Ganti oli + bohlam depan mati",
    paymentMethod: "Tunai",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-001", sku: "OLI-MPX2-08", name: "Oli Mesin AHM MPX2 0.8L (Matic)", qty: 1, buyPrice: 42000, sellPrice: 55000, subtotal: 55000, profit: 13000 },
      { id: "PRD-014", sku: "ELK-LMP-H4", name: "Bohlam Depan Halogen Osram 12V 35W", qty: 1, buyPrice: 18000, sellPrice: 30000, subtotal: 30000, profit: 12000 }
    ],
    totalHpp: 60000,
    totalGross: 85000,
    discount: 0,
    totalFinal: 85000,
    netProfit: 25000,
    amountPaid: 100000,
    change: 15000,
    status: "SELESAI"
  },
  // 7. 20 Hari Lalu (Bulan ini)
  {
    id: "TRX-20261013-007",
    date: getRelativeDate(20, 11, 20),
    customerName: "Sdr. Farhan Maulana",
    plateNumber: "B 6123 GTH",
    vehicleType: "Yamaha Aerox 155",
    mileage: "28.000 km",
    notes: "Ban depan botak & servis CVT",
    paymentMethod: "Transfer Bank",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-006", sku: "BAN-IRC-8090", name: "Ban Luar Tubeless IRC NR83 80/90-14", qty: 1, buyPrice: 155000, sellPrice: 205000, subtotal: 205000, profit: 50000 },
      { id: "PRD-016", sku: "JSA-SRV-CVT", name: "Jasa Servis & Pembersihan CVT Matic", qty: 1, buyPrice: 0, sellPrice: 50000, subtotal: 50000, profit: 50000 },
      { id: "PRD-017", sku: "JSA-PSG-BAN", name: "Jasa Bongkar Pasang Ban Luar Tubeless", qty: 1, buyPrice: 0, sellPrice: 15000, subtotal: 15000, profit: 15000 }
    ],
    totalHpp: 155000,
    totalGross: 270000,
    discount: 0,
    totalFinal: 270000,
    netProfit: 115000,
    amountPaid: 270000,
    change: 0,
    status: "SELESAI"
  },
  // 8. 45 Hari Lalu (Bulan lalu / Tahun Berjalan)
  {
    id: "TRX-20260918-008",
    date: getRelativeDate(45, 15, 0),
    customerName: "Bpk. Suryono",
    plateNumber: "B 7890 QWE",
    vehicleType: "Honda Supra X 125",
    mileage: "78.000 km",
    notes: "Ngebul putih, servis besar turun mesin skir klep",
    paymentMethod: "Tunai",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-019", sku: "JSA-SRV-BSR", name: "Jasa Servis Besar / Skir Klep / Turun Mesin", qty: 1, buyPrice: 0, sellPrice: 220000, subtotal: 220000, profit: 220000 },
      { id: "PRD-001", sku: "OLI-MPX2-08", name: "Oli Mesin AHM MPX2 0.8L (Matic)", qty: 1, buyPrice: 42000, sellPrice: 55000, subtotal: 55000, profit: 13000 },
      { id: "PRD-009", sku: "SP-BUSI-NGK", name: "Busi Standar NGK CPR9EA-9 (Beat/Vario)", qty: 1, buyPrice: 16000, sellPrice: 25000, subtotal: 25000, profit: 9000 }
    ],
    totalHpp: 58000,
    totalGross: 300000,
    discount: 10000,
    totalFinal: 290000,
    netProfit: 232000,
    amountPaid: 300000,
    change: 10000,
    status: "SELESAI"
  },
  // 9. 85 Hari Lalu (Kuartal sebelumnya / Tahun Berjalan)
  {
    id: "TRX-20260810-009",
    date: getRelativeDate(85, 10, 45),
    customerName: "Ibu Maya Safitri",
    plateNumber: "B 2341 UJM",
    vehicleType: "Honda Beat Street",
    mileage: "12.000 km",
    notes: "Servis berkala + ganti oli",
    paymentMethod: "QRIS",
    cashierName: "Budi Santoso",
    items: [
      { id: "PRD-001", sku: "OLI-MPX2-08", name: "Oli Mesin AHM MPX2 0.8L (Matic)", qty: 1, buyPrice: 42000, sellPrice: 55000, subtotal: 55000, profit: 13000 },
      { id: "PRD-003", sku: "OLI-GRD-AHM", name: "Oli Gardan AHM Gear Matic 120ml", qty: 1, buyPrice: 12000, sellPrice: 18000, subtotal: 18000, profit: 6000 },
      { id: "PRD-015", sku: "JSA-SRV-RGN", name: "Jasa Servis Ringan + Tune Up Injeksi", qty: 1, buyPrice: 0, sellPrice: 45000, subtotal: 45000, profit: 45000 }
    ],
    totalHpp: 54000,
    totalGross: 118000,
    discount: 0,
    totalFinal: 118000,
    netProfit: 64000,
    amountPaid: 118000,
    change: 0,
    status: "SELESAI"
  }
];

const INITIAL_RESTOCK_HISTORY = [
  {
    id: "RST-20261028-001",
    date: getRelativeDate(5, 9, 30),
    productId: "PRD-001",
    productName: "Oli Mesin AHM MPX2 0.8L (Matic)",
    supplier: "PT Sumber Pelumas Nusantara",
    qtyAdded: 24,
    buyPricePerUnit: 42000,
    totalCost: 1008000,
    notes: "Restock stok oli mingguan"
  },
  {
    id: "RST-20261025-002",
    date: getRelativeDate(8, 11, 0),
    productId: "PRD-005",
    productName: "Ban Luar Tubeless FDR Sport XR 90/90-14",
    supplier: "Grosir Ban Jaya Otista",
    qtyAdded: 10,
    buyPricePerUnit: 170000,
    totalCost: 1700000,
    notes: "Restock ban FDR tubeless"
  },
  {
    id: "RST-20261020-003",
    date: getRelativeDate(13, 14, 20),
    productId: "PRD-013",
    productName: "Aki Kering GS Astra GTZ5S MF 3.5Ah",
    supplier: "Distributor Aki Sentosa",
    qtyAdded: 6,
    buyPricePerUnit: 195000,
    totalCost: 1170000,
    notes: "Restock aki GS Astra"
  }
];
