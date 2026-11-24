import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import Products from './pages/Products';
import OrderDetailsModal from './pages/OrderDetailsModal';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeModalOrderId, setActiveModalOrderId] = useState(null);

  const showToast = ({ message, type = 'success' }) => {
    setToast({ message, type });
  };

  const handleSelectOrder = (orderId) => {
    setActiveModalOrderId(orderId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navigation Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (Offset by 64px sidebar on large screens) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard onSelectOrder={handleSelectOrder} showToast={showToast} />} />
            <Route path="/orders" element={<Orders showToast={showToast} />} />
            <Route path="/orders/new" element={<CreateOrder showToast={showToast} />} />
            <Route path="/products" element={<Products showToast={showToast} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
          Commerce Order Console • Fynd Hiring Hackathon (November 2026) • Store Operations Interface
        </footer>
      </div>

      {/* Global Order Detail Modal when triggered from Dashboard or anywhere */}
      {activeModalOrderId && (
        <OrderDetailsModal
          orderId={activeModalOrderId}
          onClose={() => setActiveModalOrderId(null)}
          onOrderUpdated={() => {
            // Callback to notify updates
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Notifications */}
      <Toast notification={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
