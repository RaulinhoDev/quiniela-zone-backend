import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersController {
    private userRepo;
    constructor(userRepo: Repository<User>);
    findAll(page?: number, limit?: number, search?: string, role?: string): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
