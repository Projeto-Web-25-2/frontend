import { Package, Eye, Download, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

interface Order {
  id: string;
  date: string;
  status: 'Pago' | 'Processando' | 'Enviado' | 'Entregue' | 'Cancelado';
  items: {
    title: string;
    image: string;
    quantity: number;
    price: number;
    type: 'physical' | 'digital';
  }[];
  total: number;
  trackingCode?: string;
  paymentMethod: string;
}

export const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock orders data
  const orders: Order[] = [
    {
      id: '#COMP-98765',
      date: '2026-02-28',
      status: 'Enviado',
      items: [
        {
          title: 'Fundamentos de Inteligência Artificial',
          image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=800&fit=crop',
          quantity: 1,
          price: 89.90,
          type: 'physical',
        },
        {
          title: 'Deep Learning na Prática',
          image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=800&fit=crop',
          quantity: 1,
          price: 125.00,
          type: 'physical',
        },
      ],
      total: 229.90,
      trackingCode: 'BR123456789BR',
      paymentMethod: 'Cartão de Crédito',
    },
    {
      id: '#COMP-98764',
      date: '2026-02-25',
      status: 'Entregue',
      items: [
        {
          title: 'Processamento de Linguagem Natural',
          image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=800&fit=crop',
          quantity: 1,
          price: 98.00,
          type: 'digital',
        },
      ],
      total: 98.00,
      paymentMethod: 'PIX',
    },
    {
      id: '#COMP-98763',
      date: '2026-02-20',
      status: 'Entregue',
      items: [
        {
          title: 'Blockchain e Criptografia',
          image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=800&fit=crop',
          quantity: 2,
          price: 95.00,
          type: 'physical',
        },
      ],
      total: 205.00,
      trackingCode: 'BR987654321BR',
      paymentMethod: 'Cartão de Crédito',
    },
  ];

  if (!user) {
    navigate('/signin');
    return null;
  }

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      Pago: 'bg-green-100 text-green-800',
      Processando: 'bg-yellow-100 text-yellow-800',
      Enviado: 'bg-blue-100 text-blue-800',
      Entregue: 'bg-gray-100 text-gray-800',
      Cancelado: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">Acompanhe o status dos seus pedidos</p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user.name}</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
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
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Número do Pedido</p>
                      <p className="font-semibold text-blue-600">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data</p>
                      <p className="font-semibold">{new Date(order.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="font-semibold">R$ {order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600">
                            {item.type === 'digital' ? 'E-book Digital' : 'Livro Físico'} • Qtd: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-blue-600 mt-1">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tracking & Actions */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {order.trackingCode && (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Código de rastreio:</span>
                          <span className="font-semibold">{order.trackingCode}</span>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {order.items.some(item => item.type === 'digital') && order.status !== 'Cancelado' && (
                          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        )}
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
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
