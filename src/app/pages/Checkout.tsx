import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import { useMercadoPago } from '../hooks/useMercadoPago';

export const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useAuth();
  const [shippingData, setShippingData] = useState<any>(() => {
    const saved = sessionStorage.getItem('shippingData');
    return saved ? JSON.parse(saved) : null;
  });
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const { createMercadoPagoCheckout } = useMercadoPago();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!shippingData) {
      navigate('/shipping');
    }
  }, [shippingData, navigate]);

  const shippingCost = shippingData?.shippingOption?.price || 0;
  const totalWithShipping = totalPrice + shippingCost;
  const displayTotal = 0; // 100% de desconto nesta página (POC)

  const placeOrder = useCallback(async () => {
    if (!user || !accessToken) {
      throw new Error('Faça login para finalizar o pedido.');
    }

    if (!shippingData?.addressUid) {
      throw new Error('Selecione um endereço de entrega.');
    }

    if (items.length === 0) {
      throw new Error('Seu carrinho está vazio.');
    }

    const payload = {
      address_uid: shippingData.addressUid,
      items: items.map((item) => ({
        product_id: Number(item.id),
        quantity: item.quantity,
      })),
      shipping: shippingCost,
      // Sem desconto no backend para evitar unit_price = 0 no Mercado Pago
      discount: 0,
      note: shippingData?.personalInfo?.note || null,
    };

    const order = await orderService.create(user.uid, payload, accessToken);
    setOrderNumber(order.order_number);
    const finalTotal = 0;
    setFinalAmount(finalTotal);

    // Persist order info for mock status progression on the frontend
    sessionStorage.setItem('lastOrderId', String(order.id));
    sessionStorage.setItem('lastOrderNumber', order.order_number);
    sessionStorage.setItem('lastOrderTotal', String(finalTotal));
    sessionStorage.setItem('lastOrderStatusIndex', '0');
    sessionStorage.removeItem('shippingData');
    return order;
  }, [user, accessToken, shippingData, items, shippingCost, totalWithShipping]);

  const handleMercadoPagoPayment = async () => {
    if (!user || !accessToken) {
      toast.error('Faça login para finalizar o pedido.');
      return;
    }

    if (!shippingData?.addressUid) {
      toast.error('Selecione um endereço de entrega antes de pagar.');
      return;
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await placeOrder();
      await clearCart();
      await createMercadoPagoCheckout({
        testeId: order?.order_number ?? String(order?.id ?? ''),
        userEmail: user.email,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout - somente via Mercado Pago */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Pagamento via Mercado Pago</h2>
                <p className="text-gray-600 mb-2">
                  Ao continuar, você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento.
                </p>
                <p className="text-sm text-gray-600">
                  Esta etapa de pagamento é apenas uma prova de conceito (POC).
                  Nenhum valor real será cobrado.
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleMercadoPagoPayment}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Redirecionando para pagamento...' : 'Pagar com Mercado Pago'}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                      <p className="text-sm font-semibold text-blue-600">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Frete</span>
                    <span>R$ {shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>POC discount</span>
                  <span>100%</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-blue-600 text-right">
                    R$ <span className="line-through">{totalWithShipping.toFixed(2)}</span>
                    <br />
                    R$ 0,00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};