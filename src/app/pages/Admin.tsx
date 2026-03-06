import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../context/AuthContext';
import { DashboardTab } from './admin/DashboardTab';
import { ProductsTab } from './admin/ProductsTab';
import { OrdersTab } from './admin/OrdersTab';
import { AccountsTab } from './admin/AccountsTab';

export const Admin = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'accounts'>('dashboard');

  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const redirectWarnedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || !accessToken) {
      if (!redirectWarnedRef.current) {
        toast.error('Faça login para acessar o painel administrativo.');
        redirectWarnedRef.current = true;
      }
      navigate('/signin', { replace: true });
      return;
    }

    if (!isAdmin) {
      if (!redirectWarnedRef.current) {
        toast.error('Acesso restrito a administradores.');
        redirectWarnedRef.current = true;
      }
      navigate('/', { replace: true });
    }
  }, [user, accessToken, isAdmin, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando painel...</p>
      </div>
    );
  }

  if (!user || !accessToken || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie produtos, pedidos e visualize estatísticas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'accounts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Contas
          </button>
        </div>

        {activeTab === 'dashboard' && accessToken && isAdmin && (
          <DashboardTab accessToken={accessToken} isAdmin={isAdmin} />
        )}

        {activeTab === 'products' && accessToken && isAdmin && (
          <ProductsTab accessToken={accessToken} isAdmin={isAdmin} />
        )}

        {activeTab === 'orders' && accessToken && isAdmin && (
          <OrdersTab accessToken={accessToken} isAdmin={isAdmin} />
        )}

        {activeTab === 'accounts' && accessToken && isAdmin && (
          <AccountsTab accessToken={accessToken} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
};