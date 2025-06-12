import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase/supabase.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let supabaseService: SupabaseService;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSupabaseService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    getUser: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '+1234567890',
    };

    const mockSupabaseUser = {
      id: 'user-id',
      email: 'test@example.com',
    };

    const mockSession = {
      access_token: 'access-token',
    };

    it('should register a new user successfully', async () => {
      mockSupabaseService.signUp.mockResolvedValue({
        user: mockSupabaseUser,
        session: mockSession,
      });

      mockUsersService.create.mockResolvedValue({
        id: mockSupabaseUser.id,
        email: registerDto.email,
        name: registerDto.name,
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'Registration successful',
        user: {
          id: mockSupabaseUser.id,
          email: registerDto.email,
          name: registerDto.name,
        },
      });

      expect(mockSupabaseService.signUp).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );

      expect(mockUsersService.create).toHaveBeenCalledWith({
        id: mockSupabaseUser.id,
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phone,
      });
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockSupabaseService.signUp.mockRejectedValue({
        message: 'User already registered',
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw UnauthorizedException if registration fails', async () => {
      mockSupabaseService.signUp.mockRejectedValue(new Error('Registration failed'));

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockSupabaseUser = {
      id: 'user-id',
      email: 'test@example.com',
    };

    const mockSession = {
      access_token: 'access-token',
    };

    const mockDbUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should login user successfully', async () => {
      mockSupabaseService.signIn.mockResolvedValue({
        user: mockSupabaseUser,
        session: mockSession,
      });

      mockUsersService.findOne.mockResolvedValue(mockDbUser);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        message: 'Login successful',
        access_token: mockSession.access_token,
        user: {
          id: mockDbUser.id,
          email: mockDbUser.email,
          name: mockDbUser.name,
        },
      });

      expect(mockSupabaseService.signIn).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockSupabaseUser.id);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockSupabaseService.signIn.mockRejectedValue({
        message: 'Invalid login credentials',
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found in database', async () => {
      mockSupabaseService.signIn.mockResolvedValue({
        user: mockSupabaseUser,
        session: mockSession,
      });

      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      role: 'user',
    };

    it('should return user profile', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    const email = 'test@example.com';

    it('should send password reset email', async () => {
      mockSupabaseService.resetPassword.mockResolvedValue(undefined);

      const result = await service.forgotPassword(email);

      expect(result).toEqual({
        message: 'Password reset email sent',
      });

      expect(mockSupabaseService.resetPassword).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException if reset fails', async () => {
      mockSupabaseService.resetPassword.mockRejectedValue(new Error('Reset failed'));

      await expect(service.forgotPassword(email)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'reset-token',
      new_password: 'newpassword123',
    };

    it('should reset password successfully', async () => {
      mockSupabaseService.updatePassword.mockResolvedValue(undefined);

      await expect(service.resetPassword(resetPasswordDto)).resolves.not.toThrow();
      expect(mockSupabaseService.updatePassword).toHaveBeenCalledWith(resetPasswordDto.new_password);
    });

    it('should throw UnauthorizedException if reset fails', async () => {
      mockSupabaseService.updatePassword.mockRejectedValue(new Error('Reset failed'));

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 