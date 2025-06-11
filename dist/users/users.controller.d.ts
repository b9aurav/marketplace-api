import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<import("./entities/user.entity").User>;
    addAddress(req: any, createAddressDto: CreateAddressDto): Promise<import("./entities/address.entity").Address>;
}
