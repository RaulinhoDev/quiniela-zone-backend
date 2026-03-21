import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../users/user.entity';
export declare class AuthService {
    private userRepo;
    private jwtService;
    constructor(userRepo: Repository<User>, jwtService: JwtService);
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
        };
    }>;
    validateUser(id: number): Promise<User>;
    private token;
}
