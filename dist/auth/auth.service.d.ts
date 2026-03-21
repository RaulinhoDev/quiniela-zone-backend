import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/user.entity';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private userRepo;
    private jwtService;
    private configService;
    private emailService;
    constructor(userRepo: Repository<User>, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(dto: {
        email: string;
        username: string;
        password: string;
        full_name?: string;
        country?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
        };
    } | {
        message: string;
        email: string;
    }>;
    verifyEmail(token: string): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
        };
    }>;
    login(dto: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
        };
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    updateProfile(userId: number, dto: {
        full_name?: string;
        country?: string;
    }): Promise<User>;
    validateUser(id: number): Promise<User>;
    private token;
}
