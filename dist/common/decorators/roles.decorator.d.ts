export declare enum Role {
    USER = "user",
    ADMIN = "admin"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
