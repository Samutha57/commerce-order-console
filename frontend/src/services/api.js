const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network or parse error
    const error = new Error(err.message || 'Network connection failed');
    error.status = 500;
    throw error;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Products & Inventory
  getProducts: () => request('/products'),
  getProductById: (id) => request(`/products/${id}`),
  getInventory: () => request('/inventory'),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/orders${queryString}`);
  },

  getOrderById: (id) => request(`/orders/${id}`),

  createOrder: (orderPayload) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  }),

  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  cancelOrder: (id) => request(`/orders/${id}/cancel`, {
    method: 'POST'
  })
};

export default api;
