
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Product } from '../types';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockAmount, setRestockAmount] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [prodForm, setProdForm] = useState<Omit<Product, 'id'>>({
    name: '', 
    sku: '', 
    sellingPrice: 0, 
    costPrice: 0, 
    stockQty: 0, 
    category: '', 
    company: '', 
    reorderLevel: 5
  });

  useEffect(() => { 
    loadInitialData(); 
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const prodData = await dbService.getProducts();
    const catData = await dbService.getCategories();
    const compData = await dbService.getCompanies();
    setProducts(prodData);
    setCategories(catData);
    setCompanies(compData);
    setLoading(false);
  };

  const loadProducts = async () => {
    const data = await dbService.getProducts();
    setProducts(data);
  };

  const categoryOptions = useMemo(() => ['All', ...categories], [categories]);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await dbService.updateProduct({ ...prodForm, id: editingId });
    } else {
      const finalSku = prodForm.sku || `SKU-${Math.floor(Math.random() * 9000) + 1000}`;
      await dbService.addProduct({ ...prodForm, sku: finalSku });
    }
    setShowProductModal(false);
    setEditingId(null);
    loadInitialData();
    resetForm();
  };

  const resetForm = () => {
    setProdForm({ name: '', sku: '', sellingPrice: 0, costPrice: 0, stockQty: 0, category: '', company: '', reorderLevel: 5 });
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setProdForm({
      name: p.name,
      sku: p.sku,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      stockQty: p.stockQty,
      category: p.category,
      company: p.company,
      reorderLevel: p.reorderLevel
    });
    setShowProductModal(true);
  };

  const handleOpenRestock = (p: Product) => {
    setSelectedProduct(p);
    setRestockAmount('');
    setShowRestockModal(true);
  };

  const handleConfirmRestock = async () => {
    const amt = parseInt(restockAmount);
    if (!selectedProduct || isNaN(amt) || amt <= 0) return;
    await dbService.updateProduct({ 
      ...selectedProduct, 
      stockQty: selectedProduct.stockQty + amt 
    });
    setShowRestockModal(false);
    loadProducts();
  };

  const deleteProd = async (id: string) => {
    if (confirm("Delete this product?")) {
      await dbService.deleteProduct(id);
      loadInitialData();
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Master Inventory...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Inventory</h1>
          <p className="text-sm text-slate-400 font-medium">{products.length} Items Ledgered</p>
        </div>
        <div className="flex space-x-3">
          <input 
            type="text" 
            placeholder="Search SKU or Name..."
            className="px-6 py-3 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-80 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={() => { resetForm(); setEditingId(null); setShowProductModal(true); }}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            + New Item
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2">
          {categoryOptions.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
              <th className="px-10 py-6">Product</th>
              <th className="px-10 py-6">Brand</th>
              <th className="px-10 py-6">Category</th>
              <th className="px-10 py-6 text-right">Pricing (₹)</th>
              <th className="px-10 py-6 text-center">Status</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 group transition-all">
                <td className="px-10 py-6">
                  <p className="font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                  <p className="text-[10px] text-indigo-500 font-mono font-black uppercase tracking-widest mt-0.5">{p.sku}</p>
                </td>
                <td className="px-10 py-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{p.company}</span>
                </td>
                <td className="px-10 py-6 text-slate-500 font-bold uppercase text-[10px] tracking-widest">{p.category}</td>
                <td className="px-10 py-6 text-right">
                  <p className="font-black text-slate-900 text-lg tracking-tighter">₹{p.sellingPrice.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Cost: ₹{p.costPrice.toFixed(2)}</p>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border ${
                    p.stockQty <= p.reorderLevel 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {p.stockQty <= p.reorderLevel ? 'Refill' : 'Stocked'}: {p.stockQty}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                   <div className="flex justify-end space-x-6 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => handleOpenRestock(p)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Restock</button>
                     <button onClick={() => handleEdit(p)} className="text-slate-600 font-black text-[10px] uppercase tracking-widest hover:underline">Edit</button>
                     <button onClick={() => deleteProd(p.id)} className="text-rose-400 font-black text-[10px] uppercase tracking-widest hover:underline">Delete</button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 bg-[#0a0c10]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden">
            <div className="px-12 pt-10 pb-6 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {editingId ? 'Edit Product' : 'Register Item'}
              </h2>
              <button onClick={() => { setShowProductModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="px-12 pb-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Item Label</label>
                <input required autoFocus placeholder="e.g. Executive Bond Paper" className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Category</label>
                  <input required list="cats" placeholder="Category" className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})} />
                  <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Brand</label>
                  <input required list="comps" placeholder="Brand" className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900" value={prodForm.company} onChange={e => setProdForm({...prodForm, company: e.target.value})} />
                  <datalist id="comps">{companies.map(c => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Selling Price (₹)</label>
                  <input type="number" step="0.01" required className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900" value={prodForm.sellingPrice} onChange={e => setProdForm({...prodForm, sellingPrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Cost Price (₹)</label>
                  <input type="number" step="0.01" required className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900" value={prodForm.costPrice} onChange={e => setProdForm({...prodForm, costPrice: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Stock Units</label>
                  <input type="number" required className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900" value={prodForm.stockQty} onChange={e => setProdForm({...prodForm, stockQty: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Reorder Level</label>
                  <input type="number" required className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900" value={prodForm.reorderLevel} onChange={e => setProdForm({...prodForm, reorderLevel: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="pt-6 flex space-x-4">
                <button type="submit" className="flex-[2] bg-indigo-600 text-white rounded-2xl py-5 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                  {editingId ? 'Save Changes' : 'Confirm Registration'}
                </button>
                <button type="button" onClick={() => { setShowProductModal(false); setEditingId(null); }} className="flex-1 bg-slate-50 text-slate-400 rounded-2xl py-5 px-8 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 bg-[#0a0c10]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-slideUp overflow-hidden">
            <div className="px-10 pt-10 pb-6 flex justify-between items-center border-b border-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manual Restock</h2>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-10 py-10 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current</p>
                  <p className="text-2xl font-black text-slate-900">{selectedProduct.stockQty}</p>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-3xl text-center">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">New Total</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {selectedProduct.stockQty + (parseInt(restockAmount) || 0)}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1 text-center">Manual Quantity Entry</label>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="Units..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-8 text-4xl font-black text-center text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  value={restockAmount} 
                  onChange={e => setRestockAmount(e.target.value)} 
                />
              </div>
              <button 
                onClick={handleConfirmRestock} 
                className="w-full bg-indigo-600 text-white rounded-2xl py-6 px-8 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Update Stock Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
