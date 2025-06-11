import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { CreateAddressDto } from './dto/create-address.dto';

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
    
    delete user.password;
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const { email, password, name, phone } = registerDto;
    
    // Check if user exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });
    
    return this.usersRepository.save(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findOne(userId);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user
    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });
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