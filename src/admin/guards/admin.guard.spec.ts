import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminGuard } from './admin.guard';
import { Role } from '../../common/decorators/roles.decorator';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for admin users', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: Role.ADMIN },
        }),
      }),
    } as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should deny access for non-admin users', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: Role.USER },
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not authenticated', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
  });
});