
export interface Product {
  id: string; // product_id
  name: string;
  sku: string;
  category: string;
  company: string; // brand
  costPrice: number; // cost_price
  sellingPrice: number; // selling_price
  stockQty: number; // stock_qty
  reorderLevel: number; // reorder_level
}

export interface CartItem extends Product {
  quantity: number;
  discount: number; // Item-level discount (%)
}

export interface SaleItem {
  id?: string; // sale_item_id
  saleId: string; // sale_id
  productId: string; // product_id
  quantity: number;
  sellingPrice: number; // price at time of sale
  costPrice: number; // cost at time of sale
  lineTotal: number; // quantity * price
}

export interface Sale {
  id: string; // sale_id
  timestamp: number; // sale_datetime
  totalAmount: number; // total_amount
  profit: number; 
  paymentMethod: 'Cash' | 'Card' | 'Transfer'; // payment_method
  discount: number; // total discount amount
  items: CartItem[]; // mapped for frontend convenience
}

export enum Page {
  Dashboard = 'Dashboard',
  POS = 'Point of Sale',
  Inventory = 'Inventory',
  Transactions = 'Transactions',
  Reports = 'Reports'
}
