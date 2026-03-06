import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services';
import type { OrderResponse, OrderStatus } from '../../services';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatOrderDate = (value: string) => dateFormatter.format(new Date(value));

const orderStatusVisuals: Record<OrderStatus, { label: string; badge: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento', badge: 'bg-yellow-100 text-yellow-800' },
  payment_confirmed: { label: 'Pagamento confirmado', badge: 'bg-green-100 text-green-800' },
  shipped: { label: 'Enviado', badge: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Entregue', badge: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', badge: 'bg-red-100 text-red-800' },
};

const getStatusVisuals = (status: OrderStatus) =>
  orderStatusVisuals[status] ?? { label: status, badge: 'bg-gray-100 text-gray-800' };

const getOrderItemsCount = (order: OrderResponse) =>
  order.items.reduce((total, item) => total + item.quantity, 0);

interface OrdersTabProps {
  accessToken: string;
  isAdmin: boolean;
}

export const OrdersTab = ({ accessToken, isAdmin }: OrdersTabProps) => {
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderLimit, setOrderLimit] = useState(30);

  const fetchOrders = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const data = await adminService.getRecentOrders(accessToken, orderLimit);
      setRecentOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos recentes', error);
      setOrdersError('Não foi possível carregar os pedidos recentes.');
      toast.error('Falha ao carregar pedidos recentes.');
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken, isAdmin, orderLimit]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Pedidos</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="order-limit" className="text-sm font-semibold text-gray-600">
              Qtd. de pedidos
            </label>
            <select
              id="order-limit"
              value={orderLimit}
              onChange={(event) => setOrderLimit(Number(event.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 30, 50].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchOrders()}
            disabled={ordersLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {ordersError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {ordersError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Pedido</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Data</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Itens</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {Array.from({ length: 7 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="py-4 px-4">
                          <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : recentOrders.length > 0
                ? recentOrders.map((order) => {
                    const { label, badge } = getStatusVisuals(order.status);
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-semibold text-blue-600">{order.order_number}</td>
                        <td className="py-4 px-4 font-mono text-sm text-gray-700">{order.customer_uid}</td>
                        <td className="py-4 px-4 text-gray-600">{formatOrderDate(order.created_at)}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">{getOrderItemsCount(order)}</td>
                        <td className="py-4 px-4 font-semibold">{formatCurrency(order.total)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toast.info(`Detalhes do pedido ${order.order_number}`)}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })
                : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-sm text-gray-500">
                        Nenhum pedido encontrado para o filtro atual.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
