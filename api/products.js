// File: /api/get-products.js
const jwt = require('jsonwebtoken');

// *** PENTING: GANTI INI DENGAN KUNCI RAHASIA ANDA YANG SANGAT PANJANG DAN UNIK ***
// Kunci ini HARUS SAMA PERSIS dengan JWT_SECRET di api/login.js
const JWT_SECRET = 'SUPER_RAHASIA_KUNCI_JWT_ANDA_YANG_SANGAT_PANJANG_DAN_UNIK';

export default function handler(request, response) {
  // 1. Periksa header otorisasi dari frontend
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Akses ditolak: Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];

  // 2. Verifikasi token
  try {
    // jwt.verify akan error jika token tidak valid atau kadaluwarsa
    jwt.verify(token, JWT_SECRET);

    // 3. JIKA TOKEN VALID, kirimkan link rahasia
    const secretProducts = [
      {
        id: "product-masterkit",
        name: "Akses Digital Licence Masterkit U PLR MRR",
        link: "https://www.notion.so/Akses-Digital-Licence-Masterkit-U-PLR-PLR-MRR-28252094ea0a81139c48cf0aaa412d2c",
        category: "Produk Utama",
        description: "Link akses ke Masterkit U PLR PLR MRR di Notion.",
        icon: "bi-box-seam-fill"
      },
      {
        id: "bonus-fb-ig-ads",
        name: "BONUS: Mahir FB dan IG Ads (PDF)",
        link: "https://cdn.scalev.id/DPF/qFKuqltO643kNOvsyz-lpwAW/FILE%20DOWNLOAD%20BONUS%20UPDATED%20NEW.pdf",
        category: "Bonus",
        description: "File PDF panduan Mahir FB dan IG Ads.",
        icon: "bi-award-fill"
      }
    ];

    // Kirim data sebagai respons
    return response.status(200).json(secretProducts);

  } catch (error) {
    // Jika token tidak valid (kadaluwarsa, salah, dll)
    return response.status(403).json({ message: 'Akses ditolak: Token tidak valid atau telah berakhir.' });
  }
}
