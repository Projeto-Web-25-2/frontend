import { useEffect, useMemo, useState, useCallback } from 'react';
import { Package, Users, ShoppingCart, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../../services';
import type { AdminSummary, OrderResponse, OrderStatus } from '../../services';

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
const formatCustomerId = (uid: string) => (uid.length > 16 ? `${uid.slice(0, 8)}…${uid.slice(-4)}` : uid);

const orderStatusVisuals: Record<OrderStatus, { label: string; badge: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento', badge: 'bg-yellow-100 text-yellow-800' },
  payment_confirmed: { label: 'Pagamento confirmado', badge: 'bg-green-100 text-green-800' },
  shipped: { label: 'Enviado', badge: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Entregue', badge: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', badge: 'bg-red-100 text-red-800' },
};

const getStatusVisuals = (status: OrderStatus) =>
  orderStatusVisuals[status] ?? { label: status, badge: 'bg-gray-100 text-gray-800' };

interface DashboardTabProps {
  accessToken: string;
  isAdmin: boolean;
}

export const DashboardTab = ({ accessToken, isAdmin }: DashboardTabProps) => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!accessToken || !isAdmin) return;

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const data = await adminService.getSummary(accessToken);
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar métricas administrativas', error);
      setSummaryError('Não foi possível carregar as métricas.');
      toast.error('Falha ao carregar métricas administrativas.');
    } finally {
      setSummaryLoading(false);
    }
  }, [accessToken, isAdmin]);

  const fetchOrders = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const data = await adminService.getRecentOrders(accessToken, 30);
      setRecentOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos recentes', error);
      setOrdersError('Não foi possível carregar os pedidos recentes.');
      toast.error('Falha ao carregar pedidos recentes.');
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const dashboardOrders = useMemo(() => recentOrders.slice(0, 5), [recentOrders]);
  const totalRevenue = summary?.total_revenue ?? 0;
  const totalOrders = summary?.total_orders ?? 0;
  const totalProductsCard = summary?.total_products ?? 0;
  const totalCustomers = summary?.total_customers ?? 0;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Receita Total</h3>
          <p className="text-3xl font-bold text-blue-600">
            {summaryLoading ? (
              <span className="inline-block h-7 w-28 animate-pulse rounded bg-blue-50" />
            ) : (
              formatCurrency(totalRevenue)
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-green-600">
            {summaryLoading ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded bg-green-50" />
            ) : (
              totalOrders
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Produtos Cadastrados</h3>
          <p className="text-3xl font-bold text-purple-600">
            {summaryLoading ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded bg-purple-50" />
            ) : (
              totalProductsCard
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Clientes</h3>
          <p className="text-3xl font-bold text-orange-600">
            {summaryLoading ? (
              <span className="inline-block h-7 w-14 animate-pulse rounded bg-orange-50" />
            ) : (
              totalCustomers
            )}
          </p>
        </div>
      </div>

      {summaryError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {summaryError}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Pedidos Recentes</h2>
          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {ordersError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {ordersError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pedido</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-100" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block h-4 w-28 animate-pulse rounded bg-gray-100" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block h-4 w-20 animate-pulse rounded bg-gray-100" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block h-4 w-16 animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                : dashboardOrders.length > 0
                ? dashboardOrders.map((order) => {
                    const { label, badge } = getStatusVisuals(order.status);
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-blue-600">{order.order_number}</td>
                        <td className="py-3 px-4 font-mono text-sm text-gray-700">{formatCustomerId(order.customer_uid)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatOrderDate(order.created_at)}</td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                        Nenhum pedido recente encontrado.
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
