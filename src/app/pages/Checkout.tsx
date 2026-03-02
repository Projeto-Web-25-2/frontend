import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { CreditCard, Smartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import { useMercadoPago } from '../hooks/useMercadoPago';

export const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix'>('credit');
  const [orderComplete, setOrderComplete] = useState(false);
  const [pixCode, setPixCode] = useState('');
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

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generatePixCode = () => {
    // Simulated PIX code
    const randomCode = Math.random().toString(36).substring(2, 15).toUpperCase();
    return `00020126580014BR.GOV.BCB.PIX0136${randomCode}5204000053039865802BR5913COMPIA EDITORA6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

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
      discount: 0,
      note: shippingData?.personalInfo?.note || null,
    };

    const order = await orderService.create(user.uid, payload, accessToken);
    setOrderNumber(order.order_number);
    setFinalAmount(order.total ?? totalWithShipping);
    sessionStorage.setItem('lastOrderNumber', order.order_number);
    sessionStorage.setItem('lastOrderTotal', String(order.total ?? totalWithShipping));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'credit') {
      if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCvv) {
        toast.error('Por favor, preencha os dados do cartão');
        return;
      }

      setIsSubmitting(true);
      try {
        await placeOrder();
        setOrderComplete(true);
        toast.success('Pagamento aprovado!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível finalizar o pedido.';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const code = generatePixCode();
      setPixCode(code);
      toast.success('Código PIX gerado com sucesso!');
    }
  };

  const confirmPixPayment = async () => {
    setIsSubmitting(true);
    try {
      await placeOrder();
      setOrderComplete(true);
      toast.success('Pagamento confirmado!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível confirmar o pagamento.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setPixCode('');
    }
  };

    if (items.length === 0 && !orderComplete) {
      navigate('/cart');
      return null;
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
                <span className="font-semibold">{orderNumber ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">R$ {(finalAmount || totalWithShipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Método de pagamento:</span>
                <span className="font-semibold">{paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                navigate('/');
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => {
                navigate('/catalog');
              }}
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pixCode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Pagamento via PIX</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-center mb-4">Escaneie o QR Code ou copie o código abaixo:</p>
              
              {/* Simulated QR Code */}
              <div className="bg-white p-8 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-32 h-32 text-white" />
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded font-mono text-xs break-all">
                {pixCode}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(pixCode);
                  toast.success('Código PIX copiado!');
                }}
                className="w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Copiar Código PIX
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⏱️ Atenção:</strong> Após realizar o pagamento, clique no botão abaixo para confirmar.
                O código PIX tem validade de 30 minutos.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmPixPayment}
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Processando...' : 'Já Realizei o Pagamento'}
              </button>
              <button
                onClick={() => setPixCode('')}
                className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Forma de Pagamento</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'credit'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-semibold">Cartão de Crédito</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold">PIX</div>
                  </button>
                </div>

                {paymentMethod === 'credit' && (
                  <div className="grid grid-cols-1 gap-4">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="Número do cartão *"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={19}
                    />
                    <input
                      type="text"
                      name="cardName"
                      placeholder="Nome no cartão *"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="Validade (MM/AA) *"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={5}
                      />
                      <input
                        type="text"
                        name="cardCvv"
                        placeholder="CVV *"
                        value={formData.cardCvv}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={4}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Ao confirmar, você receberá um QR Code para realizar o pagamento via PIX.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleMercadoPagoPayment}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Redirecionando para pagamento...' : 'Pagar com Mercado Pago'}
              </button>
            </form>
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
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-blue-600">R$ {totalWithShipping.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};