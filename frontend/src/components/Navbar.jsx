import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, PlusCircle, Store } from 'lucide-react';

export function Navbar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Create Order', path: '/orders/new', icon: PlusCircle },
    { name: 'Products & Stock', path: '/products', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center text-white shadow-sm">
              <Store className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block">
                Commerce Order Console
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Store Operations Staff
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-navy-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-2 text-slate-500" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
