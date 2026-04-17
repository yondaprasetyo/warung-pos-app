export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

// Fungsi Baru: Sensor Nama
export const maskName = (name) => {
  if (!name) return "";
  const words = name.split(" ");
  
  const maskedWords = words.map((word) => {
    if (word.length <= 2) return word; 
    // Ambil 2 huruf pertama, sisanya bintang
    const visiblePart = word.substring(0, 2);
    const stars = "*".repeat(word.length - 2);
    return visiblePart + stars;
  });

  return maskedWords.join(" ");
};