import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { Truck, Clock, Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  icon: 'truck' | 'package' | 'clock';
}

export const Shipping = () => {
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    state: '',
  });

  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [cepCalculated, setCepCalculated] = useState(false);

  const hasPhysicalItems = items.some((item) => item.type === 'physical');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Auto-calculate shipping when CEP is complete
    if (name === 'cep' && value.replace(/\D/g, '').length === 8 && hasPhysicalItems) {
      calculateShipping(value);
    }
  };

  const calculateShipping = (cep: string) => {
    // Simulated shipping calculation
    const options: ShippingOption[] = [
      {
        id: 'sedex',
        name: 'SEDEX',
        price: 25.00,
        deliveryTime: '2-3 dias úteis',
        icon: 'clock',
      },
      {
        id: 'pac',
        name: 'PAC',
        price: 15.00,
        deliveryTime: '5-7 dias úteis',
        icon: 'package',
      },
      {
        id: 'express',
        name: 'Transportadora Express',
        price: 35.00,
        deliveryTime: '1-2 dias úteis',
        icon: 'truck',
      },
    ];

    setShippingOptions(options);
    setCepCalculated(true);
    toast.success('Opções de frete calculadas!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (hasPhysicalItems && (!formData.address || !formData.cep || !selectedShipping)) {
      toast.error('Por favor, preencha o endereço e selecione uma opção de frete');
      return;
    }

    // Save shipping data to sessionStorage to use in checkout
    const shippingData = {
      personalInfo: formData,
      shippingOption: shippingOptions.find((opt) => opt.id === selectedShipping),
    };
    sessionStorage.setItem('shippingData', JSON.stringify(shippingData));

    navigate('/checkout');
  };

  const getShippingIcon = (iconType: string) => {
    switch (iconType) {
      case 'truck':
        return <Truck className="w-6 h-6" />;
      case 'package':
        return <Package className="w-6 h-6" />;
      case 'clock':
        return <Clock className="w-6 h-6" />;
      default:
        return <Truck className="w-6 h-6" />;
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const selectedOption = shippingOptions.find((opt) => opt.id === selectedShipping);
  const shippingCost = selectedOption ? selectedOption.price : 0;
  const totalWithShipping = totalPrice + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Informações de Entrega</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Informações Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nome completo *"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="E-mail *"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Telefone *"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="cpf"
                    placeholder="CPF"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Shipping Address (only for physical items) */}
              {hasPhysicalItems && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Endereço de Entrega</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="cep"
                        placeholder="CEP *"
                        value={formData.cep}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={9}
                      />
                      <div className="md:col-span-2">
                        {cepCalculated && (
                          <div className="text-sm text-green-600 flex items-center gap-2 h-full">
                            ✓ Frete calculado
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      name="address"
                      placeholder="Endereço *"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="number"
                        placeholder="Número *"
                        value={formData.number}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="complement"
                        placeholder="Complemento"
                        value={formData.complement}
                        onChange={handleInputChange}
                        className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="Cidade *"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="Estado *"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Options */}
              {hasPhysicalItems && cepCalculated && shippingOptions.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Opções de Entrega</h2>
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedShipping(option.id)}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                          selectedShipping === option.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`${selectedShipping === option.id ? 'text-blue-600' : 'text-gray-500'}`}>
                              {getShippingIcon(option.icon)}
                            </div>
                            <div>
                              <p className="font-semibold">{option.name}</p>
                              <p className="text-sm text-gray-600">{option.deliveryTime}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">R$ {option.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital Only Message */}
              {!hasPhysicalItems && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    📥 Seu pedido contém apenas e-books. Os arquivos estarão disponíveis imediatamente após a confirmação do pagamento.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Continuar para Pagamento
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                      <p className="text-sm font-semibold text-blue-600">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
                {selectedOption && (
                  <div className="flex justify-between text-gray-700">
                    <span>Frete ({selectedOption.name})</span>
                    <span>R$ {selectedOption.price.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-blue-600">R$ {totalWithShipping.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
