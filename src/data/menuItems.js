export const MENU_ITEMS = [
  { id: 1, name: 'Nasi Goreng', category: 'Makanan', price: 25000, image: '🍛' },
  { id: 2, name: 'Mie Goreng', category: 'Makanan', price: 22000, image: '🍜' },
  { id: 3, name: 'Ayam Bakar', category: 'Makanan', price: 30000, image: '🍗' },
  { id: 4, name: 'Sate Ayam', category: 'Makanan', price: 28000, image: '🍢' },
  { id: 5, name: 'Gado-Gado', category: 'Makanan', price: 20000, image: '🥗' },
  { id: 6, name: 'Es Teh', category: 'Minuman', price: 5000, image: '🍵' },
  { id: 7, name: 'Es Jeruk', category: 'Minuman', price: 7000, image: '🍊' },
  { id: 8, name: 'Kopi', category: 'Minuman', price: 10000, image: '☕' },
  { id: 9, name: 'Jus Alpukat', category: 'Minuman', price: 15000, image: '🥑' },
  { id: 10, name: 'Es Campur', category: 'Dessert', price: 12000, image: '🍧' },
];

export const CATEGORIES = ['Semua', ...new Set(MENU_ITEMS.map(item => item.category))];