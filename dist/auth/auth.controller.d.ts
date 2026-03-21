import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
            role: import("../users/user.entity").UserRole;
            country: string;
            full_name: string;
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
            role: import("../users/user.entity").UserRole;
            country: string;
            full_name: string;
        };
    }>;
}
