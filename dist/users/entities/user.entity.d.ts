import { Address } from './address.entity';
import { Role } from '../../common/decorators/roles.decorator';
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    role: Role;
    addresses: Address[];
    created_at: Date;
    updated_at: Date;
}
