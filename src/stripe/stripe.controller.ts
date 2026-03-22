import {
  Controller, Post, Req, Headers,
  UseGuards, Request, HttpCode, RawBodyRequest
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { StripeService } from './stripe.service';
import { User } from '../users/user.entity';
import { BadRequestException } from '@nestjs/common';

@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  async checkout(@Request() req) {
    const user = await this.userRepo.findOne({ where: { id: req.user.id } });
    const url  = await this.stripeService.createCheckoutSession(user.id, user.email);
    return { url };
  }

  @Post('portal')
  @UseGuards(AuthGuard('jwt'))
  async portal(@Request() req) {
    const user = await this.userRepo.findOne({ where: { id: req.user.id } });
    if (!user.stripe_customer_id) {
      throw new BadRequestException('No tenés una suscripción activa');
    }
    const url = await this.stripeService.createPortalSession(user.stripe_customer_id);
    return { url };
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: any;
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

    if (webhookSecret) {
      try {
        event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
      } catch (err) {
        return { error: `Webhook error: ${err.message}` };
      }
    } else {
      // Desarrollo sin webhook secret — usar el body directamente
      event = req.body;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session  = event.data.object;
        const userId   = parseInt(session.metadata?.userId);
        const customer = session.customer;
        if (userId && customer) {
          await this.userRepo.update(userId, {
            is_premium:         true,
            stripe_customer_id: customer,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer     = subscription.customer;
        const user = await this.userRepo.findOne({
          where: { stripe_customer_id: customer }
        });
        if (user) {
          await this.userRepo.update(user.id, { is_premium: false });
        }
        break;
      }
    }

    return { received: true };
  }
}
