import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ShoppingCart, ArrowLeft, BookOpen, Package, Download, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, Product } from '../services/api';
import { toast } from 'sonner';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/catalog');
      return;
    }

    loadProduct(parseInt(id));
  }, [id, navigate]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      const data = await api.getProduct(productId);
      setProduct(data);

      // Load related products
      const allProducts = await api.getProducts();
      const related = allProducts
        .filter((p) => p.category === data.category && p.id !== data.id && p.active)
        .slice(0, 3);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Produto não encontrado');
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar ao carrinho');
      navigate('/signin');
      return;
    }

    if (!product) return;

    try {
      await addToCart(product, 1);
    } catch (error) {
      // Error already handled in context
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="relative">
              <img
                src={
                  product.image ||
                  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop'
                }
                alt={product.title}
                className="w-full h-auto rounded-lg shadow-md"
              />
              {product.discount_percent && product.discount_percent > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                  {product.discount_percent}% OFF
                </div>
              )}
              {!product.active && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <span className="text-white text-2xl font-semibold">Indisponível</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {product.category}
                </span>
                <span className="inline-block ml-2 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                  {product.product_type === 'ebook' ? 'E-book' : 'Livro Físico'}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{product.title}</h1>

              {product.author && (
                <p className="text-xl text-gray-600 mb-6">por {product.author}</p>
              )}

              <div className="mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  R$ {product.price.toFixed(2)}
                </div>
                {product.discount_percent && product.discount_percent > 0 && (
                  <div className="text-lg text-gray-400 line-through">
                    R${' '}
                    {(product.price / (1 - product.discount_percent / 100)).toFixed(2)}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Product Details */}
              <div className="space-y-3 mb-8">
                {product.isbn && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">ISBN: {product.isbn}</span>
                  </div>
                )}
                {product.publisher && (
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Editora: {product.publisher}</span>
                  </div>
                )}
                {product.pub_year && (
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Ano: {product.pub_year}</span>
                  </div>
                )}
                {product.num_pages && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{product.num_pages} páginas</span>
                  </div>
                )}
                {product.language && (
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Idioma: {product.language}</span>
                  </div>
                )}
                {product.format && (
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      Formato: {product.format.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Info */}
              {product.product_type !== 'ebook' && (
                <div className="mb-6">
                  {product.stock > 0 ? (
                    product.stock < 10 ? (
                      <div className="text-orange-600 font-semibold">
                        Apenas {product.stock} unidades em estoque
                      </div>
                    ) : (
                      <div className="text-green-600 font-semibold">Em estoque</div>
                    )
                  ) : (
                    <div className="text-red-600 font-semibold">Fora de estoque</div>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.active || (product.product_type !== 'ebook' && product.stock === 0)}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                <ShoppingCart className="w-6 h-6" />
                {product.active
                  ? product.product_type === 'ebook' || product.stock > 0
                    ? 'Adicionar ao Carrinho'
                    : 'Fora de Estoque'
                  : 'Produto Indisponível'}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <img
                    src={
                      relatedProduct.image ||
                      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop'
                    }
                    alt={relatedProduct.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {relatedProduct.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {relatedProduct.author || 'Autor desconhecido'}
                    </p>
                    <div className="text-xl font-bold text-blue-600">
                      R$ {relatedProduct.price.toFixed(2)}
                    </div>
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
