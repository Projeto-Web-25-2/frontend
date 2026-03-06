import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Truck, Clock, Package, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  addressService,
  shippingService,
  type AddressResponse,
  type ShippingDeliveryTimeDTO,
  type ShippingProductDTO,
  type ShippingQuoteDTO,
} from '../services';

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  icon: 'truck' | 'package' | 'clock';
}

type ShippingIcon = ShippingOption['icon'];

const sanitizeCepValue = (value: string) => value.replace(/\D/g, '');

const formatCepValue = (value: string) => {
  const digits = sanitizeCepValue(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const ensurePositive = (value: number | undefined, fallback: number) => {
  if (value === undefined || Number.isNaN(value) || value <= 0) {
    return fallback;
  }
  return Number(value);
};

const pluralizeBusinessDays = (value: number) => `${value} dia${value > 1 ? 's' : ''} úteis`;

const formatDateEstimate = (raw?: string | null) => {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
  return `Até ${formatted}`;
};

const formatDeliveryTimeLabel = (
  delivery?: ShippingDeliveryTimeDTO | string | number | null
) => {
  if (delivery === undefined || delivery === null) {
    return 'Prazo informado após a confirmação';
  }

  if (typeof delivery === 'string') {
    const trimmed = delivery.trim();
    return trimmed || 'Prazo informado após a confirmação';
  }

  if (typeof delivery === 'number') {
    const days = Math.max(1, Math.ceil(delivery));
    return pluralizeBusinessDays(days);
  }

  const rangeMin = delivery.delivery_range?.min ?? delivery.min;
  const rangeMax = delivery.delivery_range?.max ?? delivery.max;

  if (rangeMin && rangeMax) {
    if (rangeMin === rangeMax) {
      return pluralizeBusinessDays(rangeMin);
    }
    return `${rangeMin}-${rangeMax} dias úteis`;
  }

  if (rangeMin) {
    return `a partir de ${rangeMin} dias úteis`;
  }

  if (delivery.days && delivery.days > 0) {
    return pluralizeBusinessDays(delivery.days);
  }

  if (delivery.hours && delivery.hours > 0) {
    const hours = Math.ceil(delivery.hours);
    return `Em até ${hours} hora${hours > 1 ? 's' : ''}`;
  }

  const estimatedDate = formatDateEstimate(delivery.estimated_at ?? delivery.forecast ?? delivery.date);
  if (estimatedDate) {
    return estimatedDate;
  }

  return 'Prazo sob consulta';
};

const inferIconFromName = (name: string): ShippingIcon => {
  const normalized = name.toLowerCase();
  if (normalized.includes('express') || normalized.includes('expresso')) {
    return 'truck';
  }
  if (normalized.includes('sedex') || normalized.includes('rápido') || normalized.includes('rapido')) {
    return 'clock';
  }
  if (normalized.includes('pac') || normalized.includes('econ')) {
    return 'package';
  }
  return 'truck';
};

const DEFAULT_DIMENSIONS = {
  width: 16,
  height: 4,
  length: 24,
};

const DEFAULT_WEIGHT = 0.45;
const MIN_INSURANCE_VALUE = 20;
const ORIGIN_POSTAL_CODE = sanitizeCepValue(import.meta.env.VITE_ORIGIN_POSTAL_CODE ?? '01310100');

interface ShippingCartItemInput {
  id: string;
  quantity: number;
  price: number;
  type: string;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  insuranceValue?: number;
}

const buildShippingProductsPayload = (items: ShippingCartItemInput[]): ShippingProductDTO[] =>
  items
    .filter((item) => item.type === 'physical' && item.quantity > 0)
    .map((item) => {
      const width = ensurePositive(item.width, DEFAULT_DIMENSIONS.width);
      const height = ensurePositive(item.height, DEFAULT_DIMENSIONS.height);
      const length = ensurePositive(item.length, DEFAULT_DIMENSIONS.length);
      const weight = ensurePositive(item.weight, DEFAULT_WEIGHT);
      const insurance = Math.max(item.insuranceValue ?? item.price, MIN_INSURANCE_VALUE);

      return {
        id: item.id,
        width: Number(width.toFixed(2)),
        height: Number(height.toFixed(2)),
        length: Number(length.toFixed(2)),
        weight: Number(weight.toFixed(2)),
        insurance_value: Number(insurance.toFixed(2)),
        quantity: item.quantity,
      };
    });

const normalizeQuotesToOptions = (quotes: ShippingQuoteDTO[]): ShippingOption[] =>
  quotes
    .map((quote, index) => {
      const rawPrice = quote.final_price ?? quote.custom_price ?? quote.price;
      if (rawPrice === undefined || rawPrice === null) {
        return null;
      }

      const price = Math.max(Number(rawPrice), 0);
      const name = quote.name ?? quote.company?.name ?? 'Serviço de entrega';

      return {
        id: quote.id ?? `quote-${index}`,
        name,
        price: Number(price.toFixed(2)),
        deliveryTime: formatDeliveryTimeLabel(quote.delivery_time),
        icon: inferIconFromName(name),
      } satisfies ShippingOption;
    })
    .filter((option): option is ShippingOption => Boolean(option));

const estimateShippingOptions = (products: ShippingProductDTO[], destinationCep: string): ShippingOption[] => {
  if (!products.length) {
    return [];
  }

  const totalWeight = products.reduce((sum, product) => sum + product.weight * product.quantity, 0);
  const totalVolume = products.reduce(
    (sum, product) => sum + product.width * product.height * product.length * product.quantity,
    0
  );
  const originPrefix = Number(ORIGIN_POSTAL_CODE.slice(0, 3)) || 0;
  const destinationPrefix = Number(destinationCep.slice(0, 3)) || originPrefix;
  const distanceFactor = Math.abs(originPrefix - destinationPrefix) * 0.35;

  const baseCost = 14;
  const weightFactor = totalWeight * 8.5;
  const volumeFactor = totalVolume / 8000;
  const standardPrice = Number((baseCost + weightFactor + volumeFactor + distanceFactor).toFixed(2));
  const expressPrice = Number((standardPrice * 1.35 + 5).toFixed(2));
  const economyPrice = Number(Math.max(baseCost - 2, standardPrice * 0.85).toFixed(2));

  return [
    {
      id: 'estimate-standard',
      name: 'Entrega Padrão',
      price: standardPrice,
      deliveryTime: '4-6 dias úteis',
      icon: 'package',
    },
    {
      id: 'estimate-express',
      name: 'Entrega Expressa',
      price: expressPrice,
      deliveryTime: '1-3 dias úteis',
      icon: 'truck',
    },
    {
      id: 'estimate-economy',
      name: 'Entrega Econômica',
      price: economyPrice,
      deliveryTime: '7-10 dias úteis',
      icon: 'clock',
    },
  ];
};

export const Shipping = () => {
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useAuth();

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
    neighborhood: '',
  });

  const [selectedShipping, setSelectedShipping] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [cepCalculated, setCepCalculated] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressUid, setSelectedAddressUid] = useState('');
  const [lastCalculatedCep, setLastCalculatedCep] = useState('');
  const shippingAuthWarningShown = useRef(false);

  const hasPhysicalItems = items.some((item) => item.type === 'physical');

  const physicalSavedAddresses = savedAddresses.filter((address) => {
    const isVirtualAddress =
      address.street === 'Entrega Digital' ||
      address.city === 'Online' ||
      address.state_code === 'NA' ||
      address.zip_code === '00000000';

    return !isVirtualAddress;
  });

  const fetchSavedAddresses = useCallback(async () => {
    if (!user || !accessToken) return;
    setIsLoadingAddresses(true);
    try {
      const addresses = await addressService.list(user.uid, accessToken);
      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Erro ao carregar endereços', error);
      toast.error('Não foi possível carregar os endereços salvos.');
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (user && accessToken) {
      fetchSavedAddresses();
    } else {
      setSavedAddresses([]);
      setSelectedAddressUid('');
    }
  }, [user, accessToken, fetchSavedAddresses]);

  useEffect(() => {
    // Quando não há itens físicos, garantimos que o estado de frete esteja limpo
    // mas evitamos ficar chamando setState em todo render.
    if (!hasPhysicalItems) {
      if (shippingOptions.length !== 0 || selectedShipping !== '' || cepCalculated) {
        setShippingOptions([]);
        setSelectedShipping('');
        setCepCalculated(false);
      }
      return;
    }

    if (shippingOptions.length === 0) {
      if (selectedShipping) {
        setSelectedShipping('');
      }
      return;
    }

    if (!shippingOptions.some((option) => option.id === selectedShipping)) {
      setSelectedShipping(shippingOptions[0].id);
    }
  }, [hasPhysicalItems, shippingOptions, selectedShipping, cepCalculated]);

  const isPhysicalAddressComplete = () =>
    Boolean(
      formData.address &&
        formData.neighborhood &&
        formData.city &&
        formData.state &&
        formData.number &&
        sanitizeCepValue(formData.cep).length === 8
    );

  const buildAddressPayload = (physical: boolean) => ({
    street: physical ? formData.address : 'Entrega Digital',
    street_number: physical ? Number(formData.number) || 0 : 0,
    neighborhood: physical ? formData.neighborhood : 'N/A',
    city: physical ? formData.city : 'Online',
    state_code: physical ? formData.state.toUpperCase() : 'NA',
    zip_code: physical ? sanitizeCepValue(formData.cep) : '00000000',
    country: 'Brazil',
    complement: formData.complement || null,
    reference: null,
    address_type: 'residential',
    primary: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'cep') {
      value = formatCepValue(value);
      setCepCalculated(false);
      setShippingOptions([]);
      setSelectedShipping('');
      setLastCalculatedCep('');
    }

    if (name === 'state') {
      value = value.toUpperCase();
    }

    const addressFields = ['cep', 'address', 'number', 'neighborhood', 'city', 'state', 'complement'];
    if (addressFields.includes(name)) {
      setSelectedAddressUid('');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'cep' && hasPhysicalItems) {
      const sanitizedCep = sanitizeCepValue(value);
      if (sanitizedCep.length === 8) {
        void handleCepResolved(sanitizedCep);
      }
    }
  };

  const fetchAddressByCep = async (sanitizedCep: string) => {
    if (!accessToken) return;
    setIsFetchingCep(true);
    try {
      const response = await shippingService.getAddressByCep(sanitizedCep, accessToken);
      setFormData((prev) => ({
        ...prev,
        cep: formatCepValue(sanitizedCep),
        address: response.street || prev.address,
        neighborhood: response.neighborhood || prev.neighborhood,
        city: response.city || prev.city,
        state: response.state || prev.state,
      }));
      toast.success('Endereço preenchido automaticamente!');
    } catch (error) {
      console.error('Erro ao buscar CEP', error);
      toast.error('Não foi possível localizar o CEP informado.');
    } finally {
      setIsFetchingCep(false);
    }
  };

  const calculateShippingQuotes = async (sanitizedCep: string) => {
    if (!accessToken || !hasPhysicalItems) return;
    const products = buildShippingProductsPayload(items);
    if (!products.length) {
      toast.error('Não há itens físicos no carrinho para calcular o frete.');
      return;
    }

    setIsCalculatingShipping(true);
    try {
      const payload = {
        origin_postal_code: ORIGIN_POSTAL_CODE || '01310100',
        destination_postal_code: sanitizedCep,
        products,
      };
      const quotes = await shippingService.getQuotes(payload, accessToken);
      let options = normalizeQuotesToOptions(quotes);
      if (!options.length) {
        options = estimateShippingOptions(products, sanitizedCep);
      }
      setShippingOptions(options);
      setCepCalculated(true);
      setLastCalculatedCep(sanitizedCep);
      toast.success('Opções de frete atualizadas!');
    } catch (error) {
      console.error('Erro ao calcular frete', error);
      const estimated = estimateShippingOptions(products, sanitizedCep);
      if (estimated.length) {
        setShippingOptions(estimated);
        setCepCalculated(true);
        setLastCalculatedCep(sanitizedCep);
        toast.warning('Não foi possível consultar o frete. Exibindo estimativas.');
      } else {
        toast.error('Não foi possível calcular o frete.');
      }
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleCepResolved = async (sanitizedCep: string, force = false) => {
    if (!hasPhysicalItems || sanitizedCep.length !== 8) return;

    if (!force && sanitizedCep === lastCalculatedCep && cepCalculated) {
      return;
    }

    if (accessToken) {
      if (!isAuthenticated) {
        toast.error('Faça login para calcular o frete.');
        return;
      }
      if (sanitizedCep !== lastCalculatedCep || !cepCalculated || force) {
        await fetchAddressByCep(sanitizedCep);
      }
      await calculateShippingQuotes(sanitizedCep);
      return;
    }

    const products = buildShippingProductsPayload(items);
    if (!products.length) {
      return;
    }

    if (!shippingAuthWarningShown.current) {
      toast.info('Faça login para obter as cotações oficiais. Exibindo estimativas.');
      shippingAuthWarningShown.current = true;
    }

    const estimated = estimateShippingOptions(products, sanitizedCep);
    if (estimated.length) {
      setShippingOptions(estimated);
      setCepCalculated(true);
      setLastCalculatedCep(sanitizedCep);
    }
  };

  const handleManualShippingCalculation = () => {
    const sanitizedCep = sanitizeCepValue(formData.cep);
    if (sanitizedCep.length !== 8) {
      toast.error('Informe um CEP válido para calcular o frete.');
      return;
    }
    void handleCepResolved(sanitizedCep, true);
  };

  const handleSelectSavedAddress = (address: AddressResponse) => {
    setSelectedAddressUid(address.uid);
    setFormData((prev) => ({
      ...prev,
      cep: formatCepValue(address.zip_code),
      address: address.street,
      number: address.street_number ? String(address.street_number) : '',
      complement: address.complement ?? '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state_code ?? prev.state,
    }));

    const sanitizedCep = sanitizeCepValue(address.zip_code);
    if (hasPhysicalItems && sanitizedCep.length === 8) {
      void handleCepResolved(sanitizedCep, true);
    }
  };

  const saveCurrentAddress = async (showFeedback = true): Promise<AddressResponse | null> => {
    if (!user || !accessToken) {
      if (showFeedback) {
        toast.error('Faça login para salvar um endereço.');
      }
      return null;
    }

    if (!hasPhysicalItems) {
      if (showFeedback) {
        toast.info('Salvar endereço é necessário apenas para produtos físicos.');
      }
      return null;
    }

    if (!isPhysicalAddressComplete()) {
      if (showFeedback) {
        toast.error('Preencha o endereço completo antes de salvar.');
      }
      return null;
    }

    if (showFeedback) {
      setIsSavingAddress(true);
    }

    try {
      const payload = buildAddressPayload(true);
      const response = await addressService.create(user.uid, payload, accessToken);
      setSelectedAddressUid(response.uid);
      setSavedAddresses((prev) => {
        const exists = prev.some((addr) => addr.uid === response.uid);
        if (exists) {
          return prev.map((addr) => (addr.uid === response.uid ? response : addr));
        }
        return [...prev, response];
      });
      if (showFeedback) {
        toast.success('Endereço salvo com sucesso!');
      }
      return response;
    } catch (error) {
      console.error('Erro ao salvar endereço', error);
      if (showFeedback) {
        toast.error('Não foi possível salvar o endereço. Tente novamente.');
      }
      return null;
    } finally {
      if (showFeedback) {
        setIsSavingAddress(false);
      }
    }
  };

  const handleSaveAddress = async () => {
    await saveCurrentAddress(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user || !accessToken) {
      toast.error('Faça login para continuar.');
      navigate('/signin');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (hasPhysicalItems) {
      if (!selectedAddressUid && !isPhysicalAddressComplete()) {
        toast.error('Preencha o endereço completo ou selecione um endereço salvo.');
        return;
      }
      if (!selectedShipping) {
        toast.error('Selecione uma opção de frete.');
        return;
      }
    }

    try {
      let addressUid: string | null = null;

      if (hasPhysicalItems) {
        if (selectedAddressUid) {
          addressUid = selectedAddressUid;
        } else {
          const saved = await saveCurrentAddress(false);
          if (!saved) {
            return;
          }
          addressUid = saved.uid;
        }
      } else {
        const virtualAddress = await addressService.create(
          user.uid,
          buildAddressPayload(false),
          accessToken
        );
        addressUid = virtualAddress.uid;
      }

      const shippingOption = hasPhysicalItems
        ? shippingOptions.find((opt) => opt.id === selectedShipping) || null
        : {
            id: 'digital-free',
            name: 'Entrega Digital',
            price: 0,
            deliveryTime: 'Disponível imediatamente após pagamento',
            icon: 'clock' as const,
          };

      const shippingData = {
        personalInfo: formData,
        shippingOption,
        addressUid,
      };
      sessionStorage.setItem('shippingData', JSON.stringify(shippingData));

      navigate('/checkout');
    } catch (error) {
      console.error('Erro ao salvar endereço', error);
      toast.error('Não foi possível salvar o endereço. Tente novamente.');
    }
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
  const canCalculateShipping = sanitizeCepValue(formData.cep).length === 8;

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

              {/* Shipping Address - apenas para itens físicos */}
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
                      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                        {isFetchingCep && (
                          <div className="text-sm text-blue-600 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Consultando CEP...
                          </div>
                        )}
                        {cepCalculated && hasPhysicalItems && shippingOptions.length > 0 && !isCalculatingShipping && (
                          <div className="text-sm text-green-600 flex items-center gap-2">
                            ✓ Frete calculado
                          </div>
                        )}
                        {hasPhysicalItems && !cepCalculated && !isFetchingCep && (
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            Informe o CEP para calcular o frete
                          </div>
                        )}
                      </div>
                    </div>
                    {hasPhysicalItems && (
                      <button
                        type="button"
                        onClick={handleManualShippingCalculation}
                        disabled={!canCalculateShipping || isCalculatingShipping}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                      >
                        {isCalculatingShipping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Calculando frete...
                          </>
                        ) : (
                          'Calcular frete'
                        )}
                      </button>
                    )}
                    <input
                      type="text"
                      name="address"
                      placeholder="Endereço *"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="neighborhood"
                      placeholder="Bairro *"
                      value={formData.neighborhood}
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
                  {hasPhysicalItems && (
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        disabled={isSavingAddress}
                        className="w-full md:w-auto bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSavingAddress ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando endereço...
                          </>
                        ) : (
                          'Salvar endereço'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {hasPhysicalItems && isAuthenticated && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Endereços Salvos</h2>
                    <button
                      type="button"
                      onClick={() => fetchSavedAddresses()}
                      disabled={isLoadingAddresses}
                      className="text-sm font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
                    >
                      {isLoadingAddresses ? 'Atualizando...' : 'Atualizar lista'}
                    </button>
                  </div>
                  {isLoadingAddresses ? (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando endereços...
                    </p>
                  ) : physicalSavedAddresses.length === 0 ? (
                    <p className="text-sm text-gray-500">Você ainda não possui endereços salvos.</p>
                  ) : (
                    <div className="space-y-3">
                      {physicalSavedAddresses.map((address) => (
                        <label
                          key={address.uid}
                          className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedAddressUid === address.uid
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            className="mt-1"
                            checked={selectedAddressUid === address.uid}
                            onChange={() => handleSelectSavedAddress(address)}
                          />
                          <div>
                            <div className="flex items-center gap-2 font-semibold text-gray-900">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span>
                                {address.street}, {address.street_number ?? 's/n'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.neighborhood} - {address.city}/{address.state_code ?? 'NA'}
                            </p>
                            <p className="text-xs text-gray-500">CEP: {formatCepValue(address.zip_code)}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Options */}
              {hasPhysicalItems && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Opções de Entrega</h2>
                  {lastCalculatedCep && (
                    <p className="text-xs text-gray-500 mb-3">
                      Valores calculados para o CEP {formatCepValue(lastCalculatedCep)}
                    </p>
                  )}
                  {isCalculatingShipping && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculando opções de entrega...
                    </div>
                  )}
                  {!isCalculatingShipping && shippingOptions.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Informe um CEP válido e clique em "Calcular frete" para visualizar as opções disponíveis.
                    </p>
                  )}
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedShipping(option.id)}
                        disabled={isCalculatingShipping}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                          selectedShipping === option.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isCalculatingShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
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

              {!hasPhysicalItems && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    📥 Seu pedido contém apenas e-books. Os arquivos serão enviados assim que o pagamento for confirmado.
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
