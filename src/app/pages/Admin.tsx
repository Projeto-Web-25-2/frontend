import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Package, Users, ShoppingCart, TrendingUp, Plus, Edit, Trash, Search, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { products as initialProducts, categories } from '../data/products';
import type { Product } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { adminService, productService } from '../services';
import type { AdminSummary, OrderResponse, OrderStatus } from '../services';
import { mapProductResponseToProduct } from '../utils/productMapper';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatOrderDate = (value: string) => dateFormatter.format(new Date(value));
const formatCustomerId = (uid: string) => (uid.length > 16 ? `${uid.slice(0, 8)}…${uid.slice(-4)}` : uid);

const orderStatusVisuals: Record<OrderStatus, { label: string; badge: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento', badge: 'bg-yellow-100 text-yellow-800' },
  payment_confirmed: { label: 'Pagamento confirmado', badge: 'bg-green-100 text-green-800' },
  shipped: { label: 'Enviado', badge: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Entregue', badge: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', badge: 'bg-red-100 text-red-800' },
};

const getStatusVisuals = (status: OrderStatus) =>
  orderStatusVisuals[status] ?? { label: status, badge: 'bg-gray-100 text-gray-800' };

const getOrderItemsCount = (order: OrderResponse) =>
  order.items.reduce((total, item) => total + item.quantity, 0);

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

