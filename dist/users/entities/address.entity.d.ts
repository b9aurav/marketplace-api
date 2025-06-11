import { User } from './user.entity';
export declare class Address {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    is_default: boolean;
    user: User;
    user_id: string;
}
