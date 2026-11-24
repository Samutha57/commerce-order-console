import React from 'react';
import { 
  ClipboardList, 
  PackageCheck, 
  Truck, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon 
} from 'lucide-react';

export function StatusBadge({ status, type = 'order', size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (type === 'stock') {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className={`inline-flex items-center font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className={`inline-flex items-center font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className={`inline-flex items-center font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Out of Stock
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
            {status}
          </span>
        );
    }
  }

  // Order Status Badges per requirements:
  // - Orders: Blue (Placed)
  // - Packed: Teal Green (#02968A)
  // - Shipped: Blue
  // - Cancelled: Red
  switch (status) {
    case 'Placed':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <ClipboardList className="w-3.5 h-3.5 mr-1 text-blue-600" />
          Placed
        </span>
      );
    case 'Packed':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-brand-teal-light text-brand-teal border border-brand-teal/40 ${sizeClasses}`}>
          <PackageCheck className="w-3.5 h-3.5 mr-1 text-brand-teal" />
          Packed
        </span>
      );
    case 'Shipped':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <Truck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
          Shipped
        </span>
      );
    case 'Cancelled':
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}

export default StatusBadge;
