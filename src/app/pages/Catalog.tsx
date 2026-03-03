import { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Loader } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api, Product } from '../services/api';
import { toast } from 'sonner';

export const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedType, setSelectedType] = useState<'all' | 'physical_book' | 'ebook'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under100' | '100to150' | 'over150'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
        
        // Extract unique categories
        const uniqueCategories = ['Todos', ...new Set(data.map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (error: any) {
        console.error('Error loading products:', error);
        toast.error('Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === 'Todos' || product.category === selectedCategory;
    const typeMatch = selectedType === 'all' || product.product_type === selectedType;
    
    let priceMatch = true;
    if (priceRange === 'under100') priceMatch = product.price < 100;
    if (priceRange === '100to150') priceMatch = product.price >= 100 && product.price <= 150;
    if (priceRange === 'over150') priceMatch = product.price > 150;

    return categoryMatch && typeMatch && priceMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Catálogo de Livros</h1>
          <p className="text-gray-600">
            Explore nossa coleção completa de livros sobre Inteligência Artificial
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  <h2 className="font-semibold text-lg">Filtros</h2>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-blue-600"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Categoria</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-sm">{category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Tipo</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedType('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedType === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">Todos</span>
                    </button>
                    <button
                      onClick={() => setSelectedType('physical_book')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedType === 'physical_book' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">Livro Físico</span>
                    </button>
                    <button
                      onClick={() => setSelectedType('ebook')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedType === 'ebook' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">E-book</span>
                    </button>
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Faixa de Preço</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPriceRange('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        priceRange === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">Todos</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('under100')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        priceRange === 'under100' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">Até R$ 100</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('100to150')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        priceRange === '100to150' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">R$ 100 - R$ 150</span>
                    </button>
                    <button
                      onClick={() => setPriceRange('over150')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        priceRange === 'over150' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">Acima de R$ 150</span>
                    </button>
                  </div>
                </div>

                {/* Reset Filters */}
                <button
                  onClick={() => {
                    setSelectedCategory('Todos');
                    setSelectedType('all');
                    setPriceRange('all');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'livro encontrado' : 'livros encontrados'}
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  Nenhum livro encontrado com os filtros selecionados.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};