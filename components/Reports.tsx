
import React, { useEffect, useState, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Sale } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbService.getSales().then(s => {
      setSales(s);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const yearlySales = sales.filter(s => s.timestamp >= startOfYear);
    
    const yearRevenue = yearlySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const yearProfit = yearlySales.reduce((acc, s) => acc + s.profit, 0);
    const yearAvgOrder = yearlySales.length ? (yearRevenue / yearlySales.length) : 0;

    const lifetimeRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const lifetimeProfit = sales.reduce((acc, s) => acc + s.profit, 0);

    return {
      yearRevenue,
      yearProfit,
      yearAvgOrder,
      lifetimeRevenue,
      lifetimeProfit,
      currentYear
    };
  }, [sales]);

  const chartData = useMemo(() => {
    return [...sales]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(s => ({
        time: new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        total: Math.round(s.totalAmount),
        profit: Math.round(s.profit),
      }));
  }, [sales]);

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Compiling Analytics...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-fadeIn overflow-y-auto no-scrollbar h-full pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Reports</h1>
          <p className="text-sm text-slate-400 font-medium">Annual Performance Ledger (INR ₹)</p>
        </div>
        <span className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">
          CY {stats.currentYear}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-indigo-600 transition-colors">Yearly Revenue</p>
          <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">₹{stats.yearRevenue.toLocaleString()}</h4>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">Lifetime: ₹{stats.lifetimeRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-emerald-600 transition-colors">Yearly Profit</p>
          <h4 className="text-4xl font-black text-emerald-600 tracking-tighter">₹{stats.yearProfit.toLocaleString()}</h4>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">Lifetime: ₹{stats.lifetimeProfit.toLocaleString()}</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-indigo-400 transition-colors">Avg Order (YTD)</p>
          <h4 className="text-4xl font-black text-indigo-400 tracking-tighter">₹{stats.yearAvgOrder.toFixed(2)}</h4>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">Transaction Yield Rate</p>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Financial Timeline</h3>
          <div className="flex space-x-6 text-[9px] font-black uppercase tracking-widest">
            <div className="flex items-center"><span className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></span> Revenue</div>
            <div className="flex items-center"><span className="w-3 h-3 border-2 border-emerald-500 rounded-full mr-2"></span> Profit</div>
          </div>
        </div>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} fontWeight="bold" dy={15} />
              <YAxis stroke="#cbd5e1" fontSize={10} fontWeight="bold" dx={-10} />
              <Tooltip 
                formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }} 
              />
              <Line type="monotone" dataKey="total" name="Revenue" stroke="#4f46e5" strokeWidth={5} dot={false} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} strokeDasharray="10 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
