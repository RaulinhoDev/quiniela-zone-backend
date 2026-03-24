import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2026-02-25.clover',
    });
  }

  // Crear sesión de checkout para suscripción Premium
  async createCheckoutSession(userId: number, email: string): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'subscription',
      customer_email:        email,
      line_items: [
        {
          price:    this.config.get('STRIPE_PRICE_ID') ?? '',
          quantity: 1,
        },
      ],
      metadata: { userId: String(userId) },
      success_url: `${this.config.get('APP_URL') ?? ''}/app/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${this.config.get('APP_URL') ?? ''}/app/premium/cancel`,
    });
    return session.url ?? '';
  }

  // Crear portal de cliente para gestionar suscripción
  async createPortalSession(customerId: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${this.config.get('APP_URL')}/app/perfil`,
    });
    return session.url;
  }

  // Verificar evento webhook de Stripe
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET') ?? '',
    );
  }

  // Obtener suscripción activa de un customer
  async getActiveSubscription(customerId: string): Promise<Stripe.Subscription | null> {
    const subs = await this.stripe.subscriptions.list({
      customer: customerId,
      status:   'active',
      limit:    1,
    });
    return subs.data[0] || null;
  }
}
