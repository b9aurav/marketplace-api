import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '+1234567890',
    };

    const expectedResponse = {
      message: 'Registration successful',
      user: {
        id: 'user-id',
        email: registerDto.email,
        name: registerDto.name,
      },
    };

    it('should register a new user', async () => {
      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const expectedResponse = {
      message: 'Login successful',
      token: 'access-token',
      user: {
        id: 'user-id',
        email: loginDto.email,
        name: 'Test User',
      },
    };

    it('should login user', async () => {
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      role: 'user',
    };

    const mockRequest = {
      user: {
        id: 'user-id',
      },
    };

    it('should return user profile', async () => {
      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    const expectedResponse = {
      message: 'If your email is registered, you will receive a password reset link',
    };

    it('should send password reset email', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'Password reset email sent',
      });

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto.email);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'reset-token',
      new_password: 'newpassword123',
    };

    const expectedResponse = {
      message: 'Password has been reset successfully',
    };

    it('should reset password', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });
}); 