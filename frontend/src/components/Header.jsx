import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

export function Header({ onOpenSidebar }) {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Operations Dashboard';
      case '/orders':
        return 'Orders Management';
      case '/orders/new':
        return 'Create Customer Order';
      case '/products':
        return 'Products & Inventory';
      default:
        return 'Order Console';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 h-16 shadow-2xs">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-brand-teal hover:bg-slate-100 focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-brand-teal tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 font-medium">
              Fynd Hiring Hackathon • Store Operations Staff Portal
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Store DB Active</span>
          </div>

          <Link to="/orders/new">
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              className="font-bold shadow-xs"
            >
              New Order
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
