import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async addAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    const user = await this.findOne(userId);
    
    // If this is a default address, unset any existing default
    if (createAddressDto.is_default) {
      await this.addressRepository.update(
        { user_id: userId, is_default: true },
        { is_default: false },
      );
    }
    
    // Create new address
    const address = this.addressRepository.create({
      ...createAddressDto,
      user_id: userId,
    });
    
    return this.addressRepository.save(address);
  }
}