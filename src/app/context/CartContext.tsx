import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, Product, Cart as ApiCart } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product?: Product;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<{ [key: number]: Product }>({});

  // Load cart from API when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, user]);

  const loadCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const cart = await api.getCart(user.uid);
      setItems(cart.items || []);

      // Load product details for cart items
      if (cart.items && cart.items.length > 0) {
        const allProducts = await api.getProducts();
        const productsMap: { [key: number]: Product } = {};
        allProducts.forEach((p) => {
          productsMap[p.id] = p;
        });
        setProducts(productsMap);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // Don't show error toast on initial load
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!user) {
      toast.error('Faça login para adicionar produtos ao carrinho');
      return;
    }

    try {
      setLoading(true);
      const cart = await api.addToCart(user.uid, product.id, quantity);
      setItems(cart.items || []);
      setProducts((prev) => ({ ...prev, [product.id]: product }));
      toast.success('Produto adicionado ao carrinho!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Erro ao adicionar produto ao carrinho');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!user) return;

    try {
      setLoading(true);
      await api.removeCartItem(user.uid, itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success('Produto removido do carrinho');
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast.error(error.message || 'Erro ao remover produto do carrinho');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      setLoading(true);
      const cart = await api.updateCartItem(user.uid, itemId, quantity);
      setItems(cart.items || []);
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error(error.message || 'Erro ao atualizar quantidade');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await api.clearCart(user.uid);
      setItems([]);
      toast.success('Carrinho limpo');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error(error.message || 'Erro ao limpar carrinho');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const product = products[item.product_id];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
