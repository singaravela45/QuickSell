
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Product, CartItem, Sale } from '../types';

/**
 * 🛒 POINT OF SALE (Clean Professional Edition)
 * Optimized layout for high-speed retail operations.
 */
const PointOfSale: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [keypadValue, setKeypadValue] = useState('');
  const [activeKeypadMode, setActiveKeypadMode] = useState<'QTY' | 'DISC' | 'PRICE'>('QTY');
  const [selectedCartItemIdx, setSelectedCartItemIdx] = useState<number | null>(null);

  useEffect(() => {
    dbService.getProducts().then(setProducts);
  }, []);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);
  const filteredProducts = products.filter(p => 
    (activeCategory === 'All' || p.category === activeCategory)
  );

  const addToCart = (product: Product) => {
    if (product.stockQty <= 0) return;
    const existingIdx = cart.findIndex(item => item.id === product.id);
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].quantity += 1;
      setCart(newCart);
      setSelectedCartItemIdx(existingIdx);
    } else {
      const newItem = { ...product, quantity: 1, discount: 0 };
      const newCart = [...cart, newItem];
      setCart(newCart);
      setSelectedCartItemIdx(newCart.length - 1);
    }
    setKeypadValue('');
  };

  const removeFromCart = (idx: number) => {
    const newCart = cart.filter((_, i) => i !== idx);
    setCart(newCart);
    if (selectedCartItemIdx === idx) {
      setSelectedCartItemIdx(null);
    } else if (selectedCartItemIdx !== null && selectedCartItemIdx > idx) {
      setSelectedCartItemIdx(selectedCartItemIdx - 1);
    }
    setKeypadValue('');
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setKeypadValue('');
      updateActiveItem('');
      return;
    }
    const newValue = keypadValue + val;
    setKeypadValue(newValue);
    updateActiveItem(newValue);
  };

  const updateActiveItem = (valStr: string) => {
    if (selectedCartItemIdx === null || cart.length === 0) return;
    const val = parseFloat(valStr) || 0;
    const newCart = [...cart];
    const item = newCart[selectedCartItemIdx];
    if (activeKeypadMode === 'QTY') item.quantity = Math.max(0, val || 1);
    if (activeKeypadMode === 'DISC') item.discount = Math.min(100, val);
    if (activeKeypadMode === 'PRICE') item.sellingPrice = val;
    setCart(newCart);
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => {
    const discountedPrice = item.sellingPrice * (1 - (item.discount / 100));
    return acc + (discountedPrice * item.quantity);
  }, 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const sale: Sale = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      timestamp: Date.now(),
      totalAmount: cartTotal,
      profit: cart.reduce((acc, item) => acc + ((item.sellingPrice * (1 - item.discount/100)) - item.costPrice) * item.quantity, 0),
      paymentMethod: paymentMethod as any,
      discount: cart.reduce((acc, item) => acc + (item.sellingPrice * (item.discount/100) * item.quantity), 0),
      items: cart
    };
    await dbService.addSale(sale);
    setCart([]);
    setSelectedCartItemIdx(null);
    setShowReviewModal(false);
    setProducts(await dbService.getProducts());
  };

  const selectedItem = selectedCartItemIdx !== null ? cart[selectedCartItemIdx] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white overflow-hidden rounded-[3rem] shadow-2xl border border-slate-100 animate-slideUp">
      
      {/* 🚀 MAIN INTERFACE: Two-Column Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* 📦 LEFT: LARGE PRODUCT CATALOG (Maximized Space) */}
        <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0 border-r border-slate-100">
          <div className="p-4 bg-white border-b border-slate-100">
            {/* Scrollable Category Bar */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide flex-nowrap pb-1 cursor-grab active:cursor-grabbing">
              {categories.map(c => (
                <button 
                  key={c} 
                  onClick={() => setActiveCategory(c)} 
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shrink-0 ${
                    activeCategory === c 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 auto-rows-max no-scrollbar">
            {filteredProducts.map(p => {
              const inCartCount = cart.find(item => item.id === p.id)?.quantity || 0;
              return (
                <button 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  className={`group bg-white rounded-3xl p-6 text-left flex flex-col shadow-sm border transition-all hover:shadow-xl hover:border-indigo-400 relative ${
                    p.stockQty <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : 'border-slate-100'
                  } ${inCartCount > 0 ? 'ring-4 ring-indigo-50 border-indigo-200' : ''}`}
                >
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">{p.company}</span>
                    <h4 className="font-black text-slate-900 text-sm tracking-tight leading-tight line-clamp-2 uppercase">
                      {p.name}
                    </h4>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-50">
                    <span className="text-xl font-black text-indigo-600 tracking-tighter">₹{p.sellingPrice.toFixed(0)}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${p.stockQty < 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {p.stockQty} Qty
                    </span>
                  </div>

                  {inCartCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
                      {inCartCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ⌨️ RIGHT: ADJUSTMENT CONSOLE (Persistent Keypad) */}
        <div className="w-[340px] flex flex-col bg-white shadow-xl z-10 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center space-x-3 bg-slate-50/20">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Adjust Item</h3>
          </div>
          
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className={`flex-none min-h-[120px] rounded-3xl border-2 p-5 flex flex-col transition-all duration-300 ${selectedItem ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-slate-50/50 opacity-40 grayscale'}`}>
                  {selectedItem ? (
                  <div className="h-full flex flex-col">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 truncate">{selectedItem.name}</p>
                      <div className="mt-auto flex justify-between items-end">
                          <div>
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{activeKeypadMode}</p>
                              <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                  {keypadValue || (activeKeypadMode === 'QTY' ? selectedItem.quantity : activeKeypadMode === 'DISC' ? selectedItem.discount : selectedItem.sellingPrice)}
                              </p>
                          </div>
                      </div>
                  </div>
                  ) : <div className="h-full flex items-center justify-center text-center px-4"><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Select a product<br/>to adjust its line</p></div>}
              </div>
              
              <div className="flex-1 flex flex-col space-y-3">
                  <div className="grid grid-cols-3 gap-2 flex-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map((val) => (
                      <button 
                        key={val} 
                        onClick={() => handleKeypadPress(val.toString())} 
                        className={`flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl text-2xl font-black text-slate-800 transition-all active:scale-90 ${!selectedItem && 'pointer-events-none opacity-50'}`}
                      >
                        {val}
                      </button>
                      ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 shrink-0">
                      {(['QTY', 'DISC', 'PRICE'] as const).map((mode) => (
                          <button 
                            key={mode} 
                            onClick={() => {setActiveKeypadMode(mode); setKeypadValue('');}} 
                            className={`py-4 rounded-2xl font-black text-[9px] transition-all tracking-widest uppercase ${activeKeypadMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                          >
                            {mode}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* 📊 BOTTOM SUMMARY BAR */}
      <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center space-x-10">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected SKUs</span>
              <span className="text-xl font-black text-slate-900 tracking-tighter">{cart.length} Products</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pay</span>
              <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{cartTotal.toLocaleString()}</span>
           </div>
        </div>
        
        <button 
          onClick={() => cart.length > 0 && setShowReviewModal(true)} 
          disabled={cart.length === 0} 
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-20 text-white rounded-2xl px-12 py-5 font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center space-x-3"
        >
          <span>Finalize Order</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>

      {/* 🧾 COMPACT REVIEW MODAL: Non-scrolling if possible */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-[#0a0c10]/70 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-slideUp overflow-hidden flex flex-col">
            
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Basket</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cart.length} Items Ledgered</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-2 no-scrollbar bg-slate-50/30">
              {cart.map((item, idx) => (
                <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between group">
                  <div className="flex-1 truncate pr-4">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest truncate">{item.company}</p>
                    <h5 className="font-black text-slate-900 text-xs uppercase truncate leading-tight">{item.name}</h5>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">₹{item.sellingPrice.toFixed(0)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-base font-black text-slate-900 tracking-tighter">₹{(item.sellingPrice * (1 - item.discount/100) * item.quantity).toFixed(0)}</p>
                    <button 
                      onClick={() => removeFromCart(idx)}
                      className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-white border-t border-slate-100 space-y-6">
              {/* Payment Methods: Only Cash and Card */}
              <div className="grid grid-cols-2 gap-3">
                {(['Cash', 'Card'] as const).map(m => (
                  <button 
                    key={m} 
                    onClick={() => setPaymentMethod(m)} 
                    className={`p-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between ${paymentMethod === m ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-md shadow-indigo-100' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                  >
                    <span>{m} Ledger</span>
                    {paymentMethod === m && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Grand Total</span>
                <span className="text-5xl font-black text-indigo-600 tracking-tighter">₹{cartTotal.toFixed(0)}</span>
              </div>

              <button 
                onClick={handleCheckout} 
                className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.4em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;
