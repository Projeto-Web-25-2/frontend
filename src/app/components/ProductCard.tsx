import { ShoppingCart, BookOpen } from 'lucide-react';
import { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.title} adicionado ao carrinho!`);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.originalPrice && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          {product.type === 'digital' ? 'E-book' : 'Físico'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.category}</div>
        <h3 className="font-semibold text-lg mb-1 line-clamp-2 min-h-[3.5rem]">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{product.author}</p>

        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">{product.pages} páginas</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {product.originalPrice && (
              <div className="text-xs text-gray-400 line-through">
                R$ {product.originalPrice.toFixed(2)}
              </div>
            )}
            <div className="text-2xl font-bold text-blue-600">
              R$ {product.price.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>

        {product.stock < 10 && product.type === 'physical' && (
          <div className="mt-2 text-xs text-orange-600">
            Apenas {product.stock} unidades em estoque
          </div>
        )}
      </div>
    </div>
  );
};
