import { useState, useEffect } from 'react';
import { Package, Eye, Loader, Truck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { api, Order as ApiOrder, Product } from '../services/api';
import { toast } from 'sonner';

export const MyOrders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<{ [key: number]: Product }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
      return;
    }

    loadOrders();
  }, [isAuthenticated, user, navigate]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await api.getOrders(user.uid);
      setOrders(data);

      // Load product details
      const allProducts = await api.getProducts();
      const productsMap: { [key: number]: Product } = {};
      allProducts.forEach((p) => {
        productsMap[p.id] = p;
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: any } } = {
      awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      payment_confirmed: { label: 'Pagamento Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      processing: { label: 'Em Processamento', color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const statusInfo = statusMap[status] || statusMap.awaiting_payment;
    const Icon = statusInfo.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
        <Icon className="w-4 h-4" />
        {statusInfo.label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido.</p>
            <button
              onClick={() => navigate('/catalog')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Pedido {order.order_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {order.items.map((item) => {
                      const product = products[item.product_id];
                      return (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={product?.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop'}
                            alt={product?.title || 'Produto'}
                            className="w-20 h-28 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">
                              {product?.title || `Produto #${item.product_id}`}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {product?.author || 'Autor desconhecido'}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                Quantidade: {item.quantity}
                              </span>
                              <span className="font-semibold text-blue-600">
                                R$ {item.unit_price.toFixed(2)}
                              </span>
                            </div>
                            {product?.product_type === 'ebook' && (
                              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                E-book
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>R$ {order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.shipping > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Frete:</span>
                        <span>R$ {order.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between items-center mb-2 text-green-600">
                        <span>Desconto:</span>
                        <span>- R$ {order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order Note */}
                  {order.note && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Observações:</h4>
                      <p className="text-sm text-gray-600">{order.note}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
