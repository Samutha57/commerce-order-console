import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  PlusCircle, 
  Store, 
  X,
  Database,
  CheckCircle2
} from 'lucide-react';

export function Sidebar({ open, onClose }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Orders Management', path: '/orders', icon: ShoppingBag },
    { name: 'Create Order', path: '/orders/new', icon: PlusCircle },
    { name: 'Products & Stock', path: '/products', icon: Package },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Deep Dark Teal (#013531) Background with #02968A Branding */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-teal-sidebar text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xl border-r border-[#012724] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header with Teal Green (#02968A) Accent */}
          <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between bg-brand-teal-sidebar-surface">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-teal flex items-center justify-center text-white shadow-md ring-2 ring-white/15">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white block">
                  Commerce Order
                </span>
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block">
                  Operations Console
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3.5 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-extrabold text-teal-300 uppercase tracking-wider">
              Store Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-teal text-white shadow-md ring-1 ring-white/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.path === '/orders/new' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-brand-teal-dark">
                      New
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer Database Status Card */}
        <div className="p-4 m-3 bg-brand-teal-sidebar-surface rounded-xl border border-white/10">
          <div className="flex items-center space-x-2 text-xs font-bold text-white mb-1">
            <Database className="w-3.5 h-3.5 text-teal-300" />
            <span>SQLite ACID Engine</span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2 leading-tight">
            Atomic transactions & conditional inventory deduction active.
          </p>
          <div className="flex items-center text-[10px] text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Store Database Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
