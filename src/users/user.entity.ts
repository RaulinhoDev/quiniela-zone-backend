import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER  = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password_hash: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ default: 'HN' })
  country: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  is_premium: boolean;

  @Column({ nullable: true })
  avatar_url: string;

  // Stripe
  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column({ nullable: true })
  stripe_subscription_id: string;

  // Verificación de email
  @Column({ default: false })
  is_verified: boolean;

  @Column({ nullable: true })
  @Exclude()
  verification_token: string;

  @Column({ nullable: true, type: 'datetime' })
  verification_expires: Date;

  // Reset de contraseña
  @Column({ nullable: true })
  @Exclude()
  reset_password_token: string;

  @Column({ nullable: true, type: 'datetime' })
  reset_password_expires: Date;

  // Refresh token
  @Column({ nullable: true })
  @Exclude()
  refresh_token: string;

  @Column({ nullable: true, type: 'datetime' })
  refresh_token_expires: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
