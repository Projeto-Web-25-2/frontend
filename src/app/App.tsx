import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { orderService, type OrderStatus } from './services';

const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'awaiting_payment',
  'payment_confirmed',
  'shipped',
  'delivered',
];

function MockOrderStatusManager() {
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (!user || !accessToken) return;

    const lastOrderIdStr = sessionStorage.getItem('lastOrderId');
    if (!lastOrderIdStr) return;

    const orderId = Number(lastOrderIdStr);
    if (!Number.isFinite(orderId)) return;

    let statusIndex = Number(sessionStorage.getItem('lastOrderStatusIndex') ?? '0');
    if (!Number.isFinite(statusIndex) || statusIndex < 0) {
      statusIndex = 0;
    }

    if (statusIndex >= ORDER_STATUS_SEQUENCE.length - 1) {
      sessionStorage.removeItem('lastOrderId');
      sessionStorage.removeItem('lastOrderStatusIndex');
      return;
    }

    const intervalId = window.setInterval(async () => {
      if (!user || !accessToken) {
        window.clearInterval(intervalId);
        return;
      }

      if (statusIndex >= ORDER_STATUS_SEQUENCE.length - 1) {
        window.clearInterval(intervalId);
        sessionStorage.removeItem('lastOrderId');
        sessionStorage.removeItem('lastOrderStatusIndex');
        return;
      }

      statusIndex += 1;
      const nextStatus = ORDER_STATUS_SEQUENCE[statusIndex];

      try {
        await orderService.update(user.uid, orderId, { status: nextStatus }, accessToken);
        sessionStorage.setItem('lastOrderStatusIndex', String(statusIndex));
      } catch (error) {
        console.error('Erro ao atualizar status do pedido (mock)', error);
      }
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, accessToken]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MockOrderStatusManager />
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors />
      </CartProvider>
    </AuthProvider>
  );
}