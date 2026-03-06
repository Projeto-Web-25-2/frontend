import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShoppingCart, ArrowLeft, BookOpen, Package, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import type { Product } from '../data/products';
import { mapProductResponseToProduct } from '../utils/productMapper';
import { productService } from '../services';
import { useAuth } from '../context/AuthContext';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { accessToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      if (!accessToken) {
        setIsLoading(false);
        setError('Faça login para visualizar os detalhes do produto.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const productId = Number(id);
        const [productResponse, productList] = await Promise.all([
          productService.getById(productId, accessToken),
          productService.list(accessToken),
        ]);

        const currentProduct = mapProductResponseToProduct(productResponse);
        const mappedList = productList.map(mapProductResponseToProduct);
        const related = mappedList
          .filter((item) => item.id !== currentProduct.id && item.category === currentProduct.category)
          .slice(0, 3);

        setProduct(currentProduct);
        setRelatedProducts(related);
      } catch (err) {
        console.error('Erro ao carregar produto', err);
        setError('Não foi possível carregar o produto.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, accessToken]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product);
      toast.success(`${product.title} adicionado ao carrinho!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar ao carrinho.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{error ?? 'Produto não encontrado'}</h2>
          <button
            onClick={() => navigate('/catalog')}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div>
              <img
                src={product.image}
                alt={product.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* Info */}
            <div>
              <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                {product.category}
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
              <p className="text-xl text-gray-600 mb-6">por {product.author}</p>

              <div className="flex items-end gap-4 mb-6">
                {product.originalPrice && (
                  <span className="text-2xl text-gray-400 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-4xl font-bold text-blue-600">
                  R$ {product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

              {/* Details */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                  {product.type === 'digital' ? (
                    <Download className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Package className="w-5 h-5 text-blue-600" />
                  )}
                  <span>{product.type === 'digital' ? 'E-book Digital' : 'Livro Físico'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>{product.pages} páginas</span>
                </div>
                {product.isbn && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="font-semibold">ISBN:</span>
                    <span>{product.isbn}</span>
                  </div>
                )}
              </div>

              {/* Stock */}
              {product.type === 'physical' && (
                <div className="mb-6">
                  {product.stock > 10 ? (
                    <p className="text-green-600 font-medium">✓ Em estoque</p>
                  ) : product.stock > 0 ? (
                    <p className="text-orange-600 font-medium">
                      Apenas {product.stock} unidades disponíveis
                    </p>
                  ) : (
                    <p className="text-red-600 font-medium">Fora de estoque</p>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.type === 'physical' && product.stock === 0}
                  className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Livros Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <img src={p.image} alt={p.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{p.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{p.author}</p>
                    <p className="text-lg font-bold text-blue-600">R$ {p.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
