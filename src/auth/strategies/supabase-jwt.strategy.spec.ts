import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import { UsersService } from '../../users/users.service';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';
import { Role } from '../../common/decorators/roles.decorator';

describe('SupabaseJwtStrategy', () => {
  let strategy: SupabaseJwtStrategy;
  let supabaseService: SupabaseService;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'SUPABASE_URL':
          return 'https://test.supabase.co';
        case 'SUPABASE_JWT_SECRET':
          return 'test-jwt-secret';
        default:
          return null;
      }
    }),
  };

  const mockSupabaseService = {
    getPublicKey: jest.fn().mockResolvedValue({
      data: {
        publicKey: 'test-public-key',
      },
    }),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseJwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<SupabaseJwtStrategy>(SupabaseJwtStrategy);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from database', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        role: Role.USER,
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        role: Role.USER,
      });
      expect(usersService.findOne).toHaveBeenCalledWith('user-id');
    });

    it('should return admin user with admin role', async () => {
      const payload = {
        sub: 'admin-id',
        email: 'admin@example.com',
      };

      const mockAdminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.ADMIN,
      };

      mockUsersService.findOne.mockResolvedValue(mockAdminUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.ADMIN,
      });
      expect(usersService.findOne).toHaveBeenCalledWith('admin-id');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = {
        sub: 'non-existent-user',
        email: 'test@example.com',
      };

      mockUsersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token or user not found');
      expect(usersService.findOne).toHaveBeenCalledWith('non-existent-user');
    });
  });
}); 