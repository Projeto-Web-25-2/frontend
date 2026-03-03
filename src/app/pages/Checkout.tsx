import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { CreditCard, CheckCircle2, ArrowLeft, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orderComplete, setOrderComplete] = useState(false);
  const [shippingData, setShippingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Load shipping data from sessionStorage
    const savedShippingData = sessionStorage.getItem('shippingData');
    if (savedShippingData) {
      setShippingData(JSON.parse(savedShippingData));
    } else {
      navigate('/shipping');
    }
  }, [isAuthenticated, user, items, navigate]);

  const shippingCost = shippingData?.shippingOption?.price || shippingData?.shippingOption?.final_price || 0;
  const totalWithShipping = totalPrice + shippingCost;

  const handleMercadoPagoCheckout = async () => {
    if (!user || !shippingData?.address) {
      toast.error('Dados de entrega não encontrados');
      return;
    }

    try {
      setLoading(true);

      // Create order first
      const orderItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const order = await api.createOrder(user.uid, {
        address_uid: shippingData.address.uid,
        items: orderItems,
        shipping: shippingCost,
        discount: 0,
        note: '',
      });

      // Create Mercado Pago checkout session
      const checkout = await api.createCheckout(
        order.order_number,
        user.email
      );

      // Redirect to Mercado Pago
      window.location.href = checkout.initPoint;
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      setLoading(false);
    }
  };

  if (!shippingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-12 max-w-2xl text-center">
          <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Pedido Realizado com Sucesso!</h1>
          <p className="text-gray-600 mb-8">
            Obrigado por sua compra! Você receberá um e-mail com os detalhes do pedido.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold mb-4">Detalhes do Pedido</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Número do pedido:</span>
                <span className="font-semibold">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">R$ {totalWithShipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Método de pagamento:</span>
                <span className="font-semibold">Mercado Pago</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/my-orders')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ver Meus Pedidos
            </button>
            <button
              onClick={() => navigate('/catalog')}
              className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/shipping')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Entrega
        </button>

        <h1 className="text-3xl font-bold mb-8">Pagamento</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Método de Pagamento</h2>

              {/* Mercado Pago */}
              <div className="border-2 border-blue-600 rounded-lg p-6 bg-blue-50">
                <div className="flex items-center gap-4 mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">Mercado Pago</h3>
                    <p className="text-sm text-gray-600">
                      Pague com cartão de crédito, débito ou PIX
                    </p>
                  </div>
                </div>
                
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>✓ Aceita todas as bandeiras de cartão</li>
                  <li>✓ Pagamento via PIX</li>
                  <li>✓ Parcele em até 12x</li>
                  <li>✓ Ambiente 100% seguro</li>
                </ul>

                <button
                  onClick={handleMercadoPagoCheckout}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Pagar com Mercado Pago
                    </>
                  )}
                </button>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Pagamento 100% seguro e criptografado</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x Produto #{item.product_id}
                    </span>
                    <span className="font-semibold">-</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">R$ {totalWithShipping.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              {shippingData?.address && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                  <p className="text-sm text-gray-700">
                    {shippingData.address.street}, {shippingData.address.street_number}
                    <br />
                    {shippingData.address.neighborhood}
                    <br />
                    {shippingData.address.city} - {shippingData.address.state_code}
                    <br />
                    {shippingData.address.zip_code}
                  </p>
                </div>
              )}

              {/* Shipping Method */}
              {shippingData?.shippingOption && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold mb-2">Método de Entrega</h3>
                  <p className="text-sm text-gray-700">
                    {shippingData.shippingOption.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
