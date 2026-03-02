import { useCallback, useEffect } from 'react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { mercadoPagoService } from '../services';

const PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY as string | undefined;

interface CreateMercadoPagoCheckoutOptions {
  testeId: string;
  userEmail?: string;
}

export function useMercadoPago() {
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!PUBLIC_KEY) {
      console.warn('VITE_MERCADO_PAGO_PUBLIC_KEY não configurada. Pagamentos desabilitados.');
      return;
    }
    initMercadoPago(PUBLIC_KEY);
  }, []);

  const createMercadoPagoCheckout = useCallback(
    async ({ testeId, userEmail }: CreateMercadoPagoCheckoutOptions) => {
      if (!PUBLIC_KEY) {
        toast.error('Pagamento indisponível: chave do Mercado Pago não configurada.');
        return;
      }

      if (!accessToken) {
        toast.error('Faça login para realizar o pagamento.');
        return;
      }

      try {
        const response = await mercadoPagoService.createCheckout(
          {
            testeId,
            userEmail,
          },
          accessToken
        );

        if (!response?.initPoint) {
          throw new Error('URL de pagamento não retornada pelo servidor.');
        }

        window.location.href = response.initPoint;
      } catch (error) {
        console.error('Erro ao iniciar checkout do Mercado Pago', error);
        toast.error('Não foi possível iniciar o pagamento. Tente novamente.');
        throw error;
      }
    },
    [accessToken]
  );

  return { createMercadoPagoCheckout };
}
