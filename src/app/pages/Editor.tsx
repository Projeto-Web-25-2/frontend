import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../context/AuthContext';
import { ProductsTab } from './admin/ProductsTab';

export const Editor = () => {
  const [activeTab, setActiveTab] = useState<'products'>('products');

  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const isPublisher = user?.role === 'publisher';
  const navigate = useNavigate();
  const redirectWarnedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || !accessToken) {
      if (!redirectWarnedRef.current) {
        toast.error('Faça login para acessar o painel do editor.');
        redirectWarnedRef.current = true;
      }
      navigate('/signin', { replace: true });
      return;
    }

    if (!isPublisher) {
      if (!redirectWarnedRef.current) {
        toast.error('Acesso restrito a editores.');
        redirectWarnedRef.current = true;
      }
      navigate('/', { replace: true });
    }
  }, [user, accessToken, isPublisher, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando painel...</p>
      </div>
    );
  }

  if (!user || !accessToken || !isPublisher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Painel do Editor</h1>
          <p className="text-gray-600">Gerencie os produtos do catálogo</p>
        </div>

        {/* Tabs (apenas produtos por enquanto) */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
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
        </div>

        {activeTab === 'products' && accessToken && isPublisher && (
          <ProductsTab accessToken={accessToken} isAdmin={true} />
        )}
      </div>
    </div>
  );
};
