import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import OrderProgressTracker from '../components/OrderProgressTracker';
import OrderActionButtons from '../components/OrderActionButtons';
import Button from '../components/Button';
import { 
  X, 
  RefreshCw,
  ShoppingBag,
  Calendar,
  Hash,
  Clock
} from 'lucide-react';

export function OrderDetailsModal({ orderId, onClose, onOrderUpdated, showToast }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOrderById(orderId);
      setOrder(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchDetails();
    }
  }, [orderId]);

  const handleStatusTransition = async (id, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.updateOrderStatus(id, newStatus);
      setOrder(res.data);
      showToast?.({
        type: 'success',
        message: `Order advanced to ${newStatus} successfully`
      });
      onOrderUpdated?.();
    } catch (err) {
      showToast?.({
        type: 'error',
        message: err.message || `Failed to update status to ${newStatus}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.cancelOrder(id);
      setOrder(res.data);
      showToast?.({
        type: 'success',
        message: 'Order cancelled and stock restored to inventory'
      });
      onOrderUpdated?.();
    } catch (err) {
      showToast?.({
        type: 'error',
        message: err.message || 'Failed to cancel order'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-bold text-slate-900">
                  {order?.order_reference || 'Loading order...'}
                </span>
                {order && <StatusBadge status={order.status} />}
              </div>
              <p className="text-[11px] text-slate-500">Store Order Invoice & Fulfillment Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading && !order ? (
            <div className="py-16 flex flex-col justify-center items-center space-y-3 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-teal" />
              <span className="text-xs font-semibold">Fetching secure order details...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {error}
            </div>
          ) : order ? (
            <>
              {/* 1. Horizontal Order Progress Tracker */}
              <OrderProgressTracker 
                status={order.status} 
                cancelledAt={order.cancelled_at} 
              />

              {/* 2. Order Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 flex items-center">
                    <Hash className="w-3 h-3 mr-1 text-slate-400" /> Reference ID
                  </span>
                  <span className="font-mono font-semibold text-slate-900">{order.order_reference}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 flex items-center">
                    <Calendar className="w-3 h-3 mr-1 text-slate-400" /> Placed At
                  </span>
                  <span className="font-medium text-slate-900">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" /> Last Transition
                  </span>
                  <span className="font-medium text-slate-900">
                    {new Date(order.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 3. Workflow Action Buttons */}
              <OrderActionButtons
                order={order}
                loading={actionLoading}
                onStatusChange={handleStatusTransition}
                onCancel={handleCancelOrder}
              />

              {/* 4. Line Items Table */}
              <div>
                <h3 className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-2.5">
                  Order Line Items ({order.items?.length || 0})
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-brand-teal-light/70 text-brand-teal font-bold uppercase tracking-wider border-b border-brand-teal/20">
                      <tr>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-center">Quantity</th>
                        <th className="px-4 py-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {order.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 font-medium">
                            ₹{Number(item.unit_price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-900">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{Number(item.line_total).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right text-slate-700 uppercase font-bold text-xs">
                          Grand Total:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-extrabold text-brand-teal">
                          ₹{Number(order.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button
            size="md"
            variant="outline"
            onClick={onClose}
          >
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
