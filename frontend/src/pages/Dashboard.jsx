import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { 
  Package, 
  ShoppingBag, 
  ClipboardList, 
  PackageCheck, 
  Truck, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  PlusCircle,
  RefreshCw
} from 'lucide-react';

export function Dashboard({ onSelectOrder }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, ordersRes] = await Promise.all([
        api.getDashboardStats(),
        api.getOrders()
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-teal" />
        <span className="text-xs font-bold text-brand-teal">Loading live store metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-brand-teal tracking-tight">Operations Dashboard</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-teal text-white uppercase tracking-wider">
              Live DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time fulfillment metrics, pipeline status, and warehouse inventory tracking.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            size="md"
            variant="outline"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchDashboardData}
            title="Refresh statistics"
          >
            Refresh Data
          </Button>
          <Link to="/orders/new">
            <Button
              size="md"
              variant="primary"
              icon={PlusCircle}
            >
              Create Order
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline font-bold hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders - Blue Accent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-blue-900 tracking-tight">{stats?.total_orders ?? 0}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total orders recorded</p>
        </div>

        {/* Placed Orders - Blue Accent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Placed Orders</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-200">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-sky-900 tracking-tight">{stats?.placed_orders ?? 0}</span>
          </div>
          <p className="text-[11px] text-sky-600/70 mt-1">Stage 1: Awaiting picking & packing</p>
        </div>

        {/* Packed Orders - Teal Green (#02968A) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-brand-teal transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-teal uppercase tracking-wider">Packed Orders</span>
            <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center text-brand-teal shadow-xs border border-brand-teal/20">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-brand-teal tracking-tight">{stats?.packed_orders ?? 0}</span>
          </div>
          <p className="text-[11px] text-brand-teal/80 mt-1">Stage 2: Packaged, ready to ship</p>
        </div>

        {/* Shipped Orders - Blue Accent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Shipped Orders</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-200">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-indigo-900 tracking-tight">{stats?.shipped_orders ?? 0}</span>
          </div>
          <p className="text-[11px] text-indigo-600/80 mt-1">Stage 3: Fulfilled & dispatched</p>
        </div>
      </div>

      {/* Secondary Row: Inventory & Cancellation Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cancelled Orders - Red */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Cancelled Orders</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-900">{stats?.cancelled_orders ?? 0}</span>
          </div>
          <p className="text-[11px] text-rose-500 mt-1">Inventory restored automatically</p>
        </div>

        {/* Total Products - Teal Green (#02968A) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-brand-teal transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-teal uppercase tracking-wider">Catalogue Items</span>
            <div className="w-9 h-9 rounded-lg bg-brand-teal-light flex items-center justify-center text-brand-teal border border-brand-teal/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-brand-teal">{stats?.total_products ?? 0}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active warehouse SKUs</p>
        </div>

        {/* Low Stock SKUs - Orange/Amber */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Low Stock SKUs</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-300 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-900">{stats?.low_stock_products ?? 0}</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">Products with ≤ 5 units remaining</p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-brand-teal-light/40">
          <div>
            <h2 className="text-xs font-bold text-brand-teal uppercase tracking-wider">Recent Orders Pipeline</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Latest order activity ready for warehouse processing</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-brand-teal hover:underline flex items-center"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-bold text-slate-600">No customer orders recorded yet</p>
            <p className="text-[11px] mt-1 text-slate-400">Click "Create Order" above to place your first order.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div 
                key={order.id} 
                className="px-6 py-4 flex items-center justify-between hover:bg-brand-teal-light/20 transition-colors cursor-pointer group"
                onClick={() => onSelectOrder && onSelectOrder(order.id)}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-brand-teal transition-colors">
                      {order.order_reference}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(order.created_at).toLocaleString()} • {order.total_items} items
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-slate-900">
                    ₹{Number(order.total_amount).toLocaleString()}
                  </span>
                  <StatusBadge status={order.status} />
                  <span className="text-xs font-bold text-brand-teal group-hover:underline hidden sm:inline">
                    Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
