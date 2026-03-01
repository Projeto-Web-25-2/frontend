import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const shippingCost = items.some((item) => item.type === 'physical') ? 15.0 : 0;
  const totalWithShipping = totalPrice + shippingCost;

  const handleQuantityChange = async (cartItemId: number, quantity: number) => {
    try {
      await updateQuantity(cartItemId, quantity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar a quantidade.';
      toast.error(message);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    try {
      await removeFromCart(cartItemId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível remover o item.';
      toast.error(message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Faça login para acessar o carrinho</h2>
          <button
            onClick={() => navigate('/signin')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando carrinho...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h2>
          <p className="text-gray-600 mb-8">Adicione alguns livros para começar!</p>
          <button
            onClick={() => navigate('/catalog')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Explorar Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Carrinho de Compras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex gap-6">
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-24 h-32 object-cover rounded"
                  />

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.author}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.type === 'digital' ? 'E-book Digital' : 'Livro Físico'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.cartItemId)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                          disabled={item.type === 'physical' && item.quantity >= item.stock}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          R$ {item.price.toFixed(2)} cada
                        </p>
                      </div>
                    </div>

                    {item.type === 'physical' && item.quantity >= item.stock && (
                      <p className="text-xs text-orange-600 mt-2">
                        Quantidade máxima disponível: {item.stock}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} itens)</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Frete</span>
                    <span>R$ {shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">R$ {totalWithShipping.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/shipping')}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Finalizar Compra
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/catalog')}
                className="w-full mt-3 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continuar Comprando
              </button>

              {/* Delivery Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>📦 Entrega:</strong>
                  {items.some((item) => item.type === 'physical')
                    ? ' Livros físicos em até 7 dias úteis.'
                    : ''}
                  {items.some((item) => item.type === 'digital')
                    ? ' E-books disponíveis imediatamente após pagamento.'
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};