export const Admin = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>(emptyProductForm);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Product filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterType, setFilterType] = useState<'all' | 'physical' | 'digital'>('all');

  // Admin data
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderLimit, setOrderLimit] = useState(30);

  const { user, accessToken, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const redirectWarnedRef = useRef(false);
  const canSubmitProduct = Boolean(
    newProduct.title.trim() &&
    newProduct.price.trim() &&
    newProduct.stock.trim() &&
    newProduct.description.trim()
  );

  const handleProductFieldChange = (field: keyof NewProductForm, value: string) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || !accessToken) {
      if (!redirectWarnedRef.current) {
        toast.error('Faça login para acessar o painel administrativo.');
        redirectWarnedRef.current = true;
      }
      navigate('/signin', { replace: true });
      return;
    }

    if (!isAdmin) {
      if (!redirectWarnedRef.current) {
        toast.error('Acesso restrito a administradores.');
        redirectWarnedRef.current = true;
      }
      navigate('/', { replace: true });
    }
  }, [user, accessToken, isAdmin, isAuthLoading, navigate]);

  useEffect(() => {
    if (!accessToken || !isAdmin) return;
    let active = true;

    setSummaryLoading(true);
    setSummaryError(null);

    adminService
      .getSummary(accessToken)
      .then((data) => {
        if (!active) return;
        setSummary(data);
      })
      .catch(() => {
        if (!active) return;
        setSummaryError('Não foi possível carregar as métricas.');
        toast.error('Falha ao carregar métricas administrativas.');
      })
      .finally(() => {
        if (active) {
          setSummaryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, isAdmin]);

  const fetchOrders = useCallback(async () => {
    if (!accessToken || !isAdmin) return;
    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const data = await adminService.getRecentOrders(accessToken, orderLimit);
      setRecentOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos recentes', error);
      setOrdersError('Não foi possível carregar os pedidos recentes.');
      toast.error('Falha ao carregar pedidos recentes.');
    } finally {
      setOrdersLoading(false);
    }
  }, [accessToken, isAdmin, orderLimit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id: string) => {
    if (!accessToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      toast.error('ID do produto inválido.');
      return;
    }

    try {
      await productService.delete(numericId, accessToken);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir produto', error);
      toast.error('Não foi possível excluir o produto.');
    }
  };

  const handleCreateProduct = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!accessToken) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const priceNumber = Number(newProduct.price);
    const stockNumber = Number(newProduct.stock);
    const pagesNumber = newProduct.pages ? Number(newProduct.pages) : undefined;

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      toast.error('Informe um preço válido.');
      return;
    }

    if (!Number.isFinite(stockNumber) || stockNumber < 0) {
      toast.error('Informe um estoque válido.');
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
        category: newProduct.category || undefined,
        isbn: newProduct.isbn.trim() || undefined,
        num_pages: pagesNumber,
        image_url: newProduct.image.trim() || undefined,
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

  const dashboardOrders = useMemo(() => recentOrders.slice(0, 5), [recentOrders]);
  const totalRevenue = summary?.total_revenue ?? 0;
  const totalOrders = summary?.total_orders ?? 0;
  const totalProductsCard = summary?.total_products ?? products.length;
  const totalCustomers = summary?.total_customers ?? 0;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando painel...</p>
      </div>
    );
  }

  if (!user || !accessToken || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie produtos, pedidos e visualize estatísticas</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pedidos
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Receita Total</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {summaryLoading ? (
                    <span className="inline-block h-7 w-28 animate-pulse rounded bg-blue-50" />
                  ) : (
                    formatCurrency(totalRevenue)
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Total de Pedidos</h3>
                <p className="text-3xl font-bold text-green-600">
                  {summaryLoading ? (
                    <span className="inline-block h-7 w-16 animate-pulse rounded bg-green-50" />
                  ) : (
                    totalOrders
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Produtos Cadastrados</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {summaryLoading ? (
                    <span className="inline-block h-7 w-16 animate-pulse rounded bg-purple-50" />
                  ) : (
                    totalProductsCard
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Clientes</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {summaryLoading ? (
                    <span className="inline-block h-7 w-14 animate-pulse rounded bg-orange-50" />
                  ) : (
                    totalCustomers
                  )}
                </p>
              </div>
            </div>

            {summaryError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {summaryError}
              </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Pedidos Recentes</h2>
                <button
                  onClick={() => fetchOrders()}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {ordersError && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {ordersError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pedido</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-100" />
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block h-4 w-28 animate-pulse rounded bg-gray-100" />
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block h-4 w-20 animate-pulse rounded bg-gray-100" />
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block h-4 w-16 animate-pulse rounded bg-gray-100" />
                            </td>
                          </tr>
                        ))
                      : dashboardOrders.length > 0
                      ? dashboardOrders.map((order) => {
                          const { label, badge } = getStatusVisuals(order.status);
                          return (
                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-semibold text-blue-600">{order.order_number}</td>
                              <td className="py-3 px-4 font-mono text-sm text-gray-700">{formatCustomerId(order.customer_uid)}</td>
                              <td className="py-3 px-4 text-gray-600">{formatOrderDate(order.created_at)}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(order.total)}</td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                                  {label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                              Nenhum pedido recente encontrado.
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
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
                  <input
                    type="number"
                    placeholder="Estoque"
                    value={newProduct.stock}
                    onChange={(event) => handleProductFieldChange('stock', event.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
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
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
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
                          <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-12 h-16 object-cover rounded"
                                />
                                <div>
                                  <p className="font-semibold">{product.title}</p>
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
                              <span
                                className={
                                  product.stock < 10 && product.type === 'physical'
                                    ? 'text-orange-600 font-semibold'
                                    : 'text-gray-700'
                                }
                              >
                                {product.stock}
                              </span>
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
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  aria-label="Excluir"
                                >
                                  <Trash className="w-4 h-4" />
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
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold">Gerenciar Pedidos</h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="order-limit" className="text-sm font-semibold text-gray-600">
                    Qtd. de pedidos
                  </label>
                  <select
                    id="order-limit"
                    value={orderLimit}
                    onChange={(event) => setOrderLimit(Number(event.target.value))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 20, 30, 50].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => fetchOrders()}
                  disabled={ordersLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>

            {ordersError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {ordersError}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Pedido</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Data</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Itens</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            {Array.from({ length: 7 }).map((_, cellIndex) => (
                              <td key={cellIndex} className="py-4 px-4">
                                <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : recentOrders.length > 0
                      ? recentOrders.map((order) => {
                          const { label, badge } = getStatusVisuals(order.status);
                          return (
                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4 font-semibold text-blue-600">{order.order_number}</td>
                              <td className="py-4 px-4 font-mono text-sm text-gray-700">{formatCustomerId(order.customer_uid)}</td>
                              <td className="py-4 px-4 text-gray-600">{formatOrderDate(order.created_at)}</td>
                              <td className="py-4 px-4 text-sm text-gray-700">{getOrderItemsCount(order)}</td>
                              <td className="py-4 px-4 font-semibold">{formatCurrency(order.total)}</td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                                  {label}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => toast.info(`Detalhes do pedido ${order.order_number}`)}
                                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                                >
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      : (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-sm text-gray-500">
                              Nenhum pedido encontrado para o filtro atual.
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};