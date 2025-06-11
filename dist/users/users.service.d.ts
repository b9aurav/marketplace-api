import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { CreateAddressDto } from './dto/create-address.dto';
export declare class UsersService {
    private usersRepository;
    private addressRepository;
    constructor(usersRepository: Repository<User>, addressRepository: Repository<Address>);
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    create(registerDto: RegisterDto): Promise<User>;
    updatePassword(userId: string, newPassword: string): Promise<void>;
    addAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address>;
}
