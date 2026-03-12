import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Edit, Trash, Search, Filter, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { products as initialProducts, categories } from '../../data/products';
import type { Product } from '../../data/products';
import { productService } from '../../services';
import { mapProductResponseToProduct } from '../../utils/productMapper';

interface ProductsTabProps {
  accessToken: string;
  isAdmin: boolean;
}

type NewProductForm = {
  title: string;
  author: string;
  price: string;
  category: string;
  type: 'physical' | 'digital';
  stock: string;
  pages: string;
  isbn: string;
  image: string;
  description: string;
};

const emptyProductForm: NewProductForm = {
  title: '',
  author: '',
  price: '',
  category: '',
  type: 'physical',
  stock: '',
  pages: '',
  isbn: '',
  image: '',
  description: '',
};

const PRODUCT_TYPE_PAYLOAD_MAP = {
  physical: 'physical_book',
  digital: 'ebook',
} as const;

export const ProductsTab = ({ accessToken, isAdmin }: ProductsTabProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>(emptyProductForm);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Product filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterType, setFilterType] = useState<'all' | 'physical' | 'digital'>('all');

  const canSubmitProduct = Boolean(
    newProduct.title.trim() &&
    newProduct.price.trim() &&
    newProduct.description.trim(),
  );

  // If product is digital, we don't allow selecting stock and set it to 100 internally
  const prevIsDigitalRef = useRef<boolean>(false);
  useEffect(() => {
    if (newProduct.type === 'digital') {
      setNewProduct((prev) => ({ ...prev, stock: '100' }));
    } else {
      // when switching back to physical, clear stock so admin must enter a value
      if (prevIsDigitalRef.current) {
        setNewProduct((prev) => ({ ...prev, stock: '' }));
      }
    }
    prevIsDigitalRef.current = newProduct.type === 'digital';
  }, [newProduct.type]);

  const handleProductFieldChange = (field: keyof NewProductForm, value: string) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  const fetchProducts = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    setProductsLoading(true);
    setProductsError(null);

    try {
      const data = await productService.list(accessToken);
      const mapped = data.map(mapProductResponseToProduct);
      setProducts(mapped);
    } catch (error) {
      console.error('Erro ao carregar produtos', error);
      setProductsError('Não foi possível carregar os produtos.');
      toast.error('Falha ao carregar produtos.');
    } finally {
      setProductsLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id: string) => {
    if (!accessToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      toast.error('ID do produto inválido.');
      return;
    }

    try {
      const product = products.find((p) => p.id === id);
      const currentActive = product?.active ?? true;
      const nextActive = !currentActive;

      const updated = await productService.update(numericId, { active: nextActive }, accessToken);
      const mapped = mapProductResponseToProduct(updated);

      setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
      toast.success(nextActive ? 'Produto ativado com sucesso!' : 'Produto inativado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status do produto', error);
      toast.error('Não foi possível atualizar o status do produto.');
    }
  };

  const handleCreateProduct = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!accessToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const priceNumber = Number(newProduct.price);
    const stockNumber = Number(newProduct.stock);
    const pagesNumber = newProduct.pages ? Number(newProduct.pages) : undefined;
    const categoryValue = newProduct.category.trim();

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      toast.error('Informe um preço válido.');
      return;
    }

    if (!Number.isFinite(stockNumber) || stockNumber < 0) {
      toast.error('Informe um estoque válido.');
      return;
    }

    if (!categoryValue) {
      toast.error('Selecione uma categoria para o produto.');
      return;
    }

    setIsSavingProduct(true);

    try {
      const payload = {
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
        price: priceNumber,
        stock: stockNumber,
        product_type: PRODUCT_TYPE_PAYLOAD_MAP[newProduct.type],
        author: newProduct.author.trim() || undefined,
        category: categoryValue,
        isbn: newProduct.isbn.trim() || undefined,
        num_pages: pagesNumber,
        image: newProduct.image.trim() || undefined,
      };

      const created = await productService.create(payload, accessToken);
      const mappedProduct = mapProductResponseToProduct(created);
      setProducts((prev) => [mappedProduct, ...prev]);
      toast.success('Produto cadastrado com sucesso!');
      setShowAddProduct(false);
      setNewProduct(emptyProductForm);
    } catch (error) {
      console.error('Erro ao cadastrar produto', error);
      toast.error('Não foi possível salvar o produto.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(normalizedSearch) ||
        (product.author?.toLowerCase().includes(normalizedSearch) ?? false);
      const matchesCategory = filterCategory === 'Todos' || product.category === filterCategory;
      const matchesType = filterType === 'all' || product.type === filterType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [products, searchTerm, filterCategory, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Produto
        </button>
      </div>

      {showAddProduct && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Novo Produto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título do livro"
              value={newProduct.title}
              onChange={(event) => handleProductFieldChange('title', event.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Autor"
              value={newProduct.author}
              onChange={(event) => handleProductFieldChange('author', event.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Preço"
              value={newProduct.price}
              onChange={(event) => handleProductFieldChange('price', event.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
            <select
              value={newProduct.category}
              onChange={(event) => handleProductFieldChange('category', event.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Categoria</option>
              {categories
                .filter((category) => category !== 'Todos')
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
            <select
              value={newProduct.type}
              onChange={(event) => handleProductFieldChange('type', event.target.value as 'physical' | 'digital')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="physical">Livro Físico</option>
              <option value="digital">E-book</option>
            </select>

            {/* If digital, don't allow admin to set stock and show an informational label; stock is set to 100 internally */}
            {newProduct.type === 'physical' ? (
              <input
                type="number"
                placeholder="Estoque"
                value={newProduct.stock}
                onChange={(event) => handleProductFieldChange('stock', event.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            ) : (
              <div className="px-4 py-3 border border-gray-100 rounded-lg text-sm text-gray-600 flex items-center">
                Estoque automático(digital)
              </div>
            )}
            <input
              type="number"
              placeholder="Número de páginas"
              value={newProduct.pages}
              onChange={(event) => handleProductFieldChange('pages', event.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <input
              type="text"
              placeholder="ISBN"
              value={newProduct.isbn}
              onChange={(event) => handleProductFieldChange('isbn', event.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="URL da Imagem"
              value={newProduct.image}
              onChange={(event) => handleProductFieldChange('image', event.target.value)}
              className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Descrição"
              value={newProduct.description}
              onChange={(event) => handleProductFieldChange('description', event.target.value)}
              className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={!canSubmitProduct || isSavingProduct}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProduct ? 'Salvando...' : 'Salvar Produto'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddProduct(false);
                setNewProduct(emptyProductForm);
              }}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título ou autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'physical' | 'digital')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="physical">Apenas Físicos</option>
            <option value="digital">Apenas E-books</option>
          </select>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {productsLoading
            ? 'Carregando produtos...'
            : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
        </div>
      </div>

      {productsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {productsError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Produto</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Categoria</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Preço</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Estoque</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {productsLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="py-4 px-4">
                          <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredProducts.length > 0
                ? filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-100 ${
                        product.active === false ? 'bg-gray-50 opacity-70' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              {product.title}
                              {product.active === false && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                  Inativo
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">{product.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">{product.category}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            product.type === 'digital'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.type === 'digital' ? 'E-book' : 'Físico'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold">R$ {product.price.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        {product.type === 'physical' ? (
                          <span className={product.stock < 10 ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
                            {product.stock}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            aria-label="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className={`p-2 rounded transition-colors ${
                              product.active === false
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            aria-label={product.active === false ? 'Ativar produto' : 'Inativar produto'}
                          >
                            {product.active === false ? (
                              <Undo2 className="w-4 h-4" />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                        Nenhum produto encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
