import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { Address } from "./entities/address.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateAddressDto } from "./dto/create-address.dto";
import { NotFoundException } from "@nestjs/common";

describe("UsersService", () => {
  let service: UsersService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAddressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findOne", () => {
    it("should return a user when found", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        addresses: [],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne("1");

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
        relations: ["addresses"],
      });
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByEmail", () => {
    it("should return a user when found by email", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should return null when user not found by email", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and return a new user", async () => {
      const createUserDto: CreateUserDto = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        phone: "1234567890",
      };

      const mockUser = {
        ...createUserDto,
        role: "user",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("addAddress", () => {
    it("should add a new address to user", async () => {
      const userId = "1";
      const createAddressDto: CreateAddressDto = {
        label: "Home",
        street: "123 Main St",
        city: "Test City",
        state: "Test State",
        zip: "12345",
        is_default: true,
      };

      const mockUser = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
      };

      const mockAddress = {
        id: "1",
        ...createAddressDto,
        user_id: userId,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAddressRepository.create.mockReturnValue(mockAddress);
      mockAddressRepository.save.mockResolvedValue(mockAddress);

      const result = await service.addAddress(userId, createAddressDto);

      expect(result).toEqual(mockAddress);
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        { user_id: userId, is_default: true },
        { is_default: false },
      );
      expect(mockAddressRepository.create).toHaveBeenCalledWith({
        ...createAddressDto,
        user_id: userId,
      });
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const createAddressDto: CreateAddressDto = {
        label: "Home",
        street: "123 Main St",
        city: "Test City",
        state: "Test State",
        zip: "12345",
        is_default: true,
      };

      await expect(service.addAddress("1", createAddressDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
