import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dbService } from '../services/dbService';
import { Product, Sale } from '../types';

const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [salesData, productsData] = await Promise.all([
          dbService.getSales(),
          dbService.getProducts()
        ]);
        setSales(salesData);
        setProducts(productsData);
      } catch (err) {
        console.error("Dashboard failed to sync data", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const todaySales = sales.filter(s => s.timestamp >= startOfToday);
    const yearSales = sales.filter(s => s.timestamp >= startOfYear);
    const dailyRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const dailyProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
    const yearlyRevenue = yearSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const yearlyProfit = yearSales.reduce((sum, s) => sum + s.profit, 0);
    const lowStockAlerts = products.filter(p => p.stockQty <= p.reorderLevel);

    return {
      dailyRevenue,
      dailyProfit,
      yearlyRevenue,
      yearlyProfit,
      alertCount: lowStockAlerts.length,
      alertList: lowStockAlerts.slice(0, 5)
    };
  }, [sales, products]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets = months.map(m => ({ label: m, value: 0 }));
    const currentYear = new Date().getFullYear();
    sales.forEach(sale => {
      const saleDate = new Date(sale.timestamp);
      if (saleDate.getFullYear() === currentYear) {
        const monthIndex = saleDate.getMonth();
        buckets[monthIndex].value += sale.totalAmount;
      }
    });
    return buckets;
  }, [sales]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compiling Intelligence...</p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn overflow-y-auto no-scrollbar pb-10">

      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100">
             <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Dashboard</h1>
          </div>
        </div>
        <div className="text-right">
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* Daily Stats */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Revenue Today</p>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{metrics.dailyRevenue.toLocaleString()}</p>
            <div className="mt-2 flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Daily Target: ₹5,000</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-100 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Profit Today</p>
          <div>
            <p className="text-3xl font-black text-black-600 tracking-tighter">₹{metrics.dailyProfit.toLocaleString()}</p>
            <div className="mt-2 flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Net Margin Today</p>
            </div>
          </div>
        </div>

        <div className="bg-[#ffffff] p-8 rounded-[2rem] shadow-xl flex flex-col justify-between group transition-all">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Revenue (CY {new Date().getFullYear()})</p>
          <div>
            <p className="text-3xl font-black text-black tracking-tighter">₹{metrics.yearlyRevenue.toLocaleString()}</p>
            <div className="mt-2 flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Annual Gross Ledger</p>
            </div>
          </div>
        </div>
        <div className="bg-[#ffffff] p-8 rounded-[2rem] shadow-xl flex flex-col justify-between group transition-all">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Profit (CY {new Date().getFullYear()})</p>
          <div>
            <p className="text-3xl font-black text-black-400 tracking-tighter">₹{metrics.yearlyProfit.toLocaleString()}</p>
            <div className="mt-2 flex items-center">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></span>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Annual Yield</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Annual Sales Performance</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Flow by Month</p>
            </div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">CY {new Date().getFullYear()}</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  dy={15}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.label}</p>
                          <p className="text-xl font-black text-indigo-600 tracking-tighter">₹{payload[0].value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[15, 15, 0, 0]} barSize={42}>
                  {chartData.map((entry, index) => {
                    const isCurrent = index === new Date().getMonth();
                    return <Cell key={`cell-${index}`} fill={isCurrent ? '#4f46e5' : '#f1f5f9'} className="transition-all duration-300 hover:fill-indigo-300" />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col space-y-5">
           <div className="flex justify-between items-center px-2">
             <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Stock Ledger Alerts</h3>
             <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-4 py-1.5 rounded-full uppercase tracking-tighter">{metrics.alertCount} Critical</span>
           </div>
           <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
              {metrics.alertList.length > 0 ? metrics.alertList.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex items-center justify-between group hover:border-rose-100 transition-all cursor-default">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-rose-600">{item.name}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-1 truncate">{item.company}</p>
                  </div>
                  <div className="text-right shrink-0 ml-6">
                    <p className="text-lg font-black text-rose-600 tracking-tighter">{item.stockQty}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Units Left</p>
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 p-12 text-center">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed">Inventory Healthy<br/>No Restock Required</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
