import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export function Toast({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className={`flex items-start p-4 rounded-lg shadow-lg border ${
        isSuccess 
          ? 'bg-white border-emerald-200 text-emerald-900' 
          : 'bg-white border-rose-200 text-rose-900'
      }`}>
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm font-semibold">
            {isSuccess ? 'Success' : 'Action Failed'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
