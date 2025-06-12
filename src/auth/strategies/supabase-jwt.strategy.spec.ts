import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

describe('SupabaseJwtStrategy', () => {
  let strategy: SupabaseJwtStrategy;
  let supabaseService: SupabaseService;

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
      ],
    }).compile();

    strategy = module.get<SupabaseJwtStrategy>(SupabaseJwtStrategy);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from payload', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'user',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('should use default role if not provided', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
      });
    });
  });
}); 