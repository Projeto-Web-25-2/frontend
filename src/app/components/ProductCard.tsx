import { ShoppingCart, BookOpen } from 'lucide-react';
import { Product } from '../services/api';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await addToCart(product, 1);
    } catch (error) {
      // Error is already handled in CartContext
    }
  };

  // Calculate discount if exists
  const hasDiscount = product.discount_percent && product.discount_percent > 0;
  const originalPrice = hasDiscount ? product.price / (1 - product.discount_percent / 100) : null;

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop'}
          alt={product.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
            {product.discount_percent}% OFF
          </div>
        )}
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          {product.product_type === 'ebook' ? 'E-book' : 'Físico'}
        </div>
        {!product.active && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Indisponível</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.category}</div>
        <h3 className="font-semibold text-lg mb-1 line-clamp-2 min-h-[3.5rem]">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{product.author || 'Autor desconhecido'}</p>

        {product.num_pages && (
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">{product.num_pages} páginas</span>
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            {originalPrice && (
              <div className="text-xs text-gray-400 line-through">
                R$ {originalPrice.toFixed(2)}
              </div>
            )}
            <div className="text-2xl font-bold text-blue-600">
              R$ {product.price.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.active || product.stock === 0}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>

        {product.stock < 10 && product.stock > 0 && product.product_type !== 'ebook' && (
          <div className="mt-2 text-xs text-orange-600">
            Apenas {product.stock} unidades em estoque
          </div>
        )}
        {product.stock === 0 && (
          <div className="mt-2 text-xs text-red-600 font-semibold">
            Fora de estoque
          </div>
        )}
      </div>
    </div>
  );
};