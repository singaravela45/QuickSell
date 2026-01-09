
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Product } from '../types';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCompany, setActiveCompany] = useState('All');
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
    const [prodData, catData, compData] = await Promise.all([
      dbService.getProducts(),
      dbService.getCategories(),
      dbService.getCompanies()
    ]);
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
  const companyOptions = useMemo(() => ['All', ...companies], [companies]);

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
    await loadInitialData();
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

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesCompany = activeCompany === 'All' || p.company === activeCompany;
    return matchesSearch && matchesCategory && matchesCompany;
  });

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Master Inventory...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Inventory</h1>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{products.length} Items Ledgered</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              placeholder="Search SKU or Name..."
              className="pl-12 pr-6 py-4 border border-slate-100 rounded-2xl text-[11px] bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-full md:w-80 font-black uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { resetForm(); setEditingId(null); setShowProductModal(true); }}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 shrink-0"
          >
            + New Item
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS: CATEGORIES & BRANDS (Scrollable) */}
      <div className="space-y-4">
        {/* Category Filter Bar */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mr-6 shrink-0">Categories:</span>
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
            {categoryOptions.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 ${
                  activeCategory === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Filter Bar */}
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mr-6 shrink-0">Companies:</span>
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
            {companyOptions.map(comp => (
              <button 
                key={comp} 
                onClick={() => setActiveCompany(comp)}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 ${
                  activeCompany === comp 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50">
                <th className="px-10 py-8">Product Name</th>
                <th className="px-10 py-8">Brand</th>
                <th className="px-10 py-8">Category</th>
                <th className="px-10 py-8 text-right">Selling (₹)</th>
                <th className="px-10 py-8 text-center">Ledger Status</th>
                <th className="px-10 py-8 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 group transition-all">
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">{p.sku}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-lg">{p.company}</span>
                  </td>
                  <td className="px-10 py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">{p.category}</td>
                  <td className="px-10 py-6 text-right">
                    <p className="font-black text-slate-900 text-lg tracking-tighter">₹{p.sellingPrice.toFixed(2)}</p>
                    <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Cost: ₹{p.costPrice.toFixed(2)}</p>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${
                      p.stockQty <= p.reorderLevel 
                        ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-50' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50'
                    }`}>
                      {p.stockQty <= p.reorderLevel ? 'Critical' : 'Healthy'}: {p.stockQty} Units
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end space-x-6 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenRestock(p)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 underline underline-offset-4 decoration-2">Restock</button>
                      <button onClick={() => handleEdit(p)} className="text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 underline underline-offset-4 decoration-2">Edit</button>
                      <button onClick={() => deleteProd(p.id)} className="text-rose-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-600 underline underline-offset-4 decoration-2">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching ledger entries found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT REGISTRATION/EDIT MODAL - COMPACT VERSION */}
      {showProductModal && (
        <div className="fixed inset-0 bg-[#0a0c10]/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingId ? 'Modify Ledger Entry' : 'New Asset Registration'}
                </h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Master Inventory Management</p>
              </div>
              <button onClick={() => { setShowProductModal(false); setEditingId(null); }} className="text-slate-300 hover:text-slate-900 p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Product Designation</label>
                <input required autoFocus placeholder="e.g. Premium Parker Jotter" className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase tracking-tight" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Category</label>
                  <input required list="cats" placeholder="Type to add new..." className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})} />
                  <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Brand/Company</label>
                  <input required list="comps" placeholder="Type to add new..." className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase" value={prodForm.company} onChange={e => setProdForm({...prodForm, company: e.target.value})} />
                  <datalist id="comps">{companies.map(c => <option key={c} value={c} />)}</datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Selling Value (₹)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">₹</span>
                    <input type="number" step="0.01" required className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-10 pr-6 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={prodForm.sellingPrice} onChange={e => setProdForm({...prodForm, sellingPrice: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Acquisition Cost (₹)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">₹</span>
                    <input type="number" step="0.01" required className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-10 pr-6 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={prodForm.costPrice} onChange={e => setProdForm({...prodForm, costPrice: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Initial Stock Units</label>
                  <input type="number" required className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={prodForm.stockQty} onChange={e => setProdForm({...prodForm, stockQty: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1">Reorder Threshold</label>
                  <input type="number" required className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={prodForm.reorderLevel} onChange={e => setProdForm({...prodForm, reorderLevel: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                <button type="submit" className="flex-[2] bg-indigo-600 text-white rounded-xl py-4 px-8 font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                  {editingId ? 'Sync Updates' : 'Authorize Asset'}
                </button>
                <button type="button" onClick={() => { setShowProductModal(false); setEditingId(null); }} className="flex-1 bg-slate-50 text-slate-400 rounded-xl py-4 px-8 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL RESTOCK MODAL */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 bg-[#0a0c10]/70 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-slideUp overflow-hidden">
            <div className="px-8 pt-10 pb-4 flex justify-between items-center border-b border-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Manual Restock</h2>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 truncate">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-300 hover:text-slate-900 p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">On Hand</p>
                  <p className="text-2xl font-black text-slate-900">{selectedProduct.stockQty}</p>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-2xl text-center border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Adjusted</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {selectedProduct.stockQty + (parseInt(restockAmount) || 0)}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] block px-1 text-center">Increase Quantity By</label>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="Units..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-8 text-4xl font-black text-center text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  value={restockAmount} 
                  onChange={e => setRestockAmount(e.target.value)} 
                />
              </div>
              <button 
                onClick={handleConfirmRestock} 
                className="w-full bg-indigo-600 text-white rounded-xl py-4 px-6 font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Apply To Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
