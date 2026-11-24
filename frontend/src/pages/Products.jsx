import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { Package, Search, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';

export function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProducts();
      setProducts(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch product catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const handleOrderProduct = (product) => {
    if (product.stock <= 0) return;
    navigate('/orders/new', { state: { initialProductId: product.id } });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal tracking-tight">Products & Inventory Catalogue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time warehouse stock tracking, verified unit pricing, and SKU inventory records.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <Button
            size="md"
            variant="outline"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchProducts}
          >
            Refresh Stock
          </Button>
          <Button
            size="md"
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/orders/new')}
          >
            New Order
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchProducts} className="underline font-bold hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal bg-white"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">
          Showing {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* Catalogue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-brand-teal-light/70 text-brand-teal font-bold uppercase tracking-wider border-b border-brand-teal/20">
              <tr>
                <th scope="col" className="px-5 py-3.5">Product & SKU</th>
                <th scope="col" className="px-5 py-3.5 text-right">Unit Price</th>
                <th scope="col" className="px-5 py-3.5 text-center">Available Stock</th>
                <th scope="col" className="px-5 py-3.5 text-center">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">No products match your search</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  return (
                    <tr key={product.id} className="hover:bg-brand-teal-light/20 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-lg bg-brand-teal-light flex items-center justify-center text-brand-teal mr-3 border border-brand-teal/20">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{product.name}</div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-extrabold text-slate-900 text-xs">
                        ₹{Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOutOfStock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={product.stock_status} type="stock" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Button
                          size="sm"
                          variant={isOutOfStock ? 'outline' : 'primary'}
                          icon={PlusCircle}
                          disabled={isOutOfStock}
                          onClick={() => handleOrderProduct(product)}
                          title={isOutOfStock ? 'Out of stock - cannot order' : 'Add to order'}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Add to Order'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;
