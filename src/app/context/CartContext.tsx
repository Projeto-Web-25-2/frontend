import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { cartService, productService, type CartResponse } from '../services';
import { mapProductResponseToProduct } from '../utils/productMapper';

interface CartItem extends Product {
  quantity: number;
  cartItemId: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const buildCartItems = async (
  cart: CartResponse,
  accessToken: string
): Promise<CartItem[]> => {
  const detailedItems = await Promise.all(
    cart.items.map(async (item) => {
      const productResponse = await productService.getById(item.product_id, accessToken);
      const product = mapProductResponseToProduct(productResponse);
      return {
        ...product,
        quantity: item.quantity,
        cartItemId: item.id,
      };
    })
  );

  return detailedItems;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, accessToken } = useAuth();

  const hydrateCart = useCallback(
    async (cart: CartResponse) => {
      if (!accessToken) return;
      const detailedItems = await buildCartItems(cart, accessToken);
      setItems(detailedItems);
    },
    [accessToken]
  );

  const refreshCart = useCallback(async () => {
    if (!user || !accessToken) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const cart = await cartService.get(user.uid, accessToken);
      await hydrateCart(cart);
    } catch (error) {
      console.error('Erro ao carregar carrinho', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken, hydrateCart]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      if (!user || !accessToken) {
        throw new Error('É necessário estar autenticado para adicionar itens ao carrinho.');
      }

      const payload = {
        product_id: Number(product.id),
        quantity,
      };

      const updatedCart = await cartService.addItem(user.uid, payload, accessToken);
      await hydrateCart(updatedCart);
    },
    [user, accessToken, hydrateCart]
  );

  const removeFromCart = useCallback(
    async (cartItemId: number) => {
      if (!user || !accessToken) return;
      await cartService.deleteItem(user.uid, cartItemId, accessToken);
      await refreshCart();
    },
    [user, accessToken, refreshCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      if (!user || !accessToken) return;
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      const updatedCart = await cartService.updateItem(
        user.uid,
        cartItemId,
        { quantity },
        accessToken
      );
      await hydrateCart(updatedCart);
    },
    [user, accessToken, hydrateCart, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    if (!user || !accessToken) return;
    const emptyCart = await cartService.clear(user.uid, accessToken);
    await hydrateCart(emptyCart);
  }, [user, accessToken, hydrateCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
