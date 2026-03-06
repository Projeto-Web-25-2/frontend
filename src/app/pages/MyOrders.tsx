import { useEffect, useState } from 'react';
import { Package, Eye, Download, Truck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { orderService, productService } from '../services';
import { mapProductResponseToProduct } from '../utils/productMapper';
import type { Product } from '../data/products';

interface OrderItemView {
  id: number;
  quantity: number;
  unit_price: number;
  product: Product;
}

interface OrderView {
  id: number;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  shipping: number;
  discount: number;
  items: OrderItemView[];
}

export const MyOrders = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await orderService.list(user.uid, accessToken);

        // Busca todos os produtos únicos de uma vez (em paralelo)
        const uniqueProductIds = new Set<number>();
        for (const order of response) {
          for (const item of order.items) {
            uniqueProductIds.add(item.product_id);
          }
        }

        const productsMap = new Map<number, Product>();

        await Promise.all(
          Array.from(uniqueProductIds).map(async (productId) => {
            try {
              const productResponse = await productService.getById(productId, accessToken);
              const product = mapProductResponseToProduct(productResponse);
              productsMap.set(productId, product);
            } catch (productError) {
              console.error('Erro ao carregar produto do pedido', productError);
            }
          }),
        );

        const enhanced: OrderView[] = response.map((order) => {
          const items: OrderItemView[] = order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product: productsMap.get(item.product_id) as Product,
          }));

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            total: order.total,
            shipping: order.shipping,
            discount: order.discount,
            items,
          };
        });

        // Ordena pelos pedidos mais recentes primeiro
        enhanced.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setOrders(enhanced);
        setVisibleCount(10);
      } catch (err) {
        console.error('Erro ao carregar pedidos', err);
        setError('Não foi possível carregar seus pedidos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, accessToken]);

  if (!user) {
    return null;
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-800' },
    payment_confirmed: { label: 'Pagamento Confirmado', color: 'bg-green-100 text-green-800' },
    shipped: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
    delivered: { label: 'Entregue', color: 'bg-gray-100 text-gray-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  };

  const getStatusBadge = (status: string) => statusLabels[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">Acompanhe o status dos seus pedidos</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user.full_name ?? user.email}</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nenhum pedido ainda</h2>
            <p className="text-gray-600 mb-6">Comece a explorar nosso catálogo!</p>
            <button
              onClick={() => navigate('/catalog')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Explorar Livros
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.slice(0, visibleCount).map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Número do Pedido</p>
                        <p className="font-semibold text-blue-600">{order.order_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data</p>
                        <p className="font-semibold">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="font-semibold">R$ {order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.product.title}</h4>
                            <p className="text-sm text-gray-600">
                              {item.product.type === 'digital' ? 'E-book Digital' : 'Livro Físico'} • Qtd: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">
                              R$ {(item.unit_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {order.shipping > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Frete:</span>
                            <span className="font-semibold">R$ {order.shipping.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {order.items.some((item) => item.product.type === 'digital') && order.status !== 'cancelled' && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {orders.length > visibleCount && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Ver mais pedidos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
