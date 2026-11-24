import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Layers
} from 'lucide-react';

export function CreateOrder({ showToast }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Selection form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Cart / Order items list
  const [orderItems, setOrderItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingProducts(true);
        const res = await api.getProducts();
        setProducts(res.data);

        // Pre-select product if passed via navigation state
        const initialId = location.state?.initialProductId;
        if (initialId) {
          const match = res.data.find(p => p.id === initialId && p.stock > 0);
          if (match) {
            setSelectedProductId(match.id.toString());
          }
        } else {
          // Pre-select first available product
          const firstInStock = res.data.find(p => p.stock > 0);
          if (firstInStock) {
            setSelectedProductId(firstInStock.id.toString());
          }
        }
      } catch (err) {
        setFormError('Failed to load products catalogue');
      } finally {
        setLoadingProducts(false);
      }
    }
    loadCatalog();
  }, [location.state]);

  const currentSelectedProduct = products.find(
    (p) => p.id === Number(selectedProductId)
  );

  const handleAddItem = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!currentSelectedProduct) {
      setFormError('Please select a valid product');
      return;
    }

    if (currentSelectedProduct.stock <= 0) {
      setFormError(`${currentSelectedProduct.name} is currently out of stock`);
      return;
    }

    const qty = Number(selectedQuantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError('Quantity must be at least 1');
      return;
    }

    // Check if product already exists in current order
    const existingIndex = orderItems.findIndex(
      (item) => item.productId === currentSelectedProduct.id
    );

    if (existingIndex >= 0) {
      // Prevent duplicate product rows by updating their quantities
      const existing = orderItems[existingIndex];
      const newTotalQty = existing.quantity + qty;

      if (newTotalQty > currentSelectedProduct.stock) {
        setFormError(
          `Cannot add ${qty} more. Total in order would be ${newTotalQty}, exceeding available stock of ${currentSelectedProduct.stock}`
        );
        return;
      }

      const updated = [...orderItems];
      updated[existingIndex] = {
        ...existing,
        quantity: newTotalQty
      };
      setOrderItems(updated);
      showToast?.({
        type: 'success',
        message: `Updated ${currentSelectedProduct.name} quantity to ${newTotalQty}`
      });
    } else {
      // Add new row
      if (qty > currentSelectedProduct.stock) {
        setFormError(
          `Requested quantity (${qty}) exceeds available stock (${currentSelectedProduct.stock})`
        );
        return;
      }

      setOrderItems([
        ...orderItems,
        {
          productId: currentSelectedProduct.id,
          name: currentSelectedProduct.name,
          sku: currentSelectedProduct.sku,
          price: currentSelectedProduct.price,
          stock: currentSelectedProduct.stock,
          quantity: qty
        }
      ]);
    }

    // Reset quantity input to 1
    setSelectedQuantity(1);
  };

  const handleUpdateItemQuantity = (productId, newQty) => {
    setFormError(null);
    const item = orderItems.find(i => i.productId === productId);
    if (!item) return;

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > item.stock) {
      setFormError(`Cannot exceed available stock of ${item.stock} for ${item.name}`);
      return;
    }

    setOrderItems(orderItems.map(i => 
      i.productId === productId ? { ...i, quantity: newQty } : i
    ));
  };

  const handleRemoveItem = (productId) => {
    setOrderItems(orderItems.filter(i => i.productId !== productId));
  };

  // Live total calculations
  const totalItemsCount = orderItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    setFormError(null);

    if (orderItems.length === 0) {
      setFormError('Please add at least one product to the order');
      return;
    }

    // Final sanity check
    for (const item of orderItems) {
      if (item.quantity > item.stock) {
        setFormError(`Insufficient stock for ${item.name}. Available: ${item.stock}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        items: orderItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await api.createOrder(payload);

      showToast?.({
        type: 'success',
        message: `Order ${res.data.order_reference} placed successfully!`
      });

      // Clear order and navigate to orders list
      setOrderItems([]);
      navigate('/orders', { state: { highlightOrderId: res.data.id } });
    } catch (err) {
      setFormError(err.message || 'Failed to submit order');
      showToast?.({
        type: 'error',
        message: err.message || 'Failed to place order'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/orders')}
            title="Back to orders"
          >
            Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-teal tracking-tight">Create Customer Order</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select products from warehouse stock and create an atomic multi-item order.
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unable to proceed</p>
            <p className="text-xs mt-0.5 text-rose-700">{formError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Selection & Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Product Form */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-brand-teal uppercase tracking-wider mb-4 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-brand-teal" />
              Add Product To Order
            </h2>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Product Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedQuantity(1);
                    }}
                    disabled={loadingProducts}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                  >
                    {products.map((p) => {
                      const isOos = p.stock <= 0;
                      return (
                        <option key={p.id} value={p.id} disabled={isOos}>
                          {p.name} ({p.sku}) — ₹{p.price} {isOos ? '[OUT OF STOCK]' : `(${p.stock} available)`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentSelectedProduct?.stock || 1}
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    disabled={!currentSelectedProduct || currentSelectedProduct.stock <= 0}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal"
                  />
                </div>
              </div>

              {/* Selected Product Stock Status Card */}
              {currentSelectedProduct && (
                <div className="flex items-center justify-between p-3 bg-brand-teal-light/40 rounded-lg text-xs border border-brand-teal/20">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-brand-teal-dark">Available Warehouse Stock:</span>
                    <span className="font-extrabold text-brand-teal-dark">{currentSelectedProduct.stock} units</span>
                  </div>
                  <div>
                    <StatusBadge status={currentSelectedProduct.stock_status} type="stock" size="sm" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Plus}
                  disabled={!currentSelectedProduct || currentSelectedProduct.stock <= 0}
                >
                  Add to Order List
                </Button>
              </div>
            </form>
          </div>

          {/* Current Order Items Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-brand-teal-light/20">
              <h2 className="text-xs font-bold text-brand-teal uppercase tracking-wider flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2 text-brand-teal" />
                Current Order Items ({orderItems.length})
              </h2>
              {orderItems.length > 0 && (
                <button
                  onClick={() => setOrderItems([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {orderItems.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No items added to this order yet</p>
                <p className="text-[11px] mt-1 text-slate-400">Select a product and click "Add to Order List" above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-brand-teal-light/50 text-brand-teal font-bold uppercase tracking-wider border-b border-brand-teal/20">
                    <tr>
                      <th className="px-5 py-3">Product Name</th>
                      <th className="px-5 py-3">Unit Price</th>
                      <th className="px-5 py-3 text-center">Quantity</th>
                      <th className="px-5 py-3 text-right">Line Total</th>
                      <th className="px-5 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {orderItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-brand-teal-light/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {item.sku}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 font-medium">
                          ₹{Number(item.price).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.productId, item.quantity - 1)}
                              className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= item.stock}
                              onClick={() => handleUpdateItemQuantity(item.productId, item.quantity + 1)}
                              className="w-7 h-7 rounded border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                              title={item.quantity >= item.stock ? 'Max available stock reached' : 'Increment quantity'}
                            >
                              +
                            </button>
                            <span className="text-[10px] text-slate-400">
                              (max {item.stock})
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove product from order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs sticky top-24 space-y-4">
            <h2 className="text-xs font-bold text-brand-teal uppercase tracking-wider pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
              <div className="flex justify-between text-slate-600">
                <span>Unique Line Items</span>
                <span className="font-bold text-slate-900">{orderItems.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Units Ordered</span>
                <span className="font-bold text-slate-900">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Live Subtotal</span>
                <span className="font-bold text-slate-900">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-2xl font-extrabold text-brand-teal">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={CheckCircle2}
                loading={submitting}
                disabled={orderItems.length === 0}
                onClick={handleSubmitOrder}
                className="w-full text-white"
              >
                Confirm & Place Order
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/orders')}
                className="w-full"
              >
                Cancel & Return
              </Button>
            </div>

            <div className="p-3 bg-brand-teal-light/30 rounded-lg text-[11px] text-brand-teal-dark border border-brand-teal/20">
              All prices and inventory deductions are verified server-side inside an atomic transaction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;
