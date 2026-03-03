import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { Truck, Clock, Package, ArrowRight, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { api, Address as ApiAddress, ShippingQuote } from '../services/api';

export const Shipping = () => {
  const { items, totalPrice } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [newAddress, setNewAddress] = useState({
    street: '',
    street_number: '',
    neighborhood: '',
    city: '',
    state_code: '',
    zip_code: '',
    complement: '',
    reference: '',
    address_type: 'residential',
    primary: false,
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<number>(-1);
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/signin');
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    loadAddresses();
  }, [isAuthenticated, user, items, navigate]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      setLoadingAddresses(true);
      const data = await api.getAddresses(user.uid);
      setAddresses(data);
      
      // Auto-select primary address
      const primary = data.find((addr) => addr.primary);
      if (primary) {
        setSelectedAddressId(primary.uid);
        calculateShippingForAddress(primary.zip_code);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Erro ao carregar endereços');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleCepBlur = async () => {
    const cep = newAddress.zip_code.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      return;
    }

    try {
      setLoadingCep(true);
      const addressData = await api.getAddressByCep(cep);
      
      setNewAddress((prev) => ({
        ...prev,
        street: addressData.street,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state_code: addressData.state,
      }));
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('CEP não encontrado');
    } finally {
      setLoadingCep(false);
    }
  };

  const calculateShippingForAddress = async (zipCode: string) => {
    const cep = zipCode.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      return;
    }

    // Only calculate shipping for physical items
    const physicalItems = items.filter((item) => {
      // Get product from products context or assume physical if not ebook
      return true; // For now, calculate for all items
    });

    if (physicalItems.length === 0) {
      return;
    }

    try {
      setLoadingShipping(true);
      
      // Prepare shipping products (use default dimensions if not available)
      const shippingProducts = physicalItems.map((item) => ({
        id: String(item.product_id),
        width: 15, // cm - default book width
        height: 21, // cm - default book height
        length: 2, // cm - default book thickness
        weight: 0.5, // kg - default book weight
        insurance_value: 50, // R$ - default insurance value
        quantity: item.quantity,
      }));

      const quotes = await api.calculateShipping({
        origin_postal_code: import.meta.env.VITE_ORIGIN_POSTAL_CODE || '58429-900',
        destination_postal_code: cep,
        products: shippingProducts,
      });

      setShippingOptions(quotes);
      toast.success('Opções de frete calculadas!');
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast.error('Erro ao calcular frete. Usando valores padrão.');
      
      // Fallback shipping options
      setShippingOptions([
        {
          name: 'PAC',
          price: 15.00,
          delivery_time: { days: 7 },
        },
        {
          name: 'SEDEX',
          price: 25.00,
          delivery_time: { days: 3 },
        },
      ]);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((addr) => addr.uid === addressId);
    if (address) {
      calculateShippingForAddress(address.zip_code);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!newAddress.street || !newAddress.street_number || !newAddress.city || !newAddress.state_code || !newAddress.zip_code) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const created = await api.createAddress(user.uid, {
        ...newAddress,
        street_number: Number(newAddress.street_number),
        country: 'Brazil',
      });
      
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.uid);
      setShowNewAddressForm(false);
      calculateShippingForAddress(created.zip_code);
      
      toast.success('Endereço salvo com sucesso!');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Erro ao salvar endereço');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    if (shippingOptions.length > 0 && selectedShipping === -1) {
      toast.error('Selecione uma opção de frete');
      return;
    }

    // Save shipping data to sessionStorage
    const selectedAddress = addresses.find((addr) => addr.uid === selectedAddressId);
    const shippingOption = shippingOptions[selectedShipping];
    
    const shippingData = {
      address: selectedAddress,
      shippingOption: shippingOption || { name: 'Digital', price: 0 },
    };
    
    sessionStorage.setItem('shippingData', JSON.stringify(shippingData));

    navigate('/checkout');
  };

  if (loadingAddresses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Dados de Entrega</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Addresses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Endereço de Entrega</h2>
              <button
                type="button"
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                {showNewAddressForm ? 'Cancelar' : '+ Novo Endereço'}
              </button>
            </div>

            {/* Existing Addresses */}
            {addresses.length > 0 && !showNewAddressForm && (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.uid}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === address.uid
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.uid}
                      checked={selectedAddressId === address.uid}
                      onChange={() => handleAddressSelect(address.uid)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">
                        {address.street}, {address.street_number}
                        {address.primary && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.complement && `${address.complement}, `}
                        {address.neighborhood}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.city} - {address.state_code}, {address.zip_code}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {showNewAddressForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={newAddress.zip_code}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, zip_code: e.target.value })
                      }
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loadingCep}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua *
                  </label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={newAddress.street_number}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, street_number: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={newAddress.complement}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, complement: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={newAddress.neighborhood}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, neighborhood: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <input
                      type="text"
                      value={newAddress.state_code}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state_code: e.target.value.toUpperCase() })
                      }
                      maxLength={2}
                      placeholder="PB"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNewAddress}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar Endereço
                </button>
              </div>
            )}
          </div>

          {/* Shipping Options */}
          {shippingOptions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Opções de Frete</h2>
              
              {loadingShipping ? (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Calculando frete...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingOptions.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedShipping === index
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={index}
                          checked={selectedShipping === index}
                          onChange={() => setSelectedShipping(index)}
                        />
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-semibold">{option.name}</div>
                          <div className="text-sm text-gray-600">
                            {option.delivery_time?.days ? `${option.delivery_time.days} dias úteis` : 'Prazo a consultar'}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-blue-600">
                        R$ {(option.price || option.final_price || option.custom_price || 0).toFixed(2)}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
              {selectedShipping !== -1 && shippingOptions[selectedShipping] && (
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    R$ {(shippingOptions[selectedShipping].price || shippingOptions[selectedShipping].final_price || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-blue-600">
                  R${' '}
                  {(
                    totalPrice +
                    (selectedShipping !== -1 && shippingOptions[selectedShipping]
                      ? (shippingOptions[selectedShipping].price || shippingOptions[selectedShipping].final_price || 0)
                      : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Continuar para Pagamento
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
