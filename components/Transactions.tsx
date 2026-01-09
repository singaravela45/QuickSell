
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Sale } from '../types';

const Transactions: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const data = await dbService.getSales();
    setSales(data.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (confirm("Permanently void this transaction and restore stock? This cannot be undone.")) {
      await dbService.deleteSale(saleId);
      await loadSales();
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Ledgers...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Transactions</h1>
          <p className="text-sm text-slate-400 font-medium">Consolidated Sale Master Ledger</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-8">Sale ID</th>
                <th className="px-10 py-8">Datetime</th>
                <th className="px-10 py-8">Payment</th>
                <th className="px-10 py-8 text-right">Revenue</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {sales.map(sale => (
                <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      #{sale.id}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-bold text-slate-700 text-xs uppercase tracking-tight">
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white text-slate-400 border border-slate-100 shadow-sm">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className="font-black text-slate-900 text-lg tracking-tighter">₹{sale.totalAmount.toFixed(2)}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end items-center space-x-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-indigo-50 rounded-lg"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-rose-400 hover:text-rose-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-rose-50 rounded-lg"
                      >
                        Void
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-[#0a0c10]/70 backdrop-blur-md flex items-center justify-center z-[500] p-10 animate-fadeIn">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-12 border-b border-slate-50 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Receipt Information</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Order #{selectedSale.id}</h2>
                <div className="flex items-center space-x-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>{new Date(selectedSale.timestamp).toLocaleString()}</span>
                  <span>• {selectedSale.paymentMethod}</span>
                </div>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-4 bg-slate-50 rounded-3xl text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-3 no-scrollbar">
               {selectedSale.items.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center py-4 px-6 bg-slate-50/50 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                      <span className="text-[9px] font-bold text-slate-400">{item.quantity} x ₹{item.sellingPrice.toFixed(2)}</span>
                    </div>
                    <p className="font-black text-slate-900 text-sm tracking-tighter">
                      ₹{(item.sellingPrice * (1 - item.discount/100) * item.quantity).toFixed(2)}
                    </p>
                 </div>
               ))}
            </div>

            <div className="p-12 bg-slate-50/30 border-t border-slate-100 flex justify-between items-end">
              <div className="text-right ml-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grand Total Amount</p>
                <p className="text-5xl font-black text-indigo-600 tracking-tighter">₹{selectedSale.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
