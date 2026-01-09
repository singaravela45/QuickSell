
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon, colorClass }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-md hover:-translate-y-1">
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {trend !== undefined && (
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">vs Last Month</span>
            </div>
          )}
        </div>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass} text-white shadow-lg`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
