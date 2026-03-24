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
    private readonly logger;
    constructor(userRepo: Repository<User>, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(dto: {
        email: string;
        username: string;
        password: string;
        full_name?: string;
        country?: string;
    }): Promise<{
        refresh_token: string;
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    } | {
        message: string;
        email: string;
    }>;
    verifyEmail(token: string): Promise<{
        refresh_token: string;
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    }>;
    login(dto: {
        email: string;
        password: string;
    }): Promise<{
        refresh_token: string;
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
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
    }): Promise<User | null>;
    validateUser(id: number): Promise<User | null>;
    refreshToken(refreshToken: string): Promise<{
        refresh_token: string;
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    }>;
    revokeRefreshToken(userId: number): Promise<void>;
    private tokenWithRefresh;
    private token;
}
