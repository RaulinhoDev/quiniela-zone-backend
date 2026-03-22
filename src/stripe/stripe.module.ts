import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { User } from '../users/user.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([User]), ConfigModule],
  providers:   [StripeService],
  controllers: [StripeController],
  exports:     [StripeService],
})
export class StripeModule {}
