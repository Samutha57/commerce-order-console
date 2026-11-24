import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import OrderDetailsModal from './OrderDetailsModal';
import OrderActionButtons from '../components/OrderActionButtons';
import Button from '../components/Button';
import { 
  ShoppingBag, 
  Search, 
  X, 
  PlusCircle, 
  RefreshCw, 
  Eye, 
  AlertCircle
} from 'lucide-react';

export function Orders({ showToast }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal detail view
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOrders({
        search: search.trim(),
        status: statusFilter === 'All' ? '' : statusFilter
      });
      setOrders(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load orders list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  // Open modal if directed with highlight
  useEffect(() => {
    if (location.state?.highlightOrderId) {
      setSelectedOrderId(location.state.highlightOrderId);
    }
  }, [location.state]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
  };

  const handleDirectStatusChange = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await api.updateOrderStatus(orderId, newStatus);
      showToast?.({
        type: 'success',
        message: `Order status advanced to ${newStatus}`
      });
      fetchOrders();
    } catch (err) {
      showToast?.({
        type: 'error',
        message: err.message || `Failed to update status to ${newStatus}`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectCancel = async (orderId) => {
    try {
      setActionLoading(true);
      await api.cancelOrder(orderId);
      showToast?.({
        type: 'success',
        message: 'Order cancelled and stock restored to inventory'
      });
      fetchOrders();
    } catch (err) {
      showToast?.({
        type: 'error',
        message: err.message || 'Failed to cancel order'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'All';

  const getFilterTabClass = (tab) => {
    if (statusFilter !== tab) {
      return 'text-slate-600 hover:text-brand-teal hover:bg-slate-200/60';
    }
    switch (tab) {
      case 'Placed':
        return 'bg-blue-600 text-white shadow-xs font-bold';
      case 'Packed':
        return 'bg-brand-teal text-white shadow-xs font-bold';
      case 'Shipped':
        return 'bg-indigo-600 text-white shadow-xs font-bold';
      case 'Cancelled':
        return 'bg-rose-600 text-white shadow-xs font-bold';
      default:
        return 'bg-brand-teal text-white shadow-xs font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal tracking-tight">Orders Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track live customer orders, execute fulfillment workflows, and manage cancellations.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            size="md"
            variant="outline"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchOrders}
            title="Refresh order records"
          >
            Refresh
          </Button>
          <Button
            size="md"
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/orders/new')}
          >
            Create Order
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOrders} className="underline font-bold hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order reference (e.g. ORD-...)"
            className="block w-full pl-10 pr-9 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs & Clear */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['All', 'Placed', 'Packed', 'Shipped', 'Cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md transition-all ${getFilterTabClass(tab)}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              icon={X}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-brand-teal-light/70 text-brand-teal font-bold uppercase tracking-wider border-b border-brand-teal/20">
              <tr>
                <th scope="col" className="px-5 py-3.5">Order Reference</th>
                <th scope="col" className="px-5 py-3.5">Created Date</th>
                <th scope="col" className="px-5 py-3.5 text-center">Items</th>
                <th scope="col" className="px-5 py-3.5 text-right">Total Amount</th>
                <th scope="col" className="px-5 py-3.5 text-center">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Quick Workflow / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-brand-teal" />
                    <p className="text-xs font-bold text-brand-teal">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">No orders found</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      {hasActiveFilters ? 'Try adjusting your search or status filter.' : 'Create your first customer order to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-brand-teal-light/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-brand-teal transition-colors">
                        {order.order_reference}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600 text-xs">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {order.total_items} {order.total_items === 1 ? 'unit' : 'units'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-extrabold text-slate-900 text-xs">
                      ₹{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Compact Workflow Action Buttons */}
                        <OrderActionButtons
                          order={order}
                          compact={true}
                          loading={actionLoading}
                          onStatusChange={handleDirectStatusChange}
                          onCancel={handleDirectCancel}
                        />

                        {/* View Details Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Eye}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={fetchOrders}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default Orders;
