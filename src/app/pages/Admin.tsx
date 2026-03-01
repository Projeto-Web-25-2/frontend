import { useState } from 'react';
import { Package, Users, ShoppingCart, TrendingUp, Plus, Edit, Trash, Search, Filter } from 'lucide-react';
import { products as initialProducts, categories } from '../data/products';
import { toast } from 'sonner';

export const Admin = () => {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  // Product filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterType, setFilterType] = useState<'all' | 'physical' | 'digital'>('all');

  // Mock orders data
  const orders = [
    { id: '#COMP-12345', customer: 'João Silva', total: 245.9, status: 'Pago', date: '2026-02-28' },
    { id: '#COMP-12346', customer: 'Maria Santos', total: 125.0, status: 'Pendente', date: '2026-02-27' },
    { id: '#COMP-12347', customer: 'Pedro Costa', total: 389.8, status: 'Enviado', date: '2026-02-26' },
  ];

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;

  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Produto excluído com sucesso!');
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || product.category === filterCategory;
    const matchesType = filterType === 'all' || product.type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

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
                <p className="text-3xl font-bold text-blue-600">R$ {totalRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Total de Pedidos</h3>
                <p className="text-3xl font-bold text-green-600">{totalOrders}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Produtos Cadastrados</h3>
                <p className="text-3xl font-bold text-purple-600">{totalProducts}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Clientes</h3>
                <p className="text-3xl font-bold text-orange-600">156</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Pedidos Recentes</h2>
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
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-blue-600">{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4 text-gray-600">{order.date}</td>
                        <td className="py-3 px-4 font-semibold">R$ {order.total.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'Pago'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'Pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">Novo Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Título do livro"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Autor"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Preço"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Categoria</option>
                    {categories.filter(c => c !== 'Todos').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="physical">Livro Físico</option>
                    <option value="digital">E-book</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Estoque"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Número de páginas"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="ISBN"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="url"
                    placeholder="URL da Imagem *"
                    className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Descrição"
                    className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      toast.success('Produto adicionado com sucesso!');
                      setShowAddProduct(false);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Salvar Produto
                  </button>
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
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
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </div>
            </div>

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
                    {filteredProducts.map((product) => (
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
                            className={`${
                              product.stock < 10 && product.type === 'physical'
                                ? 'text-orange-600 font-semibold'
                                : 'text-gray-700'
                            }`}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gerenciar Pedidos</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Pedido</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Data</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Total</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-semibold text-blue-600">{order.id}</td>
                        <td className="py-4 px-4">{order.customer}</td>
                        <td className="py-4 px-4 text-gray-600">{order.date}</td>
                        <td className="py-4 px-4 font-semibold">R$ {order.total.toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'Pago'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'Pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toast.info('Detalhes do pedido ' + order.id)}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
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