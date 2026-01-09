
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PointOfSale from './components/PointOfSale';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Transactions from './components/Transactions';
import { Page } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const renderPage = () => {
    switch (activePage) {
      case Page.Dashboard: return <Dashboard />;
      case Page.POS: return <PointOfSale />;
      case Page.Inventory: return <Inventory />;
      case Page.Transactions: return <Transactions />;
      case Page.Reports: return <Reports />;
      default: return <Dashboard />;
    }
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900 relative overflow-x-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[45] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar 
        activePage={activePage} 
        onPageChange={(page) => {
          setActivePage(page);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isSidebarOpen && (
              <button 
                onClick={toggleSidebar}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
                aria-label="Open Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight ml-2">{activePage}</h2>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Active</span>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {renderPage()}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
