import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateAddressDto } from './dto/create-address.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findOne: jest.fn(),
    addAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        addresses: [],
      };

      const mockRequest = {
        user: { id: '1' },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('addAddress', () => {
    it('should add address to user profile', async () => {
      const mockRequest = {
        user: { id: '1' },
      };

      const createAddressDto: CreateAddressDto = {
        label: 'Home',
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zip: '12345',
        is_default: true,
      };

      const mockAddress = {
        id: '1',
        ...createAddressDto,
        user_id: '1',
      };

      mockUsersService.addAddress.mockResolvedValue(mockAddress);

      const result = await controller.addAddress(mockRequest, createAddressDto);

      expect(result).toEqual(mockAddress);
      expect(mockUsersService.addAddress).toHaveBeenCalledWith('1', createAddressDto);
    });
  });
}); 