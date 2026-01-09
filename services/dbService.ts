
import { Product, Sale } from '../types';
const SERVER_URL = process.env.SERVER_URL || ''; 

const STORAGE_KEYS = {
  PRODUCTS: 'quicksell_inv_v1',
  SALES: 'quicksell_sales_v1',
};

/** 
 * Default Startup Data
 * Stationery shop inventory for display purposes.
 */
const DEFAULT_PRODUCTS: Product[] = [
  { id: 'P-001', name: 'Executive Fountain Pen', sku: 'EP-FONT-01', category: 'Writing', company: 'Luxor', costPrice: 450, sellingPrice: 899, stockQty: 12, reorderLevel: 5 },
  { id: 'P-002', name: 'Premium A5 Leather Notebook', sku: 'NB-A5-PREM', category: 'Paper', company: 'Classmate', costPrice: 120, sellingPrice: 350, stockQty: 45, reorderLevel: 10 },
  { id: 'P-003', name: 'Charcoal Sketching Set (12pcs)', sku: 'ART-SK-12', category: 'Art Supplies', company: 'Faber-Castell', costPrice: 300, sellingPrice: 750, stockQty: 3, reorderLevel: 5 },
  { id: 'P-004', name: 'Neon Sticky Notes (400 Sheets)', sku: 'OFF-STK-NEO', category: 'Office', company: '3M', costPrice: 45, sellingPrice: 120, stockQty: 80, reorderLevel: 20 },
  { id: 'P-005', name: 'Pro-Grip Gel Pens (Pack of 5)', sku: 'PEN-GEL-PRO', category: 'Writing', company: 'Cello', costPrice: 60, sellingPrice: 150, stockQty: 120, reorderLevel: 25 },
  { id: 'P-006', name: 'Correction Tape Pro 10m', sku: 'OFF-CORR-TAP', category: 'Office', company: 'Deli', costPrice: 35, sellingPrice: 95, stockQty: 4, reorderLevel: 10 },
  { id: 'P-007', name: 'Acrylic Paint Set (24 Colors)', sku: 'ART-ACR-24', category: 'Art Supplies', company: 'Camlin', costPrice: 280, sellingPrice: 590, stockQty: 18, reorderLevel: 8 },
  { id: 'P-008', name: 'Highlighter Set (Pastel Edition)', sku: 'MARK-HIGH-PAST', category: 'Markers', company: 'Stabilo', costPrice: 180, sellingPrice: 420, stockQty: 25, reorderLevel: 10 },
];

const generateDefaultSales = (products: Product[]): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Generate data for each month up to today
  for (let m = 0; m <= currentMonth; m++) {
    // Generate 3-8 random sales per month
    const salesThisMonth = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < salesThisMonth; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      // If it's current month, don't generate sales in the future
      if (m === currentMonth && day > now.getDate()) continue;
      
      const date = new Date(currentYear, m, day, 10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      const timestamp = date.getTime();
      
      // Pick 1-3 random products for the cart
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const cartItems = [];
      let totalAmount = 0;
      let totalProfit = 0;
      let totalDiscountAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const discount = Math.random() > 0.8 ? 10 : 0; // 20% chance of 10% discount
        
        const discountedPrice = prod.sellingPrice * (1 - discount / 100);
        const itemTotal = discountedPrice * qty;
        const itemProfit = (discountedPrice - prod.costPrice) * qty;
        const itemDiscountVal = (prod.sellingPrice * (discount / 100)) * qty;

        cartItems.push({ ...prod, quantity: qty, discount });
        totalAmount += itemTotal;
        totalProfit += itemProfit;
        totalDiscountAmount += itemDiscountVal;
      }

      sales.push({
        id: `SALE-${date.getMonth()+1}${date.getDate()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        timestamp,
        totalAmount,
        profit: totalProfit,
        paymentMethod: ['Cash', 'Card', 'Transfer'][Math.floor(Math.random() * 3)] as 'Cash' | 'Card' | 'Transfer',
        discount: totalDiscountAmount,
        items: cartItems
      });
    }
  }
  
  return sales.sort((a, b) => b.timestamp - a.timestamp);
};

/** 
 * LocalStorage Fallback Helpers 
 */
const getLocalData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    saveLocalData(key, fallback);
    return fallback;
  }
  return JSON.parse(data);
};

const saveLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  async getProducts(): Promise<Product[]> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      const response = await fetch(`${SERVER_URL}/products`);
      return await response.json();
    } catch (err) {
      return getLocalData(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    }
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      const res = await fetch(`${SERVER_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return await res.json();
    } catch (e) {
      const newProduct = { 
        ...product, 
        id: 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase() 
      } as Product;
      const current = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      saveLocalData(STORAGE_KEYS.PRODUCTS, [...current, newProduct]);
      return newProduct;
    }
  },

  async updateProduct(product: Product): Promise<void> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      await fetch(`${SERVER_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
    } catch (e) {
      const current = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      const updated = current.map(p => p.id === product.id ? product : p);
      saveLocalData(STORAGE_KEYS.PRODUCTS, updated);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      await fetch(`${SERVER_URL}/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      const current = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      saveLocalData(STORAGE_KEYS.PRODUCTS, current.filter(p => p.id !== id));
    }
  },

  async getSales(): Promise<Sale[]> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      const res = await fetch(`${SERVER_URL}/sales`);
      return await res.json();
    } catch (e) {
      return getLocalData(STORAGE_KEYS.SALES, generateDefaultSales(DEFAULT_PRODUCTS));
    }
  },

  async addSale(sale: Sale): Promise<void> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      await fetch(`${SERVER_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
      });
    } catch (e) {
      const allSales = getLocalData<Sale[]>(STORAGE_KEYS.SALES, []);
      saveLocalData(STORAGE_KEYS.SALES, [...allSales, sale]);
      
      const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      const updatedProducts = products.map(p => {
        const soldItem = sale.items.find(item => item.id === p.id);
        if (soldItem) {
          return { ...p, stockQty: Math.max(0, p.stockQty - soldItem.quantity) };
        }
        return p;
      });
      saveLocalData(STORAGE_KEYS.PRODUCTS, updatedProducts);
    }
  },

  async deleteSale(saleId: string): Promise<void> {
    try {
      if (!SERVER_URL) throw new Error('Using local storage');
      await fetch(`${SERVER_URL}/sales/${saleId}`, { method: 'DELETE' });
    } catch (e) {
      const currentSales = getLocalData<Sale[]>(STORAGE_KEYS.SALES, []);
      const saleToDelete = currentSales.find(s => s.id === saleId);
      
      if (saleToDelete) {
        const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
        const restored = products.map(p => {
          const itemInSale = saleToDelete.items.find(item => item.id === p.id);
          if (itemInSale) return { ...p, stockQty: p.stockQty + itemInSale.quantity };
          return p;
        });
        saveLocalData(STORAGE_KEYS.PRODUCTS, restored);
        saveLocalData(STORAGE_KEYS.SALES, currentSales.filter(s => s.id !== saleId));
      }
    }
  },

  async getCategories(): Promise<string[]> {
    const products = await this.getProducts();
    const categories = products.map(p => p.category).filter(c => !!c);
    const unique = Array.from(new Set(categories));
    return (unique as string[]).sort();
  },

  async getCompanies(): Promise<string[]> {
    const products = await this.getProducts();
    const companies = products.map(p => p.company).filter(c => !!c);
    const unique = Array.from(new Set(companies));
    return (unique as string[]).sort();
  }
};
