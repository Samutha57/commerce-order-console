import React from 'react';
import { ClipboardCheck, PackageSearch, PackageCheck, Truck, XCircle, AlertCircle } from 'lucide-react';

export function OrderProgressTracker({ status, cancelledAt }) {
  const isCancelled = status === 'Cancelled';

  // 4 workflow stages: Placed, Picking (visual preparation step), Packing, Shipped
  const steps = [
    { id: 'placed', label: 'Order Placed', icon: ClipboardCheck, subtitle: 'Received' },
    { id: 'picking', label: 'Picking', icon: PackageSearch, subtitle: 'Warehouse Prep' },
    { id: 'packing', label: 'Packing', icon: PackageCheck, subtitle: 'Quality Checked' },
    { id: 'shipped', label: 'Shipping', icon: Truck, subtitle: 'Dispatched' },
  ];

  // Map state to visual stage
  const getStepStatus = (index) => {
    if (isCancelled) return 'cancelled';

    if (status === 'Placed') {
      if (index === 0) return 'current';
      if (index === 1) return 'in-prep';
      return 'upcoming';
    }

    if (status === 'Packed') {
      if (index <= 1) return 'completed';
      if (index === 2) return 'current';
      return 'upcoming';
    }

    if (status === 'Shipped') {
      return 'completed';
    }

    return 'upcoming';
  };

  return (
    <div className="w-full bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      {/* Title & Stage Badge */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-brand-teal tracking-wider uppercase">
            Order Fulfillment Pipeline
          </span>
          <span className="text-[11px] text-slate-400">• Real-Time Tracking</span>
        </div>
        <div>
          {isCancelled ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
              Order Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-teal-light text-brand-teal border border-brand-teal/20">
              Current Stage: <span className="ml-1 font-extrabold">{status}</span>
            </span>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="mb-6 p-3 bg-rose-50/80 border border-rose-200 rounded-lg flex items-center text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
          <span>
            This order was cancelled on <strong>{cancelledAt ? new Date(cancelledAt).toLocaleString() : 'record'}</strong>. Inventory was automatically restored to warehouse stock.
          </span>
        </div>
      )}

      {/* Horizontal Stepper */}
      <div className="relative">
        {/* Background Connecting Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -translate-y-1/2 z-0 hidden sm:block rounded-full" />

        {/* Dynamic Progress Line in Teal Green (#02968A) */}
        {!isCancelled && (
          <div
            className="absolute top-5 left-6 h-1 bg-brand-teal -translate-y-1/2 z-0 transition-all duration-300 hidden sm:block rounded-full shadow-xs"
            style={{
              width:
                status === 'Shipped'
                  ? 'calc(100% - 3rem)'
                  : status === 'Packed'
                  ? 'calc(66.6% - 2rem)'
                  : 'calc(25% - 1rem)',
            }}
          />
        )}

        {/* Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const stepState = getStepStatus(idx);
            const Icon = step.icon;

            let iconContainerClasses = 'bg-slate-100 text-slate-400 border-slate-300';
            let labelClasses = 'text-slate-500';
            let badgeText = 'Upcoming';
            let badgeBg = 'bg-slate-100 text-slate-500';

            if (stepState === 'completed') {
              // Completed: Green indicator
              iconContainerClasses = 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
              labelClasses = 'text-slate-900 font-bold';
              badgeText = 'Completed';
              badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
            } else if (stepState === 'current') {
              // Current: Teal Green (#02968A) with prominent ring accent
              iconContainerClasses = 'bg-brand-teal text-white border-brand-teal shadow-md ring-4 ring-brand-teal/20';
              labelClasses = 'text-brand-teal font-extrabold';
              badgeText = 'In Progress';
              badgeBg = 'bg-brand-teal-light text-brand-teal border border-brand-teal/30 font-bold';
            } else if (stepState === 'in-prep') {
              iconContainerClasses = 'bg-brand-teal-light text-brand-teal border-brand-teal/50 border-dashed';
              labelClasses = 'text-brand-teal font-semibold';
              badgeText = 'Visual Prep';
              badgeBg = 'bg-brand-teal-light text-brand-teal border border-brand-teal/30 font-semibold';
            } else if (stepState === 'cancelled') {
              iconContainerClasses = 'bg-slate-100 text-slate-400 border-slate-200 line-through';
              labelClasses = 'text-slate-400';
              badgeText = 'Cancelled';
              badgeBg = 'bg-rose-50 text-rose-500';
            }

            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${iconContainerClasses}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Step Text */}
                <div className="mt-3">
                  <p className={`text-xs ${labelClasses}`}>{step.label}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderProgressTracker;
