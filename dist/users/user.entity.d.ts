export declare enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}
export declare class User {
    id: number;
    email: string;
    username: string;
    password_hash: string;
    full_name: string;
    country: string;
    role: UserRole;
    is_premium: boolean;
    avatar_url: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    is_verified: boolean;
    verification_token: string;
    verification_expires: Date;
    reset_password_token: string;
    reset_password_expires: Date;
    refresh_token: string;
    refresh_token_expires: Date;
    created_at: Date;
    updated_at: Date;
}
