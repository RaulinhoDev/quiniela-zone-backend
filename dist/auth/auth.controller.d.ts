import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class AuthController {
    private authService;
    private userRepo;
    constructor(authService: AuthService, userRepo: Repository<User>);
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
            role: import("../users/user.entity").UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    } | {
        message: string;
        email: string;
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
            role: import("../users/user.entity").UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    }>;
    verifyEmail(token: string): Promise<{
        refresh_token: string;
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: import("../users/user.entity").UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    }>;
    forgotPassword(dto: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(dto: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    changePassword(req: {
        user: {
            id: number;
        };
    }, dto: {
        current_password: string;
        new_password: string;
    }): Promise<{
        message: string;
    }>;
    updateProfile(req: {
        user: {
            id: number;
        };
    }, dto: {
        full_name?: string;
        country?: string;
    }): Promise<User | null>;
    me(req: {
        user: {
            id: number;
        };
    }): Promise<any>;
    refresh(dto: {
        refresh_token: string;
    }): Promise<{
        refresh_token: string;
        access_token: string;
        user: {
            id: number;
            email: string;
            username: string;
            role: import("../users/user.entity").UserRole;
            country: string;
            full_name: string;
            is_verified: boolean;
            is_premium: boolean;
        };
    }>;
    logout(req: {
        user: {
            id: number;
        };
    }): Promise<void>;
}
