import emailjs from '@emailjs/browser';
import type { OrderStatus } from './types';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: 'Aguardando pagamento',
  payment_confirmed: 'Pagamento confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

interface SendOrderStatusEmailParams {
  toEmail: string;
  status: OrderStatus;
  orderNumber?: string;
}

export async function sendOrderStatusEmail({ toEmail, status, orderNumber }: SendOrderStatusEmailParams) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS environment variables are not configured. Skipping email send.');
    return;
  }

  const statusLabel = ORDER_STATUS_LABELS[status] ?? status;

  const templateParams = {
    to_email: toEmail,
    order_status: statusLabel,
    order_number: orderNumber ?? '',
  } as Record<string, unknown>;

  await emailjs.send(serviceId, templateId, templateParams, { publicKey });
}
