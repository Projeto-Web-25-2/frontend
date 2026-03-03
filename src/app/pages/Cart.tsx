import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { api, Product } from '../services/api';

export const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<{ [key: number]: Product }>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    loadProducts();
  }, [isAuthenticated, navigate, items]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const allProducts = await api.getProducts();
      const productsMap: { [key: number]: Product } = {};
      allProducts.forEach((p) => {
        productsMap[p.id] = p;
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  if (cartLoading || loadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
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
            {items.map((item) => {
              const product = products[item.product_id];
              if (!product) return null;

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex gap-6">
                    {/* Image */}
                    <img
                      src={
                        product.image ||
                        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop'
                      }
                      alt={product.title}
                      className="w-24 h-32 object-cover rounded"
                    />

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                          <p className="text-sm text-gray-600">{product.author || 'Autor desconhecido'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.product_type === 'ebook' ? 'E-book Digital' : 'Livro Físico'}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
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
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={product.product_type !== 'ebook' && item.quantity >= product.stock}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            R$ {(product.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            R$ {product.price.toFixed(2)} cada
                          </div>
                        </div>
                      </div>

                      {/* Stock warning */}
                      {product.product_type !== 'ebook' && product.stock < 10 && (
                        <div className="mt-2 text-xs text-orange-600">
                          Apenas {product.stock} unidades em estoque
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Resumo do Pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Frete</span>
                  <span>Calculado na próxima etapa</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/shipping')}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                Continuar para Entrega
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/catalog')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continuar Comprando
              </button>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
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
                  <span>Compra 100% segura</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
